# Webflow Design System Integration Guide

This guide explains how to apply the Webflow design system to all pages in the application.

## Overview

The Webflow design system is already integrated via CSS variables and utility classes in `app/globals.css`. This guide shows how to use these classes consistently across all pages.

## Design Tokens

### Colors
- **Primary Accent**: `#c98769` (--accent-primary)
- **Primary Hover**: `#d9ab96` (--accent-primary-hover)
- **Background**: `#f5f1eb` (--neutral-primary)
- **Secondary Background**: `#e6dcd4` (--neutral-secondary)
- **Text**: `#373d36` (--neutral-inverse)

### Typography
- **Sans Font**: "Instrument Sans" (body text)
- **Heading Font**: "Lexend" (headings)
- **Heading Sizes**: Use `.heading_h1` through `.heading_h6` classes
- **Text Sizes**: Use `.text-sm`, `.text-lg`, `.text-xl`, `.text-xxl`

### Spacing
- **Section Padding**: `.section` class provides `8rem` vertical padding
- **Container**: `.container` class provides max-width and horizontal padding

## Core Components

### 1. Sections

Use the `WebflowSection` component or apply classes directly:

```tsx
import { WebflowSection } from '@/components/webflow/WebflowSection'

// Using component
<WebflowSection variant="secondary">
  <h2 className="heading_h2">Section Title</h2>
  <p>Content here</p>
</WebflowSection>

// Or using classes directly
<section className="section is-secondary">
  <div className="container">
    <h2 className="heading_h2">Section Title</h2>
    <p>Content here</p>
  </div>
</section>
```

**Variants:**
- `default` - Light background (default)
- `secondary` - Secondary background color
- `inverse` - Dark background with light text

### 2. Headings

Always use Webflow heading classes for consistent typography:

```tsx
<h1 className="heading_h1">Main Heading</h1>
<h2 className="heading_h2">Section Heading</h2>
<h3 className="heading_h3">Subsection Heading</h3>
<h4 className="heading_h4">Card Title</h4>
<h5 className="heading_h5">Small Heading</h5>
<h6 className="heading_h6">Label Heading</h6>
```

**Alternative classes:**
- `.text-h0` - Extra large display heading
- `.heading_h1` through `.heading_h6` - Standard headings

### 3. Buttons

Use the `WebflowButton` component or apply classes directly:

```tsx
import { WebflowButton } from '@/components/webflow/WebflowButton'

// Using component
<WebflowButton variant="primary">Primary Button</WebflowButton>
<WebflowButton variant="secondary" href="/page">Link Button</WebflowButton>

// Or using classes directly
<button className="button">Primary Button</button>
<button className="button is-secondary">Secondary Button</button>
<a href="/page" className="button">Link Button</a>
```

### 4. Cards

Use the `WebflowCard` component or apply classes directly:

```tsx
import { WebflowCard } from '@/components/webflow/WebflowCard'

// Using component
<WebflowCard>
  <h3 className="heading_h3">Card Title</h3>
  <p>Card content</p>
</WebflowCard>

// Or using classes directly
<div className="card">
  <div className="card_body">
    <h3 className="heading_h3">Card Title</h3>
    <p>Card content</p>
  </div>
</div>
```

### 5. Text Utilities

```tsx
<p className="paragraph_small">Small text</p>
<p className="paragraph_large">Large text</p>
<p className="paragraph_xlarge">Extra large text</p>
<p className="subheading">Subheading text</p>
<p className="eyebrow">Eyebrow text (small label)</p>
```

### 6. Links

```tsx
<a href="/page" className="text-link">Standard Link</a>
<a href="/page" className="text-link is-secondary">Secondary Link</a>
```

## Layout Patterns

### Hero Section

```tsx
<section className="section padding_none">
  <div className="container z-index_2">
    <div className="header is-align-center">
      <h1 className="heading_h1">Hero Title</h1>
      <p className="paragraph_large">Hero description</p>
      <div className="button-group">
        <a href="/action" className="button">Primary CTA</a>
        <a href="/learn-more" className="button is-secondary">Secondary CTA</a>
      </div>
    </div>
  </div>
</section>
```

### Content Section

```tsx
<section className="section">
  <div className="container">
    <div className="text-align_center mb-8">
      <h2 className="heading_h2">Section Title</h2>
      <p className="paragraph_large text-color_secondary">Section description</p>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {/* Cards or content */}
    </div>
  </div>
</section>
```

### Stats Section

```tsx
<section className="section is-secondary">
  <div className="container">
    <div className="grid md:grid-cols-4 gap-8 text-align_center">
      <div>
        <div className="heading_h2">10K+</div>
        <div className="paragraph_small text-color_secondary">Active Users</div>
      </div>
      {/* More stats */}
    </div>
  </div>
</section>
```

## Webflow Animations

Webflow animations are handled via the `webflow.js` script. To add animations:

1. **Add animation classes** to elements:
   ```tsx
   <div className="ix_parallax-scale-out-hero">
     {/* Animated content */}
   </div>
   ```

2. **Use Webflow interaction classes**:
   - `w-animate` - Basic animation
   - `w-fade-in` - Fade in animation
   - `w-slide-in` - Slide in animation

3. **Common animation classes from Webflow**:
   - `ix_parallax-scale-out-hero` - Hero parallax effect
   - `ix_fade-in-up` - Fade in from bottom
   - `ix_fade-in` - Simple fade in

## Migration Checklist

When updating a page to use the Webflow design system:

- [ ] Replace generic `<section>` with `.section` class
- [ ] Wrap content in `.container` div
- [ ] Replace heading tags with Webflow heading classes (`.heading_h1`, etc.)
- [ ] Replace buttons with `.button` class or `WebflowButton` component
- [ ] Replace cards with `.card` class or `WebflowCard` component
- [ ] Use Webflow text utility classes (`.paragraph_small`, `.paragraph_large`, etc.)
- [ ] Apply appropriate section variants (`.is-secondary`, `.is-inverse`)
- [ ] Add Webflow animation classes where appropriate
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify cross-browser compatibility

## Example: Migrated Page

**Before:**
```tsx
<section className="py-20 bg-muted/30">
  <div className="container mx-auto px-4">
    <h1 className="text-4xl font-bold mb-6">Title</h1>
    <p className="text-lg text-muted-foreground">Description</p>
    <button className="px-4 py-2 bg-primary text-white">Button</button>
  </div>
</section>
```

**After:**
```tsx
<section className="section is-secondary">
  <div className="container">
    <h1 className="heading_h1 mb-6">Title</h1>
    <p className="paragraph_large text-color_secondary">Description</p>
    <button className="button">Button</button>
  </div>
</section>
```

## Best Practices

1. **Consistency**: Always use Webflow classes for typography, spacing, and components
2. **Semantic HTML**: Use proper HTML elements (`<section>`, `<article>`, etc.) with Webflow classes
3. **Responsive**: Webflow classes are responsive by default, but test on all breakpoints
4. **Accessibility**: Ensure proper heading hierarchy and ARIA labels
5. **Performance**: Webflow animations are optimized, but avoid overusing them

## Resources

- Design tokens: `app/globals.css`
- Webflow CSS: `css/tsmartcleaning-ff34e6.webflow.css`
- Webflow scripts: `components/WebflowScripts.tsx`
- Example homepage: `app/page.tsx` (uses static HTML with Webflow classes)

