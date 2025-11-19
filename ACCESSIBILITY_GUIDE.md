# Accessibility Guide

This document outlines the accessibility features and WCAG compliance standards implemented in the tSmart Cleaning application.

## WCAG Compliance Status

This application aims to meet **WCAG 2.1 Level AA** standards, with many features meeting Level AAA requirements.

## Implemented Features

### 1. ARIA Labels and Attributes

- **Interactive Elements**: All buttons, links, and form inputs have appropriate ARIA labels
- **Navigation**: Menus use `aria-expanded`, `aria-haspopup`, and `role` attributes
- **Form Elements**: Inputs are properly labeled with `<label>` elements or `aria-label`
- **Icon-only Buttons**: All icon-only buttons include `aria-label` attributes
- **Decorative Icons**: Decorative SVG icons use `aria-hidden="true"`

#### Examples:
- Navigation menus: `aria-label="Services menu"`, `aria-expanded="false"`
- Dropdowns: `role="menu"`, `role="menuitem"`
- Mobile menu: `aria-controls="mobile-menu"`, `aria-expanded`
- Select components: `role="listbox"`, `role="option"`, `aria-selected`

### 2. Keyboard Navigation

- **Tab Order**: Logical tab order throughout the application
- **Focus Management**: Focus traps in modals and dialogs
- **Keyboard Shortcuts**:
  - `Tab`: Navigate forward through interactive elements
  - `Shift + Tab`: Navigate backward
  - `Enter`/`Space`: Activate buttons and select options
  - `Escape`: Close modals, dialogs, and dropdowns
  - Arrow keys: Navigate within lists and menus (where applicable)

- **Skip Links**: "Skip to main content" link available at the top of each page
- **Focus Indicators**: Visible focus outlines on all interactive elements (2px solid outline)

#### Components with Enhanced Keyboard Support:
- Dropdown menus
- Select components
- Modals and dialogs
- Mobile navigation
- Form inputs

### 3. Focus Indicators

- **Visible Focus**: All interactive elements show a 2px solid outline when focused via keyboard
- **Focus Offset**: 2px offset for better visibility
- **Color**: Uses theme's accent color for consistency
- **Mouse Users**: Focus outlines only appear on keyboard navigation (`:focus-visible`)

#### Focus States:
```css
*:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
  border-radius: 2px;
}
```

### 4. Color Contrast

All text meets WCAG AA contrast requirements:

- **Normal Text**: 4.5:1 contrast ratio minimum
  - Primary text: `#373d36` on `#f5f1eb` (~12:1) ✅ WCAG AAA
  - Muted text: Meets AA requirements
  
- **Large Text**: 3:1 contrast ratio minimum
  - All headings meet this requirement

- **Interactive Elements**: 
  - Buttons meet contrast requirements
  - Links are underlined for additional distinction

#### Color Combinations Tested:
- Primary text on light background: ✅ WCAG AAA
- Accent color buttons: ✅ WCAG AA
- Links: ✅ WCAG AA

### 5. Screen Reader Support

- **Semantic HTML**: Proper use of headings, lists, and landmarks
- **Live Regions**: Dynamic content announced via `aria-live` regions
- **Status Messages**: Form validation and success messages are announced
- **Page Structure**: 
  - `<header role="banner">`
  - `<nav role="navigation">`
  - `<main id="main">`
  - `<footer>`

### 6. Touch Targets

- **Minimum Size**: All interactive elements meet 44x44px minimum touch target size
- **Spacing**: Adequate spacing between touch targets
- **Mobile Optimization**: Larger touch targets on mobile devices

### 7. Responsive Design

- **Viewport**: Proper viewport meta tag
- **Text Scaling**: Text scales appropriately up to 200%
- **Layout**: Flexible layouts that work at different zoom levels
- **Orientation**: Supports both portrait and landscape orientations

### 8. Form Accessibility

- **Labels**: All form inputs have associated `<label>` elements
- **Error Messages**: 
  - Clear error messages associated with inputs via `aria-describedby`
  - Invalid inputs marked with `aria-invalid="true"`
- **Required Fields**: Indicated with `aria-required="true"` or visual indicators
- **Help Text**: Associated with inputs via `aria-describedby`

### 9. Reduced Motion

- **Respects Preferences**: Respects `prefers-reduced-motion` media query
- **Animations**: Animations can be disabled for users who prefer reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10. High Contrast Mode

- **Support**: Works with high contrast mode
- **Borders**: Enhanced borders in high contrast mode
- **Text**: Maintains readability in high contrast

## Testing with Screen Readers

### Recommended Tools:

1. **NVDA** (Windows, Free)
   - Download: https://www.nvaccess.org/
   - Test keyboard navigation and ARIA attributes

2. **JAWS** (Windows, Paid)
   - Industry standard screen reader
   - Comprehensive testing

3. **VoiceOver** (macOS/iOS, Built-in)
   - Enable: System Preferences → Accessibility → VoiceOver
   - Shortcut: `Cmd + F5`

4. **TalkBack** (Android, Built-in)
   - Enable in Android Accessibility settings

5. **ChromeVox** (Chrome Extension, Free)
   - Quick testing in Chrome browser

### Testing Checklist:

- [ ] All interactive elements are announced correctly
- [ ] Form labels are read when inputs are focused
- [ ] Error messages are announced
- [ ] Navigation menus are accessible
- [ ] Modal dialogs trap focus correctly
- [ ] Page structure (headings, landmarks) is logical
- [ ] Images have appropriate alt text
- [ ] Links have descriptive text
- [ ] Buttons have accessible names

## Keyboard Testing

### Test Navigation:
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test all functionality via keyboard only
4. Ensure no keyboard traps
5. Verify skip links work

### Browser Testing:
- Chrome/Edge (Windows): Use keyboard navigation
- Firefox (Windows): Use keyboard navigation
- Safari (macOS): Enable VoiceOver for testing

## Automated Testing Tools

### Recommended Tools:

1. **axe DevTools** (Browser Extension)
   - Comprehensive accessibility testing
   - Free version available

2. **WAVE** (Browser Extension)
   - Visual accessibility evaluation
   - Free tool by WebAIM

3. **Lighthouse** (Chrome DevTools)
   - Accessibility audit included
   - Scores accessibility automatically

4. **Pa11y** (Command Line)
   - Automated testing in CI/CD
   - Can be integrated into build process

## Common Issues to Avoid

### ❌ Don't:
- Use color alone to convey information
- Create keyboard traps
- Hide focus indicators with `outline: none`
- Use low contrast text
- Create links without descriptive text
- Use placeholder text as labels
- Auto-play audio/video
- Create blinking or flashing content

### ✅ Do:
- Provide text alternatives for images
- Ensure keyboard accessibility for all features
- Maintain sufficient color contrast
- Use semantic HTML
- Test with screen readers
- Provide skip links
- Label all form inputs
- Announce dynamic content changes

## Ongoing Maintenance

### Regular Checks:
1. Run automated accessibility tests with each build
2. Manual keyboard navigation testing
3. Screen reader testing on major updates
4. Color contrast checks for new components
5. Review user feedback for accessibility concerns

### When Adding New Features:
1. Ensure keyboard accessibility
2. Add appropriate ARIA attributes
3. Test with screen reader
4. Verify color contrast
5. Check touch target sizes
6. Test at different zoom levels

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Contact

For accessibility concerns or suggestions, please contact the development team.

