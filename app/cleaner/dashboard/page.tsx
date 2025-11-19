'use client'

import React, { useEffect, useState } from 'react'
import { MetricCard } from '@/components/admin/MetricCard'
import { Briefcase, Clock, Wallet, Star, Calendar, Play, Square } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { QuickActionCard } from '@/components/admin/QuickActionCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type DashboardMetrics = {
	thisWeekJobs: number
	hoursWorked: number
	monthlyEarnings: number
	averageRating: number
	totalReviews: number
}

type Job = {
	id: string
	booking_date: string
	booking_time: string
	status: string
	duration_hours: number
	total_amount: number
	special_instructions?: string
	completed_at?: string
	started_at?: string
	customer?: { full_name: string; email: string; phone?: string }
	service?: { name: string; base_price: number }
	address?: { street_address: string; city: string; state: string; zip_code: string }
}

type EarningsData = {
	period: string
	totalEarnings: number
	totalHours: number
	totalJobs: number
	averagePerJob: number
	hourlyRate: number
	monthlyBreakdown: Array<{ month: string; amount: number }>
	jobs: Job[]
}

type TimesheetEntry = {
	id: string
	booking_date: string
	booking_time: string
	duration_hours: number
	started_at?: string
	completed_at?: string
	status: string
	service?: { name: string }
	customer?: { full_name: string }
}

export default function CleanerDashboard() {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
	const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([])
	const [jobHistory, setJobHistory] = useState<Job[]>([])
	const [earnings, setEarnings] = useState<EarningsData | null>(null)
	const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('overview')
	const [earningsPeriod, setEarningsPeriod] = useState('month')

	useEffect(() => {
		fetchDashboardData()
	}, [])

	useEffect(() => {
		if (activeTab === 'earnings') {
			fetchEarnings(earningsPeriod)
		} else if (activeTab === 'timesheet') {
			fetchTimesheet()
		} else if (activeTab === 'history') {
			fetchJobHistory()
		}
	}, [activeTab, earningsPeriod])

	const fetchDashboardData = async () => {
		try {
			const [metricsRes, jobsRes] = await Promise.all([
				fetch('/api/cleaners/me/dashboard'),
				fetch('/api/cleaners/me/jobs?status=upcoming&limit=10'),
			])

			const metricsData = await metricsRes.json()
			const jobsData = await jobsRes.json()

			setMetrics(metricsData)
			setUpcomingJobs(jobsData.jobs || [])
		} catch (error) {
			console.error('Error fetching dashboard data:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchJobHistory = async () => {
		try {
			const res = await fetch('/api/cleaners/me/jobs?status=completed&limit=20')
			const data = await res.json()
			setJobHistory(data.jobs || [])
		} catch (error) {
			console.error('Error fetching job history:', error)
		}
	}

	const fetchEarnings = async (period: string) => {
		try {
			const res = await fetch(`/api/cleaners/me/earnings?period=${period}`)
			const data = await res.json()
			setEarnings(data)
		} catch (error) {
			console.error('Error fetching earnings:', error)
		}
	}

	const fetchTimesheet = async () => {
		try {
			const today = new Date()
			const startOfWeek = new Date(today)
			startOfWeek.setDate(today.getDate() - today.getDay())
			const endOfWeek = new Date(startOfWeek)
			endOfWeek.setDate(startOfWeek.getDate() + 7)

			const res = await fetch(
				`/api/cleaners/me/timesheet?startDate=${startOfWeek.toISOString().split('T')[0]}&endDate=${endOfWeek.toISOString().split('T')[0]}`
			)
			const data = await res.json()
			setTimesheetEntries(data.entries || [])
		} catch (error) {
			console.error('Error fetching timesheet:', error)
		}
	}

	const handleClockInOut = async (jobId: string, action: 'clock_in' | 'clock_out') => {
		try {
			const res = await fetch('/api/cleaners/me/timesheet', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jobId, action }),
			})

			if (res.ok) {
				fetchDashboardData()
				if (activeTab === 'timesheet') {
					fetchTimesheet()
				}
			}
		} catch (error) {
			console.error('Error clocking in/out:', error)
		}
	}

	if (loading) {
		return (
			<div className="space-y-6">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg" />
				))}
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Cleaner Dashboard" subtitle="Your work overview" />

			{/* Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard
					title="This Week's Jobs"
					value={metrics?.thisWeekJobs || 0}
					icon={<Briefcase className="w-6 h-6" />}
				/>
				<MetricCard
					title="Hours Worked"
					value={`${metrics?.hoursWorked || 0}h`}
					icon={<Clock className="w-6 h-6" />}
				/>
				<MetricCard
					title="Earnings (Month)"
					value={`$${(metrics?.monthlyEarnings || 0).toLocaleString()}`}
					icon={<Wallet className="w-6 h-6" />}
				/>
				<MetricCard
					title="Rating"
					value={metrics?.averageRating?.toFixed(1) || '0.0'}
					subtitle={`${metrics?.totalReviews || 0} reviews`}
					icon={<Star className="w-6 h-6" />}
				/>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Clock in/out" href="/cleaner/timesheet" />
				<QuickActionCard title="Today's schedule" href="/cleaner/schedule" />
				<QuickActionCard title="Request time off" href="/cleaner/schedule" />
				<QuickActionCard title="Contact ambassador" href="/cleaner/messages" />
			</div>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
					<TabsTrigger value="timesheet">Timesheet</TabsTrigger>
					<TabsTrigger value="earnings">Earnings</TabsTrigger>
					<TabsTrigger value="history">Job History</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Upcoming Jobs</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{upcomingJobs.slice(0, 5).map((job) => (
										<div key={job.id} className="flex items-center justify-between p-3 border rounded">
											<div>
												<p className="font-medium">{job.service?.name || 'Service'}</p>
												<p className="text-sm text-gray-600">
													{job.booking_date} at {job.booking_time}
												</p>
												{job.address && (
													<p className="text-xs text-gray-500">
														{job.address.street_address}, {job.address.city}
													</p>
												)}
											</div>
											<Badge variant={job.status === 'in-progress' ? 'default' : 'outline'}>
												{job.status}
											</Badge>
										</div>
									))}
									{upcomingJobs.length === 0 && (
										<p className="text-sm text-gray-500 text-center py-4">No upcoming jobs</p>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Quick Stats</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Average Rating</span>
										<span className="font-semibold">
											{metrics?.averageRating?.toFixed(1) || '0.0'} ⭐
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Total Reviews</span>
										<span className="font-semibold">{metrics?.totalReviews || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">This Week's Hours</span>
										<span className="font-semibold">{metrics?.hoursWorked || 0}h</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Monthly Earnings</span>
										<span className="font-semibold">
											${(metrics?.monthlyEarnings || 0).toLocaleString()}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Schedule Tab */}
				<TabsContent value="schedule" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Upcoming Schedule</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{upcomingJobs.map((job) => (
									<div key={job.id} className="flex items-center justify-between p-3 border rounded">
										<div className="flex items-center gap-3">
											<Calendar className="w-5 h-5 text-gray-400" />
											<div>
												<p className="font-medium">{job.service?.name || 'Service'}</p>
												<p className="text-sm text-gray-600">
													{job.booking_date} at {job.booking_time}
												</p>
												{job.customer && (
													<p className="text-xs text-gray-500">
														{job.customer.full_name} • {job.duration_hours}h
													</p>
												)}
												{job.address && (
													<p className="text-xs text-gray-500">
														{job.address.street_address}, {job.address.city}
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant={job.status === 'in-progress' ? 'default' : 'outline'}>
												{job.status}
											</Badge>
											{job.status === 'confirmed' && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleClockInOut(job.id, 'clock_in')}
												>
													<Play className="w-4 h-4 mr-1" />
													Start
												</Button>
											)}
											{job.status === 'in-progress' && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleClockInOut(job.id, 'clock_out')}
												>
													<Square className="w-4 h-4 mr-1" />
													Complete
												</Button>
											)}
										</div>
									</div>
								))}
								{upcomingJobs.length === 0 && (
									<p className="text-sm text-gray-500 text-center py-4">No upcoming jobs scheduled</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Timesheet Tab */}
				<TabsContent value="timesheet" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>This Week's Timesheet</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{timesheetEntries.map((entry) => (
									<div key={entry.id} className="flex items-center justify-between p-3 border rounded">
										<div>
											<p className="font-medium">{entry.service?.name || 'Service'}</p>
											<p className="text-sm text-gray-600">
												{entry.booking_date} • {entry.booking_time}
											</p>
											{entry.customer && (
												<p className="text-xs text-gray-500">{entry.customer.full_name}</p>
											)}
											{entry.started_at && entry.completed_at && (
												<p className="text-xs text-gray-500">
													{new Date(entry.started_at).toLocaleTimeString()} -{' '}
													{new Date(entry.completed_at).toLocaleTimeString()}
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="font-semibold">{entry.duration_hours}h</p>
											<Badge variant={entry.status === 'completed' ? 'default' : 'outline'}>
												{entry.status}
											</Badge>
										</div>
									</div>
								))}
								{timesheetEntries.length === 0 && (
									<p className="text-sm text-gray-500 text-center py-4">No timesheet entries this week</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Earnings Tab */}
				<TabsContent value="earnings" className="space-y-4">
					<div className="flex justify-between items-center">
						<CardTitle>Earnings Breakdown</CardTitle>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant={earningsPeriod === 'week' ? 'default' : 'outline'}
								onClick={() => setEarningsPeriod('week')}
							>
								Week
							</Button>
							<Button
								size="sm"
								variant={earningsPeriod === 'month' ? 'default' : 'outline'}
								onClick={() => setEarningsPeriod('month')}
							>
								Month
							</Button>
							<Button
								size="sm"
								variant={earningsPeriod === 'year' ? 'default' : 'outline'}
								onClick={() => setEarningsPeriod('year')}
							>
								Year
							</Button>
						</div>
					</div>
					{earnings && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">${earnings.totalEarnings.toLocaleString()}</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-medium">Total Hours</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{earnings.totalHours}h</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">${earnings.hourlyRate.toFixed(2)}</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{earnings.totalJobs}</p>
								</CardContent>
							</Card>
						</div>
					)}
					<Card>
						<CardHeader>
							<CardTitle>Recent Earnings</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{earnings?.jobs.slice(0, 10).map((job) => (
									<div key={job.id} className="flex items-center justify-between p-3 border rounded">
										<div>
											<p className="font-medium">{job.service?.name || 'Service'}</p>
											<p className="text-sm text-gray-600">
												{job.booking_date} • {job.customer?.full_name || 'Customer'}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">${job.total_amount?.toFixed(2) || '0.00'}</p>
											<p className="text-xs text-gray-500">{job.duration_hours}h</p>
										</div>
									</div>
								))}
								{(!earnings || earnings.jobs.length === 0) && (
									<p className="text-sm text-gray-500 text-center py-4">No earnings data</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Job History Tab */}
				<TabsContent value="history" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Job History</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gray-50 border-b">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
												Date
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
												Service
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
												Customer
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
												Duration
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
												Amount
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
												Status
											</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{jobHistory.map((job) => (
											<tr key={job.id} className="hover:bg-gray-50">
												<td className="px-4 py-3 text-sm">
													{job.booking_date} {job.booking_time}
												</td>
												<td className="px-4 py-3 text-sm">{job.service?.name || 'N/A'}</td>
												<td className="px-4 py-3 text-sm">{job.customer?.full_name || 'N/A'}</td>
												<td className="px-4 py-3 text-sm">{job.duration_hours}h</td>
												<td className="px-4 py-3 text-sm">${job.total_amount?.toFixed(2) || '0.00'}</td>
												<td className="px-4 py-3">
													<Badge variant={job.status === 'completed' ? 'default' : 'outline'}>
														{job.status}
													</Badge>
												</td>
											</tr>
										))}
										{jobHistory.length === 0 && (
											<tr>
												<td colSpan={6} className="px-4 py-8 text-center text-gray-500">
													No job history found
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
