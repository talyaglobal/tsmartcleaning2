"use client"
import Link from 'next/link'
import { PageHeader } from '@/components/admin/PageHeader'
import React from 'react'

type CompanyOption = { id: string; name: string | null; slug?: string | null }

export default function Page() {
	const [companies, setCompanies] = React.useState<CompanyOption[]>([])
	const [loading, setLoading] = React.useState<boolean>(true)
	const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>('')
	const [generating, setGenerating] = React.useState<boolean>(false)
	const [reportUrl, setReportUrl] = React.useState<string>('')
	const [error, setError] = React.useState<string>('')

	React.useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const res = await fetch('/api/companies/search?limit=50&sort=featured', { cache: 'no-store' })
				if (!res.ok) throw new Error(`Failed to load companies: ${res.status}`)
				const json = await res.json()
				const opts: CompanyOption[] = (json.results || []).map((c: any) => ({
					id: c.id,
					name: c.name,
					slug: c.slug,
				}))
				if (mounted) {
					setCompanies(opts)
					if (opts.length > 0) setSelectedCompanyId(opts[0].id)
				}
			} catch (e: any) {
				if (mounted) setError(e?.message || 'Failed to load companies')
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	async function handleGenerate() {
		setError('')
		setReportUrl('')
		if (!selectedCompanyId) {
			setError('Please select a company')
			return
		}
		setGenerating(true)
		try {
			const res = await fetch('/api/reports/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ companyId: selectedCompanyId, period: 'last_30_days' }),
			})
			const json = await res.json()
			if (!res.ok) {
				throw new Error(json?.error || 'Failed to generate report')
			}
			setReportUrl(json.reportUrl || '')
		} catch (e: any) {
			setError(e?.message || 'Failed to generate report')
		} finally {
			setGenerating(false)
		}
	}

	return (
		<>
			<PageHeader
				title="Reports"
				subtitle="KPI dashboards and data exports."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Reports</span>
					</div>
				}
			/>
			<div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
				<p className="mb-3 text-sm text-slate-700">Generate a property performance PDF for a company.</p>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<label className="text-sm text-slate-700" htmlFor="company">Company</label>
					<select
						id="company"
						className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
						disabled={loading}
						value={selectedCompanyId}
						onChange={(e) => setSelectedCompanyId(e.target.value)}
					>
						{loading ? <option>Loading...</option> : null}
						{!loading && companies.length === 0 ? <option>No companies found</option> : null}
						{companies.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name || c.slug || c.id}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={handleGenerate}
						disabled={generating || loading || !selectedCompanyId}
						className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{generating ? 'Generating...' : 'Generate (Last 30 Days)'}
					</button>
				</div>
				{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
				{reportUrl ? (
					<p className="mt-3 text-sm">
						Report ready:{' '}
						<a href={reportUrl} target="_blank" rel="noreferrer" className="text-slate-900 underline">
							Download PDF
						</a>
					</p>
				) : null}
			</div>
		</>
	)
}


