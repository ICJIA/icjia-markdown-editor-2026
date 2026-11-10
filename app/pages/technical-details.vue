<script setup lang="ts">
/**
 * Technical Details
 *
 * A plain-language account of how the editor works and why it exists, for
 * readers who do not write software. Every interactive panel runs the editor's
 * real code (the parser, the sanitizer, the heading linter, the auto-save
 * record) rather than a recording of it, so the page cannot drift from the
 * product it describes.
 *
 * The page is dark by design and does not follow the editor's light/dark
 * toggle: it defines its own palette on `.td` (see technical-details.css).
 */
import { version } from '~~/package.json'
import '~/assets/css/technical-details.css'

const title = 'How the ICJIA Markdown Editor works'
const description = 'A plain-language tour of what happens when you type, where your words are kept, how the editor is defended, and why plain text is a good way to write a report.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterTitle: title,
  twitterDescription: description,
})

// Numbers quoted on the page. Each is checked against the code or a test run at
// release time; the changelog entry for a release records the run.
const facts = [
  { figure: '0', label: 'servers that ever receive your text' },
  { figure: '300', label: 'automated tests run on every change, 38 of them in a real browser' },
  { figure: '0', label: 'accessibility violations at the strictest level, AAA' },
  { figure: '2 s', label: 'after you stop typing, your work is saved' },
  { figure: '18', label: 'programming languages colour-coded in code samples' },
  { figure: '10 MB', label: 'largest file you can open' },
]

const parts = [
  { name: 'CodeMirror', role: 'The box you type in. It handles the cursor, undo, find and replace, and colours the markdown marks as you write.' },
  { name: 'markdown-it', role: 'The parser. It reads your marks and writes the web code for headings, lists, tables and footnotes.' },
  { name: 'DOMPurify', role: 'The sanitizer. It removes anything from that web code that could act instead of simply being displayed.' },
  { name: 'KaTeX', role: 'Typesets mathematics, so an equation looks the way it does in a journal.' },
  { name: 'highlight.js', role: 'Colour-codes R, Stata, SAS, SQL, Python and other code samples.' },
  { name: 'Nuxt and Vue', role: 'Assemble all of the above into one page and build it into plain files a web host can serve.' },
  { name: 'Netlify', role: 'Hosts those files. It delivers the editor to your browser and then has no further part in what you write.' },
]

const findings = [
  { name: 'Screen-covering styles could be disguised', severity: 'Low', status: 'Fixed', detail: 'Two disguises got a full-screen panel past the filter. A second defence kept it inside the preview. The filter now works from a list of what is allowed.' },
  { name: 'Links to a named window kept a line back to the editor', severity: 'Medium', status: 'Fixed', detail: 'A page opened that way could redirect the editor’s tab. Every outgoing link is now cut off, and the site instructs browsers to enforce it.' },
  { name: 'Styling could call out to the internet', severity: 'Low', status: 'Fixed', detail: 'A hidden request could report that a document was opened. Styling can no longer fetch anything.' },
  { name: 'Sound and video elements were accepted', severity: 'Low', status: 'Fixed', detail: 'The live site already refused to load them; exported files did not. They are now removed from documents.' },
  { name: 'The site’s own script rule was looser than it needed to be', severity: 'Low', status: 'Fixed', detail: 'It allowed any script written into the page. Since 1.11.0 it allows only the exact scripts the editor ships with, so a smuggled one is refused by the browser even if the filter misses it.' },
  { name: 'Exported files carried no protection of their own', severity: 'Low', status: 'Fixed', detail: 'A file opened from a disk has no website to protect it. Each export now carries its own rule forbidding scripts.' },
  { name: 'The parser could be made to stall', severity: 'Medium', status: 'Fixed', detail: 'A crafted file could freeze the preview, and auto-save would bring it back on reload. The parser was updated to a version without the flaw.' },
  { name: 'Images from web addresses', severity: 'Low', status: 'Accepted', detail: 'Kept on purpose; see below.' },
  { name: 'Very large documents of mostly equations froze the page', severity: 'Low', status: 'Fixed', detail: 'Slow rather than unsafe, but auto-save brought the freeze back on reload. Since 1.11.0 the preview is prepared in the background under a time limit, so it can pause without the editor ever stopping.' },
]
</script>

<template>
  <div class="td">
    <header class="td-bar">
      <NuxtLink to="/" class="td-bar-home">
        <img src="/images/icjia-logo.png" alt="" width="28" height="28">
        ICJIA Markdown Editor
      </NuxtLink>
      <NuxtLink to="/" class="td-btn td-btn-primary">Open the editor</NuxtLink>
    </header>

    <main id="main-content" class="td-main" tabindex="-1">
      <section class="td-hero">
        <h1>
          <span class="td-line"><span class="td-mark" aria-hidden="true">#</span> Plain text in.</span>
          <span class="td-line">Finished document out.</span>
        </h1>
        <p class="td-lede">
          The ICJIA Markdown Editor turns a few simple typed marks into a properly structured document,
          ready for the agency’s website. It runs entirely inside your browser. This page explains how
          it works and why it is built this way, without assuming you write software.
        </p>
        <TdLiveDemo />
      </section>

      <section class="td-section" aria-labelledby="sec-why">
        <h2 id="sec-why"><span class="td-mark" aria-hidden="true">##</span> Why write this way</h2>
        <p class="td-intro">
          A word processor stores how a document looks. Markdown stores what each part of it is: this
          line is a heading, this is a list, this is a table. That difference matters the moment the
          document leaves your computer.
        </p>

        <dl class="td-reasons">
          <div>
            <dt><span class="td-glyph" aria-hidden="true">#</span>Headings are real headings</dt>
            <dd>
              People using screen readers move through a report by its headings, the way sighted readers
              skim. Text that has only been made large and bold gives them nothing to move through.
            </dd>
          </div>
          <div>
            <dt><span class="td-glyph" aria-hidden="true">**</span>It pastes cleanly</dt>
            <dd>
              Nothing is carried along but structure, so the website’s own fonts and colours apply, and
              nobody has to clean up after the paste.
            </dd>
          </div>
          <div>
            <dt><span class="td-glyph" aria-hidden="true">.md</span>The file will still open</dt>
            <dd>
              A markdown file is ordinary text. Any computer made in the last fifty years can read it, and
              any made in the next fifty will. No licence and no particular program are needed.
            </dd>
          </div>
          <div>
            <dt><span class="td-glyph" aria-hidden="true">$x$</span>Research needs are built in</dt>
            <dd>
              Footnotes, tables, equations and code samples each have a simple notation, and each comes
              out correctly typeset.
            </dd>
          </div>
        </dl>

        <h3 class="td-sub">See what a paste really carries</h3>
        <TdClipboard />
      </section>

      <section class="td-section" aria-labelledby="sec-pipeline">
        <h2 id="sec-pipeline"><span class="td-mark" aria-hidden="true">##</span> What happens when you type</h2>
        <p class="td-intro">
          Between your keyboard and the preview there are three steps. Follow one short passage through
          them, including a line that should not be there.
        </p>
        <TdPipeline />
      </section>

      <section class="td-section" aria-labelledby="sec-private">
        <h2 id="sec-private"><span class="td-mark" aria-hidden="true">##</span> Your words stay on your computer</h2>
        <p class="td-intro">
          There is no account, no upload and no server holding drafts. When you open the editor, your
          browser downloads the program once. From then on, everything happens on your own machine.
        </p>

        <div class="td-flow">
          <div class="td-flow-box td-flow-yours">
            <p class="td-flow-title">Your computer</p>
            <ol class="td-flow-steps">
              <li><strong>You type</strong> in the editor.</li>
              <li><strong>The preview</strong> is drawn by your browser.</li>
              <li><strong>Auto-save</strong> writes a copy to this browser’s own storage, two seconds after you pause.</li>
              <li><strong>Download</strong> writes a file to your disk.</li>
            </ol>
          </div>
          <div class="td-flow-gap" aria-hidden="true">
            <span class="td-flow-wall" />
            <span class="td-flow-wall-label">nothing crosses</span>
          </div>
          <div class="td-flow-box td-flow-theirs">
            <p class="td-flow-title">The internet</p>
            <p>
              The web host delivers the editor’s files and nothing more. The site also instructs your
              browser to block the page from opening connections to any other server, so this does not
              rest on a promise alone.
            </p>
          </div>
        </div>

        <TdSavedDraft />

        <p class="td-aside">
          One consequence worth knowing: a draft lives in the browser you wrote it in. It will not follow
          you to another computer, and on a shared computer the next person to open the editor in the
          same browser profile will see it. Download your work, and on a shared machine clear the editor
          when you finish.
        </p>
      </section>

      <section class="td-section" aria-labelledby="sec-access">
        <h2 id="sec-access"><span class="td-mark" aria-hidden="true">##</span> Built so everyone can use it, and so what you publish is too</h2>
        <p class="td-intro">
          Public agencies are required to publish documents that people with disabilities can read. The
          editor is tested against the strictest published standard, and it checks your document as well
          as itself. The commonest mistake in a long report is a heading that skips a level. Try it.
        </p>
        <TdHeadingCheck />
        <ul class="td-points">
          <li>Every control works from the keyboard alone.</li>
          <li>Text contrast is at least 7 to 1 throughout, in both the dark and the light theme.</li>
          <li>Screen readers are told when something happens, such as a save or a copy, and are otherwise left in peace.</li>
          <li>Animation is switched off for people who have asked their device to reduce motion.</li>
        </ul>
      </section>

      <section class="td-section" aria-labelledby="sec-redblue">
        <h2 id="sec-redblue"><span class="td-mark" aria-hidden="true">##</span> We attacked it ourselves</h2>
        <p class="td-intro">
          An editor opens files that other people wrote. So in November 2026 the editor was put through a
          red team and blue team exercise: one side plays an attacker who can hand an author a booby-trapped
          document, the other fixes whatever gets through. Pick an attack and see what the editor does with
          it. The right-hand column is produced live, by the copy of the editor running on this page.
        </p>
        <TdAttackLab />

        <h3 class="td-sub">The scorecard</h3>
        <div class="td-table-wrap" tabindex="0" role="region" aria-label="Red team findings">
          <table class="td-table">
            <thead>
              <tr>
                <th scope="col">What the red team found</th>
                <th scope="col">Risk</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in findings" :key="f.name">
                <th scope="row">
                  {{ f.name }}
                  <span class="td-table-detail">{{ f.detail }}</span>
                </th>
                <td>{{ f.severity }}</td>
                <td><span class="td-status" :class="`is-${f.status.toLowerCase()}`">{{ f.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="td-aside">
          No attack ran code, read a draft, or reached outside the preview pane. More than forty other
          attempts, including every standard way of smuggling a script into a web page, were stopped by
          defences already in place.
        </p>

        <h3 class="td-sub">What we chose to leave</h3>
        <p class="td-prose">
          A document can display an image from a web address, and the computer hosting that image can
          tell that someone opened the document. Blocking this would also block every legitimate figure
          an author links to, so the editor allows it, as email programs and most document tools do. If
          you are opening a file from a source you do not trust, be aware of it. The editor never sends
          your text, only the request for the picture.
        </p>
      </section>

      <section class="td-section" aria-labelledby="sec-numbers">
        <h2 id="sec-numbers"><span class="td-mark" aria-hidden="true">##</span> The short version, in numbers</h2>
        <dl class="td-facts">
          <div v-for="f in facts" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd>{{ f.figure }}</dd>
          </div>
        </dl>
      </section>

      <section class="td-section" aria-labelledby="sec-parts">
        <h2 id="sec-parts"><span class="td-mark" aria-hidden="true">##</span> What it is made of</h2>
        <p class="td-intro">
          The editor is assembled from well-established open-source components, each doing one job. All of
          it, including the editor’s own code, is public and free to inspect.
        </p>
        <dl class="td-parts">
          <div v-for="p in parts" :key="p.name">
            <dt>{{ p.name }}</dt>
            <dd>{{ p.role }}</dd>
          </div>
        </dl>
      </section>
    </main>

    <footer class="td-foot">
      <p>
        Version {{ version }}. Published by the Illinois Criminal Justice Information Authority under the
        MIT licence.
      </p>
      <ul>
        <li><NuxtLink to="/">Open the editor</NuxtLink></li>
        <li><a href="https://github.com/ICJIA/icjia-markdown-editor-2026">Source code on GitHub</a></li>
        <li><a href="https://github.com/ICJIA/icjia-markdown-editor-2026/blob/main/CHANGELOG.md">Release notes</a></li>
      </ul>
    </footer>
  </div>
</template>
