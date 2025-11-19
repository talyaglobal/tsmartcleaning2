// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://0bd37dff0c7bd1c0c74baf520b0b25db@o4510388984217600.ingest.de.sentry.io/4510388988018768",
  
  // Performance Monitoring (APM)
  // Adjust tracesSampleRate in production: 1.0 = 100%, 0.1 = 10%
  // Use tracesSampler for more control (e.g., sample more for slow transactions)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Use tracesSampler for dynamic sampling based on transaction context
  tracesSampler: (samplingContext) => {
    // Sample all transactions in development
    if (process.env.NODE_ENV !== 'production') {
      return 1.0
    }
    
    // In production, sample based on context
    const { transactionContext } = samplingContext
    
    // Always sample slow transactions
    if (transactionContext?.data?.performance?.isSlow) {
      return 1.0
    }
    
    // Sample critical routes at higher rate
    if (transactionContext?.name?.includes('/api/')) {
      return 0.2 // 20% of API routes
    }
    
    // Default sample rate for other transactions
    return 0.1 // 10%
  },
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Browser tracing is automatically enabled in Next.js SDK
    // Core Web Vitals are tracked via web-vitals package (see components/analytics/WebVitals.tsx)
  ],
  
  environment: process.env.NODE_ENV || 'development',
  
  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,
  
  // Performance monitoring options
  beforeSendTransaction(event) {
    // Add custom tags for performance analysis
    if (event.transaction) {
      event.tags = {
        ...event.tags,
        transaction_type: event.transaction.split(' ')[0], // e.g., 'GET', 'POST'
      }
    }
    return event
  },
  
  // Filter out sensitive data
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        // Don't send network errors
        if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
          return null
        }
      }
    }
    
    return event
  },
})

