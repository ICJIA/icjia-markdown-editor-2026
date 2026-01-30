/**
 * ICJIA Markdown Editor - Accessibility Audit Script
 * Tests WCAG 2.1 AA compliance using axe-core
 * 
 * Usage:
 *   yarn test:a11y           # Run fresh audit (or review cached if available)
 *   yarn test:a11y --fresh   # Force fresh audit
 *   yarn test:a11y --review  # Review cached results only
 */

import { chromium, type Browser, type Page } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RESULTS_FILE = join(__dirname, 'a11y-results.json')
const DEV_SERVER_URL = 'http://localhost:3002'

interface ViolationResult {
  id: string
  impact: string
  description: string
  helpUrl: string
  nodes: number
  nodeDetails: Array<{
    html: string
    target: string[]
    failureSummary: string
  }>
}

interface TestResult {
  name: string
  passed: boolean
  issues: string[]
}

interface AuditResult {
  mode: 'dark' | 'light'
  viewport: { width: number; height: number; name: string }
  violations: ViolationResult[]
  passes: number
  incomplete: number
}

interface FullAuditReport {
  timestamp: string
  devServerUrl: string
  summary: {
    totalViolations: number
    critical: number
    serious: number
    moderate: number
    minor: number
    keyboardNavigation: TestResult
    ariaLandmarks: TestResult
    overallPass: boolean
  }
  audits: AuditResult[]
}

/**
 * Check if cached results exist
 */
function hasCachedResults(): boolean {
  return existsSync(RESULTS_FILE)
}

/**
 * Load cached results
 */
function loadCachedResults(): FullAuditReport | null {
  if (!hasCachedResults()) return null
  try {
    const data = readFileSync(RESULTS_FILE, 'utf-8')
    return JSON.parse(data) as FullAuditReport
  } catch {
    return null
  }
}

/**
 * Save results to JSON
 */
function saveResults(report: FullAuditReport): void {
  const dir = dirname(RESULTS_FILE)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2))
  console.log(`\n💾 Results saved to: ${RESULTS_FILE}`)
}

/**
 * Format violations for console output
 */
function formatViolations(violations: ViolationResult[], verbose = false): string {
  if (violations.length === 0) {
    return '  ✅ No violations found!'
  }
  
  return violations.map(v => {
    const icon = v.impact === 'critical' ? '🔴' : 
                 v.impact === 'serious' ? '🟠' : 
                 v.impact === 'moderate' ? '🟡' : '🔵'
    let output = `  ${icon} [${v.impact.toUpperCase()}] ${v.id}\n     ${v.description}\n     Affected nodes: ${v.nodes}\n     Help: ${v.helpUrl}`
    
    if (verbose && v.nodeDetails.length > 0) {
      output += '\n     Affected elements:'
      v.nodeDetails.slice(0, 3).forEach((node, i) => {
        output += `\n       ${i + 1}. ${node.target.join(' > ')}`
        output += `\n          ${node.failureSummary}`
      })
      if (v.nodeDetails.length > 3) {
        output += `\n       ... and ${v.nodeDetails.length - 3} more`
      }
    }
    
    return output
  }).join('\n\n')
}

/**
 * Display cached results
 */
function displayCachedResults(report: FullAuditReport): void {
  console.log('\n' + '='.repeat(60))
  console.log('📋 CACHED ACCESSIBILITY AUDIT RESULTS')
  console.log('='.repeat(60))
  console.log(`\n   Audit performed: ${new Date(report.timestamp).toLocaleString()}`)
  console.log(`   Server URL: ${report.devServerUrl}`)
  
  // Group violations by ID
  const allViolations = report.audits.flatMap(a => a.violations)
  const uniqueViolations = new Map<string, ViolationResult>()
  
  for (const v of allViolations) {
    if (!uniqueViolations.has(v.id)) {
      uniqueViolations.set(v.id, v)
    } else {
      // Merge node counts
      const existing = uniqueViolations.get(v.id)!
      existing.nodes += v.nodes
      existing.nodeDetails = [...existing.nodeDetails, ...v.nodeDetails]
    }
  }
  
  console.log(`\n${'─'.repeat(60)}`)
  console.log('📊 SUMMARY')
  console.log('─'.repeat(60))
  
  const s = report.summary
  console.log(`\n   🔴 Critical: ${s.critical}`)
  console.log(`   🟠 Serious:  ${s.serious}`)
  console.log(`   🟡 Moderate: ${s.moderate}`)
  console.log(`   🔵 Minor:    ${s.minor}`)
  console.log(`   ─────────────────`)
  console.log(`   Total:      ${s.totalViolations}`)
  
  console.log(`\n   Keyboard Navigation: ${s.keyboardNavigation.passed ? '✅ PASS' : '❌ FAIL'}`)
  if (!s.keyboardNavigation.passed) {
    s.keyboardNavigation.issues.forEach(i => console.log(`      - ${i}`))
  }
  
  console.log(`   ARIA Landmarks:      ${s.ariaLandmarks.passed ? '✅ PASS' : '❌ FAIL'}`)
  if (!s.ariaLandmarks.passed) {
    s.ariaLandmarks.issues.forEach(i => console.log(`      - ${i}`))
  }
  
  console.log(`\n   ${'─'.repeat(40)}`)
  console.log(`   WCAG 2.1 AA Compliance: ${s.overallPass ? '✅ PASS' : '❌ FAIL'}`)
  
  if (uniqueViolations.size > 0) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log('🔍 UNIQUE VIOLATIONS (with details)')
    console.log('─'.repeat(60))
    console.log(formatViolations(Array.from(uniqueViolations.values()), true))
  }
  
  // Show per-mode/viewport breakdown
  console.log(`\n${'─'.repeat(60)}`)
  console.log('📐 BREAKDOWN BY MODE & VIEWPORT')
  console.log('─'.repeat(60))
  
  for (const audit of report.audits) {
    const icon = audit.violations.length === 0 ? '✅' : '❌'
    console.log(`\n   ${icon} ${audit.mode.toUpperCase()} - ${audit.viewport.name}`)
    console.log(`      Passes: ${audit.passes} | Violations: ${audit.violations.length}`)
    if (audit.violations.length > 0) {
      audit.violations.forEach(v => {
        const vIcon = v.impact === 'critical' ? '🔴' : 
                     v.impact === 'serious' ? '🟠' : 
                     v.impact === 'moderate' ? '🟡' : '🔵'
        console.log(`      ${vIcon} ${v.id} (${v.nodes} nodes)`)
      })
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
}

/**
 * Run axe-core accessibility audit
 */
async function runAudit(page: Page, mode: 'dark' | 'light', viewport: { width: number; height: number; name: string }): Promise<AuditResult> {
  // Set viewport
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  
  // Navigate to the app
  await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' })
  
  // Wait for editor to be ready
  await page.waitForSelector('.cm-editor', { timeout: 10000 })
  
  // Wait for welcome dialog to potentially appear (1s delay in config + buffer)
  await page.waitForTimeout(1500)
  
  // Dismiss welcome dialog if present (shown to first-time visitors)
  const welcomeDialog = page.locator('.welcome-dialog')
  if (await welcomeDialog.count() > 0) {
    // Click the skip button to dismiss
    const skipButton = page.locator('.welcome-dialog button:has-text("No thanks")')
    if (await skipButton.count() > 0) {
      await skipButton.click()
      await page.waitForTimeout(500)
    }
  }
  
  // Set color mode
  if (mode === 'light') {
    const toggleButton = page.locator('button[aria-label*="light"], button[aria-label*="Switch to light"]')
    if (await toggleButton.count() > 0) {
      await toggleButton.click()
      await page.waitForTimeout(500)
    }
  }
  
  // Run axe-core analysis
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  
  // Format violations with node details
  const violations: ViolationResult[] = results.violations.map(v => ({
    id: v.id,
    impact: v.impact || 'unknown',
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length,
    nodeDetails: v.nodes.map(n => ({
      html: n.html,
      target: n.target as string[],
      failureSummary: n.failureSummary || '',
    })),
  }))
  
  return {
    mode,
    viewport,
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  }
}

/**
 * Test keyboard navigation
 */
async function testKeyboardNavigation(page: Page): Promise<TestResult> {
  const issues: string[] = []
  
  await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cm-editor', { timeout: 10000 })
  
  // Wait for welcome dialog to potentially appear (1s delay in config + buffer)
  await page.waitForTimeout(1500)
  
  // Dismiss welcome dialog if present (shown to first-time visitors)
  const welcomeDialog = page.locator('.welcome-dialog')
  if (await welcomeDialog.count() > 0) {
    const skipButton = page.locator('.welcome-dialog button:has-text("No thanks")')
    if (await skipButton.count() > 0) {
      await skipButton.click()
      await page.waitForTimeout(500)
    }
  }

  // Test 1: Skip link is first focusable element
  await page.keyboard.press('Tab')
  const skipLink = await page.locator(':focus').getAttribute('href')
  if (skipLink !== '#main-editor-scroller' && skipLink !== '#main-editor') {
    issues.push('Skip link is not the first focusable element')
  }
  
  // Test 2: Skip link works (should focus either main-editor or main-editor-scroller)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const focusedAfterSkip = await page.evaluate(() => document.activeElement?.id)
  if (focusedAfterSkip !== 'main-editor' && focusedAfterSkip !== 'main-editor-scroller') {
    issues.push('Skip link does not focus the editor')
  }
  
  // Test 3: Toolbar buttons have proper aria-labels
  const toolbarButtons = await page.locator('[role="toolbar"] button').all()
  let unlabeledButtons = 0
  for (const button of toolbarButtons) {
    const ariaLabel = await button.getAttribute('aria-label')
    if (!ariaLabel || ariaLabel.trim() === '') {
      unlabeledButtons++
    }
  }
  if (unlabeledButtons > 0) {
    issues.push(`${unlabeledButtons} toolbar button(s) missing aria-label`)
  }
  
  // Test 4: Check for focus visible styles
  const hasFocusVisible = await page.evaluate(() => {
    const focused = document.activeElement
    if (!focused) return false
    const styles = window.getComputedStyle(focused)
    return styles.outline !== 'none' || styles.boxShadow !== 'none'
  })
  if (!hasFocusVisible) {
    issues.push('Focus indicator may not be visible')
  }
  
  return {
    name: 'Keyboard Navigation',
    passed: issues.length === 0,
    issues,
  }
}

/**
 * Test ARIA landmarks
 */
async function testLandmarks(page: Page): Promise<TestResult> {
  const issues: string[] = []
  
  await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.cm-editor', { timeout: 10000 })
  
  // Wait for welcome dialog to potentially appear (1s delay in config + buffer)
  await page.waitForTimeout(1500)
  
  // Dismiss welcome dialog if present (shown to first-time visitors)
  const welcomeDialog = page.locator('.welcome-dialog')
  if (await welcomeDialog.count() > 0) {
    const skipButton = page.locator('.welcome-dialog button:has-text("No thanks")')
    if (await skipButton.count() > 0) {
      await skipButton.click()
      await page.waitForTimeout(500)
    }
  }

  const landmarks = await page.evaluate(() => {
    const results: Record<string, boolean> = {}
    results.main = document.querySelector('main, [role="main"]') !== null
    results.header = document.querySelector('header, [role="banner"]') !== null
    results.toolbar = document.querySelector('[role="toolbar"]') !== null
    results.textbox = document.querySelector('[role="textbox"]') !== null
    results.region = document.querySelector('[role="region"][aria-label*="preview" i]') !== null
    results.status = document.querySelector('[role="status"]') !== null
    return results
  })
  
  if (!landmarks.main) issues.push('Missing main landmark')
  if (!landmarks.header) issues.push('Missing header/banner landmark')
  if (!landmarks.toolbar) issues.push('Missing toolbar landmark')
  if (!landmarks.textbox) issues.push('Missing textbox role on editor')
  if (!landmarks.region) issues.push('Missing preview region landmark')
  if (!landmarks.status) issues.push('Missing status landmark')
  
  return {
    name: 'ARIA Landmarks',
    passed: issues.length === 0,
    issues,
  }
}

/**
 * Run full audit
 */
async function runFullAudit(): Promise<FullAuditReport> {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 ICJIA Markdown Editor - Accessibility Audit')
  console.log('   WCAG 2.1 Level AA Compliance Check')
  console.log('='.repeat(60) + '\n')
  
  console.log(`📡 Checking dev server at ${DEV_SERVER_URL}...`)
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    await page.goto(DEV_SERVER_URL, { timeout: 5000 })
  } catch {
    await browser.close()
    throw new Error(`Dev server is not running at ${DEV_SERVER_URL}. Please start it with: yarn dev`)
  }
  
  console.log('✅ Dev server is running\n')
  
  const allAudits: AuditResult[] = []
  
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop (1920x1080)' },
    { width: 768, height: 1024, name: 'Tablet (768x1024)' },
    { width: 375, height: 667, name: 'Mobile (375x667)' },
  ]
  
  // Test each mode and viewport
  for (const mode of ['dark', 'light'] as const) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`🎨 Testing ${mode.toUpperCase()} MODE`)
    console.log('─'.repeat(60))
    
    for (const viewport of viewports) {
      console.log(`\n📐 ${viewport.name}`)
      
      const result = await runAudit(page, mode, viewport)
      allAudits.push(result)
      
      console.log(`   Passes: ${result.passes} | Violations: ${result.violations.length}`)
      
      if (result.violations.length > 0) {
        console.log('\n   Violations:')
        console.log(formatViolations(result.violations).split('\n').map(l => '   ' + l).join('\n'))
      }
    }
  }
  
  // Additional tests
  console.log(`\n${'─'.repeat(60)}`)
  console.log('⌨️  KEYBOARD NAVIGATION TEST')
  console.log('─'.repeat(60))
  
  const keyboardResult = await testKeyboardNavigation(page)
  if (keyboardResult.passed) {
    console.log('   ✅ All keyboard navigation tests passed')
  } else {
    keyboardResult.issues.forEach(i => console.log(`   ❌ ${i}`))
  }
  
  console.log(`\n${'─'.repeat(60)}`)
  console.log('🏛️  ARIA LANDMARKS TEST')
  console.log('─'.repeat(60))
  
  const landmarksResult = await testLandmarks(page)
  if (landmarksResult.passed) {
    console.log('   ✅ All required ARIA landmarks present')
  } else {
    landmarksResult.issues.forEach(i => console.log(`   ❌ ${i}`))
  }
  
  await browser.close()
  
  // Calculate summary
  const allViolations = allAudits.flatMap(a => a.violations)
  const criticalCount = allViolations.filter(v => v.impact === 'critical').length
  const seriousCount = allViolations.filter(v => v.impact === 'serious').length
  const moderateCount = allViolations.filter(v => v.impact === 'moderate').length
  const minorCount = allViolations.filter(v => v.impact === 'minor').length
  
  const overallPass = allViolations.length === 0 && keyboardResult.passed && landmarksResult.passed
  
  const report: FullAuditReport = {
    timestamp: new Date().toISOString(),
    devServerUrl: DEV_SERVER_URL,
    summary: {
      totalViolations: allViolations.length,
      critical: criticalCount,
      serious: seriousCount,
      moderate: moderateCount,
      minor: minorCount,
      keyboardNavigation: keyboardResult,
      ariaLandmarks: landmarksResult,
      overallPass,
    },
    audits: allAudits,
  }
  
  // Display summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 AUDIT SUMMARY')
  console.log('='.repeat(60))
  
  console.log(`\n   🔴 Critical: ${criticalCount}`)
  console.log(`   🟠 Serious:  ${seriousCount}`)
  console.log(`   🟡 Moderate: ${moderateCount}`)
  console.log(`   🔵 Minor:    ${minorCount}`)
  console.log(`   ─────────────────`)
  console.log(`   Total:      ${allViolations.length}`)
  
  console.log(`\n   Keyboard Navigation: ${keyboardResult.passed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`   ARIA Landmarks:      ${landmarksResult.passed ? '✅ PASS' : '❌ FAIL'}`)
  
  console.log(`\n   ${'─'.repeat(40)}`)
  console.log(`   WCAG 2.1 AA Compliance: ${overallPass ? '✅ PASS' : '❌ FAIL'}`)
  console.log('='.repeat(60) + '\n')
  
  return report
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)
  const forceFresh = args.includes('--fresh')
  const forceReview = args.includes('--review')
  
  // Handle --review flag
  if (forceReview) {
    const cached = loadCachedResults()
    if (!cached) {
      console.error('❌ No cached results found. Run without --review to perform a fresh audit.')
      process.exit(1)
    }
    displayCachedResults(cached)
    process.exit(cached.summary.overallPass ? 0 : 1)
  }
  
  // Handle default behavior (check for cached, offer options) or --fresh
  if (!forceFresh && hasCachedResults()) {
    const cached = loadCachedResults()
    if (cached) {
      console.log('\n📋 Cached accessibility results found.')
      console.log(`   Last run: ${new Date(cached.timestamp).toLocaleString()}`)
      console.log(`   Status: ${cached.summary.overallPass ? '✅ PASSED' : '❌ FAILED'}`)
      console.log(`   Violations: ${cached.summary.totalViolations}`)
      console.log('\n   Options:')
      console.log('   - Run with --fresh to perform a new audit')
      console.log('   - Run with --review to view cached results in detail')
      console.log('\n   Showing cached results...\n')
      
      displayCachedResults(cached)
      process.exit(cached.summary.overallPass ? 0 : 1)
    }
  }
  
  // Run fresh audit
  try {
    const report = await runFullAudit()
    saveResults(report)
    
    // Exit with appropriate code
    if (report.summary.critical > 0 || report.summary.serious > 0) {
      console.log('❌ Audit failed due to critical/serious violations')
      process.exit(1)
    }
    
    if (!report.summary.overallPass) {
      console.log('⚠️  Audit completed with warnings')
      process.exit(0)
    }
    
    console.log('✅ Audit passed - WCAG 2.1 AA compliant!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Audit failed with error:', error)
    process.exit(1)
  }
}

main()
