 'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Settings, Building, Users, Calendar, Mail, TrendingUp } from 'lucide-react'

type Company = { id: string; name: string }

export function CompanyDashboard({ companyId }: { companyId: string }) {
	const [company, setCompany] = useState<Company | null>(null)
	const [properties, setProperties] = useState<any[]>([])
	const [analytics, setAnalytics] = useState<any | null>(null)
	const [reports, setReports] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchCompanyData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [companyId])

	const fetchCompanyData = async () => {
		try {
			const [companyRes, propertiesRes, analyticsRes, reportsRes] = await Promise.all([
				fetch(`/api/companies/${companyId}`),
				fetch(`/api/companies/${companyId}/properties`),
				fetch(`/api/companies/${companyId}/analytics`),
				fetch(`/api/companies/${companyId}/reports`),
			])

			const [companyData, propertiesData, analyticsData, reportsData] = await Promise.all([
				companyRes.json(),
				propertiesRes.json(),
				analyticsRes.json(),
				reportsRes.json(),
			])

			setCompany(companyData)
			setProperties(Array.isArray(propertiesData) ? propertiesData : [])
			setAnalytics(analyticsData)
			setReports(Array.isArray(reportsData) ? reportsData : [])
		} catch (error) {
			console.error('Error fetching company data:', error)
		} finally {
			setLoading(false)
		}
	}

	const generateReport = async (propertyId?: string) => {
		try {
			const response = await fetch('/api/reports/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					companyId,
					propertyId,
					period: 'last_30_days',
				}),
			})
			if (!response.ok) {
				throw new Error('Failed to generate report')
			}
			const { reportUrl } = await response.json()
			if (reportUrl) window.open(reportUrl, '_blank')
			// Refresh recent reports
			fetch(`/api/companies/${companyId}/reports`).then((r) => r.json()).then(setReports)
		} catch (error) {
			console.error('Error generating report:', error)
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
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">{company?.name ?? 'Company'}</h1>
					<p className="text-gray-600">{properties.length} properties managed</p>
				</div>
				<div className="flex space-x-3">
					<Button variant="outline" onClick={() => generateReport()}>
						<Download className="w-4 h-4 mr-2" />
						Generate Report
					</Button>
					<Button>
						<Settings className="w-4 h-4 mr-2" />
						Settings
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Properties</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{properties.length}</div>
						<p className="text-xs text-muted-foreground">
							{analytics?.propertyGrowth > 0 ? '+' : ''}
							{analytics?.propertyGrowth ?? 0}% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">This Month's Cleanings</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics?.thisMonthJobs ?? 0}</div>
						<p className="text-xs text-muted-foreground">
							{analytics?.jobGrowth > 0 ? '+' : ''}
							{analytics?.jobGrowth ?? 0}% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							${(analytics?.thisMonthSpend ?? 0).toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							{analytics?.spendGrowth > 0 ? '+' : ''}
							{analytics?.spendGrowth ?? 0}% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{Number(analytics?.averageRating ?? 0).toFixed(1)}
						</div>
						<p className="text-xs text-muted-foreground">
							⭐ From {analytics?.totalReviews ?? 0} reviews
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="reports" className="space-y-4">
				<TabsList>
					<TabsTrigger value="reports">Reports</TabsTrigger>
					<TabsTrigger value="properties">Properties</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="reports" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Reports & Documentation</h3>
						<div className="flex space-x-2">
							<Button variant="outline" onClick={() => generateReport()}>
								<Download className="w-4 h-4 mr-2" />
								Generate Report
							</Button>
						</div>
					</div>
					<div className="space-y-4">
						{reports.map((report) => (
							<Card key={report.id}>
								<CardContent className="flex items-center justify-between p-6">
									<div className="flex items-center space-x-4">
										<Calendar className="w-8 h-8 text-blue-500" />
										<div>
											<h4 className="font-semibold">
												{report.property_name || 'All Properties'} Report
											</h4>
											<p className="text-sm text-gray-600">
												{report.period_start
													? new Date(report.period_start).toLocaleDateString()
													: '-'}{' '}
												-{' '}
												{report.period_end
													? new Date(report.period_end).toLocaleDateString()
													: '-'}
											</p>
											<div className="flex space-x-4 mt-1 text-xs text-gray-500">
												<span>{report.summary?.totalJobs ?? 0} cleanings</span>
												<span>
													${Number(report.summary?.totalCost ?? 0).toFixed(2)} total
												</span>
												<span>
													⭐ {Number(report.summary?.averageRating ?? 0).toFixed(1)}/5
												</span>
											</div>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Badge variant="outline">
											{report.created_at
												? new Date(report.created_at).toLocaleDateString()
												: ''}
										</Badge>
										{report.pdf_url && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => window.open(report.pdf_url, '_blank')}
											>
												<Download className="w-4 h-4 mr-1" />
												Download
											</Button>
										)}
										<Button size="sm" variant="outline">
											<Mail className="w-4 h-4 mr-1" />
											Share
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
						{reports.length === 0 && (
							<Card>
								<CardContent className="p-6 text-center text-gray-600">
									No reports yet. Generate your first report to see it here.
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				<TabsContent value="properties" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{properties.map((property) => (
							<Card key={property.id}>
								<CardHeader>
									<CardTitle className="text-base">{property.name}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<p className="text-sm text-gray-600">
											{property.address?.line1}, {property.address?.city}
										</p>
										<div className="flex space-x-2 mt-4">
											<Button size="sm" variant="outline" className="flex-1" onClick={() => generateReport(property.id)}>
												<Download className="w-3 h-3 mr-1" />
												Report
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="p-3 bg-gray-50 rounded">
									<span className="block text-gray-600">Completed Jobs (30d)</span>
									<span className="text-xl font-bold">
										{analytics?.activityChart?.reduce((s: number, d: any) => s + d.jobs, 0) ?? 0}
									</span>
								</div>
								<div className="p-3 bg-gray-50 rounded">
									<span className="block text-gray-600">Total Spend (6m)</span>
									<span className="text-xl font-bold">
										$
										{(analytics?.spendingChart?.reduce((s: number, d: any) => s + d.amount, 0) ?? 0).toLocaleString()}
									</span>
								</div>
								<div className="p-3 bg-gray-50 rounded">
									<span className="block text-gray-600">Completion Rate (30d)</span>
									<span className="text-xl font-bold">
										{analytics?.performance?.completionRate ?? 0}%
									</span>
								</div>
								<div className="p-3 bg-gray-50 rounded">
									<span className="block text-gray-600">Churn Risk (est.)</span>
									<span className="text-xl font-bold">
										{analytics?.churnPrediction?.length ?? 0}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Revenue (12 months)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
								{(analytics?.revenueAnalytics ?? []).slice(-8).map((row: any) => (
									<div key={row.month} className="p-3 bg-gray-50 rounded flex items-center justify-between">
										<span className="text-gray-600">{row.month}</span>
										<span className="font-semibold">${Number(row.revenue || 0).toLocaleString()}</span>
									</div>
								))}
								{(!analytics?.revenueAnalytics || analytics?.revenueAnalytics.length === 0) && (
									<div className="text-gray-500">No revenue data yet.</div>
								)}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Demand Forecast (next 4 weeks)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
								{(analytics?.demandForecasting?.next4Weeks ?? []).map((v: number, i: number) => (
									<div key={i} className="p-3 bg-gray-50 rounded flex items-center justify-between">
										<span className="text-gray-600">Week {i + 1}</span>
										<span className="font-semibold">{v}</span>
									</div>
								))}
								{(!analytics?.demandForecasting || (analytics?.demandForecasting?.next4Weeks ?? []).length === 0) && (
									<div className="text-gray-500">No forecast available.</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}


