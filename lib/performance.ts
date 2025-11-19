/**
 * Performance Monitoring and APM Utilities
 * 
 * Provides utilities for:
 * - Tracking API response times
 * - Monitoring database query performance
 * - Recording slow queries
 * - Establishing and comparing performance baselines
 */

import { createServerSupabase } from './supabase'
import * as Sentry from '@sentry/nextjs'

export type MetricType = 'api' | 'database' | 'frontend' | 'system'

export interface PerformanceBaseline {
  metric_name: string
  metric_type: MetricType
  endpoint_path?: string
  table_name?: string
  baseline_value_ms: number
  threshold_warning_ms?: number
  threshold_critical_ms?: number
  tenant_id?: string | null
}

export interface PerformanceMetric {
  metric_name: string
  metric_type: MetricType
  value_ms: number
  endpoint_path?: string
  table_name?: string
  tenant_id?: string | null
  metadata?: Record<string, unknown>
}

export interface SlowQuery {
  query_type: string
  table_name?: string
  query_text: string
  execution_time_ms: number
  threshold_ms: number
  row_count?: number
  error_message?: string
  stack_trace?: string
  tenant_id?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Record a performance metric
 */
export async function recordPerformanceMetric(
  metric: PerformanceMetric
): Promise<void> {
  try {
    const supabase = createServerSupabase(metric.tenant_id || undefined)
    
    // Determine status based on baseline thresholds
    const status = await determineMetricStatus(metric)
    
    const { error } = await supabase.from('performance_metrics').insert({
      tenant_id: metric.tenant_id,
      metric_name: metric.metric_name,
      metric_type: metric.metric_type,
      value_ms: metric.value_ms,
      endpoint_path: metric.endpoint_path || null,
      table_name: metric.table_name || null,
      status,
      metadata: metric.metadata || {},
    })

    if (error) {
      console.error('[performance] Failed to record metric:', error)
    }

    // Also send to Sentry if critical
    if (status === 'critical') {
      Sentry.captureMessage(`Performance critical: ${metric.metric_name}`, {
        level: 'warning',
        tags: {
          metric_name: metric.metric_name,
          metric_type: metric.metric_type,
          status: 'critical',
        },
        extra: {
          value_ms: metric.value_ms,
          endpoint_path: metric.endpoint_path,
          table_name: metric.table_name,
        },
      })
    }
  } catch (err) {
    // Don't throw; performance monitoring must not break the main flow
    console.error('[performance] Error recording metric:', err)
  }
}

/**
 * Record a slow database query
 */
export async function recordSlowQuery(query: SlowQuery): Promise<void> {
  try {
    const supabase = createServerSupabase(query.tenant_id || undefined)
    
    const { error } = await supabase.from('slow_queries').insert({
      tenant_id: query.tenant_id,
      query_type: query.query_type,
      table_name: query.table_name || null,
      query_text: sanitizeQuery(query.query_text),
      execution_time_ms: query.execution_time_ms,
      threshold_ms: query.threshold_ms,
      row_count: query.row_count || null,
      error_message: query.error_message || null,
      stack_trace: query.stack_trace || null,
      metadata: query.metadata || {},
    })

    if (error) {
      console.error('[performance] Failed to record slow query:', error)
    }

    // Send to Sentry
    Sentry.captureMessage(`Slow query detected: ${query.table_name || 'unknown'}`, {
      level: 'warning',
      tags: {
        query_type: query.query_type,
        table_name: query.table_name || 'unknown',
      },
      extra: {
        execution_time_ms: query.execution_time_ms,
        threshold_ms: query.threshold_ms,
        query_text: sanitizeQuery(query.query_text),
      },
    })
  } catch (err) {
    console.error('[performance] Error recording slow query:', err)
  }
}

/**
 * Establish or update a performance baseline
 */
export async function setPerformanceBaseline(
  baseline: PerformanceBaseline
): Promise<void> {
  try {
    const supabase = createServerSupabase(baseline.tenant_id || undefined)
    
    const { error } = await supabase
      .from('performance_baselines')
      .upsert(
        {
          metric_name: baseline.metric_name,
          metric_type: baseline.metric_type,
          endpoint_path: baseline.endpoint_path || null,
          table_name: baseline.table_name || null,
          baseline_value_ms: baseline.baseline_value_ms,
          threshold_warning_ms: baseline.threshold_warning_ms || null,
          threshold_critical_ms: baseline.threshold_critical_ms || null,
          tenant_id: baseline.tenant_id || null,
          metadata: {},
        },
        {
          onConflict: 'metric_name,endpoint_path,table_name,tenant_id',
        }
      )

    if (error) {
      console.error('[performance] Failed to set baseline:', error)
    }
  } catch (err) {
    console.error('[performance] Error setting baseline:', err)
  }
}

/**
 * Get performance baseline for a metric
 */
export async function getPerformanceBaseline(
  metricName: string,
  metricType: MetricType,
  endpointPath?: string,
  tableName?: string,
  tenantId?: string | null
): Promise<PerformanceBaseline | null> {
  try {
    const supabase = createServerSupabase(tenantId || undefined)
    
    let query = supabase
      .from('performance_baselines')
      .select('*')
      .eq('metric_name', metricName)
      .eq('metric_type', metricType)

    if (endpointPath) {
      query = query.eq('endpoint_path', endpointPath)
    } else {
      query = query.is('endpoint_path', null)
    }

    if (tableName) {
      query = query.eq('table_name', tableName)
    } else {
      query = query.is('table_name', null)
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    } else {
      query = query.is('tenant_id', null)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    return {
      metric_name: data.metric_name,
      metric_type: data.metric_type,
      endpoint_path: data.endpoint_path,
      table_name: data.table_name,
      baseline_value_ms: data.baseline_value_ms,
      threshold_warning_ms: data.threshold_warning_ms,
      threshold_critical_ms: data.threshold_critical_ms,
      tenant_id: data.tenant_id,
    }
  } catch (err) {
    console.error('[performance] Error getting baseline:', err)
    return null
  }
}

/**
 * Determine metric status based on baseline thresholds
 */
async function determineMetricStatus(
  metric: PerformanceMetric
): Promise<'ok' | 'warning' | 'critical'> {
  const baseline = await getPerformanceBaseline(
    metric.metric_name,
    metric.metric_type,
    metric.endpoint_path,
    metric.table_name,
    metric.tenant_id
  )

  if (!baseline) {
    return 'ok' // No baseline, assume ok
  }

  if (
    baseline.threshold_critical_ms &&
    metric.value_ms > baseline.threshold_critical_ms
  ) {
    return 'critical'
  }

  if (
    baseline.threshold_warning_ms &&
    metric.value_ms > baseline.threshold_warning_ms
  ) {
    return 'warning'
  }

  return 'ok'
}

/**
 * Sanitize SQL query text to remove sensitive data
 */
function sanitizeQuery(queryText: string): string {
  // Remove potential sensitive values
  let sanitized = queryText
  
  // Remove email patterns
  sanitized = sanitized.replace(/['"]?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['"]?/gi, '[email]')
  
  // Remove UUIDs (but keep the pattern for debugging)
  sanitized = sanitized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[uuid]')
  
  // Remove long strings that might be tokens
  sanitized = sanitized.replace(/['"][^'"]{50,}['"]/g, '[long_string]')
  
  return sanitized.substring(0, 1000) // Limit length
}

/**
 * Measure execution time of an async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  metricName: string,
  metricType: MetricType,
  options?: {
    endpointPath?: string
    tableName?: string
    tenantId?: string | null
    thresholdMs?: number
    metadata?: Record<string, unknown>
  }
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await fn()
    const executionTime = performance.now() - startTime

    // Record metric
    await recordPerformanceMetric({
      metric_name: metricName,
      metric_type: metricType,
      value_ms: executionTime,
      endpoint_path: options?.endpointPath,
      table_name: options?.tableName,
      tenant_id: options?.tenantId,
      metadata: options?.metadata,
    })

    // Check if it's a slow query (for database metrics)
    if (
      metricType === 'database' &&
      options?.thresholdMs &&
      executionTime > options.thresholdMs
    ) {
      await recordSlowQuery({
        query_type: 'unknown',
        table_name: options.tableName,
        query_text: metricName,
        execution_time_ms: executionTime,
        threshold_ms: options.thresholdMs,
        tenant_id: options.tenantId,
        metadata: options.metadata,
      })
    }

    return result
  } catch (error: any) {
    const executionTime = performance.now() - startTime

    // Record failed metric
    await recordPerformanceMetric({
      metric_name: `${metricName}_error`,
      metric_type: metricType,
      value_ms: executionTime,
      endpoint_path: options?.endpointPath,
      table_name: options?.tableName,
      tenant_id: options?.tenantId,
      metadata: {
        ...options?.metadata,
        error: error.message,
      },
    })

    throw error
  }
}

/**
 * Initialize default performance baselines
 */
export async function initializeDefaultBaselines(
  tenantId?: string | null
): Promise<void> {
  const defaultBaselines: PerformanceBaseline[] = [
    // API response time baselines
    {
      metric_name: 'api_response_time',
      metric_type: 'api',
      baseline_value_ms: 200,
      threshold_warning_ms: 500,
      threshold_critical_ms: 1000,
      tenant_id: tenantId,
    },
    // Database query baselines
    {
      metric_name: 'db_query_time',
      metric_type: 'database',
      baseline_value_ms: 50,
      threshold_warning_ms: 200,
      threshold_critical_ms: 500,
      tenant_id: tenantId,
    },
    // Frontend page load baselines
    {
      metric_name: 'page_load_time',
      metric_type: 'frontend',
      baseline_value_ms: 1000,
      threshold_warning_ms: 2000,
      threshold_critical_ms: 3000,
      tenant_id: tenantId,
    },
  ]

  for (const baseline of defaultBaselines) {
    await setPerformanceBaseline(baseline)
  }
}

