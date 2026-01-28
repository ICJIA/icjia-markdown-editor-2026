/**
 * Export Composable
 * Handles copying, downloading, and uploading markdown/HTML content
 */

export function useExport() {
  const { content, setContent } = useEditor()
  const { renderedHtml } = useMarkdown()
  const { announce } = useAccessibility()
  
  // Copy states
  const isCopyingMarkdown = ref(false)
  const isCopyingHtml = ref(false)
  const copyMarkdownSuccess = ref(false)
  const copyHtmlSuccess = ref(false)
  
  // Upload state
  const isUploading = ref(false)
  
  /**
   * Copy markdown content to clipboard
   */
  async function copyMarkdown(): Promise<boolean> {
    isCopyingMarkdown.value = true
    
    try {
      await navigator.clipboard.writeText(content.value)
      copyMarkdownSuccess.value = true
      announce('Markdown copied to clipboard')
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        copyMarkdownSuccess.value = false
      }, 2000)
      
      return true
    } catch (e) {
      console.error('Failed to copy markdown:', e)
      announce('Failed to copy markdown to clipboard')
      return false
    } finally {
      isCopyingMarkdown.value = false
    }
  }
  
  /**
   * Copy rendered HTML to clipboard
   */
  async function copyHtml(): Promise<boolean> {
    isCopyingHtml.value = true
    
    try {
      await navigator.clipboard.writeText(renderedHtml.value)
      copyHtmlSuccess.value = true
      announce('HTML copied to clipboard')
      
      setTimeout(() => {
        copyHtmlSuccess.value = false
      }, 2000)
      
      return true
    } catch (e) {
      console.error('Failed to copy HTML:', e)
      announce('Failed to copy HTML to clipboard')
      return false
    } finally {
      isCopyingHtml.value = false
    }
  }
  
  /**
   * Download content as a file
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
   * Download markdown file
   */
  function downloadMarkdown(filename = 'document.md'): void {
    const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, filename)
    announce(`Downloaded ${filename}`)
  }
  
  /**
   * Download HTML file with styling
   */
  function downloadHtml(filename = 'document.html'): void {
    const fullHtml = wrapHtmlDocument(renderedHtml.value)
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, filename)
    announce(`Downloaded ${filename}`)
  }
  
  /**
   * Upload and load a markdown file
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
  }
}

/**
 * Wrap HTML content in a full document with styling
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
