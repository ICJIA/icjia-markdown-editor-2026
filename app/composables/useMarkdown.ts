/**
 * @fileoverview Markdown Composable
 * @description Handles markdown-to-HTML rendering with debouncing for performance.
 * Provides computed properties for rendered HTML, plain text, and word count statistics.
 * 
 * @module composables/useMarkdown
 * @requires ~/utils/markdown/config
 * 
 * @example
 * ```typescript
 * const { renderedHtml, wordCount, wordCountDisplay } = useMarkdown()
 * 
 * // Use rendered HTML in template
 * // <div v-html="renderedHtml" />
 * 
 * // Display word count
 * console.log(wordCountDisplay.value) // "1,234 words · 5,678 chars"
 * ```
 */

import { renderMarkdown } from '~/utils/markdown/config'

/**
 * Markdown composable for rendering and analyzing markdown content.
 * Debounces content updates for better performance with large documents.
 * 
 * @returns {Object} Markdown rendering state and computed values
 * @returns {ComputedRef<string>} returns.renderedHtml - Rendered HTML from markdown
 * @returns {Readonly<Ref<boolean>>} returns.isRendering - Whether rendering is in progress
 * @returns {ComputedRef<boolean>} returns.showRenderingIndicator - Show loading for large docs
 * @returns {ComputedRef<string>} returns.plainText - Plain text with markdown stripped
 * @returns {ComputedRef<Object>} returns.wordCount - Word count statistics object
 * @returns {ComputedRef<string>} returns.wordCountDisplay - Formatted word count string
 */
export function useMarkdown() {
  const { content } = useEditor()
  
  /**
   * Debounced content for performance on large documents.
   * Updates 150ms after content stops changing.
   * @type {Ref<string>}
   */
  const debouncedContent = refDebounced(content, 150)
  
  /**
   * Flag indicating if a render is in progress for large documents.
   * @type {Ref<boolean>}
   */
  const isRendering = ref(false)
  
  /**
   * Computed property that renders markdown content to HTML.
   * Sets isRendering flag for documents > 50KB.
   * 
   * @type {ComputedRef<string>}
   */
  const renderedHtml = computed(() => {
    // Mark as rendering for large documents (> 50KB)
    if (debouncedContent.value.length > 50000) {
      isRendering.value = true
    }
    
    const html = renderMarkdown(debouncedContent.value)
    
    // Reset rendering state after DOM update
    nextTick(() => {
      isRendering.value = false
    })
    
    return html
  })
  
  /**
   * Computed property that determines if a loading indicator should be shown.
   * Only shown for documents > 100KB during rendering.
   * 
   * @type {ComputedRef<boolean>}
   */
  const showRenderingIndicator = computed(() => {
    return isRendering.value && debouncedContent.value.length > 100000
  })
  
  /**
   * Computed property that extracts plain text from markdown content.
   * Strips markdown syntax for accurate word counting.
   * 
   * @type {ComputedRef<string>}
   */
  const plainText = computed(() => {
    // Strip markdown syntax for accurate word count
    return content.value
      .replace(/#{1,6}\s/g, '') // headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/_(.+?)_/g, '$1') // italic
      .replace(/`(.+?)`/g, '$1') // inline code
      .replace(/```[\s\S]*?```/g, '') // code blocks
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
      .replace(/!\[.*?\]\(.+?\)/g, '') // images
      .replace(/^\s*[-*+]\s/gm, '') // list markers
      .replace(/^\s*\d+\.\s/gm, '') // numbered lists
      .replace(/^\s*>\s/gm, '') // blockquotes
      .replace(/---/g, '') // horizontal rules
  })
  
  /**
   * Computed property that provides comprehensive word count statistics.
   * 
   * @type {ComputedRef<{words: number, characters: number, charactersNoSpaces: number, lines: number, paragraphs: number}>}
   */
  const wordCount = computed(() => {
    const text = plainText.value.trim()
    
    if (!text) {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        lines: 0,
        paragraphs: 0,
      }
    }
    
    // Word count: split on whitespace, filter empty strings
    const words = text.split(/\s+/).filter(Boolean).length
    
    // Character counts
    const characters = content.value.length
    const charactersNoSpaces = content.value.replace(/\s/g, '').length
    
    // Line count
    const lines = content.value.split('\n').length
    
    // Paragraph count (separated by blank lines)
    const paragraphs = content.value
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 0).length
    
    return {
      words,
      characters,
      charactersNoSpaces,
      lines,
      paragraphs,
    }
  })
  
  /**
   * Computed property that formats word count for display in the UI.
   * Format: "X words · Y chars"
   * 
   * @type {ComputedRef<string>}
   */
  const wordCountDisplay = computed(() => {
    const { words, characters } = wordCount.value
    return `${words.toLocaleString()} words · ${characters.toLocaleString()} chars`
  })
  
  return {
    renderedHtml,
    isRendering: readonly(isRendering),
    showRenderingIndicator,
    plainText,
    wordCount,
    wordCountDisplay,
  }
}
