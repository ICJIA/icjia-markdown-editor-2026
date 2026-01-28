/**
 * Table Builder Utilities
 * Generates markdown table syntax from a visual table configuration
 */

export type Alignment = 'left' | 'center' | 'right'

export interface TableConfig {
  rows: number
  columns: number
  headers: string[]
  cells: string[][]
  alignments: Alignment[]
}

/**
 * Generate markdown table string from config
 */
export function generateTableMarkdown(config: TableConfig): string {
  const { headers, cells, alignments } = config
  const lines: string[] = []

  // Header row
  lines.push(`| ${headers.join(' | ')} |`)

  // Alignment row
  const alignmentRow = alignments.map((align) => {
    switch (align) {
      case 'left':
        return ':---'
      case 'center':
        return ':---:'
      case 'right':
        return '---:'
    }
  })
  lines.push(`| ${alignmentRow.join(' | ')} |`)

  // Data rows
  for (const row of cells) {
    lines.push(`| ${row.join(' | ')} |`)
  }

  return lines.join('\n')
}

/**
 * Create an empty table configuration with default headers and alignments
 */
export function createEmptyTable(rows: number, cols: number): TableConfig {
  return {
    rows,
    columns: cols,
    headers: Array.from({ length: cols }, (_, i) => `Header ${i + 1}`),
    cells: Array.from({ length: rows }, () => Array(cols).fill('')),
    alignments: Array(cols).fill('left') as Alignment[],
  }
}

/**
 * Add a row to the table (immutable)
 */
export function addRow(config: TableConfig): TableConfig {
  const newCells = [...config.cells, Array(config.columns).fill('')]
  return {
    ...config,
    rows: config.rows + 1,
    cells: newCells,
  }
}

/**
 * Remove a row at index (immutable)
 */
export function removeRow(config: TableConfig, index: number): TableConfig {
  if (config.rows <= 1) return config
  const newCells = config.cells.filter((_, i) => i !== index)
  return {
    ...config,
    rows: config.rows - 1,
    cells: newCells,
  }
}

/**
 * Add a column to the table (immutable)
 */
export function addColumn(config: TableConfig): TableConfig {
  const newHeaders = [...config.headers, `Header ${config.columns + 1}`]
  const newAlignments = [...config.alignments, 'left'] as Alignment[]
  const newCells = config.cells.map((row) => [...row, ''])
  return {
    ...config,
    columns: config.columns + 1,
    headers: newHeaders,
    alignments: newAlignments,
    cells: newCells,
  }
}

/**
 * Remove a column at index (immutable)
 */
export function removeColumn(config: TableConfig, index: number): TableConfig {
  if (config.columns <= 1) return config
  const newHeaders = config.headers.filter((_, i) => i !== index)
  const newAlignments = config.alignments.filter((_, i) => i !== index) as Alignment[]
  const newCells = config.cells.map((row) => row.filter((_, i) => i !== index))
  return {
    ...config,
    columns: config.columns - 1,
    headers: newHeaders,
    alignments: newAlignments,
    cells: newCells,
  }
}
