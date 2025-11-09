<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-800 px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="flex justify-center">
          <svg class="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 class="mt-6 text-4xl font-extrabold text-slate-900 dark:text-white">
          PR Summary Generator
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Genera resúmenes inteligentes de tus Pull Requests con IA
        </p>
      </div>

      <div class="bg-white dark:bg-slate-800 shadow-2xl rounded-lg p-8 space-y-6">
        <!-- OAuth GitHub -->
        <div v-if="!showManualToken">
          <!-- OAuth Button (if configured) -->
          <div v-if="isOAuthAvailable">
            <button
              @click="loginWithGithub"
              :disabled="loading"
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <svg class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
              </svg>
              <span v-if="!loading" class="font-semibold">Iniciar sesión con GitHub</span>
              <span v-else class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Conectando...
              </span>
            </button>

            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-slate-800 text-slate-500">o</span>
              </div>
            </div>
          </div>

          <!-- Manual Token Option -->
          <button
            @click="showManualToken = true"
            class="w-full flex items-center justify-center px-4 py-3 border-2 border-slate-300 dark:border-slate-600 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Usar Personal Access Token
          </button>
        </div>

        <!-- Manual Token Input -->
        <div v-else class="space-y-4">
          <div>
            <label for="token" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              GitHub Personal Access Token
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo,read:user" 
                target="_blank"
                class="ml-2 text-primary-600 hover:text-primary-700 text-xs"
              >
                Obtener token →
              </a>
            </label>
            <input
              v-model="manualToken"
              type="password"
              id="token"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
              @keyup.enter="loginWithManualToken"
            />
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Necesitas permisos: <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">repo</code>, <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">read:user</code>
            </p>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
          </div>

          <div class="flex space-x-3">
            <button
              @click="loginWithManualToken"
              :disabled="!manualToken || loading"
              class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!loading">Conectar</span>
              <span v-else>Verificando...</span>
            </button>
            <button
              @click="showManualToken = false"
              class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        <!-- Features -->
        <div class="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            ✨ Características
          </h3>
          <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Resúmenes inteligentes con Google Gemini AI
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Editor avanzado para personalizar resúmenes
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Exportación a PDF profesional
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Acceso a repositorios privados
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getGithubLoginUrl, getAuthenticatedUser, isOAuthConfigured } from '@/services/github'

const router = useRouter()
const authStore = useAuthStore()

const showManualToken = ref(false)
const manualToken = ref('')
const loading = ref(false)
const error = ref('')

const isOAuthAvailable = computed(() => isOAuthConfigured())

const loginWithGithub = () => {
  // Redirect to GitHub OAuth
  const loginUrl = getGithubLoginUrl()
  window.location.href = loginUrl
}

const loginWithManualToken = async () => {
  if (!manualToken.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const user = await getAuthenticatedUser(manualToken.value)
    authStore.setGithubToken(manualToken.value)
    authStore.setGithubUser(user)
    router.push('/search')
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Token inválido. Por favor verifica que tenga los permisos correctos.'
  } finally {
    loading.value = false
  }
}
</script>
