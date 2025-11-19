# Booking Reminder Cron Job Setup

This document describes how to set up automated booking reminder notifications using cron jobs.

## Overview

The booking reminder system sends automated email reminders to customers before their scheduled bookings. The system supports three types of reminders:

- **24h**: Sent 24 hours before the booking
- **2h**: Sent 2 hours before the booking
- **same-day**: Sent on the morning of the booking (for bookings after 9 AM)

## API Endpoint

The reminder system is triggered via the following API endpoint:

```
POST /api/bookings/reminders/send?type={reminderType}
```

**Query Parameters:**
- `type`: `'24h'` | `'2h'` | `'same-day'` | `'all'` (default: `'24h'`)

**Response:**
```json
{
  "success": true,
  "reminderType": "24h",
  "processed": 10,
  "sent": 10,
  "errors": 0,
  "message": "Processed 10 bookings, sent 10 reminders, 0 errors"
}
```

## Cron Job Configuration

### Option 1: Using Vercel Cron Jobs (Recommended for Vercel deployments)

Add the following to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/bookings/reminders/send?type=24h",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/bookings/reminders/send?type=2h",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/bookings/reminders/send?type=same-day",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Schedule Explanations:**
- `0 9 * * *`: Runs daily at 9:00 AM (for 24h reminders)
- `*/30 * * * *`: Runs every 30 minutes (for 2h reminders)
- `0 8 * * *`: Runs daily at 8:00 AM (for same-day reminders)

### Option 2: Using External Cron Service (e.g., cron-job.org, EasyCron)

Set up three separate cron jobs:

1. **24h Reminders** (Daily at 9:00 AM)
   - URL: `https://your-domain.com/api/bookings/reminders/send?type=24h`
   - Method: POST
   - Schedule: Daily at 9:00 AM

2. **2h Reminders** (Every 30 minutes)
   - URL: `https://your-domain.com/api/bookings/reminders/send?type=2h`
   - Method: POST
   - Schedule: Every 30 minutes

3. **Same-Day Reminders** (Daily at 8:00 AM)
   - URL: `https://your-domain.com/api/bookings/reminders/send?type=same-day`
   - Method: POST
   - Schedule: Daily at 8:00 AM

### Option 3: Using Server Cron (Linux/Unix)

Add to your crontab (`crontab -e`):

```bash
# 24h reminders - daily at 9:00 AM
0 9 * * * curl -X POST https://your-domain.com/api/bookings/reminders/send?type=24h

# 2h reminders - every 30 minutes
*/30 * * * * curl -X POST https://your-domain.com/api/bookings/reminders/send?type=2h

# Same-day reminders - daily at 8:00 AM
0 8 * * * curl -X POST https://your-domain.com/api/bookings/reminders/send?type=same-day
```

## Security Considerations

If you need to secure the endpoint, consider:

1. **API Key Authentication**: Add an API key check in the endpoint
2. **IP Whitelisting**: Restrict access to specific IP addresses
3. **Secret Token**: Use a secret token in the request body or headers

Example with API key:

```typescript
// In the endpoint handler
const apiKey = request.headers.get('x-api-key')
if (apiKey !== process.env.CRON_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Then update your cron job to include the header:

```bash
curl -X POST \
  -H "x-api-key: your-secret-key" \
  https://your-domain.com/api/bookings/reminders/send?type=24h
```

## Testing

You can manually test the endpoint:

```bash
# Test 24h reminders
curl -X POST https://your-domain.com/api/bookings/reminders/send?type=24h

# Test all reminder types
curl -X POST https://your-domain.com/api/bookings/reminders/send?type=all
```

## Monitoring

Monitor the cron job execution by:

1. Checking application logs for reminder processing
2. Setting up alerts for error rates
3. Tracking email delivery rates
4. Monitoring booking reminder open/click rates

## Notes

- The system automatically filters bookings that are already cancelled
- Reminders are sent for bookings with status `pending` or `confirmed`
- The system processes reminders in batches and handles errors gracefully
- Each reminder type has specific time windows to avoid duplicate sends

