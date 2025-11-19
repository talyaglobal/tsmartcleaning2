# Database Monitoring Alerts Guide

This guide covers setting up database monitoring alerts for Supabase to ensure proactive issue detection.

## Overview

Database monitoring alerts help you:
- Detect database performance issues early
- Identify connection pool problems
- Monitor slow queries
- Track error rates
- Ensure database availability

## Alert Configuration Methods

### Method 1: Supabase Dashboard Alerts (Recommended)

Supabase provides built-in monitoring and alerting capabilities.

#### Accessing Monitoring

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Project Settings > Monitoring** or **Database > Monitoring**

#### Available Metrics

Supabase dashboard provides:
- Database response time
- Query performance
- Connection pool utilization
- Error rates
- Slow queries

#### Setting Up Alerts

1. **Navigate to Alerts**:
   - Go to **Project Settings > Monitoring > Alerts**
   - Or use Supabase's notification settings

2. **Configure Alert Rules**:
   - **High Error Rate**: Alert when error rate > 5%
   - **Slow Queries**: Alert when slow queries > 10 in 5 minutes
   - **Connection Pool**: Alert when pool utilization > 80%
   - **Database Down**: Alert when database is unreachable

3. **Configure Notification Channels**:
   - Email notifications
   - Slack integration (if configured)
   - Webhook notifications

### Method 2: Application-Level Alerts

Use the monitoring API endpoint to set up custom alerts.

#### Monitoring Endpoint

```bash
GET /api/monitoring/database
```

This endpoint returns:
- Database health status
- Query statistics
- Connection pool metrics
- Slow queries
- Failed queries

#### Setting Up Custom Alerts

Create a monitoring script or cron job:

```typescript
// scripts/check-database-alerts.ts
import { checkDatabaseHealth } from '@/lib/db-monitoring'

async function checkAlerts() {
  const health = await checkDatabaseHealth()
  
  // Alert on unhealthy status
  if (health.status === 'unhealthy') {
    // Send alert via email, Slack, etc.
    console.error('🚨 Database is unhealthy!', health)
  }
  
  // Alert on high error rate
  if (health.errorRate > 5) {
    console.warn('⚠️ High error rate detected:', health.errorRate)
  }
  
  // Alert on connection pool issues
  if (health.connectionPoolStatus === 'critical') {
    console.error('🚨 Connection pool critical!', health)
  }
}
```

### Method 3: Sentry Integration

Database errors are automatically logged to Sentry. Configure Sentry alerts:

1. **Go to Sentry Alerts**: https://talyaglobal.sentry.io/alerts/rules/
2. **Create Database Error Alert**:
   - **Name**: Database Errors
   - **Conditions**:
     - When an issue is created
     - Tags: `category:database`
     - Level is "error" or "fatal"
   - **Actions**: Email + Slack notifications

3. **Create Slow Query Alert**:
   - **Name**: Slow Database Queries
   - **Conditions**:
     - When an issue is created
     - Tags: `category:database`, `type:slow_query`
     - Error rate > 5% in 5 minutes
   - **Actions**: Email notification

## Recommended Alert Thresholds

### Critical Alerts (Immediate Action Required)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Database Status | Unhealthy | Investigate immediately |
| Error Rate | > 10% | Check database logs, review recent changes |
| Connection Pool | > 90% utilization | Check for connection leaks, optimize queries |
| Response Time | > 5 seconds | Review slow queries, check database load |

### Warning Alerts (Monitor Closely)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | 5-10% | Monitor trends, review error logs |
| Connection Pool | 70-90% utilization | Monitor, prepare for optimization |
| Response Time | 2-5 seconds | Review query performance |
| Slow Queries | > 10 in 5 minutes | Review and optimize slow queries |

### Informational Alerts (Track Trends)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | 1-5% | Monitor trends |
| Connection Pool | 50-70% utilization | Track usage patterns |
| Response Time | 500ms-2s | Monitor for degradation |

## Alert Configuration Examples

### Example 1: High Error Rate Alert

**Supabase Dashboard:**
1. Go to **Monitoring > Alerts**
2. Create new alert:
   - **Name**: High Database Error Rate
   - **Condition**: Error rate > 5% in 5 minutes
   - **Notification**: Email + Slack
   - **Frequency**: Every 5 minutes

**Application-Level:**
```typescript
const health = await checkDatabaseHealth()
if (health.errorRate > 5) {
  await sendAlert({
    level: 'warning',
    message: `Database error rate is ${health.errorRate}%`,
    details: health
  })
}
```

### Example 2: Connection Pool Exhaustion Alert

**Supabase Dashboard:**
1. Go to **Database > Connection Pooling**
2. Monitor active connections
3. Set alert when > 80% of max connections

**Application-Level:**
```typescript
const pool = getConnectionPoolMetrics()
const utilization = (pool.activeConnections / pool.maxConnections) * 100

if (utilization > 80) {
  await sendAlert({
    level: 'critical',
    message: `Connection pool utilization: ${utilization.toFixed(1)}%`,
    details: pool
  })
}
```

### Example 3: Slow Query Alert

**Application-Level:**
```typescript
const slowQueries = getSlowQueries(1000, 10) // Queries > 1s, top 10

if (slowQueries.length > 5) {
  await sendAlert({
    level: 'warning',
    message: `${slowQueries.length} slow queries detected`,
    details: slowQueries.map(q => ({
      query: q.query,
      duration: q.duration,
      table: q.table
    }))
  })
}
```

## Monitoring Dashboard

### Accessing Monitoring Data

1. **Via API** (Admin only):
   ```bash
   curl https://your-domain.com/api/monitoring/database \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Via Supabase Dashboard**:
   - Go to **Database > Monitoring**
   - View real-time metrics
   - Review historical data

3. **Via Application Dashboard**:
   - Visit `/admin/performance` (admin only)
   - View performance metrics
   - Review slow queries

### Key Metrics to Monitor

1. **Database Health**:
   - Status (healthy/degraded/unhealthy)
   - Response time
   - Error rate

2. **Query Performance**:
   - Average query duration
   - Slow query count
   - Query frequency by table

3. **Connection Pool**:
   - Active connections
   - Idle connections
   - Pool utilization
   - Waiting queries

4. **Error Tracking**:
   - Failed queries
   - Error types
   - Error frequency

## Alert Response Procedures

### When Database is Unhealthy

1. **Immediate Actions**:
   - Check Supabase status page
   - Review recent database changes
   - Check application logs

2. **Investigation**:
   - Review slow queries
   - Check connection pool status
   - Review error logs

3. **Resolution**:
   - Fix identified issues
   - Optimize slow queries
   - Scale resources if needed

### When Error Rate is High

1. **Immediate Actions**:
   - Review error logs
   - Check for recent deployments
   - Review database changes

2. **Investigation**:
   - Identify error patterns
   - Review failed queries
   - Check for connection issues

3. **Resolution**:
   - Fix application errors
   - Update database queries
   - Rollback if necessary

### When Connection Pool is Exhausted

1. **Immediate Actions**:
   - Check for connection leaks
   - Review long-running queries
   - Check database load

2. **Investigation**:
   - Review connection usage patterns
   - Identify connection leaks
   - Review query performance

3. **Resolution**:
   - Fix connection leaks
   - Optimize queries
   - Consider increasing pool size

## Testing Alerts

### Test Alert Configuration

1. **Create Test Error**:
   ```typescript
   // Temporarily cause a database error
   const supabase = createServerSupabase()
   await supabase.from('nonexistent_table').select('*')
   ```

2. **Verify Alert**:
   - Check email/Slack for alert
   - Verify alert contains correct information
   - Confirm alert frequency is appropriate

3. **Test Recovery**:
   - Fix the test error
   - Verify alert clears
   - Confirm recovery notification

### Regular Alert Testing

- **Weekly**: Test one alert type
- **Monthly**: Review all alert configurations
- **Quarterly**: Test full alert response procedure

## Best Practices

### 1. Alert Thresholds

- ✅ Set thresholds based on your application's needs
- ✅ Avoid alert fatigue (too many alerts)
- ✅ Use different severity levels appropriately

### 2. Alert Notifications

- ✅ Use multiple notification channels (email + Slack)
- ✅ Include relevant context in alerts
- ✅ Set up escalation procedures

### 3. Alert Response

- ✅ Document response procedures
- ✅ Assign on-call responsibilities
- ✅ Track alert resolution times

### 4. Monitoring Review

- ✅ Review alert effectiveness monthly
- ✅ Adjust thresholds based on trends
- ✅ Remove unnecessary alerts

## Troubleshooting

### Alerts Not Firing

1. **Check Configuration**:
   - Verify alert rules are enabled
   - Check notification channels are configured
   - Verify thresholds are set correctly

2. **Check Monitoring**:
   - Verify monitoring is collecting data
   - Check database connection
   - Review monitoring logs

### Too Many Alerts

1. **Adjust Thresholds**:
   - Increase threshold values
   - Add cooldown periods
   - Use alert grouping

2. **Review Alert Rules**:
   - Remove unnecessary alerts
   - Combine similar alerts
   - Use alert suppression

## Checklist

Use this checklist to verify your alert configuration:

- [ ] Database health alerts configured
- [ ] Error rate alerts configured
- [ ] Connection pool alerts configured
- [ ] Slow query alerts configured
- [ ] Notification channels configured (email, Slack)
- [ ] Alert thresholds tested
- [ ] Response procedures documented
- [ ] On-call rotation established
- [ ] Alert effectiveness reviewed monthly

## Next Steps

1. ✅ Configure alerts in Supabase dashboard
2. ✅ Set up application-level alerts
3. ✅ Configure Sentry database alerts
4. ✅ Test alert configuration
5. ✅ Document alert response procedures
6. ✅ Establish on-call rotation

## Resources

- **Supabase Dashboard**: https://app.supabase.com
- **Sentry Alerts**: https://talyaglobal.sentry.io/alerts/rules/
- **Monitoring API**: `/api/monitoring/database`
- **Database Monitoring Guide**: `docs/DATABASE_MONITORING.md`

