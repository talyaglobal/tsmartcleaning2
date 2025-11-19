'use client'

import { useEffect } from 'react'
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'
import { trackEvent } from '@/lib/analytics'

/**
 * Web Vitals performance monitoring
 * Tracks Core Web Vitals and sends them to analytics
 */
export function WebVitals() {
  useEffect(() => {
    // Track Core Web Vitals
    function sendToAnalytics(metric: Metric) {
      // Send to Google Analytics
      trackEvent('web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.name,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      })

      // Send to custom analytics endpoint if needed
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: metric.name,
            value: metric.value,
            id: metric.id,
            rating: metric.rating,
            delta: metric.delta,
            navigationType: metric.navigationType,
            url: window.location.href,
            timestamp: Date.now(),
          }),
          keepalive: true,
        }).catch(() => {
          // Silently fail if analytics endpoint is unavailable
        })
      }
    }

    // Track all Core Web Vitals
    onCLS(sendToAnalytics)
    onFID(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  }, [])

  return null
}

