"use client"

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type StatementItem = {
	jobId: string
	date: string
	totalCents: number
	providerCents: number
	platformFeeCents: number
	processingFeeCents: number
	stripeTransferId?: string
}

type StatementResponse = {
	scope: { providerId?: string; companyId?: string }
	period: { start: string; end: string }
	items: StatementItem[]
	summary: {
		count: number
		totalGrossCents: number
		totalProviderCents: number
		totalPlatformFeeCents: number
		totalProcessingFeeCents: number
	}
}

export default function AdminPayoutsPage() {
	const [providerId, setProviderId] = useState<string>('')
	const [companyId, setCompanyId] = useState<string>('')
	const [start, setStart] = useState<string>(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
	const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10))
	const [loading, setLoading] = useState<boolean>(false)
	const [processing, setProcessing] = useState<boolean>(false)
	const [data, setData] = useState<StatementResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function loadStatement() {
		setLoading(true)
		setError(null)
		try {
			const params = new URLSearchParams()
			if (providerId) params.set('providerId', providerId)
			if (companyId) params.set('companyId', companyId)
			if (start) params.set('start', start)
			if (end) params.set('end', end)
			const res = await fetch(`/api/payouts/statements?${params.toString()}`, { cache: 'no-store' })
			if (!res.ok) {
				throw new Error(`Failed to load statement: ${res.status}`)
			}
			const json = await res.json()
			setData(json)
		} catch (err: any) {
			console.error('Error loading statement:', err)
			setError(err?.message || 'Failed to load payout statement. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadStatement()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	async function processPayouts() {
		setProcessing(true)
		try {
			const res = await fetch('/api/payouts/process', { method: 'POST' })
			if (!res.ok) {
				console.error('Failed to process payouts')
			}
			// refresh statement after processing
			await loadStatement()
		} finally {
			setProcessing(false)
		}
	}

	return (
		<div className="space-y-6">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<PageHeader
				title="Payouts"
				subtitle="Provider payouts, statements, and settlements."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Payouts</span>
					</div>
				}
			/>

			<Card className="p-4 space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<Label htmlFor="providerId">Provider ID</Label>
						<Input id="providerId" placeholder="optional" value={providerId} onChange={(e) => setProviderId(e.target.value)} />
					</div>
					<div>
						<Label htmlFor="companyId">Company ID</Label>
						<Input id="companyId" placeholder="optional" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
					</div>
					<div>
						<Label htmlFor="start">Start</Label>
						<Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
					</div>
					<div>
						<Label htmlFor="end">End</Label>
						<Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
					</div>
				</div>
				<div className="flex gap-2">
					<Button onClick={loadStatement} disabled={loading}>
						{loading ? 'Loading...' : 'Load Statement'}
					</Button>
					<Button variant="secondary" asChild>
						<a
							href={`/api/payouts/statements?${new URLSearchParams({
								providerId,
								companyId,
								start,
								end,
								format: 'csv',
							}).toString()}`}
							download
						>
							Download CSV
						</a>
					</Button>
					<Button variant="secondary" asChild>
						<a
							href={`/api/payouts/statements?${new URLSearchParams({
								providerId,
								companyId,
								start,
								end,
								format: 'pdf',
							}).toString()}`}
							download
						>
							Download PDF
						</a>
					</Button>
					<div className="flex-1" />
					<Button onClick={processPayouts} disabled={processing}>
						{processing ? 'Processing...' : 'Process Payouts'}
					</Button>
				</div>
			</Card>

			<Card className="p-4">
				<h2 className="text-lg font-medium mb-2">Summary</h2>
				{!data ? (
					<p className="text-sm text-slate-500">No data loaded.</p>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						<div>
							<div className="text-xs text-slate-500">Jobs</div>
							<div className="text-xl font-semibold">{data.summary.count}</div>
						</div>
						<div>
							<div className="text-xs text-slate-500">Gross</div>
							<div className="text-xl font-semibold">${(data.summary.totalGrossCents / 100).toFixed(2)}</div>
						</div>
						<div>
							<div className="text-xs text-slate-500">Provider</div>
							<div className="text-xl font-semibold">${(data.summary.totalProviderCents / 100).toFixed(2)}</div>
						</div>
						<div>
							<div className="text-xs text-slate-500">Platform Fee</div>
							<div className="text-xl font-semibold">${(data.summary.totalPlatformFeeCents / 100).toFixed(2)}</div>
						</div>
						<div>
							<div className="text-xs text-slate-500">Processing Fee</div>
							<div className="text-xl font-semibold">${(data.summary.totalProcessingFeeCents / 100).toFixed(2)}</div>
						</div>
					</div>
				)}
			</Card>

			<Card className="p-0 overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="bg-slate-50 text-left text-slate-600">
							<th className="px-4 py-2">Job ID</th>
							<th className="px-4 py-2">Date</th>
							<th className="px-4 py-2 text-right">Gross</th>
							<th className="px-4 py-2 text-right">Provider</th>
							<th className="px-4 py-2 text-right">Platform Fee</th>
							<th className="px-4 py-2 text-right">Processing Fee</th>
							<th className="px-4 py-2">Stripe Transfer</th>
						</tr>
					</thead>
					<tbody>
						{(data?.items ?? []).map((it) => (
							<tr key={it.jobId} className="border-t">
								<td className="px-4 py-2">{it.jobId}</td>
								<td className="px-4 py-2">{new Date(it.date).toLocaleString()}</td>
								<td className="px-4 py-2 text-right">${(it.totalCents / 100).toFixed(2)}</td>
								<td className="px-4 py-2 text-right">${(it.providerCents / 100).toFixed(2)}</td>
								<td className="px-4 py-2 text-right">${(it.platformFeeCents / 100).toFixed(2)}</td>
								<td className="px-4 py-2 text-right">${(it.processingFeeCents / 100).toFixed(2)}</td>
								<td className="px-4 py-2">{it.stripeTransferId ?? '-'}</td>
							</tr>
						))}
						{(data?.items?.length ?? 0) === 0 && (
							<tr>
								<td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
									No items in range.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</Card>
		</div>
	)
}


