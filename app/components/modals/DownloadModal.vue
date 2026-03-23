<script setup lang="ts">
/**
 * Download Modal Component
 * Allows users to customize the filename before downloading
 * WCAG 2.1 AA compliant with proper focus management
 */

const { isOpen, downloadType, filename, confirm, cancel, useDefault } = useDownloadModal()
const { announce } = useAccessibility()

const inputRef = ref<HTMLInputElement | null>(null)

// Focus input when modal opens, and fix Reka UI aria-labelledby mismatch
watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
      const dialog = document.querySelector('[role="dialog"][data-slot="content"]') as HTMLElement
      if (dialog) dialog.setAttribute('aria-labelledby', 'download-modal-title')
    })
    announce('Download dialog opened. Enter a filename or use the default.')
  }
})

// Handle Enter key in input
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    confirm()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  }
}

const fileTypeLabel = computed(() => {
  return downloadType.value === 'markdown' ? 'Markdown (.md)' : 'HTML (.html)'
})

const fileTypeIcon = computed(() => {
  return downloadType.value === 'markdown' ? 'i-heroicons-document-text' : 'i-heroicons-code-bracket'
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    :ui="{
      content: 'bg-slate-800 dark:bg-slate-800 border border-slate-600 shadow-2xl w-[95vw] max-w-md',
      header: 'border-b border-slate-600 px-4 sm:px-6 py-3 sm:py-4',
      body: 'px-4 sm:px-6 py-4 sm:py-5',
      footer: 'border-t border-slate-600 px-4 sm:px-6 py-3 sm:py-4',
      overlay: 'bg-black/70 backdrop-blur-sm'
    }"
    @update:open="(open: boolean) => !open && cancel()"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon :name="fileTypeIcon" class="w-6 h-6 text-blue-400" />
        <div>
          <h2 id="download-modal-title" class="text-lg font-semibold text-neutral-100">
            Download {{ fileTypeLabel }}
          </h2>
          <p class="text-sm text-neutral-400 mt-0.5">
            Choose a filename for your download
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div>
          <label 
            for="filename-input" 
            class="block text-sm font-medium text-neutral-300 mb-2"
          >
            Filename
          </label>
          <input
            id="filename-input"
            ref="inputRef"
            v-model="filename"
            type="text"
            class="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Enter filename..."
            autocomplete="off"
            spellcheck="false"
            @keydown="handleKeydown"
          />
          <p class="mt-2 text-xs text-neutral-500">
            The correct extension will be added automatically if missing.
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          @click="cancel"
        >
          Cancel
        </UButton>
        
        <div class="flex items-center gap-2">
          <UButton
            variant="soft"
            color="neutral"
            @click="useDefault"
          >
            Use Default
          </UButton>
          <UButton
            color="primary"
            @click="confirm"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-1.5" />
            Download
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Ensure modal has solid lighter background to stand out */
:deep([role="dialog"]) {
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%) !important;
}

.light :deep([role="dialog"]) {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
}
</style>
