/**
 * Composable para manejo de repositorios de GitHub
 */
import { ref, computed } from 'vue'
import { getUserRepositories } from '@/services/github'
import { handleAPIError } from '@/services/errorHandler'
import { githubCache } from '@/utils/cache'

export function useRepositories() {
  const repositories = ref([])
  const loading = ref(false)
  const error = ref('')
  
  /**
   * Carga repositorios con caché
   */
  async function loadRepositories(forceRefresh = false) {
    // Verificar caché
    if (!forceRefresh) {
      const cached = githubCache.repos.get()
      if (cached) {
        console.log('📦 Using cached repositories')
        repositories.value = cached
        return cached
      }
    }
    
    loading.value = true
    error.value = ''
    
    try {
      const repos = await getUserRepositories()
      repositories.value = repos
      
      // Cachear resultado
      githubCache.repos.set(repos)
      
      return repos
    } catch (err) {
      const apiError = handleAPIError(err, 'carga de repositorios')
      error.value = apiError.message
      throw apiError
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Filtra repositorios por texto
   */
  function filterRepositories(searchText) {
    if (!searchText) return repositories.value
    
    const search = searchText.toLowerCase()
    return repositories.value.filter(repo => 
      repo.full_name.toLowerCase().includes(search) ||
      repo.description?.toLowerCase().includes(search)
    )
  }
  
  /**
   * Obtiene repositorios por tipo
   */
  const publicRepos = computed(() => 
    repositories.value.filter(r => !r.private)
  )
  
  const privateRepos = computed(() => 
    repositories.value.filter(r => r.private)
  )
  
  const ownedRepos = computed(() => 
    repositories.value.filter(r => r.owner?.type === 'User')
  )
  
  const orgRepos = computed(() => 
    repositories.value.filter(r => r.owner?.type === 'Organization')
  )
  
  /**
   * Estadísticas de repositorios
   */
  const stats = computed(() => ({
    total: repositories.value.length,
    public: publicRepos.value.length,
    private: privateRepos.value.length,
    owned: ownedRepos.value.length,
    organization: orgRepos.value.length
  }))
  
  return {
    // Estado
    repositories: computed(() => repositories.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Computados
    publicRepos,
    privateRepos,
    ownedRepos,
    orgRepos,
    stats,
    
    // Métodos
    loadRepositories,
    filterRepositories
  }
}
