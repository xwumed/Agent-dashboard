<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown, ChevronUp, Trash2, HelpCircle, BookOpen, Wrench, Lock, Copy, Check, Clock, Zap, AlertCircle, Edit3 } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import { buildPrompt } from '../utils/promptBuilder'
import type { BehaviorPreset, ModelType, SuspicionLevel, RogueProfile, AgentTool } from '../types'

// Available tools from backend
interface ToolDef {
  id: string
  name: string
  description: string
  category: string
}
const availableTools = ref<ToolDef[]>([])

async function loadTools() {
  try {
    const response = await fetch('/api/tools')
    if (response.ok) {
      availableTools.value = await response.json()
    }
  } catch (err) {
    console.error('Failed to load tools:', err)
  }
}

onMounted(loadTools)

// Educational tooltip content for pharma R&D context
const tooltips = {
  behaviorPreset: 'Sets the cognitive style. Analytical: rigorous, evidence-based (ideal for regulatory review). Creative: explores novel hypotheses. Adversarial: challenges assumptions (useful for safety review). Balanced: adaptive approach.',
  temperature: 'Controls response variability. Low (0.0-0.3): consistent, precise outputs ideal for regulatory documents. Medium (0.4-0.7): balanced creativity. High (0.8+): diverse, exploratory outputs for brainstorming.',
  model: 'GPT-5 Nano: fast, cost-effective for routine tasks. GPT-5 Mini: balanced for most analyses. GPT-5.2: most capable, best for complex scientific reasoning.',
  oversight: 'Designates this agent as a senior reviewer who synthesizes inputs from other agents. In pharma: think of a Protocol Review Chair or Chief Medical Officer role.',
  suspicion: 'Trusting: accepts inputs at face value. Suspicious: actively cross-checks claims and identifies inconsistencies. Use suspicious for safety-critical reviews.',
  rogueMode: 'Enables adversarial behavior to stress-test your multi-agent system. Useful for identifying blind spots in safety reviews or testing oversight effectiveness.',
  skills: 'Markdown documents providing domain knowledge and custom instructions. Examples: ICH Guidelines, FDA Submission Requirements, Clinical Trial Design Best Practices.',
  tools: 'External MCP server tools the agent can invoke. Examples: PubMed Search, Clinical Trials Database, Drug Interaction Checker, Literature Summarizer.'
}

const {
  selectedItem,
  updateNode,
  removeNode,
  edges,
  simulationResults,
  getOutputNodeResult,
  globalModel
} = useTopology()

// Check if selected node has simulation results (for agent nodes)
const nodeResult = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'agent') return null
  return simulationResults.value[selectedItem.value.data.id] || null
})

// For output nodes, get aggregated results from connected agents
const outputNodeContent = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'output') return ''
  return getOutputNodeResult(selectedItem.value.data.id)
})

// Check if there are any simulation results at all
const hasAnyResults = computed(() => Object.keys(simulationResults.value).length > 0)

const hasResult = computed(() => {
  if (!selectedItem.value) return false
  if (selectedItem.value.type === 'agent') return nodeResult.value !== null
  if (selectedItem.value.type === 'output') return outputNodeContent.value.length > 0
  if (selectedItem.value.type === 'input') return true // Input always has content (the task)
  return false
})

// View mode: 'results' when we have results, 'edit' for configuration
const viewMode = ref<'results' | 'edit'>('results')

// Get selected agent data (type-safe access for agent nodes in edit form)
const selectedAgent = computed(() => {
  if (selectedItem.value?.type === 'agent') {
    return selectedItem.value.data as import('../types').AgentNodeData
  }
  return null
})

// Copy functionality
const copied = ref(false)
async function copyOutput() {
  let textToCopy = ''
  if (selectedItem.value?.type === 'agent' && nodeResult.value?.output) {
    textToCopy = nodeResult.value.output
  } else if (selectedItem.value?.type === 'output') {
    textToCopy = outputNodeContent.value
  } else if (selectedItem.value?.type === 'input') {
    textToCopy = (selectedItem.value.data as { task: string }).task || ''
  }

  if (textToCopy) {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

const showAdvanced = ref(false)

// Compute the generated prompt based on current settings
const generatedPrompt = computed(() => {
  if (!selectedAgent.value) return ''
  // Count incoming edges to this node
  const incomingCount = edges.value.filter(e => e.target === selectedAgent.value?.id).length
  return buildPrompt(selectedAgent.value, incomingCount)
})

const behaviorPresets: { value: BehaviorPreset; label: string }[] = [
  { value: 'analytical', label: 'Analytical' },
  { value: 'creative', label: 'Creative' },
  { value: 'adversarial', label: 'Adversarial' },
  { value: 'balanced', label: 'Balanced' }
]

const models: { value: ModelType; label: string }[] = [
  // OpenAI models
  { value: 'gpt-5.2', label: 'GPT-5.2 (OpenAI)' },
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  // Local models from config.toml
  { value: 'Llama-4-Maverick-17B-128E-Instruct-FP8', label: 'Llama-4 Maverick (Local)' },
  { value: 'GPT-OSS-120B', label: 'GPT-OSS-120B (Local)' },
  { value: 'GLM-4.7-FP8', label: 'GLM-4.7 (Local)' },
  // Legacy
  { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' }
]

const suspicionLevels: { value: SuspicionLevel; label: string }[] = [
  { value: 'trusting', label: 'Trusting' },
  { value: 'suspicious', label: 'Suspicious' }
]

const rogueProfiles: { value: RogueProfile; label: string; description: string }[] = [
  { value: 'hallucination', label: 'Hallucination', description: 'Generates plausible but false data' },
  { value: 'omission', label: 'Omission', description: 'Deliberately omits critical information' },
  { value: 'contradiction', label: 'Contradiction', description: 'Contradicts other agents' },
  { value: 'ignore-constraints', label: 'Ignore Constraints', description: 'Ignores specified rules' }
]

function updateField<K extends keyof NonNullable<typeof selectedAgent.value>>(
  field: K,
  value: NonNullable<typeof selectedAgent.value>[K]
) {
  if (selectedAgent.value) {
    updateNode(selectedAgent.value.id, { [field]: value })
  }
}

function toggleRogueMode() {
  if (selectedAgent.value) {
    const newEnabled = !selectedAgent.value.rogueMode.enabled
    updateNode(selectedAgent.value.id, {
      rogueMode: {
        enabled: newEnabled,
        profile: newEnabled ? 'hallucination' : undefined
      }
    })
  }
}

function updateRogueProfile(profile: RogueProfile) {
  if (selectedAgent.value) {
    updateNode(selectedAgent.value.id, {
      rogueMode: {
        enabled: true,
        profile
      }
    })
  }
}

function deleteNode() {
  if (selectedAgent.value) {
    removeNode(selectedAgent.value.id)
  }
}

function toggleTool(tool: ToolDef) {
  if (!selectedAgent.value) return
  
  const currentTools = selectedAgent.value.tools || []
  const exists = currentTools.some((t: AgentTool) => t.id === tool.id)
  
  let newTools: AgentTool[]
  if (exists) {
    newTools = currentTools.filter((t: AgentTool) => t.id !== tool.id)
  } else {
    newTools = [...currentTools, { id: tool.id, name: tool.name, description: tool.description }]
  }
  
  updateNode(selectedAgent.value.id, { tools: newTools })
}
</script>

<template>
  <div class="w-72 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <h2 class="font-medium text-gray-900 text-xs uppercase tracking-wider">
          {{ selectedItem?.type === 'input' ? 'Input' : selectedItem?.type === 'output' ? 'Output' : (hasResult ? 'Results' : 'Properties') }}
        </h2>
        <!-- Tab switcher when agent has results -->
        <div v-if="selectedItem?.type === 'agent' && hasResult" class="flex gap-1">
          <button
            @click="viewMode = 'results'"
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="viewMode === 'results' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'"
          >
            Output
          </button>
          <button
            @click="viewMode = 'edit'"
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="viewMode === 'edit' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'"
          >
            <Edit3 class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- No selection state -->
    <div v-if="!selectedItem" class="flex-1 flex items-center justify-center p-6">
      <p class="text-xs text-gray-400 text-center leading-relaxed">
        Select a node on the canvas<br />to view its properties
      </p>
    </div>

    <!-- INPUT NODE VIEW -->
    <div v-else-if="selectedItem.type === 'input'" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Input Node</label>
        <div class="text-sm font-medium text-gray-900">Master Task</div>
      </div>

      <!-- Task content -->
      <div class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium text-gray-500">Task Description</label>
          <button
            @click="copyOutput"
            class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <component :is="copied ? Check : Copy" class="w-3 h-3" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <div class="flex-1 bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-gray-700 whitespace-pre-wrap break-words overflow-y-auto max-h-[400px] leading-relaxed">{{ (selectedItem.data as any).task || 'No task defined' }}</div>
      </div>
    </div>

    <!-- OUTPUT NODE VIEW -->
    <div v-else-if="selectedItem.type === 'output'" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Output Node</label>
        <div class="text-sm font-medium text-gray-900">{{ (selectedItem.data as any).label || 'Final Output' }}</div>
      </div>

      <!-- Aggregated output content -->
      <div v-if="outputNodeContent" class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium text-gray-500">Aggregated Results</label>
          <button
            @click="copyOutput"
            class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <component :is="copied ? Check : Copy" class="w-3 h-3" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <div class="flex-1 bg-green-50 border border-green-200 rounded-md p-3 text-xs text-gray-700 whitespace-pre-wrap break-words overflow-y-auto max-h-[400px] font-mono leading-relaxed">{{ outputNodeContent }}</div>
      </div>

      <!-- No results yet -->
      <div v-else class="text-xs text-gray-400 italic">
        {{ hasAnyResults ? 'No connected agents have results yet' : 'Run simulation to see aggregated results' }}
      </div>
    </div>

    <!-- AGENT NODE - Results View (when we have results and viewMode is 'results') -->
    <div v-else-if="selectedItem.type === 'agent' && hasResult && viewMode === 'results'" class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Agent Name (read-only) -->
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Agent</label>
        <div class="text-sm font-medium text-gray-900">{{ selectedAgent?.name }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ selectedAgent?.role }}</div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-gray-50 rounded-md p-2">
          <div class="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <Clock class="w-3 h-3" />
            Duration
          </div>
          <div class="text-sm font-medium text-gray-900">
            {{ nodeResult?.duration ? (nodeResult.duration / 1000).toFixed(1) + 's' : '-' }}
          </div>
        </div>
        <div class="bg-gray-50 rounded-md p-2">
          <div class="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <Zap class="w-3 h-3" />
            Tokens
          </div>
          <div class="text-sm font-medium text-gray-900">
            {{ nodeResult?.tokens ? (nodeResult.tokens.prompt + nodeResult.tokens.completion).toLocaleString() : '-' }}
          </div>
        </div>
      </div>

      <!-- Model info (shows global model) -->
      <div class="text-xs text-gray-500">
        Model: <span class="font-medium text-gray-700">{{ nodeResult?.model || globalModel }}</span>
      </div>

      <!-- Error display -->
      <div v-if="nodeResult?.error" class="bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex items-center gap-1.5 text-xs font-medium text-red-700 mb-1">
          <AlertCircle class="w-3.5 h-3.5" />
          Error
        </div>
        <div class="text-xs text-red-600 whitespace-pre-wrap break-words">{{ nodeResult.error }}</div>
      </div>

      <!-- Output -->
      <div v-if="nodeResult?.output" class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium text-gray-500">Output</label>
          <button
            @click="copyOutput"
            class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <component :is="copied ? Check : Copy" class="w-3 h-3" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <div class="flex-1 bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-700 whitespace-pre-wrap break-words overflow-y-auto max-h-[400px] font-mono leading-relaxed">{{ nodeResult.output }}</div>
      </div>

      <!-- No output message -->
      <div v-else-if="!nodeResult?.error" class="text-xs text-gray-400 italic">
        No output generated
      </div>
    </div>

    <!-- Properties form (edit mode) -->
    <div v-else class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Name -->
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
        <input
          type="text"
          :value="selectedAgent!.name"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
          class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white transition-colors"
          placeholder="Agent name"
        />
      </div>

      <!-- Role -->
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Role Description</label>
        <textarea
          :value="selectedAgent!.role"
          @input="updateField('role', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white resize-none transition-colors"
          placeholder="Describe what this agent does..."
        />
      </div>

      <!-- Oversight toggle -->
      <div class="flex items-center justify-between py-3 border-t border-gray-100">
        <div>
          <div class="flex items-center gap-1 text-xs font-medium text-gray-700">
            Oversight Agent
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-gray-300 hover:text-primary-500 cursor-help" />
              <span class="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.oversight }}
              </span>
            </span>
          </div>
          <div class="text-xs text-gray-400">Synthesizes and evaluates</div>
        </div>
        <button
          @click="updateField('isOversight', !selectedAgent!.isOversight)"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          :class="selectedAgent!.isOversight ? 'bg-primary-600' : 'bg-gray-200'"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
            :class="selectedAgent!.isOversight ? 'translate-x-[18px]' : 'translate-x-0.5'"
          />
        </button>
      </div>

      <!-- Suspicion Level (only for oversight) -->
      <div v-if="selectedAgent!.isOversight">
        <label class="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
          Suspicion Level
          <span class="group relative">
            <HelpCircle class="w-3 h-3 text-gray-300 hover:text-primary-500 cursor-help" />
            <span class="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
              {{ tooltips.suspicion }}
            </span>
          </span>
        </label>
        <select
          :value="selectedAgent!.suspicionLevel || 'trusting'"
          @change="updateField('suspicionLevel', ($event.target as HTMLSelectElement).value as SuspicionLevel)"
          class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white transition-colors"
        >
          <option v-for="level in suspicionLevels" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
        </select>
      </div>

      <!-- Skills (Coming Soon) -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1">
            <BookOpen class="w-3.5 h-3.5 text-gray-300" />
            <span class="text-xs font-medium text-gray-400">Skills</span>
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-gray-300 hover:text-gray-400 cursor-help" />
              <span class="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.skills }}
              </span>
            </span>
          </div>
          <span class="px-1.5 py-0.5 text-[9px] font-medium text-gray-400 bg-gray-100 rounded">COMING SOON</span>
        </div>
        <div class="bg-gray-50 border border-dashed border-gray-200 rounded-md p-3 opacity-60">
          <div class="flex items-center justify-center gap-2 text-gray-400">
            <Lock class="w-3.5 h-3.5" />
            <span class="text-xs">Add knowledge documents</span>
          </div>
          <p class="text-[10px] text-gray-400 text-center mt-2">
            ICH Guidelines, SOPs, Best Practices...
          </p>
        </div>
      </div>

      <!-- Tools -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1">
            <Wrench class="w-3.5 h-3.5 text-primary-600" />
            <span class="text-xs font-medium text-gray-700">Tools</span>
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-gray-300 hover:text-gray-400 cursor-help" />
              <span class="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.tools }}
              </span>
            </span>
          </div>
          <span class="text-xs text-gray-400">{{ (selectedAgent?.tools || []).length }} selected</span>
        </div>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <label
            v-for="tool in availableTools"
            :key="tool.id"
            class="flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors"
            :class="(selectedAgent?.tools || []).some((t: AgentTool) => t.id === tool.id) ? 'bg-primary-50' : 'hover:bg-gray-50'"
          >
            <input
              type="checkbox"
              :checked="(selectedAgent?.tools || []).some((t: AgentTool) => t.id === tool.id)"
              @change="toggleTool(tool)"
              class="mt-0.5 accent-primary-600"
            />
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-gray-900">{{ tool.name }}</div>
              <div class="text-[10px] text-gray-400 truncate">{{ tool.description }}</div>
            </div>
          </label>
        </div>
        <p v-if="availableTools.length === 0" class="text-xs text-gray-400 text-center py-2">
          Loading tools...
        </p>
      </div>

      <!-- Rogue Mode -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="flex items-center gap-1 text-xs font-medium text-amber-700">
              Rogue Mode
              <span class="group relative">
                <HelpCircle class="w-3 h-3 text-amber-400 hover:text-amber-600 cursor-help" />
                <span class="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                  {{ tooltips.rogueMode }}
                </span>
              </span>
            </div>
            <div class="text-xs text-gray-400">Adversarial behavior</div>
          </div>
          <button
            @click="toggleRogueMode"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            :class="selectedAgent!.rogueMode.enabled ? 'bg-amber-500' : 'bg-gray-200'"
          >
            <span
              class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
              :class="selectedAgent!.rogueMode.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'"
            />
          </button>
        </div>

        <!-- Rogue Profile (only when rogue enabled) -->
        <div v-if="selectedAgent!.rogueMode.enabled" class="mt-3 space-y-1">
          <label
            v-for="profile in rogueProfiles"
            :key="profile.value"
            class="flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors"
            :class="selectedAgent!.rogueMode.profile === profile.value ? 'bg-amber-50' : 'hover:bg-gray-50'"
          >
            <input
              type="radio"
              :value="profile.value"
              :checked="selectedAgent!.rogueMode.profile === profile.value"
              @change="updateRogueProfile(profile.value)"
              class="mt-0.5 accent-amber-600"
            />
            <div>
              <div class="text-xs font-medium text-gray-900">{{ profile.label }}</div>
              <div class="text-xs text-gray-400">{{ profile.description }}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="border-t border-gray-100 pt-4">
        <button
          @click="showAdvanced = !showAdvanced"
          class="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <component :is="showAdvanced ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
          Advanced Settings
        </button>

        <div v-if="showAdvanced" class="mt-3 space-y-4">
          <!-- Generated Prompt (readonly) -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">Current System Prompt</label>
            <div
              class="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-md font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-gray-600"
            >{{ generatedPrompt }}</div>
            <p class="mt-1.5 text-xs text-gray-400">
              Auto-generated based on current settings
            </p>
          </div>

          <!-- Custom Override -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">Custom Override</label>
            <textarea
              :value="selectedAgent!.systemPrompt || ''"
              @input="updateField('systemPrompt', ($event.target as HTMLTextAreaElement).value)"
              rows="5"
              class="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white resize-none font-mono transition-colors"
              placeholder="Enter custom prompt to override the auto-generated one..."
            />
            <p class="mt-1.5 text-xs text-gray-400">
              Leave empty to use the auto-generated prompt above
            </p>
          </div>
        </div>
      </div>

      <!-- Delete Button -->
      <div class="border-t border-gray-100 pt-4">
        <button
          @click="deleteNode"
          class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Delete Agent
        </button>
      </div>
    </div>
  </div>
</template>
