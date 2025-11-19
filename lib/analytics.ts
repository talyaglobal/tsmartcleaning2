/**
 * Analytics and tracking utilities
 * Centralized analytics functions for error tracking, user analytics, conversion tracking, and performance monitoring
 */

// Google Analytics tracking
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', eventName, eventParams)
  }
}

// Conversion tracking helpers
export function trackConversion(type: 'booking' | 'signup' | 'payment' | 'contact', value?: number, currency = 'USD') {
  trackEvent('conversion', {
    event_category: 'conversion',
    event_label: type,
    value,
    currency,
  })
}

// Page view tracking
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// User engagement tracking
export function trackEngagement(action: string, category: string, label?: string, value?: number) {
  trackEvent(action, {
    event_category: category,
    event_label: label,
    value,
  })
}

// E-commerce tracking
export function trackPurchase(transactionId: string, value: number, currency = 'USD', items?: Array<{ item_id: string; item_name: string; price: number; quantity: number }>) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  })
}

