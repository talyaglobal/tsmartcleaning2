# Performance Testing Guide

This guide covers how to run performance tests for the tSmartCleaning application to ensure it meets performance thresholds before production deployment.

## Overview

Performance testing verifies:
- **Page load times** using Lighthouse
- **Core Web Vitals** (LCP, FID, CLS)
- **Bundle sizes** in production builds
- **Network performance** under slow connections (3G throttling)
- **Lighthouse scores** (> 90 for performance)

## Prerequisites

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server** (for testing):
   ```bash
   npm run start
   ```
   Or use your development server:
   ```bash
   npm run dev
   ```

3. **Install Lighthouse CLI** (for Lighthouse tests):
   ```bash
   npm install -g lighthouse
   ```

## Performance Test Scripts

### 1. Lighthouse Performance Testing

Runs Lighthouse audits on key pages and verifies performance scores.

**Usage:**
```bash
# Test default pages on localhost:3000
npm run perf:lighthouse

# Test specific URL
npm run perf:lighthouse -- --url http://localhost:3000

# Test specific pages
npm run perf:lighthouse -- --url http://localhost:3000 --pages home,about,contact

# Test production URL
npm run perf:lighthouse -- --url https://your-production-url.com
```

**What it tests:**
- Performance score (target: > 90)
- Largest Contentful Paint (LCP) < 2.5s
- Total Blocking Time (TBT) < 100ms (proxy for FID)
- Cumulative Layout Shift (CLS) < 0.1
- First Contentful Paint (FCP) < 1.8s
- Speed Index < 3.4s
- Time to Interactive (TTI) < 3.8s

**Output:**
- JSON and HTML reports in `.lighthouse/` directory
- Console output with scores and metrics
- Exit code 0 if all thresholds met, 1 otherwise

### 2. Bundle Size Analysis

Analyzes production build bundle sizes and identifies large chunks.

**Usage:**
```bash
# Analyze default build directory (.next)
npm run perf:bundle-size

# Analyze custom build directory
npm run perf:bundle-size -- --build-dir .next
```

**What it tests:**
- Total bundle size (target: < 2MB)
- Individual chunk sizes (target: < 500KB per chunk)
- Gzipped sizes (target: < 200KB per chunk)
- Number of chunks (warns if > 50)

**Output:**
- List of largest chunks with sizes
- Recommendations for optimization
- Exit code 0 if within limits, 1 if issues found

**Note:** Run `npm run build` first to generate the production build.

### 3. Core Web Vitals Testing

Measures Core Web Vitals using Playwright.

**Usage:**
```bash
# Test default pages on localhost:3000
npm run perf:web-vitals

# Test specific URL
npm run perf:web-vitals -- --url http://localhost:3000

# Test specific pages
npm run perf:web-vitals -- --url http://localhost:3000 --pages home,about
```

**What it tests:**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

**Output:**
- Metrics for each page tested
- Pass/fail status for each threshold
- Summary of results

### 4. Network Throttling Test

Tests page load performance under slow network conditions (3G simulation).

**Usage:**
```bash
# Test with 3G throttling (default)
npm run perf:throttle

# Test with different profile
npm run perf:throttle -- --profile slow-3g
npm run perf:throttle -- --profile fast-3g
npm run perf:throttle -- --profile 4g

# Test specific pages
npm run perf:throttle -- --url http://localhost:3000 --pages home,about
```

**Available profiles:**
- `3g`: 750 Kbps down, 250 Kbps up, 100ms latency (default)
- `slow-3g`: 400 Kbps down, 400 Kbps up, 400ms latency
- `fast-3g`: 1.6 Mbps down, 750 Kbps up, 150ms latency
- `4g`: 10 Mbps down, 5 Mbps up, 20ms latency

**What it tests:**
- Page load time under throttled conditions
- DOM Content Loaded time
- Fully loaded time
- Network requests count
- Total bytes transferred

**Thresholds:**
- 3G: < 10 seconds
- Slow 3G: < 15 seconds
- Fast 3G: < 5 seconds
- 4G: < 3 seconds

### 5. Run All Performance Tests

Run all performance tests in sequence:

```bash
npm run perf:all
```

This will:
1. Build the application
2. Analyze bundle sizes
3. Test Core Web Vitals
4. Test network throttling

**Note:** Lighthouse tests are not included in `perf:all` as they require manual installation and may take longer. Run them separately.

## Performance Thresholds

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100 milliseconds
- **CLS (Cumulative Layout Shift)**: < 0.1

### Lighthouse Scores
- **Performance**: > 90
- **Accessibility**: > 90 (recommended)
- **Best Practices**: > 90 (recommended)
- **SEO**: > 90 (recommended)

### Bundle Sizes
- **Total Bundle**: < 2MB
- **Individual Chunks**: < 500KB
- **Gzipped Chunks**: < 200KB

### Network Performance
- **3G Load Time**: < 10 seconds
- **4G Load Time**: < 3 seconds

## Manual Testing

Some performance tests require manual verification:

### 1. Lighthouse in Browser

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" category
4. Choose device (Mobile/Desktop)
5. Click "Generate report"
6. Verify score > 90

### 2. WebPageTest

1. Go to https://www.webpagetest.org/
2. Enter your URL
3. Select test location and browser
4. Run test
5. Review results:
   - First Byte Time
   - Start Render
   - Speed Index
   - Fully Loaded Time

### 3. Chrome DevTools Performance

1. Open Chrome DevTools (F12)
2. Go to "Performance" tab
3. Click record
4. Reload page
5. Stop recording
6. Review:
   - Main thread activity
   - Network requests
   - Rendering performance

## CI/CD Integration

Add performance tests to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Build application
  run: npm run build

- name: Run bundle size analysis
  run: npm run perf:bundle-size

- name: Start production server
  run: npm run start &
  
- name: Wait for server
  run: sleep 10

- name: Run Core Web Vitals tests
  run: npm run perf:web-vitals

- name: Run network throttling tests
  run: npm run perf:throttle
```

## Troubleshooting

### Lighthouse not found
```bash
npm install -g lighthouse
```

### Build directory not found
```bash
npm run build
```

### Server not running
Make sure your server is running on the URL specified:
```bash
npm run start  # or npm run dev
```

### Playwright browser issues
```bash
npx playwright install chromium
```

## Performance Optimization Tips

If tests fail, consider:

1. **Reduce bundle size:**
   - Use dynamic imports for heavy components
   - Remove unused dependencies
   - Optimize images (use Next.js Image component)
   - Enable code splitting

2. **Improve Core Web Vitals:**
   - Optimize images (LCP)
   - Minimize JavaScript execution (FID)
   - Avoid layout shifts (CLS)
   - Use font-display: swap for fonts

3. **Optimize for slow networks:**
   - Implement lazy loading
   - Use CDN for static assets
   - Enable compression
   - Minimize HTTP requests

4. **Database optimization:**
   - Add indexes
   - Use query caching
   - Optimize queries
   - Use pagination

See `docs/PERFORMANCE_OPTIMIZATION.md` for detailed optimization strategies.

## Reporting Issues

If performance tests consistently fail:

1. Check the test output for specific metrics that failed
2. Review the recommendations provided
3. Use Chrome DevTools Performance tab to identify bottlenecks
4. Check network tab for slow requests
5. Review bundle analysis for large dependencies

## Next Steps

After passing performance tests:

1. ✅ Verify all tests pass
2. ✅ Document any known performance limitations
3. ✅ Set up monitoring (Sentry, Vercel Analytics)
4. ✅ Configure CDN caching
5. ✅ Set up performance budgets in CI/CD

