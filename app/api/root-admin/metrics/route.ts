import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { getAggregatedMetrics, MetricsTimeRange } from '@/lib/metrics'
import { createServerSupabase } from '@/lib/supabase'

export const GET = withAuth(
	async (request: NextRequest) => {
		try {
			const { searchParams } = new URL(request.url)
			const timeRange = (searchParams.get('timeRange') || '24h') as MetricsTimeRange
			const endpoint = searchParams.get('endpoint') || undefined
			const tenantId = searchParams.get('tenantId') || null

			// Get aggregated metrics
			const metrics = await getAggregatedMetrics(tenantId, timeRange, endpoint)

			// Get alert thresholds
			const supabase = createServerSupabase()
			let thresholdsQuery = supabase.from('api_alert_thresholds').select('*').eq('enabled', true)

			if (tenantId) {
				thresholdsQuery = thresholdsQuery.eq('tenant_id', tenantId)
			} else {
				thresholdsQuery = thresholdsQuery.is('tenant_id', null)
			}

			const { data: thresholds } = await thresholdsQuery

			// Check which metrics exceed thresholds
			const metricsWithAlerts = metrics.map((metric) => {
				const alerts: string[] = []
				const applicableThresholds = thresholds?.filter((t) => {
					if (t.endpoint && t.endpoint !== metric.endpoint) return false
					if (t.method && t.method !== metric.method) return false
					return true
				})

				for (const threshold of applicableThresholds || []) {
					if (
						threshold.max_response_time_ms &&
						metric.avgResponseTimeMs > threshold.max_response_time_ms
					) {
						alerts.push(
							`Response time (${metric.avgResponseTimeMs.toFixed(0)}ms) exceeds threshold (${threshold.max_response_time_ms}ms)`
						)
					}
					if (
						threshold.max_error_rate_percent &&
						metric.errorRate > threshold.max_error_rate_percent
					) {
						alerts.push(
							`Error rate (${metric.errorRate.toFixed(2)}%) exceeds threshold (${threshold.max_error_rate_percent}%)`
						)
					}
					if (
						threshold.min_throughput_per_minute &&
						metric.throughputPerMinute < threshold.min_throughput_per_minute
					) {
						alerts.push(
							`Throughput (${metric.throughputPerMinute.toFixed(2)}/min) below threshold (${threshold.min_throughput_per_minute}/min)`
						)
					}
				}

				return {
					...metric,
					alerts,
					hasAlerts: alerts.length > 0,
				}
			})

			return NextResponse.json({
				metrics: metricsWithAlerts,
				thresholds: thresholds || [],
				timeRange,
			})
		} catch (error) {
			console.error('[metrics] API error:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch metrics' },
				{ status: 500 }
			)
		}
	},
	{
		requireAdmin: true,
	}
)

