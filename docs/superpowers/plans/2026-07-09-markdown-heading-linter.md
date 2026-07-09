# Markdown Heading Hierarchy Linter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Warn authors, as they type, when their markdown would produce an improper heading hierarchy once Strapi renders it beneath the page-title `<h1>`.

**Architecture:** A pure function parses the document with the *same* `markdown-it` singleton that renders the preview and the HTML export, so the linter can never disagree with what an accessibility checker eventually sees. It walks `heading_open` tokens seeded with a virtual `h1` (Strapi's page title). Results surface as a status-bar count that expands into a clickable issue list. No new runtime dependency; no bundle growth.

**Tech Stack:** Nuxt 4, Vue 3.5 (`<script setup>`), TypeScript, CodeMirror 6, markdown-it 14, Vitest (jsdom), `@vueuse/core`, Nuxt UI 4 (`UIcon`, `UTooltip`).

**Spec:** `docs/superpowers/specs/2026-07-09-markdown-heading-linter-design.md`

## Global Constraints

- **Virtual h1.** Strapi supplies the page's `<h1>` title. Documents must open at `##`, must contain no `#`, and may never skip a level. Traversal seeds `prevLevel = 1`.
- **Rule precedence.** `no-h1` takes precedence over `empty-heading`: a bare `#` reports `no-h1` only. After emitting `no-h1`, traversal resets `prevLevel = 1` and continues.
- **Ascending is always valid.** `h4` back to `h2` closes two sections and is not an issue.
- **Single source of truth.** Parse via `getMarkdownIt()` from `~/utils/markdown/config`. Never regex the markdown for headings — that breaks on fenced code blocks and setext headings.
- **Severities.** `no-h1` = `error`, `heading-order` = `error`, `empty-heading` = `warning`.
- **Accepted limitation.** `html: true` means a literal `<h4>` arrives as an `html_block` token and is invisible to the linter. Do not attempt to detect it. Document it.
- **Live region.** The issue count must NOT render inside an `aria-live` region, or screen readers announce it on every 150 ms debounce tick.
- **No color-alone status** (WCAG 1.4.1): every issue carries an icon *and* text.
- **Accessible name must match visible text casing** (WCAG 2.5.3).
- **No new dependency.** Do not add `@codemirror/lint`.
- **Commits:** never add an AI co-author trailer.

---

### Task 1: Pure heading rule engine

**Files:**
- Create: `app/utils/markdown/heading-lint.ts`
- Test: `tests/unit/heading-lint.test.ts`

**Interfaces:**
- Consumes: `getMarkdownIt()` from `~/utils/markdown/config` (existing, returns a `MarkdownIt`).
- Produces: `lintHeadings(markdown: string): HeadingIssue[]`, and the exported types `HeadingIssue` and `HeadingRule`. Tasks 3 and 4 depend on these exact names.

Vitest runs under jsdom (`vitest.config.ts`), so importing `~/utils/markdown/config` — which imports DOMPurify — is safe. The `~` alias maps to `app/`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/heading-lint.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { lintHeadings } from '~/utils/markdown/heading-lint'

describe('lintHeadings', () => {
  it('accepts a document that opens at h2 and descends one level at a time', () => {
    expect(lintHeadings('## A\n\n### B\n')).toEqual([])
  })

  it('allows ascending more than one level at a time (h4 back to h2)', () => {
    expect(lintHeadings('## A\n\n### B\n\n#### C\n\n## D\n')).toEqual([])
  })

  it('flags a document that opens at h3, because it skips the page h1 to h3', () => {
    const issues = lintHeadings('### Deep\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'heading-order', severity: 'error' })
    expect(issues[0]!.message).toContain('h1 to h3')
  })

  it('flags a skip from h2 to h4 on the correct line', () => {
    const issues = lintHeadings('## A\n\n#### D\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 3, rule: 'heading-order' })
    expect(issues[0]!.message).toContain('Use h3')
  })

  it('flags an h1 and suggests the h2 form with the heading text', () => {
    const issues = lintHeadings('# Title\n\n## Sub\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'no-h1', severity: 'error' })
    expect(issues[0]!.message).toContain('## Title')
  })

  it('reports both the h1 and the skip beneath it', () => {
    const issues = lintHeadings('# Title\n\n### Sub\n')
    expect(issues.map(i => i.rule)).toEqual(['no-h1', 'heading-order'])
    expect(issues.map(i => i.line)).toEqual([1, 3])
  })

  it('reports only no-h1 for a bare "#", never empty-heading', () => {
    const issues = lintHeadings('#\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('no-h1')
  })

  it('flags an empty heading as a warning', () => {
    const issues = lintHeadings('##\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
  })

  it('understands setext headings, which a regex linter would read as a horizontal rule', () => {
    const issues = lintHeadings('Title\n-----\n\n#### D\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 4, rule: 'heading-order' })
  })

  it('ignores "#" inside a fenced code block', () => {
    expect(lintHeadings('## A\n\n```bash\n# not a heading\n```\n')).toEqual([])
  })

  it('returns an empty array for a document with no headings', () => {
    expect(lintHeadings('Just a paragraph.\n')).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn vitest run tests/unit/heading-lint.test.ts`

Expected: FAIL — `Failed to resolve import "~/utils/markdown/heading-lint"`.

- [ ] **Step 3: Write the implementation**

Create `app/utils/markdown/heading-lint.ts`:

```ts
/**
 * @fileoverview Heading Hierarchy Linter
 * @description Reports heading problems that would make a published document
 * fail an accessibility checker's heading-order rule.
 *
 * Documents authored here are published through Strapi, which renders the page
 * title as the page's <h1> and injects this markdown beneath it. The linter
 * therefore seeds its traversal with a "virtual h1": a document must open at
 * h2, must not contain an h1 of its own, and may never skip a level.
 *
 * Parsing uses the same markdown-it singleton that renders the preview and the
 * HTML export, so the linter cannot disagree with the output. This also handles
 * two cases a regex over `^#{1,6}\s` gets wrong: hashes inside fenced code
 * blocks (not headings) and setext underlines (headings).
 *
 * Known limitation: markdown-it runs with `html: true`, so a literal
 * `<h4>Section</h4>` arrives as an `html_block` token and is invisible here.
 *
 * @module utils/markdown/heading-lint
 * @requires ~/utils/markdown/config
 */

import { getMarkdownIt } from '~/utils/markdown/config'

/** The rules this linter enforces. */
export type HeadingRule = 'no-h1' | 'heading-order' | 'empty-heading'

/** A single heading problem, anchored to a 1-based editor line. */
export interface HeadingIssue {
  /** 1-based line number in the markdown source. */
  line: number
  /** Which rule was violated. */
  rule: HeadingRule
  /** Errors break the published hierarchy; warnings are authoring slips. */
  severity: 'error' | 'warning'
  /** Author-facing text that names the fix. */
  message: string
}

/** Strapi renders the page title as an <h1> above this document. */
const VIRTUAL_H1_LEVEL = 1

/**
 * Lints a markdown document's heading hierarchy.
 * Issues are returned in source order.
 *
 * @param {string} markdown - The markdown source
 * @returns {HeadingIssue[]} Every heading problem found, empty when clean
 *
 * @example
 * ```typescript
 * lintHeadings('## A\n\n#### D')
 * // [{ line: 3, rule: 'heading-order', severity: 'error', message: 'Heading skips from h2 to h4. Use h3.' }]
 * ```
 */
export function lintHeadings(markdown: string): HeadingIssue[] {
  const tokens = getMarkdownIt().parse(markdown, {})
  const issues: HeadingIssue[] = []

  // Seeded to the page-title h1 that Strapi supplies, not to the first heading
  // we happen to see. This is what makes a document opening at h3 an error.
  let prevLevel = VIRTUAL_H1_LEVEL

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'heading_open') continue

    const level = Number(token.tag.slice(1))
    const line = (token.map?.[0] ?? 0) + 1
    // NOTE: this line is WRONG and was corrected during implementation. See the
    // note below the code block; the shipped version uses a headingText() helper.
    const text = (tokens[i + 1]?.content ?? '').trim()

    if (level === VIRTUAL_H1_LEVEL) {
      issues.push({
        line,
        rule: 'no-h1',
        severity: 'error',
        message: text
          ? `H1 is reserved for the page title. Use "## ${text}" instead.`
          : 'H1 is reserved for the page title. Use ## instead.',
      })
      // Keep the baseline at h1 so the next heading is judged against the page
      // title rather than against a heading we just rejected.
      prevLevel = VIRTUAL_H1_LEVEL
      continue
    }

    if (text === '') {
      issues.push({
        line,
        rule: 'empty-heading',
        severity: 'warning',
        message: `Empty h${level} heading. Add text or remove it.`,
      })
    }

    if (level > prevLevel + 1) {
      issues.push({
        line,
        rule: 'heading-order',
        severity: 'error',
        message: `Heading skips from h${prevLevel} to h${level}. Use h${prevLevel + 1}.`,
      })
    }

    prevLevel = level
  }

  return issues
}
```

> **Correction (recorded after implementation).** The `const text = (tokens[i + 1]?.content ?? '').trim()`
> line above is wrong against this codebase and was replaced in commit `c7c3c0f`.
> `getMarkdownIt()` installs `markdown-it-anchor` with a `headerLink` permalink, whose core rule
> replaces each heading's inline token with a fresh one whose `.content` is `""` and whose children
> are wrapped as `link_open, span_open, …, span_close, link_close`. So `.content` is empty for *every*
> heading, and this code would have fired `empty-heading` on all 24 tutorial headings.
>
> The shipped implementation reconstructs the text with a `headingText()` helper that joins the inline
> token's children while dropping `html_inline` and any `*_open`/`*_close` type. Dropping by token type
> (rather than whitelisting `text`/`code_inline`) is deliberate: a whitelist would discard `math_inline`
> and make `## $E = mc^2$` look like an empty heading, and this app ships KaTeX.
>
> Read `app/utils/markdown/heading-lint.ts` for the real version rather than copying the block above.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn vitest run tests/unit/heading-lint.test.ts`

Expected: PASS — 11 passed.

- [ ] **Step 5: Commit**

```bash
git add app/utils/markdown/heading-lint.ts tests/unit/heading-lint.test.ts
git commit -m "feat: add heading hierarchy linter for Strapi-published markdown"
```

---

### Task 2: Fix the bundled tutorial's h1 and guard it with a test

**Files:**
- Modify: `app/utils/default-content.ts:14`
- Modify: `tests/unit/heading-lint.test.ts` (append a describe block)

**Interfaces:**
- Consumes: `lintHeadings` from Task 1; `DEFAULT_CONTENT` from `~/utils/default-content` (existing named export).
- Produces: nothing new.

The tutorial opens with `# Welcome to the ICJIA Markdown Editor 2.0`, which is a `no-h1` error. Every new user would load the app to "1 issue". Promoting only that line makes the whole 396-line document lint clean: "Welcome" becomes a sibling of the other top-level sections, which is correct when the page title is their shared h1 parent. Do **not** demote the rest of the tree.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/heading-lint.test.ts`:

```ts
import { DEFAULT_CONTENT } from '~/utils/default-content'

describe('DEFAULT_CONTENT', () => {
  it('lints clean, so new users never load the app to a heading issue', () => {
    expect(lintHeadings(DEFAULT_CONTENT)).toEqual([])
  })

  it('opens at h2, because Strapi supplies the h1 page title', () => {
    expect(DEFAULT_CONTENT.startsWith('## ')).toBe(true)
  })
})
```

Move the `DEFAULT_CONTENT` import up to sit beside the existing imports at the top of the file.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn vitest run tests/unit/heading-lint.test.ts`

Expected: FAIL — the first new test reports one `no-h1` issue at line 1; the second reports `false`.

- [ ] **Step 3: Fix the tutorial content**

In `app/utils/default-content.ts`, change line 14 from:

```ts
export const DEFAULT_CONTENT = `# Welcome to the ICJIA Markdown Editor 2.0
```

to:

```ts
export const DEFAULT_CONTENT = `## Welcome to the ICJIA Markdown Editor 2.0
```

Change nothing else in the file. The tutorial's heading *examples* live in inline code and never parse as headings, so they are unaffected.

- [ ] **Step 4: Run the full unit suite to verify it passes**

Run: `yarn test:run`

Expected: PASS — all suites green, including the existing `text-stats`, `markdown-config`, `export-template`, and `table-builder` tests.

- [ ] **Step 5: Commit**

```bash
git add app/utils/default-content.ts tests/unit/heading-lint.test.ts
git commit -m "fix: open tutorial at h2 so it satisfies the heading linter"
```

---

### Task 3: Expose issues from the composables

**Files:**
- Modify: `app/composables/useMarkdown.ts`
- Modify: `app/composables/useEditor.ts`

**Interfaces:**
- Consumes: `lintHeadings`, `HeadingIssue` from Task 1.
- Produces:
  - `useMarkdown()` gains `headingIssues: ComputedRef<HeadingIssue[]>` and `issueCount: ComputedRef<number>`.
  - `useEditor()` gains `goToLine(line: number): boolean`.

  Task 4 consumes all three.

`useMarkdown` already owns `debouncedContent` (`refDebounced(content, 150)`), which backs `renderedHtml` and `wordCount`. Linting reuses it: no new timers, and the issue list is always in step with the rendered preview.

`goToLine` belongs in `useEditor` because that module owns the raw, non-readonly `editorView` ref. Reaching into the readonly ref from a component would require an unsafe cast.

- [ ] **Step 1: Add `goToLine` to `useEditor.ts`**

Insert this function immediately after `insertHorizontalRule()` (around line 560), before `undo()`:

```ts
  /**
   * Moves the cursor to the start of the given line and scrolls it into view.
   * Line numbers are 1-based and clamped to the document, so a stale line
   * number from a linter cannot throw.
   *
   * @param {number} line - The 1-based line number to jump to
   * @returns {boolean} True if successful, false if editor view is not available
   */
  function goToLine(line: number): boolean {
    if (!editorView.value) return false

    const view = editorView.value
    const clamped = Math.min(Math.max(line, 1), view.state.doc.lines)
    const pos = view.state.doc.line(clamped).from

    view.dispatch({
      selection: { anchor: pos },
      scrollIntoView: true,
    })

    view.focus()
    return true
  }
```

Then add `goToLine,` to the returned object, immediately after `insertHorizontalRule,` in the `// Editor actions` group.

Also add this line to the JSDoc `@returns` block at the top of `useEditor`, after the `insertHorizontalRule` line:

```ts
 * @returns {Function} returns.goToLine - Move the cursor to a 1-based line number
```

- [ ] **Step 2: Add the computeds to `useMarkdown.ts`**

Add to the imports at the top:

```ts
import { lintHeadings } from '~/utils/markdown/heading-lint'
```

Insert after the `wordCountDisplay` computed (around line 82), before the `return`:

```ts
  /**
   * Heading hierarchy issues for the current document.
   * Computed from the debounced content, so large documents are not
   * re-linted on every keystroke.
   */
  const headingIssues = computed(() => lintHeadings(debouncedContent.value))

  /** Number of heading issues; 0 when the document is clean. */
  const issueCount = computed(() => headingIssues.value.length)
```

Add both to the returned object, after `wordCountDisplay,`:

```ts
    headingIssues,
    issueCount,
```

Also extend the module JSDoc `@requires` list with:

```ts
 * @requires ~/utils/markdown/heading-lint
```

- [ ] **Step 3: Verify types compile**

Run: `yarn typecheck`

Expected: PASS — no errors. (If `.nuxt/types` are stale, run `yarn nuke` first.)

- [ ] **Step 4: Verify the existing suite still passes**

Run: `yarn test:run`

Expected: PASS — no regressions.

- [ ] **Step 5: Commit**

```bash
git add app/composables/useMarkdown.ts app/composables/useEditor.ts
git commit -m "feat: expose heading issues and goToLine from composables"
```

---

### Task 4: Status-bar trigger and issues panel

**Files:**
- Create: `app/components/editor/HeadingIssuesPanel.vue`
- Modify: `app/components/editor/EditorLayout.vue` (template around lines 194-204, plus CSS)

**Interfaces:**
- Consumes: `useMarkdown().headingIssues`, `useMarkdown().issueCount`, `useEditor().goToLine`, `useAccessibility().announce` (existing).
- Produces: the `<HeadingIssuesPanel />` component (auto-imported by Nuxt from `app/components/editor/`).

**The live-region constraint.** `EditorLayout.vue:195` currently sets `role="status"` on the whole `.status-bar`, which implies `aria-live="polite"`. Anything that changes inside it is announced. Today only the word count changes, so this step narrows `role="status"` onto `.status-left` — behavior-preserving, since the buttons in `.status-right` are static — and then adds the issues trigger to `.status-right`, outside the live region.

- [ ] **Step 1: Create the component**

Create `app/components/editor/HeadingIssuesPanel.vue`:

```vue
<script setup lang="ts">
/**
 * Heading Issues Panel
 * Status-bar trigger showing the heading-issue count, expanding into a list
 * of issues. Activating an issue moves the editor cursor to its line.
 *
 * Deliberately rendered outside the status bar's aria-live region: the count
 * changes on every debounce tick, which would otherwise be announced while
 * the user is still typing.
 */

const { headingIssues, issueCount } = useMarkdown()
const { goToLine } = useEditor()
const { announce } = useAccessibility()

const PANEL_ID = 'heading-issues-panel'

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)

/** Visible label; also the accessible name (WCAG 2.5.3 — casing must match). */
const summary = computed(() => {
  const n = issueCount.value
  if (n === 0) return 'No heading issues'
  return `${n} heading ${n === 1 ? 'issue' : 'issues'}`
})

onClickOutside(root, () => {
  isOpen.value = false
})

function toggle() {
  isOpen.value = !isOpen.value
  // Announce on demand rather than on every content change.
  if (isOpen.value) announce(summary.value)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  triggerEl.value?.focus()
}

function handleIssueClick(line: number) {
  goToLine(line)
  isOpen.value = false
}
</script>

<template>
  <div ref="root" class="heading-issues" @keydown.escape="close">
    <button
      ref="triggerEl"
      type="button"
      class="issues-button"
      :class="{ 'issues-button--flagged': issueCount > 0 }"
      :aria-expanded="isOpen"
      :aria-controls="PANEL_ID"
      data-tour="heading-issues"
      @click="toggle"
    >
      <UIcon
        :name="issueCount > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
        class="issues-icon"
      />
      <span class="issues-text">{{ summary }}</span>
    </button>

    <div v-show="isOpen" :id="PANEL_ID" class="issues-panel">
      <p v-if="issueCount === 0" class="issues-empty">
        No heading issues. Headings start at H2 and never skip a level.
      </p>
      <ul v-else class="issues-list">
        <li v-for="issue in headingIssues" :key="`${issue.line}-${issue.rule}`">
          <button
            type="button"
            class="issue-item"
            @click="handleIssueClick(issue.line)"
          >
            <UIcon
              :name="issue.severity === 'error' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-exclamation-circle'"
              class="issue-icon"
              :class="`issue-icon--${issue.severity}`"
            />
            <span class="issue-line">Line {{ issue.line }}</span>
            <span class="issue-message">{{ issue.message }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.heading-issues {
  position: relative;
  display: inline-flex;
}

.issues-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.issues-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.issues-button:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

/* Icon plus text, never color alone (WCAG 1.4.1). */
.issues-button--flagged {
  color: #fca5a5;
}

.issues-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.issues-panel {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  right: 0;
  z-index: 30;
  width: min(28rem, calc(100vw - 2rem));
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.5rem;
  text-align: left;
  background: var(--color-surface, #1e293b);
  border: 1px solid var(--color-border, #334155);
  border-radius: 0.375rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.issues-empty {
  margin: 0;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #cbd5e1;
}

.issues-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: baseline;
  gap: 0.5rem;
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: #e2e8f0;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.issue-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.issue-item:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: -2px;
}

.issue-icon {
  width: 0.875rem;
  height: 0.875rem;
  align-self: center;
}

.issue-icon--error {
  color: #fca5a5;
}

.issue-icon--warning {
  color: #fcd34d;
}

.issue-line {
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
  white-space: nowrap;
}

/* Light mode */
:root:not(.dark) .issues-button,
.light .issues-button {
  color: #1e293b;
}

:root:not(.dark) .issues-button--flagged,
.light .issues-button--flagged {
  color: #b91c1c;
}

:root:not(.dark) .issues-button:hover,
.light .issues-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

:root:not(.dark) .issues-empty,
.light .issues-empty {
  color: #475569;
}

:root:not(.dark) .issue-item,
.light .issue-item {
  color: #1e293b;
}

:root:not(.dark) .issue-item:hover,
.light .issue-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

:root:not(.dark) .issue-icon--error,
.light .issue-icon--error {
  color: #b91c1c;
}

:root:not(.dark) .issue-icon--warning,
.light .issue-icon--warning {
  color: #92400e;
}

:root:not(.dark) .issue-line,
.light .issue-line {
  color: #475569;
}

/*
 * Collapse the label to icon-only on narrow screens, matching the sibling
 * status-bar buttons. Clipped rather than `display: none`: the latter drops
 * the text from the accessibility tree, leaving the button with no accessible
 * name (axe `button-name`, WCAG 4.1.2 Level A) because its only other child is
 * an aria-hidden icon. Clipping keeps the accessible name identical to the
 * visible text, so no aria-label is needed to shadow it.
 */
@media (max-width: 480px) {
  .issues-text {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
```

- [ ] **Step 2: Move the live region and mount the panel**

In `app/components/editor/EditorLayout.vue`, replace lines 194-204:

```vue
    <!-- Status Bar -->
    <div class="status-bar" role="status" aria-label="Editor status">
      <div class="status-left" data-tour="word-count">
        <span class="word-count" :title="`${wordCount.lines} lines, ${wordCount.paragraphs} paragraphs`">
          {{ wordCountDisplay }}
        </span>
        <span class="reading-time" :title="`Estimated reading time at 200 words per minute`">
          {{ wordCount.readingTime }} min read
        </span>
      </div>
      <div class="status-right">
```

with:

```vue
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
```

- [ ] **Step 3: Run the app and exercise the panel by hand**

Run: `yarn dev`, then open http://localhost:3000

Verify, in order:
1. On first load (tutorial content) the status bar reads **"No heading issues"** with a check icon.
2. Change the tutorial's `## Quick Start Guide` to `#### Quick Start Guide`. Within ~150 ms the bar reads **"1 heading issue"** with a warning icon.
3. Click the button. The panel opens above the status bar and lists `Line N — Heading skips from h2 to h4. Use h3.`
4. Click the issue. The cursor jumps to that line, the line scrolls into view, and the editor takes focus.
5. Press `Tab` to the button, `Enter` to open, `Escape` to close. Focus returns to the button.
6. Click outside the panel. It closes.
7. Toggle dark/light mode. Text and icons remain legible in both.

- [ ] **Step 4: Verify types and lint**

Run: `yarn typecheck`

Expected: PASS — no errors.

Do **not** run `yarn lint`. It exits 127 repo-wide: `package.json` declares `"lint": "eslint ."`, but `eslint` is not a dependency and no eslint config exists. This predates the branch.

- [ ] **Step 5: Commit**

```bash
git add app/components/editor/HeadingIssuesPanel.vue app/components/editor/EditorLayout.vue
git commit -m "feat: surface heading issues in the status bar with a jump-to-line panel"
```

---

### Task 5: Accessibility verification and documentation

**Files:**
- Modify: `README.md` (Features list, and a new subsection under Development)
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Run the accessibility audit with the panel open**

Run: `yarn dev` in one terminal, then in another:

Run: `yarn test:a11y`

Expected: 0 violations. Note the caution recorded for this project: a fresh-profile audit sees the welcome modal, which makes the header inert and causes axe to skip it. If the audit reports header rules as skipped, re-run with `yarn test:a11y:review`.

Then verify the two rules this feature could plausibly break, with the panel expanded:
- `aria-expanded` / `aria-controls` resolve to a real element ID.
- The button's accessible name equals its visible text (WCAG 2.5.3).

- [ ] **Step 2: Verify contrast in both themes**

Use the `contrastcap` MCP server against http://localhost:3000 with the panel open.

Check these foreground/background pairs clear **4.5:1**:
- `.issues-button--flagged` `#fca5a5` on `--color-surface` `#1e293b` (dark)
- `.issues-button--flagged` `#b91c1c` on the light status bar (light)
- `.issue-icon--warning` `#fcd34d` on `#1e293b` (dark)
- `.issue-icon--warning` `#92400e` on light
- `.issue-line` `#94a3b8` on `#1e293b` (dark)

If any pair fails, darken or lighten only that token; do not remove the icon, which is what carries the meaning when color is unavailable.

- [ ] **Step 3: Update the README**

Add to the Features list in `README.md`, after the **Accessibility First** bullet:

```markdown
- **Heading Linter** - Flags headings that skip a level or start above H2, so published documents pass accessibility heading-order checks
```

Add a new subsection after the **Clearing caches** subsection:

```markdown
#### Heading hierarchy linting

Documents authored here are published through Strapi, which renders the page title
as the page's `<h1>`. The status bar therefore reports a heading issue when a document
contains its own `#`, opens at a level below `##`, skips a heading level, or leaves a
heading empty. Click the count to list the issues and jump to the offending line.

Because the linter parses with the same `markdown-it` instance that renders the
preview and the HTML export, it always agrees with the published output.

**Limitation:** raw HTML headings (`<h3>Section</h3>`) are not checked. markdown-it
runs with `html: true`, so those are opaque HTML blocks rather than heading tokens.
Use markdown headings if you want them linted.
```

- [ ] **Step 4: Update the CHANGELOG**

Add a new entry at the top of `CHANGELOG.md`, matching the existing format and bumping the minor version:

```markdown
## [1.7.0] - 2026-07-09

### Added

- **Heading hierarchy linter** — the status bar now reports headings that skip a level, sit at `#` (reserved for Strapi's page title), or are empty. Click the count to list issues and jump to the offending line. Parsing reuses the preview's `markdown-it` instance, so the linter never disagrees with the rendered output. Raw HTML headings are not checked.

### Changed

- The bundled markdown tutorial now opens at `##` rather than `#`, so it models the structure Strapi expects and lints clean on first load.
- `role="status"` is now scoped to the status bar's left group rather than the whole bar, so the heading-issue count is not announced on every keystroke.
```

- [ ] **Step 5: Run the full verification suite and commit**

```bash
yarn test:run && yarn typecheck
```

Expected: all PASS.

```bash
git add README.md CHANGELOG.md
git commit -m "docs: document the heading linter and its raw-HTML limitation"
```

---

## Verification Checklist

Before considering this done, confirm each with actual command output — not assumption:

- [ ] `yarn test:run` — all unit suites pass, including the 13 `heading-lint` tests
- [ ] `yarn typecheck` — no TypeScript errors
- [ ] ~~`yarn lint`~~ — skip; broken repo-wide before this branch (eslint not installed, no config)
- [ ] `yarn test:a11y` — 0 axe violations
- [ ] `lintHeadings(DEFAULT_CONTENT)` returns `[]` — the shipped tutorial cannot regress
- [ ] Manual: issue count updates as you type, click jumps to the line, Escape restores focus
- [ ] Manual: the issue count is *not* announced by a screen reader while typing
- [ ] `git log --oneline` — five commits, none carrying an AI co-author trailer
