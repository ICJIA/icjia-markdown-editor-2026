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
} = useEditor()

const { openTableBuilder } = useTableBuilderModal()
const { openModal: openDownloadModal } = useDownloadModal()

const { copyMarkdown, copyHtml, downloadMarkdown, downloadHtml, uploadMarkdown, copyMarkdownSuccess, copyHtmlSuccess } = useExport()
const { announce } = useAccessibility()

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
</script>

<template>
  <div class="editor-toolbar" role="toolbar" aria-label="Formatting toolbar">
    <!-- Text formatting group -->
    <div class="toolbar-group" role="group" aria-label="Text formatting">
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
    <div class="toolbar-group" role="group" aria-label="Headings">
      <UTooltip
        text="Headings"
        :kbds="['meta', '1-6']"
        :content="{ side: 'top', sideOffset: 8 }"
      >
        <UDropdownMenu 
          :items="headingItems"
          :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
          class="heading-dropdown"
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
        </UDropdownMenu>
      </UTooltip>
    </div>
    
    <ToolbarDivider />
    
    <!-- Block formatting group -->
    <div class="toolbar-group" role="group" aria-label="Block formatting">
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
    <div class="toolbar-group" role="group" aria-label="Lists">
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
    <div class="toolbar-group" role="group" aria-label="Insert">
      <ToolbarButton 
        icon="i-heroicons-table-cells" 
        label="Insert table" 
        shortcut="Mod+T"
        @click="openTableBuilder" 
      />
      <ToolbarButton 
        icon="i-heroicons-link" 
        label="Insert link" 
        shortcut="Mod+K"
        @click="handleLink" 
      />
    </div>

    <!-- Spacer to push export buttons to the right -->
    <div class="toolbar-spacer" />
    
    <!-- File operations group -->
    <div class="toolbar-group" role="group" aria-label="File operations">
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
    <div class="toolbar-group" role="group" aria-label="Export">
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
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-surface, #1e293b);
  border-bottom: 1px solid var(--color-border, #334155);
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

/* Responsive: compact on smaller screens */
@media (max-width: 640px) {
  .editor-toolbar {
    gap: 0.125rem;
    padding: 0.375rem 0.5rem;
  }
  
  .toolbar-spacer {
    min-width: 0.5rem;
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
