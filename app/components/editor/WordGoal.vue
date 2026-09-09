<script setup lang="ts">
/**
 * Word Goal
 * The status bar's word count, which doubles as the control for setting a
 * target. With no goal it reads exactly as it always did; with one it shows
 * progress towards it.
 *
 * Like its siblings in the status bar this is not a live region. The count
 * changes on every debounce tick, and announcing it would talk over the author
 * as they write. The progress bar carries `aria-hidden` because the same
 * numbers are already in the button's text.
 */

const { wordCount, wordCountDisplay } = useMarkdown()
const { goal, progress, setGoal, clearGoal } = useWordGoal()
const { announce } = useAccessibility()

const PANEL_ID = 'word-goal-panel'
const INPUT_ID = 'word-goal-input'
const ERROR_ID = 'word-goal-error'

const isOpen = ref(false)
const draft = ref('')
const invalid = ref(false)
const root = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

/** Visible label; also the accessible name (WCAG 2.5.3 — casing must match). */
const summary = computed(() => {
  if (!progress.value) return wordCountDisplay.value
  const words = wordCount.value.words.toLocaleString()
  const target = goal.value!.toLocaleString()
  return progress.value.met
    ? `${words} of ${target} words, goal met`
    : `${words} of ${target} words, ${progress.value.percent}%`
})

onClickOutside(root, () => {
  isOpen.value = false
})

function toggle() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) return

  invalid.value = false
  draft.value = goal.value === null ? '' : String(goal.value)
  nextTick(() => {
    inputEl.value?.focus()
    inputEl.value?.select()
  })
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  triggerEl.value?.focus()
}

function confirm() {
  if (setGoal(draft.value)) {
    invalid.value = false
    announce(`Word goal set to ${goal.value!.toLocaleString()} words`)
    close()
  } else {
    invalid.value = true
    inputEl.value?.focus()
  }
}

function remove() {
  clearGoal()
  announce('Word goal cleared')
  close()
}
</script>

<template>
  <div ref="root" class="word-goal" @keydown.escape="close">
    <button
      ref="triggerEl"
      type="button"
      class="goal-button"
      :class="{ 'goal-button--met': progress?.met }"
      :aria-expanded="isOpen"
      :aria-controls="PANEL_ID"
      :title="wordCount.lines + ' lines, ' + wordCount.paragraphs + ' paragraphs'"
      data-tour="word-count"
      @click="toggle"
    >
      <UIcon v-if="progress?.met" name="i-heroicons-check-circle" class="goal-icon" />
      <span class="goal-text">{{ summary }}</span>
      <span
        v-if="progress"
        class="goal-track"
        aria-hidden="true"
      >
        <span class="goal-fill" :style="{ inlineSize: `${progress.percent}%` }" />
      </span>
    </button>

    <div v-show="isOpen" :id="PANEL_ID" class="goal-panel">
      <label class="goal-label" :for="INPUT_ID">Word goal</label>
      <div class="goal-row">
        <input
          :id="INPUT_ID"
          ref="inputEl"
          v-model="draft"
          class="goal-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="1,500"
          :aria-invalid="invalid"
          :aria-describedby="invalid ? ERROR_ID : undefined"
          @keydown.enter.prevent="confirm"
        >
        <button type="button" class="goal-action goal-action--primary" @click="confirm">
          Set
        </button>
        <button
          v-if="goal !== null"
          type="button"
          class="goal-action"
          @click="remove"
        >
          Clear
        </button>
      </div>
      <p v-if="invalid" :id="ERROR_ID" class="goal-error">
        Enter a whole number of words, such as 1,500.
      </p>
      <p v-else-if="progress && !progress.met" class="goal-hint">
        {{ progress.remaining.toLocaleString() }} to go.
      </p>
    </div>
  </div>
</template>

<style scoped>
.word-goal {
  position: relative;
  display: inline-flex;
}

.goal-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #e2e8f0;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.goal-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.goal-button:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

/* Icon and wording carry "met" as well as colour (WCAG 1.4.1). */
.goal-button--met {
  color: #86efac;
}

.goal-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.goal-track {
  display: inline-block;
  inline-size: 3.5rem;
  block-size: 0.375rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}

.goal-fill {
  display: block;
  block-size: 100%;
  background: var(--color-primary, #3b82f6);
  border-radius: inherit;
  transition: inline-size 0.3s ease;
}

.goal-button--met .goal-fill {
  background: #22c55e;
}

.goal-panel {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  z-index: 30;
  width: max-content;
  min-width: 15rem;
  padding: 0.75rem;
  text-align: left;
  background: var(--color-surface, #1e293b);
  border: 1px solid var(--color-border, #334155);
  border-radius: 0.375rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.goal-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
}

.goal-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.goal-input {
  inline-size: 6rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  color: #f1f5f9;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--color-border, #334155);
  border-radius: 0.25rem;
}

.goal-input:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 1px;
}

.goal-action {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.goal-action:hover {
  background: rgba(255, 255, 255, 0.16);
}

.goal-action:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.goal-action--primary {
  color: #0b1220;
  background: #93c5fd;
}

.goal-action--primary:hover {
  background: #bfdbfe;
}

.goal-error,
.goal-hint {
  margin: 0.5rem 0 0;
  font-size: 0.6875rem;
}

.goal-error {
  color: #fca5a5;
}

.goal-hint {
  color: #cbd5e1;
}

/* Light mode */
:root:not(.dark) .goal-button,
.light .goal-button {
  color: #1e293b;
}

:root:not(.dark) .goal-button--met,
.light .goal-button--met {
  color: #15803d;
}

:root:not(.dark) .goal-button:hover,
.light .goal-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

:root:not(.dark) .goal-track,
.light .goal-track {
  background: rgba(0, 0, 0, 0.14);
}

:root:not(.dark) .goal-label,
.light .goal-label {
  color: #1e293b;
}

:root:not(.dark) .goal-input,
.light .goal-input {
  color: #1e293b;
  background: #ffffff;
}

:root:not(.dark) .goal-action,
.light .goal-action {
  color: #1e293b;
  background: rgba(0, 0, 0, 0.06);
}

:root:not(.dark) .goal-action:hover,
.light .goal-action:hover {
  background: rgba(0, 0, 0, 0.12);
}

:root:not(.dark) .goal-action--primary,
.light .goal-action--primary {
  color: #ffffff;
  background: #1e40af; /* white on this is 8.7:1 */
}

:root:not(.dark) .goal-action--primary:hover,
.light .goal-action--primary:hover {
  background: #1e3a8a;
}

:root:not(.dark) .goal-error,
.light .goal-error {
  color: #991b1b; /* 7.9:1 on the light panel */
}

:root:not(.dark) .goal-hint,
.light .goal-hint {
  color: #475569;
}
</style>
