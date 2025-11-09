<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <NavBar />
    
    <div class="max-w-5xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Buscar Pull Requests
        </h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400">
          Selecciona un repositorio y rango de fechas para generar un resumen
        </p>
      </div>

      <!-- Search Form -->
      <div class="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-6">
        <form @submit.prevent="handleSearch" class="space-y-6">
          <!-- Repository Selection -->
          <div>
            <label for="repository" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Repositorio
            </label>
            <div class="relative">
              <select
                v-model="selectedRepo"
                id="repository"
                :disabled="loadingRepos"
                class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                  {{ loadingRepos ? 'Cargando repositorios...' : 'Selecciona un repositorio' }}
                </option>
                <option v-for="repo in repositories" :key="repo.id" :value="repo.full_name">
                  {{ repo.full_name }} {{ repo.private ? '🔒' : '' }}
                </option>
              </select>
              <button
                v-if="!loadingRepos"
                @click="loadRepositories"
                type="button"
                class="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Recargar repositorios"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p v-if="repositories.length > 0" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ repositories.length }} repositorios disponibles
            </p>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="start-date" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha de inicio
              </label>
              <input
                v-model="startDate"
                type="date"
                id="start-date"
                :max="endDate || today"
                class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label for="end-date" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fecha de fin
              </label>
              <input
                v-model="endDate"
                type="date"
                id="end-date"
                :min="startDate"
                :max="today"
                class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
          </div>

          <!-- Date Range Info & Warnings -->
          <div class="space-y-2">
            <div v-if="dateRangeDays > 0" class="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Rango seleccionado: <strong>{{ dateRangeDays }} días</strong></span>
            </div>

            <div v-if="dateRangeDays > 90" class="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <div class="flex">
                <svg class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="ml-3 text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Período muy amplio (>90 días). La búsqueda puede tardar varios minutos.
                </p>
              </div>
            </div>

            <div v-if="selectedRepo" class="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3">
              <div class="flex items-start">
                <svg class="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="ml-3 flex-1">
                  <p class="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Límites configurados:</strong> Hasta {{ configStore.maxPRsLimit }} PRs y {{ configStore.maxCommitsLimit }} commits
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Date Ranges -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="range in quickRanges"
              :key="range.label"
              @click.prevent="setDateRange(range.days)"
              type="button"
              class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {{ range.label }}
            </button>
          </div>

          <!-- Report Type Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Tipo de Informe
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                v-for="type in reportTypes"
                :key="type.id"
                @click.prevent="selectedReportType = type.id"
                :class="[
                  'relative p-4 border-2 rounded-lg text-left transition-all duration-200',
                  selectedReportType === type.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                ]"
                type="button"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <div :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selectedReportType === type.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-slate-300 dark:border-slate-600'
                    ]">
                      <svg v-if="selectedReportType === type.id" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-3 flex-1">
                    <p :class="[
                      'text-sm font-semibold',
                      selectedReportType === type.id
                        ? 'text-primary-900 dark:text-primary-100'
                        : 'text-slate-900 dark:text-white'
                    ]">
                      {{ type.name[currentLanguage] }}
                    </p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {{ type.description[currentLanguage] }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Analysis Scope Selection -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Alcance del Análisis
              </label>
              <div class="relative group">
                <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div class="absolute right-0 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg invisible group-hover:visible z-10">
                  <p class="font-semibold mb-2">¿Qué analizar?</p>
                  <ul class="space-y-2">
                    <li><strong>PRs:</strong> Solo Pull Requests revisados</li>
                    <li><strong>Commits:</strong> Commits directos del usuario</li>
                    <li><strong>Completo:</strong> Combina ambos (recomendado)</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                @click.prevent="analysisScope = 'prs'"
                :class="[
                  'p-4 border-2 rounded-lg text-center transition-all duration-200',
                  analysisScope === 'prs'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                ]"
                type="button"
              >
                <svg class="w-8 h-8 mx-auto mb-2" :class="analysisScope === 'prs' ? 'text-primary-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p :class="['text-sm font-semibold', analysisScope === 'prs' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-900 dark:text-white']">
                  Solo Pull Requests
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Analiza únicamente los PRs del período
                </p>
              </button>

              <button
                @click.prevent="analysisScope = 'commits'"
                :class="[
                  'p-4 border-2 rounded-lg text-center transition-all duration-200',
                  analysisScope === 'commits'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                ]"
                type="button"
              >
                <svg class="w-8 h-8 mx-auto mb-2" :class="analysisScope === 'commits' ? 'text-primary-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <p :class="['text-sm font-semibold', analysisScope === 'commits' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-900 dark:text-white']">
                  Solo Commits
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Analiza commits del usuario en el repo
                </p>
              </button>

              <button
                @click.prevent="analysisScope = 'both'"
                :class="[
                  'p-4 border-2 rounded-lg text-center transition-all duration-200',
                  analysisScope === 'both'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                ]"
                type="button"
              >
                <svg class="w-8 h-8 mx-auto mb-2" :class="analysisScope === 'both' ? 'text-primary-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p :class="['text-sm font-semibold', analysisScope === 'both' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-900 dark:text-white']">
                  Análisis Completo
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Incluye PRs y commits del usuario
                </p>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="ml-3 text-sm text-red-800 dark:text-red-200">{{ error }}</p>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !selectedRepo || !startDate || !endDate"
            class="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="!loading">🔍 Buscar y Generar Resumen</span>
            <span v-else>{{ loadingMessage }}</span>
          </button>

          <!-- Progress Bar -->
          <div v-if="loading" class="space-y-2">
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                :style="{ width: loadingProgress + '%' }"
              ></div>
            </div>
            <p class="text-xs text-center text-slate-600 dark:text-slate-400">
              {{ loadingStep }} de {{ totalSteps }} pasos completados
            </p>
          </div>
        </form>
      </div>

      <!-- Search History -->
      <div v-if="searchHistory.length > 0" class="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Búsquedas Recientes
        </h2>
        <div class="space-y-2">
          <button
            v-for="(search, index) in searchHistory"
            :key="index"
            @click="loadFromHistory(search)"
            class="w-full text-left px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900 dark:text-white">
                  {{ search.repository }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ search.startDate }} → {{ search.endDate }}
                </p>
              </div>
              <span class="text-xs text-slate-400 dark:text-slate-500">
                {{ formatDate(search.timestamp) }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { getUserRepositories, searchPullRequests, getPRDetails, searchCommitsByAuthor } from '@/services/github'
import { generatePRSummary, isGeminiConfigured, REPORT_TYPES } from '@/services/gemini'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const configStore = useConfigStore()

const repositories = ref([])
const selectedRepo = ref('')
const selectedReportType = ref('executive')
const analysisScope = ref('both')
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const loadingRepos = ref(false)
const loadingMessage = ref('Buscando PRs...')
const loadingProgress = ref(0)
const loadingStep = ref(0)
const totalSteps = ref(3)
const error = ref('')
const searchHistory = ref([])

const reportTypes = ref(Object.values(REPORT_TYPES))
const currentLanguage = computed(() => configStore.language)

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const dateRangeDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const quickRanges = [
  { label: 'Última semana', days: 7 },
  { label: 'Últimos 15 días', days: 15 },
  { label: 'Último mes', days: 30 },
  { label: 'Últimos 3 meses', days: 90 }
]

onMounted(async () => {
  // Set default dates (last week)
  setDateRange(7)
  
  // Load repositories
  await loadRepositories()
  
  // Load search history
  searchHistory.value = configStore.getSearchHistory()
  
  // Check Gemini configuration
  if (!configStore.geminiToken) {
    error.value = 'Por favor configura tu token de Gemini AI en Configuración'
  }
})

async function loadRepositories() {
  loadingRepos.value = true
  error.value = ''
  
  try {
    repositories.value = await getUserRepositories()
  } catch (err) {
    console.error('Error loading repositories:', err)
    error.value = 'Error al cargar los repositorios. Verifica tu token de GitHub.'
  } finally {
    loadingRepos.value = false
  }
}

function setDateRange(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  
  endDate.value = end.toISOString().split('T')[0]
  startDate.value = start.toISOString().split('T')[0]
}

function loadFromHistory(search) {
  selectedRepo.value = search.repository
  startDate.value = search.startDate
  endDate.value = search.endDate
}

async function handleSearch() {
  if (!configStore.geminiToken) {
    error.value = 'Por favor configura tu token de Gemini AI en Configuración'
    return
  }
  
  loading.value = true
  error.value = ''
  loadingProgress.value = 0
  loadingStep.value = 0
  
  // Calcular pasos totales según el alcance
  if (analysisScope.value === 'both') {
    totalSteps.value = 4 // PRs + Commits + IA
  } else {
    totalSteps.value = 3 // Solo una fuente + IA
  }
  
  try {
    const [owner, repo] = selectedRepo.value.split('/')
    let analysisData = null
    
    // Análisis según el alcance seleccionado
    if (analysisScope.value === 'prs' || analysisScope.value === 'both') {
      // Step 1: Search PRs
      loadingStep.value = 1
      loadingProgress.value = 25
      loadingMessage.value = 'Buscando Pull Requests...'
      const prs = await searchPullRequests(
        authStore.githubUser.login,
        selectedRepo.value,
        startDate.value,
        endDate.value
      )
      
      if (prs.length === 0 && analysisScope.value === 'prs') {
        error.value = 'No se encontraron Pull Requests en el rango de fechas seleccionado'
        loading.value = false
        return
      }
      
      // Step 2: Get detailed PR information
      if (prs.length > 0) {
        loadingStep.value = 2
        loadingProgress.value = 50
        loadingMessage.value = `Obteniendo detalles de ${prs.length} PRs...`
        const detailedPRs = await Promise.all(
          prs.slice(0, configStore.maxPRsLimit).map(async (pr) => {
            const details = await getPRDetails(owner, repo, pr.number)
            return {
              ...pr,
              commits: details.commits,
              files: details.files
            }
          })
        )
        
        if (analysisScope.value === 'prs') {
          // Solo PRs (estructura antigua)
          analysisData = detailedPRs
        } else {
          // Guardar PRs para análisis completo
          analysisData = {
            pullRequests: detailedPRs,
            userCommits: [],
            totalUserCommits: 0,
            repository: selectedRepo.value,
            author: authStore.githubUser.login,
            dateRange: {
              start: startDate.value,
              end: endDate.value
            }
          }
        }
      } else if (analysisScope.value === 'both') {
        // No hay PRs pero es análisis completo, inicializar estructura
        analysisData = {
          pullRequests: [],
          userCommits: [],
          totalUserCommits: 0,
          repository: selectedRepo.value,
          author: authStore.githubUser.login,
          dateRange: {
            start: startDate.value,
            end: endDate.value
          }
        }
      }
    }
    
    // Obtener commits del usuario si es necesario
    if (analysisScope.value === 'commits' || analysisScope.value === 'both') {
      loadingStep.value = analysisScope.value === 'both' ? 3 : 2
      loadingProgress.value = analysisScope.value === 'both' ? 65 : 50
      loadingMessage.value = 'Obteniendo commits del usuario...'
      const userCommits = await searchCommitsByAuthor(
        owner,
        repo,
        authStore.githubUser.login,
        startDate.value,
        endDate.value,
        configStore.maxCommitsLimit
      )
      
      if (userCommits.length === 0 && analysisScope.value === 'commits') {
        error.value = 'No se encontraron commits del usuario en el rango de fechas seleccionado'
        loading.value = false
        return
      }
      
      if (analysisScope.value === 'commits') {
        // Solo commits
        analysisData = {
          pullRequests: [],
          userCommits: userCommits,
          totalUserCommits: userCommits.length,
          repository: selectedRepo.value,
          author: authStore.githubUser.login,
          dateRange: {
            start: startDate.value,
            end: endDate.value
          }
        }
      } else if (analysisScope.value === 'both') {
        // Agregar commits al análisis completo
        analysisData.userCommits = userCommits
        analysisData.totalUserCommits = userCommits.length
      }
    }
    
    // Validar que tengamos datos para analizar
    if (!analysisData) {
      error.value = 'No se encontraron datos para analizar'
      loading.value = false
      return
    }
    
    // Generate AI summary
    loadingStep.value = analysisScope.value === 'both' ? 4 : 3
    loadingProgress.value = 85
    loadingMessage.value = 'Generando resumen con IA...'
    const summary = await generatePRSummary(analysisData, configStore.language, selectedReportType.value)
    
    loadingProgress.value = 100
    
    // Calcular conteo de PRs para el historial
    const prCount = Array.isArray(analysisData) 
      ? analysisData.length 
      : analysisData.pullRequests?.length || 0
    
    // Save to history
    configStore.saveSearchHistory({
      repository: selectedRepo.value,
      startDate: startDate.value,
      endDate: endDate.value,
      prCount: prCount,
      analysisScope: analysisScope.value,
      reportType: selectedReportType.value
    })
    
    // Navigate to results
    router.push({
      name: 'Results',
      state: {
        summary,
        metadata: {
          repository: selectedRepo.value,
          author: authStore.githubUser.login,
          dateRange: {
            start: startDate.value,
            end: endDate.value
          },
          prCount: prCount,
          analysisScope: analysisScope.value,
          pullRequests: Array.isArray(analysisData) ? analysisData : analysisData.pullRequests,
          userCommits: Array.isArray(analysisData) ? [] : analysisData.userCommits
        }
      }
    })
    
  } catch (err) {
    console.error('Search error:', err)
    error.value = err.message || 'Error al buscar los Pull Requests. Por favor intenta nuevamente.'
  } finally {
    loading.value = false
    loadingMessage.value = 'Buscando PRs...'
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  
  return date.toLocaleDateString()
}
</script>
