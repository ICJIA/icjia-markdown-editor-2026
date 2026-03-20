import { describe, it, expect } from 'vitest'
import {
  createEmptyTable,
  generateTableMarkdown,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
} from '~/utils/table-builder'
import type { TableConfig } from '~/utils/table-builder'

describe('createEmptyTable', () => {
  it('creates a table with correct dimensions', () => {
    const table = createEmptyTable(3, 4)
    expect(table.rows).toBe(3)
    expect(table.columns).toBe(4)
    expect(table.headers).toHaveLength(4)
    expect(table.cells).toHaveLength(3)
    expect(table.cells[0]).toHaveLength(4)
    expect(table.alignments).toHaveLength(4)
  })

  it('generates default header names', () => {
    const table = createEmptyTable(1, 3)
    expect(table.headers).toEqual(['Header 1', 'Header 2', 'Header 3'])
  })

  it('defaults all alignments to left', () => {
    const table = createEmptyTable(1, 2)
    expect(table.alignments).toEqual(['left', 'left'])
  })

  it('initializes cells as empty strings', () => {
    const table = createEmptyTable(2, 2)
    expect(table.cells).toEqual([['', ''], ['', '']])
  })
})

describe('generateTableMarkdown', () => {
  it('generates valid markdown table syntax', () => {
    const table: TableConfig = {
      rows: 1,
      columns: 2,
      headers: ['Name', 'Value'],
      cells: [['Alice', '42']],
      alignments: ['left', 'right'],
    }
    const md = generateTableMarkdown(table)
    const lines = md.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('| Name | Value |')
    expect(lines[1]).toBe('| :--- | ---: |')
    expect(lines[2]).toBe('| Alice | 42 |')
  })

  it('handles center alignment', () => {
    const table = createEmptyTable(0, 1)
    table.alignments = ['center']
    const md = generateTableMarkdown(table)
    expect(md).toContain(':---:')
  })

  it('handles multiple data rows', () => {
    const table: TableConfig = {
      rows: 3,
      columns: 1,
      headers: ['Col'],
      cells: [['A'], ['B'], ['C']],
      alignments: ['left'],
    }
    const lines = generateTableMarkdown(table).split('\n')
    expect(lines).toHaveLength(5) // header + alignment + 3 data rows
  })
})

describe('addRow', () => {
  it('adds an empty row and increments row count', () => {
    const table = createEmptyTable(2, 3)
    const result = addRow(table)
    expect(result.rows).toBe(3)
    expect(result.cells).toHaveLength(3)
    expect(result.cells[2]).toEqual(['', '', ''])
  })

  it('does not mutate the original table', () => {
    const table = createEmptyTable(1, 2)
    addRow(table)
    expect(table.rows).toBe(1)
    expect(table.cells).toHaveLength(1)
  })
})

describe('removeRow', () => {
  it('removes a row at the specified index', () => {
    const table: TableConfig = {
      rows: 3,
      columns: 1,
      headers: ['Col'],
      cells: [['A'], ['B'], ['C']],
      alignments: ['left'],
    }
    const result = removeRow(table, 1)
    expect(result.rows).toBe(2)
    expect(result.cells).toEqual([['A'], ['C']])
  })

  it('does not remove the last remaining row', () => {
    const table = createEmptyTable(1, 2)
    const result = removeRow(table, 0)
    expect(result.rows).toBe(1)
    expect(result).toBe(table) // returns same reference
  })

  it('does not mutate the original table', () => {
    const table = createEmptyTable(2, 1)
    removeRow(table, 0)
    expect(table.rows).toBe(2)
  })
})

describe('addColumn', () => {
  it('adds a column with default header and alignment', () => {
    const table = createEmptyTable(2, 2)
    const result = addColumn(table)
    expect(result.columns).toBe(3)
    expect(result.headers[2]).toBe('Header 3')
    expect(result.alignments[2]).toBe('left')
    expect(result.cells[0]).toHaveLength(3)
    expect(result.cells[1]).toHaveLength(3)
  })

  it('does not mutate the original table', () => {
    const table = createEmptyTable(1, 1)
    addColumn(table)
    expect(table.columns).toBe(1)
  })
})

describe('removeColumn', () => {
  it('removes a column at the specified index', () => {
    const table: TableConfig = {
      rows: 1,
      columns: 3,
      headers: ['A', 'B', 'C'],
      cells: [['1', '2', '3']],
      alignments: ['left', 'center', 'right'],
    }
    const result = removeColumn(table, 1)
    expect(result.columns).toBe(2)
    expect(result.headers).toEqual(['A', 'C'])
    expect(result.cells[0]).toEqual(['1', '3'])
    expect(result.alignments).toEqual(['left', 'right'])
  })

  it('does not remove the last remaining column', () => {
    const table = createEmptyTable(1, 1)
    const result = removeColumn(table, 0)
    expect(result.columns).toBe(1)
    expect(result).toBe(table)
  })

  it('does not mutate the original table', () => {
    const table = createEmptyTable(1, 2)
    removeColumn(table, 0)
    expect(table.columns).toBe(2)
  })
})
