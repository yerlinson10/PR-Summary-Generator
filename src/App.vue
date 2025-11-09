<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <RouterView />
  </div>
</template>

<script setup>
import { watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { setGithubToken } from '@/services/github'
import { initializeGemini } from '@/services/gemini'

const authStore = useAuthStore()
const configStore = useConfigStore()

// Función para inicializar tokens
function initializeTokens() {
  // Inicializar GitHub token
  if (authStore.githubToken) {
    console.log('🔑 Inicializando GitHub token...')
    setGithubToken(authStore.githubToken)
  }
  
  // Inicializar Gemini token
  if (configStore.geminiToken) {
    try {
      console.log('🤖 Inicializando Gemini token...')
      initializeGemini(configStore.geminiToken)
    } catch (error) {
      console.error('Error initializing Gemini:', error)
    }
  }
}

// Inicializar inmediatamente
initializeTokens()

// Observar cambios en los tokens para re-inicializar
watch(() => authStore.githubToken, (newToken) => {
  if (newToken) {
    console.log('🔄 GitHub token actualizado')
    setGithubToken(newToken)
  }
})

watch(() => configStore.geminiToken, (newToken) => {
  if (newToken) {
    try {
      console.log('🔄 Gemini token actualizado')
      initializeGemini(newToken)
    } catch (error) {
      console.error('Error updating Gemini token:', error)
    }
  }
})

// Asegurar que los tokens estén listos antes de cualquier navegación
nextTick(() => {
  initializeTokens()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
</style>
