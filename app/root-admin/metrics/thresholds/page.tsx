'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/PageHeader'

type AlertThreshold = {
	id: string
	tenant_id: string | null
	endpoint: string | null
	method: string | null
	max_response_time_ms: number | null
	max_error_rate_percent: number | null
	min_throughput_per_minute: number | null
	enabled: boolean
	notification_channels: string[]
	created_at: string
	updated_at: string
}

export default function AlertThresholdsPage() {
	const [thresholds, setThresholds] = useState<AlertThreshold[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showForm, setShowForm] = useState(false)
	const [formData, setFormData] = useState({
		endpoint: '',
		method: '',
		maxResponseTimeMs: '',
		maxErrorRatePercent: '',
		minThroughputPerMinute: '',
		enabled: true,
	})

	const fetchThresholds = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await fetch('/api/root-admin/metrics/thresholds')
			if (!res.ok) {
				throw new Error('Failed to fetch thresholds')
			}
			const data = await res.json()
			setThresholds(data.thresholds || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchThresholds()
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const res = await fetch('/api/root-admin/metrics/thresholds', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tenantId: null, // System-wide
					endpoint: formData.endpoint || null,
					method: formData.method || null,
					maxResponseTimeMs: formData.maxResponseTimeMs
						? parseInt(formData.maxResponseTimeMs)
						: null,
					maxErrorRatePercent: formData.maxErrorRatePercent
						? parseFloat(formData.maxErrorRatePercent)
						: null,
					minThroughputPerMinute: formData.minThroughputPerMinute
						? parseInt(formData.minThroughputPerMinute)
						: null,
					enabled: formData.enabled,
					notificationChannels: ['email'],
				}),
			})

			if (!res.ok) {
				throw new Error('Failed to save threshold')
			}

			setShowForm(false)
			setFormData({
				endpoint: '',
				method: '',
				maxResponseTimeMs: '',
				maxErrorRatePercent: '',
				minThroughputPerMinute: '',
				enabled: true,
			})
			fetchThresholds()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save threshold')
		}
	}

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this threshold?')) {
			return
		}

		try {
			const res = await fetch(`/api/root-admin/metrics/thresholds?id=${id}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				throw new Error('Failed to delete threshold')
			}

			fetchThresholds()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete threshold')
		}
	}

	return (
		<>
			<PageHeader
				title="Alert Thresholds"
				subtitle="Configure alert thresholds for API performance metrics"
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">
							Root Admin
						</Link>
						<span className="mx-1">/</span>
						<Link href="/root-admin/metrics" className="hover:underline">
							Metrics
						</Link>
						<span className="mx-1">/</span>
						<span>Thresholds</span>
					</div>
				}
			/>

			{error && (
				<div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
			)}

			<div className="mb-4 flex justify-end">
				<button
					onClick={() => setShowForm(!showForm)}
					className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					{showForm ? 'Cancel' : '+ Add Threshold'}
				</button>
			</div>

			{showForm && (
				<form
					onSubmit={handleSubmit}
					className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
				>
					<h3 className="mb-4 text-lg font-semibold text-slate-900">New Alert Threshold</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label className="block text-sm font-medium text-slate-700">
								Endpoint (optional, leave empty for all)
							</label>
							<input
								type="text"
								value={formData.endpoint}
								onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
								placeholder="/api/bookings"
								className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700">
								Method (optional, leave empty for all)
							</label>
							<select
								value={formData.method}
								onChange={(e) => setFormData({ ...formData, method: e.target.value })}
								className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="">All Methods</option>
								<option value="GET">GET</option>
								<option value="POST">POST</option>
								<option value="PUT">PUT</option>
								<option value="PATCH">PATCH</option>
								<option value="DELETE">DELETE</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700">
								Max Response Time (ms)
							</label>
							<input
								type="number"
								value={formData.maxResponseTimeMs}
								onChange={(e) =>
									setFormData({ ...formData, maxResponseTimeMs: e.target.value })
								}
								placeholder="5000"
								className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700">
								Max Error Rate (%)
							</label>
							<input
								type="number"
								step="0.1"
								value={formData.maxErrorRatePercent}
								onChange={(e) =>
									setFormData({ ...formData, maxErrorRatePercent: e.target.value })
								}
								placeholder="5.0"
								className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700">
								Min Throughput (requests/min)
							</label>
							<input
								type="number"
								value={formData.minThroughputPerMinute}
								onChange={(e) =>
									setFormData({ ...formData, minThroughputPerMinute: e.target.value })
								}
								placeholder="10"
								className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div className="flex items-end">
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={formData.enabled}
									onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
									className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
								/>
								<span className="text-sm font-medium text-slate-700">Enabled</span>
							</label>
						</div>
					</div>
					<div className="mt-4 flex justify-end gap-2">
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
						>
							Save Threshold
						</button>
					</div>
				</form>
			)}

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
									Max Response Time
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Max Error Rate
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Min Throughput
								</th>
								<th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-700">
									Status
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 bg-white">
							{loading ? (
								<tr>
									<td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
										Loading thresholds...
									</td>
								</tr>
							) : thresholds.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
										No thresholds configured
									</td>
								</tr>
							) : (
								thresholds.map((threshold) => (
									<tr key={threshold.id}>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
											{threshold.endpoint || (
												<span className="text-slate-400">All endpoints</span>
											)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
											{threshold.method || (
												<span className="text-slate-400">All methods</span>
											)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{threshold.max_response_time_ms
												? `${threshold.max_response_time_ms}ms`
												: '-'}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{threshold.max_error_rate_percent
												? `${threshold.max_error_rate_percent}%`
												: '-'}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">
											{threshold.min_throughput_per_minute
												? `${threshold.min_throughput_per_minute}/min`
												: '-'}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-center text-sm">
											{threshold.enabled ? (
												<span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
													Enabled
												</span>
											) : (
												<span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
													Disabled
												</span>
											)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-sm">
											<button
												onClick={() => handleDelete(threshold.id)}
												className="text-red-600 hover:text-red-800"
											>
												Delete
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</>
	)
}

