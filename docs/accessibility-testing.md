# Accessibility Testing Guidelines for tSmartCleaning

## Overview
This document provides guidelines for testing the accessibility improvements implemented in the tSmartCleaning Next.js application to ensure WCAG 2.1 AA compliance.

## Testing Categories

### 1. Keyboard Navigation Testing

#### Basic Keyboard Navigation
- **Test**: Navigate through all interactive elements using only the keyboard
- **Keys to test**: Tab, Shift+Tab, Enter, Space, Arrow keys, Escape
- **Expected behavior**:
  - All interactive elements should be reachable via keyboard
  - Focus indicators should be clearly visible (2px blue outline)
  - Tab order should be logical and follow visual flow
  - No keyboard traps (unless intentional in modals)

#### Navigation Dropdowns
- **Location**: Main navigation "Services" and "Support" dropdowns
- **Test steps**:
  1. Tab to dropdown trigger
  2. Press Enter or Space to open
  3. Use Arrow keys to navigate menu items
  4. Press Escape to close
  5. Verify focus returns to trigger button
- **Expected**: All menu items accessible, proper ARIA states

#### Modal/Dialog Focus Management
- **Location**: Insurance plan selection dialogs, any modal components
- **Test steps**:
  1. Open modal via keyboard
  2. Verify focus moves to first interactive element in modal
  3. Tab through all elements within modal
  4. Verify focus is trapped within modal
  5. Press Escape to close
  6. Verify focus returns to trigger element
- **Expected**: Focus properly trapped and managed

### 2. Screen Reader Testing

#### Recommended Screen Readers
- **Windows**: NVDA (free), JAWS
- **macOS**: VoiceOver (built-in)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

#### Key Areas to Test

##### Semantic Structure
- **Test**: Navigate by headings (H key in screen readers)
- **Expected**: Logical heading hierarchy (h1 → h2 → h3, etc.)
- **Locations**: All pages, especially insurance comparison table

##### Form Accessibility
- **Location**: Contact form (`/contact`), signup form (`/signup`)
- **Test areas**:
  - Field labels properly associated
  - Required fields announced as "required"
  - Error messages announced immediately
  - Fieldset/legend for grouped fields (name fields)
  - Password strength feedback read aloud

##### Table Accessibility
- **Location**: Insurance plan comparison table
- **Test**:
  - Table caption and headers read correctly
  - Cell associations clear
  - Navigate by table elements (T key, Ctrl+Alt+Arrow keys)

##### Live Regions
- **Test**: Dynamic content updates announced
- **Locations**: Form validation, success messages, loading states
- **Expected**: Changes announced without moving focus

### 3. Visual Testing

#### Focus Indicators
- **Test**: Verify all interactive elements have visible focus indicators
- **Standard**: 2px solid outline with sufficient contrast
- **Tools**: Manual testing, browser dev tools

#### Color Contrast
- **Standard**: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
- **Tools**: 
  - Browser extensions (axe DevTools, WAVE)
  - Online tools (WebAIM Contrast Checker)
  - Built-in utility: `/lib/accessibility.ts` `checkColorContrast()` function

#### Touch Targets
- **Standard**: Minimum 44x44px for touch targets
- **Test**: Verify buttons, links, form controls meet minimum size
- **Mobile testing**: Use device simulators and real devices

### 4. Automated Testing Tools

#### Browser Extensions
- **axe DevTools**: Comprehensive accessibility scanner
- **WAVE**: Visual accessibility evaluation
- **Lighthouse**: Built into Chrome DevTools

#### Testing Commands
```bash
# Install accessibility testing dependencies
npm install --save-dev @axe-core/react jest-axe

# Run automated tests (if implemented)
npm run test:a11y
```

#### Recommended Automated Checks
- HTML validity (W3C Markup Validator)
- ARIA attribute usage
- Color contrast ratios
- Image alt text presence
- Form label associations

### 5. Mobile Accessibility Testing

#### Key Areas
- **Touch targets**: Minimum 44x44px
- **Screen orientation**: Works in both portrait and landscape
- **Zoom**: Content accessible at 200% zoom
- **Voice control**: Compatible with voice navigation

#### Testing Tools
- **iOS**: VoiceOver, Voice Control
- **Android**: TalkBack, Voice Access
- **Real device testing**: Essential for accurate results

## Testing Checklist

### Page-Level Testing

#### Homepage
- [ ] Skip to content link functional
- [ ] Main navigation keyboard accessible
- [ ] All CTAs have descriptive labels
- [ ] Images have appropriate alt text

#### Contact Page (`/contact`)
- [ ] Form fields properly labeled
- [ ] Required fields indicated and announced
- [ ] Error messages associated with fields
- [ ] Success/error states announced
- [ ] Fieldset used for name fields

#### Signup Page (`/signup`)
- [ ] Password strength feedback accessible
- [ ] Show/hide password buttons labeled
- [ ] Social login buttons descriptive
- [ ] Terms acceptance checkbox accessible

#### Insurance Page (`/insurance`)
- [ ] Comparison table properly structured
- [ ] FAQ section collapsible and accessible
- [ ] Pricing calculator keyboard accessible
- [ ] Plan selection modals properly managed

### Component-Level Testing

#### Navigation
- [ ] Dropdown menus keyboard accessible
- [ ] ARIA states properly managed
- [ ] Focus management correct

#### Forms
- [ ] All fields have labels
- [ ] Error handling accessible
- [ ] Fieldsets used for grouped fields
- [ ] Progress indicators accessible

#### Tables
- [ ] Headers properly associated
- [ ] Caption describes table content
- [ ] Complex data relationships clear

## Common Issues to Watch For

### Critical Issues (WCAG A)
- Missing alt text for informative images
- Form fields without labels
- Insufficient color contrast
- Keyboard inaccessible functionality

### Important Issues (WCAG AA)
- Missing focus indicators
- Poor heading hierarchy
- Inadequate error identification
- Missing landmarks

### Enhancement Issues (WCAG AAA)
- Context-sensitive help
- Enhanced error suggestions
- Extended contrast requirements
- Advanced navigation features

## Testing Frequency

### During Development
- Run automated tools on every pull request
- Manual keyboard testing for new interactive features
- Screen reader testing for complex components

### Pre-Release
- Complete manual accessibility audit
- Cross-browser compatibility testing
- Mobile device testing
- User testing with individuals with disabilities (recommended)

### Post-Release
- Quarterly accessibility audits
- Monitor user feedback for accessibility issues
- Regular updates to testing procedures

## Resources

### Standards and Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Section 508 Standards](https://www.section508.gov/)
- [MDN Accessibility Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

## Contact

For questions about accessibility testing or to report accessibility issues:
- Create an issue in the project repository
- Email: accessibility@tsmartcleaning.com (if available)
- Review accessibility improvements in `/lib/accessibility.ts`