/**
 * @fileoverview HTML Export Template
 * @description Wraps rendered markdown in a complete standalone HTML document.
 * Includes GitHub markdown CSS plus the KaTeX and highlight.js stylesheets so
 * exported math and code blocks render the same as the in-app preview.
 *
 * Stylesheet versions are pinned to match the bundled libraries (see package.json).
 *
 * @module utils/export/html-template
 */

const GITHUB_MARKDOWN_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown.min.css'
const KATEX_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.28/katex.min.css'
const HLJS_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css'

/**
 * Wraps HTML content in a complete HTML document with styling.
 * Supports dark mode and print styling.
 *
 * @param {string} content - The rendered HTML content to wrap
 * @returns {string} A complete HTML document as a string
 */
export function wrapHtmlDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <link rel="stylesheet" href="${GITHUB_MARKDOWN_CSS}">
  <link rel="stylesheet" href="${KATEX_CSS}">
  <link rel="stylesheet" href="${HLJS_CSS}">
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
    pre.hljs {
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
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
