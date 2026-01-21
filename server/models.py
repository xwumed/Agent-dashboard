"""Pydantic models for Agent Dashboard API"""
from typing import Optional, Literal
from pydantic import BaseModel, Field


# Type literals
BehaviorPreset = Literal["analytical", "creative", "adversarial", "balanced"]
ModelType = Literal["gpt-5-nano", "gpt-5-mini", "gpt-5.2", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
SuspicionLevel = Literal["trusting", "suspicious"]
RogueProfile = Literal["hallucination", "omission", "contradiction", "ignore-constraints"]
RelationshipType = Literal["informs", "critiques", "reports-to", "collaborates", "validates"]


class RogueMode(BaseModel):
    enabled: bool = False
    profile: Optional[RogueProfile] = None


class AgentSkill(BaseModel):
    id: str
    name: str
    description: str


class AgentTool(BaseModel):
    id: str
    name: str
    description: str


class AgentNodeData(BaseModel):
    id: str
    type: Optional[Literal["agent"]] = "agent"
    name: str
    role: str
    system_prompt: Optional[str] = Field(None, alias="systemPrompt")
    behavior_preset: BehaviorPreset = Field(alias="behaviorPreset")
    temperature: float = 0.7
    model: str = "gpt-4o"
    is_oversight: bool = Field(False, alias="isOversight")
    suspicion_level: Optional[SuspicionLevel] = Field("trusting", alias="suspicionLevel")
    rogue_mode: RogueMode = Field(default_factory=lambda: RogueMode(enabled=False), alias="rogueMode")
    skills: Optional[list[AgentSkill]] = None
    tools: Optional[list[AgentTool]] = None

    class Config:
        populate_by_name = True


class InputNodeData(BaseModel):
    id: str
    type: Literal["input"] = "input"
    task: str
    input_path: Optional[str] = Field(None, alias="inputPath")
    input_mode: Optional[Literal["text", "file", "folder"]] = Field("text", alias="inputMode")
    folder_files: Optional[list[str]] = Field(None, alias="folderFiles")


class OutputNodeData(BaseModel):
    id: str
    type: Literal["output"] = "output"
    label: str


class AgentEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: RelationshipType = Field(alias="relationshipType")

    class Config:
        populate_by_name = True


class GlobalSettings(BaseModel):
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = Field(None, alias="maxTokens")
    reasoning_effort: Optional[str] = Field(None, alias="reasoningEffort")
    thinking: Optional[bool] = None

    class Config:
        populate_by_name = True


class Topology(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: list[AgentNodeData]
    edges: list[AgentEdge]
    input_nodes: Optional[list[InputNodeData]] = Field(default_factory=list, alias="inputNodes")
    output_nodes: Optional[list[OutputNodeData]] = Field(default_factory=list, alias="outputNodes")
    global_settings: Optional[GlobalSettings] = Field(None, alias="globalSettings")

    class Config:
        populate_by_name = True


class EndpointConfig(BaseModel):
    """API endpoint configuration for auto endpoint selection"""
    id: str
    api_key: str = Field(alias="apiKey")
    endpoint: str
    models: list[str] = []
    
    class Config:
        populate_by_name = True


class SimulationRequest(BaseModel):
    topology: Topology
    api_key: str = Field(alias="apiKey")
    api_endpoint: Optional[str] = Field("https://api.openai.com", alias="apiEndpoint")
    global_model: Optional[str] = Field("gpt-4o", alias="globalModel")
    global_temperature: Optional[float] = Field(0.5, alias="globalTemperature")
    global_max_tokens: Optional[int] = Field(16000, alias="globalMaxTokens")
    global_reasoning_effort: Optional[str] = Field("medium", alias="globalReasoningEffort")
    global_thinking: Optional[bool] = Field(False, alias="globalThinking")
    endpoint_configs: Optional[list[EndpointConfig]] = Field(None, alias="endpointConfigs")

    class Config:
        populate_by_name = True


class TokenUsage(BaseModel):
    prompt: int = 0
    completion: int = 0


class ToolCallInfo(BaseModel):
    tool_name: str
    args: dict
    result: str


class SimulationResult(BaseModel):
    output: str
    model: str
    tokens: TokenUsage
    duration: int
    error: Optional[str] = None
    tool_calls: Optional[list[ToolCallInfo]] = None


class SimulationResponse(BaseModel):
    success: bool
    results: dict[str, SimulationResult]
    execution_order: list[list[str]] = Field(alias="executionOrder")
    master_task: Optional[str] = Field(None, alias="masterTask")
    error: Optional[str] = None

    class Config:
        populate_by_name = True


# Streaming event models
class PhaseStartEvent(BaseModel):
    type: Literal["phase-start"] = "phase-start"
    phase: int
    node_ids: list[str] = Field(alias="nodeIds")

    class Config:
        populate_by_name = True


class NodeCompleteEvent(BaseModel):
    type: Literal["node-complete"] = "node-complete"
    node_id: str = Field(alias="nodeId")
    result: SimulationResult

    class Config:
        populate_by_name = True


class NodeErrorEvent(BaseModel):
    type: Literal["node-error"] = "node-error"
    node_id: str = Field(alias="nodeId")
    error: str
    result: SimulationResult

    class Config:
        populate_by_name = True


class CompleteEvent(BaseModel):
    type: Literal["complete"] = "complete"
    results: dict[str, SimulationResult]
    execution_order: list[list[str]] = Field(alias="executionOrder")
    master_task: Optional[str] = Field(None, alias="masterTask")

    class Config:
        populate_by_name = True


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    error: str
