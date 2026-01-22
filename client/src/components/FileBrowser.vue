<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="close"></div>
      
      <!-- Dialog -->
      <div class="relative bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
          <div class="flex items-center gap-2">
            <FolderOpen class="w-5 h-5 text-blue-600" />
            <h3 class="font-semibold text-gray-800">Select {{ mode === 'file' ? 'File' : 'File or Folder' }}</h3>
          </div>
          <button @click="close" class="p-1 hover:bg-gray-200 rounded transition-colors">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <!-- Path Bar -->
        <div class="px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
          <!-- Drives dropdown -->
          <select 
            v-model="selectedDrive"
            @change="navigateToPath(selectedDrive)"
            class="px-2 py-1 text-sm border rounded bg-white"
          >
            <option v-for="d in drives" :key="d.path" :value="d.path">{{ d.name }}</option>
          </select>
          
          <!-- Current path display -->
          <div class="flex-1 flex items-center gap-1 px-2 py-1 bg-white border rounded text-sm font-mono truncate">
            <span class="truncate text-gray-600">{{ currentPath }}</span>
          </div>
          
          <!-- Up button -->
          <button 
            @click="goUp"
            :disabled="!parentPath"
            class="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30"
          >
            <ArrowUp class="w-4 h-4" />
          </button>
        </div>
        
        <!-- File List -->
        <div class="flex-1 overflow-y-auto min-h-[300px] max-h-[400px]">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
          </div>
          
          <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
          
          <div v-else-if="items.length === 0" class="text-center py-8 text-gray-400">
            No JSON files or folders found
          </div>
          
          <div v-else class="divide-y">
            <div
              v-for="item in items"
              :key="item.path"
              @click="selectItem(item)"
              @dblclick="handleDoubleClick(item)"
              :class="[
                'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                selectedPath === item.path ? 'bg-blue-100' : 'hover:bg-gray-50'
              ]"
            >
              <component 
                :is="item.is_dir ? Folder : FileText" 
                :class="['w-5 h-5', item.is_dir ? 'text-amber-500' : 'text-blue-500']"
              />
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span v-if="!item.is_dir && item.size" class="text-xs text-gray-400">
                {{ formatSize(item.size) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-lg">
          <div class="text-sm text-gray-500 truncate max-w-[300px]" :title="selectedPath">
            {{ selectedPath ? selectedPath.split(/[/\\]/).pop() : 'No selection' }}
          </div>
          <div class="flex gap-2">
            <button 
              @click="close"
              class="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="confirm"
              :disabled="!selectedPath"
              class="px-4 py-1.5 text-sm text-white bg-blue-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 font-medium shadow-sm"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { FolderOpen, X, ArrowUp, Folder, FileText, Loader2 } from 'lucide-vue-next'

interface FileItem {
  name: string
  path: string
  is_dir: boolean
  size?: number
}

interface Drive {
  name: string
  path: string
}

const props = defineProps<{
  isOpen: boolean
  mode?: 'file' | 'any'  // 'file' = only files, 'any' = files or folders
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', path: string): void
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const drives = ref<Drive[]>([])
const selectedDrive = ref('')
const currentPath = ref('')
const parentPath = ref<string | null>(null)
const items = ref<FileItem[]>([])
const selectedPath = ref<string | null>(null)

// Load drives on mount
onMounted(async () => {
  try {
    const res = await fetch('/api/drives')
    const data = await res.json()
    drives.value = data.drives
    if (drives.value.length > 0) {
      // Try to load last path from localStorage first
      const savedPath = localStorage.getItem('last_browser_path')
      if (savedPath) {
        // If saved path exists, use it (we will navigate to it when dialog opens)
        currentPath.value = savedPath
        // Also try to match drive
        const pathDrive = drives.value.find(d => savedPath.startsWith(d.path.replace(/\\$/, '')))
        selectedDrive.value = pathDrive ? pathDrive.path : drives.value[0].path
      } else {
        selectedDrive.value = drives.value[0].path
      }
    }
  } catch (err) {
    console.error('Failed to load drives:', err)
  }
})

// Browse when dialog opens
watch(() => props.isOpen, (open) => {
  if (open) {
    selectedPath.value = null
    
    // logic: if currentPath is set (from previous navigation or localStorage), use it.
    // Otherwise use selected drive.
    const pathToNav = currentPath.value || selectedDrive.value
    if (pathToNav) {
      navigateToPath(pathToNav)
    }
  }
})

async function navigateToPath(path: string) {
  loading.value = true
  error.value = null
  selectedPath.value = null
  
  try {
    const res = await fetch('/api/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    })
    
    if (!res.ok) {
      const err = await res.json()
      // If path not found (maybe changed/deleted), fallback to drive root or home
      if (res.status === 404 && path !== selectedDrive.value) {
         console.warn("Path not found, falling back to drive root")
         navigateToPath(selectedDrive.value)
         return
      }
      throw new Error(err.detail || 'Failed to browse')
    }
    
    const data = await res.json()
    currentPath.value = data.current_path
    parentPath.value = data.parent_path
    items.value = data.items
    
    // Save to localStorage
    localStorage.setItem('last_browser_path', currentPath.value)
    
    // Update selected drive if path is on a different drive
    const pathDrive = drives.value.find(d => currentPath.value.startsWith(d.path.replace(/\\$/, '')))
    if (pathDrive) {
      selectedDrive.value = pathDrive.path
    }
    
  } catch (err: any) {
    error.value = err.message
    items.value = []
  } finally {
    loading.value = false
  }
}

function goUp() {
  if (parentPath.value) {
    navigateToPath(parentPath.value)
  }
}

function selectItem(item: FileItem) {
  if (props.mode === 'file' && item.is_dir) {
    // In file-only mode, clicking folder navigates
    navigateToPath(item.path)
  } else {
    // Otherwise, select the item
    selectedPath.value = item.path
  }
}

function handleDoubleClick(item: FileItem) {
  if (item.is_dir) {
    navigateToPath(item.path)
  } else {
    // Double-click on file confirms selection
    selectedPath.value = item.path
    confirm()
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function close() {
  emit('close')
}

function confirm() {
  if (selectedPath.value) {
    emit('select', selectedPath.value)
    emit('close')
  }
}
</script>
