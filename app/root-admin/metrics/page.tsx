'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/PageHeader'
import { MetricCard } from '@/components/admin/MetricCard'

type MetricsTimeRange = '1h' | '24h' | '7d' | '30d'

type ApiMetric = {
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
	alerts: string[]
	hasAlerts: boolean
}

type MetricsResponse = {
	metrics: ApiMetric[]
	thresholds: any[]
	timeRange: MetricsTimeRange
}

export default function MetricsDashboard() {
	const [metrics, setMetrics] = useState<ApiMetric[]>([])
	const [timeRange, setTimeRange] = useState<MetricsTimeRange>('24h')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchMetrics = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`/api/root-admin/metrics?timeRange=${timeRange}`)
			if (!res.ok) {
				throw new Error('Failed to fetch metrics')
			}
			const data: MetricsResponse = await res.json()
			setMetrics(data.metrics)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchMetrics()
		const interval = setInterval(fetchMetrics, 60000) // Refresh every minute
		return () => clearInterval(interval)
	}, [timeRange])

	// Calculate overall stats
	const overallStats = {
		totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
		totalErrors: metrics.reduce((sum, m) => sum + m.errorCount, 0),
		avgResponseTime:
			metrics.length > 0
				? metrics.reduce((sum, m) => sum + m.avgResponseTimeMs, 0) / metrics.length
				: 0,
		totalThroughput: metrics.reduce((sum, m) => sum + m.throughputPerMinute, 0),
		alertsCount: metrics.filter((m) => m.hasAlerts).length,
	}

	const formatTime = (ms: number) => {
		if (ms < 1000) return `${Math.round(ms)}ms`
		return `${(ms / 1000).toFixed(2)}s`
	}

	const formatBytes = (bytes: number) => {
		if (bytes < 1024) return `${bytes}B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
		return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
	}

	return (
		<>
			<PageHeader
				title="API Metrics Dashboard"
				subtitle="Monitor response time, error rate, and throughput for all API endpoints"
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">
							Root Admin
						</Link>
						<span className="mx-1">/</span>
						<span>Metrics</span>
					</div>
				}
			/>

			{/* Time Range Selector */}
			<div className="mb-6 flex items-center gap-4">
				<label className="text-sm font-medium text-slate-700">Time Range:</label>
				<select
					value={timeRange}
					onChange={(e) => setTimeRange(e.target.value as MetricsTimeRange)}
					className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					<option value="1h">Last Hour</option>
					<option value="24h">Last 24 Hours</option>
					<option value="7d">Last 7 Days</option>
					<option value="30d">Last 30 Days</option>
				</select>
				<button
					onClick={fetchMetrics}
					disabled={loading}
					className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			{error && (
				<div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
					{error}
				</div>
			)}

			{/* Overall Stats */}
			<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				<MetricCard
					title="Total Requests"
					value={overallStats.totalRequests.toLocaleString()}
				/>
				<MetricCard
					title="Total Errors"
					value={overallStats.totalErrors.toLocaleString()}
					change={{
						value: overallStats.totalRequests > 0
							? (overallStats.totalErrors / overallStats.totalRequests) * 100
							: 0,
						positive: false,
						label: 'Error Rate',
					}}
				/>
				<MetricCard
					title="Avg Response Time"
					value={formatTime(overallStats.avgResponseTime)}
				/>
				<MetricCard
					title="Throughput"
					value={`${overallStats.totalThroughput.toFixed(1)}/min`}
				/>
				<MetricCard
					title="Active Alerts"
					value={overallStats.alertsCount}
					className={overallStats.alertsCount > 0 ? 'border-red-300 bg-red-50' : ''}
				/>
			</div>

			{/* Metrics Table */}
			<div className="rounded-lg border border-slate-200 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-slate-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
									Endpoint
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
									Method
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Requests
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Error Rate
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Avg Response
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									P95
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									P99
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Throughput
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 bg-white">
							{loading ? (
								<tr>
									<td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
										Loading metrics...
									</td>
								</tr>
							) : metrics.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
										No metrics available for the selected time range
									</td>
								</tr>
							) : (
								metrics.map((metric, idx) => (
									<tr
										key={`${metric.endpoint}-${metric.method}-${idx}`}
										className={metric.hasAlerts ? 'bg-red-50' : ''}
									>
										<td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
											{metric.endpoint}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
											<span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
												{metric.method}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{metric.requestCount.toLocaleString()}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
											<span
												className={
													metric.errorRate > 5
														? 'font-medium text-red-600'
														: metric.errorRate > 1
															? 'text-orange-600'
															: 'text-slate-600'
												}
											>
												{metric.errorRate.toFixed(2)}%
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{formatTime(metric.avgResponseTimeMs)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{formatTime(metric.p95ResponseTimeMs)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{formatTime(metric.p99ResponseTimeMs)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{metric.throughputPerMinute.toFixed(1)}/min
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-sm">
											{metric.hasAlerts ? (
												<div className="flex flex-col gap-1">
													<span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
														Alert
													</span>
													{metric.alerts.length > 0 && (
														<div className="mt-1 text-xs text-red-600">
															{metric.alerts[0]}
															{metric.alerts.length > 1 && ` (+${metric.alerts.length - 1} more)`}
														</div>
													)}
												</div>
											) : (
												<span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
													Healthy
												</span>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Alert Thresholds Section */}
			<div className="mt-6">
				<Link
					href="/root-admin/metrics/thresholds"
					className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
				>
					Configure Alert Thresholds →
				</Link>
			</div>
		</>
	)
}

