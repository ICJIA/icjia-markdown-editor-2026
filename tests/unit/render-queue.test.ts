import { describe, it, expect, vi } from 'vitest'
import { createRenderQueue, type RenderRequest, type WorkerLike } from '~/utils/markdown/render-queue'

interface Result { id: number, html: string }

/** A worker that does nothing until the test tells it to reply. */
class FakeWorker implements WorkerLike<RenderRequest, Result> {
  onmessage: ((event: { data: Result }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  received: RenderRequest[] = []
  terminated = false

  postMessage(message: RenderRequest): void {
    this.received.push(message)
  }

  terminate(): void {
    this.terminated = true
  }

  /** Replies to the most recent request, as a real worker would when it finishes. */
  finish(): void {
    const last = this.received.at(-1)!
    this.onmessage?.({ data: { id: last.id, html: `<p>${last.content}</p>` } })
  }
}

function setup(budgetMs = 1000) {
  const workers: FakeWorker[] = []
  const results: Result[] = []
  const busy: boolean[] = []
  const onTimeout = vi.fn()
  const onError = vi.fn()
  let fire: (() => void) | null = null

  const queue = createRenderQueue<Result>({
    spawn: () => {
      const worker = new FakeWorker()
      workers.push(worker)
      return worker
    },
    budgetMs,
    onResult: result => results.push(result),
    onTimeout,
    onError,
    onBusyChange: value => busy.push(value),
    setTimer: (fn) => {
      fire = fn
      return fn
    },
    clearTimer: () => {
      fire = null
    },
  })

  return {
    queue, workers, results, busy, onTimeout, onError,
    /** Lets the budget run out, if a render is being timed. */
    expire: () => fire?.(),
    timing: () => fire !== null,
  }
}

describe('createRenderQueue', () => {
  it('renders a request and reports the result', () => {
    const t = setup()
    t.queue.request('a')
    expect(t.workers).toHaveLength(1)
    t.workers[0]!.finish()
    expect(t.results.map(r => r.html)).toEqual(['<p>a</p>'])
    expect(t.busy).toEqual([true, false])
    expect(t.timing()).toBe(false)
  })

  it('reuses one worker across renders', () => {
    const t = setup()
    t.queue.request('a')
    t.workers[0]!.finish()
    t.queue.request('b')
    t.workers[0]!.finish()
    expect(t.workers).toHaveLength(1)
    expect(t.results.map(r => r.html)).toEqual(['<p>a</p>', '<p>b</p>'])
  })

  it('keeps only the newest content while a render is in flight', () => {
    const t = setup()
    t.queue.request('a')
    t.queue.request('b')
    t.queue.request('c')
    // Nothing is sent until the first render comes back.
    expect(t.workers[0]!.received.map(r => r.content)).toEqual(['a'])
    t.workers[0]!.finish()
    // 'b' was superseded and is never rendered.
    expect(t.workers[0]!.received.map(r => r.content)).toEqual(['a', 'c'])
  })

  it('does not report a result that newer content has made stale', () => {
    const t = setup()
    t.queue.request('a')
    t.queue.request('b')
    t.workers[0]!.finish() // 'a' finishes, but 'b' is waiting
    expect(t.results).toEqual([])
    t.workers[0]!.finish()
    expect(t.results.map(r => r.html)).toEqual(['<p>b</p>'])
  })

  it('terminates the worker and reports a timeout when the budget runs out', () => {
    const t = setup()
    t.queue.request('slow')
    t.expire()
    expect(t.workers[0]!.terminated).toBe(true)
    expect(t.onTimeout).toHaveBeenCalledOnce()
    expect(t.results).toEqual([])
    expect(t.busy.at(-1)).toBe(false)
  })

  it('ignores a late reply from a render that already timed out', () => {
    const t = setup()
    t.queue.request('slow')
    const abandoned = t.workers[0]!
    const handler = abandoned.onmessage
    t.expire()
    // The queue detaches its handler; even a reply delivered through the old
    // one must not surface.
    handler?.({ data: { id: 1, html: '<p>slow</p>' } })
    expect(t.results).toEqual([])
  })

  it('starts a fresh worker for the next request after a timeout', () => {
    const t = setup()
    t.queue.request('slow')
    t.expire()
    t.queue.request('fine')
    expect(t.workers).toHaveLength(2)
    t.workers[1]!.finish()
    expect(t.results.map(r => r.html)).toEqual(['<p>fine</p>'])
  })

  it('renders content that was waiting when the timeout struck', () => {
    const t = setup()
    t.queue.request('slow')
    t.queue.request('edited')
    t.expire()
    expect(t.workers).toHaveLength(2)
    expect(t.workers[1]!.received.map(r => r.content)).toEqual(['edited'])
  })

  it('reports a worker crash and recovers on the next request', () => {
    const t = setup()
    t.queue.request('a')
    t.workers[0]!.onerror?.(new Error('boom'))
    expect(t.onError).toHaveBeenCalledOnce()
    expect(t.workers[0]!.terminated).toBe(true)
    t.queue.request('b')
    expect(t.workers).toHaveLength(2)
  })

  it('reports a worker that cannot be created', () => {
    const onError = vi.fn()
    const queue = createRenderQueue<Result>({
      spawn: () => {
        throw new Error('blocked')
      },
      budgetMs: 1000,
      onResult: () => {},
      onTimeout: () => {},
      onError,
    })
    queue.request('a')
    expect(onError).toHaveBeenCalledOnce()
  })

  it('stops the worker and the timer on dispose', () => {
    const t = setup()
    t.queue.request('a')
    t.queue.dispose()
    expect(t.workers[0]!.terminated).toBe(true)
    expect(t.timing()).toBe(false)
  })
})
