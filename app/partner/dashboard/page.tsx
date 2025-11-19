'use client'

import React, { useEffect, useState } from 'react'
import { MetricCard } from '@/components/admin/MetricCard'
import { 
	DollarSign, 
	ClipboardList, 
	XCircle, 
	Users, 
	TrendingUp, 
	FileText, 
	Download, 
	Share2, 
	Copy,
	CheckCircle,
	Clock,
	AlertCircle,
	BarChart3,
	PieChart as PieChartIcon,
	Link as LinkIcon,
	Image as ImageIcon,
	FileImage
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createAnonSupabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

type PartnerMetrics = {
	gmv: number
	bookings: number
	cancellations: number
	cancellationRate: number
	period: number
}

type Referral = {
	id: string
	referredUserName: string
	referredUserEmail: string
	status: string
	commissionAmount: number
	createdAt: string
}

type ReferralSummary = {
	total: number
	completed: number
	pending: number
	totalCommission: number
}

type Commission = {
	id: string
	amount: number
	status: string
	created_at: string
	description?: string
}

type CommissionSummary = {
	total: number
	paid: number
	pending: number
	period: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function PartnerDashboard() {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [partnerId, setPartnerId] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState('overview')
	
	// Metrics
	const [metrics30d, setMetrics30d] = useState<PartnerMetrics | null>(null)
	const [metrics7d, setMetrics7d] = useState<PartnerMetrics | null>(null)
	
	// Referrals
	const [referrals, setReferrals] = useState<Referral[]>([])
	const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null)
	
	// Commissions
	const [commissions, setCommissions] = useState<Commission[]>([])
	const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null)
	
	// Referral code
	const [referralCode, setReferralCode] = useState<string>('')
	const [referralLink, setReferralLink] = useState<string>('')
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		initializeDashboard()
	}, [])

	const initializeDashboard = async () => {
		try {
			const supabase = createAnonSupabase()
			const { data: { user } } = await supabase.auth.getUser()
			
			if (!user) {
				setError('Please log in to access the dashboard')
				setLoading(false)
				return
			}

			setPartnerId(user.id)
			// Generate referral code from user ID (first 8 chars)
			const code = user.id.substring(0, 8).toUpperCase()
			setReferralCode(code)
			setReferralLink(`${window.location.origin}/signup?ref=${code}`)
			
			await Promise.all([
				fetchMetrics(user.id, '30'),
				fetchMetrics(user.id, '7'),
				fetchReferrals(user.id),
				fetchCommissions(user.id, '30')
			])
		} catch (err: any) {
			console.error('Error initializing dashboard:', err)
			setError('Failed to initialize dashboard. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const fetchMetrics = async (pid: string, period: string) => {
		try {
			const response = await fetch(`/api/partner/metrics?partnerId=${pid}&period=${period}`)
			if (!response.ok) throw new Error('Failed to fetch metrics')
			const data = await response.json()
			if (period === '30') {
				setMetrics30d(data.metrics)
			} else {
				setMetrics7d(data.metrics)
			}
		} catch (err) {
			console.error('Error fetching metrics:', err)
		}
	}

	const fetchReferrals = async (pid: string) => {
		try {
			const response = await fetch(`/api/partner/referrals?partnerId=${pid}`)
			if (!response.ok) throw new Error('Failed to fetch referrals')
			const data = await response.json()
			setReferrals(data.referrals || [])
			setReferralSummary(data.summary || null)
		} catch (err) {
			console.error('Error fetching referrals:', err)
		}
	}

	const fetchCommissions = async (pid: string, period: string) => {
		try {
			const response = await fetch(`/api/partner/commissions?partnerId=${pid}&period=${period}`)
			if (!response.ok) throw new Error('Failed to fetch commissions')
			const data = await response.json()
			setCommissions(data.commissions || [])
			setCommissionSummary(data.summary || null)
		} catch (err) {
			console.error('Error fetching commissions:', err)
		}
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			completed: 'default',
			pending: 'secondary',
			rejected: 'destructive'
		}
		return <Badge variant={variants[status] || 'default'}>{status}</Badge>
	}

	const exportReport = (type: 'referrals' | 'commissions') => {
		let data: any[] = []
		let filename = ''
		
		if (type === 'referrals') {
			data = referrals.map(r => ({
				Name: r.referredUserName,
				Email: r.referredUserEmail,
				Status: r.status,
				Commission: r.commissionAmount,
				Date: new Date(r.createdAt).toLocaleDateString()
			}))
			filename = `referrals-${new Date().toISOString().split('T')[0]}.csv`
		} else {
			data = commissions.map(c => ({
				Amount: c.amount,
				Status: c.status,
				Date: new Date(c.created_at).toLocaleDateString(),
				Description: c.description || ''
			}))
			filename = `commissions-${new Date().toISOString().split('T')[0]}.csv`
		}

		const headers = Object.keys(data[0] || {})
		const csv = [
			headers.join(','),
			...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
		].join('\n')

		const blob = new Blob([csv], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.click()
		window.URL.revokeObjectURL(url)
	}

	// Chart data
	const referralStatusData = referralSummary ? [
		{ name: 'Completed', value: referralSummary.completed },
		{ name: 'Pending', value: referralSummary.pending }
	].filter(d => d.value > 0) : []

	const commissionStatusData = commissionSummary ? [
		{ name: 'Paid', value: commissionSummary.paid },
		{ name: 'Pending', value: commissionSummary.pending }
	].filter(d => d.value > 0) : []

	const commissionTimelineData = commissions
		.filter(c => c.status === 'completed')
		.reduce((acc, c) => {
			const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
			acc[date] = (acc[date] || 0) + Number(c.amount)
			return acc
		}, {} as Record<string, number>)

	const commissionChartData = Object.entries(commissionTimelineData)
		.map(([date, amount]) => ({ date, amount }))
		.slice(-7)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

	if (loading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-xl font-semibold text-slate-900">Partner Dashboard</h1>
					<p className="text-sm text-slate-500">Loading dashboard data...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	const conversionRate = metrics30d && metrics30d.bookings > 0 
		? ((referralSummary?.completed || 0) / metrics30d.bookings * 100).toFixed(1)
		: '0.0'

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-semibold text-slate-900">Partner Dashboard</h1>
				<p className="text-sm text-slate-500">Track your referrals, commissions, and performance</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="referrals">Referrals</TabsTrigger>
					<TabsTrigger value="commissions">Commissions</TabsTrigger>
					<TabsTrigger value="marketing">Marketing</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6">
					{/* Key Metrics */}
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
						<MetricCard
							title="GMV (30d)"
							value={`$${metrics30d?.gmv.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`}
							subtitle={metrics7d ? `Last 7d: $${metrics7d.gmv.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : undefined}
							icon={<DollarSign className="w-6 h-6" />}
						/>
						<MetricCard
							title="Bookings (30d)"
							value={`${metrics30d?.bookings || 0}`}
							subtitle={metrics7d ? `Last 7d: ${metrics7d.bookings}` : undefined}
							icon={<ClipboardList className="w-6 h-6" />}
						/>
						<MetricCard
							title="Total Referrals"
							value={`${referralSummary?.total || 0}`}
							subtitle={`${referralSummary?.completed || 0} completed`}
							icon={<Users className="w-6 h-6" />}
						/>
						<MetricCard
							title="Total Commissions"
							value={`$${commissionSummary?.total.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}`}
							subtitle={`$${commissionSummary?.paid.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'} paid`}
							icon={<TrendingUp className="w-6 h-6" />}
						/>
					</div>

					{/* Partner-Specific Metrics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
								<CardDescription>Referral to booking conversion</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold">{conversionRate}%</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
								<CardDescription>Last 30 days</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold">{metrics30d?.cancellationRate || 0}%</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
								<CardDescription>Awaiting payment</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold">${commissionSummary?.pending.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}</div>
							</CardContent>
						</Card>
					</div>

					{/* Quick Stats */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Recent Referrals</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{referrals.slice(0, 5).map((referral) => (
										<div key={referral.id} className="flex items-center justify-between border-b pb-2">
											<div>
												<p className="font-medium">{referral.referredUserName}</p>
												<p className="text-sm text-slate-500">{referral.referredUserEmail}</p>
											</div>
											{getStatusBadge(referral.status)}
										</div>
									))}
									{referrals.length === 0 && (
										<p className="text-sm text-slate-500 text-center py-4">No referrals yet</p>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Recent Commissions</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{commissions.slice(0, 5).map((commission) => (
										<div key={commission.id} className="flex items-center justify-between border-b pb-2">
											<div>
												<p className="font-medium">${Number(commission.amount).toFixed(2)}</p>
												<p className="text-sm text-slate-500">
													{new Date(commission.created_at).toLocaleDateString()}
												</p>
											</div>
											{getStatusBadge(commission.status)}
										</div>
									))}
									{commissions.length === 0 && (
										<p className="text-sm text-slate-500 text-center py-4">No commissions yet</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Referrals Tab */}
				<TabsContent value="referrals" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Referral Tracking</CardTitle>
									<CardDescription>Track all your referrals and their status</CardDescription>
								</div>
								<Button variant="outline" onClick={() => exportReport('referrals')}>
									<Download className="w-4 h-4 mr-2" />
									Export
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{referralSummary && (
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold">{referralSummary.total}</div>
											<p className="text-xs text-slate-500 mt-1">Total Referrals</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold text-green-600">{referralSummary.completed}</div>
											<p className="text-xs text-slate-500 mt-1">Completed</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold text-yellow-600">{referralSummary.pending}</div>
											<p className="text-xs text-slate-500 mt-1">Pending</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold">${referralSummary.totalCommission.toFixed(2)}</div>
											<p className="text-xs text-slate-500 mt-1">Total Commission</p>
										</CardContent>
									</Card>
								</div>
							)}

							{referralStatusData.length > 0 && (
								<div className="mb-6">
									<ResponsiveContainer width="100%" height={200}>
										<PieChart>
											<Pie
												data={referralStatusData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{referralStatusData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}

							<div className="space-y-2">
								{referrals.map((referral) => (
									<div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<p className="font-medium">{referral.referredUserName}</p>
												{getStatusBadge(referral.status)}
											</div>
											<p className="text-sm text-slate-500 mt-1">{referral.referredUserEmail}</p>
											<p className="text-xs text-slate-400 mt-1">
												{new Date(referral.createdAt).toLocaleDateString()}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">${referral.commissionAmount.toFixed(2)}</p>
											<p className="text-xs text-slate-500">Commission</p>
										</div>
									</div>
								))}
								{referrals.length === 0 && (
									<div className="text-center py-8 text-slate-500">
										<Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p>No referrals yet. Share your referral link to get started!</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Commissions Tab */}
				<TabsContent value="commissions" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Commission Tracking</CardTitle>
									<CardDescription>View your commission history and earnings</CardDescription>
								</div>
								<Button variant="outline" onClick={() => exportReport('commissions')}>
									<Download className="w-4 h-4 mr-2" />
									Export
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{commissionSummary && (
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold">${commissionSummary.total.toFixed(2)}</div>
											<p className="text-xs text-slate-500 mt-1">Total Commissions</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold text-green-600">${commissionSummary.paid.toFixed(2)}</div>
											<p className="text-xs text-slate-500 mt-1">Paid</p>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="pt-6">
											<div className="text-2xl font-bold text-yellow-600">${commissionSummary.pending.toFixed(2)}</div>
											<p className="text-xs text-slate-500 mt-1">Pending</p>
										</CardContent>
									</Card>
								</div>
							)}

							{commissionChartData.length > 0 && (
								<div className="mb-6">
									<ResponsiveContainer width="100%" height={250}>
										<BarChart data={commissionChartData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
											<Bar dataKey="amount" fill="#0088FE" />
										</BarChart>
									</ResponsiveContainer>
								</div>
							)}

							<div className="space-y-2">
								{commissions.map((commission) => (
									<div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<p className="font-medium">${Number(commission.amount).toFixed(2)}</p>
												{getStatusBadge(commission.status)}
											</div>
											{commission.description && (
												<p className="text-sm text-slate-500 mt-1">{commission.description}</p>
											)}
											<p className="text-xs text-slate-400 mt-1">
												{new Date(commission.created_at).toLocaleDateString()}
											</p>
										</div>
										<div className="text-right">
											{commission.status === 'completed' ? (
												<CheckCircle className="w-5 h-5 text-green-600" />
											) : (
												<Clock className="w-5 h-5 text-yellow-600" />
											)}
										</div>
									</div>
								))}
								{commissions.length === 0 && (
									<div className="text-center py-8 text-slate-500">
										<DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p>No commissions yet. Start referring to earn commissions!</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Marketing Materials Tab */}
				<TabsContent value="marketing" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Your Referral Link</CardTitle>
								<CardDescription>Share this link to refer new customers</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-2">
									<Input 
										value={referralLink} 
										readOnly 
										className="flex-1 font-mono text-sm"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={() => copyToClipboard(referralLink)}
									>
										{copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
									</Button>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" className="flex-1" onClick={() => copyToClipboard(referralLink)}>
										<Copy className="w-4 h-4 mr-2" />
										Copy Link
									</Button>
									<Button variant="outline" className="flex-1" onClick={() => window.open(`mailto:?subject=Join tSmartCleaning&body=Sign up using my referral link: ${referralLink}`, '_blank')}>
										<Share2 className="w-4 h-4 mr-2" />
										Share via Email
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Your Referral Code</CardTitle>
								<CardDescription>Customers can use this code during signup</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-center">
									<div className="text-4xl font-bold tracking-wider bg-slate-100 px-6 py-4 rounded-lg">
										{referralCode}
									</div>
								</div>
								<Button 
									variant="outline" 
									className="w-full" 
									onClick={() => copyToClipboard(referralCode)}
								>
									<Copy className="w-4 h-4 mr-2" />
									Copy Code
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Marketing Assets</CardTitle>
								<CardDescription>Download marketing materials to promote tSmartCleaning</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button variant="outline" className="w-full justify-start">
									<FileImage className="w-4 h-4 mr-2" />
									Download Logo Pack
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<ImageIcon className="w-4 h-4 mr-2" />
									Download Social Media Templates
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<FileText className="w-4 h-4 mr-2" />
									Download Email Templates
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<LinkIcon className="w-4 h-4 mr-2" />
									Get QR Code for Referral Link
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Marketing Tips</CardTitle>
								<CardDescription>Best practices for promoting tSmartCleaning</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-sm">
									<li className="flex items-start gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
										<span>Share your referral link on social media</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
										<span>Include your referral code in email signatures</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
										<span>Create content about your experience with tSmartCleaning</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
										<span>Reach out to friends and family who need cleaning services</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
										<span>Join local community groups and share your link</span>
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Reports Tab */}
				<TabsContent value="reports" className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Performance Reports</CardTitle>
									<CardDescription>Analyze your referral and commission performance</CardDescription>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" onClick={() => exportReport('referrals')}>
										<Download className="w-4 h-4 mr-2" />
										Export Referrals
									</Button>
									<Button variant="outline" onClick={() => exportReport('commissions')}>
										<Download className="w-4 h-4 mr-2" />
										Export Commissions
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Referral Performance Chart */}
							{referralStatusData.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold mb-4">Referral Status Distribution</h3>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={referralStatusData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
												outerRadius={100}
												fill="#8884d8"
												dataKey="value"
											>
												{referralStatusData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip />
											<Legend />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}

							{/* Commission Timeline Chart */}
							{commissionChartData.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold mb-4">Commission Earnings Timeline</h3>
									<ResponsiveContainer width="100%" height={300}>
										<LineChart data={commissionChartData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" />
											<YAxis />
											<Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
											<Legend />
											<Line type="monotone" dataKey="amount" stroke="#0088FE" strokeWidth={2} />
										</LineChart>
									</ResponsiveContainer>
								</div>
							)}

							{/* Summary Statistics */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Card>
									<CardHeader>
										<CardTitle className="text-base">Referral Summary</CardTitle>
									</CardHeader>
									<CardContent>
										{referralSummary ? (
											<div className="space-y-2">
												<div className="flex justify-between">
													<span className="text-sm text-slate-600">Total Referrals:</span>
													<span className="font-semibold">{referralSummary.total}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm text-slate-600">Completed:</span>
													<span className="font-semibold text-green-600">{referralSummary.completed}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm text-slate-600">Pending:</span>
													<span className="font-semibold text-yellow-600">{referralSummary.pending}</span>
												</div>
												<div className="flex justify-between border-t pt-2">
													<span className="text-sm font-medium">Total Commission:</span>
													<span className="font-bold">${referralSummary.totalCommission.toFixed(2)}</span>
												</div>
											</div>
										) : (
											<p className="text-sm text-slate-500">No referral data available</p>
										)}
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="text-base">Commission Summary</CardTitle>
									</CardHeader>
									<CardContent>
										{commissionSummary ? (
											<div className="space-y-2">
												<div className="flex justify-between">
													<span className="text-sm text-slate-600">Total Commissions:</span>
													<span className="font-semibold">${commissionSummary.total.toFixed(2)}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm text-slate-600">Paid:</span>
													<span className="font-semibold text-green-600">${commissionSummary.paid.toFixed(2)}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-sm text-slate-600">Pending:</span>
													<span className="font-semibold text-yellow-600">${commissionSummary.pending.toFixed(2)}</span>
												</div>
												<div className="flex justify-between border-t pt-2">
													<span className="text-sm font-medium">Period:</span>
													<span className="font-bold">{commissionSummary.period} days</span>
												</div>
											</div>
										) : (
											<p className="text-sm text-slate-500">No commission data available</p>
										)}
									</CardContent>
								</Card>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
