/**
 * @fileoverview Table Builder Utilities
 * @description Generates markdown table syntax from a visual table configuration.
 * Provides immutable operations for manipulating table structure.
 * 
 * @module utils/table-builder
 * 
 * @example
 * ```typescript
 * import { createEmptyTable, generateTableMarkdown, addRow } from './table-builder'
 * 
 * // Create a 3x3 table
 * let table = createEmptyTable(3, 3)
 * 
 * // Add a row
 * table = addRow(table)
 * 
 * // Generate markdown
 * const markdown = generateTableMarkdown(table)
 * ```
 */

/**
 * Column alignment types for markdown tables.
 * @typedef {'left' | 'center' | 'right'} Alignment
 */
export type Alignment = 'left' | 'center' | 'right'

/**
 * Configuration object representing a markdown table structure.
 * 
 * @interface TableConfig
 * @property {number} rows - Number of data rows (excluding header)
 * @property {number} columns - Number of columns
 * @property {string[]} headers - Array of header cell values
 * @property {string[][]} cells - 2D array of cell values [row][column]
 * @property {Alignment[]} alignments - Column alignment settings
 */
export interface TableConfig {
  rows: number
  columns: number
  headers: string[]
  cells: string[][]
  alignments: Alignment[]
}

/**
 * Generates a markdown table string from a TableConfig object.
 * Produces valid GitHub Flavored Markdown table syntax.
 * 
 * @param {TableConfig} config - The table configuration
 * @returns {string} Markdown table syntax as a string
 * 
 * @example
 * ```typescript
 * const markdown = generateTableMarkdown({
 *   rows: 2,
 *   columns: 2,
 *   headers: ['Name', 'Value'],
 *   cells: [['A', '1'], ['B', '2']],
 *   alignments: ['left', 'right']
 * })
 * // Returns:
 * // | Name | Value |
 * // | :--- | ---: |
 * // | A | 1 |
 * // | B | 2 |
 * ```
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
 * Creates an empty table configuration with default values.
 * Headers are named "Header 1", "Header 2", etc.
 * All columns default to left alignment.
 * 
 * @param {number} rows - Number of data rows to create
 * @param {number} cols - Number of columns to create
 * @returns {TableConfig} A new table configuration object
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
 * Adds a new empty row to the table.
 * Returns a new TableConfig object (immutable operation).
 * 
 * @param {TableConfig} config - The current table configuration
 * @returns {TableConfig} A new table configuration with the added row
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
 * Removes a row at the specified index.
 * Returns the original config if only one row exists (minimum).
 * Returns a new TableConfig object (immutable operation).
 * 
 * @param {TableConfig} config - The current table configuration
 * @param {number} index - The zero-based index of the row to remove
 * @returns {TableConfig} A new table configuration without the removed row
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
 * Adds a new empty column to the table.
 * The new column is added at the end with default header and left alignment.
 * Returns a new TableConfig object (immutable operation).
 * 
 * @param {TableConfig} config - The current table configuration
 * @returns {TableConfig} A new table configuration with the added column
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
 * Removes a column at the specified index.
 * Returns the original config if only one column exists (minimum).
 * Returns a new TableConfig object (immutable operation).
 * 
 * @param {TableConfig} config - The current table configuration
 * @param {number} index - The zero-based index of the column to remove
 * @returns {TableConfig} A new table configuration without the removed column
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
