<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Key, ExternalLink, Globe } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { apiKey, apiEndpoint, setApiKey, setApiEndpoint } = useTopology()
const localKey = ref('')
const localEndpoint = ref('')

const endpoints = [
  { value: 'https://api.openai.com', label: 'Global (US)' },
  { value: 'https://eu.api.openai.com', label: 'Europe (EU)' }
]

onMounted(() => {
  localKey.value = apiKey.value
  localEndpoint.value = apiEndpoint.value
})

function save() {
  setApiKey(localKey.value)
  setApiEndpoint(localEndpoint.value)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40"
        @click="$emit('close')"
      />

      <!-- Modal -->
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">Settings</h2>
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">
              <div class="flex items-center gap-1.5">
                <Key class="w-3.5 h-3.5" />
                OpenAI API Key
              </div>
            </label>
            <input
              v-model="localKey"
              type="password"
              class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-colors"
              placeholder="sk-..."
            />
            <p class="mt-1.5 text-xs text-gray-400">
              Stored locally in your browser.
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">
              <div class="flex items-center gap-1.5">
                <Globe class="w-3.5 h-3.5" />
                API Endpoint
              </div>
            </label>
            <div class="flex gap-2">
              <button
                v-for="ep in endpoints"
                :key="ep.value"
                @click="localEndpoint = ep.value"
                class="flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors"
                :class="localEndpoint === ep.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'"
              >
                {{ ep.label }}
              </button>
            </div>
          </div>

          <div class="bg-gray-50 rounded-md p-3">
            <p class="text-xs text-gray-600">
              Need an API key?
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                class="inline-flex items-center gap-1 font-medium text-gray-900 hover:underline"
              >
                Get one from OpenAI
                <ExternalLink class="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 mt-5">
          <button
            @click="$emit('close')"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            class="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
