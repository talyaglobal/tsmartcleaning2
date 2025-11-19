// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://0bd37dff0c7bd1c0c74baf520b0b25db@o4510388984217600.ingest.de.sentry.io/4510388988018768",

  // Performance Monitoring (APM)
  // Adjust tracesSampleRate in production: 1.0 = 100%, 0.1 = 10%
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
    
    // Sample API routes at higher rate
    if (transactionContext?.name?.includes('/api/')) {
      return 0.2 // 20% of API routes
    }
    
    // Sample database operations
    if (transactionContext?.name?.includes('db_') || transactionContext?.name?.includes('query')) {
      return 0.3 // 30% of database operations
    }
    
    // Default sample rate for other transactions
    return 0.1 // 10%
  },

  // Enable logs to be sent to Sentry for aggregation
  enableLogs: true,
  
  // Configure log levels to send to Sentry
  // All logs are sent to Sentry for centralized monitoring
  logLevels: ['debug', 'info', 'warning', 'error', 'fatal'],

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  
  // Performance monitoring options
  beforeSendTransaction(event) {
    // Add custom tags for performance analysis
    if (event.transaction) {
      event.tags = {
        ...event.tags,
        transaction_type: event.transaction.split(' ')[0], // e.g., 'GET', 'POST'
        environment: process.env.NODE_ENV || 'development',
      }
    }
    return event
  },
  
  // Filter out sensitive data from logs
  beforeSend(event, hint) {
    // Remove sensitive fields from extra data
    if (event.extra) {
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']
      sensitiveFields.forEach(field => {
        if (event.extra?.[field]) {
          event.extra[field] = '[REDACTED]'
        }
      })
    }
    return event
  },
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking for deployments
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
  
  // Instrumentation options
  instrumenter: 'sentry',
});
