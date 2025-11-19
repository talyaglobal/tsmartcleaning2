'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'
import { trackEvent } from '@/lib/analytics'

/**
 * Web Vitals performance monitoring
 * Tracks Core Web Vitals and sends them to analytics and performance metrics API
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

      // Send to performance metrics API
      fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric_name: metric.name,
          metric_type: 'frontend',
          value_ms: metric.name === 'CLS' ? metric.value * 1000 : metric.value, // CLS is 0-1, convert to ms
          endpoint_path: window.location.pathname,
          metadata: {
            id: metric.id,
            rating: metric.rating,
            delta: metric.delta,
            navigationType: metric.navigationType,
            url: window.location.href,
            timestamp: Date.now(),
          },
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail if performance API is unavailable
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
    onINP(sendToAnalytics) // INP replaces FID in newer web-vitals
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)

    // Track page load time
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          fetch('/api/performance/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metric_name: 'page_load_time',
              metric_type: 'frontend',
              value_ms: loadTime,
              endpoint_path: window.location.pathname,
              metadata: {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                firstByte: navigation.responseStart - navigation.fetchStart,
                url: window.location.href,
                timestamp: Date.now(),
              },
            }),
            keepalive: true,
          }).catch(() => {
            // Silently fail
          })
        }
      })
    }
  }, [])

  return null
}

