# Tour Module

A reusable, accessible guided tour/onboarding module for Nuxt applications.

## Features

- **WCAG 2.1 AA Compliant**: Full keyboard navigation, screen reader announcements, focus management
- **Nuxt UI Integration**: Uses UPopover, UCard, UButton for consistent styling
- **Configurable**: Define steps in a TypeScript config file with full type safety
- **Responsive**: Works on mobile and desktop
- **Persistent**: Remembers when users complete the tour (localStorage)
- **Restartable**: Users can restart the tour anytime via trigger button

## Installation

Copy the entire `modules/tour/` folder to your Nuxt project's `app/` directory.

```
your-project/
├── app/
│   ├── modules/
│   │   └── tour/           # Copy this folder
│   │       ├── README.md
│   │       ├── types.ts
│   │       ├── composables/
│   │       │   └── useTour.ts
│   │       ├── components/
│   │       │   ├── TourOverlay.vue
│   │       │   └── TourTrigger.vue
│   │       └── styles/
│   │           └── tour.css
│   └── config/
│       └── tour.ts         # Create your app-specific config
```

## Setup

### 1. Import Tour Styles

Add the tour CSS to your main stylesheet:

```css
/* app/assets/css/main.css */
@import '~/modules/tour/styles/tour.css';
```

### 2. Create Your Tour Configuration

Create a config file with your app-specific tour steps:

```typescript
// app/config/tour.ts
import type { TourConfig } from '~/modules/tour/types'

export const tourConfig: TourConfig = {
  version: 1,
  autoStart: true,
  autoStartDelay: 800,
  storageKeyPrefix: 'my-app-tour',
  
  steps: [
    {
      id: 'welcome',
      target: '[data-tour="header"]',
      title: 'Welcome!',
      content: 'This is a quick tour of the main features.',
      position: 'bottom',
      icon: 'i-heroicons-hand-raised'
    },
    {
      id: 'feature-1',
      target: '[data-tour="feature-1"]',
      title: 'Feature One',
      content: 'Explanation of what this feature does.',
      tip: 'Pro tip: You can also use keyboard shortcuts!',
      shortcut: ['⌘', 'K'],
      position: 'right'
    },
    // Add more steps...
  ]
}
```

### 3. Add Tour Targets to Your Components

Add `data-tour` attributes to elements you want to highlight:

```vue
<template>
  <header data-tour="header">
    <!-- ... -->
  </header>
  
  <button data-tour="feature-1">
    Feature One
  </button>
</template>
```

### 4. Wire Up the Tour in Your Page

```vue
<script setup lang="ts">
import { useTour } from '~/modules/tour/composables/useTour'
import TourOverlay from '~/modules/tour/components/TourOverlay.vue'
import TourTrigger from '~/modules/tour/components/TourTrigger.vue'
import { tourConfig } from '~/config/tour'

// Initialize tour
const tour = useTour(tourConfig)

// Auto-start for first-time users
onMounted(() => {
  if (tour.autoStart && !tour.hasCompletedTour.value) {
    setTimeout(() => tour.start(), tour.autoStartDelay)
  }
})
</script>

<template>
  <div>
    <!-- Your app content -->
    
    <!-- Tour trigger button (for manual restart) -->
    <TourTrigger 
      icon-only 
      tooltip="Take a guided tour"
      @click="tour.start()" 
    />
    
    <!-- Tour overlay (renders when active) -->
    <TourOverlay
      :is-active="tour.isActive.value"
      :current-step="tour.currentStep.value"
      :progress="tour.progress.value"
      @next="tour.next()"
      @previous="tour.previous()"
      @cancel="tour.cancel()"
    />
  </div>
</template>
```

## Configuration Options

### TourConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `version` | `number` | - | Version number. Increment to reset completion for all users. |
| `autoStart` | `boolean` | `true` | Auto-start tour for first-time users. |
| `autoStartDelay` | `number` | `800` | Delay (ms) before auto-starting. |
| `storageKeyPrefix` | `string` | - | LocalStorage key prefix for completion tracking. |
| `steps` | `TourStep[]` | - | Array of tour step definitions. |

### TourStep

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | - | Unique identifier for the step. |
| `target` | `string` | - | CSS selector for the target element. |
| `title` | `string` | - | Step title in the popover header. |
| `content` | `string` | - | Main content/description. |
| `tip` | `string` | - | Optional tip shown below content. |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Popover position. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Popover alignment. |
| `highlight` | `boolean` | `true` | Show highlight ring around target. |
| `icon` | `string` | - | Iconify icon name for the header. |
| `shortcut` | `string[]` | - | Keyboard shortcut to display. |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Cancel tour |
| `→` (Arrow Right) | Next step |
| `←` (Arrow Left) | Previous step |
| `Tab` | Navigate within popover |

## Accessibility

This module is designed to meet WCAG 2.1 Level AA requirements:

- **2.1.1 Keyboard**: All functionality accessible via keyboard
- **2.1.2 No Keyboard Trap**: Escape always closes the tour
- **2.4.3 Focus Order**: Focus moves logically through the tour
- **2.4.6 Headings and Labels**: Each step has a clear title
- **2.5.3 Label in Name**: Button labels match accessible names
- **4.1.2 Name, Role, Value**: Proper ARIA roles and states
- **1.4.3 Contrast**: Meets 4.5:1 contrast ratios
- **2.3.3 Animation**: Respects `prefers-reduced-motion`

## Customization

### Styling

Override CSS custom properties or add your own styles:

```css
/* Custom highlight color */
[data-tour-active="true"]::before {
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
}
```

### Programmatic Control

```typescript
const tour = useTour(config)

// Jump to a specific step
tour.goToStep(2)

// Check current progress
console.log(tour.progress.value) // { current: 3, total: 8, percentage: 37 }

// Reset completion (user will see tour again)
tour.hasCompletedTour.value = false
```

## Dependencies

- Nuxt 3.x
- @nuxt/ui 3.x or 4.x
- @vueuse/core (for `useLocalStorage`)

## License

MIT
