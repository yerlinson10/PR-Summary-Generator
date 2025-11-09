<template>
  <nav class="bg-white dark:bg-slate-800 shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center">
            <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="ml-2 text-xl font-bold text-slate-900 dark:text-white">
              PR Summary
            </span>
          </div>
          
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <RouterLink
              to="/search"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors"
              :class="isActive('/search') ? 'border-primary-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
            >
              Búsqueda
            </RouterLink>
            
            <RouterLink
              to="/config"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors"
              :class="isActive('/config') ? 'border-primary-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
            >
              Configuración
            </RouterLink>
          </div>
        </div>
        
        <div class="flex items-center">
          <div v-if="authStore.githubUser" class="flex items-center space-x-4">
            <img
              :src="authStore.githubUser.avatar_url"
              :alt="authStore.githubUser.name"
              class="h-8 w-8 rounded-full"
            />
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
              {{ authStore.githubUser.login }}
            </span>
            <button
              @click="handleLogout"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isActive = (path) => {
  return route.path.startsWith(path)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
