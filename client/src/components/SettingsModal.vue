<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { X, Key, Globe, Plus, Trash2 } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { 
  endpointConfigs, 
  globalModel,
  allAvailableModels,
  saveEndpointConfigs 
} = useTopology()

// Local copy for editing
const localConfigs = ref<Array<{
  id: string
  label: string
  apiKey: string
  endpoint: string
  models: string[]
  newModel: string
}>>([])

const testStatus = ref<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({})
const testMessage = ref<Record<string, string>>({})

// Track availability status for each model: { "endpointId:modelName": true/false/undefined }
const modelStatus = ref<Record<string, boolean | undefined>>({})

onMounted(() => {
  loadConfigs()
})

watch(() => props.open, (isOpen) => {
  if (isOpen) loadConfigs()
})

function loadConfigs() {
  localConfigs.value = endpointConfigs.value.map(c => ({
    ...c,
    newModel: ''
  }))
  // Initialize test status
  for (const c of localConfigs.value) {
    testStatus.value[c.id] = 'idle'
    testMessage.value[c.id] = ''
  }
}

function addModel(configId: string) {
  const config = localConfigs.value.find(c => c.id === configId)
  if (config && config.newModel.trim()) {
    config.models.push(config.newModel.trim())
    config.newModel = ''
  }
}

function removeModel(configId: string, index: number) {
  const config = localConfigs.value.find(c => c.id === configId)
  if (config) {
    config.models.splice(index, 1)
  }
}

async function fetchModels(configId: string) {
  const config = localConfigs.value.find(c => c.id === configId)
  if (!config) return
  
  testStatus.value[configId] = 'testing'
  testMessage.value[configId] = 'Fetching models...'
  
  try {
    const response = await fetch('/api/list-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: config.apiKey,
        apiEndpoint: config.endpoint
      })
    })
    
    const result = await response.json()
    
    if (result.success && result.models.length > 0) {
      // Replace existing models with fetched ones
      config.models = result.models
      testStatus.value[configId] = 'success'
      testMessage.value[configId] = `✓ ${result.message}`
    } else {
      testStatus.value[configId] = 'error'
      testMessage.value[configId] = `✗ ${result.message}`
    }
  } catch (e) {
    testStatus.value[configId] = 'error'
    testMessage.value[configId] = '✗ Failed to fetch models'
  }
  
  setTimeout(() => {
    testStatus.value[configId] = 'idle'
  }, 5000)
}

async function testConnection(configId: string) {
  const config = localConfigs.value.find(c => c.id === configId)
  if (!config || config.models.length === 0) {
    testStatus.value[configId] = 'error'
    testMessage.value[configId] = '✗ No models to test'
    return
  }
  
  testStatus.value[configId] = 'testing'
  testMessage.value[configId] = `Testing ${config.models.length} models...`
  
  // Reset model status for this endpoint
  for (const model of config.models) {
    modelStatus.value[`${configId}:${model}`] = undefined
  }
  
  try {
    const response = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: config.apiKey,
        apiEndpoint: config.endpoint,
        models: config.models
      })
    })
    
    const result = await response.json()
    
    // Update model status based on results
    if (result.results) {
      for (const r of result.results) {
        modelStatus.value[`${configId}:${r.model}`] = r.success
      }
    }
    
    if (result.success) {
      testStatus.value[configId] = 'success'
      testMessage.value[configId] = `✓ ${result.message}`
    } else {
      testStatus.value[configId] = 'error'
      const failedModels = result.results
        ?.filter((r: any) => !r.success)
        .map((r: any) => r.model)
        .join(', ') || 'Unknown'
      testMessage.value[configId] = `✗ ${result.message} (Failed: ${failedModels})`
    }
  } catch (e) {
    testStatus.value[configId] = 'error'
    testMessage.value[configId] = '✗ Connection failed'
  }
  
  setTimeout(() => {
    testStatus.value[configId] = 'idle'
  }, 8000)
}

function save() {
  // Update the actual configs, only keep models that passed the test (or were never tested)
  for (let i = 0; i < endpointConfigs.value.length; i++) {
    const local = localConfigs.value[i]
    if (local) {
      endpointConfigs.value[i].apiKey = local.apiKey
      endpointConfigs.value[i].endpoint = local.endpoint
      
      // Filter models: keep only those that passed test or were never tested
      const availableModels = local.models.filter(model => {
        const status = modelStatus.value[`${local.id}:${model}`]
        return status === true || status === undefined  // Keep if passed or untested
      })
      endpointConfigs.value[i].models = availableModels
    }
  }
  saveEndpointConfigs()
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
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-5 max-h-[80vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">API Configuration</h2>
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Endpoint Configs -->
        <div class="space-y-4">
          <div
            v-for="config in localConfigs"
            :key="config.id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <!-- Endpoint Header -->
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900">{{ config.label }}</h3>
              <div class="flex items-center gap-2">
                <span 
                  v-if="testStatus[config.id] !== 'idle'"
                  class="text-xs"
                  :class="{
                    'text-blue-600': testStatus[config.id] === 'testing',
                    'text-green-600': testStatus[config.id] === 'success',
                    'text-red-600': testStatus[config.id] === 'error'
                  }"
                >
                  {{ testMessage[config.id] }}
                </span>
                <button
                  @click="fetchModels(config.id)"
                  :disabled="testStatus[config.id] === 'testing'"
                  class="px-2 py-1 text-xs text-green-600 border border-green-200 rounded hover:bg-green-50 disabled:opacity-50"
                >
                  Fetch
                </button>
                <button
                  @click="testConnection(config.id)"
                  :disabled="testStatus[config.id] === 'testing'"
                  class="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                  Test
                </button>
              </div>
            </div>

            <!-- API Key -->
            <div class="mb-3">
              <label class="block text-xs text-gray-500 mb-1">
                <Key class="w-3 h-3 inline mr-1" />API Key
              </label>
              <input
                v-model="config.apiKey"
                type="password"
                class="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="sk-..."
              />
            </div>

            <!-- Endpoint URL -->
            <div class="mb-3">
              <label class="block text-xs text-gray-500 mb-1">
                <Globe class="w-3 h-3 inline mr-1" />Endpoint
              </label>
              <input
                v-model="config.endpoint"
                type="text"
                class="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <!-- Models -->
            <div>
              <label class="block text-xs text-gray-500 mb-1">Available Models</label>
              <div class="flex flex-wrap gap-1 mb-2">
                <span
                  v-for="(model, idx) in config.models"
                  :key="model"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': modelStatus[`${config.id}:${model}`] === true,
                    'bg-red-100 text-red-800': modelStatus[`${config.id}:${model}`] === false,
                    'bg-gray-100 text-gray-800': modelStatus[`${config.id}:${model}`] === undefined
                  }"
                >
                  <span v-if="modelStatus[`${config.id}:${model}`] === true" class="text-green-600">✓</span>
                  <span v-else-if="modelStatus[`${config.id}:${model}`] === false" class="text-red-600">✗</span>
                  {{ model }}
                  <button @click="removeModel(config.id, idx)" class="text-gray-400 hover:text-red-500">
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </div>
              <div class="flex gap-1">
                <input
                  v-model="config.newModel"
                  @keydown.enter="addModel(config.id)"
                  type="text"
                  class="flex-1 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded"
                  placeholder="Add model name..."
                />
                <button
                  @click="addModel(config.id)"
                  class="p-1 text-gray-600 hover:text-gray-900"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          Models added here will appear in the global model selector at the top toolbar.
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 mt-4">
          <button
            @click="$emit('close')"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            @click="save"
            class="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
