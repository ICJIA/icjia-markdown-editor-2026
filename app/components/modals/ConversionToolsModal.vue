<script setup lang="ts">
/**
 * Conversion Tools Modal Component
 * Displays external conversion utilities as interactive cards
 * Modern, sleek design with gradient accents and smooth animations
 */

const { isOpen, tools, closeModal } = useConversionToolsModal()
const { announce } = useAccessibility()

// Announce when modal opens, and fix Reka UI aria-labelledby mismatch
watch(isOpen, (open) => {
  if (open) {
    announce('Tools and utilities dialog opened. Select a tool to open in a new window.')
    // Reka UI generates mismatched aria-labelledby/describedby IDs on the dialog.
    // Patch them to reference actual elements after the modal renders.
    nextTick(() => {
      const dialog = document.querySelector('[role="dialog"][data-slot="content"]') as HTMLElement
      if (dialog) {
        dialog.setAttribute('aria-labelledby', 'conversion-modal-title')
        dialog.removeAttribute('aria-describedby')
      }
    })
  }
})

// Handle card click: navigation happens natively via the link's href/target
// (keeps middle-click and cmd-click working); we just close the modal.
function handleToolClick() {
  closeModal()
}

</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="true"
    :ui="{
      content: 'conversion-modal-content bg-slate-800 dark:bg-slate-800 border border-slate-600 shadow-2xl w-[95vw] max-w-[960px] flex flex-col max-h-[90vh] sm:max-h-[85vh]',
      header: 'border-b border-slate-600 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0',
      body: 'px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 min-h-0',
      footer: 'border-t border-slate-600 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0',
      overlay: 'bg-black/70 backdrop-blur-sm'
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
            Tools and Utilities
          </h2>
          <p class="text-sm text-neutral-400 mt-1">
            Helpful resources for R&A staff workflows
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="tools-grid">
        <a
          v-for="tool in tools"
          :key="tool.id"
          :href="tool.url"
          target="_blank"
          rel="noopener noreferrer"
          class="tool-card"
          :class="`tool-card--${tool.id}`"
          :aria-label="`Open ${tool.name} in a new window. ${tool.description}`"
          @click="handleToolClick()"
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
        </a>
      </div>

      <!-- Info note -->
      <div class="tools-note">
        <UIcon name="i-heroicons-information-circle" class="tools-note__icon" />
        <p class="tools-note__text">
          These tools open in a new window. BentoPDF, Vert.sh, Squish, and Ipsumify process files locally in your browser for privacy.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <button
          type="button"
          class="close-button"
          @click="closeModal"
        >
          Close
        </button>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Modal content override - lighter background to stand out from editor */
:deep(.conversion-modal-content) {
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%) !important;
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

/* Tools grid - flexible centered layout for 1–3 cards */
.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

/* Card sizing */
.tools-grid > .tool-card {
  width: 100%;
}

/* Medium screens: 2 cards across */
@media (min-width: 540px) {
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* Large screens: 3 cards across */
@media (min-width: 900px) {
  .tools-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tool card - darker than modal background for contrast */
.tool-card {
  position: relative;
  border-radius: 1rem;
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #475569;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
  text-decoration: none;
  color: inherit;
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
  transition: all 0.3s ease;
}

/* Larger icon wrapper for medium+ screens */
@media (min-width: 768px) {
  .tool-card__icon-wrapper {
    width: 3.5rem;
    height: 3.5rem;
  }
}

.tool-card__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

/* Larger icon for medium+ screens */
@media (min-width: 768px) {
  .tool-card__icon {
    width: 1.75rem;
    height: 1.75rem;
  }
}

/* Title group */
.tool-card__title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-card__name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fafafa;
  margin: 0;
  line-height: 1.2;
}

/* Larger titles for medium screens */
@media (min-width: 768px) {
  .tool-card__name {
    font-size: 1.5rem;
  }
}

/* Even larger titles for wide screens */
@media (min-width: 1024px) {
  .tool-card__name {
    font-size: 1.625rem;
  }
}

.tool-card__external-icon {
  width: 1rem;
  height: 1rem;
  color: #525252;
  transition: color 0.2s ease, transform 0.2s ease;
}

/* Larger external icon for medium+ screens */
@media (min-width: 768px) {
  .tool-card__external-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
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

/* Ipsumify specific hover glow */
.tool-card--ipsumify:hover {
  box-shadow: 
    0 20px 40px -12px rgba(99, 102, 241, 0.3),
    0 0 0 1px rgba(99, 102, 241, 0.1);
}

/* TablesGenerator specific hover glow */
.tool-card--tablesgenerator:hover {
  box-shadow: 
    0 20px 40px -12px rgba(245, 158, 11, 0.3),
    0 0 0 1px rgba(245, 158, 11, 0.1);
}

/* Squish specific hover glow */
.tool-card--squish:hover {
  box-shadow:
    0 20px 40px -12px rgba(14, 165, 233, 0.3),
    0 0 0 1px rgba(14, 165, 233, 0.1);
}

/* PDF Audit specific hover glow */
.tool-card--pdfaudit:hover {
  box-shadow:
    0 20px 40px -12px rgba(16, 185, 129, 0.3),
    0 0 0 1px rgba(16, 185, 129, 0.1);
}

/* Mobile optimizations for tool cards */
@media (max-width: 639px) {
  .tools-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 1rem !important;
    width: 100% !important;
    visibility: visible !important;
  }
  
  .tool-card {
    display: flex !important;
    flex-direction: column !important;
    visibility: visible !important;
    opacity: 1 !important;
    border-radius: 0.75rem;
    background: #1e293b !important;
    border: 1px solid #475569 !important;
    min-height: 200px;
  }
  
  .tool-card__gradient {
    display: none !important;
  }
  
  .tool-card__content {
    padding: 1rem;
    position: relative;
    z-index: 1;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .tool-card__header {
    margin-bottom: 0.75rem;
  }
  
  .tool-card__icon-wrapper {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .tool-card__icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .tool-card__name {
    font-size: 1rem;
    color: #f1f5f9 !important;
  }
  
  .tool-card__description {
    font-size: 0.8125rem;
    margin-bottom: 0.75rem;
    color: #94a3b8 !important;
  }
  
  .tool-card__features {
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }
  
  .tool-card__feature {
    font-size: 0.6875rem;
    color: #94a3b8 !important;
  }
  
  .tool-card__check {
    width: 0.75rem;
    height: 0.75rem;
    color: #22c55e !important;
  }
  
  .tool-card__cta {
    padding-top: 0.75rem;
    border-top: 1px solid #475569;
  }
  
  .tool-card__cta-text {
    font-size: 0.75rem;
    color: #e2e8f0 !important;
  }
  
  .tool-card__cta-arrow {
    color: #94a3b8 !important;
  }
  
  /* Disable hover effects on touch devices */
  .tool-card:hover {
    transform: none;
  }
  
  .tool-card:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
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

/* Close button - elevated button style */
.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  background: linear-gradient(to bottom, #475569 0%, #334155 50%, #1e293b 100%);
  border: 1px solid #64748b;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset,
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-button:hover {
  background: linear-gradient(to bottom, #64748b 0%, #475569 50%, #334155 100%);
  border-color: #94a3b8;
  color: #f8fafc;
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.15) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset,
    0 4px 8px rgba(0, 0, 0, 0.4);
}

.close-button:active {
  transform: translateY(1px);
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 1px 2px rgba(0, 0, 0, 0.2);
}

.close-button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* Light mode close button */
.light .close-button {
  color: #374151;
  background: linear-gradient(to bottom, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%);
  border-color: #cbd5e1;
  box-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 -1px 0 rgba(0, 0, 0, 0.05) inset,
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.light .close-button:hover {
  background: linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  border-color: #94a3b8;
  color: #1f2937;
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

/* Ipsumify light mode hover */
.light .tool-card--ipsumify:hover {
  box-shadow: 
    0 20px 40px -12px rgba(99, 102, 241, 0.2),
    0 0 0 1px rgba(99, 102, 241, 0.1);
}

/* TablesGenerator light mode hover */
.light .tool-card--tablesgenerator:hover {
  box-shadow: 
    0 20px 40px -12px rgba(245, 158, 11, 0.2),
    0 0 0 1px rgba(245, 158, 11, 0.1);
}

/* Squish light mode hover */
.light .tool-card--squish:hover {
  box-shadow:
    0 20px 40px -12px rgba(14, 165, 233, 0.2),
    0 0 0 1px rgba(14, 165, 233, 0.1);
}

/* PDF Audit light mode hover */
.light .tool-card--pdfaudit:hover {
  box-shadow:
    0 20px 40px -12px rgba(16, 185, 129, 0.2),
    0 0 0 1px rgba(16, 185, 129, 0.1);
}

/* Dialog background override - lighter to stand out from editor */
:deep([role="dialog"]) {
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%) !important;
}

.light :deep([role="dialog"]) {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
}
</style>
