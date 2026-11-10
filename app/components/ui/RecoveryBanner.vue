<script setup lang="ts">
/**
 * Recovery Banner
 *
 * Shown when the editor is opened as `/?recover`. In that mode the saved draft
 * is neither opened nor rendered and nothing is written to storage, so a draft
 * that stops the editor from working cannot stop the author from getting it
 * back. This banner is how they do that: download it, open it normally, or
 * delete it.
 *
 * The download writes the stored text straight to a file. It deliberately does
 * not go through the editor or the renderer, since those are what recovery mode
 * exists to avoid.
 */
import { computeWordCount } from '~/utils/markdown/text-stats'

const { isRecoveryMode, getSavedDraft, clear } = useAutoSave()
const { isContentReady } = useEditor()
const { announce } = useAccessibility()

// Read after the storage check has run; reading earlier would race it.
const draft = computed(() => (isContentReady.value && isRecoveryMode.value ? getSavedDraft() : null))

const summary = computed(() => {
  const record = draft.value
  if (!record) return ''
  const words = computeWordCount(record.content).words.toLocaleString()
  const bytes = new Blob([record.content]).size
  const size = bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`
  const saved = new Date(record.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return `${words} words, ${size}, last saved ${saved}`
})

function downloadDraft(): void {
  const record = draft.value
  if (!record) return
  const url = URL.createObjectURL(new Blob([record.content], { type: 'text/markdown;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'recovered-draft.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  announce('Downloaded recovered-draft.md')
}

/** Leaves recovery mode with a full page load, so the editor starts normally. */
function leave(): void {
  window.location.assign('/')
}

function deleteDraft(): void {
  if (!confirm('Delete the saved draft from this browser?\n\nThis cannot be undone. Download it first if you may want it.')) return
  clear()
  leave()
}
</script>

<template>
  <section v-if="isRecoveryMode" class="recovery" aria-labelledby="recovery-title">
    <UIcon name="i-heroicons-lifebuoy" class="recovery-icon" />
    <div class="recovery-text">
      <h2 id="recovery-title">Recovery mode</h2>
      <p v-if="draft">
        Your saved draft was not opened, and nothing is being saved while you are here. It is still in
        this browser: {{ summary }}.
      </p>
      <p v-else>
        There is no saved draft in this browser. Nothing is being saved while you are in recovery mode.
      </p>
    </div>
    <div class="recovery-actions">
      <button v-if="draft" type="button" class="recovery-btn recovery-btn--primary" @click="downloadDraft">
        Download the draft
      </button>
      <button type="button" class="recovery-btn" @click="leave">
        {{ draft ? 'Open it in the editor' : 'Open the editor' }}
      </button>
      <button v-if="draft" type="button" class="recovery-btn" @click="deleteDraft">
        Delete the draft
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Dark amber on both themes: the banner is a warning, and one fixed pairing is
   easier to keep at 7:1 than two. #fef3c7 on #451a03 is 13.9:1. */
.recovery {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  padding: 0.75rem 1rem;
  background: #451a03;
  color: #fef3c7;
  border-bottom: 2px solid #f59e0b;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.recovery-icon {
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
}

.recovery-text {
  flex: 1 1 24rem;
  min-width: 0;
}

.recovery-text h2 {
  font-size: 1rem;
  font-weight: 700;
}

.recovery-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.recovery-btn {
  min-height: 2.5rem;
  padding: 0.375rem 0.875rem;
  background: transparent;
  color: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.375rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.recovery-btn:hover {
  background: rgba(252, 211, 77, 0.15);
}

.recovery-btn--primary {
  background: #fcd34d;
  color: #451a03;
}

.recovery-btn--primary:hover {
  background: #fde68a;
}

.recovery-btn:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
</style>
