<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { FileOutput, CheckCircle, Loader2 } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import type { OutputNodeData } from '../types'

const props = defineProps<{
  id: string
  data: OutputNodeData
  selected: boolean
}>()

const { simulationResults, isSimulating, edges } = useTopology()

const hasOutput = computed(() => {
  const incomingEdges = edges.value.filter(e => e.target === props.id)
  return incomingEdges.some(e => {
    const result = simulationResults.value[e.source]
    return result && result.output
  })
})
</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[280px] transition-all bg-white shadow-md hover:shadow-lg"
    :class="[
      selected ? 'border-primary-600 shadow-md' : 'border-gray-200'
    ]"
  >
    <!-- Header -->
    <div class="flex items-center gap-3">
      <CheckCircle v-if="hasOutput" class="w-5 h-5 text-emerald-600" />
      <Loader2 v-else-if="isSimulating" class="w-5 h-5 text-primary-600 animate-spin" />
      <FileOutput v-else class="w-5 h-5 text-primary-600" />
      
      <div class="flex-1">
        <div class="font-semibold text-sm" :class="hasOutput ? 'text-emerald-900' : 'text-primary-900'">
          Final Output
        </div>
        <div class="text-[10px]" :class="hasOutput ? 'text-emerald-500' : 'text-primary-500'">
          {{ hasOutput ? 'Simulation complete' : 'Aggregated results' }}
        </div>
      </div>
    </div>

    <!-- Only input handle (left side) - receives FROM agents -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-primary-300 !w-3 !h-3 !border-2 !border-white"
    />
  </div>
</template>
