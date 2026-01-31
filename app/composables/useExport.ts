/**
 * @fileoverview Export Composable
 * @description Handles copying content to clipboard, downloading files,
 * and uploading markdown files. Provides feedback via screen reader announcements.
 * 
 * @module composables/useExport
 * 
 * @example
 * ```typescript
 * const { copyMarkdown, copyHtml, downloadMarkdown, downloadHtml, uploadMarkdown } = useExport()
 * 
 * // Copy current content to clipboard
 * await copyMarkdown()
 * 
 * // Download as HTML file
 * downloadHtml('my-document.html')
 * 
 * // Upload a markdown file
 * const success = await uploadMarkdown()
 * ```
 */

/**
 * Export composable for copying, downloading, and uploading content.
 * Manages loading and success states for UI feedback.
 * 
 * @returns {Object} Export methods and state
 * @returns {Function} returns.copyMarkdown - Copy markdown to clipboard
 * @returns {Function} returns.copyHtml - Copy rendered HTML to clipboard
 * @returns {Function} returns.downloadMarkdown - Download markdown file
 * @returns {Function} returns.downloadHtml - Download styled HTML file
 * @returns {Function} returns.uploadMarkdown - Upload and load a markdown file
 * @returns {Readonly<Ref<boolean>>} returns.isCopyingMarkdown - Markdown copy in progress
 * @returns {Readonly<Ref<boolean>>} returns.isCopyingHtml - HTML copy in progress
 * @returns {Readonly<Ref<boolean>>} returns.copyMarkdownSuccess - Markdown copy succeeded
 * @returns {Readonly<Ref<boolean>>} returns.copyHtmlSuccess - HTML copy succeeded
 * @returns {Readonly<Ref<boolean>>} returns.isUploading - File upload in progress
 */
/**
 * Timeout ID for clearing the copy status message.
 */
let copyStatusTimeout: ReturnType<typeof setTimeout> | null = null

export function useExport() {
  const { content, setContent } = useEditor()
  const { renderedHtml } = useMarkdown()
  const { announce } = useAccessibility()
  
  /**
   * Shared state for copy status message displayed in status bar.
   * Using useState for proper SSR-safe global state in Nuxt.
   */
  const copyStatusMessage = useState<string>('copy-status-message', () => '')
  
  /**
   * Flag indicating markdown copy is in progress.
   * @type {Ref<boolean>}
   */
  const isCopyingMarkdown = ref(false)
  
  /**
   * Flag indicating HTML copy is in progress.
   * @type {Ref<boolean>}
   */
  const isCopyingHtml = ref(false)
  
  /**
   * Flag indicating markdown was successfully copied.
   * Resets to false after 2 seconds.
   * @type {Ref<boolean>}
   */
  const copyMarkdownSuccess = ref(false)
  
  /**
   * Flag indicating HTML was successfully copied.
   * Resets to false after 2 seconds.
   * @type {Ref<boolean>}
   */
  const copyHtmlSuccess = ref(false)
  
  /**
   * Flag indicating a file upload is in progress.
   * @type {Ref<boolean>}
   */
  const isUploading = ref(false)
  
  /**
   * Shows a copy status message in the header for 3 seconds.
   * @param {string} message - The message to display
   */
  function showCopyStatus(message: string): void {
    // Clear any existing timeout
    if (copyStatusTimeout) {
      clearTimeout(copyStatusTimeout)
    }
    
    // Set the message
    copyStatusMessage.value = message
    
    // Clear after 3 seconds
    copyStatusTimeout = setTimeout(() => {
      copyStatusMessage.value = ''
    }, 3000)
  }
  
  /**
   * Copies the current markdown content to the clipboard.
   * Announces success or failure to screen readers.
   * Shows success state for 2 seconds.
   * 
   * @returns {Promise<boolean>} True if copy was successful, false otherwise
   */
  async function copyMarkdown(): Promise<boolean> {
    isCopyingMarkdown.value = true
    
    try {
      await navigator.clipboard.writeText(content.value)
      copyMarkdownSuccess.value = true
      announce('Markdown copied to clipboard')
      
      // Show success message in status bar
      showCopyStatus('✓ Markdown copied to clipboard')
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        copyMarkdownSuccess.value = false
      }, 2000)
      
      return true
    } catch (e) {
      console.error('Failed to copy markdown:', e)
      announce('Failed to copy markdown to clipboard')
      
      // Show error message in status bar
      showCopyStatus('✗ Failed to copy markdown')
      
      return false
    } finally {
      isCopyingMarkdown.value = false
    }
  }
  
  /**
   * Copies the rendered HTML content to the clipboard.
   * Announces success or failure to screen readers.
   * Shows success state for 2 seconds.
   * 
   * @returns {Promise<boolean>} True if copy was successful, false otherwise
   */
  async function copyHtml(): Promise<boolean> {
    isCopyingHtml.value = true
    
    try {
      await navigator.clipboard.writeText(renderedHtml.value)
      copyHtmlSuccess.value = true
      announce('HTML copied to clipboard')
      
      // Show success message in status bar
      showCopyStatus('✓ HTML copied to clipboard')
      
      setTimeout(() => {
        copyHtmlSuccess.value = false
      }, 2000)
      
      return true
    } catch (e) {
      console.error('Failed to copy HTML:', e)
      announce('Failed to copy HTML to clipboard')
      
      // Show error message in status bar
      showCopyStatus('✗ Failed to copy HTML')
      
      return false
    } finally {
      isCopyingHtml.value = false
    }
  }
  
  /**
   * Downloads a Blob as a file by creating a temporary link and clicking it.
   * Cleans up the URL object after download starts.
   * 
   * @param {Blob} blob - The blob to download
   * @param {string} filename - The filename for the download
   * @returns {void}
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  /**
   * Downloads the current content as a markdown file.
   * Announces the download to screen readers.
   * 
   * @param {string} [filename='document.md'] - The filename for the download
   * @returns {void}
   */
  function downloadMarkdown(filename = 'document.md'): void {
    const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, filename)
    announce(`Downloaded ${filename}`)
  }
  
  /**
   * Downloads the rendered content as a styled HTML file.
   * Includes GitHub markdown CSS for proper styling.
   * Announces the download to screen readers.
   * 
   * @param {string} [filename='document.html'] - The filename for the download
   * @returns {void}
   */
  function downloadHtml(filename = 'document.html'): void {
    const fullHtml = wrapHtmlDocument(renderedHtml.value)
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, filename)
    announce(`Downloaded ${filename}`)
  }
  
  /**
   * Opens a file picker and loads the selected markdown file into the editor.
   * Accepts .md, .markdown, and .txt files.
   * Announces success or failure to screen readers.
   * 
   * @returns {Promise<boolean>} Resolves with true on success, false on cancel or error
   */
  function uploadMarkdown(): Promise<boolean> {
    return new Promise((resolve) => {
      isUploading.value = true
      
      // Create hidden file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.txt,text/markdown,text/plain'
      input.style.display = 'none'
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          isUploading.value = false
          resolve(false)
          return
        }
        
        try {
          const text = await file.text()
          setContent(text)
          announce(`Loaded ${file.name}`)
          resolve(true)
        } catch (err) {
          console.error('Failed to read file:', err)
          announce('Failed to load file')
          resolve(false)
        } finally {
          isUploading.value = false
          document.body.removeChild(input)
        }
      }
      
      input.oncancel = () => {
        isUploading.value = false
        document.body.removeChild(input)
        resolve(false)
      }
      
      document.body.appendChild(input)
      input.click()
    })
  }
  
  return {
    copyMarkdown,
    copyHtml,
    downloadMarkdown,
    downloadHtml,
    uploadMarkdown,
    isCopyingMarkdown: readonly(isCopyingMarkdown),
    isCopyingHtml: readonly(isCopyingHtml),
    copyMarkdownSuccess: readonly(copyMarkdownSuccess),
    copyHtmlSuccess: readonly(copyHtmlSuccess),
    isUploading: readonly(isUploading),
    copyStatusMessage,
  }
}

/**
 * Wraps HTML content in a complete HTML document with styling.
 * Includes GitHub markdown CSS for consistent rendering.
 * Supports dark mode and print styling.
 * 
 * @param {string} content - The HTML content to wrap
 * @returns {string} A complete HTML document as a string
 */
function wrapHtmlDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background: #0d1117;
      color: #c9d1d9;
    }
    .markdown-body {
      background: transparent;
    }
    @media (max-width: 767px) {
      body { padding: 15px; }
    }
    @media print {
      body {
        background: white;
        color: black;
      }
    }
  </style>
</head>
<body class="markdown-body">
${content}
</body>
</html>`
}
