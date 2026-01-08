"""Orchestrator service for executing agent simulations"""
import asyncio
import time
from typing import AsyncGenerator, Optional
from openai import AsyncOpenAI

from ..models import (
    AgentNodeData, AgentEdge, InputNodeData, Topology,
    SimulationResult, TokenUsage
)
from .prompt_builder import build_prompt, get_relationship_prefix, IncomingContext


def topological_sort(nodes: list[AgentNodeData], edges: list[AgentEdge]) -> list[list[str]]:
    """
    Perform topological sort on the graph to determine execution order.
    Returns array of phases, where each phase contains node IDs that can run in parallel.
    """
    node_ids = {n.id for n in nodes}
    in_degree: dict[str, int] = {id: 0 for id in node_ids}
    adjacency: dict[str, list[str]] = {id: [] for id in node_ids}

    # Build adjacency and in-degree
    for edge in edges:
        if edge.source in node_ids and edge.target in node_ids:
            adjacency[edge.source].append(edge.target)
            in_degree[edge.target] += 1

    phases: list[list[str]] = []
    remaining = set(node_ids)

    while remaining:
        # Find all nodes with in-degree 0
        phase = [id for id in remaining if in_degree[id] == 0]

        if not phase:
            # Cycle detected - just run remaining nodes
            phases.append(list(remaining))
            break

        phases.append(phase)

        # Remove nodes from this phase and update in-degrees
        for id in phase:
            remaining.discard(id)
            for neighbor in adjacency[id]:
                in_degree[neighbor] -= 1

    return phases


def get_incoming_context(
    node_id: str,
    edges: list[AgentEdge],
    outputs: dict[str, SimulationResult],
    nodes: list[AgentNodeData]
) -> list[IncomingContext]:
    """Get incoming edges for a node with their source outputs"""
    incoming = [e for e in edges if e.target == node_id]
    contexts = []

    for edge in incoming:
        source_node = next((n for n in nodes if n.id == edge.source), None)
        source_output = outputs.get(edge.source)

        if source_output and source_output.output:
            contexts.append(IncomingContext(
                source_id=edge.source,
                source_name=source_node.name if source_node else edge.source,
                relationship_type=edge.relationship_type,
                output=source_output.output
            ))

    return contexts


async def execute_simulation_stream(
    topology: Topology,
    api_key: str,
    api_endpoint: Optional[str] = None
) -> AsyncGenerator[dict, None]:
    """
    Execute simulation for the given topology (streaming version).
    Yields events as each phase/node completes.
    """
    nodes = topology.nodes
    edges = topology.edges
    input_nodes = topology.input_nodes or []

    # Configure OpenAI client with optional custom endpoint
    client_kwargs = {"api_key": api_key}
    if api_endpoint and api_endpoint != "https://api.openai.com":
        client_kwargs["base_url"] = f"{api_endpoint}/v1"

    client = AsyncOpenAI(**client_kwargs)

    # Extract master task from input nodes (combine all if multiple)
    master_task = "\n\n".join(
        n.task.strip() for n in input_nodes if n.task and n.task.strip()
    )

    # Find which agent nodes are connected to input nodes
    input_node_ids = {n.id for n in input_nodes}
    input_connected_node_ids = {
        e.target for e in edges if e.source in input_node_ids
    }

    # Get execution order (only for agent nodes)
    phases = topological_sort(nodes, edges)

    # Store outputs
    results: dict[str, SimulationResult] = {}

    # Execute each phase
    for phase_index, phase in enumerate(phases):
        # Emit phase start event
        yield {"type": "phase-start", "phase": phase_index, "nodeIds": phase}

        # Run all nodes in this phase in parallel
        async def execute_node(node_id: str) -> dict:
            node = next((n for n in nodes if n.id == node_id), None)
            if not node:
                return {"nodeId": node_id, "result": None, "error": None}

            start_time = time.time()

            try:
                # Get context from upstream agent nodes
                incoming_context = get_incoming_context(node_id, edges, results, nodes)

                # Build the prompt
                system_prompt = build_prompt(node, incoming_context)

                # Determine temperature (higher for rogue agents)
                temperature = node.temperature
                if node.rogue_mode.enabled:
                    temperature = min(temperature + 0.3, 1.5)

                # Build messages
                messages = [{"role": "system", "content": system_prompt}]

                # Build user message with master task and/or agent context
                user_content = ""

                # If this node is connected to an input node, include the master task
                if master_task and node_id in input_connected_node_ids:
                    user_content += f"## Master Task\n\n{master_task}\n\n"

                # Add context from upstream agent nodes
                if incoming_context:
                    context_parts = []
                    for ctx in incoming_context:
                        prefix = get_relationship_prefix(ctx.relationship_type, ctx.source_name)
                        context_parts.append(f"{prefix}\n\n{ctx.output}")
                    context_message = "\n\n---\n\n".join(context_parts)
                    user_content += f"## Input from Other Agents\n\n{context_message}\n\n"

                # Add the final instruction
                if user_content:
                    user_content += "Please provide your analysis and response based on the above."
                    messages.append({"role": "user", "content": user_content})
                elif master_task:
                    # No direct connection to input, but master task exists
                    messages.append({
                        "role": "user",
                        "content": f"## Task Context\n\n{master_task}\n\nPlease provide your initial analysis and response based on your role."
                    })
                else:
                    messages.append({
                        "role": "user",
                        "content": "Please provide your initial analysis and response based on your role."
                    })

                # Call OpenAI
                # Use max_completion_tokens for newer models
                is_new_model = any(node.model.startswith(p) for p in ("o1", "o3", "gpt-4.5", "gpt-5"))

                completion_params = {
                    "model": node.model,
                    "messages": messages,
                }

                if is_new_model:
                    completion_params["max_completion_tokens"] = 2000
                else:
                    completion_params["max_tokens"] = 2000
                    completion_params["temperature"] = temperature

                response = await client.chat.completions.create(**completion_params)

                duration = int((time.time() - start_time) * 1000)

                result = SimulationResult(
                    output=response.choices[0].message.content or "",
                    model=node.model,
                    tokens=TokenUsage(
                        prompt=response.usage.prompt_tokens if response.usage else 0,
                        completion=response.usage.completion_tokens if response.usage else 0
                    ),
                    duration=duration
                )

                results[node_id] = result
                return {"nodeId": node_id, "result": result, "error": None}

            except Exception as e:
                duration = int((time.time() - start_time) * 1000)
                result = SimulationResult(
                    output="",
                    model=node.model,
                    tokens=TokenUsage(prompt=0, completion=0),
                    duration=duration,
                    error=str(e)
                )
                results[node_id] = result
                return {"nodeId": node_id, "result": result, "error": str(e)}

        # Execute all nodes in parallel
        tasks = [execute_node(node_id) for node_id in phase]
        phase_results = await asyncio.gather(*tasks)

        # Emit node completion events
        for result in phase_results:
            if result["result"]:
                if result["error"]:
                    yield {
                        "type": "node-error",
                        "nodeId": result["nodeId"],
                        "error": result["error"],
                        "result": result["result"].model_dump(by_alias=True)
                    }
                else:
                    yield {
                        "type": "node-complete",
                        "nodeId": result["nodeId"],
                        "result": result["result"].model_dump(by_alias=True)
                    }

    # Emit completion event
    yield {
        "type": "complete",
        "results": {k: v.model_dump(by_alias=True) for k, v in results.items()},
        "executionOrder": phases,
        "masterTask": master_task or None
    }


async def execute_simulation(
    topology: Topology,
    api_key: str,
    api_endpoint: Optional[str] = None
) -> dict:
    """
    Execute simulation for the given topology (non-streaming, for backward compatibility).
    """
    final_result = None

    async for event in execute_simulation_stream(topology, api_key, api_endpoint):
        if event["type"] == "complete":
            final_result = {
                "success": True,
                "results": event["results"],
                "executionOrder": event["executionOrder"],
                "masterTask": event["masterTask"]
            }

    return final_result or {"success": False, "error": "No results", "results": {}}
