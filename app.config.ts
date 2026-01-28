export default defineAppConfig({
  ui: {
    tooltip: {
      slots: {
        content: 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xl border border-neutral-800 dark:border-neutral-200 px-3 py-1.5 text-xs font-semibold rounded-md z-[9999] opacity-100 max-w-[200px] sm:max-w-xs break-words pointer-events-none'
      },
      defaultVariants: {
        delayDuration: 300,
        arrow: true
      }
    }
  }
})
