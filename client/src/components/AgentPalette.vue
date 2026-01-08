<script setup lang="ts">
import { Bot, Shield, Download, Upload, Trash2, FileInput, FileOutput, HelpCircle } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import BatchProcessingPanel from './BatchProcessingPanel.vue'

const emit = defineEmits<{
  (e: 'import'): void
  (e: 'export'): void
}>()

const { clearTopology } = useTopology()

// Educational tooltips for pharma R&D context
const tooltips = {
  input: 'The starting point of your workflow. Define the master task here, e.g., "Review this Phase III clinical trial protocol for safety and efficacy."',
  output: 'Collects final results. Connect this to the last agent(s) in your chain to aggregate outputs.',
  agent: 'An AI worker with a specific role. Examples: Safety Scientist, Regulatory Expert, Medical Writer. Configure behavior in Properties panel.',
  oversight: 'A supervisory agent that reviews and synthesizes work from other agents. Use for quality control, like a Protocol Review Chair.'
}

function onDragStart(event: DragEvent, nodeType: 'agent' | 'oversight' | 'input' | 'output') {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/agentType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div class="w-52 bg-white border-r border-gray-100 flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100">
      <h2 class="font-medium text-gray-900 text-xs uppercase tracking-wider">Flow</h2>
    </div>

    <!-- Flow nodes (Input/Output) -->
    <div class="p-3 space-y-2">
      <!-- Input Node -->
      <div
        class="flex items-center gap-3 p-3 bg-primary-50 rounded-lg cursor-grab hover:bg-primary-100 transition-all active:cursor-grabbing border border-primary-200"
        draggable="true"
        @dragstart="onDragStart($event, 'input')"
      >
        <div class="w-9 h-9 bg-white rounded-lg border border-primary-300 flex items-center justify-center shadow-sm">
          <FileInput class="w-4 h-4 text-primary-600" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="font-medium text-sm text-primary-900">Input</span>
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-primary-300 hover:text-primary-500 cursor-help" />
              <span class="absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.input }}
              </span>
            </span>
          </div>
          <div class="text-xs text-primary-500">Master task</div>
        </div>
      </div>

      <!-- Output Node -->
      <div
        class="flex items-center gap-3 p-3 bg-primary-50 rounded-lg cursor-grab hover:bg-primary-100 transition-all active:cursor-grabbing border border-primary-200"
        draggable="true"
        @dragstart="onDragStart($event, 'output')"
      >
        <div class="w-9 h-9 bg-white rounded-lg border border-primary-300 flex items-center justify-center shadow-sm">
          <FileOutput class="w-4 h-4 text-primary-600" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="font-medium text-sm text-primary-900">Output</span>
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-primary-300 hover:text-primary-500 cursor-help" />
              <span class="absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.output }}
              </span>
            </span>
          </div>
          <div class="text-xs text-primary-500">Final result</div>
        </div>
      </div>
    </div>

    <!-- Agents Header -->
    <div class="px-4 py-2 border-t border-gray-100">
      <h2 class="font-medium text-gray-900 text-xs uppercase tracking-wider">Agents</h2>
    </div>

    <!-- Agent nodes -->
    <div class="p-3 space-y-2 flex-1">
      <!-- Standard Agent -->
      <div
        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-all active:cursor-grabbing"
        draggable="true"
        @dragstart="onDragStart($event, 'agent')"
      >
        <div class="w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
          <Bot class="w-4 h-4 text-gray-700" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="font-medium text-sm text-gray-900">Agent</span>
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-help" />
              <span class="absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.agent }}
              </span>
            </span>
          </div>
          <div class="text-xs text-gray-500">Standard node</div>
        </div>
      </div>

      <!-- Oversight Agent -->
      <div
        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-all active:cursor-grabbing"
        draggable="true"
        @dragstart="onDragStart($event, 'oversight')"
      >
        <div class="w-9 h-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
          <Shield class="w-4 h-4 text-gray-700" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="font-medium text-sm text-gray-900">Oversight</span>
            <span class="group relative">
              <HelpCircle class="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-help" />
              <span class="absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg">
                {{ tooltips.oversight }}
              </span>
            </span>
          </div>
          <div class="text-xs text-gray-500">Supervisor node</div>
        </div>
      </div>
    </div>

    <!-- Batch Processing -->
    <BatchProcessingPanel />

    <!-- Actions -->
    <div class="p-3 border-t border-gray-100 space-y-1.5">
      <button
        @click="$emit('import')"
        class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
      >
        <Upload class="w-3.5 h-3.5" />
        Import
      </button>

      <button
        @click="$emit('export')"
        class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
      >
        <Download class="w-3.5 h-3.5" />
        Export
      </button>

      <button
        @click="clearTopology"
        class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Clear All
      </button>
    </div>
  </div>
</template>
