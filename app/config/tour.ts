/**
 * @fileoverview Tour Configuration for ICJIA Markdown Editor
 * @description App-specific tour steps and settings.
 * Edit this file to customize the onboarding experience.
 * 
 * @module config/tour
 */

import type { TourConfig } from '~/modules/tour/types'

/**
 * Tour configuration for the ICJIA Markdown Editor.
 * 
 * To add a new step:
 * 1. Add a data-tour="step-id" attribute to the target element
 * 2. Add a new entry to the steps array below
 * 
 * To remove a step:
 * 1. Delete the entry from the steps array
 * 2. Optionally remove the data-tour attribute from the element
 * 
 * To force users to see the tour again after major changes:
 * 1. Increment the version number
 */
export const tourConfig: TourConfig = {
  /**
   * Tour version - increment to reset completion for all users.
   * Users who completed v1 will see v2 as a new tour.
   */
  version: 1,

  /**
   * Auto-start the tour for first-time visitors.
   * They can still cancel immediately if they prefer.
   */
  autoStart: true,

  /**
   * Delay before auto-starting (ms).
   * Allows the UI to fully render before showing the tour.
   */
  autoStartDelay: 1000,

  /**
   * LocalStorage key prefix.
   * Full key will be: icjia-markdown-editor-tour-v1
   */
  storageKeyPrefix: 'icjia-markdown-editor-tour',

  /**
   * Tour steps in display order.
   * Each step highlights a feature group and explains its purpose.
   */
  steps: [
    // =========================================================================
    // STEP 1: TEXT FORMATTING
    // =========================================================================
    {
      id: 'formatting',
      target: '[data-tour="formatting"]',
      title: 'Text Formatting',
      content: 'Apply bold, italic, and inline code formatting to your text. These are the most common formatting options.',
      tip: 'Hover over any button to see its keyboard shortcut.',
      position: 'bottom',
      icon: 'i-heroicons-bold'
    },

    // =========================================================================
    // STEP 2: HEADINGS
    // =========================================================================
    {
      id: 'headings',
      target: '[data-tour="headings"]',
      title: 'Headings',
      content: 'Insert headings from H1 (largest) to H6 (smallest). Click to open the menu and select a heading level.',
      shortcut: ['⌘', '1-6'],
      position: 'bottom',
      icon: 'i-lucide-heading'
    },

    // =========================================================================
    // STEP 3: BLOCK ELEMENTS
    // =========================================================================
    {
      id: 'blocks',
      target: '[data-tour="blocks"]',
      title: 'Block Elements',
      content: 'Insert block quotes for citations, code blocks for programming snippets, and horizontal rules to separate sections.',
      position: 'bottom',
      icon: 'i-heroicons-chat-bubble-bottom-center-text'
    },

    // =========================================================================
    // STEP 4: LISTS
    // =========================================================================
    {
      id: 'lists',
      target: '[data-tour="lists"]',
      title: 'Lists',
      content: 'Create bulleted (unordered) or numbered (ordered) lists to organize your content.',
      position: 'bottom',
      icon: 'i-heroicons-list-bullet'
    },

    // =========================================================================
    // STEP 5: TABLES & LINKS
    // =========================================================================
    {
      id: 'insert',
      target: '[data-tour="insert"]',
      title: 'Tables & Links',
      content: 'Insert tables using the visual table builder, or add hyperlinks to reference external content.',
      shortcut: ['⌘', 'T'],
      position: 'bottom',
      icon: 'i-heroicons-table-cells'
    },

    // =========================================================================
    // STEP 6: SCROLL SYNC (IMPORTANT FEATURE)
    // =========================================================================
    {
      id: 'scroll-sync',
      target: '[data-tour="scroll-sync"]',
      title: 'Scroll Synchronization',
      content: 'When enabled (green), scrolling the editor automatically scrolls the preview to the same position—and vice versa.',
      tip: 'Disable this if you prefer to scroll each pane independently.',
      position: 'bottom',
      highlight: true,
      icon: 'i-heroicons-arrows-up-down'
    },

    // =========================================================================
    // STEP 7: AUTO-SAVE (CRITICAL TO EXPLAIN)
    // =========================================================================
    {
      id: 'auto-save',
      target: '[data-tour="auto-save"]',
      title: 'Auto-Save (Browser Only)',
      content: 'Your work is automatically saved to your browser\'s local storage every few seconds. The green indicator appears briefly when saved.',
      tip: 'This is NOT saved to a file on your computer. Use the Download button to save a permanent copy.',
      position: 'bottom',
      highlight: true,
      icon: 'i-heroicons-check-circle'
    },

    // =========================================================================
    // STEP 8: FILE OPERATIONS
    // =========================================================================
    {
      id: 'file-ops',
      target: '[data-tour="file-ops"]',
      title: 'Upload & Download',
      content: 'Upload an existing Markdown file to continue editing, or download your work as a .md file to save permanently.',
      shortcut: ['⌘', 'S'],
      position: 'bottom',
      icon: 'i-heroicons-arrow-down-tray'
    },

    // =========================================================================
    // STEP 9: EXPORT OPTIONS
    // =========================================================================
    {
      id: 'export',
      target: '[data-tour="export"]',
      title: 'Copy to Clipboard',
      content: 'Copy your content as Markdown or HTML, ready to paste into emails, documents, or other applications.',
      shortcut: ['⌘', 'Shift', 'C'],
      position: 'bottom',
      icon: 'i-heroicons-clipboard-document'
    },

    // =========================================================================
    // STEP 10: EDITOR PANE
    // =========================================================================
    {
      id: 'editor-pane',
      target: '[data-tour="editor-pane"]',
      title: 'Markdown Editor',
      content: 'Write your content here using Markdown syntax. The editor provides syntax highlighting and supports all standard Markdown features.',
      position: 'right',
      icon: 'i-heroicons-pencil-square'
    },

    // =========================================================================
    // STEP 11: PREVIEW PANE
    // =========================================================================
    {
      id: 'preview-pane',
      target: '[data-tour="preview-pane"]',
      title: 'Live Preview',
      content: 'See your formatted content in real-time as you type. This is exactly how your document will appear when exported.',
      position: 'left',
      icon: 'i-heroicons-eye'
    },

    // =========================================================================
    // STEP 12: VIEW MODE TOGGLE (in header)
    // =========================================================================
    {
      id: 'view-mode',
      target: '[data-tour="view-mode"]',
      title: 'View Modes',
      content: 'Toggle between split view (both panes), editor-only, or preview-only modes. Click to cycle through views—useful on smaller screens or when you want to focus on writing.',
      tip: 'Find this button in the header for quick access anytime.',
      position: 'bottom',
      icon: 'i-heroicons-squares-2x2'
    }
  ]
}
