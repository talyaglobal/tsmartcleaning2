# Webflow Design System - Quick Reference

Quick reference guide for applying Webflow design system classes.

## Import Components

```tsx
import { WebflowSection, WebflowButton, WebflowCard } from '@/components/webflow'
```

## Common Patterns

### Hero Section
```tsx
<section className="section padding_none">
  <div className="container z-index_2">
    <div className="header is-align-center">
      <h1 className="heading_h1">Title</h1>
      <p className="paragraph_large">Description</p>
      <div className="button-group">
        <WebflowButton>Primary CTA</WebflowButton>
        <WebflowButton variant="secondary">Secondary CTA</WebflowButton>
      </div>
    </div>
  </div>
</section>
```

### Content Section
```tsx
<WebflowSection variant="secondary">
  <div className="text-align_center mb-8">
    <h2 className="heading_h2">Section Title</h2>
    <p className="paragraph_large text-color_secondary">Description</p>
  </div>
  <div className="grid md:grid-cols-3 gap-6">
    <WebflowCard>
      <h3 className="heading_h3">Card Title</h3>
      <p className="paragraph_small">Card content</p>
    </WebflowCard>
  </div>
</WebflowSection>
```

### Stats Section
```tsx
<WebflowSection>
  <div className="grid md:grid-cols-4 gap-8 text-align_center">
    <div>
      <div className="heading_h2">10K+</div>
      <div className="paragraph_small text-color_secondary">Label</div>
    </div>
  </div>
</WebflowSection>
```

## Class Reference

### Sections
- `.section` - Standard section with padding
- `.section.is-secondary` - Secondary background
- `.section.is-inverse` - Dark background
- `.container` - Content container
- `.container.is-small` - Smaller container

### Typography
- `.heading_h1` through `.heading_h6` - Headings
- `.text-h0` - Extra large display heading
- `.paragraph_small` - Small text
- `.paragraph_large` - Large text
- `.paragraph_xlarge` - Extra large text
- `.subheading` - Subheading style
- `.eyebrow` - Small label text

### Buttons
- `.button` - Primary button
- `.button.is-secondary` - Secondary button
- `.text-link` - Text link
- `.text-link.is-secondary` - Secondary text link

### Cards
- `.card` - Card container
- `.card.is-inverse` - Dark card
- `.card.on-secondary` - Card on secondary background
- `.card_body` - Card content area
- `.card_body_small` - Smaller card content

### Utilities
- `.text-align_center` - Center text
- `.text-color_secondary` - Secondary text color
- `.text-color_inverse-secondary` - Secondary text on dark
- `.on-inverse` - Light text on dark background
- `.text_all-caps` - Uppercase text

### Spacing
- `.margin-bottom_none` - No bottom margin
- `.margin-top_small` - Small top margin
- `.padding-top_xsmall` - Small top padding

## Migration Checklist

When updating a page:
1. Replace `<section className="py-20">` → `<WebflowSection>` or `<section className="section">`
2. Replace `<div className="container mx-auto px-4">` → `<div className="container">`
3. Replace `<h1 className="text-4xl font-bold">` → `<h1 className="heading_h1">`
4. Replace `<button className="px-4 py-2 bg-primary">` → `<WebflowButton>` or `<button className="button">`
5. Replace `<div className="p-6 border rounded">` → `<WebflowCard>` or `<div className="card">`

## See Also

- Full documentation: `docs/WEBFLOW_DESIGN_SYSTEM.md`
- Cross-browser testing: `docs/CROSS_BROWSER_TESTING.md`

