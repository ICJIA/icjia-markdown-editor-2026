<script setup lang="ts">
/**
 * Skip Link Component - WCAG 2.4.1 Bypass Blocks
 * First focusable element on the page, allows keyboard users to skip navigation
 */

function skipToMain() {
  const mainEditor = document.getElementById('main-editor')
  if (mainEditor) {
    mainEditor.focus()
    mainEditor.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <a 
    href="#main-editor" 
    class="skip-link"
    @click.prevent="skipToMain"
  >
    Skip to editor
  </a>
</template>

<style scoped>
.skip-link {
  /* Visually hidden by default */
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 9999;
  
  /* Styling when visible */
  background: var(--color-primary, #3b82f6);
  color: white;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0 0 0.5rem 0;
  
  /* Transition for smooth appearance */
  transition: top 0.2s ease-in-out;
}

.skip-link:focus {
  /* Show on focus */
  top: 0;
  outline: 2px solid var(--color-focus, #60a5fa);
  outline-offset: 2px;
}
</style>
