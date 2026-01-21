<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronRight, FlaskConical, Star, Trash2, Edit2, Upload, Cpu, FileUp } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import { scenarios } from '../scenarios'
import type { ScenarioCategory } from '../types'

const { importTopology, setCurrentTemplate } = useTopology()

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
  // Summary stats
  agent_count?: number
  model_summary?: string
  input_summary?: string
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
    setCurrentTemplate(null, null)  // Clear template context for preset scenarios
  }
  isOpen.value = false
}

async function loadCustomTemplate(templateId: string) {
  try {
    const response = await fetch(`/api/templates/${templateId}`)
    if (response.ok) {
      const template = await response.json()
      // Ensure topology data matches template metadata (Source of Truth)
      if (template.topology) {
        template.topology.name = template.name
        template.topology.description = template.description
      }
      importTopology(template.topology)
      setCurrentTemplate(templateId, template.name)  // Track loaded template
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
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" @click.self="isOpen = false">
    <div class="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <!-- Modal Header -->
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div class="flex items-center gap-2">
          <FlaskConical class="w-4 h-4 text-primary-600" />
          <h3 class="font-semibold text-gray-900">Scenario Library</h3>
        </div>
        <button @click="isOpen = false" class="text-gray-400 hover:text-gray-600 transition-colors">
          <span class="sr-only">Close</span>
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-white">
        <p class="text-xs text-gray-500">Select a template to load</p>
        <div class="flex items-center gap-2">
          <button
            @click="handleUploadClick"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
            title="Upload JSON template file"
          >
            <Upload class="w-3.5 h-3.5" />
            Upload JSON
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>
      </div>

      <!-- Content (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">

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
              
              <!-- Stats Badges -->
              <div class="flex items-center gap-2 mt-1.5 overflow-hidden">
                <!-- Agent Count -->
                <div v-if="template.agent_count !== undefined" class="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">
                  <Cpu class="w-3 h-3 opacity-70 scale-90" v-if="false" />
                  <span class="font-semibold text-xs">{{ template.agent_count }}</span>
                  <span class="text-[9px] uppercase">Agents</span>
                </div>
                <!-- Model -->
                <div v-if="template.model_summary" class="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] text-blue-700 truncate max-w-[100px]" title="Global Model">
                  <Cpu class="w-3 h-3 opacity-70" />
                  <span class="truncate">{{ template.model_summary }}</span>
                </div>
                <!-- Inputs -->
                <div v-if="template.input_summary" class="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[10px] text-green-700 truncate max-w-[80px]" title="Inputs">
                  <FileUp class="w-3 h-3 opacity-70" />
                  <span class="truncate">{{ template.input_summary }}</span>
                </div>
              </div>
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
    </div>
  </div>

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

</template>
