<script setup lang="ts">
import { ref } from 'vue'
import { Settings, Play, Info, CheckCircle, XCircle, Square, X } from 'lucide-vue-next'
import Canvas from './components/Canvas.vue'
import GlobalSettingsPanel from './components/GlobalSettingsPanel.vue'
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
  globalMaxTokens,
  globalReasoningEffort,
  globalThinking,
  endpointConfigs,
  currentTemplateId,
  exportTopology,
  setSimulationResults,
  createAbortController,
  abortSimulation,
  setProcessingNodes,
  markNodeComplete,
  clearProcessingNodes,
  updateNodeResult,
  importTopology,
  currentTemplateName,
  topologyName,
  topologyDescription,
  setOutputFiles,
  clearOutputFiles
} = useTopology()

const showSettings = ref(false)
const showOutput = ref(false)
const showAbout = ref(false)
const showSaveTemplateModal = ref(false)
const templateName = ref('')
const templateDescription = ref('')
const savingTemplate = ref(false)
const saveSuccessMessage = ref<string | null>(null)
const simulationError = ref<string | null>(null)
const simulationSuccess = ref<{ agentCount: number; totalTime: number } | null>(null)
const scenarioLoaderRef = ref<InstanceType<typeof ScenarioLoader> | null>(null)

async function saveTemplate(overwrite: boolean = false) {
  if (!templateName.value.trim()) return
  savingTemplate.value = true
  try {
    // Ensure the topology object we save has the new name/description
    const topology = exportTopology()
    topology.name = templateName.value
    topology.description = templateDescription.value || undefined
    
    const isOverwrite = overwrite && currentTemplateId.value
    
    const url = isOverwrite 
      ? `/api/templates/${currentTemplateId.value}` 
      : '/api/templates'
    
    const response = await fetch(url, {
      method: isOverwrite ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName.value,
        description: templateDescription.value || undefined,
        topology
      })
    })

    if (!response.ok) {
      throw new Error('Failed to save template')
    }

    const savedTemplate = await response.json()
    
    // Update local state to reflect the saved template
    currentTemplateId.value = savedTemplate.id
    currentTemplateName.value = savedTemplate.name
    topologyName.value = savedTemplate.name
    topologyDescription.value = savedTemplate.description || ''
    
    showSaveTemplateModal.value = false
    // Restore clean state
    templateName.value = ''
    templateDescription.value = ''
    saveSuccessMessage.value = 'Template saved successfully to library'
    setTimeout(() => saveSuccessMessage.value = null, 3000)
  } catch (err) {
    simulationError.value = 'Failed to save template'
    setTimeout(() => simulationError.value = null, 3000)
  } finally {
    savingTemplate.value = false
  }
}

function handleQuickSave() {
  if (currentTemplateId.value) {
    // Overwrite existing
    templateName.value = currentTemplateName.value || 'Untitled'
    saveTemplate(true)
  } else {
    // New template (Same as Save As)
    handleSaveAs()
  }
}

function handleSaveAs() {
  templateName.value = ''
  templateDescription.value = ''
  showSaveTemplateModal.value = true
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      importTopology(json)
    } catch (err) {
      console.error('Failed to import topology', err)
      alert('Failed to import topology: Invalid JSON')
    }
  }
  input.click()
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
  clearOutputFiles()

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
        globalMaxTokens: globalMaxTokens.value,
        globalReasoningEffort: globalReasoningEffort.value,
        globalThinking: globalThinking.value,
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
            } else if (event.type === 'complete') {
              // Store output files from the complete event
              if (event.outputFiles && Array.isArray(event.outputFiles)) {
                setOutputFiles(event.outputFiles)
              }
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
        <img src="/seed_logo.jpeg" class="h-8 w-8 rounded-lg object-cover" alt="SEED Logo" />
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center hidden">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="12" y1="8" x2="19" y2="16" />
          </svg>
        </div>
        
        <!-- Branding -->
        <div class="flex flex-col">
          <span class="font-bold text-gray-900 leading-tight tracking-tight">SEED</span>
          <span class="text-[9px] text-gray-500 leading-tight font-medium uppercase tracking-wider">Scalable & Evaluation-Driven</span>
        </div>

        <div class="h-8 w-px bg-gray-200 mx-2"></div>

        <!-- Template Context -->
        <div>
          <h1 class="text-sm font-semibold text-gray-900 tracking-tight">{{ topologyName || 'Agent Dashboard' }}</h1>
          <p class="text-xs text-gray-500 truncate max-w-md" :title="topologyDescription">{{ topologyDescription || 'Multi-agent orchestration sandbox' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Success toast -->
        <div
          v-if="saveSuccessMessage"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md animate-fade-in"
        >
          <CheckCircle class="w-4 h-4" />
          <span>{{ saveSuccessMessage }}</span>
        </div>

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
      <!-- Left: Global Settings -->
      <GlobalSettingsPanel 
        @save-template="handleQuickSave"
        @save-as-template="handleSaveAs"
        @open-loader="openScenarioLoader"
        @export-json="handleExport"
        @import-template="handleImport"
      />

      <!-- Center: Canvas -->
      <Canvas @node-click="toggleOutput" @load-scenario="openScenarioLoader" />

      <!-- Right: Properties -->
      <PropertiesPanel />
    </div>

    <!-- Modals & Drawers -->
    <SettingsModal :open="showSettings" @close="showSettings = false" />
    <OutputDrawer :open="showOutput" @close="showOutput = false" />
    <AboutModal :open="showAbout" @close="showAbout = false" />
    <ScenarioLoader ref="scenarioLoaderRef" />

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
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <textarea
              v-model="templateDescription"
              placeholder="Describe what this template does..."
              rows="3"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
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
              @click="saveTemplate(false)"
              :disabled="!templateName.trim() || savingTemplate"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ savingTemplate ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
