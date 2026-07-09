/**
 * @fileoverview Markdown Composable
 * @description Handles markdown-to-HTML rendering with debouncing for performance.
 * Provides computed properties for rendered HTML, plain text, and word count statistics.
 *
 * State is shared (module-level singleton, same pattern as useEditor) so the
 * preview pane, status bar, and export logic all reuse ONE render pipeline
 * instead of each instantiating their own. All derived values — including word
 * count — compute from the debounced content so large documents aren't
 * re-analyzed on every keystroke.
 *
 * @module composables/useMarkdown
 * @requires ~/utils/markdown/config
 * @requires ~/utils/markdown/text-stats
 * @requires ~/utils/markdown/heading-lint
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
import { stripMarkdownSyntax, computeWordCount } from '~/utils/markdown/text-stats'
import { lintHeadings } from '~/utils/markdown/heading-lint'

/** Document size (chars) above which the rendering flag is raised. */
const LARGE_DOC_THRESHOLD = 50000

/** Document size (chars) above which the rendering indicator is shown. */
const INDICATOR_THRESHOLD = 100000

/** Shared singleton state — created lazily on first use. */
let state: ReturnType<typeof createMarkdownState> | null = null

function createMarkdownState() {
  const { content } = useEditor()

  /**
   * Debounced content for performance on large documents.
   * Updates 150ms after content stops changing.
   */
  const debouncedContent = refDebounced(content, 150)

  /** Flag indicating if a render is in progress for large documents. */
  const isRendering = ref(false)

  /** Rendered, sanitized HTML for the preview pane. */
  const renderedHtml = computed(() => renderMarkdown(debouncedContent.value))

  // Raise the rendering flag for large documents and clear it after the DOM
  // updates. Done in a watcher (not inside the computed) so the computed stays
  // side-effect free.
  watch(debouncedContent, (value) => {
    if (value.length > LARGE_DOC_THRESHOLD) {
      isRendering.value = true
      nextTick(() => {
        isRendering.value = false
      })
    }
  })

  /** Whether to show the "Rendering..." indicator (very large documents only). */
  const showRenderingIndicator = computed(() => {
    return isRendering.value && debouncedContent.value.length > INDICATOR_THRESHOLD
  })

  /** Plain text with markdown syntax stripped, for word counting. */
  const plainText = computed(() => stripMarkdownSyntax(debouncedContent.value))

  /** Word count statistics (words, characters, lines, paragraphs, reading time). */
  const wordCount = computed(() => computeWordCount(debouncedContent.value))

  /** Formatted word count for the status bar: "X words · Y chars". */
  const wordCountDisplay = computed(() => {
    const { words, characters } = wordCount.value
    return `${words.toLocaleString()} words · ${characters.toLocaleString()} chars`
  })

  /**
   * Heading hierarchy issues for the current document.
   * Computed from the debounced content, so large documents are not
   * re-linted on every keystroke.
   */
  const headingIssues = computed(() => lintHeadings(debouncedContent.value))

  /** Number of heading issues; 0 when the document is clean. */
  const issueCount = computed(() => headingIssues.value.length)

  return {
    renderedHtml,
    isRendering: readonly(isRendering),
    showRenderingIndicator,
    plainText,
    wordCount,
    wordCountDisplay,
    headingIssues,
    issueCount,
  }
}

/**
 * Markdown composable for rendering and analyzing markdown content.
 * Returns the shared singleton state; safe to call from any number of components.
 *
 * @returns {Object} Markdown rendering state and computed values
 */
export function useMarkdown() {
  if (!state) {
    // Detached effect scope: the watchers inside must live for the app's
    // lifetime, not die with whichever component happened to call this first.
    const scope = effectScope(true)
    state = scope.run(createMarkdownState)!
  }
  return state
}
