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
  totalFiles?: number
  processedFiles?: number
  currentFile?: string
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
    globalBehaviorPreset?: string,
    endpointConfigs?: any[]
  ): Promise<boolean> {
    console.log('[Batch] Starting runBatch. Selected:', selectedScenarios.value.length)
    if (!apiKey) {
      console.error('[Batch] No API Key')
      return false
    }

    if (selectedScenarios.value.length === 0) {
      return false
    }

    // Initialize batch runs
    batchRuns.value = selectedScenarios.value.map(s => ({
      scenarioId: s.id,
      scenarioName: s.name,
      status: 'pending' as const,
      totalFiles: 0,
      processedFiles: 0
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
      run.results = {}

      try {
        // Check for folder inputs
        const topology = scenario.topology
        console.log('[Batch] Checking topology:', scenario.name)
        let workItems: Array<{ path?: string, nodeId?: string }> = []

        // Find folder nodes
        // Note: Check both snake_case and camelCase just in case of inconsistency
        const folderNodes = (topology.inputNodes || []).filter((n: any) =>
          (n.inputMode === 'folder' || n.input_mode === 'folder') &&
          (n.inputPath || n.input_path)
        )

        if (folderNodes.length > 0) {
          console.log('[Batch] Found folder nodes:', folderNodes.length)
          // Batch Mode: Iterate files
          // Use the first folder node as driver
          const driverNode = folderNodes[0]!
          const path = (driverNode as any).inputPath || (driverNode as any).input_path
          const nodeId = driverNode.id

          console.log('[Batch] Fetching files from:', path)
          // Fetch file list
          const browseRes = await fetch('/api/browse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
          })

          if (browseRes.ok) {
            const data = await browseRes.json()
            // Filter JSON files
            const jsonFiles = data.items.filter((item: any) => !item.is_dir && item.name.toLowerCase().endsWith('.json'))

            console.log('[Batch] JSON files found:', jsonFiles.length)
            if (jsonFiles.length === 0) {
              console.warn(`[Batch] No JSON files in ${path}`)
              throw new Error(`No JSON files found in ${path}`)
            }

            workItems = jsonFiles.map((item: any) => ({ path: item.path, nodeId }))
          } else {
            console.error('[Batch] Browse failed:', browseRes.status)
            throw new Error(`Failed to list files in ${path}`)
          }
        } else {
          console.log('[Batch] Running single pass (Text/Single File)')
          // Standard Mode: Single run
          workItems.push({})
        }

        run.totalFiles = workItems.length
        run.processedFiles = 0

        if (workItems.length === 0) {
          run.status = 'failed'
          run.error = 'No files to process'
          run.endTime = Date.now()
          continue
        }

        // Iterate work items
        for (const item of workItems) {
          if (shouldCancel.value) break

          // Update status per file
          if (item.path) {
            run.currentFile = item.path.split(/[/\\]/).pop()
            console.log('[Batch] Processing:', run.currentFile)
          }

          // prepare topology clone
          const currentTopology = JSON.parse(JSON.stringify(topology))

          // Override input if needed
          if (item.path && item.nodeId) {
            const node = (currentTopology.inputNodes || []).find((n: any) => n.id === item.nodeId)
            if (node) {
              console.log('[Batch] Overriding input node:', node.id, item.path)
              // Set to file mode so backend processes it as single file
              // Note: We depend on backend orchestrator supporting 'file' mode auto-loading
              node.inputMode = 'file'
              node.input_mode = 'file'
              node.inputPath = item.path
              node.input_path = item.path
            }
          }

          console.log('[Batch] Sending simulate request...')
          const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topology: currentTopology,
              apiKey,
              apiEndpoint,
              globalModel,
              globalTemperature,
              globalBehaviorPreset,
              endpointConfigs,
              stream: false // Sync mode
            })
          })

          console.log('[Batch] Response status:', response.status)

          if (!response.ok) {
            // Log but continue?
            console.error(`HTTP error ${response.status} for ${run.currentFile || 'template'}`)
            // Store error?
            run.error = `Partially failed: ${response.status}`
          } else {
            const data: SimulationResponse = await response.json()
            if (data.success) {
              // LOG SERVER DEBUG LOGS
              if ((data as any).debugLogs) {
                console.log('[Batch] Server Debug Logs:\n', ((data as any).debugLogs || []).join('\n'))
              } else {
                console.log('[Batch] No Server Debug Logs returned')
              }

              console.log('[Batch] Success result keys:', Object.keys(data.results || {}))
              // Merge results
              run.results = { ...run.results, ...data.results }
            } else {
              console.error(`Error processing ${run.currentFile}:`, data.error)
              run.error = data.error || 'Partial error'
            }
          }

          run.processedFiles++
        }

        run.endTime = Date.now()
        run.status = run.error ? 'failed' : 'completed' // Or completed with warnings?
        // If we processed at least some files and got results, maybe consider completed?
        if (run.processedFiles > 0 && run.results && Object.keys(run.results).length > 0) {
          run.status = 'completed'
        }

        run.currentFile = undefined

      } catch (err) {
        console.error('[Batch] Run error:', err)
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
