# Post-Deployment Verification Script

This script automates the post-deployment verification checklist from `FINAL_MISSING_TODO.md`.

## What It Checks

✅ **Application Accessibility** - Verifies the production URL is accessible  
✅ **Homepage Load** - Ensures homepage loads correctly  
✅ **Static Pages** - Checks all public routes load without errors  
✅ **Navigation Links** - Verifies internal navigation links work  
✅ **Images & Assets** - Confirms images, CSS, and JS files load properly  
✅ **404 Errors** - Detects any 404 errors on expected routes  
✅ **Console Errors** - Captures JavaScript console errors  
✅ **Network Errors** - Identifies failed network requests  

## Usage

### Basic Usage (uses default production URL)
```bash
npm run verify:deployment
```

### Custom Production URL
```bash
PRODUCTION_URL=https://your-site.com npm run verify:deployment
```

### Using Vercel URL
```bash
VERCEL_URL=your-app.vercel.app npm run verify:deployment
```

## Output

The script provides:
- ✅ Success indicators for passed checks
- ❌ Error indicators for failed checks
- ⚠️ Warning indicators for potential issues
- Detailed summary with counts of successes, warnings, and errors
- Specific details about any failures

## Exit Codes

- `0` - All critical checks passed
- `1` - One or more checks failed

## Pages Checked

The script verifies all public routes from `app/sitemap.ts`:
- `/` (homepage)
- `/find-cleaners`
- `/marketing`
- `/for-providers`
- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/careers`
- `/blog`
- `/insurance`
- `/insurance/file-claim`
- `/support-immigrant-women`
- `/tsmartcard`
- `/signup`
- `/login`

## Requirements

- Node.js and npm
- Playwright (already installed as dev dependency)
- Playwright browsers installed (`npx playwright install`)
- Access to the production URL

## First-Time Setup

Before running the verification script for the first time, install Playwright browsers:

```bash
npx playwright install
```

Or install only Chromium (faster, smaller):

```bash
npx playwright install chromium
```

## Notes

- The script runs in headless mode
- Each page check has a 30-second timeout
- Asset checks have a 5-second timeout
- Console errors are captured from browser dev tools
- Network errors (4xx/5xx) are detected automatically

