import { ref, computed } from 'vue'
import type { Topology, SimulationResult, SimulationResponse } from '../types'
import { scenarios } from '../scenarios'

interface BatchScenario {
  id: string
  name: string
  topology: Topology
  source: 'builtin' | 'uploaded'
}

interface BatchRun {
  scenarioId: string
  scenarioName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  results?: Record<string, SimulationResult>
  error?: string
  startTime?: number
  endTime?: number
}

interface BatchResults {
  batchId: string
  timestamp: string
  scenarios: Array<{
    id: string
    name: string
    status: 'completed' | 'failed'
    duration: number
    results?: Record<string, SimulationResult>
    error?: string
  }>
}

const selectedScenarioIds = ref<Set<string>>(new Set())
const uploadedScenarios = ref<BatchScenario[]>([])
const customTemplates = ref<BatchScenario[]>([])
const batchRuns = ref<BatchRun[]>([])
const isRunning = ref(false)
const currentIndex = ref(0)
const shouldCancel = ref(false)

// Load custom templates from API
async function loadCustomTemplatesForBatch() {
  try {
    const response = await fetch('/api/templates')
    if (response.ok) {
      const templates = await response.json()
      // Fetch full topology for each template
      const templatesWithTopology: BatchScenario[] = []
      for (const t of templates) {
        const fullResponse = await fetch(`/api/templates/${t.id}`)
        if (fullResponse.ok) {
          const full = await fullResponse.json()
          templatesWithTopology.push({
            id: `custom:${t.id}`,
            name: t.name,
            topology: full.topology,
            source: 'builtin' // Treat as builtin since it's from server
          })
        }
      }
      customTemplates.value = templatesWithTopology
    }
  } catch (err) {
    console.error('Failed to load custom templates:', err)
  }
}

export function useBatchProcessing() {
  const allScenarios = computed<BatchScenario[]>(() => {
    const builtin: BatchScenario[] = scenarios.map(s => ({
      id: s.id,
      name: s.name,
      topology: s.topology,
      source: 'builtin'
    }))
    return [...builtin, ...customTemplates.value, ...uploadedScenarios.value]
  })

  const selectedScenarios = computed<BatchScenario[]>(() => {
    return allScenarios.value.filter(s => selectedScenarioIds.value.has(s.id))
  })

  const totalSelected = computed(() => selectedScenarioIds.value.size)

  const completedCount = computed(() =>
    batchRuns.value.filter(r => r.status === 'completed' || r.status === 'failed').length
  )

  const progress = computed(() => {
    if (batchRuns.value.length === 0) return 0
    return Math.round((completedCount.value / batchRuns.value.length) * 100)
  })

  const currentScenario = computed(() => {
    if (!isRunning.value || currentIndex.value >= batchRuns.value.length) return null
    return batchRuns.value[currentIndex.value]
  })

  const hasResults = computed(() =>
    batchRuns.value.some(r => r.status === 'completed' || r.status === 'failed')
  )

  function toggleScenario(id: string) {
    if (selectedScenarioIds.value.has(id)) {
      selectedScenarioIds.value.delete(id)
    } else {
      selectedScenarioIds.value.add(id)
    }
  }

  function selectAll() {
    allScenarios.value.forEach(s => selectedScenarioIds.value.add(s.id))
  }

  function clearSelection() {
    selectedScenarioIds.value.clear()
  }

  function isSelected(id: string): boolean {
    return selectedScenarioIds.value.has(id)
  }

  async function uploadScenarios(files: FileList) {
    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        const topology: Topology = JSON.parse(text)

        const id = `uploaded-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        uploadedScenarios.value.push({
          id,
          name: topology.name || file.name.replace('.json', ''),
          topology,
          source: 'uploaded'
        })

        // Auto-select uploaded scenarios
        selectedScenarioIds.value.add(id)
      } catch (err) {
        console.error(`Failed to parse ${file.name}:`, err)
      }
    }
  }

  function removeUploadedScenario(id: string) {
    uploadedScenarios.value = uploadedScenarios.value.filter(s => s.id !== id)
    selectedScenarioIds.value.delete(id)
  }

  async function runBatch(
    apiKey: string,
    apiEndpoint?: string,
    globalModel?: string,
    globalTemperature?: number,
    globalBehaviorPreset?: string
  ): Promise<boolean> {
    if (!apiKey) {
      return false
    }

    if (selectedScenarios.value.length === 0) {
      return false
    }

    // Initialize batch runs
    batchRuns.value = selectedScenarios.value.map(s => ({
      scenarioId: s.id,
      scenarioName: s.name,
      status: 'pending' as const
    }))

    isRunning.value = true
    shouldCancel.value = false
    currentIndex.value = 0

    for (let i = 0; i < batchRuns.value.length; i++) {
      if (shouldCancel.value) {
        break
      }

      currentIndex.value = i
      const run = batchRuns.value[i]
      if (!run) continue

      const scenario = selectedScenarios.value.find(s => s.id === run.scenarioId)
      if (!scenario) continue

      run.status = 'running'
      run.startTime = Date.now()

      try {
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topology: scenario.topology,
            apiKey,
            apiEndpoint,
            globalModel,
            globalTemperature,
            globalBehaviorPreset
          })
        })

        const data: SimulationResponse = await response.json()

        run.endTime = Date.now()

        if (data.success) {
          run.status = 'completed'
          run.results = data.results
        } else {
          run.status = 'failed'
          run.error = data.error || 'Unknown error'
        }
      } catch (err) {
        run.endTime = Date.now()
        run.status = 'failed'
        run.error = err instanceof Error ? err.message : 'Network error'
      }
    }

    isRunning.value = false
    return true
  }

  function cancelBatch() {
    shouldCancel.value = true
  }

  function downloadResults() {
    const results: BatchResults = {
      batchId: `batch-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenarios: batchRuns.value
        .filter(r => r.status === 'completed' || r.status === 'failed')
        .map(r => ({
          id: r.scenarioId,
          name: r.scenarioName,
          status: r.status as 'completed' | 'failed',
          duration: (r.endTime || 0) - (r.startTime || 0),
          results: r.results,
          error: r.error
        }))
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-results-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearBatch() {
    batchRuns.value = []
    currentIndex.value = 0
  }

  return {
    // State
    selectedScenarioIds,
    uploadedScenarios,
    batchRuns,
    isRunning,
    currentIndex,

    // Computed
    allScenarios,
    selectedScenarios,
    totalSelected,
    completedCount,
    progress,
    currentScenario,
    hasResults,

    // Methods
    toggleScenario,
    selectAll,
    clearSelection,
    isSelected,
    uploadScenarios,
    removeUploadedScenario,
    runBatch,
    cancelBatch,
    downloadResults,
    clearBatch,
    loadCustomTemplatesForBatch
  }
}
