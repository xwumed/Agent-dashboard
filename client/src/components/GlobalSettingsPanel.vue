<script setup lang="ts">
import { Settings, Cpu, Thermometer, Brain, Zap, List, Save, Download, FlaskConical, FileUp, Copy } from 'lucide-vue-next'
import { useTopology } from '../composables/useTopology'
import BatchProcessingPanel from './BatchProcessingPanel.vue'

defineEmits<{
  (e: 'save-template'): void
  (e: 'save-as-template'): void
  (e: 'open-loader'): void
  (e: 'export-json'): void
  (e: 'import-template'): void
}>()

const { 
  allAvailableModels,
  globalModel,
  setGlobalModel,
  globalTemperature,
  setGlobalTemperature,
  globalMaxTokens,
  setGlobalMaxTokens,
  globalReasoningEffort,
  setGlobalReasoningEffort,
  globalThinking,
  setGlobalThinking
} = useTopology()
</script>

<template>
  <div class="w-64 bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
      <Settings class="w-4 h-4 text-gray-500" />
      <h2 class="font-medium text-gray-900 text-xs uppercase tracking-wider">Template Settings</h2>
    </div>

    <!-- Actions Section (Fixed Top) -->
    <div class="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
       <!-- File Actions Grid -->
      <div class="grid grid-cols-2 gap-2">
        <button
          @click="$emit('save-template')"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors shadow-sm"
          title="Save (Overwrite if existing)"
        >
          <Save class="w-3.5 h-3.5" />
          Save
        </button>
        <button
          @click="$emit('save-as-template')"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors shadow-sm"
          title="Save As New Template"
        >
          <Copy class="w-3.5 h-3.5" />
          Save As
        </button>
        <button
          @click="$emit('import-template')"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors shadow-sm"
          title="Import JSON File"
        >
          <FileUp class="w-3.5 h-3.5" />
          Import
        </button>
        <button
          @click="$emit('export-json')"
          class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors shadow-sm"
          title="Export as JSON"
        >
          <Download class="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <!-- Library Load -->
      <button
        @click="$emit('open-loader')"
        class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-md transition-colors shadow-sm"
        title="Load from Template Library"
      >
        <FlaskConical class="w-3.5 h-3.5" />
        Load from Library
      </button>
    </div>

    <!-- Scrollable Settings -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      
      <!-- Global Parameters Section -->
      <div class="space-y-4">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Global Parameters</h3>
        
        <!-- Model Selection -->
        <div>
          <label class="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
            <Cpu class="w-3.5 h-3.5" />
            Model
          </label>
          <select
            :value="globalModel"
            @change="setGlobalModel(($event.target as HTMLSelectElement).value as any)"
            class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white transition-colors cursor-pointer"
          >
            <option v-for="model in allAvailableModels" :key="model" :value="model">
              {{ model }}
            </option>
            <option v-if="allAvailableModels.length === 0" value="gpt-4o">gpt-4o</option>
          </select>
        </div>

        <!-- Max Tokens -->
        <div>
          <label class="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
            <List class="w-3.5 h-3.5" />
            Max Tokens
          </label>
          <input
            type="number"
            :value="globalMaxTokens"
            @change="setGlobalMaxTokens(parseInt(($event.target as HTMLInputElement).value))"
            min="1000"
            max="128000"
            step="1000"
            class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white transition-colors"
          />
        </div>

        <!-- Model Specific: Reasoning -->
        <div v-if="globalModel.startsWith('gpt') || globalModel.startsWith('o1') || globalModel.startsWith('o3')">
          <label class="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
            <Brain class="w-3.5 h-3.5" />
            Reasoning Effort
          </label>
          <div class="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-md border border-gray-200">
            <button
              v-for="level in ['low', 'medium', 'high']"
              :key="level"
              @click="setGlobalReasoningEffort(level)"
              :class="[
                'px-2 py-1 text-xs capitalize rounded transition-colors',
                globalReasoningEffort === level
                  ? 'bg-white text-primary-600 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              {{ level }}
            </button>
          </div>
        </div>

        <!-- Model Specific: Thinking -->
        <div v-if="globalModel.toLowerCase().includes('glm')">
          <label class="flex items-center justify-between text-xs font-medium text-gray-500 mb-2 cursor-pointer">
            <div class="flex items-center gap-1.5">
              <Zap class="w-3.5 h-3.5" />
              Thinking Mode
            </div>
            <div class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                :checked="globalThinking" 
                @change="setGlobalThinking(($event.target as HTMLInputElement).checked)"
                class="sr-only peer"
              >
              <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </div>
          </label>
        </div>

        <!-- Temperature -->
        <div>
          <label class="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
            <Thermometer class="w-3.5 h-3.5" />
            Temperature
          </label>
          <input
            type="number"
            :value="globalTemperature"
            @input="setGlobalTemperature(parseFloat(($event.target as HTMLInputElement).value))"
            min="0"
            max="2"
            step="0.1"
            class="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Batch Processing -->
      <BatchProcessingPanel />
      
    </div>

    <!-- Footer Branding -->
    <div class="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
      <img src="https://jnkather.github.io/images/logo.png" class="h-6 w-6 object-contain" alt="Kather Lab" />
      <span class="text-xs font-medium text-gray-500">Kather Lab</span>
    </div>
  </div>
</template>
