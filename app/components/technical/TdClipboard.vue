<script setup lang="ts">
/**
 * Technical Details: what lands in a website when you paste from a word
 * processor, beside what the editor's Copy HTML produces for the same sentence.
 */
const WORD = `<p class=MsoNormal style='margin-top:0in;margin-right:0in;
margin-bottom:8.0pt;margin-left:0in;line-height:107%;
font-size:11.0pt;font-family:"Calibri",sans-serif;
mso-ascii-theme-font:minor-latin;mso-fareast-font-family:
Calibri;mso-bidi-font-family:"Times New Roman"'><b
style='mso-bidi-font-weight:normal'><span style='font-size:
16.0pt;line-height:107%;font-family:"Calibri Light",sans-serif;
color:#2F5496;mso-themecolor:accent1;mso-themeshade:191'>
Key findings<o:p></o:p></span></b></p>
<p class=MsoNormal style='margin-bottom:8.0pt;line-height:
107%'><span style='font-size:11.0pt;font-family:"Calibri",
sans-serif'>Arrests fell <b style='mso-bidi-font-weight:
normal'>12%</b> in 2025.<o:p></o:p></span></p>`

const EDITOR = `<h2>Key findings</h2>
<p>Arrests fell <strong>12%</strong> in 2025.</p>`

const view = ref<'word' | 'editor'>('word')
const shown = computed(() => (view.value === 'word' ? WORD : EDITOR))
</script>

<template>
  <div class="td-clip">
    <div class="td-clip-switch" role="group" aria-label="Choose a source">
      <button type="button" class="td-btn" :aria-pressed="view === 'word'" @click="view = 'word'">
        Pasted from a word processor
      </button>
      <button type="button" class="td-btn" :aria-pressed="view === 'editor'" @click="view = 'editor'">
        Copied from this editor
      </button>
    </div>
    <pre class="td-code td-clip-code" tabindex="0" role="group" aria-label="The code that arrives in the website"><code>{{ shown }}</code></pre>
    <p class="td-clip-note" aria-live="polite">
      <template v-if="view === 'word'">
        <strong>{{ WORD.length }} characters</strong> to say eight words. The heading is not a heading at
        all: it is a paragraph made to look large, so a screen reader cannot find it and the website’s
        own design is overridden by fonts and colours carried in from the document.
      </template>
      <template v-else>
        <strong>{{ EDITOR.length }} characters</strong>. A real heading and a real paragraph, with no fonts,
        sizes or colours attached, so the website’s own design applies and assistive technology can
        navigate it.
      </template>
    </p>
    <p class="td-fineprint">
      The first sample is representative of the markup a word processor places on the clipboard; the
      exact output varies by version.
    </p>
  </div>
</template>
