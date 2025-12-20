# CSS Patterns

## Theme Configuration

Tailwind config with warm color palette:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm terracotta palette (preserving existing viewer colors)
        primary: {
          DEFAULT: '#D4A27F',
          foreground: '#FFFFFF'
        },
        background: {
          DEFAULT: '#FDFDF7', // light mode
          dark: '#09090B'     // dark mode
        },
        status: {
          running: '#3B82F6',   // blue
          success: '#10B981',   // green
          failed: '#EF4444',    // red
          pending: '#9CA3AF'    // gray
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;
```

CSS variables for theme:

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 25 49% 66%; /* #D4A27F terracotta */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%; /* #09090B */
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 25 49% 66%; /* Same terracotta */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Animations

Pulsing animation for running status:

```css
@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse-dot {
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spinner animation for in-progress features */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}
```

Smooth transitions:

```css
/* Progress bar smooth animation */
.progress-bar {
  transition: width 0.5s ease-in-out;
}

/* Card hover effect */
.plan-card {
  @apply transition-all duration-200 hover:shadow-lg hover:scale-[1.01];
}

/* Fade in animation for new items */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

## Layout Patterns

Sidebar layout:

```css
/* App layout with sidebar */
.app-layout {
  @apply flex h-screen overflow-hidden;
}

.app-sidebar {
  @apply w-64 flex-shrink-0 border-r bg-card;
}

.app-main {
  @apply flex-1 flex flex-col overflow-hidden;
}

.app-header {
  @apply h-16 border-b bg-card px-6 flex items-center justify-between;
}

.app-content {
  @apply flex-1 overflow-auto;
}
```

Split panel layout:

```css
/* Master-detail split panels */
.split-panels {
  @apply grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6;
}

.panel-list {
  @apply overflow-auto border rounded-lg bg-card p-4;
}

.panel-detail {
  @apply overflow-auto border rounded-lg bg-card p-6;
}

/* Responsive: stack vertically on mobile */
@media (max-width: 768px) {
  .split-panels {
    @apply grid-cols-1;
  }
}
```

Responsive breakpoints:

```css
/* Sidebar collapse on mobile */
@media (max-width: 1024px) {
  .app-sidebar {
    @apply hidden;
  }

  /* Show sheet drawer instead */
  .mobile-nav-trigger {
    @apply block;
  }
}

/* Compact cards on smaller screens */
@media (max-width: 640px) {
  .plan-card {
    @apply p-3;
  }

  .plan-card-header {
    @apply text-sm;
  }
}
```

## Component Styles

Card shadows and borders:

```css
.card-elevated {
  @apply bg-card border shadow-sm rounded-lg;
}

.card-elevated:hover {
  @apply shadow-md;
}

/* Plan card specific styles */
.plan-card-active {
  @apply border-blue-500 border-2;
}

.plan-card-completed {
  @apply border-green-500;
}

.plan-card-failed {
  @apply border-red-500;
}
```

Progress bars:

```css
.progress-container {
  @apply w-full h-2 bg-muted rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full bg-primary transition-all duration-500 ease-out;
}

/* Striped animation for active progress */
@keyframes progress-stripe {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}

.progress-bar-active {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40px 40px;
  animation: progress-stripe 1s linear infinite;
}
```

Badges and status indicators:

```css
.badge-running {
  @apply bg-blue-500 text-white;
}

.badge-completed {
  @apply bg-green-500 text-white;
}

.badge-failed {
  @apply bg-red-500 text-white;
}

.badge-pending {
  @apply bg-gray-500 text-white;
}

/* Status dot */
.status-dot {
  @apply inline-block w-2 h-2 rounded-full mr-2;
}

.status-dot-running {
  @apply bg-blue-500 animate-pulse;
}

.status-dot-success {
  @apply bg-green-500;
}

.status-dot-failed {
  @apply bg-red-500;
}
```

## Responsive

Mobile-first responsive design:

```css
/* Base: Mobile styles */
.metrics-grid {
  @apply grid grid-cols-1 gap-4;
}

.chart-container {
  @apply w-full h-64;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .metrics-grid {
    @apply grid-cols-2;
  }

  .chart-container {
    @apply h-80;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .metrics-grid {
    @apply grid-cols-4;
  }
}

/* Large desktop: 1280px+ */
@media (min-width: 1280px) {
  .chart-container {
    @apply h-96;
  }
}
```

Container queries for adaptive components:

```css
/* Use container queries for card layouts */
.orchestrations-container {
  container-type: inline-size;
}

/* Compact view when container is narrow */
@container (max-width: 600px) {
  .plan-card {
    @apply p-3;
  }

  .plan-features {
    @apply hidden; /* Hide feature list in compact view */
  }
}
```

## Utility Classes

Custom utility classes:

```css
@layer utilities {
  /* Scrollbar styling */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: theme('colors.muted.DEFAULT') transparent;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: theme('colors.muted.DEFAULT');
    border-radius: 4px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: theme('colors.muted.foreground');
  }

  /* Text truncation */
  .truncate-2-lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .truncate-3-lines {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```
