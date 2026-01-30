<script setup lang="ts">
/**
 * Editor Layout Component
 * Twin-pane layout with editor and preview side-by-side
 * Responsive: stacks vertically on mobile (< 768px)
 */

const { wordCountDisplay, wordCount } = useMarkdown()
const { isTableBuilderOpen, closeTableBuilder } = useTableBuilderModal()
const { insertText } = useEditor()
const { announce } = useAccessibility()

function handleTableInsert(markdown: string) {
  insertText('\n' + markdown + '\n')
  closeTableBuilder()
  announce('Table inserted')
}

// Initialize auto-save functionality
const { isSaving, showSaveIndicator, countdownToSave, isContentReady } = useAutoSave()

// Initialize scroll synchronization
const { init: initScrollSync, syncToCursor } = useScrollSync()

// References to child pane components (using any for auto-imported components)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editorPaneRef = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const previewPaneRef = ref<any>(null)

// Wire up scroll sync when components are mounted
onMounted(() => {
  // Use a longer delay to ensure CodeMirror is fully initialized
  setTimeout(() => {
    setupScrollSync()
  }, 300)
})

/**
 * Set up scroll sync by finding the actual scroll containers
 */
function setupScrollSync(): void {
  // Get CodeMirror's scroll container - use DOM query as fallback
  let editorScrollContainer: HTMLElement | null = null
  
  // Try to get from component ref first
  const editorView = editorPaneRef.value?.view
  if (editorView?.value?.scrollDOM) {
    editorScrollContainer = editorView.value.scrollDOM as HTMLElement
  }
  
  // Fallback: query the DOM directly
  if (!editorScrollContainer) {
    editorScrollContainer = document.querySelector('.cm-scroller') as HTMLElement
  }
  
  // Get preview's scroll container - try component ref first
  let previewScrollContainer: HTMLElement | null = previewPaneRef.value?.previewRef ?? null
  
  // Fallback: query the DOM directly
  if (!previewScrollContainer) {
    previewScrollContainer = document.querySelector('.preview-content') as HTMLElement
  }
  
  // Initialize scroll sync if both containers are available (pass getEditorView for line-based sync)
  if (editorScrollContainer && previewScrollContainer) {
    const getEditorView = () => editorPaneRef.value?.view?.value ?? null
    initScrollSync(editorScrollContainer, previewScrollContainer, { getEditorView })
  } else {
    // Retry after a short delay if elements not found
    setTimeout(setupScrollSync, 200)
  }
}

// Pane visibility state
const showEditor = ref(true)
const showPreview = ref(true)

// View mode for mobile
const viewMode = ref<'split' | 'editor' | 'preview'>('split')

// Toggle between view modes
function cycleViewMode() {
  const modes: readonly ['split', 'editor', 'preview'] = ['split', 'editor', 'preview']
  const currentIndex = modes.indexOf(viewMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  const nextMode = modes[nextIndex] ?? 'split'
  viewMode.value = nextMode
  
  showEditor.value = nextMode !== 'preview'
  showPreview.value = nextMode !== 'editor'
}

// Get view mode icon
const viewModeIcon = computed(() => {
  switch (viewMode.value) {
    case 'split': return 'i-heroicons-squares-2x2'
    case 'editor': return 'i-heroicons-pencil-square'
    case 'preview': return 'i-heroicons-eye'
  }
})

const viewModeLabel = computed(() => {
  switch (viewMode.value) {
    case 'split': return 'Split view'
    case 'editor': return 'Editor only'
    case 'preview': return 'Preview only'
  }
})
</script>

<template>
  <div class="editor-layout">
    <!-- Formatting Toolbar -->
    <EditorToolbar />

    <!-- Table Builder Modal -->
    <TableBuilderModal
      :open="isTableBuilderOpen"
      @close="closeTableBuilder"
      @insert="handleTableInsert"
    />

    <!-- Main editor area -->
    <div class="editor-main">
      <div 
        class="panes-container"
        :class="{
          'show-editor-only': viewMode === 'editor',
          'show-preview-only': viewMode === 'preview',
        }"
      >
        <!-- Editor Pane -->
        <div v-show="showEditor" class="pane editor-pane-wrapper">
          <div class="pane-header">
            <span class="pane-title">
              <UIcon name="i-heroicons-pencil-square" />
              Editor
            </span>
          </div>
          <EditorPane
          ref="editorPaneRef"
          @cursor-line="(line) => syncToCursor(line, 'smooth', false)"
          @cursor-line-immediate="(line) => syncToCursor(line, { behavior: 'auto', block: 'center' }, true)"
        />
        </div>
        
        <!-- Divider -->
        <div v-show="showEditor && showPreview" class="pane-divider" />
        
        <!-- Preview Pane -->
        <div v-show="showPreview" class="pane preview-pane-wrapper">
          <div class="pane-header">
            <span class="pane-title">
              <UIcon name="i-heroicons-eye" />
              Preview
            </span>
          </div>
          <PreviewPane ref="previewPaneRef" />
        </div>
      </div>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar" role="status" aria-label="Editor status">
      <div class="status-left">
        <span class="word-count" :title="`${wordCount.lines} lines, ${wordCount.paragraphs} paragraphs`">
          {{ wordCountDisplay }}
        </span>
        <span class="save-status">
          <template v-if="isSaving">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
            <span>Saving...</span>
          </template>
          <template v-else-if="showSaveIndicator">
            <span class="save-indicator">
              <span class="save-dot" />
              <span>Saved</span>
            </span>
          </template>
          <template v-else>
            <span class="countdown">Next save: {{ countdownToSave }}s</span>
          </template>
        </span>
      </div>
      
      <div class="status-right">
        <UButton
          :icon="viewModeIcon"
          :aria-label="`View mode: ${viewModeLabel}. Click to cycle.`"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="cycleViewMode"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background, #0f172a);
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.panes-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--color-surface, #1e293b);
  border-bottom: 1px solid var(--color-border, #334155);
  flex-shrink: 0;
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted, #94a3b8);
}

.editor-pane-wrapper {
  border-right: 1px solid var(--color-border, #334155);
}

.pane-divider {
  width: 1px;
  background: var(--color-border, #334155);
  flex-shrink: 0;
  display: none; /* Hidden since we use border on pane */
}

/* Status Bar */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 1rem;
  background: var(--color-surface, #1e293b);
  border-top: 1px solid var(--color-border, #334155);
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
  flex-shrink: 0;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.word-count {
  cursor: help;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-muted, #94a3b8); /* WCAG AA compliant - 4.68:1 on slate-800 */
  transition: all 0.3s ease;
}

.save-status.saving {
  opacity: 1;
  color: var(--color-primary, #3b82f6);
}

.countdown {
  color: var(--color-text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.save-dot {
  width: 8px;
  height: 8px;
  background-color: #22c55e;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.9);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* View mode states */
.show-editor-only .editor-pane-wrapper {
  flex: 1;
  border-right: none;
}

.show-preview-only .preview-pane-wrapper {
  flex: 1;
}

/* Responsive: stack vertically on mobile */
@media (max-width: 767px) {
  .panes-container {
    flex-direction: column;
  }
  
  .pane {
    flex: none;
  }
  
  .editor-pane-wrapper {
    border-right: none;
    border-bottom: 1px solid var(--color-border, #334155);
    height: 50%;
  }
  
  .preview-pane-wrapper {
    height: 50%;
  }
  
  .show-editor-only .editor-pane-wrapper,
  .show-preview-only .preview-pane-wrapper {
    height: 100%;
    border-bottom: none;
  }
}
</style>
