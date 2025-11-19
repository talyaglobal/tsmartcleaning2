// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://0bd37dff0c7bd1c0c74baf520b0b25db@o4510388984217600.ingest.de.sentry.io/4510388988018768",

  // Performance Monitoring (APM)
  // Edge runtime has lower sampling rate due to high volume
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Use tracesSampler for dynamic sampling
  tracesSampler: (samplingContext) => {
    if (process.env.NODE_ENV !== 'production') {
      return 1.0
    }
    
    // Sample middleware and edge routes at lower rate
    return 0.05 // 5% for edge runtime
  },

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  
  // Performance monitoring options
  beforeSendTransaction(event) {
    // Add custom tags for edge runtime
    event.tags = {
      ...event.tags,
      runtime: 'edge',
      environment: process.env.NODE_ENV || 'development',
    }
    return event
  },
});
