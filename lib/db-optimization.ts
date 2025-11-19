/**
 * Database query optimization utilities
 * Provides helpers for optimizing Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { withCache, generateCacheKey } from './cache'

/**
 * Optimize a query by adding select only needed fields
 */
export function optimizeSelect(fields: string[]): string {
  return fields.join(', ')
}

/**
 * Batch multiple queries to reduce round trips
 * Note: Supabase doesn't support true batching, but we can optimize by
 * combining related queries or using joins
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(queries.map(q => q()))
}

/**
 * Optimize a query with pagination
 */
export function withPagination(
  query: any,
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize
  return query.range(offset, offset + pageSize - 1)
}

/**
 * Optimize a query with caching
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  return withCache(cacheKey, queryFn, ttlSeconds)
}

/**
 * Optimize joins by selecting only needed fields
 */
export function optimizeJoin(
  table: string,
  fields: string[],
  foreignKey?: string
): string {
  const selectFields = fields.join(', ')
  if (foreignKey) {
    return `${table}:${foreignKey} (${selectFields})`
  }
  return `${table} (${selectFields})`
}

/**
 * Add indexes hint (for documentation - actual indexes should be in database)
 * Common indexes that should exist:
 * - bookings: booking_date, status, customer_id, provider_id
 * - companies: slug, status, verified, latitude, longitude
 * - reviews: company_id, rating
 * - transactions: customer_id, provider_id, created_at
 */
export const RECOMMENDED_INDEXES = {
  bookings: ['booking_date', 'status', 'customer_id', 'provider_id', 'booking_date,status'],
  companies: ['slug', 'status', 'verified', 'latitude,longitude', 'status,verified'],
  reviews: ['company_id', 'rating', 'company_id,rating'],
  transactions: ['customer_id', 'provider_id', 'created_at', 'customer_id,created_at'],
  users: ['email', 'phone'],
} as const

/**
 * Check if a query result is empty and handle appropriately
 */
export function isEmptyResult<T>(result: T[] | null | undefined): boolean {
  return !result || result.length === 0
}

/**
 * Optimize array operations by using Set for lookups
 */
export function createLookupSet<T, K>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>()
  for (const item of items) {
    map.set(keyFn(item), item)
  }
  return map
}

/**
 * Deduplicate results by a key
 */
export function deduplicate<T, K>(
  items: T[],
  keyFn: (item: T) => K
): T[] {
  const seen = new Set<K>()
  return items.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

