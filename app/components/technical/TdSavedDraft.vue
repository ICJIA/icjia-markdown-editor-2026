<script setup lang="ts">
/**
 * Technical Details: shows the visitor what this browser is holding for them.
 *
 * Read-only. It looks at the same storage record the editor's auto-save writes
 * and reports its size and age; it never changes or removes it.
 */
import { parseSavedRecord } from '~/utils/autosave'
import { computeWordCount } from '~/utils/markdown/text-stats'

const STORAGE_KEY = 'icjia-markdown-editor-autosave'

type Draft = { state: 'checking' } | { state: 'none' } | { state: 'blocked' }
  | { state: 'found', words: number, kilobytes: string, saved: string }

const draft = ref<Draft>({ state: 'checking' })

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const record = parseSavedRecord(raw)
    if (!raw || !record || !record.content.trim()) {
      draft.value = { state: 'none' }
      return
    }
    draft.value = {
      state: 'found',
      words: computeWordCount(record.content).words,
      kilobytes: (new Blob([raw]).size / 1024).toFixed(1),
      saved: new Date(record.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    }
  } catch {
    draft.value = { state: 'blocked' }
  }
})
</script>

<template>
  <div class="td-draft">
    <p class="td-pane-label">On this device, right now</p>
    <p v-if="draft.state === 'checking'" class="td-draft-line">Checking this browser’s storage…</p>
    <p v-else-if="draft.state === 'none'" class="td-draft-line">
      This browser is not holding a draft. Nothing has been saved here yet.
    </p>
    <p v-else-if="draft.state === 'blocked'" class="td-draft-line">
      This browser has storage switched off, so the editor cannot keep a draft here. Download your
      work before closing the tab.
    </p>
    <template v-else>
      <p class="td-draft-line">
        This browser is holding one draft of
        <strong>{{ draft.words.toLocaleString() }} words</strong> ({{ draft.kilobytes }} KB), last saved
        {{ draft.saved }}.
      </p>
      <p class="td-draft-note">
        It exists in this browser on this computer and nowhere else. This page read it to count the
        words; it was not sent anywhere.
      </p>
    </template>
  </div>
</template>
