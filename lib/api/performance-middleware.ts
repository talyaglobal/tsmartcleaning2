/**
 * API Performance Middleware
 * 
 * Wraps API route handlers to automatically track response times
 * and record performance metrics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordPerformanceMetric } from '@/lib/performance'
import { resolveTenantFromRequest } from '@/lib/supabase'

export type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>

/**
 * Wraps an API route handler to track performance metrics
 */
export function withPerformanceTracking(
  handler: RouteHandler,
  options?: {
    endpointPath?: string
    thresholdWarningMs?: number
    thresholdCriticalMs?: number
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = performance.now()
    const pathname = request.nextUrl.pathname
    const endpointPath = options?.endpointPath || pathname
    const tenantId = resolveTenantFromRequest(request)

    // Get request start time from middleware if available
    const requestStartTime = request.headers.get('x-request-start-time')
    const totalTime = requestStartTime
      ? Date.now() - parseInt(requestStartTime, 10)
      : null

    try {
      const response = await handler(request, context)

      const executionTime = performance.now() - startTime
      const totalResponseTime = totalTime || executionTime

      // Record API response time metric
      recordPerformanceMetric({
        metric_name: 'api_response_time',
        metric_type: 'api',
        value_ms: totalResponseTime,
        endpoint_path: endpointPath,
        tenant_id: tenantId,
        metadata: {
          method: request.method,
          status: response.status,
          execution_time_ms: executionTime,
          total_time_ms: totalResponseTime,
        },
      }).catch(() => {
        // Silently fail - performance monitoring must not break the main flow
      })

      // Add performance header to response
      response.headers.set('x-response-time', Math.round(totalResponseTime).toString())
      response.headers.set('x-execution-time', Math.round(executionTime).toString())

      return response
    } catch (error: any) {
      const executionTime = performance.now() - startTime
      const totalResponseTime = totalTime || executionTime

      // Record failed API metric
      recordPerformanceMetric({
        metric_name: 'api_response_time_error',
        metric_type: 'api',
        value_ms: totalResponseTime,
        endpoint_path: endpointPath,
        tenant_id: tenantId,
        metadata: {
          method: request.method,
          error: error.message,
          execution_time_ms: executionTime,
        },
      }).catch(() => {
        // Silently fail
      })

      throw error
    }
  }
}

/**
 * Higher-order function to wrap route handlers with performance tracking
 */
export function trackPerformance(
  endpointPath?: string,
  options?: {
    thresholdWarningMs?: number
    thresholdCriticalMs?: number
  }
) {
  return function (
    handler: RouteHandler
  ): (request: NextRequest, context?: any) => Promise<NextResponse> {
    return withPerformanceTracking(handler, {
      endpointPath,
      ...options,
    })
  }
}



