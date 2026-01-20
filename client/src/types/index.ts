export type BehaviorPreset = 'analytical' | 'creative' | 'adversarial' | 'balanced'
// Models from config.toml
export type ModelType =
  | 'gpt-5.2'   // OpenAI GPT-5
  | 'gpt-4o'    // OpenAI GPT-4o  
  | 'Llama-4-Maverick-17B-128E-Instruct-FP8'  // Local Llama
  | 'GPT-OSS-120B'     // Local GPT
  | 'GLM-4.7-FP8'      // Local GLM
  | 'gpt-5-nano'       // Legacy
  | 'gpt-5-mini'       // Legacy
export type SuspicionLevel = 'trusting' | 'suspicious'
export type RogueProfile = 'hallucination' | 'omission' | 'contradiction' | 'ignore-constraints'
export type RelationshipType = 'informs' | 'critiques' | 'reports-to' | 'collaborates' | 'validates'

export interface RogueMode {
  enabled: boolean
  profile?: RogueProfile
}

// Skill: A markdown document providing custom instructions/knowledge
export interface AgentSkill {
  id: string
  name: string
  description: string
  // Future: content will be loaded from markdown files
}

// Tool: An external MCP server tool the agent can use
export interface AgentTool {
  id: string
  name: string
  description: string
  // Future: mcpServer, parameters, etc.
}

export type NodeType = 'agent' | 'input' | 'output'

export interface AgentNodeData {
  id: string
  type?: 'agent'
  name: string
  role: string
  systemPrompt?: string
  behaviorPreset: BehaviorPreset
  temperature: number
  model?: ModelType  // DEPRECATED: use global model config instead
  isOversight: boolean
  suspicionLevel?: SuspicionLevel
  rogueMode: RogueMode
  skills?: AgentSkill[]  // Custom instruction documents
  tools?: AgentTool[]    // MCP server tools
}

export interface InputNodeData {
  id: string
  type: 'input'
  task: string
}

export interface OutputNodeData {
  id: string
  type: 'output'
  label: string
}

export type CanvasNodeData = AgentNodeData | InputNodeData | OutputNodeData

export interface AgentEdge {
  id: string
  source: string
  target: string
  relationshipType: RelationshipType
}

export interface Topology {
  name: string
  description?: string
  nodes: AgentNodeData[]
  edges: AgentEdge[]
  inputNodes?: InputNodeData[]
  outputNodes?: OutputNodeData[]
}

export interface SimulationResult {
  output: string
  model: string
  tokens: {
    prompt: number
    completion: number
  }
  duration: number
  error?: string
}

export interface SimulationResponse {
  success: boolean
  results: Record<string, SimulationResult>
  executionOrder: string[][]
  error?: string
}

export type ScenarioCategory =
  | 'regulatory'         // IND submissions, pandemic response
  | 'strategy'           // M&A, competitive intelligence
  | 'clinical'           // Trial design, safety assessment
  | 'clinical-decisions' // Tumor board, transplant, ER triage
  | 'evidence'           // Real world evidence
  | 'documentation'      // Medical writing

export interface Scenario {
  id: string
  name: string
  description: string
  category: ScenarioCategory
  topology: Topology
}
