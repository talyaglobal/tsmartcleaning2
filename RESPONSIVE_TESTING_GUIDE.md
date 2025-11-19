# Responsive Design Manual Testing Guide

## Overview

The `ResponsiveDesignTest` component is available on the homepage in development mode to help with manual responsive design testing. It provides real-time viewport information and breakpoint presets.

## How to Access

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the homepage:**
   - Open `http://localhost:3000` in your browser

3. **Look for the test button:**
   - A blue "📱 Test" button appears in the bottom-right corner (only in development mode)
   - Click it to open the testing panel

## How to Use

### Step-by-Step Testing Process

1. **Open the test panel:**
   - Click the "📱 Test" button in the bottom-right corner

2. **Select a breakpoint preset:**
   - Click one of the preset buttons (Mobile, Tablet, Desktop, etc.)
   - The component will log the target width to the console

3. **Open browser DevTools:**
   - Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Or right-click → "Inspect"

4. **Enable Device Toolbar:**
   - Press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
   - Or click the device toolbar icon in DevTools

5. **Resize to the target width:**
   - Use the width dropdown in the device toolbar
   - Or manually enter the width from the preset (e.g., 375px, 768px, 1200px)
   - The test panel will update to show the current viewport size and category

6. **Test the checklist items:**
   - The panel shows category-specific testing items
   - Go through each item and verify it works correctly

## Breakpoints to Test

### Mobile (< 768px)
**Recommended widths:** 375px, 414px

**What to test:**
- ✅ Navigation collapses to hamburger menu
- ✅ Mobile menu opens/closes correctly
- ✅ Images scale and load correctly
- ✅ Text is readable (no tiny fonts)
- ✅ Buttons are tappable (minimum 44×44px)
- ✅ No horizontal scroll
- ✅ Layout stacks vertically
- ✅ Touch targets are spaced properly

### Tablet (768px - 991px)
**Recommended widths:** 768px, 991px

**What to test:**
- ✅ Navigation adapts (may collapse or show partial menu)
- ✅ Images scale appropriately
- ✅ Layout uses 2-column grids where appropriate
- ✅ Text remains readable
- ✅ Buttons are easily clickable
- ✅ No horizontal scroll
- ✅ Content doesn't feel cramped

### Desktop (> 991px)
**Recommended widths:** 1200px, 1920px

**What to test:**
- ✅ Full navigation menu visible
- ✅ Images display at full size
- ✅ Multi-column layouts work
- ✅ Text is comfortable to read
- ✅ Hover states work on interactive elements
- ✅ Content uses available space efficiently
- ✅ No excessive white space

## Available Presets

The component includes these preset breakpoints:

- **Mobile (375px)** - iPhone SE / Small phones
- **Mobile Large (414px)** - iPhone 11 Pro Max / Large phones
- **Tablet (768px)** - iPad / Small tablets
- **Tablet Large (991px)** - Large tablets / Small laptops
- **Desktop (1200px)** - Standard desktop
- **Desktop Large (1920px)** - Large desktop / Full HD

## Tips

1. **Test in multiple browsers:**
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (if on Mac)

2. **Test actual devices when possible:**
   - The component helps with initial testing, but real devices provide the best experience

3. **Check console logs:**
   - When you click a preset, it logs helpful information to the console
   - Open DevTools Console tab to see the logs

4. **Test interactions:**
   - Don't just check visual layout
   - Test clicking buttons, opening menus, scrolling, etc.

5. **Test edge cases:**
   - Very small widths (< 375px)
   - Very large widths (> 1920px)
   - Portrait vs landscape orientations

## Troubleshooting

**The test button doesn't appear:**
- Make sure you're running in development mode (`npm run dev`)
- The component only shows in development, not production

**Viewport size doesn't update:**
- Make sure you've resized the browser window or device toolbar
- Refresh the page if needed

**Breakpoint category seems wrong:**
- The component uses these breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 991px
  - Desktop: > 991px
- These match the CSS breakpoints in the Webflow stylesheets

## Related Files

- **Component:** `components/marketing/ResponsiveDesignTest.tsx`
- **Automated Tests:** `tests/responsive-design.test.ts`
- **Test Results:** `tests/RESPONSIVE_DESIGN_TEST_RESULTS.md`
- **Homepage:** `app/page.tsx` (where the component is used)

## Next Steps

After completing manual testing, update the checklist in `FRONTEND_PAGES_TODO.md`:

```markdown
- [x] Manual visual testing completed
  - [x] Mobile (< 768px) - Tested navigation, images, layout
  - [x] Tablet (768px - 991px) - Tested layout adaptation
  - [x] Desktop (> 991px) - Tested full layout
```

