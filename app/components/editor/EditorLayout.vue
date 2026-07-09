<script setup lang="ts">
/**
 * Editor Layout Component
 * Twin-pane layout with editor and preview side-by-side
 * Responsive: stacks vertically on mobile (< 768px)
 */

const { wordCountDisplay, wordCount } = useMarkdown()
const { isTableBuilderOpen, closeTableBuilder } = useTableBuilderModal()
const { insertText, resetContent, isShowingDefaultContent, startEditing } = useEditor()
const { announce } = useAccessibility()

// Inject tour functions from parent
const startTour = inject<() => void>('startTour', () => {})
const resetTour = inject<() => void>('resetTour', () => {})

/**
 * Handle tour button click
 */
function handleStartTour() {
  startTour()
}

/**
 * Handle reset button click with confirmation
 * Resets editor to tutorial content and shows the welcome tour again.
 * Note: The user's auto-saved content is preserved in localStorage.
 */
function handleReset() {
  if (confirm('Reset to markdown tutorial?\n\nThis will show the tutorial content and restart the onboarding tour.\n\nYour auto-saved content is preserved. Reload the page to restore it.')) {
    resetContent()
    resetTour()
    announce('Content reset to markdown tutorial. Welcome tour will appear.')
  }
}

/**
 * Handle start editing button click - clears default content
 */
function handleStartEditing() {
  startEditing()
  announce('Editor cleared. Ready to start writing.')
}

function handleTableInsert(markdown: string) {
  insertText('\n' + markdown + '\n')
  closeTableBuilder()
  announce('Table inserted')
}

// Initialize auto-save functionality (still needed for the feature, but status shown in header)
useAutoSave()

// Initialize scroll synchronization
const { init: initScrollSync, syncToCursor } = useScrollSync()

// View mode state (shared via composable, controlled from header)
const { viewMode, showEditor, showPreview } = useViewMode()

// References to child pane components (using any for auto-imported components)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editorPaneRef = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const previewPaneRef = ref<any>(null)

/** Maximum number of retries for scroll sync DOM element discovery */
const SCROLL_SYNC_MAX_RETRIES = 10
const scrollSyncRetryCount = ref(0)
const scrollSyncTimerId = ref<ReturnType<typeof setTimeout> | null>(null)

// Wire up scroll sync when components are mounted
onMounted(() => {
  scrollSyncRetryCount.value = 0
  scrollSyncTimerId.value = setTimeout(setupScrollSync, 300)
})

// Clean up pending retry on unmount
onUnmounted(() => {
  if (scrollSyncTimerId.value) {
    clearTimeout(scrollSyncTimerId.value)
    scrollSyncTimerId.value = null
  }
})

/**
 * Set up scroll sync by finding the actual scroll containers.
 * Retries up to SCROLL_SYNC_MAX_RETRIES times if DOM elements are not yet available.
 */
function setupScrollSync(): void {
  scrollSyncTimerId.value = null

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
  } else if (scrollSyncRetryCount.value++ < SCROLL_SYNC_MAX_RETRIES) {
    scrollSyncTimerId.value = setTimeout(setupScrollSync, 200)
  } else {
    console.warn('Scroll sync: Could not find editor/preview scroll containers after max retries')
  }
}
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
        <div v-show="showEditor" class="pane editor-pane-wrapper" data-tour="editor-pane">
          <div class="pane-header">
            <span class="pane-title">
              <UIcon name="i-heroicons-pencil-square" />
              Markdown Editor
            </span>
          </div>
          <EditorPane
            ref="editorPaneRef"
            @cursor-line="(line) => syncToCursor(line, false)"
            @cursor-line-immediate="(line) => syncToCursor(line, true)"
          />
          
          <!-- Start Editing Button - centered at bottom of editor pane -->
          <Transition name="start-editing">
            <div v-if="isShowingDefaultContent" class="start-editing-overlay">
              <button 
                type="button"
                class="start-editing-button"
                @click="handleStartEditing"
                aria-label="Start Editing — clear the tutorial content and start with a blank editor"
              >
                <UIcon name="i-heroicons-pencil" class="start-editing-icon" />
                <span>Start Editing</span>
              </button>
              <p class="start-editing-hint">Click to clear this tutorial and start editing</p>
            </div>
          </Transition>
        </div>
        
        <!-- Divider -->
        <div v-show="showEditor && showPreview" class="pane-divider" />
        
        <!-- Preview Pane -->
        <div v-show="showPreview" class="pane preview-pane-wrapper" data-tour="preview-pane">
          <div class="pane-header">
            <span class="pane-title">
              <UIcon name="i-heroicons-eye" />
              Web Preview
            </span>
          </div>
          <PreviewPane ref="previewPaneRef" />
        </div>
      </div>
    </div>
    
    <!-- Status Bar -->
    <!--
      role="status" is scoped to .status-left, not the whole bar: it implies
      aria-live="polite", and the heading-issue count in .status-right changes
      on every debounce tick while typing.
    -->
    <div class="status-bar">
      <div class="status-left" role="status" aria-label="Editor status" data-tour="word-count">
        <span class="word-count" :title="`${wordCount.lines} lines, ${wordCount.paragraphs} paragraphs`">
          {{ wordCountDisplay }}
        </span>
        <span class="reading-time" :title="`Estimated reading time at 200 words per minute`">
          {{ wordCount.readingTime }} min read
        </span>
      </div>
      <div class="status-right">
        <HeadingIssuesPanel />
        <UTooltip
          text="Take a guided tour of the editor features"
          :content="{ side: 'top', sideOffset: 8, avoidCollisions: true }"
        >
          <button
            type="button"
            class="tour-button"
            data-tour="tour-button"
            aria-label="Take Guided Tour of the editor features"
            @click="handleStartTour"
          >
            <UIcon name="i-heroicons-academic-cap" class="tour-icon" />
            <span class="tour-text">Take Guided Tour</span>
          </button>
        </UTooltip>
        <UTooltip
          text="Display the markdown tutorial in the editor"
          :content="{ side: 'top', sideOffset: 8, avoidCollisions: true }"
        >
          <button
            type="button"
            class="reset-button"
            data-tour="reset"
            aria-label="Display Markdown Tutorial in the editor"
            @click="handleReset"
          >
            <UIcon name="i-heroicons-arrow-path" class="reset-icon" />
            <span class="reset-text">Display Markdown Tutorial</span>
          </button>
        </UTooltip>
        <UTooltip
          text="View source code on GitHub (opens in new tab)"
          :content="{ side: 'top', sideOffset: 8, avoidCollisions: true }"
        >
          <a 
            href="https://github.com/ICJIA/icjia-markdown-editor-2026"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
            data-tour="github"
            aria-label="View source code on GitHub (opens in new window)"
          >
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span class="github-text">GitHub</span>
          </a>
        </UTooltip>
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
  /* WCAG AAA compliant - 7:1+ contrast ratio */
  color: #e2e8f0; /* slate-200 for dark mode - 12:1 on #1e293b */
}

/* Light mode override for pane title */
:root:not(.dark) .pane-title,
.light .pane-title {
  color: #1e293b; /* slate-800 for light mode - 12.6:1 on #f8fafc */
}

.editor-pane-wrapper {
  position: relative;
  border-right: 1px solid var(--color-border, #334155);
}

/* Start Editing Button Overlay - centered at bottom of editor pane */
.start-editing-overlay {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  z-index: 20;
  padding: 1rem 0.75rem;
  background: radial-gradient(ellipse at center, rgba(88, 28, 135, 1) 0%, rgba(88, 28, 135, 1) 60%, rgba(88, 28, 135, 0.5) 85%, rgba(88, 28, 135, 0) 100%);
  border-radius: 0.75rem;
}

/* Light mode background - softer purple tint */
:root:not(.dark) .start-editing-overlay,
.light .start-editing-overlay {
  background: radial-gradient(ellipse at center, rgba(243, 232, 255, 1) 0%, rgba(243, 232, 255, 1) 60%, rgba(243, 232, 255, 0.5) 85%, rgba(243, 232, 255, 0) 100%);
}

.start-editing-button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7c3aed 100%);
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.start-editing-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5), 0 4px 10px rgba(0, 0, 0, 0.25);
}

.start-editing-button:active {
  transform: translateY(0);
}

.start-editing-button:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
}

.start-editing-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.start-editing-hint {
  margin: 0;
  font-size: 0.6875rem;
  /* White text on dark purple bg: provides 10.5:1 contrast ratio */
  color: #ffffff;
  text-align: center;
}

/* Light mode adjustments - dark text on light purple bg */
:root:not(.dark) .start-editing-hint,
.light .start-editing-hint {
  /* Dark purple text on light purple bg: provides 8.1:1 contrast ratio */
  color: #581c87;
}

/* Transition for entering/leaving */
.start-editing-enter-active {
  transition: all 0.3s ease-out;
}

.start-editing-leave-active {
  transition: all 0.2s ease-in;
}

.start-editing-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.start-editing-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
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
  /* WCAG AAA compliant - 7:1+ contrast ratio */
  color: #e2e8f0; /* slate-200 for dark mode */
  flex-shrink: 0;
  /* Fixed height to prevent layout shift on hover */
  height: 2.25rem;
  min-height: 2.25rem;
  max-height: 2.25rem;
  overflow: visible; /* Allow tooltips to overflow */
}

/* Light mode override for status bar */
:root:not(.dark) .status-bar,
.light .status-bar {
  color: #1e293b; /* slate-800 for light mode */
}

.status-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Tour button - blue gradient style */
.tour-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 1px 2px rgba(59, 130, 246, 0.3),
    0 2px 4px -1px rgba(59, 130, 246, 0.2);
}

.tour-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 
    0 2px 6px rgba(59, 130, 246, 0.4),
    0 4px 8px -2px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.tour-button:active {
  transform: translateY(0);
}

.tour-button:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.tour-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.tour-text {
  /* Text label */
}

.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #cbd5e1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.reset-button:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.reset-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.reset-text {
  /* Hide on very small screens if needed */
}

/* Light mode reset button */
:root:not(.dark) .reset-button,
.light .reset-button {
  color: #64748b;
}

:root:not(.dark) .reset-button:hover,
.light .reset-button:hover {
  color: #1e293b;
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.github-link:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.08);
}

.github-link:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.github-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.github-text {
  /* Hide on very small screens */
}

/* Light mode GitHub link */
:root:not(.dark) .github-link,
.light .github-link {
  color: #64748b;
}

:root:not(.dark) .github-link:hover,
.light .github-link:hover {
  color: #1e293b;
  background: rgba(0, 0, 0, 0.05);
}

.word-count {
  cursor: help;
}

.reading-time {
  cursor: help;
  color: #cbd5e1;
  font-size: 0.75rem;
}

/* Light mode reading time */
:root:not(.dark) .reading-time,
.light .reading-time {
  color: #64748b;
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

/* Small screen adjustments for status bar */
@media (max-width: 480px) {
  .status-bar {
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
    height: 2rem;
    min-height: 2rem;
    max-height: 2rem;
  }
  
  .status-left {
    gap: 0.5rem;
  }
  
  .status-right {
    gap: 0.375rem;
  }
  
  .reading-time {
    display: none;
  }
  
  .github-text,
  .reset-text,
  .tour-text {
    display: none;
  }
  
  .tour-button,
  .reset-button,
  .github-link {
    padding: 0.375rem;
  }
}
</style>
