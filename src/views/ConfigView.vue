<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <NavBar />
    
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
          Configuración
        </h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400">
          Administra tus tokens y preferencias
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <p class="ml-3 text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- Gemini API Configuration -->
        <div class="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                API de Google Gemini
              </h2>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Token para generar resúmenes con IA
              </p>
            </div>
            <div class="relative group">
              <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div class="absolute right-0 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg invisible group-hover:visible z-10">
                <p class="font-semibold mb-2">¿Cómo obtener tu API Key?</p>
                <ol class="list-decimal list-inside space-y-1">
                  <li>Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-primary-400 underline">Google AI Studio</a></li>
                  <li>Inicia sesión con tu cuenta de Google</li>
                  <li>Haz clic en "Create API Key"</li>
                  <li>Copia el token y pégalo aquí</li>
                </ol>
                <p class="mt-2 text-slate-300">El plan gratuito incluye 15 solicitudes por minuto.</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label for="gemini-token" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API Key
              </label>
              <div class="flex space-x-2">
                <input
                  v-model="geminiToken"
                  :type="showGeminiToken ? 'text' : 'password'"
                  id="gemini-token"
                  placeholder="AIzaSy..."
                  class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
                />
                <button
                  @click="showGeminiToken = !showGeminiToken"
                  class="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <svg v-if="!showGeminiToken" class="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              @click="saveGeminiToken"
              class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Guardar Token de Gemini
            </button>
          </div>
        </div>

        <!-- Language Preference -->
        <div class="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Preferencias de Resumen
          </h2>
          
          <div class="space-y-4">
            <div>
              <label for="language" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Idioma de los resúmenes
              </label>
              <select
                v-model="language"
                id="language"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div>
              <label for="max-prs" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Límite de PRs por búsqueda
              </label>
              <input
                v-model.number="maxPRsLimit"
                type="number"
                id="max-prs"
                min="1"
                max="100"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
              />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Número máximo de Pull Requests a analizar (1-100)
              </p>
            </div>

            <div>
              <label for="max-commits" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Límite de Commits del Usuario
              </label>
              <input
                v-model.number="maxCommitsLimit"
                type="number"
                id="max-commits"
                min="1"
                max="100"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
              />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Número máximo de commits del usuario a incluir en el análisis del repositorio (1-100)
              </p>
            </div>

            <button
              @click="savePreferences"
              class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>

        <!-- GitHub Token (Optional) -->
        <div class="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Token de GitHub
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Token actual
              </label>
              <div class="flex items-center space-x-2">
                <input
                  :value="maskedGithubToken"
                  type="text"
                  disabled
                  class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                />
                <span class="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Conectado
                </span>
              </div>
            </div>

            <button
              @click="handleLogout"
              class="w-full px-4 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Desconectar GitHub
            </button>
          </div>
        </div>

        <!-- Storage Info -->
        <div class="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="ml-3 text-sm text-primary-700 dark:text-primary-300">
              Toda tu información se guarda localmente en tu navegador. No se envía a ningún servidor externo.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { initializeGemini } from '@/services/gemini'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const configStore = useConfigStore()

const geminiToken = ref('')
const showGeminiToken = ref(false)
const language = ref('es')
const maxPRsLimit = ref(50)
const maxCommitsLimit = ref(50)
const successMessage = ref('')

const maskedGithubToken = computed(() => {
  if (!authStore.githubToken) return ''
  const token = authStore.githubToken
  return token.substring(0, 8) + '...' + token.substring(token.length - 4)
})

onMounted(() => {
  geminiToken.value = configStore.geminiToken
  language.value = configStore.language
  maxPRsLimit.value = configStore.maxPRsLimit
  maxCommitsLimit.value = configStore.maxCommitsLimit
})

const saveGeminiToken = () => {
  if (!geminiToken.value) {
    alert('Por favor ingresa un token válido')
    return
  }
  
  try {
    initializeGemini(geminiToken.value)
    configStore.setGeminiToken(geminiToken.value)
    showSuccess('Token de Gemini guardado correctamente')
  } catch (error) {
    alert('Error al guardar el token. Verifica que sea válido.')
  }
}

const savePreferences = () => {
  configStore.setLanguage(language.value)
  configStore.setMaxPRsLimit(maxPRsLimit.value)
  configStore.setMaxCommitsLimit(maxCommitsLimit.value)
  showSuccess('Preferencias guardadas correctamente')
}

const handleLogout = () => {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    authStore.logout()
    router.push('/login')
  }
}

const showSuccess = (message) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}
</script>
