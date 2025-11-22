'use client'

import { useEffect, useState } from 'react'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import { LiveDashboard } from '@/components/operations/LiveDashboard'
import { NotificationCenter } from '@/components/operations/NotificationCenter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
	Activity, 
	Users, 
	Clock, 
	CheckCircle, 
	AlertTriangle, 
	Calendar,
	Settings,
	BarChart3,
	TrendingUp,
	Zap,
	RefreshCcw
} from 'lucide-react'

interface DashboardStats {
	totalJobs: number
	completedJobs: number
	activeJobs: number
	availableProviders: number
	unassignedJobs: number
	averageResponseTime: number
	customerSatisfaction: number
	revenueToday: number
}

interface RecentActivity {
	id: string
	type: 'job_assigned' | 'job_completed' | 'provider_joined' | 'payment_processed'
	message: string
	timestamp: string
	relatedId?: string
}

export default function OperationsPage() {
	// Remove user state for now - will be handled by EnsureDashboardUser
	const user = { id: 'temp' }
	const [stats, setStats] = useState<DashboardStats>({
		totalJobs: 0,
		completedJobs: 0,
		activeJobs: 0,
		availableProviders: 0,
		unassignedJobs: 0,
		averageResponseTime: 0,
		customerSatisfaction: 0,
		revenueToday: 0,
	})
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
	const [loading, setLoading] = useState(true)
	const [lastUpdated, setLastUpdated] = useState(new Date())

	useEffect(() => {
		fetchDashboardStats()
		fetchRecentActivity()
		
		// Auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchDashboardStats()
			fetchRecentActivity()
			setLastUpdated(new Date())
		}, 30000)

		return () => clearInterval(interval)
	}, [])

	const fetchDashboardStats = async () => {
		try {
			const response = await fetch('/api/operations/stats')
			if (response.ok) {
				const data = await response.json()
				setStats(data)
			}
		} catch (error) {
			console.error('Error fetching dashboard stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchRecentActivity = async () => {
		try {
			const response = await fetch('/api/operations/activity')
			if (response.ok) {
				const data = await response.json()
				setRecentActivity(data.activities || [])
			}
		} catch (error) {
			console.error('Error fetching recent activity:', error)
		}
	}

	const handleRefresh = async () => {
		setLoading(true)
		await Promise.all([fetchDashboardStats(), fetchRecentActivity()])
		setLastUpdated(new Date())
	}

	const getActivityIcon = (type: RecentActivity['type']) => {
		switch (type) {
			case 'job_assigned':
				return <Users className="w-4 h-4 text-blue-500" />
			case 'job_completed':
				return <CheckCircle className="w-4 h-4 text-green-500" />
			case 'provider_joined':
				return <Users className="w-4 h-4 text-purple-500" />
			case 'payment_processed':
				return <TrendingUp className="w-4 h-4 text-green-500" />
			default:
				return <Activity className="w-4 h-4 text-gray-500" />
		}
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount)
	}

	const formatTime = (minutes: number) => {
		const hours = Math.floor(minutes / 60)
		const mins = minutes % 60
		if (hours > 0) {
			return `${hours}h ${mins}m`
		}
		return `${mins}m`
	}

	if (loading && stats.totalJobs === 0) {
		return (
			<EnsureDashboardUser>
				<div className="flex items-center justify-center min-h-screen">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
				</div>
			</EnsureDashboardUser>
		)
	}

	return (
		<EnsureDashboardUser>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-white shadow-sm border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center py-6">
							<div>
								<h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
								<p className="mt-1 text-sm text-gray-500">
									Real-time monitoring and management of cleaning operations
								</p>
							</div>
							<div className="flex items-center space-x-4">
								<div className="text-sm text-gray-500">
									Last updated: {lastUpdated.toLocaleTimeString()}
								</div>
								<Button 
									variant="outline" 
									size="sm" 
									onClick={handleRefresh}
									disabled={loading}
								>
									<RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
									Refresh
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* Quick Stats */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Total Jobs Today</p>
										<p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
									</div>
									<div className="p-3 bg-blue-100 rounded-full">
										<Calendar className="w-6 h-6 text-blue-600" />
									</div>
								</div>
								<div className="mt-4 flex items-center">
									{stats.unassignedJobs > 0 ? (
										<>
											<AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
											<span className="text-sm text-red-600">
												{stats.unassignedJobs} unassigned
											</span>
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4 text-green-500 mr-1" />
											<span className="text-sm text-green-600">All assigned</span>
										</>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Active Jobs</p>
										<p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
									</div>
									<div className="p-3 bg-yellow-100 rounded-full">
										<Activity className="w-6 h-6 text-yellow-600" />
									</div>
								</div>
								<div className="mt-4">
									<span className="text-sm text-gray-600">
										{stats.completedJobs} completed
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Available Providers</p>
										<p className="text-2xl font-bold text-gray-900">{stats.availableProviders}</p>
									</div>
									<div className="p-3 bg-green-100 rounded-full">
										<Users className="w-6 h-6 text-green-600" />
									</div>
								</div>
								<div className="mt-4">
									<span className="text-sm text-green-600">Ready for assignment</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Revenue Today</p>
										<p className="text-2xl font-bold text-gray-900">
											{formatCurrency(stats.revenueToday)}
										</p>
									</div>
									<div className="p-3 bg-purple-100 rounded-full">
										<TrendingUp className="w-6 h-6 text-purple-600" />
									</div>
								</div>
								<div className="mt-4">
									<span className="text-sm text-gray-600">From {stats.completedJobs} jobs</span>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Performance Metrics */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Clock className="w-5 h-5 mr-2" />
									Response Time
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-600">
									{formatTime(stats.averageResponseTime)}
								</div>
								<p className="text-sm text-gray-600 mt-1">Average assignment time</p>
								<div className="mt-4">
									<Badge variant={stats.averageResponseTime <= 15 ? "default" : "destructive"}>
										{stats.averageResponseTime <= 15 ? "Excellent" : "Needs Improvement"}
									</Badge>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<BarChart3 className="w-5 h-5 mr-2" />
									Customer Satisfaction
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-600">
									{stats.customerSatisfaction.toFixed(1)}⭐
								</div>
								<p className="text-sm text-gray-600 mt-1">Average rating</p>
								<div className="mt-4">
									<Badge variant={stats.customerSatisfaction >= 4.5 ? "default" : "secondary"}>
										{stats.customerSatisfaction >= 4.5 ? "Excellent" : "Good"}
									</Badge>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<Zap className="w-5 h-5 mr-2" />
									Efficiency
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-purple-600">
									{stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%
								</div>
								<p className="text-sm text-gray-600 mt-1">Completion rate</p>
								<div className="mt-4">
									<Badge variant={stats.totalJobs > 0 && (stats.completedJobs / stats.totalJobs) >= 0.9 ? "default" : "secondary"}>
										{stats.totalJobs > 0 && (stats.completedJobs / stats.totalJobs) >= 0.9 ? "High" : "Moderate"}
									</Badge>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main Dashboard Tabs */}
					<Tabs defaultValue="dashboard" className="space-y-6">
						<TabsList className="grid w-full grid-cols-5">
							<TabsTrigger value="dashboard">Dashboard</TabsTrigger>
							<TabsTrigger value="jobs">Live Jobs</TabsTrigger>
							<TabsTrigger value="notifications">Notifications</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
							<TabsTrigger value="settings">Settings</TabsTrigger>
						</TabsList>

						<TabsContent value="dashboard" className="space-y-6">
							<LiveDashboard />
						</TabsContent>

						<TabsContent value="jobs" className="space-y-6">
							<LiveDashboard />
						</TabsContent>

						<TabsContent value="notifications" className="space-y-6">
							<NotificationCenter 
								userId={user.id} 
								maxHeight="600px"
								showMarkAllRead={true}
							/>
						</TabsContent>

						<TabsContent value="activity" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<Activity className="w-5 h-5 mr-2" />
										Recent Activity
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{recentActivity.length === 0 ? (
											<div className="text-center py-8 text-gray-500">
												<Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
												<p>No recent activity</p>
											</div>
										) : (
											recentActivity.map((activity) => (
												<div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
													<div className="mt-1">
														{getActivityIcon(activity.type)}
													</div>
													<div className="flex-1">
														<p className="text-sm font-medium text-gray-900">
															{activity.message}
														</p>
														<p className="text-xs text-gray-500 mt-1">
															{new Date(activity.timestamp).toLocaleString()}
														</p>
													</div>
												</div>
											))
										)}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="settings" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<Settings className="w-5 h-5 mr-2" />
										Dashboard Settings
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-medium mb-4">Auto-Assignment Settings</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Assignment Strategy
													</label>
													<select className="w-full px-3 py-2 border border-gray-300 rounded-md">
														<option value="balanced">Balanced (Distance + Workload + Rating)</option>
														<option value="distance">Closest Provider</option>
														<option value="workload">Least Busy Provider</option>
														<option value="rating">Highest Rated Provider</option>
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Auto-Assignment
													</label>
													<select className="w-full px-3 py-2 border border-gray-300 rounded-md">
														<option value="manual">Manual Assignment Only</option>
														<option value="auto">Automatic Assignment</option>
													</select>
												</div>
											</div>
										</div>

										<div>
											<h3 className="text-lg font-medium mb-4">Notification Settings</h3>
											<div className="space-y-3">
												<label className="flex items-center">
													<input type="checkbox" className="mr-3" defaultChecked />
													<span className="text-sm">Email notifications for unassigned jobs</span>
												</label>
												<label className="flex items-center">
													<input type="checkbox" className="mr-3" defaultChecked />
													<span className="text-sm">SMS alerts for urgent jobs</span>
												</label>
												<label className="flex items-center">
													<input type="checkbox" className="mr-3" />
													<span className="text-sm">Push notifications for status changes</span>
												</label>
											</div>
										</div>

										<div>
											<h3 className="text-lg font-medium mb-4">Display Settings</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Refresh Interval
													</label>
													<select className="w-full px-3 py-2 border border-gray-300 rounded-md">
														<option value="30">30 seconds</option>
														<option value="60">1 minute</option>
														<option value="300">5 minutes</option>
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">
														Default View
													</label>
													<select className="w-full px-3 py-2 border border-gray-300 rounded-md">
														<option value="map">Map View</option>
														<option value="list">List View</option>
														<option value="calendar">Calendar View</option>
													</select>
												</div>
											</div>
										</div>

										<div className="pt-4 border-t">
											<Button>Save Settings</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</EnsureDashboardUser>
	)
}

