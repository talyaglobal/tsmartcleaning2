'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileCheck2, Search, Filter, Download, Eye, DollarSign, Calendar, AlertCircle } from 'lucide-react'

type Claim = {
	id: string
	claim_code: string
	status: 'filed' | 'under_review' | 'adjuster_assigned' | 'approved' | 'denied' | 'paid'
	incident_type: string
	incident_date: string
	amount_claimed: number | null
	description: string
	created_at: string
	updated_at: string
	user_id: string
	policy_id: string
	insurance_policies?: {
		policy_number: string
	}
	insurance_claim_documents?: Array<{
		id: string
		file_url: string
		file_name: string
		document_type: string
	}>
}

const statusColors: Record<Claim['status'], string> = {
	filed: 'bg-slate-100 text-slate-700',
	under_review: 'bg-blue-100 text-blue-700',
	adjuster_assigned: 'bg-purple-100 text-purple-700',
	approved: 'bg-green-100 text-green-700',
	denied: 'bg-red-100 text-red-700',
	paid: 'bg-emerald-100 text-emerald-700',
}

const statusLabels: Record<Claim['status'], string> = {
	filed: 'Filed',
	under_review: 'Under Review',
	adjuster_assigned: 'Adjuster Assigned',
	approved: 'Approved',
	denied: 'Denied',
	paid: 'Paid',
}

export default function ClaimsPage() {
	const [claims, setClaims] = useState<Claim[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

	useEffect(() => {
		fetchClaims()
	}, [])

	const fetchClaims = async () => {
		setLoading(true)
		try {
			// Note: This endpoint currently requires user_id, but for root admin we need all claims
			// You may need to create a new endpoint like /api/root-admin/claims
			const res = await fetch('/api/insurance/claims?user_id=all', { cache: 'no-store' })
			if (res.ok) {
				const data = await res.json()
				setClaims(data.claims || [])
			}
		} catch (error) {
			console.error('Error fetching claims:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredClaims = useMemo(() => {
		let filtered = claims

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(c) =>
					c.claim_code.toLowerCase().includes(query) ||
					c.incident_type.toLowerCase().includes(query) ||
					c.description.toLowerCase().includes(query) ||
					c.insurance_policies?.policy_number?.toLowerCase().includes(query)
			)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((c) => c.status === statusFilter)
		}

		return filtered
	}, [claims, searchQuery, statusFilter])

	const updateClaimStatus = async (claimId: string, newStatus: Claim['status']) => {
		try {
			const res = await fetch(`/api/insurance/claims/${claimId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			})
			if (res.ok) {
				fetchClaims()
				setSelectedClaim(null)
			}
		} catch (error) {
			console.error('Error updating claim status:', error)
		}
	}

	const columns: Column<Claim>[] = [
		{
			key: 'claim_code',
			header: 'Claim Code',
			render: (claim) => (
				<Link
					href={`/insurance/claims/${claim.claim_code}`}
					className="font-mono text-sm font-medium text-blue-600 hover:underline"
				>
					{claim.claim_code}
				</Link>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (claim) => (
				<Badge className={statusColors[claim.status]}>
					{statusLabels[claim.status]}
				</Badge>
			),
		},
		{
			key: 'incident_type',
			header: 'Incident Type',
		},
		{
			key: 'incident_date',
			header: 'Incident Date',
			render: (claim) => new Date(claim.incident_date).toLocaleDateString(),
		},
		{
			key: 'amount_claimed',
			header: 'Amount',
			render: (claim) =>
				claim.amount_claimed ? (
					<span className="font-medium">${claim.amount_claimed.toLocaleString()}</span>
				) : (
					<span className="text-slate-400">—</span>
				),
		},
		{
			key: 'insurance_policies',
			header: 'Policy',
			render: (claim) => claim.insurance_policies?.policy_number || '—',
		},
		{
			key: 'created_at',
			header: 'Filed',
			render: (claim) => new Date(claim.created_at).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (claim) => (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSelectedClaim(claim)}
					>
						<Eye className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Claims"
				subtitle="Triage, review, approve/deny, and payout."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Claims</span>
					</div>
				}
				actions={
					<Button variant="outline" size="sm">
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				}
			/>

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder="Search by claim code, incident type, policy..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Statuses</option>
					<option value="filed">Filed</option>
					<option value="under_review">Under Review</option>
					<option value="adjuster_assigned">Adjuster Assigned</option>
					<option value="approved">Approved</option>
					<option value="denied">Denied</option>
					<option value="paid">Paid</option>
				</select>
			</div>

			{/* Claims Table */}
			<DataTable
				columns={columns}
				data={filteredClaims}
				loading={loading}
				emptyState={
					<EmptyState
						title="No claims found"
						description="There are no insurance claims matching your filters."
						icon={<FileCheck2 className="h-8 w-8" />}
					/>
				}
			/>

			{/* Claim Detail Modal */}
			{selectedClaim && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
						<div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold">Claim Details</h2>
								<p className="text-sm text-slate-500">{selectedClaim.claim_code}</p>
							</div>
							<Button variant="ghost" size="sm" onClick={() => setSelectedClaim(null)}>
								×
							</Button>
						</div>

						<div className="p-6 space-y-6">
							{/* Status Section */}
							<div>
								<h3 className="text-sm font-medium text-slate-700 mb-3">Status</h3>
								<div className="flex items-center gap-3">
									<Badge className={statusColors[selectedClaim.status]}>
										{statusLabels[selectedClaim.status]}
									</Badge>
									{selectedClaim.status !== 'paid' && selectedClaim.status !== 'denied' && (
										<select
											value={selectedClaim.status}
											onChange={(e) =>
												updateClaimStatus(selectedClaim.id, e.target.value as Claim['status'])
											}
											className="h-8 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
										>
											<option value="filed">Filed</option>
											<option value="under_review">Under Review</option>
											<option value="adjuster_assigned">Adjuster Assigned</option>
											<option value="approved">Approved</option>
											<option value="denied">Denied</option>
											<option value="paid">Paid</option>
										</select>
									)}
								</div>
							</div>

							{/* Claim Information */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs text-slate-500">Incident Type</label>
									<p className="text-sm font-medium">{selectedClaim.incident_type}</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Incident Date</label>
									<p className="text-sm font-medium">
										{new Date(selectedClaim.incident_date).toLocaleDateString()}
									</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Amount Claimed</label>
									<p className="text-sm font-medium">
										{selectedClaim.amount_claimed
											? `$${selectedClaim.amount_claimed.toLocaleString()}`
											: '—'}
									</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Policy Number</label>
									<p className="text-sm font-medium">
										{selectedClaim.insurance_policies?.policy_number || '—'}
									</p>
								</div>
							</div>

							{/* Description */}
							<div>
								<label className="text-xs text-slate-500">Description</label>
								<p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
									{selectedClaim.description}
								</p>
							</div>

							{/* Documents */}
							<div>
								<h3 className="text-sm font-medium text-slate-700 mb-3">Documents</h3>
								{selectedClaim.insurance_claim_documents &&
								selectedClaim.insurance_claim_documents.length > 0 ? (
									<div className="space-y-2">
										{selectedClaim.insurance_claim_documents.map((doc) => (
											<div
												key={doc.id}
												className="flex items-center justify-between p-3 border border-slate-200 rounded-md"
											>
												<div className="flex items-center gap-3">
													<FileCheck2 className="h-5 w-5 text-slate-400" />
													<div>
														<p className="text-sm font-medium">{doc.file_name}</p>
														<p className="text-xs text-slate-500">{doc.document_type}</p>
													</div>
												</div>
												<Button variant="outline" size="sm" asChild>
													<a href={doc.file_url} target="_blank" rel="noreferrer">
														View
													</a>
												</Button>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-500">No documents uploaded</p>
								)}
							</div>

							{/* Actions */}
							{selectedClaim.status === 'approved' && (
								<div className="pt-4 border-t border-slate-200">
									<Button
										onClick={() => updateClaimStatus(selectedClaim.id, 'paid')}
										className="w-full"
									>
										<DollarSign className="h-4 w-4 mr-2" />
										Process Payout
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
