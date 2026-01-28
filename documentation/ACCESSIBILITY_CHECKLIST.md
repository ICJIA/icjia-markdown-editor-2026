# Accessibility Testing Checklist

**This checklist must be completed for EVERY feature before it can be merged.**

WCAG 2.1 Level AA compliance is mandatory and non-negotiable.

---

## Pre-Flight: Automated Tests

Run these first - they must ALL pass:

- [ ] `yarn test:a11y` - All accessibility unit tests pass
- [ ] `yarn test:e2e --project=a11y` - E2E accessibility tests pass
- [ ] Lighthouse Accessibility Score = **100**
- [ ] axe DevTools - **0 critical/serious violations**
- [ ] WAVE browser extension - **0 errors**

If any automated test fails, fix the issues before proceeding to manual testing.

---

## Manual Testing Checklist

### 1. Keyboard Navigation ⌨️

#### Skip Link & Initial Focus
- [ ] First Tab press focuses the skip link
- [ ] Skip link is visible when focused
- [ ] Activating skip link moves focus to main editor
- [ ] Focus indicator clearly visible on skip link

#### Toolbar Navigation
- [ ] Tab moves focus into toolbar
- [ ] Arrow keys navigate between toolbar buttons in the same group
- [ ] Tab moves focus between toolbar groups
- [ ] Enter/Space activates focused toolbar button
- [ ] Dropdown menus open with Enter/Space
- [ ] Arrow keys navigate dropdown menu items
- [ ] Enter selects dropdown item
- [ ] Esc closes dropdown and returns focus to trigger

#### Editor Pane
- [ ] Tab moves focus into the CodeMirror editor
- [ ] All text editing operations work with keyboard
- [ ] Ctrl+Z / Ctrl+Shift+Z for undo/redo work
- [ ] Find (Ctrl+F) opens and is fully keyboard accessible
- [ ] Replace (Ctrl+H) opens and is fully keyboard accessible

#### Preview Pane
- [ ] Can Tab to preview pane
- [ ] Links in preview are keyboard focusable
- [ ] Can scroll preview with keyboard (Page Up/Down, arrow keys)

#### Modal Dialogs
- [ ] Modal opens and immediately receives focus
- [ ] Focus is trapped within modal (Tab cycles through modal only)
- [ ] Shift+Tab cycles backwards through modal controls
- [ ] Esc closes modal
- [ ] Focus returns to trigger element when modal closes
- [ ] All modal form controls are keyboard accessible
- [ ] Submit button can be activated with Enter

#### Complete Workflow Test
- [ ] Can create a full document using only keyboard
- [ ] Can insert a table using only keyboard
- [ ] Can insert an image using only keyboard
- [ ] Can copy/download document using only keyboard

**Test Results:**
```
Date tested: ___________
Tester: _______________
Browser: ______________
Issues found:
- 
- 
```

---

### 2. Screen Reader Testing 🔊

Test with **NVDA (Windows/Firefox)** AND **VoiceOver (macOS/Safari)**

#### Page Structure
- [ ] Page title announced on load
- [ ] Language attribute (`lang="en"`) announced
- [ ] Landmarks announced (banner, main, toolbar, region)
- [ ] Skip link announced and functional
- [ ] Heading hierarchy logical (H1 → H2 → H3, no skips)

#### Toolbar
- [ ] Toolbar announced as "toolbar" with label
- [ ] Each button's name and purpose announced
- [ ] Keyboard shortcuts announced in button names
- [ ] Toggle buttons announce state (pressed/not pressed)
- [ ] Dropdown menus announce expanded/collapsed state

#### Editor
- [ ] Editor announced as "text area" or "edit"
- [ ] Label "Markdown editor" announced
- [ ] Line/column position announced on cursor movement
- [ ] Text formatting announced (when applicable)

#### Preview
- [ ] Preview region has accessible name
- [ ] Generated HTML headings announced with levels
- [ ] Lists announced as lists with item count
- [ ] Links announced as links with destination
- [ ] Images announce alt text
- [ ] Tables announce structure (rows, columns)

#### Live Regions
- [ ] Success messages announced ("Copied to clipboard")
- [ ] Error messages announced immediately
- [ ] Word count updates NOT announced (would be too noisy)

#### Modal Dialogs
- [ ] Modal role and title announced on open
- [ ] Form labels announced for all inputs
- [ ] Error messages associated with inputs
- [ ] Close action announced

**NVDA Test Results:**
```
NVDA Version: __________
Firefox Version: _______
Date tested: ___________
Tester: _______________
Issues found:
- 
- 
```

**VoiceOver Test Results:**
```
macOS Version: _________
Safari Version: ________
Date tested: ___________
Tester: _______________
Issues found:
- 
- 
```

---

### 3. Visual Accessibility 👁️

#### Focus Indicators
- [ ] All interactive elements show visible focus
- [ ] Focus outline minimum 2px width
- [ ] Focus outline has 3:1 contrast ratio against background
- [ ] Focus indicator not obscured by other elements
- [ ] Focus order matches visual/reading order
- [ ] No focus "traps" except intentional modals

#### Color Contrast (use WebAIM Contrast Checker)

**Text Contrast (4.5:1 minimum for AA):**
- [ ] Body text vs background
- [ ] Heading text vs background
- [ ] Link text vs background
- [ ] Button text vs button background
- [ ] Input text vs input background
- [ ] Placeholder text vs input background (use 4.5:1, not 3:1)
- [ ] Error message text vs background

**UI Component Contrast (3:1 minimum):**
- [ ] Button borders vs background
- [ ] Input borders vs background
- [ ] Focus indicators vs background
- [ ] Icons that convey meaning vs background

**Dark Mode:**
- [ ] All above contrast checks pass in dark mode

**Light Mode:**
- [ ] All above contrast checks pass in light mode

#### Color Independence
- [ ] No information conveyed by color alone
- [ ] Error states have icon/text, not just red color
- [ ] Success states have icon/text, not just green color
- [ ] Links distinguishable without relying on color (underline)

#### Text Resizing
- [ ] Zoom browser to 200%
- [ ] All text remains readable
- [ ] No text is cut off or overlaps
- [ ] No horizontal scrolling required
- [ ] All functionality still accessible
- [ ] Form inputs still usable

**Test Results:**
```
Date tested: ___________
Tester: _______________
Contrast checker used: ______________
Issues found:
- 
- 
```

---

### 4. Mobile & Touch Accessibility 📱

Test on actual devices, not just emulators.

#### Touch Targets
- [ ] All interactive elements minimum 44x44px
- [ ] Adequate spacing between touch targets (8px minimum)
- [ ] No accidental touch activations
- [ ] Touch targets have visible boundaries

#### Mobile Screen Readers

**VoiceOver (iOS):**
- [ ] All page structure tests pass
- [ ] Swipe navigation works correctly
- [ ] Double-tap activates elements
- [ ] Rotor navigation works for headings, links

**TalkBack (Android):**
- [ ] All page structure tests pass
- [ ] Swipe navigation works correctly
- [ ] Double-tap activates elements
- [ ] Local context menu works

#### Responsive Layout
- [ ] Works in portrait orientation
- [ ] Works in landscape orientation
- [ ] Layout adapts appropriately at all breakpoints
- [ ] No content hidden or inaccessible on mobile
- [ ] Editor/preview toggle works on mobile

**Mobile Test Results:**
```
Device: ________________
OS Version: ____________
Date tested: ___________
Tester: _______________
Issues found:
- 
- 
```

---

### 5. Cognitive Accessibility 🧠

#### Clear Language
- [ ] All text uses plain, clear language
- [ ] Technical terms explained when necessary
- [ ] Error messages explain how to fix the problem
- [ ] Instructions are concise and actionable

#### Consistent Design
- [ ] Navigation is consistent across all states
- [ ] Icons have text labels or tooltips
- [ ] Similar actions look similar
- [ ] Feedback is immediate for user actions

#### Error Prevention
- [ ] Confirmation before destructive actions
- [ ] Undo available for reversible actions
- [ ] Clear indication of required fields
- [ ] Input validation provides helpful guidance

#### Help & Documentation
- [ ] Keyboard shortcuts help (F1) is accessible
- [ ] Tooltips provide helpful context
- [ ] Labels clearly describe input expectations

**Test Results:**
```
Date tested: ___________
Tester: _______________
Issues found:
- 
- 
```

---

### 6. Motion & Animation 🎬

#### Reduced Motion
- [ ] Check `prefers-reduced-motion` is respected
- [ ] Essential animations still convey information
- [ ] Decorative animations are removed/reduced
- [ ] No content flashes more than 3 times per second

#### Testing Reduced Motion
```css
/* Test by enabling in OS settings or with CSS override */
@media (prefers-reduced-motion: reduce) {
  /* Animations should be disabled or minimal */
}
```

- [ ] macOS: System Preferences → Accessibility → Display → Reduce motion
- [ ] Windows: Settings → Ease of Access → Display → Show animations
- [ ] iOS: Settings → Accessibility → Motion → Reduce Motion

**Test Results:**
```
Date tested: ___________
Tester: _______________
Issues found:
- 
- 
```

---

### 7. Color Blindness Testing 🔴🟢🔵

Use Sim Daltonism (macOS) or Chrome DevTools Rendering panel.

#### Protanopia (Red-Blind)
- [ ] All UI elements distinguishable
- [ ] Error states still identifiable
- [ ] Links still visible

#### Deuteranopia (Green-Blind)
- [ ] All UI elements distinguishable
- [ ] Success states still identifiable
- [ ] Buttons still visible

#### Tritanopia (Blue-Blind)
- [ ] All UI elements distinguishable
- [ ] Focus indicators still visible
- [ ] Links still visible

#### Monochromacy (Total Color Blindness)
- [ ] All content still readable
- [ ] All interactive elements identifiable
- [ ] Information hierarchy maintained

**Test Results:**
```
Date tested: ___________
Tester: _______________
Tool used: _____________
Issues found:
- 
- 
```

---

## Sign-Off

### Feature Information

**Feature Name:** _________________________________

**PR/Issue Number:** ______________________________

**Description:** __________________________________

### Testing Summary

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| Keyboard Navigation | ☐ | ☐ | ☐ |
| Screen Reader (NVDA) | ☐ | ☐ | ☐ |
| Screen Reader (VoiceOver) | ☐ | ☐ | ☐ |
| Visual Accessibility | ☐ | ☐ | ☐ |
| Mobile Accessibility | ☐ | ☐ | ☐ |
| Cognitive Accessibility | ☐ | ☐ | ☐ |
| Motion/Animation | ☐ | ☐ | ☐ |
| Color Blindness | ☐ | ☐ | ☐ |

### Approval

**Tested by:** ____________________________________

**Date:** _________________________________________

**Approved for merge:** ☐ Yes ☐ No

**Reviewer:** _____________________________________

**Review Date:** __________________________________

---

## Resources

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Automated accessibility testing
- [WAVE](https://wave.webaim.org/extension/) - Web accessibility evaluation
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance & accessibility
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Sim Daltonism](https://michelf.ca/projects/sim-daltonism/) - Color blindness simulator

### Screen Readers
- [NVDA](https://www.nvaccess.org/) - Free Windows screen reader
- VoiceOver - Built into macOS and iOS
- TalkBack - Built into Android

### References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
