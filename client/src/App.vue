<script setup lang="ts">
import { ref } from 'vue'
import { Settings, Play, Info, CheckCircle, XCircle, Square, Save, X, Download } from 'lucide-vue-next'
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
  globalModel,
  globalTemperature,
  globalBehaviorPreset,
  allAvailableModels,
  endpointConfigs,
  setGlobalModel,
  setGlobalTemperature,
  setGlobalBehaviorPreset,
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
const showSaveTemplateModal = ref(false)
const templateName = ref('')
const templateDescription = ref('')
const savingTemplate = ref(false)
const simulationError = ref<string | null>(null)
const simulationSuccess = ref<{ agentCount: number; totalTime: number } | null>(null)
const scenarioLoaderRef = ref<InstanceType<typeof ScenarioLoader> | null>(null)

async function saveTemplate() {
  if (!templateName.value.trim()) return
  savingTemplate.value = true
  try {
    const topology = exportTopology()
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName.value,
        description: templateDescription.value || undefined,
        topology
      })
    })
    showSaveTemplateModal.value = false
    templateName.value = ''
    templateDescription.value = ''
    simulationSuccess.value = { agentCount: 0, totalTime: 0 }
    setTimeout(() => simulationSuccess.value = null, 2000)
  } catch (err) {
    simulationError.value = 'Failed to save template'
    setTimeout(() => simulationError.value = null, 3000)
  } finally {
    savingTemplate.value = false
  }
}

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
        apiEndpoint: apiEndpoint.value,
        globalModel: globalModel.value,
        globalTemperature: globalTemperature.value,
        globalBehaviorPreset: globalBehaviorPreset.value,
        // Send endpoint configs for auto endpoint selection based on model
        endpointConfigs: endpointConfigs.value.map(c => ({
          id: c.id,
          apiKey: c.apiKey,
          endpoint: c.endpoint,
          models: c.models
        }))
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

        <!-- GROUP 1: Model Configuration -->
        <div class="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-600">Model</span>
            <select
              :value="globalModel"
              @change="setGlobalModel(($event.target as HTMLSelectElement).value as any)"
              class="text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option v-for="model in allAvailableModels" :key="model" :value="model">
                {{ model }}
              </option>
              <!-- Fallback if no models configured -->
              <option v-if="allAvailableModels.length === 0" value="gpt-4o">gpt-4o</option>
            </select>
          </div>
          <div class="h-6 w-px bg-gray-300"></div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-600">Preset</span>
            <select
              :value="globalBehaviorPreset"
              @change="setGlobalBehaviorPreset(($event.target as HTMLSelectElement).value)"
              class="text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="analytical">Analytical</option>
              <option value="creative">Creative</option>
              <option value="adversarial">Adversarial</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>
          <div class="h-6 w-px bg-gray-300"></div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-600">Temp</span>
            <input
              type="number"
              :value="globalTemperature"
              @change="setGlobalTemperature(parseFloat(($event.target as HTMLInputElement).value))"
              min="0"
              max="2"
              step="0.1"
              class="w-14 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
            />
          </div>
        </div>

        <!-- Separator -->
        <div class="h-8 w-px bg-gray-200"></div>

        <!-- GROUP 2: Project Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="showSaveTemplateModal = true"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            title="Save current topology as template"
          >
            <Save class="w-4 h-4" />
            Save
          </button>
          <button
            @click="handleExport"
            class="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download JSON"
          >
            <Download class="w-4 h-4" />
          </button>
          <ScenarioLoader ref="scenarioLoaderRef" />
        </div>

        <!-- Separator -->
        <div class="h-8 w-px bg-gray-200"></div>

        <!-- GROUP 3: Settings & Run -->
        <div class="flex items-center gap-1">
          <button
            @click="showAbout = true"
            class="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="About"
          >
            <Info class="w-5 h-5" />
          </button>
          <button
            @click="showSettings = true"
            class="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings class="w-5 h-5" />
          </button>
        </div>

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

    <!-- Save Template Modal -->
    <div v-if="showSaveTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showSaveTemplateModal = false"></div>
      <div class="relative bg-white rounded-lg shadow-xl w-96 p-6">
        <button
          @click="showSaveTemplateModal = false"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X class="w-5 h-5" />
        </button>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Save as Template</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Template Name *</label>
            <input
              v-model="templateName"
              type="text"
              placeholder="My Custom Template"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <textarea
              v-model="templateDescription"
              placeholder="Describe what this template does..."
              rows="3"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 resize-none"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              @click="showSaveTemplateModal = false"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              @click="saveTemplate"
              :disabled="!templateName.trim() || savingTemplate"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ savingTemplate ? 'Saving...' : 'Save Template' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
