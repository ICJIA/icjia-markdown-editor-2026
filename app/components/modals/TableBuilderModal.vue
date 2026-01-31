<script setup lang="ts">
/**
 * Table Builder Modal
 * Visual table creator with dimensions, cell editing, and column alignment
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

const alignmentItems: { label: string; value: Alignment }[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]

watch(
  () => [props.open],
  () => {
    if (props.open) {
      rowsCount.value = 3
      colsCount.value = 3
      table.value = createEmptyTable(3, 3)
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

const previewMarkdown = computed(() => generateTableMarkdown(table.value))
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    title="Insert Table"
    description="Set rows and columns, edit headers and cells, choose column alignment, then insert markdown at the cursor."
    :ui="{
      overlay: 'bg-black/60 backdrop-blur-sm'
    }"
  >
    <template #content>
      <div class="p-4 sm:p-6 space-y-4">
        <!-- Dimension controls -->
        <div class="flex flex-wrap items-end gap-4">
          <UFormField label="Rows" class="min-w-24">
            <UInput
              v-model.number="rowsCount"
              type="number"
              :min="MIN_ROWS"
              :max="MAX_ROWS"
              aria-describedby="rows-help"
              aria-label="Number of table rows"
            />
            <span id="rows-help" class="sr-only">
              Number of table rows, {{ MIN_ROWS }} to {{ MAX_ROWS }}
            </span>
          </UFormField>

          <UFormField label="Columns" class="min-w-24">
            <UInput
              v-model.number="colsCount"
              type="number"
              :min="MIN_COLS"
              :max="MAX_COLS"
              aria-describedby="cols-help"
              aria-label="Number of table columns"
            />
            <span id="cols-help" class="sr-only">
              Number of table columns, {{ MIN_COLS }} to {{ MAX_COLS }}
            </span>
          </UFormField>

          <div class="flex gap-1">
            <UButton
              icon="i-heroicons-plus"
              aria-label="Add row"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="table.rows >= MAX_ROWS"
              @click="handleAddRow"
            />
            <UButton
              icon="i-heroicons-minus"
              aria-label="Remove row"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="table.rows <= MIN_ROWS"
              @click="handleRemoveRow"
            />
            <UButton
              icon="i-heroicons-plus"
              aria-label="Add column"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="table.columns >= MAX_COLS"
              @click="handleAddColumn"
            />
            <UButton
              icon="i-heroicons-minus"
              aria-label="Remove column"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="table.columns <= MIN_COLS"
              @click="handleRemoveColumn"
            />
          </div>
        </div>

        <!-- Table editor grid -->
        <div
          class="overflow-auto rounded-md ring ring-default"
          role="grid"
          aria-label="Table content editor"
        >
          <!-- Header row -->
          <div role="row" class="flex divide-x divide-default">
            <div
              v-for="(header, i) in table.headers"
              :key="`header-${i}`"
              role="columnheader"
              class="min-w-24 flex-1"
            >
              <UInput
                v-model="table.headers[i]"
                :aria-label="`Column ${i + 1} header`"
                class="rounded-none border-0 font-semibold focus:ring-inset"
                size="sm"
              />
            </div>
          </div>

          <!-- Alignment row -->
          <div role="row" class="flex divide-x divide-default">
            <div
              v-for="(_, i) in table.alignments"
              :key="`align-${i}`"
              role="cell"
              class="min-w-24 flex-1"
            >
              <USelect
                v-model="table.alignments[i]"
                :items="alignmentItems"
                value-key="value"
                :aria-label="`Column ${i + 1} alignment`"
                class="rounded-none border-0 focus:ring-inset"
                size="sm"
              />
            </div>
          </div>

          <!-- Data rows -->
          <div
            v-for="(row, rowIndex) in table.cells"
            :key="`row-${rowIndex}`"
            role="row"
            class="flex divide-x divide-default"
          >
            <div
              v-for="(cell, colIndex) in row"
              :key="`cell-${rowIndex}-${colIndex}`"
              role="cell"
              class="min-w-24 flex-1"
            >
              <UInput
                v-model="table.cells[rowIndex]![colIndex]"
                :aria-label="`Row ${rowIndex + 1}, Column ${colIndex + 1}`"
                class="rounded-none border-0 focus:ring-inset"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- Preview -->
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium text-muted hover:text-highlighted">
            Preview Markdown
          </summary>
          <pre
            class="mt-2 overflow-auto rounded-md bg-elevated p-3 text-sm text-muted"
          >{{ previewMarkdown }}</pre>
        </details>

        <!-- Footer actions -->
        <div class="flex justify-end gap-2 pt-4">
          <UButton
            variant="ghost"
            color="neutral"
            label="Cancel"
            aria-label="Cancel and close"
            @click="isOpen = false"
          />
          <UButton
            label="Insert Table"
            aria-label="Insert table at cursor"
            @click="handleInsert"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Safety fix: Ensure modal is centered fixed overlay even if Tailwind utilities fail */
:deep([role="dialog"]) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 50 !important;
}
</style>
