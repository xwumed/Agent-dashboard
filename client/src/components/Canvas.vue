<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import AgentNode from './AgentNode.vue'
import InputNode from './InputNode.vue'
import OutputNode from './OutputNode.vue'
import { useTopology } from '../composables/useTopology'
import type { AgentNodeData, InputNodeData, OutputNodeData, RelationshipType } from '../types'
import { FolderOpen } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'load-scenario'): void
}>()

const {
  nodes: topologyNodes,
  inputNodes: topologyInputNodes,
  outputNodes: topologyOutputNodes,
  edges: topologyEdges,
  selectNode,
  addNode,
  addInputNode,
  addOutputNode,
  addEdge,
  removeEdge
} = useTopology()

const { onConnect, onNodeDragStop, onPaneClick, fitView, onEdgesChange } = useVueFlow()

// Handle edge deletion
onEdgesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      removeEdge(change.id)
    }
  })
})

// Track node positions
const nodePositions = ref<Record<string, { x: number; y: number }>>({})

// Check if canvas is empty
const isCanvasEmpty = computed(() => {
  return topologyNodes.value.length === 0 &&
         topologyInputNodes.value.length === 0 &&
         topologyOutputNodes.value.length === 0
})

// Convert topology nodes to Vue Flow format
const vueFlowNodes = computed(() => {
  const agentNodes = topologyNodes.value.map(node => ({
    id: node.id,
    type: 'agent',
    position: nodePositions.value[node.id] || { x: 400, y: 200 },
    data: node
  }))

  const inputNodesMapped = topologyInputNodes.value.map(node => ({
    id: node.id,
    type: 'input',
    position: nodePositions.value[node.id] || { x: 50, y: 200 },
    data: node
  }))

  const outputNodesMapped = topologyOutputNodes.value.map(node => ({
    id: node.id,
    type: 'output',
    position: nodePositions.value[node.id] || { x: 900, y: 200 },
    data: node
  }))

  return [...inputNodesMapped, ...agentNodes, ...outputNodesMapped]
})

// Key to force VueFlow to re-render when node count changes (fixes sync issues)
const flowKey = computed(() => {
  const ids = [
    ...topologyNodes.value.map(n => n.id),
    ...topologyInputNodes.value.map(n => n.id),
    ...topologyOutputNodes.value.map(n => n.id)
  ]
  return ids.sort().join(',')
})

// Convert topology edges to Vue Flow format
const vueFlowEdges = computed(() => {
  return topologyEdges.value.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.relationshipType,
    markerEnd: MarkerType.ArrowClosed,
    style: { strokeWidth: 2 },
    labelStyle: { fontSize: 10, fill: '#6b7280' },
    labelBgStyle: { fill: '#f3f4f6' }
  }))
})

// Handle new connections
onConnect((params) => {
  const edgeId = `e-${params.source}-${params.target}`
  addEdge({
    id: edgeId,
    source: params.source,
    target: params.target,
    relationshipType: 'informs' as RelationshipType
  })
})

// Track node position changes
onNodeDragStop(({ node }) => {
  nodePositions.value[node.id] = { x: node.position.x, y: node.position.y }
})

// Handle pane click to deselect
onPaneClick(() => {
  selectNode(null)
})

// Handle drop from palette
function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('application/agentType')
  if (!nodeType) return

  const bounds = (event.target as HTMLElement).closest('.vue-flow')?.getBoundingClientRect()
  if (!bounds) return

  const position = {
    x: event.clientX - bounds.left - 90,
    y: event.clientY - bounds.top - 40
  }

  const nodeId = `node-${Date.now()}`

  // Handle input node
  if (nodeType === 'input') {
    const newInputNode: InputNodeData = {
      id: nodeId,
      type: 'input',
      task: ''
    }
    nodePositions.value[nodeId] = position
    addInputNode(newInputNode)
    selectNode(nodeId)
    return
  }

  // Handle output node
  if (nodeType === 'output') {
    const newOutputNode: OutputNodeData = {
      id: nodeId,
      type: 'output',
      label: 'Final Output'
    }
    nodePositions.value[nodeId] = position
    addOutputNode(newOutputNode)
    selectNode(nodeId)
    return
  }

  // Handle agent nodes
  const isOversight = nodeType === 'oversight'

  const newNode: AgentNodeData = {
    id: nodeId,
    name: isOversight ? 'Oversight Agent' : 'New Agent',
    role: '',
    behaviorPreset: isOversight ? 'analytical' : 'balanced',
    temperature: 0.7,
    // model is no longer per-node, uses global model
    isOversight,
    suspicionLevel: isOversight ? 'trusting' : undefined,
    rogueMode: { enabled: false }
  }

  nodePositions.value[nodeId] = position
  addNode(newNode)
  selectNode(nodeId)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onNodeClick(event: { node: { id: string } }) {
  selectNode(event.node.id)
}

// Calculate layered layout for imported topologies
function calculateLayout() {
  const allNodeIds = new Set([
    ...topologyInputNodes.value.map(n => n.id),
    ...topologyNodes.value.map(n => n.id),
    ...topologyOutputNodes.value.map(n => n.id)
  ])

  // Build adjacency for topological layering
  const inDegree = new Map<string, number>()
  const outEdges = new Map<string, string[]>()

  allNodeIds.forEach(id => {
    inDegree.set(id, 0)
    outEdges.set(id, [])
  })

  topologyEdges.value.forEach(edge => {
    if (allNodeIds.has(edge.source) && allNodeIds.has(edge.target)) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
      outEdges.get(edge.source)?.push(edge.target)
    }
  })

  // Assign layers using topological sort
  const layers: string[][] = []
  const assigned = new Set<string>()
  const nodeLayer = new Map<string, number>()

  // Input nodes are always layer 0
  const inputIds = topologyInputNodes.value.map(n => n.id)
  if (inputIds.length > 0) {
    layers.push(inputIds)
    inputIds.forEach(id => {
      assigned.add(id)
      nodeLayer.set(id, 0)
    })
  }

  // Process remaining nodes by layers
  let remaining = new Set([...allNodeIds].filter(id => !assigned.has(id)))

  while (remaining.size > 0) {
    const currentLayer: string[] = []

    remaining.forEach(id => {
      // Check if all predecessors are assigned
      const predecessorEdges = topologyEdges.value.filter(e => e.target === id)
      const allPredecessorsAssigned = predecessorEdges.every(e => assigned.has(e.source))

      // Node with no incoming edges from remaining, or all predecessors assigned
      if (predecessorEdges.length === 0 || allPredecessorsAssigned) {
        // Skip output nodes for now - they go last
        if (!topologyOutputNodes.value.some(n => n.id === id)) {
          currentLayer.push(id)
        }
      }
    })

    if (currentLayer.length === 0) {
      // Handle cycles - just add remaining non-output nodes
      remaining.forEach(id => {
        if (!topologyOutputNodes.value.some(n => n.id === id)) {
          currentLayer.push(id)
        }
      })
    }

    if (currentLayer.length > 0) {
      layers.push(currentLayer)
      currentLayer.forEach(id => {
        assigned.add(id)
        nodeLayer.set(id, layers.length - 1)
        remaining.delete(id)
      })
    } else {
      break
    }
  }

  // Output nodes are always last layer
  const outputIds = topologyOutputNodes.value.map(n => n.id)
  if (outputIds.length > 0) {
    layers.push(outputIds)
    outputIds.forEach(id => {
      assigned.add(id)
      nodeLayer.set(id, layers.length - 1)
    })
  }

  // Calculate positions
  const layerWidth = 280
  const nodeHeight = 160
  const startX = 80
  const startY = 80

  layers.forEach((layer, layerIndex) => {
    const layerX = startX + layerIndex * layerWidth
    const offsetY = (layer.length - 1) * nodeHeight / 2

    layer.forEach((nodeId, nodeIndex) => {
      nodePositions.value[nodeId] = {
        x: layerX,
        y: startY + nodeIndex * nodeHeight - offsetY + 150
      }
    })
  })
}

// Watch for topology changes and recalculate layout
watch(
  [topologyNodes, topologyInputNodes, topologyOutputNodes, topologyEdges],
  () => {
    const allIds = [
      ...topologyInputNodes.value.map(n => n.id),
      ...topologyNodes.value.map(n => n.id),
      ...topologyOutputNodes.value.map(n => n.id)
    ]

    // If canvas was cleared (all empty), reset positions
    if (allIds.length === 0) {
      nodePositions.value = {}
      return
    }

    // Check if this is a new topology load (many new nodes at once)
    const existingPositionCount = allIds.filter(id => nodePositions.value[id]).length
    const isNewTopology = existingPositionCount === 0 || existingPositionCount < allIds.length * 0.5

    if (isNewTopology) {
      // Clear old positions and recalculate for new topology
      nodePositions.value = {}
      calculateLayout()
      // Fit view after layout with some padding
      nextTick(() => {
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 300 })
        }, 50)
      })
    }
  },
  { immediate: true, deep: true }
)

// Set initial viewport to be zoomed out for better overview
watch(isCanvasEmpty, (empty) => {
  if (!empty) {
    nextTick(() => {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 })
      }, 100)
    })
  }
}, { immediate: true })
</script>

<template>
  <div class="flex-1 h-full relative" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      :key="flowKey"
      :nodes="vueFlowNodes"
      :edges="vueFlowEdges"
      @node-click="onNodeClick"
      :default-viewport="{ x: 0, y: 0, zoom: 0.8 }"
      :min-zoom="0.2"
      :max-zoom="2"
      class="canvas-bg"
    >
      <template #node-agent="props">
        <AgentNode v-bind="props" />
      </template>
      <template #node-input="props">
        <InputNode v-bind="props" />
      </template>
      <template #node-output="props">
        <OutputNode v-bind="props" />
      </template>
      <Background pattern-color="#e5e7eb" :gap="24" :size="1" />
      <Controls position="bottom-left" />
    </VueFlow>

    <!-- Empty state overlay -->
    <div
      v-if="isCanvasEmpty"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md text-center pointer-events-auto">
        <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="12" y1="8" x2="5" y2="16" />
            <line x1="12" y1="8" x2="19" y2="16" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Welcome to Agent Dashboard</h3>
        <p class="text-sm text-gray-500 mb-6">
          Build multi-agent workflows for pharmaceutical R&D. Start by loading a pre-built scenario or drag components from the left panel.
        </p>
        <div class="flex flex-col gap-3">
          <button
            @click="$emit('load-scenario')"
            class="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FolderOpen class="w-4 h-4" />
            Load Example Scenario
          </button>
          <p class="text-xs text-gray-400">
            Or drag Input, Agent, and Output nodes from the left panel
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.canvas-bg {
  background: #fafafa;
}

.vue-flow__edge-path {
  stroke: #9ca3af;
}

.vue-flow__edge-path:hover {
  stroke: #111827;
}

.vue-flow__edge-text {
  font-size: 10px;
}

.vue-flow__controls {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
}

.vue-flow__controls-button {
  background: white;
  border: none;
  width: 28px;
  height: 28px;
}

.vue-flow__controls-button:hover {
  background: #f9fafb;
}

.vue-flow__controls-button svg {
  width: 14px;
  height: 14px;
}
</style>
