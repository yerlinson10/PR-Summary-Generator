<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-800">
    <div class="text-center max-w-md px-4">
      <div v-if="!error" class="space-y-4">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p class="text-lg text-slate-700 dark:text-slate-300 font-medium">
          {{ loadingMessage }}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Por favor espera...
        </p>
      </div>

      <div v-else class="space-y-4">
        <svg class="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg text-red-600 dark:text-red-400 font-medium">
          Error de autenticación
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {{ error }}
        </p>
        <button
          @click="router.push('/login')"
          class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { exchangeCodeForToken } from '@/services/github'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loadingMessage = ref('Autenticando con GitHub...')
const error = ref('')

onMounted(async () => {
  const code = route.query.code
  const errorParam = route.query.error
  
  if (errorParam) {
    error.value = 'Autenticación cancelada o denegada'
    setTimeout(() => router.push('/login'), 3000)
    return
  }
  
  if (!code) {
    error.value = 'Código de autenticación no encontrado'
    setTimeout(() => router.push('/login'), 3000)
    return
  }
  
  try {
    loadingMessage.value = 'Intercambiando código por token...'
    const { token, user, scope } = await exchangeCodeForToken(code)
    
    // Debug: Mostrar scopes obtenidos
    console.log('🔐 Token OAuth obtenido')
    console.log('👤 Usuario:', user.login)
    console.log('✅ Scopes:', scope)
    
    // Guardar scopes en localStorage para debugging
    localStorage.setItem('github_scopes', scope || '')
    
    loadingMessage.value = 'Guardando credenciales...'
    authStore.setGithubToken(token)
    authStore.setGithubUser(user)
    
    loadingMessage.value = '¡Éxito! Redirigiendo...'
    setTimeout(() => router.push('/search'), 1000)
  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = err.message || 'Error al autenticar. Por favor intenta nuevamente.'
    setTimeout(() => router.push('/login'), 5000)
  }
})
</script>
