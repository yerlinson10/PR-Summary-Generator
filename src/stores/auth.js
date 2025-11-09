import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const githubToken = ref(localStorage.getItem('github_token') || '')
  const githubUser = ref(JSON.parse(localStorage.getItem('github_user') || 'null'))

  // Getters
  const isAuthenticated = computed(() => !!githubToken.value)

  // Actions
  function setGithubToken(token) {
    githubToken.value = token
    localStorage.setItem('github_token', token)
  }

  function setGithubUser(user) {
    githubUser.value = user
    localStorage.setItem('github_user', JSON.stringify(user))
  }

  function logout() {
    githubToken.value = ''
    githubUser.value = null
    localStorage.removeItem('github_token')
    localStorage.removeItem('github_user')
    localStorage.removeItem('gemini_token')
  }

  return {
    githubToken,
    githubUser,
    isAuthenticated,
    setGithubToken,
    setGithubUser,
    logout
  }
})
