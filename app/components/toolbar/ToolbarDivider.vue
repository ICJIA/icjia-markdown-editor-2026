<script setup lang="ts">
/**
 * Toolbar Divider Component
 * Visual separator between toolbar button groups
 */
</script>

<template>
  <div class="toolbar-divider" role="separator" aria-orientation="vertical" />
</template>

<style scoped>
.toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background: var(--color-border, #334155);
  margin: 0 0.25rem;
}
</style>
