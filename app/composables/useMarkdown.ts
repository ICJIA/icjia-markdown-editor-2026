/**
 * Markdown Composable
 * Handles markdown-to-HTML rendering with debouncing for performance
 */

import { renderMarkdown } from '~/utils/markdown/config'

export function useMarkdown() {
  const { content } = useEditor()
  
  // Debounce content for performance on large documents
  const debouncedContent = refDebounced(content, 150)
  
  // Track rendering state for very large documents
  const isRendering = ref(false)
  
  /**
   * Rendered HTML from markdown content
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
   * Show loading indicator for very large documents (> 100KB)
   */
  const showRenderingIndicator = computed(() => {
    return isRendering.value && debouncedContent.value.length > 100000
  })
  
  /**
   * Get plain text from current content (for word count, etc.)
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
   * Word count statistics
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
   * Formatted display string for word count
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
