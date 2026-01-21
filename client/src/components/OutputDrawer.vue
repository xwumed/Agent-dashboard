<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Clock, Coins, AlertCircle, Copy, Check, Wrench, MessageSquare } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { selectedNode, getNodeResult } = useTopology()

const result = computed(() => {
  if (!selectedNode.value) return null
  return getNodeResult(selectedNode.value.id)
})

const copied = ref(false)

async function copyOutput() {
  if (!result.value?.output) return
  try {
    await navigator.clipboard.writeText(result.value.output)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

async function copyError() {
  if (!result.value?.error) return
  try {
    await navigator.clipboard.writeText(result.value.error)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && selectedNode"
      class="fixed inset-y-0 right-0 z-40 w-full max-w-md"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 -left-full w-[200vw]"
        @click="$emit('close')"
      />

      <!-- Drawer -->
      <div class="absolute inset-y-0 right-0 w-full bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h2 class="font-medium text-sm text-gray-900">{{ selectedNode.name }}</h2>
            <p class="text-xs text-gray-400">{{ selectedNode.model }}</p>
          </div>
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- No result state -->
          <div v-if="!result" class="flex flex-col items-center justify-center h-full text-center">
            <div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <AlertCircle class="w-5 h-5 text-gray-300" />
            </div>
            <p class="text-xs text-gray-400">No output yet</p>
            <p class="text-xs text-gray-300 mt-1">Run the simulation to see results</p>
          </div>

          <!-- Error state -->
          <div v-else-if="result.error" class="bg-red-50 rounded-md p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-start gap-2 flex-1 min-w-0">
                <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-xs text-red-800">Error</p>
                  <div class="max-h-60 overflow-y-auto mt-1">
                    <p class="text-xs text-red-600 break-words">{{ result.error }}</p>
                  </div>
                </div>
              </div>
              <button
                @click="copyError"
                class="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                :title="copied ? 'Copied!' : 'Copy error'"
              >
                <Check v-if="copied" class="w-3.5 h-3.5 text-green-500" />
                <Copy v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Output -->
          <div v-else class="space-y-3">
            <!-- Metadata -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-xs text-gray-400">
                <div class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  {{ (result.duration / 1000).toFixed(1) }}s
                </div>
                <div class="flex items-center gap-1">
                  <Coins class="w-3.5 h-3.5" />
                  {{ result.tokens.prompt + result.tokens.completion }} tokens
                </div>
              </div>
              <!-- Copy button -->
              <button
                @click="copyOutput"
                class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                :title="copied ? 'Copied!' : 'Copy output'"
              >
                <Check v-if="copied" class="w-3.5 h-3.5 text-green-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>

            <!-- Tool Usage -->
            <!-- Tool Usage -->
            <div v-if="selectedNode.tools && selectedNode.tools.length > 0" class="space-y-2">
              <div class="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Wrench class="w-3.5 h-3.5" />
                Tool Usage
              </div>
              
              <div v-if="result.tool_calls && result.tool_calls.length > 0" class="space-y-2">
                <div 
                  v-for="(call, index) in result.tool_calls" 
                  :key="index"
                  class="bg-blue-50 border border-blue-100 rounded-md overflow-hidden"
                >
                  <!-- Tool Header -->
                  <div class="px-3 py-2 bg-blue-100/50 flex items-center justify-between border-b border-blue-100">
                    <span class="text-xs font-medium text-blue-900 font-mono">{{ call.tool_name }}</span>
                    <span class="text-[10px] text-blue-700 px-1.5 py-0.5 bg-blue-200/50 rounded">Success</span>
                  </div>
                  
                  <!-- Tool Details -->
                  <div class="p-3 space-y-2 text-xs">
                    <!-- Args -->
                    <div>
                      <span class="text-[10px] text-blue-500 font-medium uppercase tracking-wider">Arguments</span>
                      <pre class="mt-1 font-mono text-blue-900 bg-white/50 p-1.5 rounded border border-blue-100 overflow-x-auto">{{ JSON.parse(call.args) }}</pre>
                    </div>
                    <!-- Result -->
                    <div>
                      <span class="text-[10px] text-blue-500 font-medium uppercase tracking-wider">Result</span>
                      <div class="mt-1 text-blue-900 bg-white/50 p-1.5 rounded border border-blue-100 max-h-32 overflow-y-auto whitespace-pre-wrap">{{ call.result }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- No tools used state -->
              <div v-else class="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div class="flex items-center gap-2">
                   <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                   <span class="text-xs text-gray-500 italic">No tools used in this execution</span>
                </div>
              </div>
            </div>

            <!-- Output text -->
            <div class="bg-gray-50 rounded-md p-3 max-h-[60vh] overflow-y-auto">
              <!-- Label for output -->
              <div class="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                 <MessageSquare class="w-3.5 h-3.5" />
                 Assistant Response
              </div>
              <pre class="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed">{{ result.output }}</pre>
            </div>

            <!-- Token breakdown -->
            <div class="text-[10px] text-gray-400">
              {{ result.tokens.prompt }} prompt + {{ result.tokens.completion }} completion tokens
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
