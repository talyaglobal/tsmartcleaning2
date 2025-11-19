# API Metrics Dashboard

## Overview

The API Metrics Dashboard provides comprehensive monitoring of API performance metrics including response time, error rate, and throughput. This system tracks all API requests and provides real-time insights into application performance.

## Features

- **Response Time Tracking**: Tracks average, P50, P95, and P99 response times
- **Error Rate Monitoring**: Monitors error rates per endpoint
- **Throughput Measurement**: Tracks requests per minute
- **Alert Thresholds**: Configurable thresholds for automatic alerting
- **Real-time Dashboard**: Live metrics dashboard in root-admin
- **Hourly Aggregation**: Automatic aggregation for efficient querying

## Database Schema

The metrics system uses three main tables:

1. **api_metrics**: Raw metrics for each API request
2. **api_metrics_hourly**: Aggregated metrics by hour for faster queries
3. **api_alert_thresholds**: Configuration for alert thresholds

See `scripts/28_api_metrics.sql` for the complete schema.

## Setup

### 1. Run Database Migration

```bash
# Run the migration script
psql $DATABASE_URL -f scripts/28_api_metrics.sql
```

### 2. Set Up Cron Job (Optional but Recommended)

For hourly aggregation, set up a cron job to call the aggregation endpoint:

**Vercel:**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/aggregate-metrics",
    "schedule": "0 * * * *"
  }]
}
```

**Environment Variable:**
Set `CRON_SECRET` for production security:
```bash
CRON_SECRET=your-secret-key
```

### 3. Enable Metrics Tracking

Metrics are automatically tracked for all API routes via middleware. The middleware sets `x-request-start-time` header for all `/api/*` routes.

To manually track metrics in an API route:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { trackApiMetrics } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  try {
    // Your API logic here
    const data = await fetchData()
    
    const response = NextResponse.json({ data })
    
    // Track metrics (optional - middleware handles this automatically)
    await trackApiMetrics(request, response)
    
    return response
  } catch (error) {
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    // Track error metrics
    await trackApiMetrics(request, errorResponse, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return errorResponse
  }
}
```

## Using the Dashboard

### Accessing the Dashboard

Navigate to `/root-admin/metrics` (requires root admin access).

### Viewing Metrics

1. **Select Time Range**: Choose from 1 hour, 24 hours, 7 days, or 30 days
2. **View Overall Stats**: See total requests, errors, average response time, throughput, and active alerts
3. **Browse Endpoint Metrics**: View detailed metrics for each API endpoint

### Metrics Explained

- **Requests**: Total number of requests in the time period
- **Error Rate**: Percentage of requests that returned HTTP 4xx or 5xx status codes
- **Avg Response Time**: Average response time across all requests
- **P95/P99**: 95th and 99th percentile response times (important for understanding tail latency)
- **Throughput**: Requests per minute
- **Alerts**: Warnings when metrics exceed configured thresholds

## Configuring Alert Thresholds

### Via Dashboard

1. Navigate to `/root-admin/metrics/thresholds`
2. Click "+ Add Threshold"
3. Configure:
   - **Endpoint** (optional): Specific endpoint or leave empty for all endpoints
   - **Method** (optional): HTTP method or leave empty for all methods
   - **Max Response Time**: Alert if average response time exceeds this (ms)
   - **Max Error Rate**: Alert if error rate exceeds this (%)
   - **Min Throughput**: Alert if throughput drops below this (requests/min)
4. Click "Save Threshold"

### Via API

```typescript
POST /api/root-admin/metrics/thresholds
{
  "endpoint": "/api/bookings",  // or null for all
  "method": "POST",              // or null for all
  "maxResponseTimeMs": 3000,
  "maxErrorRatePercent": 5.0,
  "minThroughputPerMinute": 10,
  "enabled": true,
  "notificationChannels": ["email"]
}
```

### Default Thresholds

The system includes default thresholds:
- **All endpoints**: 5000ms response time, 5% error rate, 10 requests/min
- **/api/bookings**: 3000ms response time, 3% error rate, 5 requests/min
- **/api/admin/stats**: 2000ms response time, 2% error rate, 1 request/min

## API Endpoints

### Get Metrics

```
GET /api/root-admin/metrics?timeRange=24h&endpoint=/api/bookings
```

Query Parameters:
- `timeRange`: `1h`, `24h`, `7d`, or `30d` (default: `24h`)
- `endpoint`: Optional endpoint filter
- `tenantId`: Optional tenant filter

### Get Alert Thresholds

```
GET /api/root-admin/metrics/thresholds?tenantId=...
```

### Create/Update Threshold

```
POST /api/root-admin/metrics/thresholds
Content-Type: application/json

{
  "endpoint": "/api/bookings",
  "method": "POST",
  "maxResponseTimeMs": 3000,
  "maxErrorRatePercent": 5.0,
  "minThroughputPerMinute": 10,
  "enabled": true,
  "notificationChannels": ["email"]
}
```

### Delete Threshold

```
DELETE /api/root-admin/metrics/thresholds?id=threshold-id
```

## Performance Considerations

### Hourly Aggregation

The system automatically aggregates metrics hourly to improve query performance. The aggregation function (`aggregate_api_metrics_hourly`) should be called via cron job every hour.

### Data Retention

Consider implementing a data retention policy:

```sql
-- Delete raw metrics older than 30 days
DELETE FROM api_metrics 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete hourly aggregates older than 90 days
DELETE FROM api_metrics_hourly 
WHERE hour < NOW() - INTERVAL '90 days';
```

### Indexes

The schema includes optimized indexes for:
- Endpoint and time queries
- Tenant isolation
- Status code filtering

## Troubleshooting

### Metrics Not Appearing

1. Check that the database migration has been run
2. Verify middleware is setting `x-request-start-time` header
3. Check browser console for errors
4. Verify API routes are under `/api/*` path

### Aggregation Not Working

1. Check cron job is configured correctly
2. Verify `CRON_SECRET` is set if in production
3. Check database logs for function execution errors
4. Manually trigger aggregation: `GET /api/cron/aggregate-metrics`

### High Database Load

1. Ensure hourly aggregation is running
2. Consider increasing aggregation frequency
3. Implement data retention policy
4. Review and optimize indexes

## Future Enhancements

- [ ] Real-time WebSocket updates for dashboard
- [ ] Email/Slack notifications for alerts
- [ ] Custom metric definitions
- [ ] Export metrics to external monitoring services
- [ ] Anomaly detection
- [ ] Performance regression detection

