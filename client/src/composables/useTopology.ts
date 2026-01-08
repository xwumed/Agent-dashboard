import { ref, computed } from 'vue'
import type { AgentNodeData, AgentEdge, Topology, SimulationResult, RelationshipType, InputNodeData, OutputNodeData } from '../types'

const nodes = ref<AgentNodeData[]>([])
const inputNodes = ref<InputNodeData[]>([])
const outputNodes = ref<OutputNodeData[]>([])
const edges = ref<AgentEdge[]>([])
const topologyName = ref('Untitled Topology')
const topologyDescription = ref('')
const selectedNodeId = ref<string | null>(null)
const simulationResults = ref<Record<string, SimulationResult>>({})
const isSimulating = ref(false)
const apiKey = ref(localStorage.getItem('openai_api_key') || '')
const apiEndpoint = ref(localStorage.getItem('openai_api_endpoint') || 'https://api.openai.com')

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

  function exportTopology() {
    return {
      name: topologyName.value,
      description: topologyDescription.value,
      nodes: nodes.value,
      edges: edges.value,
      inputNodes: inputNodes.value,
      outputNodes: outputNodes.value
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
    updateNodeResult
  }
}
