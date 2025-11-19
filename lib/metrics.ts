import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from './supabase'
import { resolveTenantFromRequest } from './supabase'

export type ApiMetricInput = {
	endpoint: string
	method: string
	statusCode: number
	responseTimeMs: number
	requestSizeBytes?: number
	responseSizeBytes?: number
	userId?: string | null
	errorMessage?: string | null
	metadata?: Record<string, unknown>
}

/**
 * Records an API performance metric
 * This should be called after each API request completes
 */
export async function recordApiMetric(
	request: NextRequest,
	response: NextResponse,
	metric: Omit<ApiMetricInput, 'endpoint' | 'method' | 'statusCode' | 'responseTimeMs'>
): Promise<void> {
	try {
		const startTime = request.headers.get('x-request-start-time')
		if (!startTime) {
			// Skip if we don't have timing information
			return
		}

		const responseTimeMs = Date.now() - parseInt(startTime, 10)
		const endpoint = new URL(request.url).pathname
		const method = request.method

		// Get request size from Content-Length header or estimate
		const contentLength = request.headers.get('content-length')
		const requestSizeBytes = contentLength
			? parseInt(contentLength, 10)
			: metric.requestSizeBytes || null

		// Get response size from Content-Length header
		const responseContentLength = response.headers.get('content-length')
		const responseSizeBytes = responseContentLength
			? parseInt(responseContentLength, 10)
			: metric.responseSizeBytes || null

		const tenantId = resolveTenantFromRequest(request) || null
		const userId =
			metric.userId ||
			request.headers.get('x-user-id') ||
			request.headers.get('x-userid') ||
			null

		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			request.ip ||
			null
		const userAgent = request.headers.get('user-agent') || null

		const supabase = createServerSupabase(tenantId || undefined)
		await supabase.from('api_metrics').insert({
			tenant_id: tenantId,
			endpoint,
			method,
			status_code: response.status,
			response_time_ms: responseTimeMs,
			request_size_bytes: requestSizeBytes,
			response_size_bytes: responseSizeBytes,
			user_id: userId,
			ip,
			user_agent: userAgent,
			error_message:
				response.status >= 400 ? metric.errorMessage || `HTTP ${response.status}` : null,
			metadata: metric.metadata || {},
		} as any)
	} catch (err) {
		// Do not throw; metrics recording must never break the main flow
		console.error('[metrics] failed to record API metric:', err)
	}
}

/**
 * Helper function to track metrics for an API route
 * Call this at the end of your route handler, before returning the response
 * 
 * Example:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const response = NextResponse.json({ data: '...' })
 *   await trackApiMetrics(request, response)
 *   return response
 * }
 * ```
 */
export async function trackApiMetrics(
	request: NextRequest,
	response: NextResponse,
	options?: {
		errorMessage?: string | null
		metadata?: Record<string, unknown>
	}
): Promise<void> {
	// This is a no-op if metrics tracking fails - it should never break the main flow
	await recordApiMetric(request, response, {
		errorMessage: options?.errorMessage || null,
		metadata: options?.metadata || {},
	}).catch((err) => {
		// Silently fail - metrics should never break API responses
		console.error('[metrics] Failed to track metrics:', err)
	})
}

/**
 * Get aggregated metrics for a time period
 */
export type MetricsTimeRange = '1h' | '24h' | '7d' | '30d'

export type AggregatedMetrics = {
	endpoint: string
	method: string
	requestCount: number
	errorCount: number
	errorRate: number
	avgResponseTimeMs: number
	p50ResponseTimeMs: number
	p95ResponseTimeMs: number
	p99ResponseTimeMs: number
	minResponseTimeMs: number
	maxResponseTimeMs: number
	throughputPerMinute: number
	totalRequestSizeBytes: number
	totalResponseSizeBytes: number
}

export async function getAggregatedMetrics(
	tenantId: string | null,
	timeRange: MetricsTimeRange = '24h',
	endpoint?: string
): Promise<AggregatedMetrics[]> {
	try {
		const supabase = createServerSupabase(tenantId || undefined)

		// Calculate time range
		const now = new Date()
		let startTime: Date
		switch (timeRange) {
			case '1h':
				startTime = new Date(now.getTime() - 60 * 60 * 1000)
				break
			case '24h':
				startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
				break
			case '7d':
				startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
				break
			case '30d':
				startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
				break
		}

		// Query hourly aggregates if available, otherwise fall back to raw metrics
		let query = supabase
			.from('api_metrics_hourly')
			.select('*')
			.gte('hour', startTime.toISOString())
			.order('hour', { ascending: false })

		if (tenantId) {
			query = query.eq('tenant_id', tenantId)
		} else {
			query = query.is('tenant_id', null)
		}

		if (endpoint) {
			query = query.eq('endpoint', endpoint)
		}

		const { data: hourlyData, error: hourlyError } = await query

		if (hourlyError || !hourlyData || hourlyData.length === 0) {
			// Fall back to raw metrics aggregation
			return await getRawMetricsAggregation(supabase, startTime, endpoint, tenantId)
		}

		// Aggregate hourly data by endpoint and method
		const aggregated = new Map<string, AggregatedMetrics>()

		for (const row of hourlyData) {
			const key = `${row.endpoint}:${row.method}`
			const existing = aggregated.get(key)

			if (existing) {
				existing.requestCount += row.request_count || 0
				existing.errorCount += row.error_count || 0
				existing.totalRequestSizeBytes += Number(row.total_request_size_bytes || 0)
				existing.totalResponseSizeBytes += Number(row.total_response_size_bytes || 0)
				// Recalculate averages (weighted)
				const totalRequests = existing.requestCount
				const newRequests = row.request_count || 0
				if (totalRequests > 0) {
					existing.avgResponseTimeMs =
						(existing.avgResponseTimeMs * (totalRequests - newRequests) +
							Number(row.avg_response_time_ms || 0) * newRequests) /
						totalRequests
				}
				// Use max for percentiles (approximation)
				existing.p95ResponseTimeMs = Math.max(
					existing.p95ResponseTimeMs,
					row.p95_response_time_ms || 0
				)
				existing.p99ResponseTimeMs = Math.max(
					existing.p99ResponseTimeMs,
					row.p99_response_time_ms || 0
				)
				existing.maxResponseTimeMs = Math.max(
					existing.maxResponseTimeMs,
					row.max_response_time_ms || 0
				)
				existing.minResponseTimeMs = Math.min(
					existing.minResponseTimeMs || Infinity,
					row.min_response_time_ms || Infinity
				)
			} else {
				aggregated.set(key, {
					endpoint: row.endpoint,
					method: row.method,
					requestCount: row.request_count || 0,
					errorCount: row.error_count || 0,
					errorRate: 0, // Will calculate below
					avgResponseTimeMs: Number(row.avg_response_time_ms || 0),
					p50ResponseTimeMs: row.p50_response_time_ms || 0,
					p95ResponseTimeMs: row.p95_response_time_ms || 0,
					p99ResponseTimeMs: row.p99_response_time_ms || 0,
					minResponseTimeMs: row.min_response_time_ms || Infinity,
					maxResponseTimeMs: row.max_response_time_ms || 0,
					throughputPerMinute: 0, // Will calculate below
					totalRequestSizeBytes: Number(row.total_request_size_bytes || 0),
					totalResponseSizeBytes: Number(row.total_response_size_bytes || 0),
				})
			}
		}

		// Calculate error rates and throughput
		const minutes = (now.getTime() - startTime.getTime()) / (60 * 1000)
		const results = Array.from(aggregated.values()).map((metric) => {
			metric.errorRate =
				metric.requestCount > 0 ? (metric.errorCount / metric.requestCount) * 100 : 0
			metric.throughputPerMinute =
				minutes > 0 ? metric.requestCount / minutes : metric.requestCount
			return metric
		})

		return results
	} catch (err) {
		console.error('[metrics] failed to get aggregated metrics:', err)
		return []
	}
}

async function getRawMetricsAggregation(
	supabase: any,
	startTime: Date,
	endpoint?: string,
	tenantId?: string | null
): Promise<AggregatedMetrics[]> {
	let query = supabase
		.from('api_metrics')
		.select('*')
		.gte('created_at', startTime.toISOString())

	if (tenantId) {
		query = query.eq('tenant_id', tenantId)
	} else {
		query = query.is('tenant_id', null)
	}

	if (endpoint) {
		query = query.eq('endpoint', endpoint)
	}

	const { data, error } = await query

	if (error || !data) {
		return []
	}

	// Aggregate by endpoint and method
	const aggregated = new Map<string, AggregatedMetrics>()

	for (const row of data) {
		const key = `${row.endpoint}:${row.method}`
		const existing = aggregated.get(key)

		if (existing) {
			existing.requestCount++
			if (row.status_code >= 400) {
				existing.errorCount++
			}
			existing.totalRequestSizeBytes += Number(row.request_size_bytes || 0)
			existing.totalResponseSizeBytes += Number(row.response_size_bytes || 0)
			// Recalculate average
			const total = existing.requestCount
			existing.avgResponseTimeMs =
				(existing.avgResponseTimeMs * (total - 1) + row.response_time_ms) / total
			existing.maxResponseTimeMs = Math.max(existing.maxResponseTimeMs, row.response_time_ms)
			existing.minResponseTimeMs = Math.min(
				existing.minResponseTimeMs,
				row.response_time_ms
			)
		} else {
			aggregated.set(key, {
				endpoint: row.endpoint,
				method: row.method,
				requestCount: 1,
				errorCount: row.status_code >= 400 ? 1 : 0,
				errorRate: 0,
				avgResponseTimeMs: row.response_time_ms,
				p50ResponseTimeMs: row.response_time_ms, // Approximation
				p95ResponseTimeMs: row.response_time_ms, // Approximation
				p99ResponseTimeMs: row.response_time_ms, // Approximation
				minResponseTimeMs: row.response_time_ms,
				maxResponseTimeMs: row.response_time_ms,
				throughputPerMinute: 0,
				totalRequestSizeBytes: Number(row.request_size_bytes || 0),
				totalResponseSizeBytes: Number(row.response_size_bytes || 0),
			})
		}
	}

	// Calculate error rates and throughput
	const minutes = (Date.now() - startTime.getTime()) / (60 * 1000)
	const results = Array.from(aggregated.values()).map((metric) => {
		metric.errorRate =
			metric.requestCount > 0 ? (metric.errorCount / metric.requestCount) * 100 : 0
		metric.throughputPerMinute = minutes > 0 ? metric.requestCount / minutes : metric.requestCount
		return metric
	})

	return results
}

