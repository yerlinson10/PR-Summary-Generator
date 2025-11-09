import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  // State
  const geminiToken = ref(localStorage.getItem('gemini_token') || '')
  const language = ref(localStorage.getItem('summary_language') || 'es')
  const maxPRsLimit = ref(parseInt(localStorage.getItem('max_prs_limit') || '50'))
  const maxCommitsLimit = ref(parseInt(localStorage.getItem('max_commits_limit') || '50'))

  // Actions
  function setGeminiToken(token) {
    geminiToken.value = token
    localStorage.setItem('gemini_token', token)
  }

  function setLanguage(lang) {
    language.value = lang
    localStorage.setItem('summary_language', lang)
  }

  function setMaxPRsLimit(limit) {
    maxPRsLimit.value = limit
    localStorage.setItem('max_prs_limit', limit.toString())
  }

  function setMaxCommitsLimit(limit) {
    maxCommitsLimit.value = limit
    localStorage.setItem('max_commits_limit', limit.toString())
  }

  function saveSearchHistory(search) {
    const history = JSON.parse(localStorage.getItem('search_history') || '[]')
    history.unshift({
      ...search,
      timestamp: new Date().toISOString()
    })
    // Keep only last 20 searches
    localStorage.setItem('search_history', JSON.stringify(history.slice(0, 20)))
  }

  function getSearchHistory() {
    return JSON.parse(localStorage.getItem('search_history') || '[]')
  }

  function saveDraft(draftData) {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]')
    const existingIndex = drafts.findIndex(d => d.id === draftData.id)
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = draftData
    } else {
      drafts.unshift(draftData)
    }
    
    localStorage.setItem('drafts', JSON.stringify(drafts.slice(0, 10)))
  }

  function getDrafts() {
    return JSON.parse(localStorage.getItem('drafts') || '[]')
  }

  function deleteDraft(id) {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]')
    localStorage.setItem('drafts', JSON.stringify(drafts.filter(d => d.id !== id)))
  }

  return {
    geminiToken,
    language,
    maxPRsLimit,
    maxCommitsLimit,
    setGeminiToken,
    setLanguage,
    setMaxPRsLimit,
    setMaxCommitsLimit,
    saveSearchHistory,
    getSearchHistory,
    saveDraft,
    getDrafts,
    deleteDraft
  }
})
