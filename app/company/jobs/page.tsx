'use client'

import React, { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Filter, Calendar as CalendarIcon, List, Search, Edit, UserPlus, CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Job = {
	id: string
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
	scheduled_date: string
	scheduled_time: string
	completed_at?: string
	total_amount: number
	notes?: string
	created_at: string
	customer?: { id: string; full_name: string; email: string; phone?: string }
	provider?: { id: string; business_name: string }
	service?: { id: string; name: string }
}

type Service = {
	id: string
	name: string
	base_price: number
}

type Provider = {
	id: string
	business_name: string
	email?: string
}

type Customer = {
	id: string
	full_name: string
	email: string
	phone?: string
}

type Team = {
	id: string
	name: string
	members?: Array<{ user: { id: string; full_name: string } }>
}

export default function CompanyJobsPage() {
	const [companyId, setCompanyId] = useState<string | null>(null)
	const [jobs, setJobs] = useState<Job[]>([])
	const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
	const [services, setServices] = useState<Service[]>([])
	const [providers, setProviders] = useState<Provider[]>([])
	const [customers, setCustomers] = useState<Customer[]>([])
	const [allCustomers, setAllCustomers] = useState<Customer[]>([])
	const [teams, setTeams] = useState<Team[]>([])
	const [loading, setLoading] = useState(true)
	const [view, setView] = useState<'list' | 'calendar'>('list')
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
	const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
	const [customerSearchQuery, setCustomerSearchQuery] = useState('')

	// Filters
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [dateFrom, setDateFrom] = useState<string>('')
	const [dateTo, setDateTo] = useState<string>('')
	const [providerFilter, setProviderFilter] = useState<string>('all')
	const [customerFilter, setCustomerFilter] = useState<string>('all')
	const [searchQuery, setSearchQuery] = useState('')

	// Create job dialog
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [newJob, setNewJob] = useState({
		service_id: '',
		customer_id: '',
		provider_id: '',
		scheduled_date: '',
		scheduled_time: '',
		total_amount: '',
		notes: '',
	})

	// Assign job dialog
	const [assignDialogOpen, setAssignDialogOpen] = useState(false)
	const [selectedJob, setSelectedJob] = useState<Job | null>(null)
	const [assignProviderId, setAssignProviderId] = useState<string>('')

	useEffect(() => {
		fetchData()
	}, [])

	useEffect(() => {
		applyFilters()
	}, [jobs, statusFilter, dateFrom, dateTo, providerFilter, customerFilter, searchQuery])

	const fetchData = async () => {
		try {
			// Get company ID
			const companyRes = await fetch('/api/companies/me')
			const companyData = await companyRes.json()
			
			if (!companyData.company) {
				console.error('No company found')
				setLoading(false)
				return
			}

			const id = companyData.company.id
			setCompanyId(id)

			// Fetch all data in parallel
			const [jobsRes, servicesRes, teamsRes, customersRes] = await Promise.all([
				fetch(`/api/companies/${id}/jobs?limit=1000`),
				fetch('/api/services'),
				fetch(`/api/companies/${id}/teams`),
				fetch('/api/admin/users?role=customer&limit=1000').catch(() => ({ users: [] })),
			])

			const [jobsData, servicesData, teamsData, customersData] = await Promise.all([
				jobsRes.json(),
				servicesRes.json().catch(() => ({ services: [] })),
				teamsRes.json(),
				customersRes.json().catch(() => ({ users: [] })),
			])

			setJobs(jobsData.jobs || [])
			setServices(servicesData.services || [])
			setTeams(teamsData.teams || [])

			// Extract unique providers from jobs
			const uniqueProviders = new Map<string, Provider>()
			;(jobsData.jobs || []).forEach((job: Job) => {
				if (job.provider) {
					uniqueProviders.set(job.provider.id, job.provider)
				}
			})
			setProviders(Array.from(uniqueProviders.values()))

			// Set all customers from API
			const customersList = (customersData.users || []).map((u: any) => ({
				id: u.id,
				full_name: u.name || u.full_name || u.email,
				email: u.email,
				phone: u.phone,
			}))
			setAllCustomers(customersList)

			// Extract unique customers from jobs for filter dropdown
			const uniqueCustomers = new Map<string, Customer>()
			;(jobsData.jobs || []).forEach((job: Job) => {
				if (job.customer) {
					uniqueCustomers.set(job.customer.id, job.customer)
				}
			})
			setCustomers(Array.from(uniqueCustomers.values()))
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const applyFilters = () => {
		let filtered = [...jobs]

		// Status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(job => job.status === statusFilter)
		}

		// Date range filter
		if (dateFrom) {
			filtered = filtered.filter(job => job.scheduled_date >= dateFrom)
		}
		if (dateTo) {
			filtered = filtered.filter(job => job.scheduled_date <= dateTo)
		}

		// Provider filter
		if (providerFilter !== 'all') {
			filtered = filtered.filter(job => job.provider?.id === providerFilter)
		}

		// Customer filter
		if (customerFilter !== 'all') {
			filtered = filtered.filter(job => job.customer?.id === customerFilter)
		}

		// Search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(job =>
				job.customer?.full_name?.toLowerCase().includes(query) ||
				job.provider?.business_name?.toLowerCase().includes(query) ||
				job.service?.name?.toLowerCase().includes(query) ||
				job.notes?.toLowerCase().includes(query)
			)
		}

		setFilteredJobs(filtered)
	}

	const handleCreateJob = async () => {
		if (!companyId) return

		try {
			const response = await fetch(`/api/companies/${companyId}/jobs`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					service_id: newJob.service_id,
					customer_id: newJob.customer_id,
					provider_id: newJob.provider_id || null,
					scheduled_date: newJob.scheduled_date,
					scheduled_time: newJob.scheduled_time,
					total_amount: parseFloat(newJob.total_amount) || 0,
					notes: newJob.notes || null,
					status: 'scheduled',
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				alert(error.error || 'Failed to create job')
				return
			}

			// Reset form and refresh
			setNewJob({
				service_id: '',
				customer_id: '',
				provider_id: '',
				scheduled_date: '',
				scheduled_time: '',
				total_amount: '',
				notes: '',
			})
			setCustomerSearchQuery('')
			setCreateDialogOpen(false)
			fetchData()
		} catch (error) {
			console.error('Error creating job:', error)
			alert('Failed to create job')
		}
	}

	const handleAssignJob = async () => {
		if (!selectedJob || !assignProviderId) return

		try {
			const response = await fetch(`/api/companies/${companyId}/jobs/${selectedJob.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					provider_id: assignProviderId,
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				alert(error.error || 'Failed to assign job')
				return
			}

			setAssignDialogOpen(false)
			setSelectedJob(null)
			setAssignProviderId('')
			fetchData()
		} catch (error) {
			console.error('Error assigning job:', error)
			alert('Failed to assign job')
		}
	}

	const handleUpdateStatus = async (jobId: string, status: string) => {
		if (!companyId) return

		try {
			const response = await fetch(`/api/companies/${companyId}/jobs/${jobId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status,
					...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				alert(error.error || 'Failed to update status')
				return
			}

			fetchData()
		} catch (error) {
			console.error('Error updating status:', error)
			alert('Failed to update status')
		}
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
			scheduled: 'outline',
			in_progress: 'default',
			completed: 'default',
			cancelled: 'destructive',
		}
		return (
			<Badge variant={variants[status] || 'outline'}>
				{status.replace('_', ' ').toUpperCase()}
			</Badge>
		)
	}

	const getJobsForDate = (date: Date) => {
		const dateStr = format(date, 'yyyy-MM-dd')
		return filteredJobs.filter(job => job.scheduled_date === dateStr)
	}

	const getCalendarDays = () => {
		const year = calendarMonth.getFullYear()
		const month = calendarMonth.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const days: Date[] = []

		for (let i = 1; i <= lastDay.getDate(); i++) {
			days.push(new Date(year, month, i))
		}

		return days
	}

	if (loading) {
		return (
			<RequirePermission permission="assign_jobs">
				<div className="space-y-4">
					<div className="h-8 bg-gray-200 animate-pulse rounded w-1/4" />
					<div className="h-64 bg-gray-200 animate-pulse rounded" />
				</div>
			</RequirePermission>
		)
	}

	return (
		<RequirePermission permission="assign_jobs">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<PageHeader
						title="Job Assignments"
						subtitle="Assign and manage jobs across your teams"
					/>
					<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="w-4 h-4 mr-2" />
								Create Job
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Create New Job</DialogTitle>
								<DialogDescription>
									Create a new job assignment for your team
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="service">Service *</Label>
										<Select
											value={newJob.service_id}
											onValueChange={(value) => setNewJob({ ...newJob, service_id: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select service" />
											</SelectTrigger>
											<SelectContent>
												{services.map((service) => (
													<SelectItem key={service.id} value={service.id}>
														{service.name} (${service.base_price})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="customer">Customer *</Label>
										<Select
											value={newJob.customer_id}
											onValueChange={(value) => setNewJob({ ...newJob, customer_id: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select customer" />
											</SelectTrigger>
											<SelectContent>
												<div className="p-2">
													<Input
														placeholder="Search customers..."
														value={customerSearchQuery}
														onChange={(e) => setCustomerSearchQuery(e.target.value)}
														onClick={(e) => e.stopPropagation()}
													/>
												</div>
												{allCustomers
													.filter((c) =>
														customerSearchQuery
															? c.full_name?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
															  c.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
															: true
													)
													.slice(0, 50)
													.map((customer) => (
														<SelectItem key={customer.id} value={customer.id}>
															{customer.full_name} ({customer.email})
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="date">Scheduled Date *</Label>
										<Input
											id="date"
											type="date"
											value={newJob.scheduled_date}
											onChange={(e) => setNewJob({ ...newJob, scheduled_date: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="time">Scheduled Time *</Label>
										<Input
											id="time"
											type="time"
											value={newJob.scheduled_time}
											onChange={(e) => setNewJob({ ...newJob, scheduled_time: e.target.value })}
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="provider">Provider (Optional)</Label>
										<Select
											value={newJob.provider_id}
											onValueChange={(value) => setNewJob({ ...newJob, provider_id: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Assign provider" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">Unassigned</SelectItem>
												{providers.map((provider) => (
													<SelectItem key={provider.id} value={provider.id}>
														{provider.business_name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="amount">Total Amount *</Label>
										<Input
											id="amount"
											type="number"
											step="0.01"
											value={newJob.total_amount}
											onChange={(e) => setNewJob({ ...newJob, total_amount: e.target.value })}
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="notes">Notes</Label>
									<Textarea
										id="notes"
										value={newJob.notes}
										onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
										rows={3}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => {
									setCreateDialogOpen(false)
									setCustomerSearchQuery('')
								}}>
									Cancel
								</Button>
								<Button onClick={handleCreateJob} disabled={!newJob.service_id || !newJob.customer_id || !newJob.scheduled_date || !newJob.scheduled_time}>
									Create Job
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Filter className="w-5 h-5" />
							Filters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
							<div>
								<Label>Search</Label>
								<div className="relative">
									<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Search jobs..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-8"
									/>
								</div>
							</div>
							<div>
								<Label>Status</Label>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="scheduled">Scheduled</SelectItem>
										<SelectItem value="in_progress">In Progress</SelectItem>
										<SelectItem value="completed">Completed</SelectItem>
										<SelectItem value="cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Date From</Label>
								<Input
									type="date"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
								/>
							</div>
							<div>
								<Label>Date To</Label>
								<Input
									type="date"
									value={dateTo}
									onChange={(e) => setDateTo(e.target.value)}
								/>
							</div>
							<div>
								<Label>Provider</Label>
								<Select value={providerFilter} onValueChange={setProviderFilter}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Providers</SelectItem>
										{providers.map((provider) => (
											<SelectItem key={provider.id} value={provider.id}>
												{provider.business_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* View Toggle */}
				<div className="flex justify-between items-center">
					<div className="flex gap-2">
						<Button
							variant={view === 'list' ? 'default' : 'outline'}
							onClick={() => setView('list')}
						>
							<List className="w-4 h-4 mr-2" />
							List View
						</Button>
						<Button
							variant={view === 'calendar' ? 'default' : 'outline'}
							onClick={() => setView('calendar')}
						>
							<CalendarIcon className="w-4 h-4 mr-2" />
							Calendar View
						</Button>
					</div>
					<div className="text-sm text-gray-600">
						{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
					</div>
				</div>

				{/* List View */}
				{view === 'list' && (
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
										{filteredJobs.map((job) => (
											<tr key={job.id} className="hover:bg-gray-50">
												<td className="px-4 py-3 text-sm">{job.service?.name || 'N/A'}</td>
												<td className="px-4 py-3 text-sm">
													<div>
														<div className="font-medium">{job.customer?.full_name || 'N/A'}</div>
														<div className="text-xs text-gray-500">{job.customer?.email}</div>
													</div>
												</td>
												<td className="px-4 py-3 text-sm">
													<div>
														<div>{job.scheduled_date}</div>
														<div className="text-xs text-gray-500">{job.scheduled_time}</div>
													</div>
												</td>
												<td className="px-4 py-3 text-sm">
													{job.provider ? (
														job.provider.business_name
													) : (
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																setSelectedJob(job)
																setAssignProviderId('')
																setAssignDialogOpen(true)
															}}
														>
															<UserPlus className="w-3 h-3 mr-1" />
															Assign
														</Button>
													)}
												</td>
												<td className="px-4 py-3">{getStatusBadge(job.status)}</td>
												<td className="px-4 py-3 text-sm">${job.total_amount?.toFixed(2) || '0.00'}</td>
												<td className="px-4 py-3">
													<div className="flex gap-2">
														{job.status === 'scheduled' && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleUpdateStatus(job.id, 'in_progress')}
															>
																<Clock className="w-3 h-3 mr-1" />
																Start
															</Button>
														)}
														{job.status === 'in_progress' && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleUpdateStatus(job.id, 'completed')}
															>
																<CheckCircle2 className="w-3 h-3 mr-1" />
																Complete
															</Button>
														)}
														{job.status !== 'cancelled' && job.status !== 'completed' && (
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleUpdateStatus(job.id, 'cancelled')}
															>
																<XCircle className="w-3 h-3 mr-1" />
																Cancel
															</Button>
														)}
													</div>
												</td>
											</tr>
										))}
										{filteredJobs.length === 0 && (
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
				)}

				{/* Calendar View */}
				{view === 'calendar' && (
					<Card>
						<CardHeader>
							<CardTitle>Job Calendar</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<Button
										variant="outline"
										onClick={() => {
											const prevMonth = new Date(calendarMonth)
											prevMonth.setMonth(prevMonth.getMonth() - 1)
											setCalendarMonth(prevMonth)
										}}
									>
										Previous
									</Button>
									<h3 className="text-lg font-semibold">
										{format(calendarMonth, 'MMMM yyyy')}
									</h3>
									<Button
										variant="outline"
										onClick={() => {
											const nextMonth = new Date(calendarMonth)
											nextMonth.setMonth(nextMonth.getMonth() + 1)
											setCalendarMonth(nextMonth)
										}}
									>
										Next
									</Button>
								</div>
								<div className="grid grid-cols-7 gap-2">
									{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
										<div key={day} className="text-center font-medium text-sm text-gray-600 py-2">
											{day}
										</div>
									))}
									{getCalendarDays().map((date, idx) => {
										const dayJobs = getJobsForDate(date)
										const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
										return (
											<div
												key={idx}
												className={cn(
													'min-h-[100px] border rounded p-2',
													isToday && 'bg-blue-50 border-blue-300',
													date.getMonth() !== calendarMonth.getMonth() && 'opacity-30'
												)}
											>
												<div className="text-sm font-medium mb-1">
													{format(date, 'd')}
												</div>
												<div className="space-y-1">
													{dayJobs.slice(0, 3).map((job) => (
														<div
															key={job.id}
															className={cn(
																'text-xs p-1 rounded truncate',
																job.status === 'completed' && 'bg-green-100 text-green-800',
																job.status === 'in_progress' && 'bg-blue-100 text-blue-800',
																job.status === 'scheduled' && 'bg-yellow-100 text-yellow-800',
																job.status === 'cancelled' && 'bg-red-100 text-red-800'
															)}
															title={`${job.service?.name || 'Job'} - ${job.customer?.full_name || 'Customer'}`}
														>
															{job.scheduled_time} - {job.service?.name || 'Job'}
														</div>
													))}
													{dayJobs.length > 3 && (
														<div className="text-xs text-gray-500">
															+{dayJobs.length - 3} more
														</div>
													)}
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Assign Job Dialog */}
				<Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Assign Job</DialogTitle>
							<DialogDescription>
								Assign this job to a provider or team
							</DialogDescription>
						</DialogHeader>
						{selectedJob && (
							<div className="space-y-4">
								<div>
									<Label>Job Details</Label>
									<div className="mt-2 p-3 bg-gray-50 rounded">
										<div className="text-sm">
											<div><strong>Service:</strong> {selectedJob.service?.name}</div>
											<div><strong>Customer:</strong> {selectedJob.customer?.full_name}</div>
											<div><strong>Date:</strong> {selectedJob.scheduled_date} at {selectedJob.scheduled_time}</div>
										</div>
									</div>
								</div>
								<div>
									<Label>Assign to Provider</Label>
									<Select value={assignProviderId} onValueChange={setAssignProviderId}>
										<SelectTrigger>
											<SelectValue placeholder="Select provider" />
										</SelectTrigger>
										<SelectContent>
											{providers.map((provider) => (
												<SelectItem key={provider.id} value={provider.id}>
													{provider.business_name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}
						<DialogFooter>
							<Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={handleAssignJob} disabled={!assignProviderId}>
								Assign Job
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</RequirePermission>
	)
}
