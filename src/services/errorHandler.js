/**
 * Manejo centralizado de errores de API
 */

export class APIError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.details = details
  }
}

export function handleAPIError(error, context = '') {
  // Error de red
  if (!error.response) {
    return new APIError(
      `Error de conexión${context ? ` en ${context}` : ''}. Verifica tu conexión a internet.`,
      0,
      error.message
    )
  }

  const status = error.response.status
  const data = error.response.data

  // Errores específicos de GitHub API
  switch (status) {
    case 401:
      return new APIError(
        'Token no válido o expirado. Por favor vuelve a iniciar sesión.',
        401,
        data
      )
    
    case 403:
      // Rate limit o permisos insuficientes
      if (error.response.headers['x-ratelimit-remaining'] === '0') {
        const resetTime = new Date(error.response.headers['x-ratelimit-reset'] * 1000)
        return new APIError(
          `Límite de API de GitHub alcanzado. Se restablecerá a las ${resetTime.toLocaleTimeString()}.`,
          403,
          { resetTime }
        )
      }
      return new APIError(
        'Permisos insuficientes. Verifica que tu token tenga los scopes necesarios.',
        403,
        data
      )
    
    case 404:
      return new APIError(
        `Recurso no encontrado${context ? ` en ${context}` : ''}. Verifica que el repositorio o PR exista.`,
        404,
        data
      )
    
    case 422:
      return new APIError(
        `Parámetros inválidos${context ? ` en ${context}` : ''}. ${data?.message || ''}`,
        422,
        data
      )
    
    case 500:
    case 502:
    case 503:
      return new APIError(
        `Error del servidor de GitHub. Por favor intenta más tarde.`,
        status,
        data
      )
    
    default:
      return new APIError(
        data?.message || `Error desconocido (${status})${context ? ` en ${context}` : ''}`,
        status,
        data
      )
  }
}

/**
 * Wrapper para manejo automático de errores en funciones async
 */
export function withErrorHandling(fn, context = '') {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw handleAPIError(error, context)
    }
  }
}

/**
 * Retry con backoff exponencial
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      const apiError = handleAPIError(error)
      
      // No reintentar si es error de autenticación o permisos
      if ([401, 403, 404].includes(apiError.status)) {
        throw apiError
      }
      
      // Último intento
      if (i === maxRetries - 1) {
        throw apiError
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      const delay = baseDelay * Math.pow(2, i)
      console.log(`⏳ Reintentando en ${delay}ms... (intento ${i + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
