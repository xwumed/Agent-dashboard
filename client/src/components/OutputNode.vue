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

// Get results from all agents that connect to this output node
const connectedResults = computed(() => {
  const incomingEdges = edges.value.filter(e => e.target === props.id)
  const results: { name: string; output: string }[] = []

  for (const edge of incomingEdges) {
    const result = simulationResults.value[edge.source]
    if (result && result.output) {
      results.push({
        name: edge.source,
        output: result.output
      })
    }
  }
  return results
})

const hasOutput = computed(() => connectedResults.value.length > 0)
const combinedOutput = computed(() => {
  if (!hasOutput.value) return ''
  return connectedResults.value.map(r => r.output).join('\n\n---\n\n')
})
</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[280px] transition-all bg-white shadow-md hover:shadow-lg"
    :class="[
      selected ? 'ring-2 ring-primary-600 ring-offset-1 border-primary-400' : 'border-primary-300',
      hasOutput ? 'border-emerald-300' : ''
    ]"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <div
        class="w-8 h-8 rounded-md flex items-center justify-center"
        :class="hasOutput ? 'bg-emerald-100' : 'bg-primary-100'"
      >
        <CheckCircle v-if="hasOutput" class="w-4 h-4 text-emerald-600" />
        <Loader2 v-else-if="isSimulating" class="w-4 h-4 text-primary-600 animate-spin" />
        <FileOutput v-else class="w-4 h-4 text-primary-600" />
      </div>
      <div class="flex-1">
        <div class="font-semibold text-sm" :class="hasOutput ? 'text-emerald-900' : 'text-primary-900'">
          Final Output
        </div>
        <div class="text-[10px]" :class="hasOutput ? 'text-emerald-500' : 'text-primary-500'">
          {{ hasOutput ? 'Simulation complete' : 'Aggregated results' }}
        </div>
      </div>
    </div>

    <!-- Output Display -->
    <div
      v-if="hasOutput"
      class="text-xs text-gray-700 bg-emerald-50 border border-emerald-200 rounded-md p-2 max-h-32 overflow-y-auto whitespace-pre-wrap"
    >
      {{ combinedOutput }}
    </div>
    <div
      v-else
      class="text-xs text-primary-400 bg-primary-50 border border-primary-200 rounded-md p-2 text-center"
    >
      {{ isSimulating ? 'Running simulation...' : 'Connect agents and run simulation to see output' }}
    </div>

    <!-- Only input handle (left side) - receives FROM agents -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-primary-300 !w-3 !h-3 !border-2 !border-white"
    />
  </div>
</template>
