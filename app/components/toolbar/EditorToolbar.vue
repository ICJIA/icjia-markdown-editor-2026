<script setup lang="ts">
/**
 * Editor Toolbar Component
 * Contains all formatting buttons with keyboard shortcuts
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */

const { 
  toggleBold, 
  toggleItalic, 
  toggleInlineCode,
  insertCodeBlock,
  insertHeading,
  insertBlockquote,
  insertBulletList,
  insertNumberedList,
  insertHorizontalRule,
  insertLink,
  undo,
  redo,
} = useEditor()

const { openTableBuilder } = useTableBuilderModal()
const { openModal: openDownloadModal } = useDownloadModal()

const { copyMarkdown, copyHtml, downloadMarkdown, downloadHtml, uploadMarkdown, copyMarkdownSuccess, copyHtmlSuccess } = useExport()
const { announce } = useAccessibility()
const { enabled: scrollSyncEnabled, toggle: toggleScrollSync } = useScrollSync()

// Mobile menu state
const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

// Execute action and close menu
function mobileAction(action: () => void) {
  action()
  closeMobileMenu()
}

function handleToggleScrollSync() {
  const wasEnabled = scrollSyncEnabled.value
  toggleScrollSync()
  // Announce the NEW state after toggling
  announce(wasEnabled ? 'Scroll sync disabled' : 'Scroll sync enabled')
}

// Handle undo/redo actions
function handleUndo() {
  if (undo()) {
    announce('Undo')
  }
}

function handleRedo() {
  if (redo()) {
    announce('Redo')
  }
}

// Handle formatting actions
function handleBold() {
  toggleBold()
  announce('Bold formatting applied')
}

function handleItalic() {
  toggleItalic()
  announce('Italic formatting applied')
}

function handleInlineCode() {
  toggleInlineCode()
  announce('Inline code formatting applied')
}

function handleCodeBlock() {
  insertCodeBlock()
  announce('Code block inserted')
}

function handleHeading(level: number) {
  insertHeading(level)
  announce(`Heading ${level} inserted`)
}

function handleQuote() {
  insertBlockquote()
  announce('Block quote inserted')
}

function handleBulletList() {
  insertBulletList()
  announce('Bullet list item inserted')
}

function handleNumberedList() {
  insertNumberedList()
  announce('Numbered list item inserted')
}

function handleHorizontalRule() {
  insertHorizontalRule()
  announce('Horizontal rule inserted')
}

function handleLink() {
  insertLink()
  announce('Link inserted')
}

function handleCopyMarkdown() {
  copyMarkdown()
}

function handleCopyHtml() {
  copyHtml()
}

async function handleDownloadMarkdown() {
  const filename = await openDownloadModal('markdown')
  if (filename) {
    downloadMarkdown(filename)
  }
}

async function handleDownloadHtml() {
  const filename = await openDownloadModal('html')
  if (filename) {
    downloadHtml(filename)
  }
}

function handleUploadMarkdown() {
  uploadMarkdown()
}

// Heading items for dropdown menu (Nuxt UI v4 format)
const headingItems = [
  [
    {
      label: 'Heading 1',
      kbds: ['⌘', '1'],
      click: () => handleHeading(1),
    },
    {
      label: 'Heading 2',
      kbds: ['⌘', '2'],
      click: () => handleHeading(2),
    },
    {
      label: 'Heading 3',
      kbds: ['⌘', '3'],
      click: () => handleHeading(3),
    },
    {
      label: 'Heading 4',
      kbds: ['⌘', '4'],
      click: () => handleHeading(4),
    },
    {
      label: 'Heading 5',
      kbds: ['⌘', '5'],
      click: () => handleHeading(5),
    },
    {
      label: 'Heading 6',
      kbds: ['⌘', '6'],
      click: () => handleHeading(6),
    },
  ],
]

// Mobile menu items organized by section
const mobileMenuSections = [
  {
    title: 'History',
    items: [
      { icon: 'i-heroicons-arrow-uturn-left', label: 'Undo', action: handleUndo },
      { icon: 'i-heroicons-arrow-uturn-right', label: 'Redo', action: handleRedo },
    ]
  },
  {
    title: 'Formatting',
    items: [
      { icon: 'i-heroicons-bold', label: 'Bold', action: handleBold },
      { icon: 'i-heroicons-italic', label: 'Italic', action: handleItalic },
      { icon: 'i-heroicons-code-bracket', label: 'Inline Code', action: handleInlineCode },
    ]
  },
  {
    title: 'Headings',
    items: [
      { icon: 'i-lucide-heading-1', label: 'Heading 1', action: () => handleHeading(1) },
      { icon: 'i-lucide-heading-2', label: 'Heading 2', action: () => handleHeading(2) },
      { icon: 'i-lucide-heading-3', label: 'Heading 3', action: () => handleHeading(3) },
    ]
  },
  {
    title: 'Blocks',
    items: [
      { icon: 'i-heroicons-chat-bubble-bottom-center-text', label: 'Block Quote', action: handleQuote },
      { icon: 'i-heroicons-code-bracket-square', label: 'Code Block', action: handleCodeBlock },
      { icon: 'i-heroicons-minus', label: 'Horizontal Rule', action: handleHorizontalRule },
    ]
  },
  {
    title: 'Lists',
    items: [
      { icon: 'i-heroicons-list-bullet', label: 'Bullet List', action: handleBulletList },
      { icon: 'i-heroicons-numbered-list', label: 'Numbered List', action: handleNumberedList },
    ]
  },
  {
    title: 'Insert',
    items: [
      { icon: 'i-heroicons-table-cells', label: 'Table', action: openTableBuilder },
      { icon: 'i-heroicons-link', label: 'Link', action: handleLink },
    ]
  },
  {
    title: 'File',
    items: [
      { icon: 'i-heroicons-arrow-up-tray', label: 'Upload', action: handleUploadMarkdown },
      { icon: 'i-heroicons-arrow-down-tray', label: 'Download', action: handleDownloadMarkdown },
      { icon: 'i-heroicons-clipboard-document', label: 'Copy Markdown', action: handleCopyMarkdown },
      { icon: 'i-heroicons-code-bracket', label: 'Copy HTML', action: handleCopyHtml },
    ]
  },
]
</script>

<template>
  <div class="toolbar-container">
    <!-- Mobile hamburger menu button -->
    <div class="mobile-toolbar">
      <button
        type="button"
        class="hamburger-button"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Toggle formatting menu"
        @click="toggleMobileMenu"
      >
        <UIcon :name="isMobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="hamburger-icon" />
        <span class="hamburger-text">Format</span>
      </button>
      
      <!-- Scroll sync toggle - always visible on mobile -->
      <button
        type="button"
        :aria-label="`${scrollSyncEnabled ? 'Scroll Sync ON' : 'Scroll Sync OFF'}. Click to toggle.`"
        :aria-pressed="scrollSyncEnabled"
        class="mobile-scroll-sync"
        :class="scrollSyncEnabled ? 'scroll-sync-on' : 'scroll-sync-off'"
        @click="handleToggleScrollSync"
      >
        <UIcon name="i-heroicons-arrows-up-down" class="mobile-sync-icon" />
      </button>
      
      <!-- Quick actions on mobile -->
      <div class="mobile-quick-actions">
        <button type="button" class="quick-action-btn" aria-label="Upload" @click="handleUploadMarkdown">
          <UIcon name="i-heroicons-arrow-up-tray" />
        </button>
        <button type="button" class="quick-action-btn" aria-label="Download" @click="handleDownloadMarkdown">
          <UIcon name="i-heroicons-arrow-down-tray" />
        </button>
      </div>
    </div>
    
    <!-- Mobile menu panel -->
    <Transition name="slide">
      <div v-if="isMobileMenuOpen" id="mobile-menu" class="mobile-menu-panel">
        <div class="mobile-menu-content">
          <div 
            v-for="section in mobileMenuSections" 
            :key="section.title" 
            class="mobile-menu-section"
          >
            <h3 class="mobile-menu-section-title">{{ section.title }}</h3>
            <div class="mobile-menu-items">
              <button
                v-for="item in section.items"
                :key="item.label"
                type="button"
                class="mobile-menu-item"
                @click="mobileAction(item.action)"
              >
                <UIcon :name="item.icon" class="mobile-menu-item-icon" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Desktop toolbar -->
    <div class="editor-toolbar desktop-toolbar" role="toolbar" aria-label="Formatting toolbar">
      <!-- Undo/Redo group -->
      <div class="toolbar-group" role="group" aria-label="History" data-tour="history">
      <ToolbarButton 
        icon="i-heroicons-arrow-uturn-left" 
        label="Undo" 
        shortcut="Mod+Z"
        @click="handleUndo" 
      />
      <ToolbarButton 
        icon="i-heroicons-arrow-uturn-right" 
        label="Redo" 
        shortcut="Mod+Shift+Z"
        @click="handleRedo" 
      />
    </div>
    
    <ToolbarDivider />
    
    <!-- Text formatting group -->
    <div class="toolbar-group" role="group" aria-label="Text formatting" data-tour="formatting">
      <ToolbarButton 
        icon="i-heroicons-bold" 
        label="Bold" 
        shortcut="Mod+B"
        @click="handleBold" 
      />
      <ToolbarButton 
        icon="i-heroicons-italic" 
        label="Italic" 
        shortcut="Mod+I"
        @click="handleItalic" 
      />
      <ToolbarButton 
        icon="i-heroicons-code-bracket" 
        label="Inline code" 
        shortcut="Mod+`"
        @click="handleInlineCode" 
      />
    </div>
    
    <ToolbarDivider />
    
    <!-- Headings group -->
    <div class="toolbar-group" role="group" aria-label="Headings" data-tour="headings">
      <UDropdownMenu 
        :items="headingItems"
        :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
        class="heading-dropdown"
      >
        <UTooltip
          text="Headings"
          :kbds="['meta', '1-6']"
          :content="{ side: 'top', sideOffset: 8 }"
        >
          <UButton
            icon="i-lucide-heading"
            aria-label="Insert heading"
            class="toolbar-button"
            variant="soft"
            color="neutral"
            size="sm"
            square
          />
        </UTooltip>
      </UDropdownMenu>
    </div>
    
    <ToolbarDivider />
    
    <!-- Block formatting group -->
    <div class="toolbar-group" role="group" aria-label="Block formatting" data-tour="blocks">
      <ToolbarButton 
        icon="i-heroicons-chat-bubble-bottom-center-text" 
        label="Block quote" 
        shortcut="Mod+Q"
        @click="handleQuote" 
      />
      <ToolbarButton 
        icon="i-heroicons-code-bracket-square" 
        label="Code block" 
        shortcut="Mod+Shift+`"
        @click="handleCodeBlock" 
      />
      <ToolbarButton 
        icon="i-heroicons-minus" 
        label="Horizontal rule" 
        shortcut="Mod+-"
        @click="handleHorizontalRule" 
      />
    </div>
    
    <ToolbarDivider />
    
    <!-- List formatting group -->
    <div class="toolbar-group" role="group" aria-label="Lists" data-tour="lists">
      <ToolbarButton 
        icon="i-heroicons-list-bullet" 
        label="Bullet list" 
        shortcut="Mod+Shift+8"
        @click="handleBulletList" 
      />
      <ToolbarButton 
        icon="i-heroicons-numbered-list" 
        label="Numbered list" 
        shortcut="Mod+Shift+7"
        @click="handleNumberedList" 
      />
    </div>
    
    <ToolbarDivider />
    
    <!-- Insert group -->
    <div class="toolbar-group" role="group" aria-label="Insert" data-tour="insert">
      <ToolbarButton
        icon="i-heroicons-table-cells"
        label="Insert table"
        shortcut="Mod+Alt+T"
        @click="openTableBuilder"
      />
      <ToolbarButton 
        icon="i-heroicons-link" 
        label="Insert link" 
        shortcut="Mod+K"
        @click="handleLink" 
      />
    </div>

    <ToolbarDivider />
    
    <!-- Scroll sync toggle - highly visible with text label -->
    <div class="toolbar-group" role="group" aria-label="Scroll sync" data-tour="scroll-sync">
      <button
        type="button"
        :aria-label="`${scrollSyncEnabled ? 'Scroll Sync ON' : 'Scroll Sync OFF'}. Click to toggle.`"
        :aria-pressed="scrollSyncEnabled"
        class="status-toggle scroll-sync-toggle"
        :class="scrollSyncEnabled ? 'scroll-sync-on' : 'scroll-sync-off'"
        @click="handleToggleScrollSync"
      >
        <UIcon name="i-heroicons-arrows-up-down" class="status-icon" />
        <span class="status-label">{{ scrollSyncEnabled ? 'Scroll Sync ON' : 'Scroll Sync OFF' }}</span>
      </button>
    </div>
    
    <!-- Spacer to push right-side elements -->
    <div class="toolbar-spacer" />
    
    <!-- File operations group -->
    <div class="toolbar-group" role="group" aria-label="File operations" data-tour="file-ops">
      <ToolbarButton 
        icon="i-heroicons-arrow-up-tray" 
        label="Upload Markdown" 
        shortcut="Mod+O"
        @click="handleUploadMarkdown" 
      />
      <ToolbarButton 
        icon="i-heroicons-arrow-down-tray" 
        label="Download Markdown" 
        shortcut="Mod+S"
        @click="handleDownloadMarkdown" 
      />
    </div>
    
    <ToolbarDivider />
    
      <!-- Export group -->
      <div class="toolbar-group" role="group" aria-label="Export" data-tour="export">
        <ToolbarButton 
          icon="i-heroicons-clipboard-document"
          :label="copyMarkdownSuccess ? 'Copied!' : 'Copy Markdown'"
          shortcut="Mod+Shift+C"
          :active="copyMarkdownSuccess"
          @click="handleCopyMarkdown" 
        />
        <ToolbarButton 
          icon="i-heroicons-code-bracket"
          :label="copyHtmlSuccess ? 'Copied!' : 'Copy HTML'"
          shortcut="Mod+Shift+H"
          :active="copyHtmlSuccess"
          @click="handleCopyHtml" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toolbar container */
.toolbar-container {
  background: var(--color-surface, #1e293b);
  border-bottom: 1px solid var(--color-border, #334155);
}

/* Mobile toolbar - hamburger and quick actions */
.mobile-toolbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  gap: 0.5rem;
}

.hamburger-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hamburger-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.hamburger-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.hamburger-text {
  /* Label text */
}

.mobile-scroll-sync {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mobile-scroll-sync.scroll-sync-on {
  background-color: #166534;
  border-color: #22c55e;
  color: #ffffff;
}

.mobile-scroll-sync.scroll-sync-off {
  background-color: #7f1d1d;
  border-color: #ef4444;
  color: #fca5a5;
}

.mobile-sync-icon {
  width: 1rem;
  height: 1rem;
}

.mobile-quick-actions {
  display: flex;
  gap: 0.25rem;
}

.quick-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
}

.quick-action-btn :deep(svg) {
  width: 1rem;
  height: 1rem;
}

/* Mobile menu panel */
.mobile-menu-panel {
  background: var(--color-surface, #1e293b);
  border-top: 1px solid var(--color-border, #334155);
  max-height: 60vh;
  overflow-y: auto;
}

.mobile-menu-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 0.75rem;
}

@media (min-width: 400px) {
  .mobile-menu-content {
    grid-template-columns: repeat(3, 1fr);
  }
}

.mobile-menu-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.mobile-menu-section-title {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 0.375rem 0;
  padding: 0 0.25rem;
}

.mobile-menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  color: #e2e8f0;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.mobile-menu-item:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #ffffff;
}

.mobile-menu-item-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: #94a3b8;
}

.mobile-menu-item:hover .mobile-menu-item-icon {
  color: #3b82f6;
}

/* Slide transition for mobile menu */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 60vh;
}

/* Desktop toolbar */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  flex-wrap: nowrap;
  min-height: 3.5rem;
  overflow-x: auto;
  overflow-y: visible;
}

/* Hide scrollbar but allow scrolling */
.editor-toolbar::-webkit-scrollbar {
  height: 0;
  display: none;
}

/* Responsive: show mobile toolbar, hide desktop on small screens */
@media (max-width: 768px) {
  .mobile-toolbar {
    display: flex;
  }
  
  .desktop-toolbar {
    display: none;
  }
}

/* Light mode adjustments */
.light .mobile-menu-section {
  background: rgba(0, 0, 0, 0.05);
}

.light .mobile-menu-item {
  color: #1e293b;
}

.light .mobile-menu-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.light .mobile-menu-item-icon {
  color: #64748b;
}

.light .quick-action-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #64748b;
  border-color: rgba(0, 0, 0, 0.1);
}

.light .quick-action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1e293b;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.toolbar-spacer {
  flex: 1;
  min-width: 1rem;
  flex-shrink: 1;
}

/* Shared status toggle button styles */
.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 2px solid;
  white-space: nowrap;
}

.status-toggle:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.status-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.status-label {
  line-height: 1;
}

/* Scroll Sync ON state - Green with accessible contrast */
.scroll-sync-toggle.scroll-sync-on {
  background-color: #166534;
  border-color: #22c55e;
  color: #ffffff;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
}

.scroll-sync-toggle.scroll-sync-on:hover {
  background-color: #15803d;
  border-color: #4ade80;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
}

/* Scroll Sync OFF state - Red */
.scroll-sync-toggle.scroll-sync-off {
  background-color: #7f1d1d;
  border-color: #ef4444;
  color: #fca5a5;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

.scroll-sync-toggle.scroll-sync-off:hover {
  background-color: #991b1b;
  border-color: #f87171;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
}

/* Fade transition for save indicator */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive: compact on smaller screens */
@media (max-width: 768px) {
  .status-toggle {
    font-size: 0.6rem;
    padding: 0.25rem 0.375rem;
  }
  
  .status-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

@media (max-width: 640px) {
  .editor-toolbar {
    gap: 0.125rem;
    padding: 0.375rem 0.5rem;
  }
  
  .toolbar-spacer {
    min-width: 0.5rem;
  }
  
  /* Hide text label on small screens, keep icon */
  .status-label {
    display: none;
  }
  
  .status-toggle {
    padding: 0.25rem;
  }
}
</style>

<style>
/* Heading dropdown menu styling - must be unscoped to target portal content */
[data-radix-popper-content-wrapper] [role="menu"] {
  background-color: #171717 !important;
  border: 1px solid #404040 !important;
  border-radius: 0.5rem !important;
  padding: 0.5rem 0.75rem !important;
  min-width: 180px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4) !important;
}

[data-radix-popper-content-wrapper] [role="menuitem"] {
  padding: 0.5rem 0.75rem !important;
  border-radius: 0.375rem !important;
  margin: 0.125rem 0 !important;
}

[data-radix-popper-content-wrapper] [role="menuitem"]:hover {
  background-color: #262626 !important;
}
</style>
