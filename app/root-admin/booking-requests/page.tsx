'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ClipboardList, Search, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'

type BookingRequest = {
	id: string
	customer_name: string
	customer_email: string
	service_type: string
	requested_date: string
	created_at: string
	response_time_hours: number | null
	sla_met: boolean | null
	status: 'pending' | 'responded' | 'converted' | 'expired'
	converted: boolean
}

export default function BookingRequestsPage() {
	const [requests, setRequests] = useState<BookingRequest[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [slaFilter, setSlaFilter] = useState<string>('all')

	useEffect(() => {
		fetchRequests()
	}, [statusFilter, slaFilter])

	const fetchRequests = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (statusFilter !== 'all') {
				params.append('status', statusFilter)
			}
			if (slaFilter !== 'all') {
				params.append('slaFilter', slaFilter)
			}
			const res = await fetch(`/api/root-admin/booking-requests?${params.toString()}`)
			if (res.ok) {
				const data = await res.json()
				setRequests(data.requests || [])
			} else {
				console.error('Failed to fetch booking requests')
				setRequests([])
			}
		} catch (error) {
			console.error('Error fetching booking requests:', error)
			setRequests([])
		} finally {
			setLoading(false)
		}
	}

	const filteredRequests = useMemo(() => {
		let filtered = requests

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(r) =>
					r.customer_name.toLowerCase().includes(query) ||
					r.customer_email.toLowerCase().includes(query) ||
					r.service_type.toLowerCase().includes(query)
			)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((r) => r.status === statusFilter)
		}

		if (slaFilter === 'met') {
			filtered = filtered.filter((r) => r.sla_met === true)
		} else if (slaFilter === 'missed') {
			filtered = filtered.filter((r) => r.sla_met === false)
		}

		return filtered
	}, [requests, searchQuery, statusFilter, slaFilter])

	const slaStats = useMemo(() => {
		const total = requests.length
		const met = requests.filter((r) => r.sla_met === true).length
		const missed = requests.filter((r) => r.sla_met === false).length
		const avgResponseTime =
			requests
				.filter((r) => r.response_time_hours !== null)
				.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) /
			requests.filter((r) => r.response_time_hours !== null).length

		return { total, met, missed, avgResponseTime: avgResponseTime || 0 }
	}, [requests])

	const columns: Column<BookingRequest>[] = [
		{
			key: 'customer_name',
			header: 'Customer',
			render: (req) => (
				<div>
					<p className="font-medium">{req.customer_name}</p>
					<p className="text-xs text-slate-500">{req.customer_email}</p>
				</div>
			),
		},
		{
			key: 'service_type',
			header: 'Service',
		},
		{
			key: 'requested_date',
			header: 'Requested Date',
			render: (req) => new Date(req.requested_date).toLocaleDateString(),
		},
		{
			key: 'created_at',
			header: 'Requested',
			render: (req) => new Date(req.created_at).toLocaleDateString(),
		},
		{
			key: 'response_time_hours',
			header: 'Response Time',
			render: (req) =>
				req.response_time_hours !== null ? (
					<div className="flex items-center gap-1">
						<Clock className="h-4 w-4 text-slate-400" />
						<span>{req.response_time_hours.toFixed(1)}h</span>
					</div>
				) : (
					<span className="text-slate-400">—</span>
				),
		},
		{
			key: 'sla_met',
			header: 'SLA',
			render: (req) =>
				req.sla_met === true ? (
					<Badge variant="default" className="bg-green-100 text-green-700">
						<CheckCircle className="h-3 w-3 mr-1" />
						Met
					</Badge>
				) : req.sla_met === false ? (
					<Badge variant="destructive">
						<XCircle className="h-3 w-3 mr-1" />
						Missed
					</Badge>
				) : (
					<span className="text-slate-400">—</span>
				),
		},
		{
			key: 'status',
			header: 'Status',
			render: (req) => (
				<Badge
					variant={
						req.status === 'converted'
							? 'default'
							: req.status === 'responded'
							? 'secondary'
							: 'outline'
					}
				>
					{req.status}
				</Badge>
			),
		},
		{
			key: 'converted',
			header: 'Converted',
			render: (req) => (req.converted ? <CheckCircle className="h-4 w-4 text-green-500" /> : <span className="text-slate-400">—</span>),
		},
	]

	return (
		<>
			<PageHeader
				title="Booking Requests"
				subtitle="SLA tracking, escalation, and conversion analytics."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Booking Requests</span>
					</div>
				}
				actions={
					<Button variant="outline" size="sm">
						Export
					</Button>
				}
			/>

			{/* SLA Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded-lg border border-slate-200 p-4">
					<p className="text-sm text-slate-600 mb-1">Total Requests</p>
					<p className="text-2xl font-semibold">{slaStats.total}</p>
				</div>
				<div className="bg-white rounded-lg border border-slate-200 p-4">
					<p className="text-sm text-slate-600 mb-1">SLA Met</p>
					<p className="text-2xl font-semibold text-green-600">{slaStats.met}</p>
				</div>
				<div className="bg-white rounded-lg border border-slate-200 p-4">
					<p className="text-sm text-slate-600 mb-1">SLA Missed</p>
					<p className="text-2xl font-semibold text-red-600">{slaStats.missed}</p>
				</div>
				<div className="bg-white rounded-lg border border-slate-200 p-4">
					<p className="text-sm text-slate-600 mb-1">Avg Response Time</p>
					<p className="text-2xl font-semibold">{slaStats.avgResponseTime.toFixed(1)}h</p>
				</div>
			</div>

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder="Search by customer name, email, service..."
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
					<option value="pending">Pending</option>
					<option value="responded">Responded</option>
					<option value="converted">Converted</option>
					<option value="expired">Expired</option>
				</select>
				<select
					value={slaFilter}
					onChange={(e) => setSlaFilter(e.target.value)}
					className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All SLA</option>
					<option value="met">SLA Met</option>
					<option value="missed">SLA Missed</option>
				</select>
			</div>

			{/* Requests Table */}
			<DataTable
				columns={columns}
				data={filteredRequests}
				loading={loading}
				emptyState={
					<EmptyState
						title="No booking requests found"
						subtitle="Booking request SLA tracking interface. Connect to your booking requests API endpoint to display data."
						icon={<ClipboardList className="h-8 w-8" />}
					/>
				}
			/>
		</>
	)
}
