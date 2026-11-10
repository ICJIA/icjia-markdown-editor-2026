<script setup lang="ts">
/**
 * Technical Details: the heading check, on a document small enough to see whole.
 * Uses the editor's own linter.
 */
import { lintHeadings } from '~/utils/markdown/heading-lint'

const broken = `# Annual report

### Methods

## Results

####

## Appendix`

const repaired = `# Annual report

## Methods

## Results

### By county

## Appendix`

const source = ref(broken)
const issues = computed(() => lintHeadings(source.value))
</script>

<template>
  <div class="td-check">
    <div class="td-demo-pane">
      <label class="td-pane-label" for="td-check-source">A report’s headings</label>
      <textarea
        id="td-check-source"
        v-model="source"
        class="td-demo-source"
        spellcheck="false"
        rows="11"
      />
      <div class="td-stage-nav">
        <button type="button" class="td-btn" @click="source = broken">Show the broken version</button>
        <button type="button" class="td-btn td-btn-primary" @click="source = repaired">Repair it</button>
      </div>
    </div>
    <div class="td-demo-pane" aria-live="polite">
      <p class="td-pane-label">What the editor tells the author</p>
      <ul v-if="issues.length" class="td-issues">
        <li v-for="issue in issues" :key="`${issue.line}-${issue.rule}`">
          <span class="td-issue-line">Line {{ issue.line }}</span>
          {{ issue.message }}
        </li>
      </ul>
      <p v-else class="td-issues-clean">
        No heading problems. A screen reader user can move through this report section by section,
        and it will pass an accessibility review.
      </p>
    </div>
  </div>
</template>
