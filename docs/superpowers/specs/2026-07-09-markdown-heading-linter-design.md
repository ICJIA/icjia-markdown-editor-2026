# Markdown Heading Hierarchy Linter — Design

**Date:** 2026-07-09
**Status:** Approved, ready for implementation planning

## Problem

ICJIA researchers author markdown in this editor and publish it through a Strapi 5 CMS.
Strapi renders the page title as the page's `<h1>`. The authored markdown is injected
beneath that title.

Consequently a document that looks self-consistent in isolation can still produce an
invalid heading sequence in the published page. A document opening with `###` skips
from the page's h1 straight to h3. A document containing its own `#` competes with the
page title. Accessibility checkers (axe-core `heading-order`, and SiteImprove's
equivalents) flag both.

Authors have no way to see this before publishing. The editor should tell them.

## Goals

Warn the author, while they write, when the markdown source would produce an improper
heading hierarchy once rendered beneath Strapi's page title.

## Non-Goals

These are deliberately excluded. Each was considered and rejected.

- **Rule configuration.** The Strapi virtual-h1 model is hardcoded. Every document this
  editor produces targets Strapi. A toggle would be speculative.
- **Raw HTML heading detection.** See "Accepted limitation" below.
- **Autofix.** The linter reports; the author fixes.
- **CodeMirror gutter markers / squiggles.** Would require promoting `@codemirror/lint`
  (36 KB of unminified ESM, currently a lazy-loaded transitive dependency of
  `@codemirror/lang-javascript`) into the main chunk. Rejected: v1.6.0 was a deliberate
  bundle slim-down, and the status-bar panel covers the need at zero bundle cost.
- **Any non-heading lint rule.** No line length, no list-marker style, no link checking.

## Rule model: the virtual h1

The linter seeds its traversal with `prevLevel = 1`, representing the `<h1>` that Strapi
supplies. It then walks the document's headings in order.

| Rule | Severity | Fires when |
| --- | --- | --- |
| `no-h1` | Error | Any `#` (h1) heading appears in the document |
| `heading-order` | Error | A heading's level exceeds `prevLevel + 1` |
| `empty-heading` | Warning | A heading has no text content |

Consequences of the virtual h1, stated explicitly so they are not re-litigated:

- A document **must open with `##`**. Opening with `###` is a `heading-order` error,
  because in the rendered page it skips h2.
- A document must contain **no `#` at all**. The `no-h1` message names the offending
  text and suggests the `##` form.
- After emitting `no-h1`, the traversal sets `prevLevel = 1` and continues, so a
  document written as `# Title` / `## Sub` reports exactly one issue, not two. A
  document written as `# Title` / `### Sub` correctly reports two: the `no-h1`, and the
  h1-to-h3 skip beneath it.
- Descending more than one level at a time is an error; *ascending* any distance is
  fine (`h4` back to `h2` closes two sections and is valid).
- `no-h1` takes precedence over `empty-heading`. A bare `#` reports `no-h1` only, since
  fixing the level is the prerequisite for anything else.

### Source of truth

The linter parses with the **same `markdown-it` singleton that renders the preview and
the HTML export** (`getMarkdownIt()` in `app/utils/markdown/config.ts`). This is the
central correctness property: the linter cannot disagree with what a reader — or an
accessibility checker — eventually sees, because the same parser produced both.

Reusing the parser also resolves two cases that defeat a regex-based linter. Both were
verified empirically against this codebase's configuration:

| Input | Naive `^#{1,6}\s` regex | markdown-it tokens |
| --- | --- | --- |
| `#` inside a fenced code block | false positive | correctly ignored |
| Text followed by a `---` underline | missed (reads as `<hr>`) | correctly parsed as setext `h2` |

The setext case matters concretely here: the toolbar's `insertHorizontalRule()`
(`app/composables/useEditor.ts:558`) inserts `---`, so documents from this editor are
full of the token that a regex linter would confuse with a setext underline.

Heading tokens carry `map[0]` (a 0-based source line), which maps to a 1-based editor
line as `map[0] + 1`.

### Accepted limitation

`markdown-it` is configured with `html: true` (`app/utils/markdown/config.ts:92`). A
literal `<h4>Section</h4>` in the source therefore arrives as an `html_block` token, not
a heading token, and is invisible to this linter. This is the one place where "the
linter agrees with the output" does not hold.

This is accepted rather than half-solved. Detecting HTML headings by regex over
`html_block` content would reintroduce exactly the class of false positives the
token-based approach was chosen to eliminate. The limitation is documented in the README
so authors who hand-write HTML headings know the linter does not cover them.

## Architecture

Three units, each independently understandable and testable.

### `app/utils/markdown/heading-lint.ts` (new)

```ts
export interface HeadingIssue {
  line: number                                          // 1-based editor line
  rule: 'no-h1' | 'heading-order' | 'empty-heading'
  severity: 'error' | 'warning'
  message: string                                       // author-facing, actionable
}

export function lintHeadings(markdown: string): HeadingIssue[]
```

A pure function. No DOM, no component state, no reactivity. It calls `getMarkdownIt()`,
walks `heading_open` tokens, and returns issues in source order. It mirrors the shape of
the existing `app/utils/markdown/text-stats.ts`, which is what makes it trivial to test.

Messages are written for a researcher, not a linter author. `Skips from h2 to h4. Use
h3.` — not `heading-order violation`.

### `app/composables/useMarkdown.ts` (edit)

Add two computeds beside the existing `wordCount`:

```ts
const headingIssues = computed(() => lintHeadings(debouncedContent.value))
const issueCount    = computed(() => headingIssues.value.length)
```

`debouncedContent` (a `refDebounced(content, 150)`, `useMarkdown.ts:47`) already exists
and already backs `renderedHtml` and `wordCount`. Linting reuses it: no new timers, no
new watchers, and the lint result is always in step with the rendered preview.

`useMarkdown` is the module for derived views of the document. Heading issues are a
derived view of the document. This is the right home.

### `app/components/editor/HeadingIssuesPanel.vue` (new)

The status-bar trigger and its expandable list. Reads `headingIssues` from
`useMarkdown()`, and `editorView` from `useEditor()` in order to move the cursor.

Activating an issue dispatches a CodeMirror selection to the start of that line, scrolls
it into view, and focuses the editor.

## Accessibility

The status bar (`EditorLayout.vue:195`) carries `role="status"`, which implies
`aria-live="polite"`. Anything that changes inside it is announced.

- **The issue count must not sit inside that live region.** Render the trigger outside
  `.status-bar`'s live region, or scope it with `aria-live="off"`. Otherwise a screen
  reader narrates the issue count on every 150 ms debounce tick while the user types.
- The trigger is a real `<button>` with `aria-expanded` and `aria-controls`.
- Each issue in the list is a button. Activating it moves the cursor and returns focus
  to the editor.
- Status is never conveyed by color alone (WCAG 1.4.1): each issue carries a `⚠` glyph
  and text. The warning color must clear 4.5:1 against its background in both light and
  dark themes; verify with `contrastcap`.
- The accessible name must match the visible label's casing (WCAG 2.5.3) — the same
  constraint that produced the v1.6.1 tutorial-button fix.
- An explicit empty state ("No heading issues"), not a silently absent control.

## Bundled tutorial content

`DEFAULT_CONTENT` (`app/utils/default-content.ts:14`) currently opens with
`# Welcome to the ICJIA Markdown Editor 2.0`. Under the virtual-h1 model that is a
`no-h1` error, so every new user would load the app to an immediate "⚠ 1 issue".

**Fix: change that one line's `# ` to `## `.** Nothing else moves.

Verified against the real content: the tutorial's remaining headings are 7 `h2` and 16
`h3`, and its heading *examples* live in inline code, so they never parse as headings —
a side benefit of the `SIA-R79` workaround noted at `default-content.ts:11`. Promoting
only line 14 yields 8 `h2` and 16 `h3` and lints clean. "Welcome" becomes a sibling of
the other top-level sections, which is correct when the page title is their shared h1
parent.

Demoting the entire tree by one level (`h2`/`h3`/`h4`) also lints clean but nests one
level deeper for no benefit. Rejected.

## Testing

`tests/unit/heading-lint.test.ts`, following `tests/unit/text-stats.test.ts`. Vitest
runs under jsdom, so the util may reuse the real `markdown-it` singleton.

Cases, all verified against a working prototype:

| Case | Expected |
| --- | --- |
| `### Deep` | `heading-order` at line 1 |
| `## A` / `### B` | clean |
| `## A` / `#### D` | `heading-order` at line 3 |
| `##` (no text) | `empty-heading` at line 1 |
| `# Title` / `## Sub` | `no-h1` at line 1, and nothing else |
| setext `Title` / `-----` then `#### D` | `heading-order` at line 4 |
| `#` inside a ` ```bash ` fence | clean |
| `## A` / `### B` / `#### C` / `## D` | clean |

Plus one regression guard:

```ts
expect(lintHeadings(DEFAULT_CONTENT)).toEqual([])
```

This permanently prevents the shipped tutorial from reintroducing an h1 — the exact
defect this feature uncovered.

## Files

| File | Change |
| --- | --- |
| `app/utils/markdown/heading-lint.ts` | new — pure rule engine |
| `tests/unit/heading-lint.test.ts` | new — 8 cases plus tutorial regression guard |
| `app/components/editor/HeadingIssuesPanel.vue` | new — trigger button and issue list |
| `app/composables/useMarkdown.ts` | add `headingIssues`, `issueCount` |
| `app/components/editor/EditorLayout.vue` | mount panel outside the `role="status"` live region |
| `app/utils/default-content.ts` | line 14: `# ` to `## ` |
| `README.md`, `CHANGELOG.md` | document the feature and the raw-HTML limitation |

No new runtime dependency. No change to bundle size.

## Risks

**The Strapi assumption is load-bearing.** If these documents are ever published somewhere
that does not supply an `<h1>`, `no-h1` becomes wrong and the "must start at `##`" rule
becomes wrong with it. The rule model is confined to `heading-lint.ts`, so reversing the
assumption means changing the `prevLevel` seed and one rule — but it would be a real
change, not a config flip. Accepted knowingly.

**The raw-HTML gap is silent.** An author who writes `<h3>` gets no warning and no
indication the linter skipped it. Documented, not detected.
