/**
 * @fileoverview Render Queue
 * @description Schedules markdown renders on a worker so the page stays
 * responsive whatever the document contains.
 *
 * Parsing ran on the main thread until 1.11.0, which meant one pathological
 * document froze the tab — and because the document is auto-saved, reloading
 * restored the freeze. The worker takes the parse off the main thread; this
 * queue is what makes that safe to rely on:
 *
 *   - **Latest wins.** While a render is in flight, newer content replaces any
 *     that is waiting rather than queueing behind it. A slow document costs one
 *     render per pause in typing, not one per keystroke.
 *   - **A time budget.** A render that outlives its budget is abandoned by
 *     terminating the worker — the only way to stop synchronous code — and the
 *     caller is told, so the preview can say so instead of spinning forever.
 *   - **Recovery.** After a timeout or a crash the next request starts a fresh
 *     worker. One bad document does not disable the preview for the session.
 *
 * It knows nothing about markdown or the DOM: the worker is injected, as are
 * the timers, so all of the above is unit-tested without either.
 *
 * @module utils/markdown/render-queue
 */

/** The part of the `Worker` interface the queue uses. */
export interface WorkerLike<Req, Res> {
  postMessage(message: Req): void
  terminate(): void
  onmessage: ((event: { data: Res }) => void) | null
  onerror: ((event: unknown) => void) | null
}

/** What the queue sends: content tagged with the request it belongs to. */
export interface RenderRequest {
  id: number
  content: string
}

/** What the worker must send back: the same id, plus whatever it produced. */
export interface RenderResponse {
  id: number
}

export interface RenderQueueOptions<Res extends RenderResponse> {
  /** Creates a worker. Called lazily, and again after a timeout or crash. */
  spawn: () => WorkerLike<RenderRequest, Res>
  /** How long one render may take before it is abandoned, in milliseconds. */
  budgetMs: number
  /** Called with the result for the most recent content only. */
  onResult: (result: Res) => void
  /** Called when a render exceeded the budget and its worker was terminated. */
  onTimeout: () => void
  /** Called when the worker itself failed (it could not load, or threw). */
  onError: (error: unknown) => void
  /** Called when a render is sent, and again when nothing is in flight. */
  onBusyChange?: (busy: boolean) => void
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

export interface RenderQueue {
  /** Asks for `content` to be rendered, superseding anything not yet started. */
  request: (content: string) => void
  /** Stops the worker and forgets pending work. */
  dispose: () => void
}

/**
 * Creates a render queue.
 *
 * @param {RenderQueueOptions} options - The worker factory, budget and callbacks
 * @returns {RenderQueue} `request` and `dispose`
 *
 * @example
 * ```typescript
 * const queue = createRenderQueue({
 *   spawn: () => new MarkdownWorker(),
 *   budgetMs: 10_000,
 *   onResult: ({ html }) => { preview.value = sanitizeHtml(html) },
 *   onTimeout: () => { status.value = 'timeout' },
 *   onError: console.error,
 * })
 * queue.request('# Hello')
 * ```
 */
export function createRenderQueue<Res extends RenderResponse>(
  options: RenderQueueOptions<Res>,
): RenderQueue {
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = options.clearTimer ?? (handle => clearTimeout(handle as ReturnType<typeof setTimeout>))

  let worker: WorkerLike<RenderRequest, Res> | null = null
  let nextId = 0
  /** Id of the render the worker is working on, or null when it is idle. */
  let inFlight: number | null = null
  /** Newest content waiting for the worker; only ever one. */
  let pending: string | null = null
  let timer: unknown = null

  function stopTimer(): void {
    if (timer !== null) {
      clearTimer(timer)
      timer = null
    }
  }

  function discardWorker(): void {
    stopTimer()
    if (worker) {
      worker.onmessage = null
      worker.onerror = null
      worker.terminate()
      worker = null
    }
    inFlight = null
  }

  /** Sends whatever is waiting, or reports that the queue has gone idle. */
  function drain(): void {
    if (pending === null) {
      options.onBusyChange?.(false)
      return
    }
    const content = pending
    pending = null
    send(content)
  }

  function send(content: string): void {
    if (!worker) {
      try {
        worker = options.spawn()
      } catch (error) {
        options.onBusyChange?.(false)
        options.onError(error)
        return
      }
      worker.onmessage = ({ data }) => {
        // A reply for anything but the render in flight is from a job that was
        // already abandoned; acting on it would show stale output.
        if (data.id !== inFlight) return
        stopTimer()
        inFlight = null
        // Content that arrived meanwhile makes this result out of date, and
        // sanitizing and displaying it would only delay the one that matters.
        if (pending === null) options.onResult(data)
        drain()
      }
      worker.onerror = (error) => {
        discardWorker()
        options.onError(error)
        drain()
      }
    }

    inFlight = ++nextId
    options.onBusyChange?.(true)
    timer = setTimer(() => {
      timer = null
      discardWorker()
      options.onTimeout()
      drain()
    }, options.budgetMs)
    worker.postMessage({ id: inFlight, content })
  }

  return {
    request(content: string): void {
      if (inFlight !== null) {
        pending = content
        return
      }
      send(content)
    },
    dispose(): void {
      pending = null
      discardWorker()
    },
  }
}
