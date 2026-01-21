import { ref, computed } from 'vue'
import type { AgentNodeData, AgentEdge, Topology, SimulationResult, RelationshipType, InputNodeData, OutputNodeData, ModelType } from '../types'

const nodes = ref<AgentNodeData[]>([])
const inputNodes = ref<InputNodeData[]>([])
const outputNodes = ref<OutputNodeData[]>([])
const edges = ref<AgentEdge[]>([])
const topologyName = ref('Untitled Topology')
const topologyDescription = ref('')
const selectedNodeId = ref<string | null>(null)
const simulationResults = ref<Record<string, SimulationResult>>({})
const isSimulating = ref(false)

// Multi-endpoint API configuration by category
type EndpointCategory = 'chat' | 'embedding' | 'reranker'

interface EndpointConfig {
  id: string
  category: EndpointCategory
  label: string
  apiKey: string
  endpoint: string
  models: string[]  // User-defined available models
}

const defaultEndpointConfigs: EndpointConfig[] = [
  // Chat Models (for Agent conversation)
  { id: 'chat-openai', category: 'chat', label: 'OpenAI Chat', apiKey: '', endpoint: 'https://api.openai.com/v1', models: ['gpt-4o'] },
  { id: 'chat-local', category: 'chat', label: 'Local LLM', apiKey: 'EMPTY', endpoint: 'http://localhost:11434/v1', models: ['GPT-OSS-120B', 'GLM-4.7-FP8'] },
  // Embedding Models (for RAG retrieval)
  { id: 'embedding', category: 'embedding', label: 'Embedding', apiKey: 'EMPTY', endpoint: 'http://localhost:8080/v1', models: ['Qwen3-Embedding-8B'] },
  // Reranker Models (for RAG reranking)
  { id: 'reranker', category: 'reranker', label: 'Reranker', apiKey: 'EMPTY', endpoint: 'http://localhost:8080/v1', models: ['bge-reranker-large'] }
]

// Load from localStorage or use defaults
const savedConfigs = localStorage.getItem('endpoint_configs')
const endpointConfigs = ref<EndpointConfig[]>(
  savedConfigs ? JSON.parse(savedConfigs) : defaultEndpointConfigs
)

// Legacy single endpoint (for backward compatibility)
const apiKey = ref(localStorage.getItem('openai_api_key') || '')
const apiEndpoint = ref(localStorage.getItem('openai_api_endpoint') || 'https://api.openai.com')

// Computed: all available chat models (for global model selector)
const allAvailableModels = computed(() => {
  const models: string[] = []
  for (const config of endpointConfigs.value) {
    if (config.category === 'chat') {
      models.push(...config.models)
    }
  }
  return [...new Set(models)]  // Remove duplicates
})

// Global model configuration (all agents use this)
const globalModel = ref<ModelType>(localStorage.getItem('global_model') as ModelType || 'gpt-5.2')
const globalTemperature = ref<number>(parseFloat(localStorage.getItem('global_temperature') || '0.5'))
const globalMaxTokens = ref<number>(parseInt(localStorage.getItem('global_max_tokens') || '16000'))
// Reasoning effort for O-series/GPT models: 'low' | 'medium' | 'high'
const globalReasoningEffort = ref<string>(localStorage.getItem('global_reasoning_effort') || 'medium')
// Thinking mode for GLM models
const globalThinking = ref<boolean>(localStorage.getItem('global_thinking') === 'true')

// Current loaded template tracking (for overwrite save)
const currentTemplateId = ref<string | null>(null)
const currentTemplateName = ref<string | null>(null)

// Streaming simulation state
const processingNodeIds = ref<Set<string>>(new Set())
const abortController = ref<AbortController | null>(null)

export function useTopology() {
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find(n => n.id === selectedNodeId.value) || null
  })

  // Generic selected item that can be agent, input, or output node
  const selectedItem = computed((): { type: 'agent' | 'input' | 'output'; data: AgentNodeData | InputNodeData | OutputNodeData } | null => {
    if (!selectedNodeId.value) return null

    const agentNode = nodes.value.find(n => n.id === selectedNodeId.value)
    if (agentNode) return { type: 'agent', data: agentNode }

    const inputNode = inputNodes.value.find(n => n.id === selectedNodeId.value)
    if (inputNode) return { type: 'input', data: inputNode }

    const outputNode = outputNodes.value.find(n => n.id === selectedNodeId.value)
    if (outputNode) return { type: 'output', data: outputNode }

    return null
  })

  // Get the aggregated output for an output node (from all connected agents)
  function getOutputNodeResult(outputNodeId: string): string {
    // Find all edges that target this output node
    const incomingEdges = edges.value.filter(e => e.target === outputNodeId)

    // Get results from all source nodes
    const outputs: string[] = []
    for (const edge of incomingEdges) {
      const result = simulationResults.value[edge.source]
      if (result?.output) {
        const sourceNode = nodes.value.find(n => n.id === edge.source)
        const sourceName = sourceNode?.name || edge.source
        outputs.push(`## ${sourceName}\n\n${result.output}`)
      }
    }

    return outputs.join('\n\n---\n\n')
  }

  function addNode(node: AgentNodeData) {
    nodes.value.push(node)
  }

  function updateNode(id: string, updates: Partial<AgentNodeData>) {
    const index = nodes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      nodes.value[index] = { ...nodes.value[index], ...updates } as AgentNodeData
    }
  }

  function removeNode(id: string) {
    nodes.value = nodes.value.filter(n => n.id !== id)
    edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
  }

  // Input node functions
  function addInputNode(node: InputNodeData) {
    inputNodes.value.push(node)
  }

  function updateInputNode(id: string, updates: Partial<InputNodeData>) {
    const index = inputNodes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      inputNodes.value[index] = { ...inputNodes.value[index], ...updates } as InputNodeData
    }
  }

  function removeInputNode(id: string) {
    inputNodes.value = inputNodes.value.filter(n => n.id !== id)
    edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
  }

  // Output node functions
  function addOutputNode(node: OutputNodeData) {
    outputNodes.value.push(node)
  }

  function updateOutputNode(id: string, updates: Partial<OutputNodeData>) {
    const index = outputNodes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      outputNodes.value[index] = { ...outputNodes.value[index], ...updates } as OutputNodeData
    }
  }

  function removeOutputNode(id: string) {
    outputNodes.value = outputNodes.value.filter(n => n.id !== id)
    edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
  }

  function addEdge(edge: AgentEdge) {
    // Prevent duplicate edges
    const exists = edges.value.some(
      e => e.source === edge.source && e.target === edge.target
    )
    if (!exists) {
      edges.value.push(edge)
    }
  }

  function updateEdgeRelationship(id: string, relationshipType: RelationshipType) {
    const edge = edges.value.find(e => e.id === id)
    if (edge) {
      edge.relationshipType = relationshipType
    }
  }

  function removeEdge(id: string) {
    edges.value = edges.value.filter(e => e.id !== id)
  }

  function selectNode(id: string | null) {
    selectedNodeId.value = id
  }

  function clearTopology() {
    nodes.value = []
    inputNodes.value = []
    outputNodes.value = []
    edges.value = []
    selectedNodeId.value = null
    simulationResults.value = {}
    topologyName.value = 'Untitled Topology'
    topologyDescription.value = ''
  }

  // ... (imports and checks)

  function exportTopology(): Topology {
    return {
      name: topologyName.value,
      description: topologyDescription.value,
      nodes: nodes.value,
      edges: edges.value,
      inputNodes: inputNodes.value,
      outputNodes: outputNodes.value,
      globalSettings: {
        model: globalModel.value,
        temperature: globalTemperature.value,
        maxTokens: globalMaxTokens.value,
        reasoningEffort: globalReasoningEffort.value,
        thinking: globalThinking.value
      }
    }
  }

  function importTopology(topology: Topology) {
    clearTopology()
    topologyName.value = topology.name
    topologyDescription.value = topology.description || ''
    nodes.value = topology.nodes
    edges.value = topology.edges
    inputNodes.value = topology.inputNodes || []
    outputNodes.value = topology.outputNodes || []

    // Restore global settings if present
    if (topology.globalSettings) {
      if (topology.globalSettings.model) {
        globalModel.value = topology.globalSettings.model
        localStorage.setItem('global_model', topology.globalSettings.model)
      }
      if (topology.globalSettings.temperature !== undefined) {
        globalTemperature.value = topology.globalSettings.temperature
        localStorage.setItem('global_temperature', topology.globalSettings.temperature.toString())
      }
      if (topology.globalSettings.maxTokens !== undefined) {
        globalMaxTokens.value = topology.globalSettings.maxTokens
        localStorage.setItem('global_max_tokens', topology.globalSettings.maxTokens.toString())
      }
      if (topology.globalSettings.reasoningEffort) {
        globalReasoningEffort.value = topology.globalSettings.reasoningEffort
        localStorage.setItem('global_reasoning_effort', topology.globalSettings.reasoningEffort)
      }
      if (topology.globalSettings.thinking !== undefined) {
        globalThinking.value = topology.globalSettings.thinking
        localStorage.setItem('global_thinking', topology.globalSettings.thinking.toString())
      }
    }
  }

  function setApiKey(key: string) {
    apiKey.value = key
    localStorage.setItem('openai_api_key', key)
  }

  function setApiEndpoint(endpoint: string) {
    apiEndpoint.value = endpoint
    localStorage.setItem('openai_api_endpoint', endpoint)
  }

  function setSimulationResults(results: Record<string, SimulationResult>) {
    simulationResults.value = results
  }

  function getNodeResult(nodeId: string): SimulationResult | null {
    return simulationResults.value[nodeId] || null
  }

  // Streaming simulation helpers
  function createAbortController(): AbortController {
    abortController.value = new AbortController()
    return abortController.value
  }

  function abortSimulation(): void {
    abortController.value?.abort()
    abortController.value = null
    isSimulating.value = false
    processingNodeIds.value.clear()
  }

  function setProcessingNodes(nodeIds: string[]): void {
    processingNodeIds.value = new Set(nodeIds)
  }

  function markNodeComplete(nodeId: string): void {
    processingNodeIds.value.delete(nodeId)
  }

  function clearProcessingNodes(): void {
    processingNodeIds.value.clear()
  }

  function updateNodeResult(nodeId: string, result: SimulationResult): void {
    simulationResults.value[nodeId] = result
  }

  return {
    nodes,
    inputNodes,
    outputNodes,
    edges,
    topologyName,
    topologyDescription,
    selectedNodeId,
    selectedNode,
    selectedItem,
    simulationResults,
    isSimulating,
    apiKey,
    apiEndpoint,
    // Global model config
    globalModel,
    globalTemperature,
    globalMaxTokens,
    globalReasoningEffort,
    globalThinking,
    setGlobalModel: (model: ModelType) => {
      globalModel.value = model
      localStorage.setItem('global_model', model)
    },
    setGlobalTemperature: (temp: number) => {
      globalTemperature.value = temp
      localStorage.setItem('global_temperature', temp.toString())
    },
    setGlobalMaxTokens: (tokens: number) => {
      globalMaxTokens.value = tokens
      localStorage.setItem('global_max_tokens', tokens.toString())
    },
    setGlobalReasoningEffort: (effort: string) => {
      globalReasoningEffort.value = effort
      localStorage.setItem('global_reasoning_effort', effort)
    },
    setGlobalThinking: (enabled: boolean) => {
      globalThinking.value = enabled
      localStorage.setItem('global_thinking', enabled.toString())
    },
    addNode,
    updateNode,
    removeNode,
    addInputNode,
    updateInputNode,
    removeInputNode,
    addOutputNode,
    updateOutputNode,
    removeOutputNode,
    addEdge,
    updateEdgeRelationship,
    removeEdge,
    selectNode,
    clearTopology,
    exportTopology,
    importTopology,
    setApiKey,
    setApiEndpoint,
    setSimulationResults,
    getNodeResult,
    getOutputNodeResult,
    // Streaming simulation
    processingNodeIds,
    createAbortController,
    abortSimulation,
    setProcessingNodes,
    markNodeComplete,
    clearProcessingNodes,
    updateNodeResult,
    // Multi-endpoint configuration
    endpointConfigs,
    allAvailableModels,
    updateEndpointConfig: (id: string, updates: Partial<{ apiKey: string; endpoint: string; models: string[] }>) => {
      const config = endpointConfigs.value.find(c => c.id === id)
      if (config) {
        Object.assign(config, updates)
        localStorage.setItem('endpoint_configs', JSON.stringify(endpointConfigs.value))
      }
    },
    saveEndpointConfigs: () => {
      localStorage.setItem('endpoint_configs', JSON.stringify(endpointConfigs.value))
    },
    getEndpointForModel: (model: string) => {
      for (const config of endpointConfigs.value) {
        if (config.models.includes(model)) {
          return { apiKey: config.apiKey, endpoint: config.endpoint }
        }
      }
      // Fallback to legacy
      return { apiKey: apiKey.value, endpoint: apiEndpoint.value }
    },
    // Current template tracking
    currentTemplateId,
    currentTemplateName,
    setCurrentTemplate: (id: string | null, name: string | null) => {
      currentTemplateId.value = id
      currentTemplateName.value = name
    }
  }
}
