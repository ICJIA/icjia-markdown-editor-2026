<script setup lang="ts">
/**
 * Preview Pane Component
 * Renders markdown as HTML with accessibility features
 * Uses aria-live for content updates
 */

const { renderedHtml, showRenderingIndicator } = useMarkdown()
const { isContentReady } = useEditor()
const previewRef = ref<HTMLElement | null>(null)

/**
 * Make scrollable code blocks keyboard accessible (WCAG 2.1 AA)
 * Adds tabindex="0" to all pre elements with overflow
 */
function makeCodeBlocksAccessible() {
  if (!previewRef.value) return
  
  const preElements = previewRef.value.querySelectorAll('pre')
  preElements.forEach(pre => {
    // Check if the element is scrollable
    if (pre.scrollWidth > pre.clientWidth || pre.scrollHeight > pre.clientHeight) {
      pre.setAttribute('tabindex', '0')
      pre.setAttribute('role', 'region')
      pre.setAttribute('aria-label', 'Code block - scrollable')
    }
  })
}

// Re-apply accessibility attributes when content changes
watch(renderedHtml, () => {
  nextTick(() => {
    makeCodeBlocksAccessible()
  })
})

onMounted(() => {
  nextTick(() => {
    makeCodeBlocksAccessible()
  })
})

// Expose ref for scroll sync (future feature)
defineExpose({
  previewRef,
})
</script>

<template>
  <div class="preview-pane">
    <!-- Loading state while checking localStorage -->
    <div v-if="!isContentReady" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
      <span>Loading...</span>
    </div>
    
    <template v-else>
      <div 
        v-if="showRenderingIndicator"
        class="rendering-indicator"
        role="status"
        aria-live="polite"
      >
        <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
        Rendering...
      </div>
      
      <div 
        ref="previewRef"
        class="preview-content markdown-body"
        role="region"
        aria-label="Markdown preview"
        aria-live="polite"
        tabindex="0"
        v-html="renderedHtml"
      />
    </template>
  </div>
</template>

<style scoped>
.preview-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background, #0f172a);
  overflow: hidden;
  position: relative;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.875rem;
}

.rendering-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-surface, #1e293b);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #94a3b8);
  z-index: 10;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 1rem 1.5rem;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-text, #f1f5f9);
}

/* Markdown styling */
.preview-content :deep(h1) {
  font-size: 2em;
  font-weight: 700;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border, #334155);
  color: var(--color-text, #f1f5f9);
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 1.25rem 0 0.75rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--color-border, #334155);
  color: var(--color-text, #f1f5f9);
}

.preview-content :deep(h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  color: var(--color-text, #f1f5f9);
}

.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
  color: var(--color-text, #f1f5f9);
}

.preview-content :deep(p) {
  margin: 0.75rem 0;
}

.preview-content :deep(a) {
  color: var(--color-primary, #3b82f6);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.preview-content :deep(a:hover) {
  color: var(--color-focus, #60a5fa);
}

.preview-content :deep(a:focus-visible) {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
  border-radius: 2px;
}

.preview-content :deep(strong) {
  font-weight: 600;
}

.preview-content :deep(em) {
  font-style: italic;
}

.preview-content :deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  padding: 0.125rem 0.375rem;
  background: var(--color-surface, #1e293b);
  border-radius: 0.25rem;
  color: var(--code-color, #4ade80); /* green-400 for dark mode */
}

/* Light mode: use darker green for WCAG AA compliance */
:root.light .preview-content :deep(code),
.light .preview-content :deep(code) {
  color: #166534; /* green-800 - 5.14:1 contrast on light backgrounds */
  background: #f1f5f9; /* slate-100 */
}

.preview-content :deep(pre) {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--color-surface, #1e293b);
  border-radius: 0.5rem;
  overflow-x: auto;
}

/* Focus styles for scrollable code blocks (tabindex added via JS) */
.preview-content :deep(pre:focus),
.preview-content :deep(pre:focus-visible) {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.preview-content :deep(pre code) {
  padding: 0;
  background: transparent;
  font-size: 0.875rem;
  line-height: 1.5;
}

.preview-content :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  border-left: 4px solid var(--color-primary, #3b82f6);
  background: var(--color-surface, #1e293b);
  font-style: italic;
  color: var(--color-text-muted, #94a3b8);
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.preview-content :deep(li) {
  margin: 0.25rem 0;
}

.preview-content :deep(ul) {
  list-style-type: disc;
}

.preview-content :deep(ol) {
  list-style-type: decimal;
}

.preview-content :deep(hr) {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid var(--color-border, #334155);
}

.preview-content :deep(table) {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #334155);
  text-align: left;
}

.preview-content :deep(th) {
  background: var(--color-surface, #1e293b);
  font-weight: 600;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

/* Header anchor links - ensure heading text is always visible */
.preview-content :deep(.header-anchor) {
  text-decoration: none;
  color: inherit;
}

/* The anchor span contains the heading text - must be visible */
.preview-content :deep(.header-anchor span) {
  color: var(--color-text, #f1f5f9);
}

/* Add a hash symbol on hover for anchor link functionality */
.preview-content :deep(.header-anchor)::before {
  content: '';
  margin-right: 0;
}

.preview-content :deep(h1:hover .header-anchor)::before,
.preview-content :deep(h2:hover .header-anchor)::before,
.preview-content :deep(h3:hover .header-anchor)::before,
.preview-content :deep(h4:hover .header-anchor)::before,
.preview-content :deep(h5:hover .header-anchor)::before,
.preview-content :deep(h6:hover .header-anchor)::before {
  content: '# ';
  color: var(--color-text-muted, #94a3b8);
}

/* Footnotes */
.preview-content :deep(.footnotes) {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #334155);
  font-size: 0.875rem;
}

.preview-content :deep(.footnotes-sep) {
  display: none;
}

/* Scrollbar styling */
.preview-content::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.preview-content::-webkit-scrollbar-track {
  background: var(--color-background, #0f172a);
}

.preview-content::-webkit-scrollbar-thumb {
  background: var(--color-border, #334155);
  border-radius: 6px;
  border: 3px solid var(--color-background, #0f172a);
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
