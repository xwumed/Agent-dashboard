<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronDown, ChevronRight, FlaskConical, Star, Trash2, Edit2, Upload } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import { scenarios } from '../scenarios'
import type { ScenarioCategory } from '../types'

const { importTopology } = useTopology()

const isOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleUploadClick() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const topology = JSON.parse(e.target?.result as string)
      importTopology(topology)
      isOpen.value = false
    } catch (err) {
      console.error('Invalid JSON file:', err)
    }
  }
  reader.readAsText(file)
  input.value = '' // Reset for re-upload
}

// Custom templates from API
interface TemplateMetadata {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}
const customTemplates = ref<TemplateMetadata[]>([])
const loadingTemplates = ref(false)

const categoryLabels: Record<ScenarioCategory | 'my-templates', string> = {
  'my-templates': 'My Templates',
  'regulatory': 'Regulatory & Submissions',
  'strategy': 'Strategy & Business',
  'clinical': 'Clinical Development',
  'clinical-decisions': 'Clinical Decisions',
  'evidence': 'Evidence Generation',
  'documentation': 'Documentation'
}

const categoryOrder: (ScenarioCategory | 'my-templates')[] = [
  'my-templates',
  'clinical-decisions',
  'clinical',
  'regulatory',
  'strategy',
  'evidence',
  'documentation'
]

const expandedCategories = ref<Set<ScenarioCategory | 'my-templates'>>(new Set(['my-templates', 'clinical-decisions']))

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
    .filter(cat => cat === 'my-templates' ? customTemplates.value.length > 0 : groups[cat as ScenarioCategory]?.length > 0)
    .map(cat => ({
      category: cat,
      label: categoryLabels[cat],
      scenarios: cat === 'my-templates' ? [] : groups[cat as ScenarioCategory],
      isCustom: cat === 'my-templates'
    }))
})

async function loadCustomTemplates() {
  loadingTemplates.value = true
  try {
    const response = await fetch('/api/templates')
    if (response.ok) {
      customTemplates.value = await response.json()
    }
  } catch (err) {
    console.error('Failed to load templates:', err)
  } finally {
    loadingTemplates.value = false
  }
}

function toggleCategory(category: ScenarioCategory | 'my-templates') {
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

async function loadCustomTemplate(templateId: string) {
  try {
    const response = await fetch(`/api/templates/${templateId}`)
    if (response.ok) {
      const template = await response.json()
      importTopology(template.topology)
      isOpen.value = false
    }
  } catch (err) {
    console.error('Failed to load template:', err)
  }
}

async function deleteTemplate(templateId: string, event: Event) {
  event.stopPropagation()
  if (!confirm('Delete this template?')) return
  try {
    await fetch(`/api/templates/${templateId}`, { method: 'DELETE' })
    loadCustomTemplates()
  } catch (err) {
    console.error('Failed to delete template:', err)
  }
}

// Edit template state
const editingTemplate = ref<TemplateMetadata | null>(null)
const editName = ref('')
const editDescription = ref('')

function startEditTemplate(template: TemplateMetadata, event: Event) {
  event.stopPropagation()
  editingTemplate.value = template
  editName.value = template.name
  editDescription.value = template.description || ''
}

async function saveTemplateEdit() {
  if (!editingTemplate.value || !editName.value.trim()) return
  try {
    await fetch(`/api/templates/${editingTemplate.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.value,
        description: editDescription.value || null
      })
    })
    editingTemplate.value = null
    loadCustomTemplates()
  } catch (err) {
    console.error('Failed to update template:', err)
  }
}

function cancelEdit() {
  editingTemplate.value = null
}

function open() {
  isOpen.value = true
}

// Load templates when opened
watch(isOpen, (open) => {
  if (open) loadCustomTemplates()
})

onMounted(loadCustomTemplates)

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
      <div class="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Simulation Templates</p>
        <button
          @click="handleUploadClick"
          class="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700 font-medium"
          title="Upload JSON template file"
        >
          <Upload class="w-3 h-3" />
          Upload
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileUpload"
        />
      </div>

      <div v-for="group in groupedScenarios" :key="group.category">
        <!-- Category Header -->
        <button
          @click="toggleCategory(group.category)"
          class="w-full px-3 py-2 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <Star v-if="group.isCustom" class="w-3.5 h-3.5 text-amber-500" />
          <ChevronRight
            v-else
            class="w-3.5 h-3.5 text-gray-400 transition-transform"
            :class="expandedCategories.has(group.category) ? 'rotate-90' : ''"
          />
          <span class="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{{ group.label }}</span>
          <span class="text-[10px] text-gray-400 ml-auto">
            {{ group.isCustom ? customTemplates.length : group.scenarios.length }}
          </span>
        </button>

        <!-- Custom Templates (My Templates) -->
        <div v-if="group.isCustom && expandedCategories.has(group.category)">
          <button
            v-for="template in customTemplates"
            :key="template.id"
            @click="loadCustomTemplate(template.id)"
            class="w-full px-3 py-2.5 pl-8 text-left hover:bg-amber-50 transition-colors border-b border-gray-50 flex items-center justify-between group"
          >
            <div class="min-w-0 flex-1">
              <div class="font-medium text-xs text-gray-900">{{ template.name }}</div>
              <div class="text-[11px] text-gray-500 mt-0.5 truncate">{{ template.description || 'No description' }}</div>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="startEditTemplate(template, $event)"
                class="p-1 text-gray-300 hover:text-blue-500"
                title="Edit template"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
              <button
                @click="deleteTemplate(template.id, $event)"
                class="p-1 text-gray-300 hover:text-red-500"
                title="Delete template"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </button>
          <div v-if="customTemplates.length === 0 && !loadingTemplates" class="px-8 py-3 text-[11px] text-gray-400 italic">
            No saved templates yet. Save your first template!
          </div>
        </div>

        <!-- Preset Scenarios in Category -->
        <div v-else-if="!group.isCustom && expandedCategories.has(group.category)">
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

    <!-- Edit Template Modal -->
    <div v-if="editingTemplate" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="cancelEdit"></div>
      <div class="relative bg-white rounded-lg shadow-xl w-80 p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Edit Template</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              v-model="editName"
              type="text"
              class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              v-model="editDescription"
              rows="2"
              class="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-600 resize-none"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              @click="cancelEdit"
              class="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              @click="saveTemplateEdit"
              :disabled="!editName.trim()"
              class="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
