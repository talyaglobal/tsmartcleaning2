# Performance Metrics Monitoring Guide

This guide covers how to monitor and verify performance metrics for the tSmartCleaning application.

## Overview

The application tracks the following performance metrics:

1. **Core Web Vitals**
   - LCP (Largest Contentful Paint) - Target: < 2.5s
   - FID/INP (First Input Delay/Interaction to Next Paint) - Target: < 100ms
   - CLS (Cumulative Layout Shift) - Target: < 0.1

2. **Page Load Times**
   - Target: < 3 seconds

3. **API Response Times**
   - Target: < 500ms for most endpoints

4. **Database Query Performance**
   - Monitored via `lib/supabase-performance.ts`
   - Slow queries (> 200ms) are automatically logged

5. **CDN Cache Hit Rate**
   - Target: > 80% (monitored via Vercel Analytics or Cloudflare)

## How It Works

### Frontend Metrics Collection

The `WebVitals` component (`components/analytics/WebVitals.tsx`) automatically tracks:
- Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- Page load times
- Sends metrics to `/api/performance/metrics`

### Backend Metrics Collection

API routes can be wrapped with `withPerformanceTracking` from `lib/api/performance-middleware.ts` to automatically track:
- API response times
- Request execution times
- Error rates

Example:
```typescript
import { withPerformanceTracking } from '@/lib/api/performance-middleware'

export const GET = withPerformanceTracking(async (request) => {
  // Your handler code
  return NextResponse.json({ data: '...' })
}, {
  endpointPath: '/api/example',
  thresholdWarningMs: 500,
  thresholdCriticalMs: 1000,
})
```

### Database Query Monitoring

The `createPerformanceMonitoredSupabase` function from `lib/supabase-performance.ts` automatically tracks:
- Query execution times
- Slow queries (> 200ms threshold)
- Query errors

## Viewing Performance Metrics

### Admin Dashboard

Access the performance dashboard at `/admin/performance` (admin access required).

The dashboard shows:
- Overall health score (0-100)
- Core Web Vitals metrics
- API response time statistics
- Page load time statistics
- Recent metrics table

### API Endpoints

#### Get Performance Summary
```
GET /api/performance/summary?days=7
```

Returns:
- Health score
- Summary statistics by metric type
- Threshold compliance status
- Percentile values (P50, P75, P95, P99)

#### Query Metrics
```
GET /api/performance/metrics?metric_name=LCP&days=7&status=critical
```

Query parameters:
- `metric_name`: Filter by metric name (LCP, INP, CLS, api_response_time, etc.)
- `metric_type`: Filter by type (frontend, api, database, system)
- `endpoint_path`: Filter by endpoint path
- `status`: Filter by status (ok, warning, critical)
- `start_date`: ISO date string
- `end_date`: ISO date string
- `limit`: Number of results (default: 100)

#### Report Metric
```
POST /api/performance/metrics
Content-Type: application/json

{
  "metric_name": "LCP",
  "metric_type": "frontend",
  "value_ms": 2500,
  "endpoint_path": "/",
  "metadata": {}
}
```

## Performance Thresholds

### Core Web Vitals

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| LCP    | < 2.5s | > 2.0s  | > 3.0s   |
| INP    | < 200ms| > 150ms | > 300ms  |
| CLS    | < 0.1  | > 0.05  | > 0.15   |
| FCP    | < 1.8s | > 1.5s  | > 2.5s   |
| TTFB   | < 800ms| > 600ms | > 1000ms |

### Page Load Time

| Status | Threshold |
|--------|-----------|
| Target | < 3 seconds |
| Warning | > 2 seconds |
| Critical | > 5 seconds |

### API Response Time

| Status | Threshold |
|--------|-----------|
| Target | < 500ms |
| Warning | > 1000ms |
| Critical | > 2000ms |

### Database Query Time

| Status | Threshold |
|--------|-----------|
| Target | < 50ms |
| Warning | > 200ms |
| Critical | > 500ms |

## CDN Cache Hit Rate Monitoring

### Vercel (Recommended)

If deployed on Vercel:

1. **Access Vercel Analytics Dashboard**
   - Go to your project dashboard
   - Navigate to "Analytics" tab
   - View "Cache Hit Rate" metric

2. **Expected Values**
   - Target: > 80% cache hit rate
   - Static assets: Should be > 95%
   - API responses: Varies by endpoint type

3. **Improving Cache Hit Rate**
   - Ensure static assets have long cache headers
   - Use Next.js Image component for automatic optimization
   - Configure CDN caching in `middleware.ts`
   - Use `Cache-Control` headers appropriately

### Cloudflare (If Using)

1. **Access Cloudflare Dashboard**
   - Go to Analytics & Logs > Cache
   - View cache hit rate metrics

2. **Cache Rules**
   - Configure cache rules in Cloudflare dashboard
   - Set appropriate TTL values
   - Use page rules for specific paths

### Manual Verification

To manually check cache hit rate:

1. **Check Response Headers**
   ```bash
   curl -I https://yourdomain.com/_next/static/chunks/main.js
   ```
   Look for `CF-Cache-Status: HIT` (Cloudflare) or `x-vercel-cache: HIT` (Vercel)

2. **Browser DevTools**
   - Open Network tab
   - Check "Size" column
   - "disk cache" or "memory cache" indicates cache hit
   - Actual size indicates cache miss

3. **CDN Analytics**
   - Use Vercel Analytics or Cloudflare Analytics
   - Monitor cache hit rate over time
   - Set up alerts for cache hit rate < 80%

## Performance Testing

### Automated Tests

Run performance tests:
```bash
# Lighthouse performance test
npm run perf:lighthouse

# Core Web Vitals test
npm run perf:web-vitals

# Network throttling test
npm run perf:throttle

# Bundle size analysis
npm run perf:bundle-size

# Run all performance tests
npm run perf:all
```

### Manual Verification

1. **Lighthouse in Chrome DevTools**
   - Open Chrome DevTools (F12)
   - Go to "Lighthouse" tab
   - Select "Performance" category
   - Click "Generate report"
   - Verify score > 90

2. **Core Web Vitals in Chrome DevTools**
   - Open Chrome DevTools (F12)
   - Go to "Performance" tab
   - Record page load
   - Check Web Vitals section

3. **Page Load Time**
   - Open Chrome DevTools (F12)
   - Go to "Network" tab
   - Reload page
   - Check "Load" time in bottom status bar

4. **API Response Times**
   - Open Chrome DevTools (F12)
   - Go to "Network" tab
   - Filter by "XHR" or "Fetch"
   - Check "Time" column for API requests
   - Verify most requests < 500ms

## Troubleshooting

### High API Response Times

1. Check database query performance
2. Review slow query logs in `slow_queries` table
3. Check for N+1 query problems
4. Verify database indexes are optimized
5. Check external API dependencies

### Poor Core Web Vitals

1. **LCP Issues**
   - Optimize images (use Next.js Image component)
   - Reduce server response time
   - Minimize render-blocking resources

2. **INP/FID Issues**
   - Reduce JavaScript execution time
   - Code split large bundles
   - Defer non-critical JavaScript

3. **CLS Issues**
   - Set explicit dimensions on images
   - Reserve space for dynamic content
   - Avoid inserting content above existing content

### Low Cache Hit Rate

1. Check cache headers in `middleware.ts`
2. Verify static assets are being served from CDN
3. Check CDN configuration
4. Review cache invalidation strategy
5. Ensure proper cache-control headers

## Database Performance

### Monitoring Slow Queries

Slow queries are automatically logged to the `slow_queries` table. View them:

```sql
SELECT * FROM slow_queries 
ORDER BY created_at DESC 
LIMIT 100;
```

### Query Optimization

1. Review slow query logs
2. Add indexes for frequently queried columns
3. Use `EXPLAIN ANALYZE` to understand query plans
4. Consider query caching for expensive queries
5. Optimize N+1 query patterns

## Alerts and Notifications

Performance metrics are automatically sent to Sentry when:
- Critical thresholds are exceeded
- Slow queries are detected
- API response times exceed critical threshold

Configure Sentry alerts:
1. Go to Sentry dashboard
2. Navigate to Alerts
3. Create alert rules for performance issues
4. Set up email/Slack notifications

## Best Practices

1. **Regular Monitoring**
   - Review performance dashboard weekly
   - Check for trends and anomalies
   - Address critical issues immediately

2. **Performance Budgets**
   - Set performance budgets in CI/CD
   - Fail builds if thresholds exceeded
   - Track bundle size over time

3. **Continuous Optimization**
   - Regularly review and optimize slow queries
   - Monitor Core Web Vitals trends
   - Optimize images and assets
   - Keep dependencies updated

4. **Documentation**
   - Document performance optimizations
   - Track performance improvements
   - Share learnings with team

## Related Documentation

- `docs/PERFORMANCE_TESTING.md` - Performance testing guide
- `docs/PERFORMANCE_OPTIMIZATION.md` - Performance optimization strategies
- `scripts/28_performance_monitoring.sql` - Performance monitoring database schema


