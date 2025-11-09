/**
 * Composable para manejo de búsqueda de PRs y commits
 */
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { searchPullRequests, getPRDetails, searchCommitsByAuthor } from '@/services/github'
import { validateDateRange, sanitizeRepoName, validateAnalysisData } from '@/utils/validation'
import { handleAPIError } from '@/services/errorHandler'
import { githubCache } from '@/utils/cache'

export function useGitHubSearch() {
  const authStore = useAuthStore()
  const configStore = useConfigStore()
  
  const loading = ref(false)
  const loadingMessage = ref('')
  const loadingProgress = ref(0)
  const loadingStep = ref(0)
  const totalSteps = ref(3)
  const error = ref('')

  /**
   * Busca PRs de un repositorio
   */
  async function searchPRs(repo, startDate, endDate, maxPRs) {
    const { owner, repo: repoName } = sanitizeRepoName(repo)
    
    // Verificar caché
    const cacheKey = githubCache.prs(repo, startDate, endDate)
    const cached = cacheKey.get()
    if (cached) {
      console.log('📦 Using cached PRs')
      return cached
    }
    
    loadingStep.value++
    loadingProgress.value = 25
    loadingMessage.value = 'Buscando Pull Requests...'
    
    const prs = await searchPullRequests(
      authStore.githubUser.login,
      repo,
      startDate,
      endDate
    )
    
    if (prs.length === 0) {
      return []
    }
    
    loadingStep.value++
    loadingProgress.value = 50
    loadingMessage.value = `Obteniendo detalles de ${prs.length} PRs...`
    
    const detailedPRs = await Promise.all(
      prs.slice(0, maxPRs).map(async (pr) => {
        try {
          const details = await getPRDetails(owner, repoName, pr.number)
          return {
            ...pr,
            commits: details.commits,
            files: details.files
          }
        } catch (err) {
          console.warn(`⚠️ Error fetching PR #${pr.number}:`, err.message)
          return { ...pr, commits: [], files: [] }
        }
      })
    )
    
    // Cachear resultado
    cacheKey.set(detailedPRs)
    
    return detailedPRs
  }

  /**
   * Busca commits de un usuario
   */
  async function searchCommits(repo, startDate, endDate, maxCommits) {
    const { owner, repo: repoName } = sanitizeRepoName(repo)
    
    // Verificar caché
    const cacheKey = githubCache.commits(repo, authStore.githubUser.login, startDate, endDate)
    const cached = cacheKey.get()
    if (cached) {
      console.log('📦 Using cached commits')
      return cached
    }
    
    loadingMessage.value = 'Obteniendo commits del usuario...'
    
    const commits = await searchCommitsByAuthor(
      owner,
      repoName,
      authStore.githubUser.login,
      startDate,
      endDate,
      maxCommits
    )
    
    // Cachear resultado
    cacheKey.set(commits)
    
    return commits
  }

  /**
   * Realiza búsqueda completa según el alcance
   */
  async function performSearch(options) {
    const {
      repository,
      startDate,
      endDate,
      analysisScope = 'both',
      maxPRs = 50,
      maxCommits = 50
    } = options
    
    try {
      // Validar entradas
      validateDateRange(startDate, endDate)
      const { owner, repo } = sanitizeRepoName(repository)
      
      loading.value = true
      error.value = ''
      loadingProgress.value = 0
      loadingStep.value = 0
      
      // Calcular pasos totales
      totalSteps.value = analysisScope === 'both' ? 4 : 3
      
      let analysisData = null
      
      // Búsqueda de PRs
      if (analysisScope === 'prs' || analysisScope === 'both') {
        const prs = await searchPRs(repository, startDate, endDate, maxPRs)
        
        if (prs.length === 0 && analysisScope === 'prs') {
          throw new Error('No se encontraron Pull Requests en el rango de fechas seleccionado')
        }
        
        analysisData = analysisScope === 'prs' 
          ? prs 
          : {
              pullRequests: prs,
              userCommits: [],
              totalUserCommits: 0,
              repository,
              author: authStore.githubUser.login,
              dateRange: { start: startDate, end: endDate }
            }
      }
      
      // Búsqueda de commits
      if (analysisScope === 'commits' || analysisScope === 'both') {
        loadingStep.value++
        loadingProgress.value = analysisScope === 'both' ? 65 : 50
        
        const commits = await searchCommits(repository, startDate, endDate, maxCommits)
        
        if (commits.length === 0 && analysisScope === 'commits') {
          throw new Error('No se encontraron commits del usuario en el rango de fechas seleccionado')
        }
        
        if (analysisScope === 'commits') {
          analysisData = {
            pullRequests: [],
            userCommits: commits,
            totalUserCommits: commits.length,
            repository,
            author: authStore.githubUser.login,
            dateRange: { start: startDate, end: endDate }
          }
        } else if (analysisScope === 'both') {
          analysisData.userCommits = commits
          analysisData.totalUserCommits = commits.length
        }
      }
      
      // Validar datos antes de retornar
      const validated = validateAnalysisData(analysisData)
      
      loadingProgress.value = 100
      
      return validated
      
    } catch (err) {
      const apiError = handleAPIError(err, 'búsqueda')
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }

  /**
   * Resetea el estado de búsqueda
   */
  function reset() {
    loading.value = false
    loadingMessage.value = ''
    loadingProgress.value = 0
    loadingStep.value = 0
    error.value = ''
  }

  return {
    // Estado
    loading: computed(() => loading.value),
    loadingMessage: computed(() => loadingMessage.value),
    loadingProgress: computed(() => loadingProgress.value),
    loadingStep: computed(() => loadingStep.value),
    totalSteps: computed(() => totalSteps.value),
    error: computed(() => error.value),
    
    // Métodos
    performSearch,
    searchPRs,
    searchCommits,
    reset
  }
}
