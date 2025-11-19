# Analytics & Monitoring Setup Guide

This document describes the analytics and monitoring infrastructure implemented for tSmartCleaning.

## Overview

The analytics system includes:
1. **Error Tracking** - Sentry for error monitoring
2. **User Analytics** - Vercel Analytics for user behavior
3. **Conversion Tracking** - Google Analytics for conversions
4. **Performance Monitoring** - Web Vitals tracking
5. **Custom Analytics Dashboard** - Internal analytics dashboard

## Components

### 1. Sentry Error Tracking

**Setup:**
✅ **Already Configured** - Sentry has been set up using the official Sentry wizard.

**Project Details:**
- Organization: `talyaglobal`
- Project: `javascript-nextjs`
- DSN: Configured in all config files (can also use environment variables)

**Configuration Files:**
- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration  
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation.ts` - Server/edge runtime initialization
- `app/global-error.tsx` - Global error boundary for App Router
- `next.config.mjs` - Wrapped with `withSentryConfig` for source maps and build integration

**Features Enabled:**
- ✅ Automatic error capture from React Error Boundaries
- ✅ Session Replay for debugging (10% session sample rate, 100% on errors)
- ✅ Performance monitoring (tracing enabled)
- ✅ Source maps support (configured in next.config.mjs)
- ✅ Logs integration (application logs sent to Sentry)
- ✅ Tunnel route (`/monitoring`) to avoid ad blockers
- ✅ Automatic Vercel Cron Monitors integration

**Environment Variables (Optional):**
You can override the DSN using environment variables:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here  # For client-side
SENTRY_DSN=your_sentry_dsn_here              # For server-side
SENTRY_AUTH_TOKEN=your_auth_token            # For source map uploads (CI/CD)
```

**Testing:**
Visit `/sentry-example-page` to test your Sentry setup. This page includes:
- Frontend error testing
- Backend API error testing
- Connectivity diagnostics

**Usage:**
Errors are automatically captured in production. You can also manually capture errors:

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Your code
} catch (error) {
  Sentry.captureException(error)
}
```

### 2. Vercel Analytics

**Setup:**
- Already installed: `@vercel/analytics`
- Automatically enabled on Vercel deployments
- No additional configuration needed

**Features:**
- Page view tracking
- Real-time analytics
- Audience insights
- Geographic data

**Usage:**
The `<Analytics />` component is already included in the root layout.

### 3. Google Analytics

**Setup:**
1. Create a Google Analytics 4 property
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Set the following environment variable:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

**Features:**
- Page view tracking
- Event tracking
- Conversion tracking
- E-commerce tracking

**Usage:**
Use the analytics utility functions:

```typescript
import { trackEvent, trackConversion, trackPurchase } from '@/lib/analytics'

// Track a custom event
trackEvent('button_click', {
  event_category: 'engagement',
  event_label: 'Sign Up Button',
})

// Track a conversion
trackConversion('booking', 150.00, 'USD')

// Track a purchase
trackPurchase('transaction-id', 150.00, 'USD', [
  { item_id: 'booking-123', item_name: 'Cleaning Service', price: 150.00, quantity: 1 }
])
```

### 4. Web Vitals Performance Monitoring

**Setup:**
- Already installed: `web-vitals`
- Automatically tracks Core Web Vitals
- Sends data to Google Analytics and optional custom endpoint

**Tracked Metrics:**
- **LCP (Largest Contentful Paint)** - Loading performance
- **FID (First Input Delay)** - Interactivity
- **CLS (Cumulative Layout Shift)** - Visual stability
- **FCP (First Contentful Paint)** - Initial loading
- **TTFB (Time to First Byte)** - Server response time

**Configuration:**
Set an optional custom analytics endpoint:
```
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-api.com/analytics/web-vitals
```

### 5. Custom Analytics Dashboard

**Location:** `/admin/analytics`

**Features:**
- Total events count
- Unique users and sessions
- Conversion tracking
- Event categorization
- Time series visualization
- Top events listing

**Database:**
The analytics events are stored in the `analytics_events` table. To create this table, run:

```bash
# Run the migration script
psql -d your_database -f scripts/26_analytics_events.sql
```

**API Endpoints:**
- `POST /api/analytics/track` - Track a custom event
- `GET /api/analytics/track` - Retrieve analytics events
- `GET /api/analytics/dashboard` - Get aggregated dashboard data

**Example: Tracking a Custom Event**

```typescript
// Frontend
const response = await fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventName: 'booking_completed',
    eventCategory: 'conversion',
    eventLabel: 'Standard Cleaning',
    value: 150.00,
    metadata: {
      bookingId: 'booking-123',
      serviceType: 'standard',
    },
  }),
})
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_DSN=your_sentry_dsn_here

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Custom analytics endpoint for Web Vitals
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-api.com/analytics/web-vitals
```

## Dashboard Access

To access the analytics dashboard:
1. Navigate to `/admin/analytics`
2. Select a time period (7, 30, or 90 days)
3. View metrics and charts

## Best Practices

1. **Privacy**: Ensure compliance with privacy regulations (GDPR, CCPA, etc.)
2. **Error Tracking**: Use Sentry sparingly in development to avoid noise
3. **Performance**: Web Vitals are tracked automatically; no manual setup needed
4. **Conversions**: Track all important conversion events using `trackConversion()`
5. **Data Retention**: Consider setting up data retention policies for analytics events

## Troubleshooting

**Sentry not capturing errors:**
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check Sentry project settings
- Ensure you're testing in production mode

**Google Analytics not tracking:**
- Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- Check browser console for errors
- Use Google Analytics DebugView

**Analytics dashboard showing no data:**
- Ensure the `analytics_events` table exists
- Check that events are being tracked
- Verify database permissions

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Web Vitals Documentation](https://web.dev/vitals/)

