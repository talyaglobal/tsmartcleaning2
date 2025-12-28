'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { IdCard, Search, Plus, Edit, FileText, Users } from 'lucide-react'

type Policy = {
	id: string
	name: string
	type: 'terms' | 'privacy' | 'refund' | 'service' | 'other'
	version: string
	status: 'draft' | 'active' | 'archived'
	created_at: string
	updated_at: string
	assigned_to: number
}

export default function PoliciesPage() {
	const [policies, setPolicies] = useState<Policy[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [typeFilter, setTypeFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')

	useEffect(() => {
		fetchPolicies()
	}, [])

	const fetchPolicies = async () => {
		setLoading(true)
		try {
			// Note: You may need to create an endpoint for policies
			// For now, using placeholder
			setPolicies([])
		} catch (error) {
			console.error('Error fetching policies:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredPolicies = useMemo(() => {
		let filtered = policies

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					p.type.toLowerCase().includes(query) ||
					p.version.toLowerCase().includes(query)
			)
		}

		if (typeFilter !== 'all') {
			filtered = filtered.filter((p) => p.type === typeFilter)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((p) => p.status === statusFilter)
		}

		return filtered
	}, [policies, searchQuery, typeFilter, statusFilter])

	const columns: Column<Policy>[] = [
		{
			key: 'name',
			header: 'Policy Name',
			render: (policy) => (
				<div>
					<p className="font-medium">{policy.name}</p>
					<p className="text-xs text-slate-500">Version {policy.version}</p>
				</div>
			),
		},
		{
			key: 'type',
			header: 'Type',
			render: (policy) => (
				<Badge variant="outline">
					{policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
				</Badge>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (policy) => (
				<Badge
					variant={
						policy.status === 'active'
							? 'default'
							: policy.status === 'draft'
							? 'secondary'
							: 'outline'
					}
				>
					{policy.status}
				</Badge>
			),
		},
		{
			key: 'assigned_to',
			header: 'Assigned To',
			render: (policy) => (
				<div className="flex items-center gap-1">
					<Users className="h-4 w-4 text-slate-400" />
					<span>{policy.assigned_to} users</span>
				</div>
			),
		},
		{
			key: 'updated_at',
			header: 'Last Updated',
			render: (policy) => new Date(policy.updated_at).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (policy) => (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm">
						<Edit className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm">
						<FileText className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Policy Management"
				subtitle="Create, edit, and assign policies."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Policies</span>
					</div>
				}
				actions={
					<Button size="sm">
						<Plus className="h-4 w-4 mr-2" />
						Create Policy
					</Button>
				}
			/>

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder="Search policies..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<select
					value={typeFilter}
					onChange={(e) => setTypeFilter(e.target.value)}
					className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Types</option>
					<option value="terms">Terms</option>
					<option value="privacy">Privacy</option>
					<option value="refund">Refund</option>
					<option value="service">Service</option>
					<option value="other">Other</option>
				</select>
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Statuses</option>
					<option value="draft">Draft</option>
					<option value="active">Active</option>
					<option value="archived">Archived</option>
				</select>
			</div>

			{/* Policies Table */}
			<DataTable
				columns={columns}
				data={filteredPolicies}
				loading={loading}
				emptyState={
					<EmptyState
						title="No policies found"
						subtitle="Create your first policy to manage terms, privacy, and service agreements."
						icon={<IdCard className="h-8 w-8" />}
						actions={
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Create Policy
							</Button>
						}
					/>
				}
			/>
		</>
	)
}
