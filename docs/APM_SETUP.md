# Application Performance Monitoring (APM) Setup

This document describes the Application Performance Monitoring (APM) implementation for the tSmartCleaning application.

## Overview

The APM system provides comprehensive performance monitoring through:
- **Sentry Performance Monitoring**: Enhanced Sentry configuration with transaction sampling and performance tracking
- **Database Query Monitoring**: Automatic tracking of slow database queries
- **Performance Baselines**: Configurable thresholds for different metric types
- **Performance Metrics API**: RESTful API endpoint for querying performance data

## Components

### 1. Database Schema

The performance monitoring system uses three main tables:

- **`performance_baselines`**: Stores expected performance thresholds for different metrics
- **`slow_queries`**: Records database queries that exceed performance thresholds
- **`performance_metrics`**: Stores actual performance measurements

See `scripts/28_performance_monitoring.sql` for the complete schema.

### 2. Performance Monitoring Library

**File**: `lib/performance.ts`

Provides utilities for:
- Recording performance metrics
- Recording slow queries
- Setting and retrieving performance baselines
- Measuring execution time of async functions

**Key Functions**:
- `recordPerformanceMetric()`: Record a performance measurement
- `recordSlowQuery()`: Record a slow database query
- `setPerformanceBaseline()`: Establish or update a performance baseline
- `getPerformanceBaseline()`: Retrieve a performance baseline
- `measureExecutionTime()`: Measure and record execution time of a function
- `initializeDefaultBaselines()`: Set up default performance baselines

### 3. Supabase Performance Wrapper

**File**: `lib/supabase-performance.ts`

Wraps Supabase client to automatically track query performance. Currently provides:
- `createPerformanceMonitoredSupabase()`: Create a Supabase client with automatic query tracking

**Note**: The wrapper is available but not yet integrated into the main Supabase client. To use it, replace `createServerSupabase()` with `createPerformanceMonitoredSupabase()` in your code.

### 4. Performance Metrics API

**Endpoint**: `GET /api/monitoring/performance`

Returns performance metrics, slow queries, and baselines. Requires admin authentication.

**Query Parameters**:
- `timeRange`: Time range for metrics (`1h`, `24h`, `7d`, `30d`) - default: `24h`
- `type`: Filter by metric type (`api`, `database`, `frontend`, `system`)
- `limit`: Maximum number of records to return - default: `100`

**Response**:
```json
{
  "summary": {
    "total_metrics": 150,
    "total_slow_queries": 5,
    "total_baselines": 3,
    "metrics_by_type": { "api": 100, "database": 50 },
    "metrics_by_status": { "ok": 140, "warning": 8, "critical": 2 },
    "avg_response_time_ms": 125.5,
    "max_response_time_ms": 850.0,
    "slow_queries_by_table": { "bookings": 3, "users": 2 }
  },
  "metrics": [...],
  "slow_queries": [...],
  "baselines": [...],
  "time_range": "24h",
  "start_time": "2025-01-26T00:00:00Z",
  "end_time": "2025-01-27T00:00:00Z"
}
```

### 5. Sentry Configuration

Enhanced Sentry configurations for all runtimes:

- **Client** (`sentry.client.config.ts`): Browser-side performance monitoring with Core Web Vitals tracking
- **Server** (`sentry.server.config.ts`): Server-side API and database operation monitoring
- **Edge** (`sentry.edge.config.ts`): Edge runtime performance monitoring

**Key Features**:
- Dynamic transaction sampling based on context
- Automatic slow transaction detection
- Custom tags for performance analysis
- Environment-aware sampling rates

## Setup Instructions

### 1. Run Database Migration

Run the performance monitoring migration:

```bash
npm run db:run-sql scripts/28_performance_monitoring.sql
```

Or if you have a migration runner:

```bash
npm run db:migrate
```

### 2. Initialize Default Baselines

Default baselines are automatically established when you first use the performance monitoring system. You can also manually initialize them:

```typescript
import { initializeDefaultBaselines } from '@/lib/performance'

await initializeDefaultBaselines(tenantId)
```

### 3. Configure Sentry

Ensure your Sentry DSN is configured in environment variables:

```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_DSN=your_sentry_dsn
```

### 4. Use Performance Monitoring

#### Track API Response Times

```typescript
import { measureExecutionTime } from '@/lib/performance'

const result = await measureExecutionTime(
  async () => {
    // Your API logic here
    return await fetchData()
  },
  'api_response_time',
  'api',
  {
    endpointPath: '/api/bookings',
    tenantId: tenantId,
    thresholdMs: 500,
  }
)
```

#### Track Database Queries

```typescript
import { createPerformanceMonitoredSupabase } from '@/lib/supabase-performance'

const supabase = createPerformanceMonitoredSupabase(tenantId)
const { data } = await supabase.from('bookings').select('*')
// Query performance is automatically tracked
```

#### Record Custom Metrics

```typescript
import { recordPerformanceMetric } from '@/lib/performance'

await recordPerformanceMetric({
  metric_name: 'custom_operation',
  metric_type: 'system',
  value_ms: 150.5,
  tenant_id: tenantId,
  metadata: { operation: 'data_processing' },
})
```

## Default Baselines

The system includes default performance baselines:

| Metric | Type | Baseline | Warning | Critical |
|--------|------|----------|---------|----------|
| API Response Time | api | 200ms | 500ms | 1000ms |
| Database Query Time | database | 50ms | 200ms | 500ms |
| Page Load Time | frontend | 1000ms | 2000ms | 3000ms |

You can customize these by updating the `performance_baselines` table or using `setPerformanceBaseline()`.

## Monitoring Slow Queries

Slow queries are automatically recorded when:
- A database query exceeds the threshold (default: 200ms)
- The query is executed through the performance-monitored Supabase client

Slow queries are stored in the `slow_queries` table and can be queried via the performance metrics API.

## Viewing Performance Data

### Via API

```bash
# Get performance metrics for last 24 hours
curl -H "Authorization: Bearer <token>" \
  "https://your-domain.com/api/monitoring/performance?timeRange=24h"

# Get only database metrics
curl -H "Authorization: Bearer <token>" \
  "https://your-domain.com/api/monitoring/performance?type=database&timeRange=7d"
```

### Via Sentry Dashboard

1. Log in to your Sentry dashboard
2. Navigate to **Performance** section
3. View transaction traces, slow operations, and performance trends
4. Set up alerts for slow transactions

## Best Practices

1. **Sampling Rates**: Adjust Sentry sampling rates based on your traffic volume. Higher rates provide more data but increase costs.

2. **Baseline Updates**: Regularly review and update performance baselines based on actual performance data.

3. **Slow Query Investigation**: When slow queries are detected, investigate:
   - Missing database indexes
   - N+1 query problems
   - Inefficient query patterns
   - Database connection pool issues

4. **Alert Configuration**: Set up Sentry alerts for:
   - Critical performance degradation
   - Slow query spikes
   - API response time increases

5. **Production vs Development**: Use different sampling rates for development (100%) and production (10-20%) to balance data quality and cost.

## Troubleshooting

### Performance Monitoring Not Working

1. Check that the database migration has been run
2. Verify Sentry DSN is configured correctly
3. Check browser console and server logs for errors
4. Ensure RLS policies allow access to performance tables

### Slow Queries Not Being Recorded

1. Ensure you're using `createPerformanceMonitoredSupabase()` instead of `createServerSupabase()`
2. Check that queries exceed the threshold (default: 200ms)
3. Verify the `slow_queries` table exists and is accessible

### High Sentry Costs

1. Reduce `tracesSampleRate` in production
2. Adjust `tracesSampler` to sample fewer transactions
3. Filter out non-critical transactions in `beforeSendTransaction`

## Related Documentation

- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Database Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
- [Monitoring and Logging](./LOGGING_AND_MONITORING.md)

