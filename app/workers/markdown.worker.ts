/**
 * Markdown render worker.
 *
 * Parses a document and renders it to HTML off the main thread, so a slow or
 * hostile document cannot freeze the editor. One parse yields both the HTML and
 * the heading list the outline and the heading check need.
 *
 * What this sends back is NOT safe to display: raw HTML is enabled, and a worker
 * has no document for DOMPurify to work with. The main thread sanitizes it with
 * `sanitizeHtml` before it goes anywhere near the page (see `useMarkdown`).
 *
 * Scheduling, the time budget and recovery live in `utils/markdown/render-queue`.
 */
import { getMarkdownIt } from '~/utils/markdown/parser'
import { headingsFromTokens, type ParsedHeading } from '~/utils/markdown/heading-tokens'
import type { RenderRequest } from '~/utils/markdown/render-queue'

/** A finished render, or the reason there is not one. */
export interface MarkdownRenderResult {
  id: number
  /** Unsanitized HTML. Empty when `error` is set. */
  html: string
  headings: ParsedHeading[]
  error?: string
}

self.onmessage = (event: MessageEvent<RenderRequest>) => {
  const { id, content } = event.data
  let result: MarkdownRenderResult
  try {
    const md = getMarkdownIt()
    const env = {}
    const tokens = md.parse(content, env)
    // Headings first: rendering adds attributes to the tokens it walks.
    const headings = headingsFromTokens(tokens)
    const html = md.renderer.render(tokens, md.options, env)
    result = { id, html, headings }
  } catch (error) {
    result = { id, html: '', headings: [], error: error instanceof Error ? error.message : String(error) }
  }
  self.postMessage(result)
}
