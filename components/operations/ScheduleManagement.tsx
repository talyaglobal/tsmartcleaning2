'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, User } from 'lucide-react'

interface ScheduleItem {
	id: string
	booking_date: string
	booking_time: string
	duration_hours: number
	status: string
	customer: {
		id: string
		full_name: string
		phone?: string
	}
	provider?: {
		id: string
		business_name: string
	}
	service?: {
		name: string
	}
	address?: {
		street_address: string
		city: string
		state: string
		zip_code: string
	}
}

export function ScheduleManagement() {
	const [schedule, setSchedule] = useState<ScheduleItem[]>([])
	const [loading, setLoading] = useState(true)
	const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
	const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
	const [selectedProvider, setSelectedProvider] = useState<string>('all')
	const [selectedTeam, setSelectedTeam] = useState<string>('all')

	useEffect(() => {
		fetchSchedule()
	}, [startDate, endDate, selectedProvider, selectedTeam])

	const fetchSchedule = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams({
				startDate,
				endDate,
			})
			if (selectedProvider !== 'all') {
				params.append('providerId', selectedProvider)
			}
			if (selectedTeam !== 'all') {
				params.append('teamId', selectedTeam)
			}

			const res = await fetch(`/api/operations/schedule?${params.toString()}`)
			if (res.ok) {
				const data = await res.json()
				setSchedule(data.schedule || [])
			}
		} catch (e) {
			console.error('Error fetching schedule:', e)
		} finally {
			setLoading(false)
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'confirmed':
				return 'bg-blue-500'
			case 'in-progress':
				return 'bg-green-500'
			case 'completed':
				return 'bg-gray-500'
			case 'cancelled':
				return 'bg-red-500'
			default:
				return 'bg-gray-400'
		}
	}

	// Group schedule by date
	const scheduleByDate = schedule.reduce((acc, item) => {
		const date = item.booking_date
		if (!acc[date]) {
			acc[date] = []
		}
		acc[date].push(item)
		return acc
	}, {} as Record<string, ScheduleItem[]>)

	if (loading) {
		return <div className="p-6">Loading schedule...</div>
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Schedule Management</h2>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label className="text-sm font-medium mb-1 block">Start Date</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full px-3 py-2 border rounded-md"
							/>
						</div>
						<div>
							<label className="text-sm font-medium mb-1 block">End Date</label>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full px-3 py-2 border rounded-md"
							/>
						</div>
						<div>
							<label className="text-sm font-medium mb-1 block">Provider</label>
							<Select value={selectedProvider} onValueChange={setSelectedProvider}>
								<SelectTrigger>
									<SelectValue placeholder="All Providers" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Providers</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium mb-1 block">Team</label>
							<Select value={selectedTeam} onValueChange={setSelectedTeam}>
								<SelectTrigger>
									<SelectValue placeholder="All Teams" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Teams</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="space-y-6">
				{Object.keys(scheduleByDate).length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center">
							<Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600">No bookings scheduled for this period.</p>
						</CardContent>
					</Card>
				) : (
					Object.entries(scheduleByDate)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([date, items]) => (
							<Card key={date}>
								<CardHeader>
									<CardTitle>
										{new Date(date).toLocaleDateString('en-US', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{items.map((item) => (
											<div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
												<div className="flex-1">
													<div className="flex items-center space-x-3 mb-2">
														<div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
														<span className="font-medium">
															{new Date(`${item.booking_date}T${item.booking_time}`).toLocaleTimeString('en-US', {
																hour: 'numeric',
																minute: '2-digit',
															})}
														</span>
														<Badge variant="outline">{item.status}</Badge>
													</div>
													<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
														<div>
															<p className="font-medium mb-1">Customer</p>
															<p className="text-gray-600">{item.customer.full_name}</p>
															{item.customer.phone && <p className="text-gray-500 text-xs">{item.customer.phone}</p>}
														</div>
														<div>
															<p className="font-medium mb-1">Service</p>
															<p className="text-gray-600">{item.service?.name || 'N/A'}</p>
															<p className="text-gray-500 text-xs">
																<Clock className="w-3 h-3 inline mr-1" />
																{item.duration_hours}h
															</p>
														</div>
														<div>
															<p className="font-medium mb-1">Provider</p>
															<p className="text-gray-600">{item.provider?.business_name || 'Unassigned'}</p>
															{item.address && (
																<p className="text-gray-500 text-xs">
																	<MapPin className="w-3 h-3 inline mr-1" />
																	{item.address.city}, {item.address.state}
																</p>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))
				)}
			</div>
		</div>
	)
}

