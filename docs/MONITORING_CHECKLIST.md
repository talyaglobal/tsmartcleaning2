# Monitoring & Logging Checklist Guide

This guide helps you verify and complete all monitoring and logging checklist items from `FINAL_MISSING_TODO.md`.

## Quick Verification

Run the automated verification script:

```bash
npm run verify:monitoring
```

This script checks:
- ✅ Sentry configuration
- ✅ Application logs setup
- ✅ Database connection pool health
- ✅ Performance metrics tables
- ✅ Health check endpoint

## Detailed Checklist Items

### 1. Error logs reviewed (Sentry dashboard)

**Status:** Manual verification required

**Steps:**
1. Go to [Sentry Dashboard](https://talyaglobal.sentry.io/issues/?project=4510388988018768)
2. Navigate to **Issues** tab
3. Review recent errors:
   - Check for critical errors (marked with 🔴)
   - Review error frequency and trends
   - Identify patterns or recurring issues
4. Navigate to **Discover** tab to view logs:
   - Filter by log level: `level:error` or `level:critical`
   - Review error messages and stack traces
   - Check for any production-critical errors

**What to look for:**
- ✅ No critical errors in the last 24 hours
- ✅ Error rate is below 1% of total requests
- ✅ No new error types appearing
- ✅ All errors have proper context and stack traces

**Action items if issues found:**
- Investigate and fix critical errors
- Add error handling for unhandled exceptions
- Update error messages to include more context

---

### 2. No critical errors in production logs

**Status:** Manual verification required

**Steps:**
1. Access Sentry Discover: https://talyaglobal.sentry.io/discover/
2. Create a query:
   ```
   level:critical OR level:error
   environment:production
   ```
3. Set time range to last 24 hours
4. Review results:
   - Count total critical/error events
   - Check if any are recurring
   - Verify error rates are acceptable

**Acceptable thresholds:**
- ✅ Critical errors: 0 in last 24 hours
- ✅ Error rate: < 1% of total requests
- ✅ No recurring errors without fixes

**If critical errors found:**
1. Click on error to see details
2. Check stack trace and context
3. Create issue/ticket to fix
4. Set up alert for this error type

---

### 3. Application logs accessible and searchable

**Status:** ✅ Configured (Sentry)

**Verification:**
1. Go to Sentry Discover: https://talyaglobal.sentry.io/discover/
2. Test search queries:
   ```
   # All logs
   *
   
   # By category
   category:payment
   category:authentication
   
   # By tenant
   tenantId:your-tenant-id
   
   # By log level
   level:error
   level:warning
   ```

**Features available:**
- ✅ Full-text search across all logs
- ✅ Filter by log level, category, tenant, user
- ✅ Time range filtering
- ✅ Export logs for analysis
- ✅ Saved queries for common searches

**If logs not accessible:**
- Verify `enableLogs: true` in `sentry.server.config.ts`
- Check Sentry DSN is configured correctly
- Verify network connectivity to Sentry

---

### 4. Error alerts configured and tested

**Status:** Manual configuration required

**Steps to configure:**

1. **Go to Sentry Alerts:**
   - Navigate to: https://talyaglobal.sentry.io/alerts/rules/
   - Click "Create Alert Rule"

2. **Configure Critical Error Alert:**
   - **Name:** Critical Errors
   - **Conditions:**
     - When an issue is created
     - Level is "error" or "fatal"
     - Tags: `logLevel:critical`
   - **Actions:**
     - Send email notification
     - Send Slack notification (if configured)
   - **Frequency:** Immediately

3. **Configure Payment Failure Alert:**
   - **Name:** Payment Processing Failures
   - **Conditions:**
     - When an issue is created
     - Tags: `category:payment`
     - Level is "error" or "fatal"
   - **Actions:** Email + Slack

4. **Configure Database Error Alert:**
   - **Name:** Database Errors
   - **Conditions:**
     - When an issue is created
     - Tags: `category:database`
     - Error rate > 5% in 5 minutes
   - **Actions:** Email + Slack

5. **Configure Authentication Failure Alert:**
   - **Name:** Authentication Failures
   - **Conditions:**
     - When an issue is created
     - Tags: `category:authentication`
     - Count > 10 in 5 minutes (potential attack)
   - **Actions:** Email + Slack

6. **Test alerts:**
   - Go to `/sentry-example-page`
   - Click "Throw Sample Error"
   - Verify alert is received within 1-2 minutes

**Notification channels to configure:**
- Email: Add team email addresses
- Slack: Connect Slack workspace (Settings → Integrations → Slack)

---

### 5. Uptime monitoring shows green status

**Status:** Manual setup required

**Health Check Endpoint:**
- **URL:** `https://your-domain.com/api/health`
- **Method:** GET
- **Expected Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "checks": {
      "database": { "status": "ok", "message": "..." },
      "api": { "status": "ok", "message": "..." },
      "environment": { "status": "ok", "message": "..." },
      "connection": { "status": "ok", "message": "..." }
    },
    "uptime": 12345.67,
    "duration": 45
  }
  ```

**Setup Uptime Monitoring:**

**Option 1: UptimeRobot (Free)**
1. Sign up at https://uptimerobot.com
2. Add New Monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://your-domain.com/api/health`
   - **Interval:** 5 minutes
   - **Alert Contacts:** Add email/SMS
3. Verify monitor shows "Up" status

**Option 2: Pingdom**
1. Sign up at https://www.pingdom.com
2. Create new check:
   - **URL:** `https://your-domain.com/api/health`
   - **Interval:** 1 minute
   - **Alert:** Email/SMS

**Option 3: Vercel Health Checks**
1. Go to Vercel Dashboard → Project → Settings
2. Navigate to "Health Checks"
3. Add health check:
   - **Path:** `/api/health`
   - **Interval:** 1 minute

**Verification:**
- ✅ Health endpoint returns 200 status
- ✅ Response includes `status: "healthy"`
- ✅ All checks show `status: "ok"`
- ✅ Uptime monitor shows green/up status

---

### 6. Performance metrics within acceptable ranges

**Status:** ✅ Configured (Performance monitoring tables exist)

**Check Performance Metrics:**

1. **Via API:**
   ```bash
   curl https://your-domain.com/api/monitoring/performance
   ```

2. **Via Database:**
   ```sql
   -- Recent performance metrics
   SELECT 
     metric_name,
     metric_type,
     AVG(value_ms) as avg_response_time,
     COUNT(*) as sample_count,
     MAX(created_at) as last_measurement
   FROM performance_metrics
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY metric_name, metric_type
   ORDER BY avg_response_time DESC;
   ```

3. **Check Slow Queries:**
   ```sql
   SELECT 
     table_name,
     query_type,
     execution_time_ms,
     created_at
   FROM slow_queries
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY execution_time_ms DESC
   LIMIT 20;
   ```

**Acceptable Ranges:**
- ✅ API Response Time: < 500ms (average), < 2s (P95)
- ✅ Database Query Time: < 200ms (average), < 1s (P95)
- ✅ Page Load Time: < 3s (LCP)
- ✅ Error Rate: < 1%
- ✅ Slow Queries: < 5% of total queries

**If metrics exceed thresholds:**
1. Identify slow endpoints/queries
2. Review slow_queries table
3. Optimize database queries (add indexes)
4. Review API route performance
5. Check for N+1 query problems

---

### 7. Database connection pool healthy

**Status:** ✅ Configured (Monitoring available)

**Check Connection Pool Health:**

1. **Via API:**
   ```bash
   curl https://your-domain.com/api/monitoring/database
   ```

2. **Via Script:**
   ```bash
   npm run monitor:supabase
   ```

3. **Via Supabase Dashboard:**
   - Go to: https://app.supabase.com/project/_/settings/database
   - Navigate to "Connection Pooling"
   - Check:
     - Active connections
     - Idle connections
     - Max connections
     - Connection pool utilization

**Healthy Indicators:**
- ✅ Connection pool utilization: < 80%
- ✅ No waiting queries
- ✅ Active connections: < max connections
- ✅ Connection errors: < 1% of total queries
- ✅ Average connection time: < 100ms

**Connection Pool Metrics:**
```json
{
  "connectionPool": {
    "activeConnections": 15,
    "idleConnections": 85,
    "totalConnections": 100,
    "maxConnections": 100,
    "waitingQueries": 0
  }
}
```

**If pool is unhealthy:**
1. Check for connection leaks (queries not closing)
2. Review long-running queries
3. Consider increasing pool size (if available)
4. Optimize queries to reduce connection hold time
5. Check for connection pool exhaustion errors in logs

---

## Automated Verification

Run the verification script to check most items automatically:

```bash
npm run verify:monitoring
```

This will verify:
- ✅ Sentry configuration files exist
- ✅ Sentry DSN is configured
- ✅ Health check endpoint exists
- ✅ Performance monitoring tables exist
- ✅ Database connection pool is accessible
- ✅ Database health check passes

## Manual Verification Required

These items require manual verification:

1. **Sentry Dashboard Access:**
   - Visit: https://talyaglobal.sentry.io/issues/?project=4510388988018768
   - Verify you can access and review errors

2. **Error Alerts:**
   - Configure alert rules in Sentry
   - Test alerts by triggering test errors

3. **Uptime Monitoring:**
   - Set up external uptime monitoring service
   - Configure to check `/api/health` endpoint

4. **Production Logs Review:**
   - Review Sentry Discover for production errors
   - Check error trends and patterns

## Quick Reference

### Health Check Endpoint
- **URL:** `/api/health`
- **Method:** GET
- **Response:** JSON with system health status

### Monitoring Endpoints
- **Database:** `/api/monitoring/database` (admin only)
- **Performance:** `/api/monitoring/performance` (admin only)

### Sentry Resources
- **Dashboard:** https://talyaglobal.sentry.io/issues/?project=4510388988018768
- **Discover (Logs):** https://talyaglobal.sentry.io/discover/
- **Alerts:** https://talyaglobal.sentry.io/alerts/rules/

### Supabase Resources
- **Dashboard:** https://app.supabase.com
- **Connection Pooling:** Project Settings → Database → Connection Pooling

## Troubleshooting

### Health Check Returns 503
- Check database connection
- Verify environment variables are set
- Review application logs for errors

### Sentry Not Receiving Logs
- Verify `enableLogs: true` in Sentry config
- Check Sentry DSN is correct
- Verify network connectivity
- Check Sentry quota/rate limits

### Database Pool Exhaustion
- Review active connections in Supabase dashboard
- Check for connection leaks
- Optimize long-running queries
- Consider connection pool size increase

### Performance Metrics Missing
- Verify performance monitoring tables exist
- Check if queries are being tracked
- Review `lib/performance.ts` integration

## Next Steps

After completing all checklist items:

1. ✅ Set up regular monitoring reviews (weekly)
2. ✅ Configure alert notifications
3. ✅ Document any custom monitoring requirements
4. ✅ Set up dashboards for key metrics
5. ✅ Establish on-call rotation for alerts

