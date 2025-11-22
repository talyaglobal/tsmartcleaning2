'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, Column } from '@/components/admin/DataTable'
import { Award, TrendingUp, Star, Clock, Target, Users } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type PerformanceMetric = {
	memberId: string
	memberName: string
	jobsCompleted: number
	completionRate: number
	averageRating: number
	hoursWorked: number
	onTimeRate: number
}

export default function AmbassadorPerformancePage() {
	const { user } = useAuth()
	const [performance, setPerformance] = useState<PerformanceMetric[]>([])
	const [loading, setLoading] = useState(true)
	const [period, setPeriod] = useState('30')

	useEffect(() => {
		if (user?.id) {
			fetchPerformance()
		}
	}, [user?.id, period])

	const fetchPerformance = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const response = await fetch(`/api/ambassador/performance?ambassadorId=${user.id}&period=${period}`)
			const data = await response.json()
			if (data.performance) {
				setPerformance(data.performance.map((p: any) => ({
					memberId: p.member_id || p.id,
					memberName: p.member_name || p.name || 'N/A',
					jobsCompleted: p.jobs_completed || 0,
					completionRate: p.completion_rate || 0,
					averageRating: p.average_rating || 0,
					hoursWorked: p.hours_worked || 0,
					onTimeRate: p.on_time_rate || 0,
				})))
			}
		} catch (error) {
			console.error('Error fetching performance:', error)
		} finally {
			setLoading(false)
		}
	}

	const avgMetrics = {
		completionRate: performance.reduce((sum, p) => sum + p.completionRate, 0) / (performance.length || 1),
		averageRating: performance.reduce((sum, p) => sum + p.averageRating, 0) / (performance.length || 1),
		totalHours: performance.reduce((sum, p) => sum + p.hoursWorked, 0),
		onTimeRate: performance.reduce((sum, p) => sum + p.onTimeRate, 0) / (performance.length || 1),
	}

	const chartData = performance.map(p => ({
		name: p.memberName.split(' ')[0],
		jobs: p.jobsCompleted,
		rating: p.averageRating,
		hours: p.hoursWorked,
	}))

	const columns: Column<PerformanceMetric>[] = [
		{ key: 'memberName', label: 'Team Member' },
		{ key: 'jobsCompleted', label: 'Jobs Completed' },
		{ 
			key: 'completionRate', 
			label: 'Completion Rate',
			render: (metric) => `${metric.completionRate.toFixed(1)}%`
		},
		{ 
			key: 'averageRating', 
			label: 'Rating',
			render: (metric) => (
				<div className="flex items-center gap-1">
					<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
					<span>{metric.averageRating.toFixed(1)}</span>
				</div>
			)
		},
		{ 
			key: 'hoursWorked', 
			label: 'Hours Worked',
			render: (metric) => `${metric.hoursWorked.toFixed(1)}h`
		},
		{ 
			key: 'onTimeRate', 
			label: 'On-Time Rate',
			render: (metric) => `${metric.onTimeRate.toFixed(1)}%`
		},
	]

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Team Performance"
				description="Track your team's performance metrics"
				action={
					<Select value={period} onValueChange={setPeriod}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select period" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7">Last 7 days</SelectItem>
							<SelectItem value="30">Last 30 days</SelectItem>
							<SelectItem value="90">Last 90 days</SelectItem>
							<SelectItem value="365">Last year</SelectItem>
						</SelectContent>
					</Select>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Target className="h-4 w-4" />
							Completion Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{avgMetrics.completionRate.toFixed(1)}%</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Star className="h-4 w-4" />
							Avg Rating
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{avgMetrics.averageRating.toFixed(1)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Clock className="h-4 w-4" />
							Total Hours
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{avgMetrics.totalHours.toFixed(0)}h</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<TrendingUp className="h-4 w-4" />
							On-Time Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{avgMetrics.onTimeRate.toFixed(1)}%</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Jobs Completed</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="jobs" fill="#0088FE" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Ratings Trend</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis domain={[0, 5]} />
								<Tooltip />
								<Line type="monotone" dataKey="rating" stroke="#00C49F" strokeWidth={2} />
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Performance Details</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						data={performance}
						columns={columns}
						searchKeys={['memberName']}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
