<script setup lang="ts">
/**
 * Technical Details: the live demo in the page's opening.
 *
 * Runs the visitor's text through the same `renderMarkdown` the editor uses, so
 * what the page shows is the product working rather than a picture of it.
 */
import { renderMarkdown } from '~/utils/markdown/config'
import { computeWordCount } from '~/utils/markdown/text-stats'

// Headings start at `##` because the output is rendered inside this page, under
// its own <h1>; a sample opening with `#` would put a second top-level heading
// in the middle of the document outline.
const source = ref(`## Findings

Arrests fell **12%** between 2024 and 2025,
with the ==largest drop== in Cook County.

- Property offences: down 15%
- Violent offences: down 4%

| Year | Arrests |
| ---- | ------: |
| 2024 |  48,210 |
| 2025 |  42,425 |

The change is $\\Delta = -12\\%$.`)

// renderMarkdown returns '' on the server (the sanitizer needs a browser), so
// the output is produced after mount to keep the prerendered HTML and the
// hydrated page identical.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

const html = computed(() => (mounted.value ? renderMarkdown(source.value) : ''))
const stats = computed(() => computeWordCount(source.value))
</script>

<template>
  <div class="td-demo">
    <div class="td-demo-pane">
      <label class="td-pane-label" for="td-demo-source">You type this</label>
      <textarea
        id="td-demo-source"
        v-model="source"
        class="td-demo-source"
        spellcheck="false"
        rows="14"
      />
    </div>
    <div class="td-demo-pane">
      <p id="td-demo-output-label" class="td-pane-label">Readers get this</p>
      <!-- eslint-disable vue/no-v-html -- the return value of renderMarkdown(),
           which sanitizes with DOMPurify before returning. -->
      <div
        class="td-demo-output td-rendered"
        role="region"
        aria-labelledby="td-demo-output-label"
        tabindex="0"
        v-html="html"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
    <p class="td-demo-foot">
      {{ stats.words }} words, about {{ stats.readingTime }} minute to read. Change anything on the
      left: this is the editor’s own engine, running in your browser.
    </p>
  </div>
</template>
