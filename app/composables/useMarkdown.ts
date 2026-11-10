/**
 * @fileoverview Markdown Composable
 * @description Turns the editor's content into the preview's HTML, the heading
 * outline, the heading check and the word count.
 *
 * Parsing runs in a Web Worker (`app/workers/markdown.worker.ts`), scheduled by
 * a render queue with a time budget, so no document can freeze the editor: a
 * render that takes too long is abandoned and the preview says so. The worker
 * returns unsanitized HTML — it has no DOM for DOMPurify — which is sanitized
 * here, on the main thread, before it is ever assigned to `renderedHtml`.
 *
 * State is shared (module-level singleton, same pattern as useEditor) so the
 * preview pane, status bar and panels all reuse ONE render pipeline. Everything
 * derives from the debounced content, so nothing is recomputed per keystroke.
 *
 * @module composables/useMarkdown
 * @requires ~/utils/markdown/config
 * @requires ~/utils/markdown/render-queue
 * @requires ~/utils/markdown/text-stats
 * @requires ~/utils/markdown/heading-lint
 *
 * @example
 * ```typescript
 * const { renderedHtml, previewStatus, wordCountDisplay } = useMarkdown()
 *
 * // <div v-html="renderedHtml" />  — already sanitized
 * console.log(wordCountDisplay.value) // "1,234 words · 5,678 chars"
 * ```
 */

import MarkdownWorker from '~/workers/markdown.worker?worker'
import type { MarkdownRenderResult } from '~/workers/markdown.worker'
import { getMarkdownIt, sanitizeHtml } from '~/utils/markdown/config'
import { createRenderQueue, type RenderQueue, type RenderRequest, type WorkerLike } from '~/utils/markdown/render-queue'
import { stripMarkdownSyntax, computeWordCount } from '~/utils/markdown/text-stats'
import { lintParsedHeadings } from '~/utils/markdown/heading-lint'
import { outlineFromHeadings } from '~/utils/markdown/outline'
import { headingsFromTokens, type ParsedHeading } from '~/utils/markdown/heading-tokens'

/**
 * How long one render may take before it is abandoned.
 *
 * Generous on purpose: a legitimately long report on a slow laptop should
 * finish, and since the work is off the main thread, waiting costs the author
 * nothing but a stale preview. It exists to bound the pathological case.
 */
export const RENDER_BUDGET_MS = 10_000

/**
 * Largest parser output, in characters, that will be sanitized and displayed.
 *
 * Sanitizing and inserting HTML are main-thread work the worker cannot take
 * over, and both scale with the size of the output rather than the input: 80 KB
 * of inline math becomes 7.7 MB of KaTeX markup. Past this size the preview
 * steps aside instead of stalling the page. A 300-page plain report renders to
 * well under 2 MB.
 */
export const MAX_PREVIEW_HTML = 4_000_000

/** A render in flight for longer than this shows the "Rendering…" indicator. */
const INDICATOR_DELAY_MS = 600

/**
 * Why the preview is, or is not, showing the current document.
 *   - `ok`         the preview reflects the document
 *   - `timeout`    the last render exceeded {@link RENDER_BUDGET_MS}
 *   - `too-large`  the rendered HTML exceeded {@link MAX_PREVIEW_HTML}
 *   - `error`      the parser threw, or the worker could not be started
 */
export type PreviewStatus = 'ok' | 'timeout' | 'too-large' | 'error'

/** Shared singleton state — created lazily on first use. */
let state: ReturnType<typeof createMarkdownState> | null = null

function createMarkdownState() {
  const { content } = useEditor()

  /**
   * Debounced content for performance on large documents.
   * Updates 150ms after content stops changing.
   */
  const debouncedContent = refDebounced(content, 150)

  /** Rendered, sanitized HTML for the preview pane. */
  const renderedHtml = ref('')

  /** Headings of the last document that rendered, as parsed by the worker. */
  const headings = shallowRef<ParsedHeading[]>([])

  const previewStatus = ref<PreviewStatus>('ok')

  /** True while the worker is rendering. */
  const isRendering = ref(false)

  /** True once a render has been in flight long enough to be worth mentioning. */
  const showRenderingIndicator = ref(false)
  let indicatorTimer: ReturnType<typeof setTimeout> | null = null

  function setBusy(busy: boolean): void {
    isRendering.value = busy
    if (indicatorTimer) {
      clearTimeout(indicatorTimer)
      indicatorTimer = null
    }
    if (busy) {
      indicatorTimer = setTimeout(() => {
        showRenderingIndicator.value = true
      }, INDICATOR_DELAY_MS)
    } else {
      showRenderingIndicator.value = false
    }
  }

  /** Shows a finished render, or steps aside if it is too large to show. */
  function accept(rawHtml: string, parsed: ParsedHeading[]): void {
    headings.value = parsed
    if (rawHtml.length > MAX_PREVIEW_HTML) {
      renderedHtml.value = ''
      previewStatus.value = 'too-large'
      return
    }
    renderedHtml.value = sanitizeHtml(rawHtml)
    previewStatus.value = 'ok'
  }

  function fail(status: PreviewStatus): void {
    renderedHtml.value = ''
    previewStatus.value = status
  }

  /** Same-thread render, for browsers without module workers. */
  function renderHere(markdown: string): void {
    try {
      const md = getMarkdownIt()
      const env = {}
      const tokens = md.parse(markdown, env)
      const parsed = headingsFromTokens(tokens)
      accept(md.renderer.render(tokens, md.options, env), parsed)
    } catch (error) {
      console.error('Markdown render failed:', error)
      fail('error')
    }
  }

  // Nothing renders on the server: sanitizing needs a document, and the editor's
  // content only exists in the browser anyway.
  if (import.meta.client) {
    let queue: RenderQueue | null = null
    /** Set once the worker has failed to start, so it is not retried forever. */
    let workerUnavailable = typeof Worker === 'undefined'

    if (!workerUnavailable) {
      queue = createRenderQueue<MarkdownRenderResult>({
        // `Worker`'s handler types are wider than the queue needs (they carry
        // the full MessageEvent); the queue only ever reads `data`.
        spawn: () => new MarkdownWorker() as unknown as WorkerLike<RenderRequest, MarkdownRenderResult>,
        budgetMs: RENDER_BUDGET_MS,
        onBusyChange: setBusy,
        onResult: (result) => {
          if (result.error) {
            console.error('Markdown render failed:', result.error)
            fail('error')
            return
          }
          accept(result.html, result.headings)
        },
        onTimeout: () => fail('timeout'),
        onError: (error) => {
          // The worker script failed to load or crashed outright. Fall back to
          // rendering here for the rest of the session rather than leaving the
          // author with no preview.
          console.error('Markdown worker unavailable, rendering on the main thread:', error)
          workerUnavailable = true
          queue?.dispose()
          queue = null
          setBusy(false)
          renderHere(debouncedContent.value)
        },
      })
    }

    watch(
      debouncedContent,
      (markdown) => {
        if (queue && !workerUnavailable) queue.request(markdown)
        else renderHere(markdown)
      },
      { immediate: true },
    )
  }

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
   * Heading hierarchy issues for the current document, from the headings the
   * worker parsed — the same parse that produced the preview, so the two cannot
   * disagree.
   */
  const headingIssues = computed(() => lintParsedHeadings(headings.value))

  /** Number of heading issues; 0 when the document is clean. */
  const issueCount = computed(() => headingIssues.value.length)

  /** The document's heading outline, from the same parse. */
  const outline = computed(() => outlineFromHeadings(headings.value))

  return {
    outline,
    renderedHtml: readonly(renderedHtml),
    previewStatus: readonly(previewStatus),
    isRendering: readonly(isRendering),
    showRenderingIndicator: readonly(showRenderingIndicator),
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
