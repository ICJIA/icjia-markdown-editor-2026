/**
 * @fileoverview Conversion Tools Modal Composable
 * @description Manages the conversion tools modal state.
 * Provides external utility links for R&A staff.
 * 
 * @module composables/useConversionToolsModal
 */

/**
 * Conversion tool definition
 */
export interface ConversionTool {
  id: string
  name: string
  description: string
  url: string
  icon: string
  gradient: string
  features: string[]
}

/**
 * Available conversion tools
 */
const conversionTools: ConversionTool[] = [
  {
    id: 'bentopdf',
    name: 'BentoPDF',
    description: 'Privacy-first PDF toolkit. All processing happens locally in your browser.',
    url: 'https://bentopdf.com/',
    icon: 'i-heroicons-document-duplicate',
    gradient: 'from-rose-500 via-pink-500 to-purple-500',
    features: ['Merge & Split PDFs', 'Convert to/from PDF', 'Compress Files', 'No Upload Required'],
  },
  {
    id: 'vertsh',
    name: 'Vert.sh',
    description: 'Universal file converter supporting images, audio, video, and documents.',
    url: 'https://vert.sh',
    icon: 'i-heroicons-arrows-right-left',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    features: ['Image Conversion', 'Audio & Video', 'Document Formats', 'Batch Processing'],
  },
  {
    id: 'tablesgenerator',
    name: 'Table Generator',
    description: 'Advanced markdown table generator with spreadsheet-like editing and CSV import.',
    url: 'https://www.tablesgenerator.com/markdown_tables',
    icon: 'i-heroicons-table-cells',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    features: ['CSV Import', 'Copy/Paste Data', 'Column Alignment', 'Spreadsheet UI'],
  },
  {
    id: 'ipsumify',
    name: 'Ipsumify',
    description: 'Generate placeholder text and dummy content quickly for testing and mockups.',
    url: 'https://ipsumify.com',
    icon: 'i-heroicons-document-text',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    features: ['Lorem Ipsum', 'Custom Length', 'Multiple Formats', 'Instant Generation', 'Created by developers at ICJIA'],
  },
  {
    id: 'squish',
    name: 'Squish',
    description: 'ICJIA utility for compressing and optimizing images.',
    url: 'https://squish.icjia.app',
    icon: 'i-heroicons-photo',
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    features: ['Image Compression', 'Image Optimization', 'Quick Processing', 'Created by developers at ICJIA'],
  },
]

/**
 * Flag indicating if the conversion tools modal is open
 */
const isOpen = ref(false)

/**
 * Conversion Tools Modal composable
 * Manages the modal state for displaying external conversion utilities.
 * 
 * @returns {Object} Modal state and control methods
 */
export function useConversionToolsModal() {
  /**
   * Opens the conversion tools modal
   */
  function openModal() {
    isOpen.value = true
  }

  /**
   * Closes the conversion tools modal
   */
  function closeModal() {
    isOpen.value = false
  }

  /**
   * Opens an external tool in a new window
   * @param tool - The conversion tool to open
   */
  function openTool(tool: ConversionTool) {
    window.open(tool.url, '_blank', 'noopener,noreferrer')
  }

  return {
    // State
    isOpen: readonly(isOpen),
    tools: conversionTools,

    // Actions
    openModal,
    closeModal,
    openTool,
  }
}
