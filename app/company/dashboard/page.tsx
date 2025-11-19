'use client'

import React, { useEffect, useState } from 'react'
import { MetricCard } from '@/components/admin/MetricCard'
import { Users, UserCheck, ClipboardList, DollarSign, Calendar, Plus, Settings, Download } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { QuickActionCard } from '@/components/admin/QuickActionCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createAnonSupabase } from '@/lib/supabase'

type Company = { id: string; name: string }
type Job = {
	id: string
	status: string
	scheduled_date: string
	scheduled_time: string
	total_amount: number
	customer?: { full_name: string; email: string }
	provider?: { business_name: string }
	service?: { name: string }
}
type Team = {
	id: string
	name: string
	description?: string
	members?: Array<{ user: { full_name: string; email: string } }>
}
type Analytics = {
	thisMonthJobs: number
	jobGrowth: number
	thisMonthSpend: number
	spendGrowth: number
	averageRating: number
	totalReviews: number
	propertyGrowth: number
}

export default function CompanyDashboard() {
	const [company, setCompany] = useState<Company | null>(null)
	const [analytics, setAnalytics] = useState<Analytics | null>(null)
	const [jobs, setJobs] = useState<Job[]>([])
	const [teams, setTeams] = useState<Team[]>([])
	const [providers, setProviders] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('overview')

	useEffect(() => {
		fetchDashboardData()
	}, [])

	const fetchDashboardData = async () => {
		try {
			// Get current user's company
			const companyRes = await fetch('/api/companies/me')
			const companyData = await companyRes.json()
			
			if (!companyData.company) {
				console.error('No company found for user')
				setLoading(false)
				return
			}

			const companyId = companyData.company.id
			setCompany(companyData.company)

			// Fetch all data in parallel
			const [analyticsRes, jobsRes, teamsRes] = await Promise.all([
				fetch(`/api/companies/${companyId}/analytics`),
				fetch(`/api/companies/${companyId}/jobs?limit=10`),
				fetch(`/api/companies/${companyId}/teams`),
			])

			const [analyticsData, jobsData, teamsData] = await Promise.all([
				analyticsRes.json(),
				jobsRes.json(),
				teamsRes.json(),
			])

			setAnalytics(analyticsData)
			setJobs(jobsData.jobs || [])
			setTeams(teamsData.teams || [])
			setProviders(teamsData.providers || [])
		} catch (error) {
			console.error('Error fetching dashboard data:', error)
		} finally {
			setLoading(false)
		}
	}

	const updateJobStatus = async (jobId: string, status: string) => {
		try {
			const response = await fetch(`/api/jobs/${jobId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			})

			if (response.ok) {
				// Refresh jobs
				if (company) {
					const jobsRes = await fetch(`/api/companies/${company.id}/jobs?limit=10`)
					const jobsData = await jobsRes.json()
					setJobs(jobsData.jobs || [])
				}
			}
		} catch (error) {
			console.error('Error updating job status:', error)
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

	if (!company) {
		return (
			<div className="space-y-6">
				<PageHeader title="Company Dashboard" subtitle="No company found" />
				<Card>
					<CardContent className="p-6 text-center text-gray-600">
						No company associated with your account. Please contact support.
					</CardContent>
				</Card>
			</div>
		)
	}

	const totalTeams = teams.length
	const activeCleaners = providers.filter((p) => p.status === 'active').length
	const jobsThisMonth = analytics?.thisMonthJobs || 0
	const monthlyRevenue = analytics?.thisMonthSpend || 0

	return (
		<div className="space-y-6">
			<PageHeader 
				title={company.name || "Company Dashboard"} 
				subtitle="Overview of your company operations" 
			/>

			{/* Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard 
					title="Total Teams" 
					value={totalTeams.toString()} 
					icon={<Users className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Active Cleaners" 
					value={activeCleaners.toString()} 
					icon={<UserCheck className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Jobs This Month" 
					value={jobsThisMonth.toString()} 
					change={{ 
						value: analytics?.jobGrowth || 0, 
						positive: (analytics?.jobGrowth || 0) >= 0 
					}} 
					icon={<ClipboardList className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Monthly Revenue" 
					value={`$${monthlyRevenue.toLocaleString()}`} 
					icon={<DollarSign className="w-6 h-6" />} 
				/>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard 
					title="Schedule job" 
					description="Create a new job" 
					href="/company/jobs" 
					icon={<Calendar className="w-5 h-5" />}
				/>
				<QuickActionCard 
					title="Add cleaner" 
					description="Invite a cleaner" 
					href="/company/cleaners" 
					icon={<Plus className="w-5 h-5" />}
				/>
				<QuickActionCard 
					title="View teams" 
					description="Manage teams" 
					href="/company/teams" 
					icon={<Users className="w-5 h-5" />}
				/>
				<QuickActionCard 
					title="Generate report" 
					description="Run payroll report" 
					href="/company/invoices" 
					icon={<Download className="w-5 h-5" />}
				/>
			</div>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="jobs">Jobs</TabsTrigger>
					<TabsTrigger value="teams">Teams</TabsTrigger>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Recent Jobs</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{jobs.slice(0, 5).map((job) => (
										<div key={job.id} className="flex items-center justify-between p-2 border rounded">
											<div>
												<p className="font-medium">{job.service?.name || 'Service'}</p>
												<p className="text-sm text-gray-600">
													{job.scheduled_date} {job.scheduled_time}
												</p>
											</div>
											<Badge variant={job.status === 'completed' ? 'default' : 'outline'}>
												{job.status}
											</Badge>
										</div>
									))}
									{jobs.length === 0 && (
										<p className="text-sm text-gray-500 text-center py-4">No jobs yet</p>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Team Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{teams.slice(0, 5).map((team) => (
										<div key={team.id} className="flex items-center justify-between p-2 border rounded">
											<div>
												<p className="font-medium">{team.name}</p>
												<p className="text-sm text-gray-600">
													{team.members?.length || 0} members
												</p>
											</div>
										</div>
									))}
									{teams.length === 0 && (
										<p className="text-sm text-gray-500 text-center py-4">No teams yet</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Jobs Tab */}
				<TabsContent value="jobs" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Job Management</h3>
						<Button onClick={() => window.location.href = '/company/jobs'}>
							<Plus className="w-4 h-4 mr-2" />
							Create Job
						</Button>
					</div>
					<Card>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gray-50 border-b">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{jobs.map((job) => (
											<tr key={job.id} className="hover:bg-gray-50">
												<td className="px-4 py-3 text-sm">{job.service?.name || 'N/A'}</td>
												<td className="px-4 py-3 text-sm">{job.customer?.full_name || 'N/A'}</td>
												<td className="px-4 py-3 text-sm">
													{job.scheduled_date} {job.scheduled_time}
												</td>
												<td className="px-4 py-3 text-sm">{job.provider?.business_name || 'Unassigned'}</td>
												<td className="px-4 py-3">
													<Badge variant={job.status === 'completed' ? 'default' : 'outline'}>
														{job.status}
													</Badge>
												</td>
												<td className="px-4 py-3 text-sm">${job.total_amount?.toFixed(2) || '0.00'}</td>
												<td className="px-4 py-3">
													<div className="flex gap-2">
														{job.status === 'scheduled' && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => updateJobStatus(job.id, 'in_progress')}
															>
																Start
															</Button>
														)}
														{job.status === 'in_progress' && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => updateJobStatus(job.id, 'completed')}
															>
																Complete
															</Button>
														)}
													</div>
												</td>
											</tr>
										))}
										{jobs.length === 0 && (
											<tr>
												<td colSpan={7} className="px-4 py-8 text-center text-gray-500">
													No jobs found
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Teams Tab */}
				<TabsContent value="teams" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Team Management</h3>
						<Button onClick={() => window.location.href = '/company/teams'}>
							<Plus className="w-4 h-4 mr-2" />
							Create Team
						</Button>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{teams.map((team) => (
							<Card key={team.id}>
								<CardHeader>
									<CardTitle>{team.name}</CardTitle>
									{team.description && (
										<p className="text-sm text-gray-600">{team.description}</p>
									)}
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<p className="text-sm font-medium">
											Members: {team.members?.length || 0}
										</p>
										{team.members && team.members.length > 0 && (
											<div className="space-y-1">
												{team.members.slice(0, 3).map((member, idx) => (
													<p key={idx} className="text-xs text-gray-600">
														• {member.user?.full_name || 'Unknown'}
													</p>
												))}
												{team.members.length > 3 && (
													<p className="text-xs text-gray-500">
														+{team.members.length - 3} more
													</p>
												)}
											</div>
										)}
										<Button size="sm" variant="outline" className="w-full mt-4">
											Manage Team
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
						{teams.length === 0 && (
							<Card>
								<CardContent className="p-6 text-center text-gray-500">
									No teams created yet. Create your first team to get started.
								</CardContent>
							</Card>
						)}
					</div>

					{/* Providers List */}
					<Card>
						<CardHeader>
							<CardTitle>All Cleaners/Providers</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{providers.map((provider) => (
									<div key={provider.id} className="flex items-center justify-between p-3 border rounded">
										<div>
											<p className="font-medium">{provider.business_name || provider.email}</p>
											<p className="text-sm text-gray-600">{provider.email}</p>
										</div>
										<Badge variant={provider.status === 'active' ? 'default' : 'outline'}>
											{provider.status}
										</Badge>
									</div>
								))}
								{providers.length === 0 && (
									<p className="text-sm text-gray-500 text-center py-4">No providers yet</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Schedule Tab */}
				<TabsContent value="schedule" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Scheduling</h3>
						<Button onClick={() => window.location.href = '/company/jobs'}>
							<Plus className="w-4 h-4 mr-2" />
							Schedule Job
						</Button>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Upcoming Jobs</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{jobs
									.filter((job) => ['scheduled', 'in_progress'].includes(job.status))
									.sort((a, b) => {
										const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`)
										const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`)
										return dateA.getTime() - dateB.getTime()
									})
									.map((job) => (
										<div key={job.id} className="flex items-center justify-between p-3 border rounded">
											<div className="flex items-center gap-3">
												<Calendar className="w-5 h-5 text-gray-400" />
												<div>
													<p className="font-medium">{job.service?.name || 'Service'}</p>
													<p className="text-sm text-gray-600">
														{job.scheduled_date} at {job.scheduled_time}
													</p>
													<p className="text-xs text-gray-500">
														{job.customer?.full_name || 'Customer'} • {job.provider?.business_name || 'Unassigned'}
													</p>
												</div>
											</div>
											<Badge variant={job.status === 'in_progress' ? 'default' : 'outline'}>
												{job.status}
											</Badge>
										</div>
									))}
								{jobs.filter((job) => ['scheduled', 'in_progress'].includes(job.status)).length === 0 && (
									<p className="text-sm text-gray-500 text-center py-4">No upcoming jobs</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Reports Tab */}
				<TabsContent value="reports" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Reports & Analytics</h3>
						<Button variant="outline" onClick={() => window.location.href = '/company/invoices'}>
							<Download className="w-4 h-4 mr-2" />
							Generate Report
						</Button>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Performance Metrics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Average Rating</span>
										<span className="font-semibold">
											{analytics?.averageRating?.toFixed(1) || '0.0'} ⭐
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Total Reviews</span>
										<span className="font-semibold">{analytics?.totalReviews || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Job Growth</span>
										<span className={`font-semibold ${(analytics?.jobGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											{(analytics?.jobGrowth || 0) >= 0 ? '+' : ''}{analytics?.jobGrowth || 0}%
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Financial Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">This Month's Revenue</span>
										<span className="font-semibold">${monthlyRevenue.toLocaleString()}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Spend Growth</span>
										<span className={`font-semibold ${(analytics?.spendGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											{(analytics?.spendGrowth || 0) >= 0 ? '+' : ''}{analytics?.spendGrowth || 0}%
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
