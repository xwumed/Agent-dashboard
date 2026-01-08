<script setup lang="ts">
import { X, ExternalLink, FlaskConical, AlertTriangle } from 'lucide-vue-next'

defineProps<{
  open: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()
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
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">About</h2>
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-5">
          <!-- Research Disclaimer -->
          <div class="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <div class="flex gap-3">
              <AlertTriangle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-xs font-semibold text-amber-800 mb-1">Research Use Only</p>
                <p class="text-xs text-amber-700 leading-relaxed">
                  This tool is intended for research and educational purposes only.
                  It is not designed for clinical decision-making or production use.
                  Results should be validated independently before any application.
                </p>
              </div>
            </div>
          </div>

          <!-- About the Tool -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <FlaskConical class="w-4 h-4 text-gray-400" />
              <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wider">Agent Dashboard</h3>
            </div>
            <p class="text-xs text-gray-600 leading-relaxed">
              A visual multi-agent orchestration sandbox for constructing, configuring,
              and executing networks of AI agents. Designed for exploring agent collaboration,
              adversarial testing, and multi-agent system dynamics in pharmaceutical R&D contexts.
            </p>
          </div>

          <!-- Kather Lab -->
          <div class="border-t border-gray-100 pt-5">
            <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Developed by Kather Lab</h3>

            <div class="space-y-3">
              <div>
                <p class="text-xs font-medium text-gray-700">Prof. Dr. med. Jakob Nikolas Kather</p>
                <p class="text-xs text-gray-500">W3 Professor for Clinical Artificial Intelligence</p>
              </div>

              <div class="text-xs text-gray-600 leading-relaxed">
                <p class="mb-2">
                  The Kather Lab specializes in Computational Pathology, Foundation Models,
                  Natural Language Processing, and Swarm Learning for medical applications.
                </p>
              </div>

              <div class="space-y-1 text-xs text-gray-500">
                <p>EKFZ for Digital Health, TU Dresden</p>
                <p>Else Kroener Fresenius Center</p>
                <p>University Hospital Carl Gustav Carus Dresden</p>
                <p>Fetscherstrasse 74, 01307 Dresden, Germany</p>
              </div>

              <div class="flex flex-wrap gap-2 pt-2">
                <a
                  href="https://jnkather.github.io"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Lab Website
                  <ExternalLink class="w-3 h-3" />
                </a>
                <a
                  href="https://ekfz-healthtech.de"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  EKFZ
                  <ExternalLink class="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <!-- Version -->
          <div class="text-center pt-2 border-t border-gray-100">
            <p class="text-[10px] text-gray-400">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
