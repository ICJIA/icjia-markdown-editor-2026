/**
 * @fileoverview Default Editor Content
 * @description Contains the default tutorial content shown when no saved content
 * exists in localStorage. Extracted to a separate file for maintainability.
 *
 * @module utils/default-content
 */

/**
 * Default content shown when no saved content exists in localStorage.
 * Uses inline code instead of code blocks to avoid Siteimprove SIA-R79 accessibility warnings.
 * @constant {string}
 */
export const DEFAULT_CONTENT = `# Welcome to the ICJIA Markdown Editor 2.0

This is the **updated version** of the ICJIA Markdown Editor, rebuilt from the ground up with modern web technologies. If you used our previous editor from several years ago, you'll find this version faster, more accessible, and packed with new features.

This editor helps you write beautifully formatted documents using **Markdown** — a simple, readable syntax that converts to HTML.

---

## What is Markdown?

**Markdown** is a lightweight markup language that uses simple, readable text formatting to create structured documents. Instead of clicking buttons or using complex formatting tools, you write plain text with special characters to indicate formatting.

**Why use Markdown?**

- **Platform Independent** — Plain text files work everywhere, with no proprietary formats or compatibility issues
- **Human Readable** — The raw text is easy to read even without rendering, unlike HTML or other markup languages
- **Fast & Efficient** — Focus on writing without distractions from menus, toolbars, or formatting delays
- **Web Ready** — Easily converts to HTML for websites, blogs, documentation, and more
- **Widely Supported** — Used by GitHub, Reddit, Stack Overflow, Slack, Discord, and countless other platforms

**Quick Examples:**

- Type \`**bold**\` to make text **bold**
- Type \`*italic*\` to make text *italic*
- Type \`# Heading\` to create a heading
- Type \`[link](url)\` to create a hyperlink

> Markdown was created in 2004 by John Gruber to make writing for the web easier and more readable.

---

## Markdown Is NOT Coding

Despite its technical-sounding name, **Markdown is not programming or coding**—it's just a simple formatting system that anyone can learn in minutes. Think of it as a bridge that converts your everyday documents into web-ready content.

### Converting Documents to Web Format

**The Problem:** Word documents (\`.docx\`) and PDFs can't be displayed directly on websites. Web browsers need HTML to display content properly.

**The Solution:** Markdown acts as a universal translator between desktop documents and web content:

1. **Word → Web**
   - Write or convert your Word document to Markdown
   - Markdown instantly converts to clean HTML for any website
   - No manual recreation or complex web design needed

2. **PDF → Editable**
   - Convert PDFs to Markdown for easy editing
   - Publish online with proper formatting intact
   - Make updates without starting from scratch

3. **Plain Text → Professional**
   - Transform simple text into structured, formatted documents
   - Add headings, lists, tables, and links without coding
   - Export ready-to-publish content in seconds

> **Real-World Example:** Your research team writes reports in Word. Your communications department needs them on the website. Instead of manually recreating each report as a webpage, convert it to Markdown—then it becomes web-ready HTML instantly! No coding knowledge required.

### Why This Matters

- **Saves Time** — No need to learn HTML or web design
- **Maintains Formatting** — Headings, lists, tables, and emphasis carry over perfectly
- **Easy Updates** — Edit the Markdown file and republish in seconds
- **One Source, Many Outputs** — Same Markdown file becomes HTML, PDF, or styled documents

---

## Quick Start Guide

### Text Formatting

| Format | Syntax | Result |
|:-------|:-------|:-------|
| Bold | \`**text**\` or \`__text__\` | **bold text** |
| Italic | \`*text*\` or \`_text_\` | *italic text* |
| Bold + Italic | \`***text***\` | ***both styles*** |
| Strikethrough | \`~~text~~\` | ~~crossed out~~ |
| Inline Code | \`\\\`code\\\`\` | \`code snippet\` |

### Line Breaks & Paragraphs

This is one of the most common sources of confusion for beginners!

**Paragraphs:** Press **Enter twice** (leave a blank line) to create a new paragraph.

**Line breaks:** If you want a line break *without* starting a new paragraph, add **two spaces** at the end of the line, then press Enter once. Or use \`<br>\` for an explicit break.

**Example:**

\`\`\`markdown
This is the first paragraph.

This is the second paragraph (blank line above).

This line has two spaces at the end
so this appears on a new line but same paragraph.
\`\`\`

> **Common mistake:** Pressing Enter once without two trailing spaces will NOT create a visible line break—the text will continue on the same line when rendered.

### Headings

Use hash symbols for headings: \`# H1\`, \`## H2\`, \`### H3\`, and so on up to \`###### H6\`.

### Links and Images

- **Link:** \`[Link Text](https://example.com)\` → [Visit ICJIA](https://icjia.illinois.gov)
- **Image:** \`![Alt text](image-url.jpg)\`

Here's an example image:

![A serene mountain landscape with a lake](/images/sample-landscape.jpg)

*Image: Mountain landscape from Unsplash[^1]*

### Footnotes

Add references with footnotes using \`[^1]\` syntax:

Research shows that data-driven policies improve outcomes[^2]. The Illinois Criminal Justice Information Authority (ICJIA) conducts research to inform evidence-based practices[^3].

[^1]: Photo from Unsplash, free to use under the Unsplash License.
[^2]: Smith, J. (2024). "Evidence-Based Policy Making." *Journal of Public Policy*, 12(3), 45-67.
[^3]: For more information, visit the [ICJIA Research Hub](https://icjia.illinois.gov/researchhub/).

### Task Lists

Create interactive checklists with \`- [ ]\` and \`- [x]\`:

- [x] Write introduction
- [x] Add formatting examples
- [ ] Review and edit
- [ ] Share with team

### Lists

**Unordered list** — use \`-\`, \`*\`, or \`+\`:

- First item
- Second item
  - Nested item
- Third item

**Ordered list** — use numbers:

1. Step one
2. Step two
3. Step three

### Blockquotes

Use \`>\` at the start of a line:

> "The only way to do great work is to love what you do." — Steve Jobs

### Horizontal Rules

Create a horizontal line to separate sections using three or more hyphens, asterisks, or underscores:

\`\`\`markdown
---
***
___
\`\`\`

All three produce a horizontal rule like the ones you see separating sections in this document.

### Code Blocks

For **inline code** (single words or short snippets), wrap text in single backticks: \`\\\`code\\\`\`

For **multi-line code blocks**, use triple backticks with an optional language name for syntax highlighting:

\`\`\`markdown
\\\`\\\`\\\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\\\`\\\`\\\`
\`\`\`

This renders as:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

Common language identifiers: \`javascript\`, \`python\`, \`html\`, \`css\`, \`json\`, \`bash\`, \`sql\`

### Mathematical Notation (LaTeX/KaTeX)

This editor supports mathematical notation using **KaTeX**—a fast math typesetting library. Use LaTeX syntax to write equations.

**Inline Math:** Wrap expressions in single dollar signs \`$...$\`

- Type \`$E = mc^2$\` to get $E = mc^2$
- Type \`$\\alpha + \\beta = \\gamma$\` to get $\\alpha + \\beta = \\gamma$

**Block Math:** Wrap expressions in double dollar signs \`$$...$$\`

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

This is the quadratic formula, written as: \`$$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\`

**Common Math Symbols:**

| Symbol | LaTeX | Result |
|:-------|:------|:-------|
| Fraction | \`$\\frac{a}{b}$\` | $\\frac{a}{b}$ |
| Square root | \`$\\sqrt{x}$\` | $\\sqrt{x}$ |
| Exponent | \`$x^2$\` | $x^2$ |
| Subscript | \`$x_i$\` | $x_i$ |
| Summation | \`$\\sum_{i=1}^n$\` | $\\sum_{i=1}^n$ |
| Greek letters | \`$\\alpha, \\beta, \\pi$\` | $\\alpha, \\beta, \\pi$ |
| Comparison | \`$\\leq, \\geq, \\neq$\` | $\\leq, \\geq, \\neq$ |
| Mean/Average | \`$\\bar{x}$\` | $\\bar{x}$ |

**Example — Statistical Formula:**

$$
\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i
$$

> **Tip:** KaTeX supports hundreds of LaTeX commands. For a complete reference, see the [KaTeX documentation](https://katex.org/docs/supported.html).

### Tables

Create tables with pipes \`|\` and hyphens \`-\`:

| Feature | Status | Notes |
|:--------|:------:|:------|
| Dark Mode | ✅ | Toggle in header |
| Auto-save | ✅ | Saves as you type |
| Export | ✅ | Markdown or HTML |

> **Tip:** Use the Table Builder (⌘ + ⌥ + T on Mac, Ctrl + Alt + T on Windows) for an easier way to create tables!

### Embedding HTML in Markdown

Markdown supports **inline HTML** for cases where you need more control—especially useful for complex tables. This is valid in GitHub Flavored Markdown and most renderers.

**Why use HTML tables?**

- More control over formatting and structure
- Better accessibility with \`<caption>\`, \`<thead>\`, \`<th scope>\` attributes
- Familiar syntax if you know basic HTML
- Works when Markdown tables become unwieldy

**Example — HTML Table Code:**

\`\`\`html
<table>
  <caption>Quarterly Report Summary</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Revenue</th>
      <th scope="col">Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Q1 2025</td>
      <td>$1.2M</td>
      <td>+12%</td>
    </tr>
    <tr>
      <td>Q2 2025</td>
      <td>$1.4M</td>
      <td>+17%</td>
    </tr>
  </tbody>
</table>
\`\`\`

**Rendered Result:**

<table>
  <caption>Quarterly Report Summary</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Revenue</th>
      <th scope="col">Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Q1 2025</td>
      <td>$1.2M</td>
      <td>+12%</td>
    </tr>
    <tr>
      <td>Q2 2025</td>
      <td>$1.4M</td>
      <td>+17%</td>
    </tr>
  </tbody>
</table>

> **Note:** When using HTML in Markdown, leave a blank line before and after the HTML block. The code example above shows the HTML syntax, and directly below it you can see how it renders as a proper accessible table.

> **⚠️ Caution:** While embedding HTML in Markdown is valid, it **increases complexity** and creates a higher potential for errors. You're mixing two different syntaxes, which can make files harder to read, edit, and maintain. Use HTML sparingly—only when Markdown tables can't meet your needs (e.g., accessibility requirements, complex layouts, or row/column spanning).

### Escaping Special Characters

Sometimes you want to display characters that normally trigger formatting. Use a backslash \`\\\` to escape them:

| Character | Escaped | Result |
|:----------|:--------|:-------|
| Asterisk | \`\\*text\\*\` | \*text\* |
| Underscore | \`\\_text\\_\` | \_text\_ |
| Backtick | \`\\\\\\\`code\\\\\\\`\` | \\\`code\\\` |
| Hash | \`\\# Not a heading\` | \# Not a heading |
| Bracket | \`\\[not a link\\]\` | \[not a link\] |

---

## Common Mistakes & Tips

New to Markdown? Here are the most common issues and how to fix them:

**1. Line breaks not working**
- **Problem:** Pressing Enter once doesn't create a new line
- **Fix:** Use two spaces at the end of the line, or press Enter twice for a new paragraph

**2. Lists not rendering**
- **Problem:** Your list appears as plain text
- **Fix:** Make sure there's a blank line before the list, and a space after the \`-\` or number

**3. Links showing raw syntax**
- **Problem:** \`[text](url)\` appears as-is instead of a clickable link
- **Fix:** Ensure no spaces between the \`]\` and \`(\`, and the URL is complete (includes \`https://\`)

**4. Nested lists not indenting**
- **Problem:** Sub-items appear at the same level as parent items
- **Fix:** Use 2-4 spaces (or one tab) before the \`-\` for nested items

**5. Special characters appearing literally**
- **Problem:** You see \`**text**\` instead of **bold text**
- **Fix:** Make sure there are no spaces between the asterisks and the text

**6. Tables look broken**
- **Problem:** Table columns are misaligned or not rendering
- **Fix:** Ensure the header separator row (\`|---|---|---|\`) has the same number of columns as your data

> **Pro tip:** When in doubt, add a blank line before and after any Markdown element (lists, code blocks, tables, blockquotes). This helps ensure proper rendering.

---

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|:-------|:---:|:-------------:|
| Bold | ⌘ + B | Ctrl + B |
| Italic | ⌘ + I | Ctrl + I |
| Link | ⌘ + K | Ctrl + K |
| Inline Code | ⌘ + E | Ctrl + E |
| Headings | ⌘ + 1-6 | Ctrl + 1-6 |
| Insert Table | ⌘ + ⌥ + T | Ctrl + Alt + T |
| Toggle Scroll Sync | ⌘ + \\ | Ctrl + \\ |
| Upload File | ⌘ + O | Ctrl + O |
| Copy Markdown | ⌘ + Shift + C | Ctrl + Shift + C |
| Copy HTML | ⌘ + Shift + H | Ctrl + Shift + H |
| Download | ⌘ + S | Ctrl + S |

---

## About This Editor

The **ICJIA Markdown Editor 2.0** is designed for researchers, writers, and anyone who needs a clean, accessible writing environment.

**Key Features:**

- **Real-time Preview** — See your formatted document as you type
- **Auto-save** — Never lose your work (saves to browser storage moments after you stop typing)
- **Accessibility** — WCAG 2.1 Level AA compliant
- **Dark/Light Mode** — Easy on the eyes in any lighting
- **Export Options** — Download as Markdown or copy as HTML

---

## Try It Out

Delete this content and start writing your own document. Your work is automatically saved!

**Need help?** Click the **Tour** button in the header for a guided walkthrough.

---

*For more Markdown syntax, visit [markdownguide.org](https://www.markdownguide.org)*
`
