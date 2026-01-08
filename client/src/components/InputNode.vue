<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { FileInput } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import type { InputNodeData } from '../types'

const props = defineProps<{
  id: string
  data: InputNodeData
  selected: boolean
}>()

const { updateInputNode } = useTopology()

function onTaskInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value
  updateInputNode(props.id, { task: value })
}
</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[280px] transition-all bg-white shadow-md hover:shadow-lg"
    :class="[
      selected ? 'ring-2 ring-primary-600 ring-offset-1 border-primary-400' : 'border-primary-300',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <div class="w-8 h-8 rounded-md flex items-center justify-center bg-primary-100">
        <FileInput class="w-4 h-4 text-primary-600" />
      </div>
      <div class="flex-1">
        <div class="font-semibold text-primary-900 text-sm">Master Task</div>
        <div class="text-[10px] text-primary-500">Input for all agents</div>
      </div>
    </div>

    <!-- Task Input -->
    <textarea
      :value="data.task"
      @input="onTaskInput"
      rows="3"
      class="w-full px-2 py-1.5 text-xs bg-primary-50 border border-primary-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors placeholder-primary-300"
      placeholder="Enter the main task or question..."
    />

    <!-- Only output handle (right side) - connects TO agents -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!bg-primary-600 !w-3 !h-3 !border-2 !border-white"
    />
  </div>
</template>
