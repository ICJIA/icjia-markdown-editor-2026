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

@media (max-width: 640px) {
  .issues-text {
    display: none;
  }
}
</style>
