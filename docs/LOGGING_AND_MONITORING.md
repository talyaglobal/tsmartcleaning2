# Logging and Monitoring Guide

## Overview

This application uses **Sentry** as the primary log aggregation service. All application logs are sent to Sentry for centralized monitoring, retention, and alerting.

## Log Aggregation Service

### Configuration

- **Service**: Sentry
- **Organization**: talyaglobal
- **Project**: javascript-nextjs
- **DSN**: Configured in `sentry.server.config.ts` and `sentry.client.config.ts`
- **Log Integration**: Enabled via `enableLogs: true`

### Log Levels

The application uses structured logging with the following levels:

- **DEBUG**: Development-only logs (disabled in production by default)
- **INFO**: Informational messages about normal operations
- **WARNING**: Warnings that may need attention but don't break functionality
- **ERROR**: Errors that need investigation
- **CRITICAL**: Critical errors requiring immediate attention

## Log Retention Policy

Logs are retained in Sentry according to the following policy:

| Log Level | Retention Period | Rationale |
|-----------|-----------------|-----------|
| **CRITICAL** | 90 days | Security and business-critical events need long-term retention for compliance and investigation |
| **ERROR** | 90 days | Error logs are essential for debugging and understanding system failures |
| **WARNING** | 30 days | Warnings provide context for issues but don't require long-term retention |
| **INFO** | 7 days | Informational logs are useful for recent activity monitoring |
| **DEBUG** | 1 day | Debug logs are only needed for immediate troubleshooting |

### Retention Configuration

Retention policies are configured in Sentry:
1. Go to Settings → Projects → [Project Name] → Client Keys (DSN)
2. Navigate to Data Retention settings
3. Configure retention periods per log level

**Note**: Default Sentry retention is 90 days for all events. Adjust based on your plan and requirements.

## Critical Logs Identified

The following log categories are identified as critical and require immediate monitoring:

### 1. Authentication Events
- **Category**: `authentication`
- **Examples**:
  - Failed login attempts
  - Account lockouts
  - Password reset requests
  - Multi-factor authentication failures
- **Monitoring**: Alert on multiple failed attempts from same IP/user

### 2. Authorization Violations
- **Category**: `authorization`
- **Examples**:
  - Unauthorized access attempts
  - Permission denied errors
  - Role-based access control violations
- **Monitoring**: Alert on any authorization failure

### 3. Payment Processing Errors
- **Category**: `payment`
- **Examples**:
  - Payment gateway failures
  - Transaction processing errors
  - Refund processing issues
  - Stripe webhook failures
- **Monitoring**: Alert on any payment processing error

### 4. Database Errors
- **Category**: `database`
- **Examples**:
  - Connection pool exhaustion
  - Query timeouts
  - Transaction failures
  - Data integrity violations
- **Monitoring**: Alert on connection failures or high error rates

### 5. Security Events
- **Category**: `security`
- **Examples**:
  - SQL injection attempts
  - XSS attack patterns
  - CSRF violations
  - Suspicious API activity
- **Monitoring**: Alert on any security-related event

### 6. Rate Limit Violations
- **Category**: `rate_limit`
- **Examples**:
  - API rate limit exceeded
  - Too many requests from single IP
  - DDoS attack patterns
- **Monitoring**: Alert on sustained rate limit violations

### 7. Third-Party Service Failures
- **Category**: `third_party`
- **Examples**:
  - Email service failures (SMTP)
  - WhatsApp API failures
  - External API timeouts
  - Webhook delivery failures
- **Monitoring**: Alert on service unavailability

### 8. Data Integrity Issues
- **Category**: `data_integrity`
- **Examples**:
  - Data validation failures
  - Referential integrity violations
  - Audit log inconsistencies
- **Monitoring**: Alert on data integrity violations

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logging'

// Info log
logger.info('User logged in', { userId: '123', tenantId: 'abc' })

// Warning log
logger.warn('High memory usage detected', { memoryUsage: '85%' })

// Error log
logger.error('Failed to process request', { requestId: 'req-123' }, error)

// Critical log
logger.critical('Payment processing failed', 'PAYMENT', { transactionId: 'tx-123' }, error)
```

### Specialized Logging Methods

```typescript
// Authentication events
logger.auth('Login failed', { userId: '123', ip: '192.168.1.1' }, error)

// Authorization violations
logger.authorization('Unauthorized access attempt', { userId: '123', resource: '/admin' }, error)

// Payment events
logger.payment('Stripe webhook failed', { eventId: 'evt_123' }, error)

// Database errors
logger.database('Connection pool exhausted', { poolSize: 100 }, error)

// Security events
logger.security('Suspicious activity detected', { ip: '192.168.1.1', pattern: 'sql_injection' }, error)

// Rate limit violations
logger.rateLimit('API rate limit exceeded', { userId: '123', endpoint: '/api/users' })

// Third-party service failures
logger.thirdParty('Stripe', 'API timeout', { endpoint: '/charges' }, error)
```

### Logging Context

Always include relevant context in logs:

```typescript
logger.error('Operation failed', {
  tenantId: 'tenant-123',
  userId: 'user-456',
  requestId: 'req-789',
  operation: 'create_booking',
  metadata: { bookingId: 'booking-123' }
}, error)
```

## Monitoring Setup

### Sentry Alerts

Configure alerts in Sentry for critical log categories:

1. **Go to**: Alerts → Create Alert Rule
2. **Set conditions**:
   - Event type: Error/Issue
   - Tags: `logLevel:critical` or `category:payment`
   - Threshold: > 0 (immediate alert)
3. **Notification channels**: Email, Slack, PagerDuty

### Recommended Alert Rules

1. **Critical Errors**: Alert on any log with `logLevel:critical`
2. **Payment Failures**: Alert on `category:payment` errors
3. **Authentication Failures**: Alert on multiple `category:authentication` errors from same IP
4. **Database Errors**: Alert on `category:database` errors with threshold > 5/min
5. **Security Events**: Alert on any `category:security` event

## Log Aggregation Dashboard

Access logs in Sentry:

1. **Issues**: https://talyaglobal.sentry.io/issues/?project=4510388988018768
2. **Discover**: Query logs by level, category, tenant, etc.
3. **Performance**: Monitor log volume and patterns

### Useful Queries

```
# All critical logs
logLevel:critical

# Payment errors in last 24h
category:payment AND level:error

# Authentication failures by IP
category:authentication AND level:error

# Database errors by tenant
category:database AND tenantId:*
```

## Migration from console.error

The application previously used `console.error` throughout. The new logging system:

1. **Maintains backward compatibility**: `logError()` function still works
2. **Gradual migration**: Update code to use `logger.*` methods over time
3. **Enhanced features**: Structured logging, Sentry integration, categorization

### Example Migration

**Before:**
```typescript
console.error('[api] Error processing request:', error)
```

**After:**
```typescript
import { logger } from '@/lib/logging'

logger.error('Error processing request', { 
  context: 'api',
  requestId: req.id 
}, error)
```

## Best Practices

1. **Always include context**: tenantId, userId, requestId when available
2. **Use appropriate log levels**: Don't log errors as warnings
3. **Categorize critical logs**: Use specialized methods for critical events
4. **Don't log sensitive data**: Passwords, tokens, API keys are automatically redacted
5. **Structured logging**: Use objects for metadata, not string concatenation
6. **Error objects**: Pass Error objects to logger methods for better stack traces

## Troubleshooting

### Logs not appearing in Sentry

1. Check `enableLogs: true` in Sentry config
2. Verify DSN is correct
3. Check network connectivity
4. Review Sentry quota/rate limits

### Too many logs

1. Adjust log levels in production
2. Use `ENABLE_DEBUG_LOGS=false` to disable debug logs
3. Configure sampling in Sentry for high-volume logs

### Missing context

1. Ensure middleware adds requestId to context
2. Include tenantId and userId in API routes
3. Use structured logging with metadata objects

## References

- [Sentry Logging Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#capture-logs)
- [Sentry Alert Rules](https://docs.sentry.io/product/alerts/alert-rules/)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging/)

