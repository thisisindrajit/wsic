# Styling Guide

This document covers the styling patterns, design system, and visual guidelines used in the WSIC application.

## Design System

### Color Palette

The application uses a teal-based color scheme with neutral backgrounds:

```css
/* Primary Colors */
--teal-400: #2dd4bf
--teal-500: #14b8a6
--teal-600: #0d9488

/* Neutral Colors */
--background: hsl(var(--background))
--foreground: hsl(var(--foreground))
--border: hsl(var(--border))
```

### Typography

**Font Family:** Geist Sans (Vercel's font)
- Weights: 100-900 available
- Optimized for web performance
- Clean, modern appearance

**Typography Scale:**
```css
/* Headings */
text-4xl/normal   /* 36px / 36px line-height */
text-5xl/normal   /* 48px / 48px line-height */
text-6xl/normal   /* 60px / 60px line-height */

/* Body Text */
text-base         /* 16px */
text-lg           /* 18px */
text-xl           /* 20px */
text-2xl/normal   /* 24px / 24px line-height */

/* Small Text */
text-sm           /* 14px */
text-xs           /* 12px */
```

## Component Styling Patterns

### Glassmorphism Design

Used extensively in the Block component and interactive elements:

```css
/* Base glassmorphism */
backdrop-blur-xl bg-background/5 border

/* Enhanced glassmorphism with hover */
backdrop-blur-md bg-background/10 border border-background/20
hover:bg-background/20 hover:border-background/30
```

### Gradient Effects

**Text Gradients:**
```css
.gradient-text {
  @apply text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-teal-400;
}
```

**Background Gradients:**
```css
/* Overlay gradients for readability */
bg-gradient-to-t from-foreground via-foreground/75 to-transparent

/* Separator gradients */
bg-gradient-to-r from-transparent via-border to-transparent
```

### Animation Patterns

**Hover Animations:**
```css
/* Scale animation */
hover:scale-[1.1] transition-all

/* Transform with duration */
transition-transform duration-400 group-hover:scale-110

/* Opacity transitions */
opacity-0 group-hover:opacity-100 transition-opacity duration-300
```

**Loading Animations:**
```css
/* Spinner */
animate-spin rounded-full h-4 w-4 border-2 border-foreground border-t-transparent
```

## Layout Patterns

### Responsive Design

**Breakpoint Strategy:**
- Mobile-first approach
- Key breakpoints: `sm:`, `md:`, `lg:`, `xl:`

**Grid Layouts:**
```css
/* Responsive grid for blocks */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4

/* Flexible layouts */
flex flex-col md:flex-row items-stretch gap-4
```

### Spacing System

**Consistent spacing using Tailwind's scale:**
```css
gap-3     /* 12px */
gap-4     /* 16px */
gap-6     /* 24px */
p-4       /* 16px padding */
p-6       /* 24px padding */
py-12     /* 48px vertical padding */
```

## Component-Specific Styling

### Block Component

**Key Features:**
- Aspect ratio: `aspect-[2/2.5]`
- Full background image with overlay
- Glassmorphism content area
- Hover effects with scale and glow

```css
/* Background image setup */
.block-image {
  @apply absolute inset-0 rounded-3xl overflow-hidden;
}

/* Content overlay */
.block-content {
  @apply relative z-10 p-6 h-full flex flex-col justify-end;
}

/* Glassmorphism button */
.block-button {
  @apply w-full rounded-full backdrop-blur-md bg-background/10 
         border border-background/20 text-background 
         hover:bg-background/20 hover:border-background/30;
}
```

### Input Styling

**Search Input Pattern:**
```css
/* Large search input */
.search-input {
  @apply h-auto border-x-0 border-t-0 border-foreground 
         text-4xl/normal md:text-5xl/normal xl:text-6xl/normal font-light p-0
         focus-visible:ring-none focus-visible:ring-[0px] 
         focus-visible:border-teal-500 focus-visible:text-teal-500 transition-all;
}
```

### Button Variants

**Primary Button:**
```css
.btn-primary {
  @apply bg-teal-500 text-background hover:bg-teal-500/90 transition-all;
}
```

**Outline Button:**
```css
.btn-outline {
  @apply border-foreground hover:border-teal-500 hover:bg-transparent 
         hover:scale-[1.1] rounded-3xl transition-all;
}
```

**Ghost Button:**
```css
.btn-ghost {
  @apply backdrop-blur-md bg-background/10 border border-background/20 
         hover:bg-background/20 hover:border-background/30;
}
```

## Accessibility Considerations

### Focus States

All interactive elements include proper focus states:

```css
/* Focus ring for buttons */
focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2

/* Focus states for inputs */
focus-visible:border-teal-500 focus-visible:text-teal-500
```

### Color Contrast

- Text maintains WCAG AA contrast ratios
- Drop shadows used for text over images
- Border colors provide sufficient contrast

### Motion Preferences

Consider adding motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
}
```

## Utility Classes

### Custom Utilities

**Line Clamping:**
```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Drop Shadows:**
```css
.drop-shadow-lg {
  filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));
}

.drop-shadow-md {
  filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
}
```

## Performance Considerations

### CSS Optimization

- Tailwind CSS purges unused styles in production
- Critical CSS inlined for above-the-fold content
- Font loading optimized with `font-display: swap`

### Animation Performance

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating layout properties
- Use `will-change` sparingly and remove after animation

## Brand Guidelines

### Logo Usage

The WSIC logo uses a 2x2 grid pattern:
```
W S
I C
```

**Implementation:**
```css
.logo {
  @apply h-9 w-9 grid grid-cols-2 grid-rows-2 font-medium 
         border border-foreground p-0.5 text-xs place-items-center;
}
```

### Voice and Tone

- Clean, modern aesthetic
- Emphasis on readability and accessibility
- Subtle animations that enhance UX
- Consistent spacing and typography
- Teal accent color for interactive elements

This styling guide ensures consistency across the application while maintaining flexibility for future enhancements.