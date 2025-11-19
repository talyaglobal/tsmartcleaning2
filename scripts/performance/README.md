# Performance Testing Scripts

This directory contains automated performance testing scripts for the tSmartCleaning application.

## Scripts

### 1. `lighthouse-test.ts`
Runs Lighthouse audits on key pages and verifies performance scores.

**Usage:**
```bash
npm run perf:lighthouse
npm run perf:lighthouse -- --url http://localhost:3000 --pages home,about
```

**Requirements:**
- Lighthouse CLI installed: `npm install -g lighthouse`
- Server running on the target URL

**Output:**
- JSON and HTML reports in `.lighthouse/` directory
- Console output with scores and metrics

### 2. `bundle-size.ts`
Analyzes production build bundle sizes.

**Usage:**
```bash
npm run perf:bundle-size
npm run perf:bundle-size -- --build-dir .next
```

**Requirements:**
- Production build: `npm run build`

**Output:**
- Bundle size analysis
- Largest chunks report
- Optimization recommendations

### 3. `core-web-vitals.ts`
Measures Core Web Vitals using Playwright.

**Usage:**
```bash
npm run perf:web-vitals
npm run perf:web-vitals -- --url http://localhost:3000 --pages home,about
```

**Requirements:**
- Playwright installed: `npx playwright install chromium`
- Server running on the target URL

**Output:**
- LCP, FID, CLS metrics
- Pass/fail status for each threshold

### 4. `network-throttling.ts`
Tests page load performance under slow network conditions.

**Usage:**
```bash
npm run perf:throttle
npm run perf:throttle -- --profile slow-3g
npm run perf:throttle -- --url http://localhost:3000 --pages home,about
```

**Requirements:**
- Playwright installed
- Server running on the target URL

**Profiles:**
- `3g` (default): 750 Kbps down, 250 Kbps up, 100ms latency
- `slow-3g`: 400 Kbps down, 400 Kbps up, 400ms latency
- `fast-3g`: 1.6 Mbps down, 750 Kbps up, 150ms latency
- `4g`: 10 Mbps down, 5 Mbps up, 20ms latency

**Output:**
- Load times under throttled conditions
- Network request counts
- Total bytes transferred

## Quick Start

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm run start
   # or
   npm run dev
   ```

3. **Run all performance tests:**
   ```bash
   npm run perf:all
   ```

4. **Run individual tests:**
   ```bash
   npm run perf:lighthouse
   npm run perf:bundle-size
   npm run perf:web-vitals
   npm run perf:throttle
   ```

## Performance Thresholds

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Lighthouse Performance**: > 90
- **Bundle Size**: < 2MB total, < 500KB per chunk
- **3G Load Time**: < 10 seconds

## Documentation

See `docs/PERFORMANCE_TESTING.md` for detailed documentation.

