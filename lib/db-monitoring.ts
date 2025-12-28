/**
 * Database monitoring utilities for Supabase
 * Tracks query performance, connection pool metrics, and database health
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabase } from './supabase'

export interface QueryMetrics {
	query: string
	duration: number
	timestamp: Date
	success: boolean
	error?: string
	table?: string
	tenantId?: string | null
}

export interface ConnectionPoolMetrics {
	activeConnections: number
	idleConnections: number
	totalConnections: number
	maxConnections: number
	waitingQueries: number
}

export interface DatabaseHealthMetrics {
	status: 'healthy' | 'degraded' | 'unhealthy'
	responseTime: number
	lastCheck: Date
	errorRate: number
	slowQueries: number
	connectionPoolStatus: 'ok' | 'warning' | 'critical'
}

// In-memory store for query metrics (in production, use a proper metrics store)
const queryMetrics: QueryMetrics[] = []
const MAX_METRICS_STORAGE = 1000 // Keep last 1000 queries

/**
 * Wraps a Supabase query to track performance metrics
 */
export async function withQueryMonitoring<T>(
	queryFn: () => Promise<{ data: T | null; error: any }>,
	options: {
		queryName?: string
		table?: string
		tenantId?: string | null
	} = {}
): Promise<{ data: T | null; error: any; metrics?: QueryMetrics }> {
	const startTime = performance.now()
	const { queryName, table, tenantId } = options

	try {
		const result = await queryFn()
		const duration = performance.now() - startTime

		const metrics: QueryMetrics = {
			query: queryName || 'unknown',
			duration,
			timestamp: new Date(),
			success: !result.error,
			error: result.error?.message,
			table,
			tenantId,
		}

		// Store metrics
		queryMetrics.push(metrics)
		if (queryMetrics.length > MAX_METRICS_STORAGE) {
			queryMetrics.shift() // Remove oldest
		}

		// Log slow queries (> 1 second)
		if (duration > 1000) {
			console.warn(`[DB Monitoring] Slow query detected:`, {
				query: queryName,
				duration: `${duration.toFixed(2)}ms`,
				table,
				error: result.error?.message,
			})
		}

		// Log errors
		if (result.error) {
			console.error(`[DB Monitoring] Query error:`, {
				query: queryName,
				error: result.error.message,
				table,
			})
		}

		return { ...result, metrics }
	} catch (error: any) {
		const duration = performance.now() - startTime
		const metrics: QueryMetrics = {
			query: queryName || 'unknown',
			duration,
			timestamp: new Date(),
			success: false,
			error: error?.message || 'Unknown error',
			table,
			tenantId,
		}

		queryMetrics.push(metrics)
		if (queryMetrics.length > MAX_METRICS_STORAGE) {
			queryMetrics.shift()
		}

		console.error(`[DB Monitoring] Query exception:`, {
			query: queryName,
			error: error?.message,
			table,
		})

		return { data: null, error, metrics }
	}
}

/**
 * Get query performance statistics
 */
export function getQueryStats(timeWindowMinutes: number = 60): {
	totalQueries: number
	successfulQueries: number
	failedQueries: number
	averageDuration: number
	slowQueries: number
	errorRate: number
	queriesByTable: Record<string, number>
} {
	const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
	const recentMetrics = queryMetrics.filter((m) => m.timestamp >= cutoff)

	const totalQueries = recentMetrics.length
	const successfulQueries = recentMetrics.filter((m) => m.success).length
	const failedQueries = totalQueries - successfulQueries
	const averageDuration =
		recentMetrics.length > 0
			? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
			: 0
	const slowQueries = recentMetrics.filter((m) => m.duration > 1000).length
	const errorRate = totalQueries > 0 ? (failedQueries / totalQueries) * 100 : 0

	const queriesByTable: Record<string, number> = {}
	recentMetrics.forEach((m) => {
		if (m.table) {
			queriesByTable[m.table] = (queriesByTable[m.table] || 0) + 1
		}
	})

	return {
		totalQueries,
		successfulQueries,
		failedQueries,
		averageDuration: Math.round(averageDuration * 100) / 100,
		slowQueries,
		errorRate: Math.round(errorRate * 100) / 100,
		queriesByTable,
	}
}

/**
 * Get slow queries (queries taking longer than threshold)
 */
export function getSlowQueries(
	thresholdMs: number = 1000,
	limit: number = 50
): QueryMetrics[] {
	return queryMetrics
		.filter((m) => m.duration > thresholdMs)
		.sort((a, b) => b.duration - a.duration)
		.slice(0, limit)
}

/**
 * Get failed queries
 */
export function getFailedQueries(limit: number = 50): QueryMetrics[] {
	return queryMetrics
		.filter((m) => !m.success)
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
		.slice(0, limit)
}

/**
 * Check database health by running a simple query
 */
export async function checkDatabaseHealth(
	tenantId?: string | null
): Promise<DatabaseHealthMetrics> {
	const startTime = performance.now()
	const supabase = createServerSupabase(tenantId)

	try {
		// Simple health check query
		const { error } = await supabase.from('services').select('id').limit(1)

		const responseTime = performance.now() - startTime

		// Get recent stats
		const stats = getQueryStats(5) // Last 5 minutes

		// Determine status
		let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
		if (error || responseTime > 5000 || stats.errorRate > 10) {
			status = 'unhealthy'
		} else if (responseTime > 2000 || stats.errorRate > 5) {
			status = 'degraded'
		}

		// Connection pool status (estimated based on metrics)
		let connectionPoolStatus: 'ok' | 'warning' | 'critical' = 'ok'
		if (stats.slowQueries > 10 || stats.errorRate > 5) {
			connectionPoolStatus = 'warning'
		}
		if (stats.slowQueries > 50 || stats.errorRate > 20) {
			connectionPoolStatus = 'critical'
		}

		return {
			status,
			responseTime: Math.round(responseTime * 100) / 100,
			lastCheck: new Date(),
			errorRate: stats.errorRate,
			slowQueries: stats.slowQueries,
			connectionPoolStatus,
		}
	} catch (error: any) {
		const responseTime = performance.now() - startTime
		return {
			status: 'unhealthy',
			responseTime: Math.round(responseTime * 100) / 100,
			lastCheck: new Date(),
			errorRate: 100,
			slowQueries: 0,
			connectionPoolStatus: 'critical',
		}
	}
}

/**
 * Get connection pool metrics (estimated from query patterns)
 * Note: Supabase manages connection pooling internally, so we estimate based on query metrics
 */
export function getConnectionPoolMetrics(): ConnectionPoolMetrics {
	const stats = getQueryStats(5) // Last 5 minutes

	// Estimate based on query patterns
	// This is a simplified estimation - actual pool metrics would come from Supabase dashboard
	const activeConnections = Math.min(stats.totalQueries / 10, 50) // Estimate
	const idleConnections = Math.max(0, 100 - activeConnections)
	const totalConnections = activeConnections + idleConnections
	const maxConnections = 100 // Supabase default
	const waitingQueries = stats.slowQueries > 10 ? stats.slowQueries : 0

	return {
		activeConnections: Math.round(activeConnections),
		idleConnections: Math.round(idleConnections),
		totalConnections: Math.round(totalConnections),
		maxConnections,
		waitingQueries,
	}
}

/**
 * Clear old metrics (keep only recent ones)
 */
export function clearOldMetrics(keepMinutes: number = 60): void {
	const cutoff = new Date(Date.now() - keepMinutes * 60 * 1000)
	const index = queryMetrics.findIndex((m) => m.timestamp >= cutoff)
	if (index > 0) {
		queryMetrics.splice(0, index)
	}
}

/**
 * Get all metrics for export/analysis
 */
export function getAllMetrics(): QueryMetrics[] {
	return [...queryMetrics]
}



