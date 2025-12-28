# Database Monitoring Guide

This guide covers database monitoring setup and usage for the Supabase database.

## Overview

Database monitoring helps track:
- Query performance and slow queries
- Database health and availability
- Connection pool utilization
- Error rates and failed queries

## Components

### 1. Database Monitoring Library (`lib/db-monitoring.ts`)

Provides utilities for tracking query performance and database health:

- **Query Performance Tracking**: Automatically tracks query duration, success/failure, and table usage
- **Database Health Checks**: Monitors database response time and overall health
- **Connection Pool Metrics**: Estimates connection pool utilization based on query patterns
- **Slow Query Detection**: Identifies queries taking longer than 1 second
- **Error Tracking**: Logs and tracks failed queries

### 2. Monitoring Script (`scripts/monitor-supabase-dashboard.ts`)

A script to verify Supabase monitoring dashboard access and check database health.

**Usage:**
```bash
npm run monitor:supabase
```

This script:
- Verifies environment variables are set
- Tests database connection
- Checks database health
- Reviews query performance metrics
- Checks connection pool status
- Provides instructions for accessing Supabase dashboard

### 3. Monitoring API Endpoint (`/api/monitoring/database`)

REST API endpoint for retrieving database monitoring metrics (admin only).

**Endpoint:** `GET /api/monitoring/database`

**Query Parameters:**
- `timeWindow` (optional): Time window in minutes for query stats (default: 60)
- `includeSlowQueries` (optional): Include slow queries in response (default: false)
- `includeFailedQueries` (optional): Include failed queries in response (default: false)

**Response:**
```json
{
  "health": {
    "status": "healthy",
    "responseTime": 45.23,
    "lastCheck": "2024-01-01T00:00:00.000Z",
    "errorRate": 0.5,
    "slowQueries": 2,
    "connectionPoolStatus": "ok"
  },
  "queryStats": {
    "totalQueries": 1000,
    "successfulQueries": 995,
    "failedQueries": 5,
    "averageDuration": 125.5,
    "slowQueries": 2,
    "errorRate": 0.5,
    "queriesByTable": {
      "bookings": 500,
      "users": 300,
      "services": 200
    }
  },
  "connectionPool": {
    "activeConnections": 15,
    "idleConnections": 85,
    "totalConnections": 100,
    "maxConnections": 100,
    "waitingQueries": 0
  },
  "slowQueries": [...],
  "failedQueries": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Using Query Monitoring

### Wrapping Queries

To track query performance, wrap your Supabase queries with `withQueryMonitoring`:

```typescript
import { withQueryMonitoring } from '@/lib/db-monitoring'
import { createServerSupabase } from '@/lib/supabase'

const supabase = createServerSupabase()

const result = await withQueryMonitoring(
  () => supabase.from('bookings').select('*').limit(10),
  {
    queryName: 'get_bookings',
    table: 'bookings',
    tenantId: 'tenant-123'
  }
)

if (result.error) {
  console.error('Query failed:', result.error)
} else {
  console.log('Query metrics:', result.metrics)
}
```

### Getting Query Statistics

```typescript
import { getQueryStats } from '@/lib/db-monitoring'

// Get stats for last hour
const stats = getQueryStats(60)

console.log('Total queries:', stats.totalQueries)
console.log('Average duration:', stats.averageDuration, 'ms')
console.log('Error rate:', stats.errorRate, '%')
```

### Checking Database Health

```typescript
import { checkDatabaseHealth } from '@/lib/db-monitoring'

const health = await checkDatabaseHealth()

if (health.status === 'healthy') {
  console.log('Database is healthy')
} else {
  console.warn('Database health:', health.status)
}
```

## Supabase Dashboard Access

### Accessing the Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Project Settings > Database**

### Key Metrics to Monitor

#### Database Health
- **Response Time**: Should be < 200ms for most queries
- **Error Rate**: Should be < 1%
- **Active Connections**: Monitor for connection pool exhaustion

#### Connection Pooling
- **Active Connections**: Number of active database connections
- **Idle Connections**: Available connections in the pool
- **Max Connections**: Maximum allowed connections (Supabase default: 100)
- **Waiting Queries**: Queries waiting for a connection

#### Query Performance
- **Slow Queries**: Queries taking > 1 second
- **Query Frequency**: Most frequently accessed tables
- **Average Query Duration**: Should be < 500ms for most queries

### Setting Up Alerts

In Supabase dashboard:
1. Navigate to **Project Settings > Monitoring**
2. Set up alerts for:
   - High error rate (> 5%)
   - Connection pool exhaustion (> 80% utilization)
   - Slow queries (> 1 second)
   - Database downtime

## Connection Pool Configuration

Supabase manages connection pooling server-side. The client configuration in `lib/supabase.ts` includes:

- **Schema**: Set to 'public' by default
- **Connection Reuse**: Supabase client automatically reuses connections
- **Connection Limits**: Managed by Supabase (default: 100 connections)

### Best Practices

1. **Reuse Supabase Clients**: Create clients once and reuse them
2. **Close Connections**: Let Supabase manage connection lifecycle
3. **Monitor Pool Utilization**: Use monitoring tools to track usage
4. **Set Appropriate Timeouts**: Configure query timeouts appropriately

## Monitoring Best Practices

### 1. Regular Health Checks

Run health checks periodically:
```typescript
// In a cron job or scheduled task
const health = await checkDatabaseHealth()
if (health.status !== 'healthy') {
  // Send alert
}
```

### 2. Track Slow Queries

Regularly review slow queries:
```typescript
import { getSlowQueries } from '@/lib/db-monitoring'

const slowQueries = getSlowQueries(1000, 50) // Queries > 1s, top 50
slowQueries.forEach(q => {
  console.log(`Slow query: ${q.query} took ${q.duration}ms`)
})
```

### 3. Monitor Error Rates

Track and alert on high error rates:
```typescript
const stats = getQueryStats(60)
if (stats.errorRate > 5) {
  // Send alert for high error rate
}
```

### 4. Review Connection Pool

Monitor connection pool utilization:
```typescript
import { getConnectionPoolMetrics } from '@/lib/db-monitoring'

const pool = getConnectionPoolMetrics()
if (pool.totalConnections / pool.maxConnections > 0.8) {
  // Alert: High connection pool utilization
}
```

## Troubleshooting

### High Error Rate

1. Check Supabase dashboard for database errors
2. Review failed queries using `getFailedQueries()`
3. Check connection pool status
4. Verify database is not overloaded

### Slow Queries

1. Identify slow queries using `getSlowQueries()`
2. Review query execution plans in Supabase dashboard
3. Add appropriate indexes
4. Optimize query structure

### Connection Pool Exhaustion

1. Check active connections in Supabase dashboard
2. Review connection pool metrics
3. Consider increasing connection pool size (if available in your plan)
4. Optimize queries to reduce connection hold time

## Integration with Monitoring Tools

### Sentry Integration

Database errors are automatically logged to Sentry if configured. Query monitoring can be extended to send metrics to Sentry:

```typescript
import * as Sentry from '@sentry/nextjs'

const result = await withQueryMonitoring(queryFn, options)
if (result.error) {
  Sentry.captureException(result.error, {
    tags: { component: 'database', table: options.table }
  })
}
```

### Custom Metrics Export

Export metrics to your monitoring system:

```typescript
import { getAllMetrics } from '@/lib/db-monitoring'

// Export to your metrics system
const metrics = getAllMetrics()
// Send to Prometheus, DataDog, etc.
```

## Next Steps

1. Run `npm run monitor:supabase` to verify setup
2. Access Supabase dashboard and review metrics
3. Set up alerts for critical metrics
4. Integrate query monitoring into your API routes
5. Regularly review slow queries and optimize



