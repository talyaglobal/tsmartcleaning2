'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Search, ShieldCheck, Star, Eye, Edit, BarChart3 } from 'lucide-react'

type Company = {
	id: string
	name: string
	slug: string | null
	city: string | null
	state: string | null
	country: string | null
	verified: boolean
	averageRating: number | null
	totalReviews: number
	created_at: string
	logoUrl?: string | null
	description?: string | null
}

export default function CompaniesPage() {
	const [companies, setCompanies] = useState<Company[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [verifiedFilter, setVerifiedFilter] = useState<string>('all')

	useEffect(() => {
		fetchCompanies()
	}, [])

	const fetchCompanies = async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/companies/search?limit=100', { cache: 'no-store' })
			if (res.ok) {
				const data = await res.json()
				setCompanies(data.results || [])
			}
		} catch (error) {
			console.error('Error fetching companies:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredCompanies = useMemo(() => {
		let filtered = companies

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(c) =>
					c.name.toLowerCase().includes(query) ||
					c.city?.toLowerCase().includes(query) ||
					c.state?.toLowerCase().includes(query) ||
					c.description?.toLowerCase().includes(query)
			)
		}

		if (verifiedFilter === 'verified') {
			filtered = filtered.filter((c) => c.verified)
		} else if (verifiedFilter === 'unverified') {
			filtered = filtered.filter((c) => !c.verified)
		}

		return filtered
	}, [companies, searchQuery, verifiedFilter])

	const handleVerifyCompany = async (companyId: string, verified: boolean) => {
		try {
			const res = await fetch(`/api/root-admin/companies/${companyId}/verify`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ verified }),
			})
			if (res.ok) {
				fetchCompanies()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update verification')
			}
		} catch (error) {
			console.error('Error updating company verification:', error)
			alert('Failed to update verification')
		}
	}

	const handleStatusChange = async (companyId: string, status: 'active' | 'inactive' | 'suspended') => {
		try {
			const res = await fetch(`/api/root-admin/companies/${companyId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			})
			if (res.ok) {
				fetchCompanies()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update status')
			}
		} catch (error) {
			console.error('Error updating company status:', error)
			alert('Failed to update status')
		}
	}

	const columns: Column<Company>[] = [
		{
			key: 'name',
			header: 'Company',
			render: (company) => (
				<div className="flex items-center gap-3">
					{company.logoUrl ? (
						<img
							src={company.logoUrl}
							alt={company.name}
							className="h-10 w-10 rounded-md object-cover"
						/>
					) : (
						<div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
							<Building2 className="h-5 w-5 text-slate-400" />
						</div>
					)}
					<div>
						<Link
							href={`/companies/${company.slug || company.id}`}
							className="font-medium text-blue-600 hover:underline"
						>
							{company.name}
						</Link>
						{company.verified && (
							<Badge variant="secondary" className="ml-2">
								<ShieldCheck className="h-3 w-3 mr-1" />
								Verified
							</Badge>
						)}
					</div>
				</div>
			),
		},
		{
			key: 'location',
			header: 'Location',
			render: (company) =>
				[company.city, company.state, company.country].filter(Boolean).join(', ') || '—',
		},
		{
			key: 'rating',
			header: 'Rating',
			render: (company) => (
				<div className="flex items-center gap-1">
					<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
					<span className="text-sm">
						{(company.averageRating || 0).toFixed(1)} ({company.totalReviews})
					</span>
				</div>
			),
		},
		{
			key: 'created_at',
			header: 'Created',
			render: (company) => new Date(company.created_at).toLocaleDateString(),
		},
		{
			key: 'status',
			header: 'Status',
			render: (company) => {
				const status = (company as any).status || 'active'
				return (
					<Badge
						variant={
							status === 'active'
								? 'default'
								: status === 'suspended'
								? 'destructive'
								: 'secondary'
						}
					>
						{status}
					</Badge>
				)
			},
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (company) => (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/companies/${company.slug || company.id}`}>
							<Eye className="h-4 w-4" />
						</Link>
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/api/companies/${company.id}/analytics`}>
							<BarChart3 className="h-4 w-4" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleVerifyCompany(company.id, !company.verified)}
					>
						{company.verified ? 'Unverify' : 'Verify'}
					</Button>
					<select
						value={(company as any).status || 'active'}
						onChange={(e) => handleStatusChange(company.id, e.target.value as any)}
						className="h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="suspended">Suspend</option>
					</select>
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Companies"
				subtitle="Approve, verify, and manage company profiles."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Companies</span>
					</div>
				}
				actions={
					<Button variant="outline" size="sm">
						Export
					</Button>
				}
			/>

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder="Search companies by name, location, description..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<select
					value={verifiedFilter}
					onChange={(e) => setVerifiedFilter(e.target.value)}
					className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Companies</option>
					<option value="verified">Verified Only</option>
					<option value="unverified">Unverified Only</option>
				</select>
			</div>

			{/* Companies Table */}
			<DataTable
				columns={columns}
				data={filteredCompanies}
				loading={loading}
				emptyState={
					<EmptyState
						title="No companies found"
						description="There are no companies matching your filters."
						icon={<Building2 className="h-8 w-8" />}
					/>
				}
			/>
		</>
	)
}
