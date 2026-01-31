<script setup lang="ts">
/**
 * Conversion Tools Modal Component
 * Displays external conversion utilities as interactive cards
 * Modern, sleek design with gradient accents and smooth animations
 */

const { isOpen, tools, closeModal, openTool } = useConversionToolsModal()
const { announce } = useAccessibility()

// Announce when modal opens
watch(isOpen, (open) => {
  if (open) {
    announce('Conversion tools dialog opened. Select a tool to open in a new window.')
  }
})

// Handle card click
function handleToolClick(tool: typeof tools[0]) {
  openTool(tool)
  closeModal()
}

// Handle keyboard navigation
function handleKeydown(event: KeyboardEvent, tool: typeof tools[0]) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleToolClick(tool)
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    :ui="{
      content: 'conversion-modal-content bg-neutral-950 dark:bg-neutral-950 border border-neutral-800 shadow-2xl max-w-4xl w-full',
      header: 'border-b border-neutral-800 px-6 py-5',
      body: 'px-6 py-6 max-h-[60vh] overflow-y-auto',
      footer: 'border-t border-neutral-800 px-6 py-4',
      overlay: 'bg-black/60 backdrop-blur-sm'
    }"
    @update:open="(open: boolean) => !open && closeModal()"
  >
    <template #header>
      <div class="flex items-center gap-4">
        <div class="tool-header-icon">
          <UIcon name="i-heroicons-wrench-screwdriver" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 id="conversion-modal-title" class="text-xl font-bold text-neutral-100">
            Conversion Tools
          </h2>
          <p class="text-sm text-neutral-400 mt-1">
            External utilities for R&A staff workflows
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="tools-grid">
        <article
          v-for="tool in tools"
          :key="tool.id"
          class="tool-card"
          :class="`tool-card--${tool.id}`"
          role="button"
          tabindex="0"
          :aria-label="`Open ${tool.name} in a new window. ${tool.description}`"
          @click="handleToolClick(tool)"
          @keydown="(e) => handleKeydown(e, tool)"
        >
          <!-- Gradient overlay -->
          <div class="tool-card__gradient" :class="`bg-gradient-to-br ${tool.gradient}`" />
          
          <!-- Card content -->
          <div class="tool-card__content">
            <!-- Icon and title row -->
            <div class="tool-card__header">
              <div class="tool-card__icon-wrapper" :class="`bg-gradient-to-br ${tool.gradient}`">
                <UIcon :name="tool.icon" class="tool-card__icon" />
              </div>
              <div class="tool-card__title-group">
                <h3 class="tool-card__name">{{ tool.name }}</h3>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="tool-card__external-icon" />
              </div>
            </div>

            <!-- Description -->
            <p class="tool-card__description">{{ tool.description }}</p>

            <!-- Features list -->
            <ul class="tool-card__features">
              <li v-for="feature in tool.features" :key="feature" class="tool-card__feature">
                <UIcon name="i-heroicons-check-circle-solid" class="tool-card__check" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <!-- Call to action -->
            <div class="tool-card__cta">
              <span class="tool-card__cta-text">Open {{ tool.name }}</span>
              <UIcon name="i-heroicons-arrow-right" class="tool-card__cta-arrow" />
            </div>
          </div>
        </article>
      </div>

      <!-- Info note -->
      <div class="tools-note">
        <UIcon name="i-heroicons-information-circle" class="tools-note__icon" />
        <p class="tools-note__text">
          These tools open in a new window. Your data stays private — both tools process files locally in your browser.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          variant="ghost"
          color="neutral"
          @click="closeModal"
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Modal content override */
:deep(.conversion-modal-content) {
  background: linear-gradient(180deg, #0a0a0a 0%, #171717 100%) !important;
}

/* Header icon with gradient */
.tool-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  box-shadow: 
    0 4px 12px rgba(99, 102, 241, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

/* Tools grid - flexible centered layout for 2-4+ cards */
.tools-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

/* Card sizing */
.tools-grid > .tool-card {
  flex: 0 1 100%;
  max-width: 320px;
}

/* For medium screens, show 2 cards side by side */
@media (min-width: 640px) {
  .tools-grid {
    gap: 1.25rem;
  }
  
  .tools-grid > .tool-card {
    flex: 0 1 calc(50% - 0.625rem);
    max-width: 320px;
  }
}

/* For larger screens, allow up to 3 cards */
@media (min-width: 1024px) {
  .tools-grid > .tool-card {
    flex: 0 1 calc(33.333% - 0.833rem);
    max-width: 300px;
  }
}

/* Tool card */
.tool-card {
  position: relative;
  border-radius: 1rem;
  background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%);
  border: 1px solid #2a2a2a;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tool-card:hover {
  transform: translateY(-4px);
  border-color: #404040;
  box-shadow: 
    0 20px 40px -12px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.tool-card:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* Gradient overlay */
.tool-card__gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  opacity: 0.9;
  transition: height 0.3s ease, opacity 0.3s ease;
}

.tool-card:hover .tool-card__gradient {
  height: 6px;
  opacity: 1;
}

/* Card content */
.tool-card__content {
  position: relative;
  padding: 1.25rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Header */
.tool-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

/* Icon wrapper */
.tool-card__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.tool-card__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

/* Title group */
.tool-card__title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-card__name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #fafafa;
  margin: 0;
}

.tool-card__external-icon {
  width: 1rem;
  height: 1rem;
  color: #525252;
  transition: color 0.2s ease, transform 0.2s ease;
}

.tool-card:hover .tool-card__external-icon {
  color: #a3a3a3;
  transform: translate(2px, -2px);
}

/* Description */
.tool-card__description {
  font-size: 0.875rem;
  color: #a3a3a3;
  line-height: 1.5;
  margin-bottom: 1rem;
}

/* Features list */
.tool-card__features {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem;
  flex-grow: 1;
}

.tool-card__feature {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #737373;
}

.tool-card__check {
  width: 0.875rem;
  height: 0.875rem;
  color: #22c55e;
  flex-shrink: 0;
}

/* CTA */
.tool-card__cta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.875rem;
  border-top: 1px solid #262626;
  margin-top: auto;
}

.tool-card__cta-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #d4d4d4;
  transition: color 0.2s ease;
}

.tool-card:hover .tool-card__cta-text {
  color: #fafafa;
}

.tool-card__cta-arrow {
  width: 1rem;
  height: 1rem;
  color: #525252;
  transition: transform 0.2s ease, color 0.2s ease;
}

.tool-card:hover .tool-card__cta-arrow {
  transform: translateX(4px);
  color: #a3a3a3;
}

/* BentoPDF specific hover glow */
.tool-card--bentopdf:hover {
  box-shadow: 
    0 20px 40px -12px rgba(236, 72, 153, 0.3),
    0 0 0 1px rgba(236, 72, 153, 0.1);
}

/* Vert.sh specific hover glow */
.tool-card--vertsh:hover {
  box-shadow: 
    0 20px 40px -12px rgba(20, 184, 166, 0.3),
    0 0 0 1px rgba(20, 184, 166, 0.1);
}

/* Info note */
.tools-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding: 0.875rem 1rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.75rem;
}

.tools-note__icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #60a5fa;
  flex-shrink: 0;
  margin-top: 0.0625rem;
}

.tools-note__text {
  font-size: 0.8125rem;
  color: #a3a3a3;
  line-height: 1.5;
  margin: 0;
}

/* Light mode adjustments */
.light .tool-card {
  background: linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%);
  border-color: #e5e5e5;
}

.light .tool-card:hover {
  border-color: #d4d4d4;
  box-shadow: 
    0 20px 40px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.light .tool-card__name {
  color: #171717;
}

.light .tool-card__description {
  color: #525252;
}

.light .tool-card__feature {
  color: #737373;
}

.light .tool-card__cta {
  border-top-color: #e5e5e5;
}

.light .tool-card__cta-text {
  color: #404040;
}

.light .tool-card:hover .tool-card__cta-text {
  color: #171717;
}

.light .tool-card__external-icon {
  color: #a3a3a3;
}

.light .tool-card:hover .tool-card__external-icon {
  color: #525252;
}

.light .tool-card__cta-arrow {
  color: #a3a3a3;
}

.light .tool-card:hover .tool-card__cta-arrow {
  color: #525252;
}

.light .tools-note {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.15);
}

.light .tools-note__text {
  color: #525252;
}

/* BentoPDF light mode hover */
.light .tool-card--bentopdf:hover {
  box-shadow: 
    0 20px 40px -12px rgba(236, 72, 153, 0.2),
    0 0 0 1px rgba(236, 72, 153, 0.1);
}

/* Vert.sh light mode hover */
.light .tool-card--vertsh:hover {
  box-shadow: 
    0 20px 40px -12px rgba(20, 184, 166, 0.2),
    0 0 0 1px rgba(20, 184, 166, 0.1);
}

/* Dialog background override */
:deep([role="dialog"]) {
  background: linear-gradient(180deg, #0a0a0a 0%, #171717 100%) !important;
}

.light :deep([role="dialog"]) {
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%) !important;
}
</style>
