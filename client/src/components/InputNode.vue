<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { FileInput } from 'lucide-vue-next'
import type { InputNodeData } from '../types'

const props = defineProps<{
  id: string
  data: InputNodeData
  selected: boolean
}>()


</script>

<template>
  <div
    class="px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[280px] transition-all bg-white shadow-md hover:shadow-lg"
    :class="[
      selected ? 'border-primary-600 shadow-md' : 'border-gray-200',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center gap-3">
      <FileInput class="w-5 h-5 text-primary-600" />
      <div class="flex-1">
        <div class="font-semibold text-primary-900 text-sm">Master Task</div>
        <div class="text-[10px] text-primary-500">Input for all agents</div>
      </div>
    </div>



    <!-- Only output handle (right side) - connects TO agents -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!bg-primary-600 !w-3 !h-3 !border-2 !border-white"
    />
  </div>
</template>
