'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Home, Search, Users, MapPin, Calendar, Eye } from 'lucide-react'

type Agency = {
	id: string
	name: string
	email: string | null
	phone: string | null
	city: string | null
	state: string | null
	country: string | null
	workers_count: number
	placements_count: number
	created_at: string
	status: 'active' | 'inactive' | 'pending'
}

export default function AgenciesPage() {
	const [agencies, setAgencies] = useState<Agency[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')

	useEffect(() => {
		fetchAgencies()
	}, [])

	const fetchAgencies = async () => {
		setLoading(true)
		try {
			// Note: You may need to create an endpoint for agencies
			// For now, using placeholder
			setAgencies([])
		} catch (error) {
			console.error('Error fetching agencies:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredAgencies = useMemo(() => {
		let filtered = agencies

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(a) =>
					a.name.toLowerCase().includes(query) ||
					a.email?.toLowerCase().includes(query) ||
					a.city?.toLowerCase().includes(query)
			)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((a) => a.status === statusFilter)
		}

		return filtered
	}, [agencies, searchQuery, statusFilter])

	const columns: Column<Agency>[] = [
		{
			key: 'name',
			header: 'Agency',
			render: (agency) => (
				<div>
					<p className="font-medium">{agency.name}</p>
					{agency.email && <p className="text-xs text-slate-500">{agency.email}</p>}
				</div>
			),
		},
		{
			key: 'location',
			header: 'Location',
			render: (agency) =>
				[agency.city, agency.state, agency.country].filter(Boolean).join(', ') || '—',
		},
		{
			key: 'workers_count',
			header: 'Workers',
			render: (agency) => (
				<div className="flex items-center gap-1">
					<Users className="h-4 w-4 text-slate-400" />
					<span>{agency.workers_count}</span>
				</div>
			),
		},
		{
			key: 'placements_count',
			header: 'Placements',
			render: (agency) => <span>{agency.placements_count}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (agency) => (
				<Badge
					variant={
						agency.status === 'active'
							? 'default'
							: agency.status === 'pending'
							? 'secondary'
							: 'outline'
					}
				>
					{agency.status}
				</Badge>
			),
		},
		{
			key: 'created_at',
			header: 'Created',
			render: (agency) => new Date(agency.created_at).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (agency) => (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm">
						<Eye className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="NGO/Agencies"
				subtitle="Manage agencies, workers, and placements."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>NGO/Agencies</span>
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
						placeholder="Search agencies..."
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
					<option value="active">Active</option>
					<option value="pending">Pending</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>

			{/* Agencies Table */}
			<DataTable
				columns={columns}
				data={filteredAgencies}
				loading={loading}
				emptyState={
					<EmptyState
						title="No agencies found"
						subtitle="Agency management interface. Connect to your agencies API endpoint to display data."
						icon={<Home className="h-8 w-8" />}
					/>
				}
			/>
		</>
	)
}
