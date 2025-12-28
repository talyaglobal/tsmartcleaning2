'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column } from '@/components/admin/DataTable'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { History, Calendar, Search, Filter, Download } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

type Job = {
	id: string
	customerName: string
	address: string
	service: string
	date: string
	time: string
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
	assignedTo?: string
	duration: number
	amount: number
	completedAt?: string
}

export default function AmbassadorJobHistoryPage() {
	const { user } = useAuth()
	const [jobs, setJobs] = useState<Job[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [dateRange, setDateRange] = useState('30')

	useEffect(() => {
		if (user?.id) {
			fetchJobHistory()
		}
	}, [user?.id, statusFilter, dateRange])

	const fetchJobHistory = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const endDate = new Date()
			const startDate = new Date()
			startDate.setDate(startDate.getDate() - parseInt(dateRange))
			
			const response = await fetch(
				`/api/ambassador/jobs?ambassadorId=${user.id}&status=${statusFilter === 'all' ? '' : statusFilter}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
			)
			const data = await response.json()
			if (data.jobs) {
				setJobs(data.jobs.map((j: any) => ({
					id: j.id,
					customerName: j.customer_name || j.customer?.full_name || 'N/A',
					address: j.address || `${j.street_address}, ${j.city}, ${j.state}`,
					service: j.service_name || j.service?.name || 'N/A',
					date: j.booking_date || j.date,
					time: j.booking_time || j.time,
					status: j.status === 'in-progress' ? 'in_progress' : j.status,
					assignedTo: j.assigned_to,
					duration: j.duration_hours || j.duration || 0,
					amount: j.total_amount || j.amount || 0,
					completedAt: j.completed_at,
				})))
			}
		} catch (error) {
			console.error('Error fetching job history:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredJobs = jobs.filter(job =>
		job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		job.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
		job.service.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const getStatusBadge = (status: string) => {
		const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
			scheduled: 'default',
			in_progress: 'secondary',
			completed: 'default',
			cancelled: 'destructive',
		}
		return (
			<Badge variant={variants[status] || 'outline'}>
				{status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		)
	}

	const columns: Column<Job>[] = [
		{ key: 'date', header: 'Date' },
		{ key: 'customerName', header: 'Customer' },
		{ key: 'address', header: 'Address' },
		{ key: 'service', header: 'Service' },
		{ key: 'duration', header: 'Duration (hrs)' },
		{ 
			key: 'amount', 
			header: 'Amount',
			render: (job) => `$${job.amount.toFixed(2)}`
		},
		{ 
			key: 'status', 
			header: 'Status',
			render: (job) => getStatusBadge(job.status)
		},
	]

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Job History"
				subtitle="View past and completed jobs"
				actions={
					<Button variant="outline">
						<Download className="h-4 w-4 mr-2" />
						Export
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search jobs..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
								<SelectItem value="scheduled">Scheduled</SelectItem>
							</SelectContent>
						</Select>
						<Select value={dateRange} onValueChange={setDateRange}>
							<SelectTrigger>
								<SelectValue placeholder="Date range" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7">Last 7 days</SelectItem>
								<SelectItem value="30">Last 30 days</SelectItem>
								<SelectItem value="90">Last 90 days</SelectItem>
								<SelectItem value="365">Last year</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Job History ({filteredJobs.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						data={filteredJobs}
						columns={columns}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
