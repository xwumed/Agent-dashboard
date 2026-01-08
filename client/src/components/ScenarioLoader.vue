<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import { scenarios } from '../scenarios'
import type { ScenarioCategory } from '../types'

const { importTopology } = useTopology()

const isOpen = ref(false)

const categoryLabels: Record<ScenarioCategory, string> = {
  'regulatory': 'Regulatory & Submissions',
  'strategy': 'Strategy & Business',
  'clinical': 'Clinical Development',
  'clinical-decisions': 'Clinical Decisions',
  'evidence': 'Evidence Generation',
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

const expandedCategories = ref<Set<ScenarioCategory>>(new Set(['clinical-decisions', 'clinical']))

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

function loadScenario(scenarioId: string) {
  const scenario = scenarios.find(s => s.id === scenarioId)
  if (scenario) {
    importTopology(scenario.topology)
  }
  isOpen.value = false
}

function open() {
  isOpen.value = true
}

defineExpose({ open })
</script>

<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
    >
      <FlaskConical class="w-3.5 h-3.5" />
      Scenarios
      <ChevronDown class="w-3.5 h-3.5 transition-transform" :class="isOpen ? 'rotate-180' : ''" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-[70vh] overflow-y-auto"
    >
      <div class="px-3 py-2 border-b border-gray-100">
        <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Simulation Templates</p>
      </div>

      <div v-for="group in groupedScenarios" :key="group.category">
        <!-- Category Header -->
        <button
          @click="toggleCategory(group.category)"
          class="w-full px-3 py-2 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <ChevronRight
            class="w-3.5 h-3.5 text-gray-400 transition-transform"
            :class="expandedCategories.has(group.category) ? 'rotate-90' : ''"
          />
          <span class="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{{ group.label }}</span>
          <span class="text-[10px] text-gray-400 ml-auto">{{ group.scenarios.length }}</span>
        </button>

        <!-- Scenarios in Category -->
        <div v-if="expandedCategories.has(group.category)">
          <button
            v-for="scenario in group.scenarios"
            :key="scenario.id"
            @click="loadScenario(scenario.id)"
            class="w-full px-3 py-2.5 pl-8 text-left hover:bg-blue-50 transition-colors border-b border-gray-50"
          >
            <div class="font-medium text-xs text-gray-900">{{ scenario.name }}</div>
            <div class="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{{ scenario.description }}</div>
          </button>
        </div>
      </div>

      <div v-if="groupedScenarios.length === 0" class="px-3 py-4 text-xs text-gray-400 text-center">
        No scenarios available
      </div>
    </div>

    <!-- Backdrop to close dropdown -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    />
  </div>
</template>
