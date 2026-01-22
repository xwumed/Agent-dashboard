"""Orchestrator service for executing agent simulations"""
import asyncio
import time
from typing import AsyncGenerator, Optional
from openai import AsyncOpenAI
import json
from pathlib import Path

# openai-agents SDK imports
try:
    from agents import Agent, Runner, ModelSettings, OpenAIChatCompletionsModel, ItemHelpers
    AGENTS_SDK_AVAILABLE = True
except ImportError:
    AGENTS_SDK_AVAILABLE = False

from ..models import (
    AgentNodeData, AgentEdge, InputNodeData, Topology,
    SimulationResult, TokenUsage, EndpointConfig
)
from .prompt_builder import build_prompt, get_relationship_prefix, IncomingContext
from ..tools.tool_wrappers import get_tools_for_node


def save_output_file(input_path: str, topology: Topology, results: dict, actual_input_file: str | None = None) -> str | None:
    """Save aggregated output to a _output.json file in result subfolder. Returns output path if successful.
    
    Args:
        input_path: The input path (file or folder)
        topology: The topology object
        results: The simulation results
        actual_input_file: If input_path is a folder, this is the actual file being processed
    """
    try:
        from pathlib import Path
        import json
        
        input_p = Path(input_path)
        if not input_p.exists():
            return None
        
        # Determine the base directory and output filename
        if input_p.is_file():
            base_dir = input_p.parent
            output_name = input_p.stem + "_output.json"
        else:
            # Folder mode
            base_dir = input_p
            if actual_input_file:
                # Use the actual file name being processed
                output_name = Path(actual_input_file).stem + "_output.json"
            else:
                # Fallback: use folder name (shouldn't happen in normal flow)
                output_name = input_p.name + "_output.json"
        
        # Create result subfolder based on template name
        # Sanitize topology name for folder safety
        safe_name = "".join(c for c in topology.name if c.isalnum() or c in (' ', '-', '_')).strip()
        if not safe_name:
            safe_name = "default"
        
        result_dir_name = f"{safe_name}_result"
        result_dir = base_dir / result_dir_name
        result_dir.mkdir(exist_ok=True)
        
        # Create output file path
        output_p = result_dir / output_name
        
        # Aggregate output from all output nodes
        aggregated_content = []
        output_nodes = topology.output_nodes or []
        
        # Find edges targeting output nodes
        for out_node in output_nodes:
            incoming_edges = [e for e in topology.edges if e.target == out_node.id]
            for edge in incoming_edges:
                res = results.get(edge.source)
                if res:
                    source_node = next((n for n in topology.nodes if n.id == edge.source), None)
                    source_name = source_node.name if source_node else edge.source
                    # Use model_dump if it's a SimulationResult object, otherwise it's already a dict
                    content = res.output if hasattr(res, 'output') else res.get('output', '')
                    aggregated_content.append(f"## {source_name} Output for {out_node.label}\n\n{content}")
        
        if not aggregated_content:
            # Fallback: just dump all results if no output nodes defined
            final_text = json.dumps(results, indent=2, ensure_ascii=False)
        else:
            final_text = "\n\n---\n\n".join(aggregated_content)
            
        with open(output_p, "w", encoding="utf-8") as f:
            f.write(final_text)
        
        return str(output_p)
            
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to save output file: {e}")
        return None


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
    api_endpoint: Optional[str] = None,
    global_model: Optional[str] = "gpt-5.2",
    global_temperature: Optional[float] = 0.5,
    global_max_tokens: Optional[int] = 16000,
    global_reasoning_effort: Optional[str] = "medium",
    global_thinking: Optional[bool] = False,
    endpoint_configs: Optional[list[EndpointConfig]] = None
) -> AsyncGenerator[dict, None]:
    """
    Execute simulation for the given topology (streaming version).
    Yields events as each phase/node completes.
    """
    nodes = topology.nodes
    edges = topology.edges
    input_nodes = topology.input_nodes or []

    # Helper to get client for a specific model
    def get_client_for_model(model_name: str) -> AsyncOpenAI:
        # 1. Try to find model in endpoint configs
        if endpoint_configs:
            for config in endpoint_configs:
                if model_name in config.models:
                    return AsyncOpenAI(
                        api_key=config.api_key,
                        base_url=config.endpoint
                    )
        
        # 2. Fallback to default provided API key/endpoint
        # If the endpoint is specific to OpenAI, use it. Otherwise assume it acts as a fallback.
        if api_endpoint and "openai.com" not in api_endpoint:
            return AsyncOpenAI(
                api_key=api_key,
                base_url=api_endpoint
            )
        else:
            return AsyncOpenAI(api_key=api_key)

    # Initial client (will be updated per node if needed)
    client = get_client_for_model(global_model or "gpt-4o")

    # ------------------------------------------------------------------
    # Batch/Folder Execution Logic
    # ------------------------------------------------------------------
    folder_nodes = [n for n in input_nodes if n.input_mode == 'folder' and n.input_path]
    execution_queue = []

    if folder_nodes:
        # Use the first folder input to drive batch iteration
        driver_node = folder_nodes[0]
        try:
            p = Path(driver_node.input_path)
            if p.is_dir():
                # List JSON files (and maybe txt?)
                files = sorted(list(p.glob("*.json")))
                for f in files:
                    try:
                        with open(f, "r", encoding="utf-8") as file_obj:
                            content = file_obj.read()
                            # Queue this file
                            execution_queue.append((str(f), {driver_node.id: content}))
                    except Exception as e:
                        print(f"Error reading file {f}: {e}")
        except Exception as e:
            print(f"Error listing files: {e}")
            
    if not execution_queue:
        # Default single run (Text mode or Single File mode)
        # We assume n.task is already set for text mode, or file content loaded for file mode
        execution_queue.append((None, {}))

    accumulated_output_files = []
    final_pass_results = {}
    final_pass_phases = []
    final_pass_master_task = ""

    # Iterate through execution queue
    for current_file, task_overrides in execution_queue:
        # Apply task overrides
        for nid, content in task_overrides.items():
            for n in input_nodes:
                if n.id == nid:
                    n.task = content
                    n.current_file = current_file

        # Extract master task from input nodes (combine all if multiple)
        master_task = "\n\n".join(
            n.task.strip() for n in input_nodes if n.task and n.task.strip()
        )
        final_pass_master_task = master_task

        # Find which agent nodes are connected to input nodes
        input_node_ids = {n.id for n in input_nodes}
        input_connected_node_ids = {
            e.target for e in edges if e.source in input_node_ids
        }

        # Get execution order (only for agent nodes)
        phases = topological_sort(nodes, edges)
        final_pass_phases = phases

        # Store outputs
        results: dict[str, SimulationResult] = {}
        final_pass_results = results

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

                    # Determine temperature - use global setting
                    temperature = global_temperature or 0.5
                    if node.rogue_mode.enabled:
                        temperature = min(temperature + 0.3, 1.5)

                    # Build messages
                    messages = [{"role": "system", "content": system_prompt}]

                    # Build user message with master task and/or agent context
                    user_content = ""

                    # If this node is connected to an input node, include the master task
                    if master_task and node_id in input_connected_node_ids:
                        user_content += f"## Master Task\n\n{master_task}\n\n"

                    # If this node receives context from other agents
                    if incoming_context:
                        user_content += "\n## Context from Upstream Agents\n"
                        for ctx in incoming_context:
                            user_content += f"\n### {ctx.source_node}\n{ctx.content}\n"

                    # Add final instruction
                    if user_content:
                        user_content += "Please provide your analysis and response based on the above."
                        messages.append({"role": "user", "content": user_content})
                    elif master_task:
                         messages.append({
                            "role": "user",
                            "content": f"## Task Context\n\n{master_task}\n\nPlease provide your initial analysis and response based on your role."
                        })
                    else:
                        messages.append({
                            "role": "user", 
                            "content": "Please provide your initial analysis and response based on your role."
                        })

                    # Call OpenAI - use global model only (node.model is deprecated)
                    model_to_use = global_model or "gpt-4o"
                    is_new_model = any(model_to_use.lower().startswith(p.lower()) for p in ("o1", "o3", "gpt-4.5", "gpt-5", "gpt-oss"))

                    # Get correct client for this model
                    client = get_client_for_model(model_to_use)

                    # Check if node has tools configured and SDK is available
                    node_tools = getattr(node, 'tools', []) or []
                    has_tools = len(node_tools) > 0 and AGENTS_SDK_AVAILABLE

                    if has_tools:
                        # Use openai-agents SDK for tool calling
                        tool_ids = [t.id for t in node_tools]
                        tools = get_tools_for_node(tool_ids)
                        
                        if tools:
                            from .runner import Runner
                            from ..models import ModelSettings
                            
                            agent = Runner(
                                client=client,
                                model=model_to_use,
                                system_prompt=system_prompt,
                                messages=messages,
                                model_settings=ModelSettings(
                                    temperature=temperature if not is_new_model else None,
                                    tool_choice="auto",
                                ),
                                tools=tools,
                            )
                            
                            # Build user prompt
                            user_prompt = user_content if user_content else "Please provide your analysis."
                            
                            # Run agent with tools
                            agent_result = await Runner.run(agent, user_prompt)
                            output_text = ItemHelpers.text_message_outputs(agent_result.new_items)
                            
                            # Extract tool calls
                            from ..models import ToolCallInfo
                            from agents import ToolCallItem, ToolCallOutputItem
                            
                            tool_calls = []
                            call_map = {}
                            
                            for item in agent_result.new_items:
                                if isinstance(item, ToolCallItem):
                                    raw = item.raw_item
                                    if hasattr(raw, 'function'):
                                        call_map[raw.id] = {
                                            "tool_name": raw.function.name,
                                            "args": raw.function.arguments,
                                            "result": "Pending..."
                                        }
                                    elif isinstance(raw, dict) and 'function' in raw:
                                         call_map[raw.get('id')] = {
                                            "tool_name": raw['function'].get('name'),
                                            "args": raw['function'].get('arguments'),
                                            "result": "Pending..."
                                        }
                                        
                                elif isinstance(item, ToolCallOutputItem):
                                    raw = item.raw_item
                                    call_id = None
                                    if hasattr(raw, 'call_id'):
                                        call_id = raw.call_id
                                    elif isinstance(raw, dict):
                                        call_id = raw.get('call_id')
                                    
                                    if call_id and call_id in call_map:
                                        output_str = str(raw.output) if hasattr(raw, 'output') else str(raw.get('output'))
                                        call_map[call_id]["result"] = output_str

                            for cid, info in call_map.items():
                                tool_calls.append(ToolCallInfo(
                                    id=cid,
                                    name=info["tool_name"],
                                    arguments=info["args"],
                                    result=info["result"]
                                ))

                            duration = int((time.time() - start_time) * 1000)
                            
                            # Estimate tokens
                            prompt_tokens = len(system_prompt + user_prompt) // 4
                            completion_tokens = len(output_text) // 4
                            
                            result = SimulationResult(
                                output=output_text,
                                model=model_to_use,
                                tokens=TokenUsage(
                                    prompt=prompt_tokens,
                                    completion=completion_tokens
                                ),
                                duration=duration,
                                tool_calls=tool_calls if tool_calls else None
                            )
                            
                            return {"nodeId": node_id, "result": result, "error": None}

                    # Fallback non-tool
                    completion_params = {
                        "model": model_to_use,
                        "messages": messages,
                    }

                    if is_new_model:
                        completion_params["max_completion_tokens"] = global_max_tokens or 16000
                        if global_reasoning_effort:
                            completion_params["reasoning_effort"] = global_reasoning_effort
                    else:
                        completion_params["max_tokens"] = global_max_tokens or 2000
                        completion_params["temperature"] = temperature
                    
                    if "glm" in model_to_use.lower() and global_thinking:
                        completion_params["extra_body"] = {"thinking": {"strategy": "thinking"}}

                    response = await client.chat.completions.create(**completion_params)

                    duration = int((time.time() - start_time) * 1000)

                    result = SimulationResult(
                        output=response.choices[0].message.content or "",
                        model=model_to_use,
                        tokens=TokenUsage(
                            prompt=response.usage.prompt_tokens if response.usage else 0,
                            completion=response.usage.completion_tokens if response.usage else 0
                        ),
                        duration=duration
                    )

                    return {"nodeId": node_id, "result": result, "error": None}

                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error executing node {node_id}: {e}")
                    import traceback
                    traceback.print_exc()
                    return {"nodeId": node_id, "result": None, "error": str(e)}

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
                        results[result["nodeId"]] = result["result"]
                        yield {
                            "type": "node-complete",
                            "nodeId": result["nodeId"],
                            "result": result["result"].model_dump(by_alias=True)
                        }
        
        # Save to disk if inputNodes specify paths and collect output file paths
        for in_node in input_nodes:
            if in_node.input_path:
                # Pass current_file for folder mode to get correct output filename
                output_path = save_output_file(
                    in_node.input_path, 
                    topology, 
                    results, 
                    actual_input_file=in_node.current_file
                )
                if output_path:
                    accumulated_output_files.append(output_path)

    # Emit completion event with output files
    yield {
        "type": "complete",
        "results": {k: v.model_dump(by_alias=True) for k, v in final_pass_results.items()},
        "executionOrder": final_pass_phases,
        "masterTask": final_pass_master_task or None,
        "outputFiles": accumulated_output_files
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
