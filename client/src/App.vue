<script setup lang="ts">
import { ref } from 'vue'
import { Settings, Play, Info, CheckCircle, XCircle, Square } from 'lucide-vue-next'
import Canvas from './components/Canvas.vue'
import AgentPalette from './components/AgentPalette.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import SettingsModal from './components/SettingsModal.vue'
import OutputDrawer from './components/OutputDrawer.vue'
import ScenarioLoader from './components/ScenarioLoader.vue'
import AboutModal from './components/AboutModal.vue'
import { useTopology } from './composables/useTopology'
import type { SimulationResult } from './types'

const {
  nodes,
  apiKey,
  apiEndpoint,
  isSimulating,
  selectedNode,
  exportTopology,
  importTopology,
  setSimulationResults,
  createAbortController,
  abortSimulation,
  setProcessingNodes,
  markNodeComplete,
  clearProcessingNodes,
  updateNodeResult
} = useTopology()

const showSettings = ref(false)
const showOutput = ref(false)
const showAbout = ref(false)
const simulationError = ref<string | null>(null)
const simulationSuccess = ref<{ agentCount: number; totalTime: number } | null>(null)
const scenarioLoaderRef = ref<InstanceType<typeof ScenarioLoader> | null>(null)

function openScenarioLoader() {
  scenarioLoaderRef.value?.open()
}

async function runSimulation() {
  if (!apiKey.value) {
    showSettings.value = true
    return
  }

  if (nodes.value.length === 0) {
    simulationError.value = 'Add at least one agent to the canvas'
    setTimeout(() => simulationError.value = null, 3000)
    return
  }

  isSimulating.value = true
  simulationError.value = null
  setSimulationResults({})
  clearProcessingNodes()

  const controller = createAbortController()

  try {
    const topology = exportTopology()
    const response = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topology,
        apiKey: apiKey.value,
        apiEndpoint: apiEndpoint.value
      }),
      signal: controller.signal
    })

    // Check for non-OK response before parsing
    if (!response.ok) {
      const text = await response.text()
      // Try to parse as JSON first
      let errorMessage = `Server error ${response.status}: ${text.substring(0, 200)}`
      try {
        const errorJson = JSON.parse(text)
        errorMessage = errorJson.error || errorMessage
      } catch {
        // Keep the default error message with truncated text
      }
      throw new Error(errorMessage)
    }

    // Check if streaming response
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/x-ndjson')) {
      // Streaming NDJSON response
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const results: Record<string, SimulationResult> = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()! // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line)

            if (event.type === 'phase-start') {
              setProcessingNodes(event.nodeIds)
            } else if (event.type === 'node-complete') {
              markNodeComplete(event.nodeId)
              updateNodeResult(event.nodeId, event.result)
              results[event.nodeId] = event.result
            } else if (event.type === 'node-error') {
              markNodeComplete(event.nodeId)
              const errorResult: SimulationResult = {
                output: '',
                model: '',
                tokens: { prompt: 0, completion: 0 },
                duration: 0,
                error: event.error
              }
              updateNodeResult(event.nodeId, errorResult)
              results[event.nodeId] = errorResult
            } else if (event.type === 'error') {
              throw new Error(event.error)
            }
          } catch (parseErr) {
            console.error('Failed to parse stream event:', line, parseErr)
          }
        }
      }

      // Calculate success stats
      const agentCount = Object.keys(results).length
      const totalTime = Object.values(results).reduce((sum: number, r: SimulationResult) => sum + (r.duration || 0), 0)
      simulationSuccess.value = { agentCount, totalTime }
      setTimeout(() => simulationSuccess.value = null, 5000)
    } else {
      // Standard JSON response (fallback)
      const data = await response.json()

      if (data.success) {
        setSimulationResults(data.results)
        const agentCount = Object.keys(data.results).length
        const totalTime = Object.values(data.results as Record<string, SimulationResult>).reduce((sum: number, r) => sum + (r.duration || 0), 0)
        simulationSuccess.value = { agentCount, totalTime }
        setTimeout(() => simulationSuccess.value = null, 5000)
      } else {
        simulationError.value = data.error || 'Simulation failed'
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      simulationError.value = 'Simulation cancelled'
      setTimeout(() => simulationError.value = null, 3000)
    } else {
      simulationError.value = err instanceof Error ? err.message : 'Network error'
    }
  } finally {
    isSimulating.value = false
    clearProcessingNodes()
  }
}

function stopSimulation() {
  abortSimulation()
}

function handleExport() {
  const topology = exportTopology()
  const blob = new Blob([JSON.stringify(topology, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${topology.name.toLowerCase().replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const topology = JSON.parse(text)
      importTopology(topology)
    } catch (err) {
      simulationError.value = 'Invalid topology file'
      setTimeout(() => simulationError.value = null, 3000)
    }
  }
  input.click()
}

function toggleOutput() {
  if (selectedNode.value) {
    showOutput.value = !showOutput.value
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-white">
    <!-- Header -->
    <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div class="flex items-center gap-3">
        <img src="https://jnkather.github.io/images/logo.png" class="h-8" alt="Kather Lab" />
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="12" y1="8" x2="5" y2="16" />
            <line x1="12" y1="8" x2="19" y2="16" />
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-semibold text-gray-900 tracking-tight">Agent Dashboard</h1>
          <p class="text-xs text-gray-500">Multi-agent orchestration sandbox</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Success toast -->
        <div
          v-if="simulationSuccess"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md animate-fade-in"
        >
          <CheckCircle class="w-4 h-4" />
          <span>{{ simulationSuccess.agentCount }} agents completed in {{ (simulationSuccess.totalTime / 1000).toFixed(1) }}s</span>
        </div>

        <!-- Error message -->
        <div
          v-if="simulationError"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-md"
        >
          <XCircle class="w-4 h-4" />
          {{ simulationError }}
        </div>

        <!-- Scenario Loader -->
        <ScenarioLoader ref="scenarioLoaderRef" />

        <!-- About button -->
        <button
          @click="showAbout = true"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="About"
        >
          <Info class="w-5 h-5" />
        </button>

        <!-- Settings button -->
        <button
          @click="showSettings = true"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Settings"
        >
          <Settings class="w-5 h-5" />
        </button>

        <!-- Run/Stop button -->
        <button
          v-if="isSimulating"
          @click="stopSimulation"
          class="flex items-center gap-2 px-6 py-2.5 text-base font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"
        >
          <Square class="w-5 h-5" />
          STOP
        </button>
        <button
          v-else
          @click="runSimulation"
          class="flex items-center gap-2 px-6 py-2.5 text-base font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
        >
          <Play class="w-5 h-5" />
          RUN
        </button>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Palette -->
      <AgentPalette @import="handleImport" @export="handleExport" />

      <!-- Center: Canvas -->
      <Canvas @node-click="toggleOutput" @load-scenario="openScenarioLoader" />

      <!-- Right: Properties -->
      <PropertiesPanel />
    </div>

    <!-- Modals & Drawers -->
    <SettingsModal :open="showSettings" @close="showSettings = false" />
    <OutputDrawer :open="showOutput" @close="showOutput = false" />
    <AboutModal :open="showAbout" @close="showAbout = false" />
  </div>
</template>
