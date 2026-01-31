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
   * v2: Added Conversion Tools step
   * v3: Added Word Count step, moved Reset to bottom toolbar
   * v4: Reordered steps, added Win shortcuts
   * v5: Added Undo/Redo step, reordered to toolbar → header → panes → status bar
   * v6: Moved Tour button to status bar, added Tour button step
   * v7: Added GitHub link step highlighting open source project
   */
  version: 7,

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
   * Order: Toolbar (left to right), Header (left to right), Editor/Preview panes, Status bar
   */
  steps: [
    // =========================================================================
    // TOOLBAR ROW (Left to right - main working area first)
    // =========================================================================
    {
      id: 'history',
      target: '[data-tour="history"]',
      title: 'Undo & Redo',
      content: 'Made a mistake? Use Undo to revert changes, or Redo to restore them. These work just like in any text editor.',
      shortcut: ['⌘', 'Z'],
      shortcutWin: ['Ctrl', 'Z'],
      position: 'bottom',
      icon: 'i-heroicons-arrow-uturn-left'
    },

    {
      id: 'formatting',
      target: '[data-tour="formatting"]',
      title: 'Text Formatting',
      content: 'Apply bold, italic, and inline code formatting to your text. These are the most common formatting options.',
      shortcut: ['⌘', 'B'],
      shortcutWin: ['Ctrl', 'B'],
      position: 'bottom',
      icon: 'i-heroicons-bold'
    },

    {
      id: 'headings',
      target: '[data-tour="headings"]',
      title: 'Headings',
      content: 'Insert headings from H1 (largest) to H6 (smallest). Click to open the menu and select a heading level.',
      shortcut: ['⌘', '1-6'],
      shortcutWin: ['Ctrl', '1-6'],
      position: 'bottom',
      icon: 'i-lucide-heading'
    },

    {
      id: 'blocks',
      target: '[data-tour="blocks"]',
      title: 'Block Elements',
      content: 'Insert block quotes for citations, code blocks for programming snippets, and horizontal rules to separate sections.',
      position: 'bottom',
      icon: 'i-heroicons-chat-bubble-bottom-center-text'
    },

    {
      id: 'lists',
      target: '[data-tour="lists"]',
      title: 'Lists',
      content: 'Create bulleted (unordered) or numbered (ordered) lists to organize your content.',
      position: 'bottom',
      icon: 'i-heroicons-list-bullet'
    },

    {
      id: 'insert',
      target: '[data-tour="insert"]',
      title: 'Tables & Links',
      content: 'Insert tables using the visual table builder, or add hyperlinks to reference external content.',
      shortcut: ['⌘', 'T'],
      shortcutWin: ['Ctrl', 'T'],
      position: 'bottom',
      icon: 'i-heroicons-table-cells'
    },

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

    {
      id: 'file-ops',
      target: '[data-tour="file-ops"]',
      title: 'Upload & Download',
      content: 'Upload an existing Markdown file to continue editing, or download your work as a .md file to save permanently.',
      shortcut: ['⌘', 'Shift', 'S'],
      shortcutWin: ['Ctrl', 'Shift', 'S'],
      position: 'bottom',
      icon: 'i-heroicons-arrow-down-tray'
    },

    {
      id: 'export',
      target: '[data-tour="export"]',
      title: 'Copy to Clipboard',
      content: 'Copy your content as Markdown or HTML, ready to paste into emails, documents, or other applications.',
      shortcut: ['⌘', 'Shift', 'C'],
      shortcutWin: ['Ctrl', 'Shift', 'C'],
      position: 'bottom',
      icon: 'i-heroicons-clipboard-document'
    },

    // =========================================================================
    // HEADER CONTROLS (Left to right in top navbar)
    // =========================================================================
    {
      id: 'auto-save',
      target: '[data-tour="auto-save"]',
      title: 'Auto-Save (Browser Only)',
      content: 'Your work is automatically saved to your browser\'s local storage every 30 seconds. Watch the countdown to see when the next save occurs.',
      tip: 'This is NOT saved to a file on your computer. Use the Download button to save a permanent copy.',
      position: 'bottom',
      highlight: true,
      icon: 'i-heroicons-arrow-path'
    },

    {
      id: 'view-mode',
      target: '[data-tour="view-mode"]',
      title: 'View Modes',
      content: 'Toggle between split view (both panes), editor-only, or preview-only modes. Click to cycle through views—useful on smaller screens.',
      position: 'bottom',
      icon: 'i-heroicons-squares-2x2'
    },

    {
      id: 'conversion-tools',
      target: '[data-tour="conversion-tools"]',
      title: 'Conversion Tools',
      content: 'Access external utilities for PDF conversion, image processing, and document format changes. These privacy-first tools process files locally in your browser.',
      tip: 'Tools open in a new window. Your files never leave your device.',
      position: 'bottom',
      icon: 'i-heroicons-wrench-screwdriver'
    },

    {
      id: 'color-mode',
      target: '[data-tour="color-mode"]',
      title: 'Light / Dark Mode',
      content: 'Toggle between light and dark themes. Your preference is saved automatically.',
      position: 'bottom',
      icon: 'i-heroicons-sun'
    },

    // =========================================================================
    // MAIN CONTENT AREA (Left to right)
    // =========================================================================
    {
      id: 'editor-pane',
      target: '[data-tour="editor-pane"]',
      title: 'Markdown Editor',
      content: 'Write your content here using Markdown syntax. The editor provides syntax highlighting and supports all standard Markdown features.',
      position: 'right',
      icon: 'i-heroicons-pencil-square'
    },

    {
      id: 'preview-pane',
      target: '[data-tour="preview-pane"]',
      title: 'Live Preview',
      content: 'See your formatted content in real-time as you type. This is exactly how your document will appear when exported.',
      position: 'left',
      icon: 'i-heroicons-eye'
    },

    // =========================================================================
    // STATUS BAR (Bottom toolbar, left to right)
    // =========================================================================
    {
      id: 'word-count',
      target: '[data-tour="word-count"]',
      title: 'Document Statistics',
      content: 'Track your document\'s word count, character count, and estimated reading time. Hover for additional details like line and paragraph counts.',
      position: 'top',
      icon: 'i-heroicons-chart-bar'
    },

    {
      id: 'tour-button',
      target: '[data-tour="tour-button"]',
      title: 'Guided Tour',
      content: 'Want to see this tour again? Click here anytime to restart the guided walkthrough of all features.',
      position: 'top',
      icon: 'i-heroicons-academic-cap'
    },

    {
      id: 'reset',
      target: '[data-tour="reset"]',
      title: 'Reset Content',
      content: 'Clear your saved content and reset to the default welcome text. Useful for starting fresh or testing the editor.',
      tip: 'This will delete all your current work from browser storage!',
      position: 'top',
      icon: 'i-heroicons-arrow-path'
    },

    {
      id: 'github',
      target: '[data-tour="github"]',
      title: 'GitHub Source Code',
      content: 'This editor is an open source project created by the Illinois Criminal Justice Information Authority (ICJIA). View the source code, report issues, or contribute on GitHub.',
      tip: 'Contributions and feedback are welcome!',
      position: 'top',
      icon: 'i-heroicons-code-bracket'
    }
  ]
}
