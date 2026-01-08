<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  Play,
  Square,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  FolderOpen
} from 'lucide-vue-next'
import { useBatchProcessing } from '../composables/useBatchProcessing'
import { useTopology } from '../composables/useTopology'
import { scenarios } from '../scenarios'
import type { ScenarioCategory } from '../types'

const { apiKey, apiEndpoint } = useTopology()
const {
  uploadedScenarios,
  batchRuns,
  isRunning,
  totalSelected,
  progress,
  currentScenario,
  hasResults,
  toggleScenario,
  selectAll,
  clearSelection,
  isSelected,
  uploadScenarios,
  removeUploadedScenario,
  runBatch,
  cancelBatch,
  downloadResults,
  clearBatch
} = useBatchProcessing()

const isExpanded = ref(false)
const expandedCategories = ref<Set<ScenarioCategory>>(new Set())
const fileInputRef = ref<HTMLInputElement | null>(null)
const error = ref<string | null>(null)

const categoryLabels: Record<ScenarioCategory, string> = {
  'regulatory': 'Regulatory',
  'strategy': 'Strategy',
  'clinical': 'Clinical Dev',
  'clinical-decisions': 'Clinical Decisions',
  'evidence': 'Evidence',
  'documentation': 'Documentation'
}

const categoryOrder: ScenarioCategory[] = [
  'clinical-decisions',
  'clinical',
  'regulatory',
  'strategy',
  'evidence',
  'documentation'
]

const groupedScenarios = computed(() => {
  const groups: Record<ScenarioCategory, typeof scenarios> = {
    'regulatory': [],
    'strategy': [],
    'clinical': [],
    'clinical-decisions': [],
    'evidence': [],
    'documentation': []
  }

  scenarios.forEach(scenario => {
    if (groups[scenario.category]) {
      groups[scenario.category].push(scenario)
    }
  })

  return categoryOrder
    .filter(cat => groups[cat].length > 0)
    .map(cat => ({
      category: cat,
      label: categoryLabels[cat],
      scenarios: groups[cat]
    }))
})

function toggleCategory(category: ScenarioCategory) {
  if (expandedCategories.value.has(category)) {
    expandedCategories.value.delete(category)
  } else {
    expandedCategories.value.add(category)
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    uploadScenarios(input.files)
    input.value = ''
  }
}

async function handleRunBatch() {
  error.value = null

  if (!apiKey.value) {
    error.value = 'API key required'
    return
  }

  if (totalSelected.value === 0) {
    error.value = 'Select scenarios'
    return
  }

  await runBatch(apiKey.value, apiEndpoint.value)
}

function getRunStatus(scenarioId: string) {
  return batchRuns.value.find(r => r.scenarioId === scenarioId)
}
</script>

<template>
  <div class="border-t border-gray-100">
    <!-- Header -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <h2 class="font-medium text-gray-900 text-xs uppercase tracking-wider">Batch</h2>
      <div class="flex items-center gap-2">
        <span v-if="totalSelected > 0" class="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
          {{ totalSelected }}
        </span>
        <ChevronDown
          class="w-3.5 h-3.5 text-gray-400 transition-transform"
          :class="isExpanded ? 'rotate-180' : ''"
        />
      </div>
    </button>

    <div v-if="isExpanded" class="px-3 pb-3 space-y-2">
      <!-- Error message -->
      <div v-if="error" class="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
        {{ error }}
      </div>

      <!-- Progress bar (during execution) -->
      <div v-if="isRunning" class="space-y-1">
        <div class="flex items-center justify-between text-[10px]">
          <span class="text-gray-500 truncate flex-1">{{ currentScenario?.scenarioName }}</span>
          <span class="text-gray-400">{{ progress }}%</span>
        </div>
        <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-green-500 transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- Scenario selection -->
      <div class="max-h-40 overflow-y-auto border border-gray-100 rounded-md">
        <!-- Built-in scenarios by category -->
        <div v-for="group in groupedScenarios" :key="group.category">
          <button
            @click="toggleCategory(group.category)"
            class="w-full px-2 py-1.5 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-left border-b border-gray-100"
          >
            <ChevronRight
              class="w-3 h-3 text-gray-400 transition-transform flex-shrink-0"
              :class="expandedCategories.has(group.category) ? 'rotate-90' : ''"
            />
            <span class="text-[10px] font-medium text-gray-600 truncate">{{ group.label }}</span>
            <span class="text-[9px] text-gray-400 ml-auto">{{ group.scenarios.length }}</span>
          </button>

          <div v-if="expandedCategories.has(group.category)">
            <label
              v-for="scenario in group.scenarios"
              :key="scenario.id"
              class="flex items-center gap-2 px-2 py-1.5 pl-5 hover:bg-blue-50 cursor-pointer border-b border-gray-50"
            >
              <input
                type="checkbox"
                :checked="isSelected(scenario.id)"
                @change="toggleScenario(scenario.id)"
                class="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-[10px] text-gray-700 truncate flex-1">{{ scenario.name }}</span>
              <!-- Status indicator -->
              <CheckCircle v-if="getRunStatus(scenario.id)?.status === 'completed'" class="w-3 h-3 text-green-500 flex-shrink-0" />
              <XCircle v-else-if="getRunStatus(scenario.id)?.status === 'failed'" class="w-3 h-3 text-red-500 flex-shrink-0" />
              <Loader2 v-else-if="getRunStatus(scenario.id)?.status === 'running'" class="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />
            </label>
          </div>
        </div>

        <!-- Uploaded scenarios -->
        <div v-if="uploadedScenarios.length > 0">
          <div class="px-2 py-1.5 bg-gray-50 border-b border-gray-100">
            <span class="text-[10px] font-medium text-gray-600">Uploaded</span>
          </div>
          <label
            v-for="scenario in uploadedScenarios"
            :key="scenario.id"
            class="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50"
          >
            <input
              type="checkbox"
              :checked="isSelected(scenario.id)"
              @change="toggleScenario(scenario.id)"
              class="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-[10px] text-gray-700 truncate flex-1">{{ scenario.name }}</span>
            <button
              @click.stop="removeUploadedScenario(scenario.id)"
              class="text-gray-400 hover:text-red-500"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </label>
        </div>
      </div>

      <!-- Selection controls -->
      <div class="flex items-center gap-1">
        <button
          @click="selectAll"
          class="text-[10px] text-primary-600 hover:text-primary-700 px-1.5 py-0.5"
        >
          All
        </button>
        <span class="text-gray-300">|</span>
        <button
          @click="clearSelection"
          class="text-[10px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5"
        >
          None
        </button>
        <div class="flex-1" />
        <button
          @click="fileInputRef?.click()"
          class="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <FolderOpen class="w-3 h-3" />
          Upload
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-1.5">
        <button
          v-if="!isRunning"
          @click="handleRunBatch"
          :disabled="totalSelected === 0"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play class="w-3 h-3" />
          Run ({{ totalSelected }})
        </button>

        <button
          v-else
          @click="cancelBatch"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
        >
          <Square class="w-3 h-3" />
          Cancel
        </button>

        <button
          v-if="hasResults"
          @click="downloadResults"
          class="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          title="Download results"
        >
          <Download class="w-3 h-3" />
        </button>

        <button
          v-if="hasResults && !isRunning"
          @click="clearBatch"
          class="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Clear results"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>
