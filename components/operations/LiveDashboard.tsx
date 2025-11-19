'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Clock, User, Phone, Navigation, AlertCircle, CheckCircle, Bell } from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'
import { TeamManagement } from './TeamManagement'
import { ScheduleManagement } from './ScheduleManagement'

interface LiveJob {
	id: string
	customer: {
		name: string
		phone: string
		address: string
	}
	provider:
		| {
				id: string
				name: string
				phone: string
				location?: { lat: number; lng: number; distance?: number }
				eta?: number
		  }
		| null
	service: {
		name: string
		duration: number
		price: number
	}
	startTime: string
	status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
	location: { lat: number; lng: number }
	notes?: string
	urgency: 'low' | 'medium' | 'high'
}

interface ProviderLite {
	id: string
	name: string
	isActive: boolean
	isAvailable: boolean
	currentJob?: string
	eta?: number
	location?: { lat: number; lng: number; distance?: number }
	todayJobs?: number
	rating?: number
	nextJob?: string
}

export function LiveDashboard() {
	const [liveJobs, setLiveJobs] = useState<LiveJob[]>([])
	const [providers, setProviders] = useState<ProviderLite[]>([])
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
	const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string }>>([])
	const supabaseRef = useRef(createAnonSupabase())

	useEffect(() => {
		fetchLiveJobs()
		fetchAvailableProviders()
		
		// Set up real-time subscriptions
		const supabase = supabaseRef.current
		const today = new Date().toISOString().split('T')[0]

		// Subscribe to bookings changes
		const bookingsChannel = supabase
			.channel('bookings-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'bookings',
					filter: `booking_date=eq.${today}`,
				},
				(payload) => {
					console.log('Booking change:', payload)
					// Refresh jobs when bookings change
					fetchLiveJobs()
					fetchAvailableProviders()
					
					// Show notification for important changes
					if (payload.eventType === 'INSERT') {
						setNotifications((prev) => [
							...prev,
							{ id: Date.now().toString(), title: 'New Booking', message: 'A new booking has been created', type: 'info' },
						])
					} else if (payload.eventType === 'UPDATE') {
						setNotifications((prev) => [
							...prev,
							{ id: Date.now().toString(), title: 'Booking Updated', message: 'A booking status has been updated', type: 'info' },
						])
					}
				}
			)
			.subscribe()

		// Subscribe to provider profile changes
		const providersChannel = supabase
			.channel('providers-changes')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'provider_profiles',
				},
				() => {
					fetchAvailableProviders()
				}
			)
			.subscribe()

		// Polling fallback (every 30 seconds)
		const interval = setInterval(() => {
			fetchLiveJobs()
			fetchAvailableProviders()
		}, 30000)

		return () => {
			bookingsChannel.unsubscribe()
			providersChannel.unsubscribe()
			clearInterval(interval)
		}
	}, [selectedDate])

	const fetchLiveJobs = async () => {
		try {
			const res = await fetch(`/api/operations/live-jobs?date=${selectedDate}`)
			if (res.ok) {
				const data = await res.json()
				setLiveJobs(data)
			}
		} catch (e) {
			console.error('Error fetching live jobs:', e)
		}
	}

	const fetchAvailableProviders = async () => {
		try {
			const res = await fetch('/api/providers/available')
			if (res.ok) {
				const data = await res.json()
				setProviders(data)
			}
		} catch (e) {
			console.error('Error fetching providers:', e)
		}
	}

	const assignProvider = async (jobId: string, providerId: string) => {
		try {
			const res = await fetch(`/api/jobs/${jobId}/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ providerId })
			})
			if (res.ok) {
				setNotifications((prev) => [
					...prev,
					{ id: Date.now().toString(), title: 'Success', message: 'Provider assigned successfully!', type: 'success' },
				])
				fetchLiveJobs()
				fetchAvailableProviders()
			} else {
				const error = await res.json()
				setNotifications((prev) => [
					...prev,
					{ id: Date.now().toString(), title: 'Error', message: error.error || 'Failed to assign provider', type: 'error' },
				])
			}
		} catch (e) {
			console.error('Error assigning provider:', e)
			setNotifications((prev) => [
				...prev,
				{ id: Date.now().toString(), title: 'Error', message: 'Failed to assign provider', type: 'error' },
			])
		}
	}

	const updateJobStatus = async (jobId: string, status: LiveJob['status']) => {
		try {
			const res = await fetch(`/api/jobs/${jobId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			})
			if (res.ok) {
				fetchLiveJobs()
				fetchAvailableProviders()
				setNotifications((prev) => [
					...prev,
					{ id: Date.now().toString(), title: 'Success', message: 'Job status updated successfully', type: 'success' },
				])
			} else {
				const error = await res.json()
				setNotifications((prev) => [
					...prev,
					{ id: Date.now().toString(), title: 'Error', message: error.error || 'Failed to update status', type: 'error' },
				])
			}
		} catch (e) {
			console.error('Error updating job status:', e)
			setNotifications((prev) => [
				...prev,
				{ id: Date.now().toString(), title: 'Error', message: 'Failed to update status', type: 'error' },
			])
		}
	}

	const handleAutoAssignAll = async () => {
		try {
			const res = await fetch('/api/operations/auto-assign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ strategy: 'balanced' }),
			})

			if (res.ok) {
				const data = await res.json()
				setNotifications((prev) => [
					...prev,
					{ 
						id: Date.now().toString(), 
						title: 'Auto-Assignment Complete', 
						message: `Successfully assigned ${data.assigned} out of ${data.total} jobs`, 
						type: 'success' 
					},
				])
				fetchLiveJobs()
				fetchAvailableProviders()
			} else {
				const error = await res.json()
				setNotifications((prev) => [
					...prev,
					{ id: Date.now().toString(), title: 'Error', message: error.error || 'Auto-assignment failed', type: 'error' },
				])
			}
		} catch (e) {
			console.error('Error auto-assigning:', e)
			setNotifications((prev) => [
				...prev,
				{ id: Date.now().toString(), title: 'Error', message: 'Auto-assignment failed', type: 'error' },
			])
		}
	}

	const getStatusColor = (status: LiveJob['status']) => {
		switch (status) {
			case 'scheduled':
				return 'bg-blue-500'
			case 'en_route':
				return 'bg-yellow-500'
			case 'in_progress':
				return 'bg-green-500'
			case 'completed':
				return 'bg-gray-500'
			case 'cancelled':
				return 'bg-red-500'
			default:
				return 'bg-gray-400'
		}
	}

	const getUrgencyVariant = (urgency: LiveJob['urgency']) => {
		switch (urgency) {
			case 'high':
				return 'destructive'
			case 'medium':
				return 'default'
			case 'low':
			default:
				return 'secondary'
		}
	}

	const unassignedJobs = liveJobs.filter((j) => !j.provider)
	const inProgressJobs = liveJobs.filter((j) => j.status === 'in_progress')
	const completedToday = liveJobs.filter((j) => j.status === 'completed').length

	return (
		<div className="max-w-7xl mx-auto p-6">
			{/* Notifications */}
			{notifications.length > 0 && (
				<div className="mb-4 space-y-2">
					{notifications.slice(-3).map((notif) => (
						<div
							key={notif.id}
							className={`p-3 rounded-md border ${
								notif.type === 'error' ? 'bg-red-50 border-red-200' : notif.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
							}`}
						>
							<div className="flex justify-between items-center">
								<div>
									<p className="font-medium text-sm">{notif.title}</p>
									<p className="text-xs text-gray-600">{notif.message}</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
								>
									×
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="mb-6">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">Operations Dashboard</h1>
						<p className="text-gray-600">Real-time job tracking and provider management</p>
					</div>
					<div className="flex space-x-3">
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="px-3 py-2 border rounded-md"
						/>
						<Button variant="outline" onClick={fetchLiveJobs}>
							<Navigation className="w-4 h-4 mr-2" />
							Refresh
						</Button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{liveJobs.length}</div>
						<p className="text-sm text-gray-600">Total Jobs Today</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-red-600">{unassignedJobs.length}</div>
						<p className="text-sm text-gray-600">Unassigned</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-yellow-600">{inProgressJobs.length}</div>
						<p className="text-sm text-gray-600">In Progress</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold text-green-600">{completedToday}</div>
						<p className="text-sm text-gray-600">Completed</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{providers.filter((p) => p.isAvailable).length}</div>
						<p className="text-sm text-gray-600">Available Providers</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="map" className="space-y-4">
				<TabsList>
					<TabsTrigger value="map">Map View</TabsTrigger>
					<TabsTrigger value="list">List View</TabsTrigger>
					<TabsTrigger value="providers">Providers</TabsTrigger>
					<TabsTrigger value="unassigned">Unassigned ({unassignedJobs.length})</TabsTrigger>
					<TabsTrigger value="teams">Teams</TabsTrigger>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
				</TabsList>

				<TabsContent value="map" className="space-y-4">
					<Card>
						<CardContent className="p-0">
							<div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
								<div className="text-center">
									<MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
									<p className="text-gray-600">Google Maps integration placeholder</p>
									<p className="text-sm text-gray-500">
										Showing {liveJobs.length} jobs and {providers.length} providers
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Active Jobs</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{liveJobs
										.filter((j) => ['scheduled', 'en_route', 'in_progress'].includes(j.status))
										.map((job) => (
											<div key={job.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
												<div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`}></div>
												<div className="flex-1">
													<p className="font-medium text-sm">{job.customer.name}</p>
													<p className="text-xs text-gray-600">
														{new Date(job.startTime).toLocaleTimeString()}
													</p>
												</div>
												<Badge variant={getUrgencyVariant(job.urgency)} className="text-xs">
													{job.urgency}
												</Badge>
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base">Active Providers</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{providers
										.filter((p) => p.isActive)
										.map((provider) => (
											<div key={provider.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
												<div>
													<p className="font-medium text-sm">{provider.name}</p>
													<p className="text-xs text-gray-600">
														{provider.currentJob ? 'On job' : 'Available'}
													</p>
												</div>
												<div className="flex items-center space-x-2">
													<div
														className={`w-2 h-2 rounded-full ${
															provider.isAvailable ? 'bg-green-500' : 'bg-red-500'
														}`}
													></div>
													{provider.eta && <span className="text-xs text-gray-600">{provider.eta}m</span>}
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base">Quick Actions</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Button className="w-full" size="sm">
										Auto-Assign Open Jobs
									</Button>
									<Button variant="outline" className="w-full" size="sm">
										Send Provider Updates
									</Button>
									<Button variant="outline" className="w-full" size="sm">
										Export Daily Report
									</Button>
									<Button variant="outline" className="w-full" size="sm">
										Emergency Dispatch
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="list" className="space-y-4">
					<div className="space-y-4">
						{liveJobs.map((job) => (
							<Card key={job.id}>
								<CardContent className="p-6">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center space-x-3 mb-3">
												<div className={`w-4 h-4 rounded-full ${getStatusColor(job.status)}`}></div>
												<h3 className="font-semibold">{job.customer.name}</h3>
												<Badge variant={getUrgencyVariant(job.urgency)}>{job.urgency} priority</Badge>
												<Badge variant="outline">{job.status.replace('_', ' ')}</Badge>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
												<div>
													<p className="text-sm font-medium mb-1">Customer Info</p>
													<div className="text-sm text-gray-600">
														<div className="flex items-center space-x-1 mb-1">
															<MapPin className="w-3 h-3" />
															<span>{job.customer.address}</span>
														</div>
														<div className="flex items-center space-x-1">
															<Phone className="w-3 h-3" />
															<span>{job.customer.phone}</span>
														</div>
													</div>
												</div>
												<div>
													<p className="text-sm font-medium mb-1">Service Details</p>
													<div className="text-sm text-gray-600">
														<div className="flex items-center space-x-1 mb-1">
															<Clock className="w-3 h-3" />
															<span>
																{new Date(job.startTime).toLocaleTimeString()} ({job.service.duration}h)
															</span>
														</div>
														<div>${job.service.price} - {job.service.name}</div>
													</div>
												</div>
												<div>
													<p className="text-sm font-medium mb-1">Provider</p>
													<div className="text-sm text-gray-600">
														{job.provider ? (
															<div>
																<div className="flex items-center space-x-1 mb-1">
																	<User className="w-3 h-3" />
																	<span>{job.provider.name}</span>
																</div>
																<div className="flex items-center space-x-1">
																	<Phone className="w-3 h-3" />
																	<span>{job.provider.phone}</span>
																</div>
																{job.provider.eta && (
																	<div className="text-xs text-blue-600 mt-1">ETA: {job.provider.eta} minutes</div>
																)}
															</div>
														) : (
															<span className="text-red-600">Not assigned</span>
														)}
													</div>
												</div>
											</div>
											{job.notes && (
												<div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
													<p className="text-sm text-yellow-800">{job.notes}</p>
												</div>
											)}
										</div>
										<div className="flex flex-col space-y-2 ml-4">
											{!job.provider && (
												<Select onValueChange={(providerId) => assignProvider(job.id, providerId)}>
													<SelectTrigger className="w-40">
														<SelectValue placeholder="Assign Provider" />
													</SelectTrigger>
													<SelectContent>
														{providers
															.filter((p) => p.isAvailable)
															.map((p) => (
																<SelectItem key={p.id} value={p.id}>
																	{p.name}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											)}
											<div className="flex space-x-1">
												{job.status === 'scheduled' && (
													<Button size="sm" onClick={() => updateJobStatus(job.id, 'en_route')}>Start</Button>
												)}
												{job.status === 'en_route' && (
													<Button size="sm" onClick={() => updateJobStatus(job.id, 'in_progress')}>Begin Service</Button>
												)}
												{job.status === 'in_progress' && (
													<Button size="sm" onClick={() => updateJobStatus(job.id, 'completed')}>Complete</Button>
												)}
												<Button size="sm" variant="outline">Contact</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="providers" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{providers.map((provider) => (
							<Card key={provider.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-base">{provider.name}</CardTitle>
										<div className={`w-3 h-3 rounded-full ${provider.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Status:</span>
											<span className={provider.isAvailable ? 'text-green-600' : 'text-red-600'}>
												{provider.currentJob ? `On Job #${provider.currentJob}` : 'Available'}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Jobs Today:</span>
											<span>{provider.todayJobs || 0}</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Rating:</span>
											<span>⭐ {provider.rating || 0}/5</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Location:</span>
											<span className="text-gray-600">
												{provider.location?.distance ? `${provider.location.distance}mi away` : 'Unknown'}
											</span>
										</div>
										{provider.nextJob && (
											<div className="flex justify-between text-sm">
												<span>Next Job:</span>
												<span className="text-blue-600">{provider.nextJob}</span>
											</div>
										)}
									</div>
									<div className="flex space-x-2 mt-4">
										<Button size="sm" variant="outline" className="flex-1">
											<Phone className="w-3 h-3 mr-1" />
											Call
										</Button>
										<Button size="sm" variant="outline" className="flex-1">
											<MapPin className="w-3 h-3 mr-1" />
											Locate
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="unassigned" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Unassigned Jobs ({unassignedJobs.length})</CardTitle>
												<Button onClick={handleAutoAssignAll}>
									<AlertCircle className="w-4 h-4 mr-2" />
									Auto-Assign All
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{unassignedJobs.length === 0 ? (
								<div className="text-center py-8">
									<CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
									<p className="text-lg font-semibold">All jobs assigned!</p>
									<p className="text-gray-600">Great work keeping up with the demand.</p>
								</div>
							) : (
								<div className="space-y-4">
									{unassignedJobs.map((job) => (
										<div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
											<div>
												<div className="flex items-center space-x-2 mb-2">
													<h3 className="font-semibold">{job.customer.name}</h3>
													<Badge variant={getUrgencyVariant(job.urgency)}>{job.urgency}</Badge>
												</div>
												<div className="text-sm text-gray-600">
													<p>{new Date(job.startTime).toLocaleTimeString()} - {job.service.name}</p>
													<p>{job.customer.address}</p>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<Select onValueChange={(providerId) => assignProvider(job.id, providerId)}>
													<SelectTrigger className="w-48">
														<SelectValue placeholder="Select provider" />
													</SelectTrigger>
													<SelectContent>
														{providers
															.filter((p) => p.isAvailable)
															.map((p) => (
																<SelectItem key={p.id} value={p.id}>
																	<div className="flex items-center justify-between w-full">
																		<span>{p.name}</span>
																		<span className="text-xs text-gray-500 ml-2">
																			{p.location?.distance ?? '-'}mi
																		</span>
																	</div>
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="teams" className="space-y-4">
					<TeamManagement />
				</TabsContent>

				<TabsContent value="schedule" className="space-y-4">
					<ScheduleManagement />
				</TabsContent>
			</Tabs>
		</div>
	)
}


