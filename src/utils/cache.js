/**
 * Sistema de caché simple con TTL (Time To Live)
 */

class Cache {
  constructor() {
    this.storage = new Map()
  }

  /**
   * Guarda un valor en caché con TTL
   * @param {string} key - Clave única
   * @param {any} value - Valor a cachear
   * @param {number} ttl - Tiempo de vida en milisegundos (default: 5 min)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    const expiresAt = Date.now() + ttl
    this.storage.set(key, { value, expiresAt })
    
    // Log solo en desarrollo
    if (import.meta.env.DEV) {
      console.log(`📦 Cache SET: ${key} (TTL: ${ttl / 1000}s)`)
    }
  }

  /**
   * Obtiene un valor del caché si no ha expirado
   * @param {string} key - Clave única
   * @returns {any|null} Valor o null si expiró o no existe
   */
  get(key) {
    const cached = this.storage.get(key)
    
    if (!cached) {
      return null
    }
    
    // Verificar expiración
    if (Date.now() > cached.expiresAt) {
      this.storage.delete(key)
      if (import.meta.env.DEV) {
        console.log(`⏰ Cache EXPIRED: ${key}`)
      }
      return null
    }
    
    if (import.meta.env.DEV) {
      const remainingTTL = Math.ceil((cached.expiresAt - Date.now()) / 1000)
      console.log(`✅ Cache HIT: ${key} (remaining: ${remainingTTL}s)`)
    }
    
    return cached.value
  }

  /**
   * Verifica si una clave existe y no ha expirado
   */
  has(key) {
    return this.get(key) !== null
  }

  /**
   * Elimina una clave del caché
   */
  delete(key) {
    const deleted = this.storage.delete(key)
    if (deleted && import.meta.env.DEV) {
      console.log(`🗑️ Cache DELETE: ${key}`)
    }
    return deleted
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.storage.clear()
    if (import.meta.env.DEV) {
      console.log('🧹 Cache CLEARED')
    }
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup() {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, cached] of this.storage.entries()) {
      if (now > cached.expiresAt) {
        this.storage.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0 && import.meta.env.DEV) {
      console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`)
    }
    
    return cleanedCount
  }

  /**
   * Obtiene estadísticas del caché
   */
  stats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0
    
    for (const cached of this.storage.values()) {
      if (now > cached.expiresAt) {
        expiredEntries++
      } else {
        validEntries++
      }
    }
    
    return {
      total: this.storage.size,
      valid: validEntries,
      expired: expiredEntries
    }
  }
}

// Instancia singleton
const cache = new Cache()

// Cleanup automático cada 5 minutos
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000)

// Cleanup al cerrar la pestaña
window.addEventListener('beforeunload', () => {
  cache.cleanup()
})

export default cache

/**
 * Wrapper para funciones con caché automático
 * @param {Function} fn - Función async a cachear
 * @param {Function} keyGenerator - Función para generar la clave del caché
 * @param {number} ttl - Tiempo de vida en ms
 */
export function withCache(fn, keyGenerator, ttl = 5 * 60 * 1000) {
  return async function(...args) {
    const key = keyGenerator(...args)
    
    // Intentar obtener del caché
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }
    
    // Ejecutar función y cachear resultado
    const result = await fn(...args)
    cache.set(key, result, ttl)
    
    return result
  }
}

/**
 * Invalidar caché por patrón
 */
export function invalidatePattern(pattern) {
  let count = 0
  for (const key of cache.storage.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
      count++
    }
  }
  return count
}

/**
 * Caché específico para GitHub API
 */
export const githubCache = {
  // Repositorios: 5 minutos
  repos: {
    get: () => cache.get('github:repos'),
    set: (data) => cache.set('github:repos', data, 5 * 60 * 1000),
    clear: () => cache.delete('github:repos')
  },
  
  // Usuario: 10 minutos
  user: {
    get: () => cache.get('github:user'),
    set: (data) => cache.set('github:user', data, 10 * 60 * 1000),
    clear: () => cache.delete('github:user')
  },
  
  // PRs: 2 minutos (cambian con frecuencia)
  prs: (repo, start, end) => {
    const key = `github:prs:${repo}:${start}:${end}`
    return {
      get: () => cache.get(key),
      set: (data) => cache.set(key, data, 2 * 60 * 1000),
      clear: () => cache.delete(key)
    }
  },
  
  // Commits: 3 minutos
  commits: (repo, author, start, end) => {
    const key = `github:commits:${repo}:${author}:${start}:${end}`
    return {
      get: () => cache.get(key),
      set: (data) => cache.set(key, data, 3 * 60 * 1000),
      clear: () => cache.delete(key)
    }
  },
  
  // Limpiar todo el caché de GitHub
  clearAll: () => invalidatePattern('github:')
}
