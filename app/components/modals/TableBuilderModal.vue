<script setup lang="ts">
/**
 * Table Builder Modal
 * Modern visual table creator with dimensions, cell editing, and column alignment
 * WCAG 2.1 AA: focus trap, escape to close, labeled inputs, grid ARIA
 */

import {
  createEmptyTable,
  generateTableMarkdown,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  type TableConfig,
  type Alignment,
} from '~/utils/table-builder'
import { renderMarkdown } from '~/utils/markdown/config'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insert', markdown: string): void
}>()

const MIN_ROWS = 1
const MAX_ROWS = 20
const MIN_COLS = 1
const MAX_COLS = 10

const rowsCount = ref(3)
const colsCount = ref(3)
const table = ref<TableConfig>(createEmptyTable(3, 3))
const showMarkdownPreview = ref(false)

// View mode: 'edit' or 'preview'
type ViewMode = 'edit' | 'preview'
const viewMode = ref<ViewMode>('edit')

const alignmentOptions: { label: string; value: Alignment; icon: string }[] = [
  { label: 'Left', value: 'left', icon: 'i-heroicons-bars-3-bottom-left' },
  { label: 'Center', value: 'center', icon: 'i-heroicons-bars-3' },
  { label: 'Right', value: 'right', icon: 'i-heroicons-bars-3-bottom-right' },
]

watch(
  () => [props.open],
  () => {
    if (props.open) {
      rowsCount.value = 3
      colsCount.value = 3
      table.value = createEmptyTable(3, 3)
      showMarkdownPreview.value = false
      viewMode.value = 'edit'
    }
  },
)

watch([rowsCount, colsCount], ([r, c]) => {
  const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, Number(r) || MIN_ROWS))
  const cols = Math.min(MAX_COLS, Math.max(MIN_COLS, Number(c) || MIN_COLS))
  rowsCount.value = rows
  colsCount.value = cols
  table.value = createEmptyTable(rows, cols)
})

// UModal needs a real ref for v-model:open; sync from prop and emit on close
const isOpen = ref(props.open)
watch(
  () => props.open,
  (v) => {
    isOpen.value = v
  },
  { immediate: true },
)
watch(isOpen, (v) => {
  if (!v) emit('close')
})

function handleAddRow() {
  if (table.value.rows >= MAX_ROWS) return
  table.value = addRow(table.value)
  rowsCount.value = table.value.rows
}

function handleRemoveRow() {
  if (table.value.rows <= MIN_ROWS) return
  table.value = removeRow(table.value, table.value.rows - 1)
  rowsCount.value = table.value.rows
}

function handleAddColumn() {
  if (table.value.columns >= MAX_COLS) return
  table.value = addColumn(table.value)
  colsCount.value = table.value.columns
}

function handleRemoveColumn() {
  if (table.value.columns <= MIN_COLS) return
  table.value = removeColumn(table.value, table.value.columns - 1)
  colsCount.value = table.value.columns
}

function handleInsert() {
  const markdown = generateTableMarkdown(table.value)
  emit('insert', markdown)
  emit('close')
}

function cycleAlignment(colIndex: number) {
  const current = table.value.alignments[colIndex]
  const order: Alignment[] = ['left', 'center', 'right']
  const currentIdx = order.indexOf(current || 'left')
  const nextIdx = (currentIdx + 1) % order.length
  table.value.alignments[colIndex] = order[nextIdx]!
}

function getAlignmentIcon(alignment: Alignment): string {
  return alignmentOptions.find(a => a.value === alignment)?.icon || 'i-heroicons-bars-3-bottom-left'
}

const previewMarkdown = computed(() => generateTableMarkdown(table.value))

// Render the markdown table to HTML for the preview
const previewHtml = computed(() => {
  const markdown = generateTableMarkdown(table.value)
  return renderMarkdown(markdown)
})

function toggleViewMode() {
  viewMode.value = viewMode.value === 'edit' ? 'preview' : 'edit'
}

// Copy status feedback
const copySuccess = ref(false)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

// Copy markdown to clipboard (client-side only)
async function copyToClipboard() {
  if (import.meta.client && navigator?.clipboard) {
    try {
      await navigator.clipboard.writeText(previewMarkdown.value)
      copySuccess.value = true
      if (copyTimeout) clearTimeout(copyTimeout)
      copyTimeout = setTimeout(() => { copySuccess.value = false }, 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      copySuccess.value = false
    }
  }
}

onUnmounted(() => {
  if (copyTimeout) clearTimeout(copyTimeout)
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    :ui="{
      content: 'table-modal-content bg-slate-800 dark:bg-slate-800 border border-slate-600 shadow-2xl w-[95vw] max-w-4xl flex flex-col max-h-[90vh] sm:max-h-[85vh]',
      header: 'border-b border-slate-600 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0',
      body: 'px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 min-h-0',
      footer: 'border-t border-slate-600 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0',
      overlay: 'bg-black/70 backdrop-blur-sm'
    }"
  >
    <template #header>
      <div class="flex items-center gap-4">
        <div class="table-header-icon">
          <UIcon name="i-heroicons-table-cells" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 id="table-modal-title" class="text-xl font-bold text-neutral-100">
            Table Builder
          </h2>
          <p class="text-sm text-neutral-400 mt-1">
            Create and customize markdown tables visually
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <!-- View Mode Toggle & Dimension Controls -->
      <div class="controls-bar">
        <!-- View Mode Toggle -->
        <div class="view-toggle">
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': viewMode === 'edit' }"
            :aria-pressed="viewMode === 'edit'"
            @click="viewMode = 'edit'"
          >
            <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': viewMode === 'preview' }"
            :aria-pressed="viewMode === 'preview'"
            @click="viewMode = 'preview'"
          >
            <UIcon name="i-heroicons-eye" class="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>

        <!-- Dimension Controls (only show in edit mode) -->
        <Transition name="fade">
          <div v-if="viewMode === 'edit'" class="dimension-controls">
            <div class="dimension-group">
              <label for="table-rows-input" class="dimension-label">
                <UIcon name="i-heroicons-arrows-up-down" class="w-4 h-4" />
                <span>Rows</span>
              </label>
              <div class="dimension-input-group">
                <button
                  type="button"
                  class="dimension-btn"
                  :disabled="table.rows <= MIN_ROWS"
                  aria-label="Remove row"
                  @click="handleRemoveRow"
                >
                  <UIcon name="i-heroicons-minus" class="w-4 h-4" />
                </button>
                <input
                  id="table-rows-input"
                  v-model.number="rowsCount"
                  type="number"
                  :min="MIN_ROWS"
                  :max="MAX_ROWS"
                  class="dimension-input"
                  aria-label="Number of table rows"
                />
                <button
                  type="button"
                  class="dimension-btn"
                  :disabled="table.rows >= MAX_ROWS"
                  aria-label="Add row"
                  @click="handleAddRow"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="dimension-divider" />

            <div class="dimension-group">
              <label for="table-cols-input" class="dimension-label">
                <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4" />
                <span>Columns</span>
              </label>
              <div class="dimension-input-group">
                <button
                  type="button"
                  class="dimension-btn"
                  :disabled="table.columns <= MIN_COLS"
                  aria-label="Remove column"
                  @click="handleRemoveColumn"
                >
                  <UIcon name="i-heroicons-minus" class="w-4 h-4" />
                </button>
                <input
                  id="table-cols-input"
                  v-model.number="colsCount"
                  type="number"
                  :min="MIN_COLS"
                  :max="MAX_COLS"
                  class="dimension-input"
                  aria-label="Number of table columns"
                />
                <button
                  type="button"
                  class="dimension-btn"
                  :disabled="table.columns >= MAX_COLS"
                  aria-label="Add column"
                  @click="handleAddColumn"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Table Editor (Edit Mode) -->
      <div v-if="viewMode === 'edit'" class="table-editor-wrapper">
        <div
          class="table-editor"
          role="grid"
          aria-label="Table content editor"
        >
          <!-- Header Row -->
          <div role="row" class="table-row table-row--header">
            <div
              v-for="(header, i) in table.headers"
              :key="`header-${i}`"
              role="columnheader"
              class="table-cell table-cell--header"
            >
              <input
                v-model="table.headers[i]"
                type="text"
                class="table-input table-input--header"
                :aria-label="`Column ${i + 1} header`"
                :placeholder="`Header ${i + 1}`"
              />
            </div>
          </div>

          <!-- Alignment Row -->
          <div role="row" class="table-row table-row--alignment">
            <div
              v-for="(alignment, i) in table.alignments"
              :key="`align-${i}`"
              role="cell"
              class="table-cell table-cell--alignment"
            >
              <button
                type="button"
                class="alignment-btn"
                :aria-label="`Column ${i + 1} alignment: ${alignment}. Click to cycle.`"
                :title="`Align ${alignment}`"
                @click="cycleAlignment(i)"
              >
                <UIcon :name="getAlignmentIcon(alignment)" class="w-4 h-4" />
                <span class="alignment-label">{{ alignment }}</span>
              </button>
            </div>
          </div>

          <!-- Data Rows -->
          <div
            v-for="(row, rowIndex) in table.cells"
            :key="`row-${rowIndex}`"
            role="row"
            class="table-row"
          >
            <div
              v-for="(cell, colIndex) in row"
              :key="`cell-${rowIndex}-${colIndex}`"
              role="cell"
              class="table-cell"
            >
              <input
                v-model="table.cells[rowIndex]![colIndex]"
                type="text"
                class="table-input"
                :aria-label="`Row ${rowIndex + 1}, Column ${colIndex + 1}`"
                placeholder="..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- HTML Preview (Preview Mode) -->
      <div v-if="viewMode === 'preview'" class="html-preview-wrapper">
        <div class="html-preview-header">
          <div class="html-preview-label">
            <UIcon name="i-heroicons-eye" class="w-4 h-4" />
            <span>Live Preview</span>
          </div>
          <p class="html-preview-note">This is how your table will appear when rendered</p>
        </div>
        <div class="html-preview-content prose prose-invert max-w-none" v-html="previewHtml" />
      </div>

      <!-- Markdown Code Preview Toggle (only in edit mode) -->
      <div v-if="viewMode === 'edit'" class="preview-section">
        <button
          type="button"
          class="preview-toggle"
          :aria-expanded="showMarkdownPreview"
          @click="showMarkdownPreview = !showMarkdownPreview"
        >
          <UIcon
            :name="showMarkdownPreview ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
            class="w-4 h-4 transition-transform"
          />
          <UIcon name="i-heroicons-code-bracket" class="w-4 h-4" />
          <span>Show Markdown Code</span>
        </button>
        
        <Transition name="preview">
          <div v-if="showMarkdownPreview" class="preview-content">
            <pre class="preview-code">{{ previewMarkdown }}</pre>
            <button
              type="button"
              class="copy-btn"
              :aria-label="copySuccess ? 'Copied to clipboard' : 'Copy markdown to clipboard'"
              @click="copyToClipboard"
            >
              <UIcon :name="copySuccess ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'" class="w-4 h-4" />
              <span>{{ copySuccess ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Tips (only in edit mode) -->
      <div v-if="viewMode === 'edit'" class="tips-section">
        <UIcon name="i-heroicons-light-bulb" class="tips-icon" />
        <p class="tips-text">
          <strong>Tip:</strong> Click alignment buttons to cycle through left, center, and right alignment. Tab between cells to navigate quickly.
        </p>
      </div>

      <!-- Preview mode info -->
      <div v-if="viewMode === 'preview'" class="tips-section tips-section--preview">
        <UIcon name="i-heroicons-information-circle" class="tips-icon" />
        <p class="tips-text">
          <strong>Preview mode:</strong> Switch back to Edit to modify your table. Click "Insert Table" when you're satisfied with the result.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-4">
        <div class="text-sm text-neutral-400">
          {{ table.rows }} × {{ table.columns }} table
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="cancel-button"
            @click="isOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="insert-button"
            @click="handleInsert"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            <span>Insert Table</span>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Modal content styling */
:deep(.table-modal-content) {
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%) !important;
}

/* Header icon with gradient */
.table-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%);
  box-shadow: 
    0 4px 12px rgba(245, 158, 11, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

/* Controls Bar */
.controls-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

/* View Toggle */
.view-toggle {
  display: flex;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  overflow: hidden;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-toggle-btn:hover:not(.view-toggle-btn--active) {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.03);
}

.view-toggle-btn--active {
  color: #f8fafc;
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.view-toggle-btn:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: -2px;
}

/* Fade transition for dimension controls */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dimension Controls */
.dimension-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #475569;
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
}

.dimension-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dimension-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.dimension-input-group {
  display: flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  overflow: hidden;
}

.dimension-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dimension-btn:hover:not(:disabled) {
  color: #f8fafc;
  background: #334155;
}

.dimension-btn:disabled {
  color: #475569;
  cursor: not-allowed;
}

.dimension-input {
  width: 3rem;
  height: 2rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f8fafc;
  background: transparent;
  border: none;
  border-left: 1px solid #334155;
  border-right: 1px solid #334155;
  outline: none;
  -moz-appearance: textfield;
}

.dimension-input::-webkit-inner-spin-button,
.dimension-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.dimension-input:focus {
  background: #1e293b;
}

.dimension-divider {
  width: 1px;
  height: 2rem;
  background: #475569;
}

/* Table Editor */
.table-editor-wrapper {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid #475569;
  background: #0f172a;
  margin-bottom: 1rem;
}

.table-editor {
  min-width: 100%;
  display: table;
}

.table-row {
  display: flex;
}

.table-row--header {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 2px solid #f59e0b;
}

.table-row--alignment {
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.table-cell {
  flex: 1;
  min-width: 120px;
  border-right: 1px solid #334155;
}

.table-cell:last-child {
  border-right: none;
}

.table-cell--header {
  border-right-color: #475569;
}

.table-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #e2e8f0;
  background: transparent;
  border: none;
  outline: none;
  transition: background 0.15s ease;
}

.table-input::placeholder {
  color: #475569;
}

.table-input:focus {
  background: rgba(245, 158, 11, 0.08);
}

.table-input--header {
  font-weight: 600;
  color: #f8fafc;
}

.table-input--header:focus {
  background: rgba(245, 158, 11, 0.12);
}

.table-cell--alignment {
  padding: 0;
}

.alignment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.alignment-btn:hover {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}

.alignment-label {
  display: none;
}

@media (min-width: 640px) {
  .alignment-label {
    display: inline;
  }
}

/* Preview Section */
.preview-section {
  margin-bottom: 1rem;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preview-toggle:hover {
  color: #e2e8f0;
  border-color: #475569;
  background: rgba(255, 255, 255, 0.02);
}

.preview-content {
  position: relative;
  margin-top: 0.75rem;
  padding: 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
}

.preview-code {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #a5f3fc;
  white-space: pre-wrap;
  word-break: break-all;
}

.copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  color: #f8fafc;
  background: #334155;
}

/* Preview transition */
.preview-enter-active,
.preview-leave-active {
  transition: all 0.2s ease;
}

.preview-enter-from,
.preview-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* HTML Preview */
.html-preview-wrapper {
  border-radius: 0.75rem;
  border: 1px solid #475569;
  background: #0f172a;
  margin-bottom: 1rem;
  overflow: hidden;
}

.html-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 2px solid #f59e0b;
}

.html-preview-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #f59e0b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.html-preview-note {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.html-preview-content {
  padding: 1.5rem;
  min-height: 120px;
}

/* Style the rendered table in preview */
.html-preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.html-preview-content :deep(th),
.html-preview-content :deep(td) {
  padding: 0.75rem 1rem;
  border: 1px solid #475569;
  text-align: left;
}

.html-preview-content :deep(th) {
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
  font-weight: 600;
  color: #f8fafc;
}

.html-preview-content :deep(td) {
  background: #1e293b;
  color: #e2e8f0;
}

.html-preview-content :deep(tr:hover td) {
  background: #334155;
}

/* Tips Section */
.tips-section {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 0.75rem;
}

.tips-section--preview {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.tips-section--preview .tips-icon {
  color: #60a5fa;
}

.tips-section--preview .tips-text strong {
  color: #60a5fa;
}

.tips-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #fbbf24;
  flex-shrink: 0;
  margin-top: 0.0625rem;
}

.tips-text {
  font-size: 0.8125rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.tips-text strong {
  color: #fbbf24;
}

/* Footer Buttons */
.cancel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  background: linear-gradient(to bottom, #475569 0%, #334155 50%, #1e293b 100%);
  border: 1px solid #64748b;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset,
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.cancel-button:hover {
  background: linear-gradient(to bottom, #64748b 0%, #475569 50%, #334155 100%);
  border-color: #94a3b8;
  color: #f8fafc;
}

.cancel-button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.insert-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 -1px 0 rgba(0, 0, 0, 0.1) inset,
    0 4px 12px rgba(245, 158, 11, 0.4);
}

.insert-button:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 -1px 0 rgba(0, 0, 0, 0.1) inset,
    0 6px 16px rgba(245, 158, 11, 0.5);
}

.insert-button:active {
  transform: translateY(0);
}

.insert-button:focus-visible {
  outline: 2px solid #fbbf24;
  outline-offset: 2px;
}

/* Light mode overrides */
.light :deep(.table-modal-content) {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
}

.light .dimension-controls {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-color: #e2e8f0;
}

.light .dimension-label {
  color: #64748b;
}

.light .dimension-input-group {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.light .dimension-btn {
  color: #64748b;
}

.light .dimension-btn:hover:not(:disabled) {
  color: #0f172a;
  background: #e2e8f0;
}

.light .dimension-input {
  color: #0f172a;
  border-color: #e2e8f0;
}

.light .dimension-input:focus {
  background: #fff;
}

.light .dimension-divider {
  background: #e2e8f0;
}

.light .table-editor-wrapper {
  background: #fff;
  border-color: #e2e8f0;
}

.light .table-row--header {
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.light .table-row--alignment {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.light .table-cell {
  border-color: #e2e8f0;
}

.light .table-input {
  color: #1e293b;
}

.light .table-input::placeholder {
  color: #94a3b8;
}

.light .table-input--header {
  color: #0f172a;
}

.light .alignment-btn {
  color: #64748b;
}

.light .preview-toggle {
  color: #64748b;
  border-color: #e2e8f0;
}

.light .preview-toggle:hover {
  color: #0f172a;
  border-color: #cbd5e1;
}

.light .preview-content {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.light .preview-code {
  color: #0369a1;
}

.light .copy-btn {
  color: #64748b;
  background: #fff;
  border-color: #e2e8f0;
}

.light .copy-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.light .view-toggle {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.light .view-toggle-btn {
  color: #64748b;
}

.light .view-toggle-btn:hover:not(.view-toggle-btn--active) {
  color: #0f172a;
  background: rgba(0, 0, 0, 0.03);
}

.light .view-toggle-btn--active {
  color: #fff;
}

.light .html-preview-wrapper {
  background: #fff;
  border-color: #e2e8f0;
}

.light .html-preview-header {
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.light .html-preview-note {
  color: #94a3b8;
}

.light .html-preview-content :deep(th) {
  background: linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%);
  color: #0f172a;
  border-color: #e2e8f0;
}

.light .html-preview-content :deep(td) {
  background: #fff;
  color: #1e293b;
  border-color: #e2e8f0;
}

.light .html-preview-content :deep(tr:hover td) {
  background: #f8fafc;
}

.light .tips-section {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.15);
}

.light .tips-section--preview {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.15);
}

.light .tips-text {
  color: #64748b;
}

.light .cancel-button {
  color: #374151;
  background: linear-gradient(to bottom, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%);
  border-color: #cbd5e1;
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 -1px 0 rgba(0, 0, 0, 0.05) inset,
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.light .cancel-button:hover {
  background: linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  border-color: #94a3b8;
  color: #1f2937;
}

/* Mobile responsiveness */
@media (max-width: 639px) {
  .dimension-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .dimension-group {
    justify-content: space-between;
  }
  
  .dimension-divider {
    width: 100%;
    height: 1px;
  }
  
  .table-cell {
    min-width: 100px;
  }
}

/* Dialog background override */
:deep([role="dialog"]) {
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%) !important;
}

.light :deep([role="dialog"]) {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
}

/* Mobile fullscreen */
@media (max-width: 639px) {
  :deep([role="dialog"]) {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    transform: none !important;
    border-radius: 0 !important;
  }
}
</style>
