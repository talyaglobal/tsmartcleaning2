/**
 * Supabase Performance Wrapper
 * 
 * Wraps Supabase client to automatically track query performance
 * and record slow queries.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabase } from './supabase'
import { recordSlowQuery, recordPerformanceMetric } from './performance'

const SLOW_QUERY_THRESHOLD_MS = 200 // Default threshold for slow queries

/**
 * Create a performance-monitored Supabase client
 */
export function createPerformanceMonitoredSupabase(
  tenantId?: string | null
): SupabaseClient {
  const supabase = createServerSupabase(tenantId)

  // Wrap the query builder to track performance
  return new Proxy(supabase, {
    get(target, prop) {
      const original = target[prop as keyof typeof target]

      // Only wrap 'from' method which starts query chains
      if (prop === 'from') {
        return function (table: string) {
          const queryBuilder = original.call(target, table)

          // Wrap the query execution methods
          return wrapQueryBuilder(queryBuilder, table, tenantId)
        }
      }

      return original
    },
  }) as SupabaseClient
}

/**
 * Wrap a query builder to track performance
 */
function wrapQueryBuilder(
  queryBuilder: any,
  tableName: string,
  tenantId?: string | null
): any {
  const methodsToWrap = ['select', 'insert', 'update', 'delete', 'upsert']

  return new Proxy(queryBuilder, {
    get(target, prop) {
      const original = target[prop as keyof typeof target]

      if (typeof original === 'function') {
        // Wrap execution methods
        if (prop === 'then' || prop === 'catch') {
          return function (...args: any[]) {
            const startTime = performance.now()
            const queryType = getQueryType(target)

            return original
              .call(target, ...args)
              .then((result: any) => {
                const executionTime = performance.now() - startTime

                // Record performance metric
                recordPerformanceMetric({
                  metric_name: 'db_query_time',
                  metric_type: 'database',
                  value_ms: executionTime,
                  table_name: tableName,
                  tenant_id: tenantId,
                  metadata: {
                    query_type: queryType,
                    has_error: !!result.error,
                    row_count: result.data?.length || result.count || 0,
                  },
                }).catch(() => {
                  // Silently fail
                })

                // Record slow query if threshold exceeded
                if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
                  recordSlowQuery({
                    query_type: queryType,
                    table_name: tableName,
                    query_text: `${queryType} on ${tableName}`,
                    execution_time_ms: executionTime,
                    threshold_ms: SLOW_QUERY_THRESHOLD_MS,
                    row_count: result.data?.length || result.count || 0,
                    error_message: result.error?.message,
                    tenant_id: tenantId,
                    metadata: {
                      query_type: queryType,
                    },
                  }).catch(() => {
                    // Silently fail
                  })
                }

                return result
              })
              .catch((error: any) => {
                const executionTime = performance.now() - startTime

                // Record failed query
                recordPerformanceMetric({
                  metric_name: 'db_query_error',
                  metric_type: 'database',
                  value_ms: executionTime,
                  table_name: tableName,
                  tenant_id: tenantId,
                  metadata: {
                    query_type: getQueryType(target),
                    error: error.message,
                  },
                }).catch(() => {
                  // Silently fail
                })

                throw error
              })
          }
        }

        // For other methods, just return the original
        return original.bind(target)
      }

      return original
    },
  })
}

/**
 * Determine query type from query builder
 */
function getQueryType(queryBuilder: any): string {
  // Try to infer from the query builder state
  // This is a best-effort approach
  if (queryBuilder._method === 'select') return 'select'
  if (queryBuilder._method === 'insert') return 'insert'
  if (queryBuilder._method === 'update') return 'update'
  if (queryBuilder._method === 'delete') return 'delete'
  if (queryBuilder._method === 'upsert') return 'upsert'

  return 'unknown'
}

/**
 * Helper to measure a specific query execution
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  tableName: string,
  tenantId?: string | null
): Promise<T> {
  const startTime = performance.now()
  const queryType = 'select' // Default, could be improved

  try {
    const result = await queryFn()
    const executionTime = performance.now() - startTime

    await recordPerformanceMetric({
      metric_name: 'db_query_time',
      metric_type: 'database',
      value_ms: executionTime,
      table_name: tableName,
      tenant_id: tenantId,
    })

    if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
      await recordSlowQuery({
        query_type: queryType,
        table_name: tableName,
        query_text: `Query on ${tableName}`,
        execution_time_ms: executionTime,
        threshold_ms: SLOW_QUERY_THRESHOLD_MS,
        tenant_id: tenantId,
      })
    }

    return result
  } catch (error: any) {
    const executionTime = performance.now() - startTime

    await recordPerformanceMetric({
      metric_name: 'db_query_error',
      metric_type: 'database',
      value_ms: executionTime,
      table_name: tableName,
      tenant_id: tenantId,
      metadata: {
        error: error.message,
      },
    })

    throw error
  }
}

