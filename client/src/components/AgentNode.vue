<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Bot, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import type { AgentNodeData } from '../types'

const props = defineProps<{
  id: string
  data: AgentNodeData
  selected: boolean
}>()

const { simulationResults, isSimulating, processingNodeIds } = useTopology()

const result = computed(() => simulationResults.value[props.id])
const hasResult = computed(() => !!result.value)
const hasError = computed(() => result.value?.error)
const isProcessing = computed(() => processingNodeIds.value.has(props.id))

const statusClass = computed(() => {
  if (isProcessing.value) return 'border-blue-400 bg-blue-50 shadow-lg animate-pulse'
  if (hasError.value) return 'border-red-200 bg-red-50 shadow-md'
  if (hasResult.value) return 'border-emerald-200 bg-emerald-50/50 shadow-md'
  if (isSimulating.value) return 'border-gray-300 bg-white shadow-md'
  return 'border-gray-200 bg-white shadow-md hover:shadow-lg'
})
</script>

<template>
  <div
    class="px-3 py-2.5 rounded-lg border min-w-[160px] max-w-[200px] transition-all"
    :class="[
      statusClass,
      selected ? 'ring-2 ring-primary-600 ring-offset-1' : '',
      data.rogueMode.enabled ? 'border-dashed border-amber-400' : ''
    ]"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 mb-1.5">
      <div
        class="w-7 h-7 rounded-md flex items-center justify-center"
        :class="data.isOversight ? 'bg-gray-100' : 'bg-gray-100'"
      >
        <Shield v-if="data.isOversight" class="w-3.5 h-3.5 text-gray-600" />
        <Bot v-else class="w-3.5 h-3.5 text-gray-600" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-gray-900 text-xs truncate">{{ data.name }}</div>
      </div>
      <!-- Status indicators -->
      <div class="flex items-center">
        <AlertTriangle
          v-if="data.rogueMode.enabled && !isProcessing && !hasResult"
          class="w-3.5 h-3.5 text-amber-500"
          title="Rogue Mode"
        />
        <Loader2
          v-else-if="isProcessing"
          class="w-3.5 h-3.5 text-blue-500 animate-spin"
        />
        <CheckCircle
          v-else-if="hasResult && !hasError"
          class="w-3.5 h-3.5 text-emerald-500 cursor-pointer"
          title="Click to view output"
        />
        <span v-else-if="hasError" class="group relative">
          <AlertTriangle class="w-3.5 h-3.5 text-red-500 cursor-help" />
          <span class="absolute right-0 top-full mt-1 w-48 p-2 bg-red-900 text-white text-[10px] rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 shadow-lg whitespace-pre-wrap">
            {{ result?.error }}
          </span>
        </span>
      </div>
    </div>

    <!-- Role preview -->
    <div class="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
      {{ data.role || 'No role defined' }}
    </div>

    <!-- Badges -->
    <div class="flex flex-wrap gap-1 mt-2" v-if="data.isOversight">
      <span
        class="px-1.5 py-0.5 text-[10px] rounded font-medium bg-gray-100 text-gray-600"
      >
        {{ data.suspicionLevel || 'trusting' }}
      </span>
    </div>

    <!-- Error message -->
    <div
      v-if="hasError"
      class="mt-2 p-1.5 bg-red-100 border border-red-200 rounded text-[10px] text-red-700 line-clamp-3"
    >
      {{ result?.error }}
    </div>

    <!-- Handles for connections -->
    <Handle type="target" :position="Position.Left" class="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-primary-600 !w-2.5 !h-2.5 !border-2 !border-white" />
  </div>
</template>
