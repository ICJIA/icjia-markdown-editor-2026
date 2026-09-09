<script setup lang="ts">
/**
 * Outline Panel
 * Status-bar trigger showing the document's heading count, expanding into the
 * outline. Activating a heading moves the editor cursor to its line.
 *
 * Mirrors HeadingIssuesPanel: same trigger shape, same popover mechanics, same
 * escape-and-restore-focus behaviour. It is likewise rendered outside any live
 * region — the heading count changes as the author types, and a status bar that
 * announces itself on every keystroke is unusable with a screen reader.
 */

import { activeOutlineIndex } from '~/utils/markdown/outline'

const { outline } = useMarkdown()
const { goToLine, cursorPosition } = useEditor()
const { announce } = useAccessibility()

const PANEL_ID = 'document-outline-panel'

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)

/** Visible label; also the accessible name (WCAG 2.5.3 — casing must match). */
const summary = computed(() => {
  const n = outline.value.length
  if (n === 0) return 'No headings'
  return `${n} ${n === 1 ? 'heading' : 'headings'}`
})

/** Which entry the cursor is inside, so the reader can see where they are. */
const activeIndex = computed(() => activeOutlineIndex(outline.value, cursorPosition.value.line))

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

function handleHeadingClick(line: number) {
  goToLine(line)
  isOpen.value = false
}
</script>

<template>
  <div ref="root" class="outline" @keydown.escape="close">
    <button
      ref="triggerEl"
      type="button"
      class="outline-button"
      :aria-expanded="isOpen"
      :aria-controls="PANEL_ID"
      data-tour="outline"
      @click="toggle"
    >
      <UIcon name="i-heroicons-list-bullet" class="outline-icon" />
      <span class="outline-text">{{ summary }}</span>
    </button>

    <div v-show="isOpen" :id="PANEL_ID" class="outline-panel">
      <p v-if="outline.length === 0" class="outline-empty">
        No headings yet. Add one to build an outline.
      </p>
      <ul v-else class="outline-list">
        <li v-for="(entry, index) in outline" :key="`${entry.line}-${index}`">
          <button
            type="button"
            class="outline-item"
            :class="{ 'outline-item--active': index === activeIndex }"
            :style="{ paddingInlineStart: `${0.5 + (entry.level - 1) * 0.75}rem` }"
            :aria-current="index === activeIndex ? 'true' : undefined"
            @click="handleHeadingClick(entry.line)"
          >
            <span class="outline-level">h{{ entry.level }}</span>
            <span class="outline-label">{{ entry.text }}</span>
            <span class="outline-line">{{ entry.line }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.outline {
  position: relative;
  display: inline-flex;
}

.outline-button {
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

.outline-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.outline-button:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.outline-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.outline-panel {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  right: 0;
  z-index: 30;
  width: min(28rem, calc(100vw - 2rem));
  max-height: 20rem;
  overflow-y: auto;
  padding: 0.5rem;
  text-align: left;
  background: var(--color-surface, #1e293b);
  border: 1px solid var(--color-border, #334155);
  border-radius: 0.375rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.outline-empty {
  margin: 0;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #cbd5e1;
}

.outline-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.outline-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 0.5rem;
  width: 100%;
  padding-block: 0.3125rem;
  padding-inline-end: 0.5rem;
  font-size: 0.75rem;
  color: #e2e8f0;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.outline-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.outline-item:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: -2px;
}

/*
 * The cursor's section is marked with a left rule and weight as well as a tint,
 * so it does not rely on colour alone (WCAG 1.4.1).
 */
.outline-item--active {
  font-weight: 700;
  background: rgba(59, 130, 246, 0.16);
  box-shadow: inset 2px 0 0 var(--color-primary, #3b82f6);
}

.outline-level {
  font-variant-numeric: tabular-nums;
  font-size: 0.625rem;
  font-weight: 600;
  color: #b8c4d2;
  text-transform: uppercase;
}

.outline-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-line {
  font-variant-numeric: tabular-nums;
  color: #b8c4d2;
  white-space: nowrap;
}

/* Light mode */
:root:not(.dark) .outline-button,
.light .outline-button {
  color: #1e293b;
}

:root:not(.dark) .outline-button:hover,
.light .outline-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

:root:not(.dark) .outline-empty,
.light .outline-empty {
  color: #475569;
}

:root:not(.dark) .outline-item,
.light .outline-item {
  color: #1e293b;
}

:root:not(.dark) .outline-item:hover,
.light .outline-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

:root:not(.dark) .outline-item--active,
.light .outline-item--active {
  background: rgba(37, 99, 235, 0.12);
}

:root:not(.dark) .outline-level,
.light .outline-level,
:root:not(.dark) .outline-line,
.light .outline-line {
  color: #475569;
}

/*
 * Collapse the label to icon-only on narrow screens, matching the sibling
 * status-bar buttons. Clipped rather than `display: none`: the latter drops the
 * text from the accessibility tree, leaving the button with no accessible name
 * (axe `button-name`, WCAG 4.1.2).
 */
@media (max-width: 480px) {
  .outline-text {
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
