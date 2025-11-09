<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <NavBar />
    
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header with Actions -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
            Resumen Generado
          </h1>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {{ metadata?.repository }} • {{ metadata?.dateRange?.start }} → {{ metadata?.dateRange?.end }}
            <span class="ml-2">• {{ metadata?.prCount }} PRs</span>
          </p>
        </div>
        
        <div class="flex space-x-3">
          <button
            @click="saveAsDraft"
            class="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Guardar Borrador
          </button>
          
          <button
            @click="handleExportPDF"
            :disabled="exporting"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="!exporting" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <svg v-else class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ exporting ? 'Generando PDF...' : 'Exportar PDF' }}
          </button>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <p class="ml-3 text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
        </div>
      </div>

      <div v-if="errorMessage" class="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="ml-3 text-sm text-red-800 dark:text-red-200">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3">
                <svg class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Pull Requests</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ metadata?.prCount || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Commits</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalCommits }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Archivos</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalFiles }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Período</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ dateRangeDays }} días</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
        <div class="flex flex-wrap gap-3">
          <button
            @click="copyToClipboard"
            class="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar Texto
          </button>

          <button
            @click="newSearch"
            class="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Nueva Búsqueda
          </button>

          <button
            @click="clearEditor"
            class="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar
          </button>
        </div>
      </div>

      <!-- Editor Container -->
      <div class="bg-white dark:bg-slate-800 shadow-2xl rounded-xl overflow-hidden border-2 border-primary-200 dark:border-primary-800">
        <!-- Editor Header -->
        <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="bg-white dark:bg-slate-900 rounded-lg p-2">
                <svg class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">
                  Editor de Resumen
                </h2>
                <p class="text-primary-100 text-sm">
                  Edita y personaliza tu resumen generado por IA
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center">
                <svg class="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8"/>
                </svg>
                Editor Activo
              </span>
            </div>
          </div>
        </div>

        <!-- Editor Toolbar Info -->
        <div class="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-6 text-slate-600 dark:text-slate-400">
              <span class="flex items-center">
                <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Presiona TAB para opciones
              </span>
              <span class="flex items-center">
                <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Arrastra bloques para reordenar
              </span>
              <span class="flex items-center">
                <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Usa / para comandos rápidos
              </span>
            </div>
          </div>
        </div>
        
        <!-- Editor Content Area -->
        <div class="p-8 min-h-[600px] bg-white dark:bg-slate-800">
          <div id="editorjs" class="prose prose-lg dark:prose-invert max-w-none"></div>
        </div>

        <!-- Editor Footer -->
        <div class="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-t border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div class="flex items-center space-x-4">
              <span>✨ Generado con IA</span>
              <span>•</span>
              <span>📝 Editor.js</span>
            </div>
            <div class="flex items-center space-x-2">
              <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs">Z</kbd>
              <span class="ml-2">para deshacer</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="mt-6">
        <button
          @click="router.push('/search')"
          class="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a búsqueda
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { createEditor, parseMarkdownToEditorJS } from '@/services/editor'
import { exportToPDF, generateFilename } from '@/services/pdf'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()
const configStore = useConfigStore()

const editor = ref(null)
const metadata = ref(null)
const exporting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed stats
const totalCommits = computed(() => {
  if (!metadata.value) return 0
  const prs = metadata.value.pullRequests || []
  const userCommits = metadata.value.userCommits || []
  return prs.reduce((sum, pr) => sum + (pr.commits?.length || 0), 0) + userCommits.length
})

const totalFiles = computed(() => {
  if (!metadata.value) return 0
  const prs = metadata.value.pullRequests || []
  return prs.reduce((sum, pr) => sum + (pr.files?.length || 0), 0)
})

const dateRangeDays = computed(() => {
  if (!metadata.value?.dateRange) return 0
  const start = new Date(metadata.value.dateRange.start)
  const end = new Date(metadata.value.dateRange.end)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

onMounted(async () => {
  // Get data from router state
  const state = history.state
  
  if (!state || !state.summary) {
    router.push('/search')
    return
  }
  
  metadata.value = state.metadata
  
  // Parse markdown to EditorJS format
  const editorData = parseMarkdownToEditorJS(state.summary)
  
  // Initialize Editor.js with a small delay to avoid race conditions
  try {
    // Add small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    editor.value = createEditor('editorjs', editorData, false)
    
    // Wait for editor to be fully ready
    await editor.value.isReady
    console.log('Editor initialized successfully with', editorData.blocks.length, 'blocks')
  } catch (error) {
    console.error('Error initializing editor:', error)
    errorMessage.value = 'Error al inicializar el editor'
  }
})

onBeforeUnmount(() => {
  if (editor.value && editor.value.destroy) {
    editor.value.destroy()
  }
})

async function saveAsDraft() {
  try {
    const savedData = await editor.value.save()
    
    const draft = {
      id: Date.now(),
      metadata: metadata.value,
      editorData: savedData,
      savedAt: new Date().toISOString()
    }
    
    configStore.saveDraft(draft)
    showSuccess('Borrador guardado correctamente')
  } catch (error) {
    console.error('Error saving draft:', error)
    showError('Error al guardar el borrador')
  }
}

async function handleExportPDF() {
  exporting.value = true
  errorMessage.value = ''
  
  try {
    const savedData = await editor.value.save()
    const filename = generateFilename(
      metadata.value.repository,
      metadata.value.dateRange.start,
      metadata.value.dateRange.end
    )
    
    await exportToPDF(savedData, filename)
    showSuccess('PDF generado exitosamente')
  } catch (error) {
    console.error('Error exporting PDF:', error)
    showError('Error al generar el PDF. Por favor intenta nuevamente.')
  } finally {
    exporting.value = false
  }
}

function showSuccess(message) {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

function showError(message) {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

// Quick Actions
async function copyToClipboard() {
  try {
    const savedData = await editor.value.save()
    const text = savedData.blocks.map(block => {
      if (block.type === 'paragraph') return block.data.text
      if (block.type === 'header') return block.data.text
      if (block.type === 'list') return block.data.items.join('\n')
      return ''
    }).filter(Boolean).join('\n\n')
    
    await navigator.clipboard.writeText(text)
    showSuccess('📋 Texto copiado al portapapeles')
  } catch (error) {
    console.error('Error copying:', error)
    showError('Error al copiar el texto')
  }
}

function newSearch() {
  router.push('/search')
}

async function clearEditor() {
  if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
    try {
      await editor.value.clear()
      showSuccess('✨ Editor limpiado')
    } catch (error) {
      console.error('Error clearing editor:', error)
      showError('Error al limpiar el editor')
    }
  }
}
</script>

<style>
/* Additional EditorJS styling */
.codex-editor {
  @apply text-slate-900 dark:text-slate-100;
}

/* Ensure toolbar is always on the LEFT side */
.ce-toolbar {
  left: 0 !important;
  right: auto !important;
}

.ce-toolbar__actions {
  left: 0 !important;
  right: auto !important;
}

.ce-toolbar__plus {
  left: -40px !important;
  right: auto !important;
}

.ce-toolbar__settings-btn {
  left: 0px !important;
  right: auto !important;
}

/* Ensure content has space on the left for toolbar */
.ce-block__content {
  @apply max-w-full;
  margin-left: 60px !important;
  margin-right: 0 !important;
}

/* Position settings menu on the right when opened */
.ce-settings {
  left: auto !important;
  right: 20px !important;
}

.ce-toolbar__plus,
.ce-toolbar__settings-btn {
  @apply text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400;
  @apply transition-colors duration-200;
}

.ce-inline-tool,
.ce-conversion-tool {
  @apply text-slate-700 dark:text-slate-300;
}

.ce-inline-tool:hover,
.ce-conversion-tool:hover {
  @apply bg-primary-50 dark:bg-primary-900/20;
  @apply text-primary-600 dark:text-primary-400;
}

.ce-toolbar__plus:hover,
.ce-toolbar__settings-btn:hover {
  @apply bg-primary-50 dark:bg-primary-900/20;
}

/* Better paragraph styling */
.ce-paragraph {
  @apply text-base leading-relaxed;
}

/* Header styling */
.ce-header {
  @apply font-bold;
}

/* Code block styling */
.ce-code__textarea {
  @apply bg-slate-900 dark:bg-slate-950 text-slate-100;
  @apply border border-slate-700 rounded-lg;
  @apply font-mono text-sm;
}

/* List styling */
.cdx-list__item {
  @apply leading-relaxed;
}

/* Quote styling */
.cdx-quote {
  @apply border-l-4 border-primary-500;
  @apply bg-primary-50 dark:bg-primary-900/10;
}

/* Table styling */
.tc-table {
  @apply border-collapse;
}

.tc-table__cell {
  @apply border border-slate-300 dark:border-slate-600;
  @apply p-2;
}

/* Delimiter styling */
.ce-delimiter {
  @apply text-primary-400;
}

/* Focus states */
.ce-block--focused {
  @apply bg-primary-50/50 dark:bg-primary-900/10;
  @apply rounded-lg;
}

/* Placeholder */
.ce-block__content:empty:before {
  @apply text-slate-400 dark:text-slate-500;
}

/* Improved prose styles for the editor */
#editorjs .ce-block {
  @apply mb-4;
}

#editorjs h1 {
  @apply text-3xl font-bold text-slate-900 dark:text-white mt-8 mb-4;
}

#editorjs h2 {
  @apply text-2xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3;
}

#editorjs h3 {
  @apply text-xl font-semibold text-slate-700 dark:text-slate-200 mt-5 mb-2;
}

#editorjs h4 {
  @apply text-lg font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2;
}

#editorjs p {
  @apply text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-3;
}

#editorjs ul,
#editorjs ol {
  @apply my-4 space-y-2;
}

#editorjs li {
  @apply text-slate-600 dark:text-slate-300;
}

#editorjs blockquote {
  @apply italic text-slate-700 dark:text-slate-300;
}

#editorjs code {
  @apply bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono;
  @apply text-primary-600 dark:text-primary-400;
}

/* Smooth transitions */
.ce-block,
.ce-toolbar__plus,
.ce-toolbar__settings-btn,
.ce-inline-tool {
  @apply transition-all duration-200;
}
</style>
