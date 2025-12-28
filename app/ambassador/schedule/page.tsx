'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'

type ScheduleItem = {
	id: string
	date: string
	time: string
	jobId: string
	customerName: string
	assignedMembers: string[]
	status: string
	address: string
	duration: number
}

export default function AmbassadorSchedulePage() {
	const { user } = useAuth()
	const [schedule, setSchedule] = useState<ScheduleItem[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [currentWeek, setCurrentWeek] = useState<Date>(new Date())

	useEffect(() => {
		if (user?.id) {
			fetchSchedule()
		}
	}, [user?.id, currentWeek])

	const fetchSchedule = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const weekStart = startOfWeek(currentWeek)
			const weekEnd = addDays(weekStart, 7)
			
			const response = await fetch(
				`/api/ambassador/schedule?ambassadorId=${user.id}&startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
			)
			const data = await response.json()
			if (data.schedule) {
				setSchedule(data.schedule.map((s: any) => ({
					id: s.id,
					date: s.date || s.booking_date,
					time: s.time || s.booking_time,
					jobId: s.job_id || s.id,
					customerName: s.customer_name || s.customer?.full_name || 'N/A',
					assignedMembers: s.assigned_members || [],
					status: s.status || 'scheduled',
					address: s.address || `${s.street_address}, ${s.city}`,
					duration: s.duration_hours || s.duration || 0,
				})))
			}
		} catch (error) {
			console.error('Error fetching schedule:', error)
		} finally {
			setLoading(false)
		}
	}

	const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentWeek), i))
	
	const getJobsForDay = (date: Date) => {
		return schedule.filter(item => isSameDay(new Date(item.date), date))
	}

	const navigateWeek = (direction: 'prev' | 'next') => {
		setCurrentWeek(addDays(currentWeek, direction === 'next' ? 7 : -7))
	}

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Schedule"
				subtitle="View and manage your team's schedule"
				actions={
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
							Today
						</Button>
						<Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				}
			/>

			<div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
				{weekDays.map((day, index) => {
					const dayJobs = getJobsForDay(day)
					const isToday = isSameDay(day, new Date())
					
					return (
						<Card key={index} className={isToday ? 'border-primary' : ''}>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">
									{format(day, 'EEE')}
								</CardTitle>
								<p className="text-xs text-muted-foreground">
									{format(day, 'MMM d')}
								</p>
							</CardHeader>
							<CardContent className="space-y-2">
								{dayJobs.length === 0 ? (
									<p className="text-xs text-muted-foreground text-center py-4">
										No jobs scheduled
									</p>
								) : (
									dayJobs.map((job) => (
										<div
											key={job.id}
											className="p-2 bg-muted rounded-md space-y-1 cursor-pointer hover:bg-muted/80 transition-colors"
										>
											<div className="flex items-center gap-1 text-xs font-medium">
												<Clock className="h-3 w-3" />
												{job.time}
											</div>
											<p className="text-xs font-semibold">{job.customerName}</p>
											<p className="text-xs text-muted-foreground truncate">{job.address}</p>
											<div className="flex items-center gap-1">
												<Users className="h-3 w-3 text-muted-foreground" />
												<span className="text-xs text-muted-foreground">
													{job.assignedMembers.length} member{job.assignedMembers.length !== 1 ? 's' : ''}
												</span>
											</div>
											<Badge variant="outline" className="text-xs">
												{job.status}
											</Badge>
										</div>
									))
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>
		</div>
	)
}
