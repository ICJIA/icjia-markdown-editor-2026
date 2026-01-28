/**
 * Auto-save Composable
 * Saves editor content to localStorage every 15 seconds and on blur
 * Restores content on page load
 */

const STORAGE_KEY = 'icjia-markdown-editor-autosave'
const SAVE_INTERVAL = 15000 // 15 seconds

export function useAutoSave() {
  const { content, setContent } = useEditor()
  const { announce } = useAccessibility()
  
  const lastSaveTime = ref<number | null>(null)
  const isSaving = ref(false)
  const hasRestoredFromStorage = ref(false)
  const storageAvailable = ref(true)
  
  // Check if localStorage is available
  function checkStorageAvailability(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
  
  // Save content to localStorage
  function save(): boolean {
    if (!storageAvailable.value) return false
    
    try {
      isSaving.value = true
      const data = {
        content: content.value,
        savedAt: Date.now(),
        version: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      lastSaveTime.value = Date.now()
      
      // Visual feedback - brief "just saved" indicator
      justSaved.value = true
      setTimeout(() => {
        justSaved.value = false
      }, 1500)
      
      return true
    } catch (e) {
      console.error('Auto-save failed:', e)
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        announce('Storage full. Please download your work to avoid data loss.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }
  
  // Restore content from localStorage
  function restore(): boolean {
    if (!storageAvailable.value) return false
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      
      const data = JSON.parse(stored)
      if (data.content && typeof data.content === 'string') {
        setContent(data.content, true)
        hasRestoredFromStorage.value = true
        lastSaveTime.value = data.savedAt || Date.now()
        return true
      }
      return false
    } catch (e) {
      console.error('Restore from storage failed:', e)
      return false
    }
  }
  
  // Check if there's saved content available
  function hasSavedContent(): boolean {
    if (!storageAvailable.value) return false
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      
      const data = JSON.parse(stored)
      return Boolean(data.content && data.content.trim().length > 0)
    } catch {
      return false
    }
  }
  
  // Get info about saved content
  function getSavedInfo(): { savedAt: Date; wordCount: number } | null {
    if (!storageAvailable.value) return null
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      if (!data.content) return null
      
      const wordCount = data.content.trim().split(/\s+/).filter(Boolean).length
      return {
        savedAt: new Date(data.savedAt),
        wordCount,
      }
    } catch {
      return null
    }
  }
  
  // Clear saved content
  function clear(): void {
    if (!storageAvailable.value) return
    
    try {
      localStorage.removeItem(STORAGE_KEY)
      lastSaveTime.value = null
    } catch (e) {
      console.error('Clear storage failed:', e)
    }
  }
  
  // Trigger for updating the time display
  const timeUpdateTrigger = ref(0)
  
  // Update time display every 30 seconds
  let timeUpdateInterval: ReturnType<typeof setInterval> | null = null
  
  // Format last save time for display
  const lastSaveDisplay = computed(() => {
    // Include trigger to force reactivity updates
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    timeUpdateTrigger.value
    
    if (!lastSaveTime.value) return null
    
    const now = Date.now()
    const diff = now - lastSaveTime.value
    
    if (diff < 60000) {
      return 'Saved just now'
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `Saved ${minutes}m ago`
    } else {
      const date = new Date(lastSaveTime.value)
      return `Saved at ${date.toLocaleTimeString()}`
    }
  })
  
  // Track when a save just completed for visual feedback
  const justSaved = ref(false)
  
  // Auto-save interval
  let saveInterval: ReturnType<typeof setInterval> | null = null
  
  function startAutoSave() {
    if (saveInterval) return
    
    saveInterval = setInterval(() => {
      if (content.value.trim().length > 0) {
        save()
      }
    }, SAVE_INTERVAL)
  }
  
  function stopAutoSave() {
    if (saveInterval) {
      clearInterval(saveInterval)
      saveInterval = null
    }
  }
  
  // Initialize on mount
  onMounted(() => {
    storageAvailable.value = checkStorageAvailability()
    
    if (storageAvailable.value) {
      // Try to restore saved content
      if (hasSavedContent()) {
        restore()
        announce('Previous work restored from auto-save')
      }
      
      // Start auto-save interval
      startAutoSave()
      
      // Start time display update interval (every 30 seconds)
      timeUpdateInterval = setInterval(() => {
        timeUpdateTrigger.value++
      }, 30000)
      
      // Save on window blur (user switches tabs/apps)
      window.addEventListener('blur', save)
      
      // Save before page unload
      window.addEventListener('beforeunload', save)
    }
  })
  
  // Cleanup on unmount
  onUnmounted(() => {
    stopAutoSave()
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
    window.removeEventListener('blur', save)
    window.removeEventListener('beforeunload', save)
  })
  
  return {
    save,
    restore,
    clear,
    hasSavedContent,
    getSavedInfo,
    lastSaveTime: readonly(lastSaveTime),
    lastSaveDisplay,
    isSaving: readonly(isSaving),
    justSaved: readonly(justSaved),
    hasRestoredFromStorage: readonly(hasRestoredFromStorage),
    storageAvailable: readonly(storageAvailable),
  }
}
