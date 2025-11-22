'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column } from '@/components/admin/DataTable'
import { ClipboardCheck, MapPin, Clock, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react'
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
}

export default function AmbassadorTodayJobsPage() {
	const { user } = useAuth()
	const [jobs, setJobs] = useState<Job[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (user?.id) {
			fetchTodayJobs()
		}
	}, [user?.id])

	const fetchTodayJobs = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const today = new Date().toISOString().split('T')[0]
			const response = await fetch(`/api/ambassador/jobs?ambassadorId=${user.id}&date=${today}`)
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
				})))
			}
		} catch (error) {
			console.error('Error fetching today jobs:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleStatusUpdate = async (jobId: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/jobs/${jobId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			})
			
			if (response.ok) {
				fetchTodayJobs()
			}
		} catch (error) {
			console.error('Error updating job status:', error)
		}
	}

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
		{ key: 'customerName', label: 'Customer' },
		{ 
			key: 'address', 
			label: 'Address',
			render: (job) => (
				<div className="flex items-center gap-2">
					<MapPin className="h-4 w-4 text-muted-foreground" />
					<span className="max-w-[200px] truncate">{job.address}</span>
				</div>
			)
		},
		{ key: 'service', label: 'Service' },
		{ 
			key: 'time', 
			label: 'Time',
			render: (job) => (
				<div className="flex items-center gap-2">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<span>{job.time}</span>
				</div>
			)
		},
		{ 
			key: 'status', 
			label: 'Status',
			render: (job) => getStatusBadge(job.status)
		},
		{ 
			key: 'actions',
			label: 'Actions',
			render: (job) => (
				<div className="flex gap-2">
					{job.status === 'scheduled' && (
						<Button size="sm" onClick={() => handleStatusUpdate(job.id, 'in_progress')}>
							Start
						</Button>
					)}
					{job.status === 'in_progress' && (
						<Button size="sm" onClick={() => handleStatusUpdate(job.id, 'completed')}>
							Complete
						</Button>
					)}
				</div>
			)
		},
	]

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Today's Jobs"
				description={`Jobs scheduled for ${new Date().toLocaleDateString()}`}
			/>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{jobs.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Scheduled</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{jobs.filter(j => j.status === 'scheduled').length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">In Progress</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{jobs.filter(j => j.status === 'in_progress').length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Completed</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{jobs.filter(j => j.status === 'completed').length}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Today's Jobs</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						data={jobs}
						columns={columns}
						searchKeys={['customerName', 'address', 'service']}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
