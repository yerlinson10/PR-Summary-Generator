import axios from 'axios'

const GITHUB_API_BASE = 'https://api.github.com'

// GitHub OAuth Config
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin + '/callback'
export const OAUTH_SERVER_URL = import.meta.env.VITE_OAUTH_SERVER_URL || 'http://localhost:3001'

export const githubAPI = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
})

// Set token interceptor
export function setGithubToken(token) {
  if (token) {
    githubAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete githubAPI.defaults.headers.common['Authorization']
  }
}

// Get authenticated user
export async function getAuthenticatedUser(token) {
  setGithubToken(token)
  const response = await githubAPI.get('/user')
  return response.data
}

// Get user repositories
export async function getUserRepositories(page = 1, perPage = 100) {
  try {
    let allRepos = []
    let currentPage = 1
    let hasMore = true
    
    // Obtener todos los repositorios paginados (hasta 300 repos)
    while (hasMore && currentPage <= 3) {
      const userReposResponse = await githubAPI.get('/user/repos', {
        params: {
          sort: 'updated',
          per_page: 100,
          page: currentPage,
          affiliation: 'owner,collaborator,organization_member',
          visibility: 'all' // Incluir públicos y privados
          // NO usar 'type' junto con 'affiliation' y 'visibility'
        }
      })
      
      const repos = userReposResponse.data
      
      if (repos.length === 0) {
        hasMore = false
      } else {
        allRepos = [...allRepos, ...repos]
        currentPage++
      }
    }
    
    // Intentar obtener repos adicionales de organizaciones usando endpoint alternativo
    try {
      const orgsResponse = await githubAPI.get('/user/orgs', {
        params: {
          per_page: 100
        }
      })
      
      const organizations = orgsResponse.data
      console.log(`📊 Organizaciones encontradas: ${organizations.length}`, organizations.map(o => o.login))
      
      // Para cada organización, intentar obtener repos que el usuario puede ver
      for (const org of organizations) {
        try {
          // Usar el endpoint de repos del usuario filtrando por organización
          // Esto respeta los permisos del usuario en la organización
          const orgReposResponse = await githubAPI.get(`/orgs/${org.login}/repos`, {
            params: {
              per_page: 100,
              sort: 'updated',
              type: 'all'
            }
          })
          
          console.log(`📦 Repos de ${org.login}: ${orgReposResponse.data.length}`)
          
          // Agregar repos que no estén ya en la lista
          const newRepos = orgReposResponse.data.filter(orgRepo => 
            !allRepos.some(existingRepo => existingRepo.id === orgRepo.id)
          )
          
          if (newRepos.length > 0) {
            console.log(`➕ Agregando ${newRepos.length} repos nuevos de ${org.login}`)
            allRepos = [...allRepos, ...newRepos]
          }
        } catch (orgError) {
          console.warn(`⚠️ No se pudieron obtener repos de ${org.login}:`, orgError.response?.status, orgError.message)
          
          // Si falla con 404, intentar obtener repos del equipo
          if (orgError.response?.status === 404) {
            try {
              // Intentar obtener equipos de la organización
              const teamsResponse = await githubAPI.get(`/orgs/${org.login}/teams`, {
                params: { per_page: 100 }
              })
              
              // Para cada equipo, obtener sus repos
              for (const team of teamsResponse.data) {
                try {
                  const teamReposResponse = await githubAPI.get(`/teams/${team.id}/repos`, {
                    params: { per_page: 100 }
                  })
                  
                  const newTeamRepos = teamReposResponse.data.filter(teamRepo => 
                    !allRepos.some(existingRepo => existingRepo.id === teamRepo.id)
                  )
                  
                  allRepos = [...allRepos, ...newTeamRepos]
                } catch (teamError) {
                  console.warn(`⚠️ Error obteniendo repos del equipo ${team.name}:`, teamError.message)
                }
              }
            } catch (teamsError) {
              console.warn(`⚠️ No se pudieron obtener equipos de ${org.login}:`, teamsError.message)
            }
          }
        }
      }
    } catch (orgError) {
      console.warn('⚠️ No se pudieron obtener organizaciones:', orgError)
    }
    
    // Eliminar duplicados por si acaso (por ID)
    const uniqueRepos = Array.from(
      new Map(allRepos.map(repo => [repo.id, repo])).values()
    )
    
    // Ordenar por fecha de actualización
    uniqueRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    
    console.log(`✅ Total de repositorios encontrados: ${uniqueRepos.length}`)
    
    return uniqueRepos
  } catch (error) {
    console.error('❌ Error fetching repositories:', error)
    
    // Si falla, intentar con parámetros más básicos
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.warn('⚠️ Falling back to basic repo fetch (permission issue)')
      const fallbackResponse = await githubAPI.get('/user/repos', {
        params: {
          sort: 'updated',
          per_page: 100,
          page: 1
          // Solo parámetros básicos en fallback
        }
      })
      return fallbackResponse.data
    }
    
    throw error
  }
}

// Search Pull Requests
export async function searchPullRequests(author, repo, startDate, endDate) {
  const query = `is:pr author:${author} repo:${repo} created:${startDate}..${endDate}`
  
  const response = await githubAPI.get('/search/issues', {
    params: {
      q: query,
      sort: 'created',
      order: 'desc',
      per_page: 100
    }
  })
  
  return response.data.items
}

// Get PR details including commits and files
export async function getPRDetails(owner, repo, prNumber) {
  const [prData, commits, files] = await Promise.all([
    githubAPI.get(`/repos/${owner}/${repo}/pulls/${prNumber}`),
    githubAPI.get(`/repos/${owner}/${repo}/pulls/${prNumber}/commits`),
    githubAPI.get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
  ])

  return {
    pr: prData.data,
    commits: commits.data,
    files: files.data
  }
}

// Search commits by author in a repository
export async function searchCommitsByAuthor(owner, repo, author, startDate, endDate, maxCommits = 100) {
  try {
    const response = await githubAPI.get(`/repos/${owner}/${repo}/commits`, {
      params: {
        author: author,
        since: new Date(startDate).toISOString(),
        until: new Date(endDate + 'T23:59:59').toISOString(),
        per_page: maxCommits
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error fetching commits:', error)
    return []
  }
}

// OAuth login URL
export function getGithubLoginUrl() {
  // Scopes optimizados: balance entre permisos y seguridad
  // Nota: algunos scopes "admin:*" pueden ser bloqueados por organizaciones
  const scopes = [
    'repo',              // Acceso COMPLETO a repositorios (incluye read, write, admin)
    'read:org',          // Leer organizaciones (CRÍTICO para ver repos de org)
    'read:user',         // Leer perfil de usuario
    'user:email',        // Leer email del usuario
    'read:project',      // Leer proyectos
    'workflow',          // Acceso a GitHub Actions workflows
    'notifications',     // Notificaciones
    'project'            // Proyectos (write access)
  ]
  const scopeParam = encodeURIComponent(scopes.join(' '))
  const redirectParam = encodeURIComponent(REDIRECT_URI)
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectParam}&scope=${scopeParam}&response_type=code`
}

// Exchange code for token (calls backend)
export async function exchangeCodeForToken(code) {
  try {
    const response = await axios.post(`${OAUTH_SERVER_URL}/api/auth/github`, {
      code: code
    })
    
    return {
      token: response.data.token,
      user: response.data.user
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    throw new Error(error.response?.data?.error || 'Failed to authenticate with GitHub')
  }
}

// Check if OAuth is configured
export function isOAuthConfigured() {
  return GITHUB_CLIENT_ID && GITHUB_CLIENT_ID !== '' && GITHUB_CLIENT_ID !== 'your_github_client_id_here'
}
