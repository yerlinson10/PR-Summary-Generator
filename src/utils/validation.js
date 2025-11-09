/**
 * Utilidades para validación y sanitización de datos
 */

/**
 * Valida que un objeto tenga las propiedades requeridas
 */
export function validateRequired(obj, requiredFields, objectName = 'Object') {
  const missing = []
  
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
      missing.push(field)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`${objectName} missing required fields: ${missing.join(', ')}`)
  }
  
  return true
}

/**
 * Valida estructura de PR de GitHub
 */
export function validatePullRequest(pr) {
  try {
    validateRequired(pr, ['number', 'title', 'state'], 'Pull Request')
    
    return {
      number: pr.number,
      title: pr.title || 'Sin título',
      state: pr.state,
      user: pr.user?.login || 'Unknown',
      created_at: pr.created_at || new Date().toISOString(),
      labels: Array.isArray(pr.labels) ? pr.labels : [],
      commits: Array.isArray(pr.commits) ? pr.commits : [],
      files: Array.isArray(pr.files) ? pr.files : []
    }
  } catch (error) {
    console.warn('Invalid PR data:', error.message, pr)
    // Retornar PR con valores por defecto en lugar de fallar
    return {
      number: pr.number || 0,
      title: pr.title || 'PR sin título',
      state: pr.state || 'unknown',
      user: pr.user?.login || 'Unknown',
      created_at: pr.created_at || new Date().toISOString(),
      labels: [],
      commits: [],
      files: []
    }
  }
}

/**
 * Valida estructura de commit de GitHub
 */
export function validateCommit(commit) {
  try {
    validateRequired(commit, ['sha', 'commit'], 'Commit')
    validateRequired(commit.commit, ['message'], 'Commit.commit')
    
    return {
      sha: commit.sha,
      message: commit.commit.message || 'Sin mensaje',
      author: commit.commit.author?.name || commit.author?.login || 'Unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url || ''
    }
  } catch (error) {
    console.warn('Invalid commit data:', error.message, commit)
    return {
      sha: commit.sha || 'unknown',
      message: 'Commit sin mensaje',
      author: 'Unknown',
      date: new Date().toISOString(),
      url: ''
    }
  }
}

/**
 * Valida rango de fechas
 */
export function validateDateRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime())) {
    throw new Error('Fecha de inicio inválida')
  }
  
  if (isNaN(end.getTime())) {
    throw new Error('Fecha de fin inválida')
  }
  
  if (start > end) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de fin')
  }
  
  const today = new Date()
  if (end > today) {
    throw new Error('La fecha de fin no puede ser futura')
  }
  
  // Advertencia para rangos muy amplios (>180 días)
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  if (diffDays > 180) {
    console.warn(`⚠️ Rango de fechas muy amplio: ${diffDays} días`)
  }
  
  return { start, end, diffDays }
}

/**
 * Valida configuración de límites
 */
export function validateLimits(maxPRs, maxCommits) {
  if (!Number.isInteger(maxPRs) || maxPRs < 1 || maxPRs > 500) {
    throw new Error('Límite de PRs debe estar entre 1 y 500')
  }
  
  if (!Number.isInteger(maxCommits) || maxCommits < 1 || maxCommits > 500) {
    throw new Error('Límite de commits debe estar entre 1 y 500')
  }
  
  return true
}

/**
 * Sanitiza nombre de repositorio
 */
export function sanitizeRepoName(repoName) {
  if (!repoName || typeof repoName !== 'string') {
    throw new Error('Nombre de repositorio inválido')
  }
  
  const parts = repoName.trim().split('/')
  if (parts.length !== 2) {
    throw new Error('Formato de repositorio inválido. Use: owner/repo')
  }
  
  const [owner, repo] = parts
  if (!owner || !repo) {
    throw new Error('Owner y repo no pueden estar vacíos')
  }
  
  return { owner, repo, fullName: `${owner}/${repo}` }
}

/**
 * Valida análisis de datos
 */
export function validateAnalysisData(data) {
  // Estructura antigua (array de PRs)
  if (Array.isArray(data)) {
    return {
      type: 'prs-only',
      pullRequests: data.map(validatePullRequest),
      userCommits: [],
      isValid: true
    }
  }
  
  // Estructura nueva
  if (typeof data === 'object' && data !== null) {
    const pullRequests = Array.isArray(data.pullRequests) 
      ? data.pullRequests.map(validatePullRequest) 
      : []
    
    const userCommits = Array.isArray(data.userCommits)
      ? data.userCommits.map(validateCommit)
      : []
    
    // Verificar que al menos tengamos PRs o commits
    if (pullRequests.length === 0 && userCommits.length === 0) {
      throw new Error('No hay datos para analizar. Verifica el rango de fechas.')
    }
    
    return {
      type: data.pullRequests?.length > 0 && userCommits.length > 0 ? 'complete' : 
            data.pullRequests?.length > 0 ? 'prs-only' : 'commits-only',
      pullRequests,
      userCommits,
      totalUserCommits: data.totalUserCommits || userCommits.length,
      repository: data.repository || '',
      author: data.author || '',
      dateRange: data.dateRange || { start: '', end: '' },
      isValid: true
    }
  }
  
  throw new Error('Formato de datos de análisis inválido')
}

/**
 * Safe getter para propiedades anidadas
 */
export function safeGet(obj, path, defaultValue = null) {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue
    }
    current = current[key]
  }
  
  return current
}

/**
 * Truncate string de forma segura
 */
export function safeTruncate(str, maxLength = 100, suffix = '...') {
  if (!str || typeof str !== 'string') return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - suffix.length) + suffix
}
