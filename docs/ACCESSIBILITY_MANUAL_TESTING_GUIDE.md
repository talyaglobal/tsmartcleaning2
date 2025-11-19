# Accessibility Manual Testing Guide

This guide provides step-by-step instructions for manually testing accessibility features that cannot be fully automated.

## Table of Contents

1. [Screen Reader Testing](#screen-reader-testing)
2. [Keyboard Navigation Testing](#keyboard-navigation-testing)
3. [High Contrast Mode Testing](#high-contrast-mode-testing)
4. [Focus Indicator Testing](#focus-indicator-testing)
5. [Testing Checklist](#testing-checklist)

---

## Screen Reader Testing

### NVDA (Windows - Free)

**Installation:**
1. Download from: https://www.nvaccess.org/download/
2. Install and restart your computer
3. NVDA will start automatically

**Basic Commands:**
- `Insert + Q`: Quit NVDA
- `Insert + S`: Toggle speech
- `Insert + Down Arrow`: Read current line
- `Insert + Up Arrow`: Read from top
- `H`: Navigate to next heading
- `K`: Navigate to next link
- `B`: Navigate to next button
- `F`: Navigate to next form field
- `Insert + F7`: Open elements list

**Testing Steps:**

1. **Homepage Navigation**
   - [ ] Start NVDA and navigate to homepage
   - [ ] Press `H` to navigate through headings
   - [ ] Verify heading hierarchy (H1 → H2 → H3)
   - [ ] Press `K` to navigate through links
   - [ ] Verify all links are announced with descriptive text
   - [ ] Press `B` to navigate through buttons
   - [ ] Verify all buttons have accessible names

2. **Form Testing**
   - [ ] Navigate to a form (e.g., `/customer/book`)
   - [ ] Press `F` to navigate through form fields
   - [ ] Verify each input field announces its label
   - [ ] Fill out the form and verify error messages are announced
   - [ ] Verify required fields are indicated

3. **Navigation Menu**
   - [ ] Navigate to navigation menu
   - [ ] Use arrow keys to navigate dropdown menus
   - [ ] Verify menu items are announced correctly
   - [ ] Verify menu state (expanded/collapsed) is announced

4. **Dynamic Content**
   - [ ] Trigger actions that update content (e.g., form submission)
   - [ ] Verify success/error messages are announced
   - [ ] Verify loading states are announced

### JAWS (Windows - Paid)

**Installation:**
1. Download trial from: https://www.freedomscientific.com/products/software/jaws/
2. Install and activate trial license

**Basic Commands:**
- `Insert + F4`: Open JAWS settings
- `Insert + Down Arrow`: Read current line
- `H`: Navigate to next heading
- `K`: Navigate to next link
- `B`: Navigate to next button
- `F`: Navigate to next form field

**Testing Steps:**
Follow the same steps as NVDA testing above.

### VoiceOver (macOS/iOS - Built-in)

**Enable VoiceOver:**
- **macOS**: System Preferences → Accessibility → VoiceOver → Enable
- **Shortcut**: `Cmd + F5` (or `Cmd + Fn + F5`)
- **iOS**: Settings → Accessibility → VoiceOver → On

**Basic Commands (macOS):**
- `Control + Option + Right Arrow`: Move to next item
- `Control + Option + Left Arrow`: Move to previous item
- `Control + Option + H`: Navigate to next heading
- `Control + Option + L`: Navigate to next link
- `Control + Option + B`: Navigate to next button
- `Control + Option + F`: Navigate to next form field
- `Control + Option + Space`: Activate item

**Testing Steps:**

1. **Homepage Navigation**
   - [ ] Enable VoiceOver and navigate to homepage
   - [ ] Use `Control + Option + H` to navigate headings
   - [ ] Verify heading hierarchy is logical
   - [ ] Use `Control + Option + L` to navigate links
   - [ ] Verify link text is descriptive
   - [ ] Use `Control + Option + B` to navigate buttons
   - [ ] Verify button labels are clear

2. **Form Testing**
   - [ ] Navigate to a form
   - [ ] Use `Control + Option + F` to navigate form fields
   - [ ] Verify labels are announced before input
   - [ ] Test error message announcements
   - [ ] Verify required field indicators

3. **Mobile Testing (iOS)**
   - [ ] Enable VoiceOver on iPhone/iPad
   - [ ] Navigate to website in Safari
   - [ ] Swipe right to navigate through elements
   - [ ] Double-tap to activate
   - [ ] Verify all interactive elements are accessible
   - [ ] Test touch target sizes (should be easy to tap)

### TalkBack (Android - Built-in)

**Enable TalkBack:**
- Settings → Accessibility → TalkBack → On
- Or use shortcut: Hold both volume keys

**Basic Gestures:**
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Swipe up then right: Open TalkBack menu

**Testing Steps:**
- [ ] Enable TalkBack and navigate to website
- [ ] Swipe through all interactive elements
- [ ] Verify all elements are announced
- [ ] Test form filling with TalkBack
- [ ] Verify touch targets are large enough

---

## Keyboard Navigation Testing

### Testing Procedure

1. **Disable Mouse**
   - Unplug mouse or disable in system settings
   - Use only keyboard for navigation

2. **Basic Navigation**
   - [ ] Press `Tab` to move forward through interactive elements
   - [ ] Press `Shift + Tab` to move backward
   - [ ] Verify logical tab order (top to bottom, left to right)
   - [ ] Verify no keyboard traps (can always navigate away)

3. **Skip Links**
   - [ ] Press `Tab` on page load
   - [ ] Verify "Skip to main content" link appears
   - [ ] Press `Enter` to activate skip link
   - [ ] Verify focus moves to main content

4. **Dropdown Menus**
   - [ ] Tab to dropdown toggle button
   - [ ] Press `Enter` or `Space` to open dropdown
   - [ ] Use `Arrow Down` to navigate menu items
   - [ ] Use `Arrow Up` to navigate backward
   - [ ] Press `Escape` to close dropdown
   - [ ] Verify focus returns to toggle button

5. **Forms**
   - [ ] Tab through all form fields
   - [ ] Verify labels are associated with inputs
   - [ ] Use `Space` to check/uncheck checkboxes
   - [ ] Use `Arrow` keys to select radio buttons
   - [ ] Use `Arrow` keys to navigate select dropdowns
   - [ ] Press `Enter` to submit form
   - [ ] Verify error messages are focusable

6. **Modals/Dialogs**
   - [ ] Open a modal (e.g., cookie consent)
   - [ ] Verify focus is trapped inside modal
   - [ ] Tab through modal elements
   - [ ] Verify `Tab` doesn't escape modal
   - [ ] Press `Escape` to close modal
   - [ ] Verify focus returns to trigger element

7. **Buttons and Links**
   - [ ] Tab to a button
   - [ ] Press `Enter` to activate
   - [ ] Press `Space` to activate
   - [ ] Verify both work correctly
   - [ ] Test with links (should activate with `Enter`)

8. **Data Tables** (if applicable)
   - [ ] Navigate to table with `Tab`
   - [ ] Use `Arrow` keys to navigate cells
   - [ ] Verify table headers are announced
   - [ ] Verify row/column relationships are clear

---

## High Contrast Mode Testing

### Windows High Contrast Mode

**Enable:**
1. Settings → Ease of Access → High Contrast
2. Turn on "High Contrast" toggle
3. Select a high contrast theme
4. Click "Apply"

**Testing Steps:**
- [ ] Navigate to homepage
- [ ] Verify all text is readable
- [ ] Verify buttons have visible borders
- [ ] Verify links are distinguishable
- [ ] Verify form inputs have visible borders
- [ ] Verify images have sufficient contrast
- [ ] Test all pages in high contrast mode

### macOS Increase Contrast

**Enable:**
1. System Preferences → Accessibility → Display
2. Check "Increase contrast"
3. Optionally check "Reduce transparency"

**Testing Steps:**
- [ ] Navigate through all pages
- [ ] Verify text remains readable
- [ ] Verify interactive elements are visible
- [ ] Verify focus indicators are visible

### Browser High Contrast Extensions

**Chrome/Edge:**
- Install "High Contrast" extension
- Test website with extension enabled

**Testing Steps:**
- [ ] Enable high contrast extension
- [ ] Verify all content is readable
- [ ] Verify interactive elements are visible
- [ ] Test form filling
- [ ] Test navigation

---

## Focus Indicator Testing

### Visual Testing

1. **Enable Keyboard Navigation**
   - [ ] Disable mouse
   - [ ] Use only keyboard

2. **Test Focus Visibility**
   - [ ] Tab through all interactive elements
   - [ ] Verify each element shows a visible focus indicator
   - [ ] Verify focus indicator is at least 2px wide
   - [ ] Verify focus indicator has sufficient contrast
   - [ ] Verify focus indicator is not obscured by other elements

3. **Test Focus Styles**
   - [ ] Verify focus outline is visible
   - [ ] Verify focus outline has offset (not touching element)
   - [ ] Verify focus color contrasts with background
   - [ ] Verify focus indicator works on all background colors

4. **Test Focus Order**
   - [ ] Tab through page in logical order
   - [ ] Verify focus doesn't jump unexpectedly
   - [ ] Verify focus order matches visual order
   - [ ] Verify no elements are skipped

### Automated Focus Testing

Run the automated test:
```bash
npm run test:e2e -- tests/e2e/accessibility.test.ts
```

---

## Testing Checklist

### Pre-Testing Setup

- [ ] Install screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Enable high contrast mode
- [ ] Disable mouse for keyboard testing
- [ ] Clear browser cache
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)

### Critical Pages to Test

- [ ] Homepage (`/`)
- [ ] Find Cleaners (`/find-cleaners`)
- [ ] Booking Flow (`/customer/book`)
- [ ] Login (`/login`)
- [ ] Signup (`/signup`)
- [ ] Provider Dashboard (`/provider/dashboard`)
- [ ] Customer Dashboard (`/customer/dashboard`)
- [ ] Admin Dashboard (`/admin`)
- [ ] Insurance Page (`/insurance`)
- [ ] Contact Page (`/contact`)

### Screen Reader Checklist

- [ ] All headings are announced correctly
- [ ] Heading hierarchy is logical (H1 → H2 → H3)
- [ ] All links have descriptive text
- [ ] All buttons have accessible names
- [ ] Form labels are announced with inputs
- [ ] Error messages are announced
- [ ] Required fields are indicated
- [ ] Navigation menus are accessible
- [ ] Dropdown menus work with keyboard
- [ ] Dynamic content changes are announced
- [ ] Images have alt text or are marked decorative
- [ ] Tables have proper headers (if applicable)

### Keyboard Navigation Checklist

- [ ] Skip to main content link works
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] No keyboard traps
- [ ] Dropdowns open/close with keyboard
- [ ] Forms are fully keyboard navigable
- [ ] Modals trap focus correctly
- [ ] Escape key closes modals/dropdowns
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate menus/lists

### Focus Indicator Checklist

- [ ] All interactive elements show focus indicators
- [ ] Focus indicators are visible (2px+ outline)
- [ ] Focus indicators have sufficient contrast
- [ ] Focus indicators are not obscured
- [ ] Focus order matches visual order
- [ ] Focus indicators work on all backgrounds

### High Contrast Mode Checklist

- [ ] All text is readable
- [ ] Buttons have visible borders
- [ ] Links are distinguishable
- [ ] Form inputs have visible borders
- [ ] Images have sufficient contrast
- [ ] Focus indicators are visible
- [ ] Interactive elements are clearly defined

### Mobile Accessibility Checklist

- [ ] Touch targets are at least 44x44px
- [ ] Text is readable without zooming
- [ ] Forms work on mobile
- [ ] Navigation works on mobile
- [ ] VoiceOver/TalkBack works correctly
- [ ] Gestures work as expected

---

## Reporting Issues

When you find accessibility issues:

1. **Document the Issue:**
   - Page URL
   - Screen reader/browser used
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshot/video (if applicable)

2. **Priority Levels:**
   - **Critical**: Blocks core functionality
   - **High**: Affects major features
   - **Medium**: Affects minor features
   - **Low**: Cosmetic or enhancement

3. **Report Format:**
   ```
   **Issue:** [Brief description]
   **Page:** [URL]
   **Screen Reader:** [NVDA/JAWS/VoiceOver]
   **Browser:** [Chrome/Firefox/Safari/Edge]
   **Steps to Reproduce:**
   1. [Step 1]
   2. [Step 2]
   **Expected:** [What should happen]
   **Actual:** [What actually happens]
   **Priority:** [Critical/High/Medium/Low]
   ```

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## Notes

- Manual testing should be done regularly, especially after major updates
- Test with real users who use assistive technologies when possible
- Keep a log of all accessibility testing sessions
- Update this guide as new issues are discovered and fixed

