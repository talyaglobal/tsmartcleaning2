'use client'

import React, { useEffect, useState } from 'react'
import { MetricCard } from '@/components/admin/MetricCard'
import { Users, UserCheck, Building2, DollarSign, Plus, Download, Calendar, Search, Mail, Briefcase, CheckCircle, Send, Filter, Edit, Trash2, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { QuickActionCard } from '@/components/admin/QuickActionCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { DataTable, Column } from '@/components/admin/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAnonSupabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Candidate = {
	id: string
	name: string
	email: string
	phone?: string
	status: 'active' | 'placed' | 'training' | 'inactive' | 'on_hold'
	skills: string[]
	languages?: string[]
	workAuthorizationStatus?: string
	availabilityStatus?: string
	location?: string
	joinedDate: string
	lastContact?: string
	notes?: string
}

type Placement = {
	id: string
	candidateId: string
	candidateName: string
	companyId: string
	companyName: string
	jobTitle: string
	status: 'pending' | 'interview_scheduled' | 'offer_extended' | 'accepted' | 'active' | 'completed' | 'terminated' | 'withdrawn'
	startDate: string
	endDate?: string
	placementFee: number
	hourlyRate?: number
	hoursPerWeek?: number
	notes?: string
}

type Message = {
	id: string
	to: string
	subject: string
	message: string
	timestamp: string
	status: 'sent' | 'draft' | 'failed'
}

type Report = {
	id: string
	name: string
	type: 'placements' | 'candidates' | 'revenue' | 'performance' | 'impact'
	period: string
	generatedAt: string
}

export default function AgencyDashboard() {
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('overview')
	const [candidates, setCandidates] = useState<Candidate[]>([])
	const [placements, setPlacements] = useState<Placement[]>([])
	const [messages, setMessages] = useState<Message[]>([])
	const [reports, setReports] = useState<Report[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [placementStatusFilter, setPlacementStatusFilter] = useState<string>('all')
	const [newMessage, setNewMessage] = useState({ to: '', subject: '', message: '' })
	const [agencyId, setAgencyId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [sendingMessage, setSendingMessage] = useState(false)
	const [generatingReport, setGeneratingReport] = useState<string | null>(null)

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

			setAgencyId(user.id)
			await fetchDashboardData(user.id)
		} catch (err: any) {
			console.error('Error initializing dashboard:', err)
			setError('Failed to initialize dashboard. Please try again.')
			setLoading(false)
		}
	}

	const fetchDashboardData = async (userId: string) => {
		try {
			setError(null)
			setLoading(true)

			// Fetch candidates
			const candidatesRes = await fetch(`/api/agency/candidates?agencyId=${encodeURIComponent(userId)}`)
			if (candidatesRes.ok) {
				const candidatesData = await candidatesRes.json()
				setCandidates(candidatesData.candidates || [])
			} else {
				console.error('Failed to fetch candidates')
			}

			// Fetch placements
			const placementsRes = await fetch(`/api/agency/placements?agencyId=${encodeURIComponent(userId)}`)
			if (placementsRes.ok) {
				const placementsData = await placementsRes.json()
				setPlacements(placementsData.placements || [])
			} else {
				console.error('Failed to fetch placements')
			}

			// Fetch messages
			const messagesRes = await fetch(`/api/agency/messages?agencyId=${encodeURIComponent(userId)}`)
			if (messagesRes.ok) {
				const messagesData = await messagesRes.json()
				const formattedMessages = (messagesData.messages || []).map((msg: any) => ({
					id: msg.id,
					to: msg.to_email || msg.to || '',
					subject: msg.subject || '',
					message: msg.message || '',
					timestamp: msg.sent_at || msg.created_at || new Date().toISOString(),
					status: msg.status || 'sent'
				}))
				setMessages(formattedMessages)
			} else {
				console.error('Failed to fetch messages')
			}

		} catch (error) {
			console.error('Error fetching dashboard data:', error)
			setError('Failed to load dashboard data. Please refresh the page.')
		} finally {
			setLoading(false)
		}
	}

	const refreshData = () => {
		if (agencyId) {
			fetchDashboardData(agencyId)
		}
	}

	const activeCandidates = candidates.filter(c => c.status === 'active').length
	const totalCandidates = candidates.length
	const placedCandidates = candidates.filter(c => c.status === 'placed').length
	const totalPlacements = placements.length
	const activePlacements = placements.filter(p => p.status === 'active').length
	const pendingPlacements = placements.filter(p => p.status === 'pending' || p.status === 'interview_scheduled' || p.status === 'offer_extended').length
	const completedPlacements = placements.filter(p => p.status === 'completed').length
	const monthlyRevenue = placements.reduce((sum, p) => sum + (p.status === 'active' ? p.placementFee : 0), 0)
	const totalRevenue = placements.reduce((sum, p) => sum + p.placementFee, 0)
	const successRate = totalPlacements > 0 ? ((activePlacements + completedPlacements) / totalPlacements * 100).toFixed(1) : '0'

	const filteredCandidates = candidates.filter(c => {
		const matchesSearch = 
			c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.location?.toLowerCase().includes(searchQuery.toLowerCase())
		
		const matchesStatus = statusFilter === 'all' || c.status === statusFilter
		
		return matchesSearch && matchesStatus
	})

	const filteredPlacements = placements.filter(p => {
		return placementStatusFilter === 'all' || p.status === placementStatusFilter
	})

	const sendMessage = async () => {
		if (!newMessage.to || !newMessage.subject || !newMessage.message) {
			setError('Please fill in all message fields')
			return
		}

		if (!agencyId) {
			setError('Agency ID not found. Please refresh the page.')
			return
		}

		try {
			setSendingMessage(true)
			setError(null)

			const response = await fetch('/api/agency/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					agencyId,
					to: newMessage.to,
					subject: newMessage.subject,
					message: newMessage.message
				})
			})

			if (response.ok) {
				const data = await response.json()
				const newMsg: Message = {
					id: data.message?.id || Date.now().toString(),
					to: newMessage.to,
					subject: newMessage.subject,
					message: newMessage.message,
					timestamp: new Date().toISOString(),
					status: 'sent'
				}
				setMessages([newMsg, ...messages])
				setNewMessage({ to: '', subject: '', message: '' })
			} else {
				const errorData = await response.json()
				setError(errorData.error || 'Failed to send message')
			}
		} catch (err: any) {
			console.error('Error sending message:', err)
			setError('Failed to send message. Please try again.')
		} finally {
			setSendingMessage(false)
		}
	}

	const generateReport = async (type: string) => {
		if (!agencyId) {
			setError('Agency ID not found. Please refresh the page.')
			return
		}

		try {
			setGeneratingReport(type)
			setError(null)

			const response = await fetch(`/api/agency/reports?agencyId=${encodeURIComponent(agencyId)}&type=${type}`)
			
			if (response.ok) {
				const data = await response.json()
				const report: Report = {
					id: Date.now().toString(),
					name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
					type: type as any,
					period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
					generatedAt: new Date().toISOString()
				}
				setReports([report, ...reports])

				// Download report as JSON (can be enhanced to generate PDF/CSV)
				const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' })
				const url = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			} else {
				const errorData = await response.json()
				setError(errorData.error || 'Failed to generate report')
			}
		} catch (err: any) {
			console.error('Error generating report:', err)
			setError('Failed to generate report. Please try again.')
		} finally {
			setGeneratingReport(null)
		}
	}

	const updatePlacementStatus = async (placementId: string, newStatus: string) => {
		if (!agencyId) return

		try {
			setError(null)
			
			const response = await fetch(`/api/agency/placements/${placementId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			})

			if (response.ok) {
				const data = await response.json()
				setPlacements(placements.map(p => 
					p.id === placementId ? data.placement : p
				))
			} else {
				const errorData = await response.json()
				setError(errorData.error || 'Failed to update placement status')
				// Revert the change on error
				refreshData()
			}
		} catch (err) {
			console.error('Error updating placement status:', err)
			setError('Failed to update placement status. Please try again.')
			// Revert the change on error
			refreshData()
		}
	}

	const candidateColumns: Column<Candidate>[] = [
		{ key: 'name', header: 'Name', render: (c) => <div className="font-medium">{c.name}</div> },
		{ key: 'email', header: 'Email' },
		{ key: 'phone', header: 'Phone', render: (c) => c.phone || '-' },
		{ key: 'location', header: 'Location', render: (c) => c.location || '-' },
		{ key: 'status', header: 'Status', render: (c) => (
			<Badge variant={c.status === 'active' ? 'default' : c.status === 'placed' ? 'default' : 'outline'}>
				{c.status}
			</Badge>
		)},
		{ key: 'skills', header: 'Skills', render: (c) => (
			<div className="flex gap-1 flex-wrap">
				{c.skills && c.skills.length > 0 ? (
					c.skills.map((skill, i) => (
						<Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
					))
				) : (
					<span className="text-xs text-gray-400">No skills listed</span>
				)}
			</div>
		)},
		{ key: 'joinedDate', header: 'Joined', render: (c) => c.joinedDate ? new Date(c.joinedDate).toLocaleDateString() : '-' },
		{ key: 'actions', header: 'Actions', render: (c) => (
			<div className="flex gap-2">
				<Button size="sm" variant="outline" onClick={() => window.location.href = `/agency/candidates/${c.id}`}>
					View
				</Button>
				<Button 
					size="sm" 
					variant="outline" 
					onClick={() => {
						setNewMessage({ to: c.email, subject: '', message: '' })
						setActiveTab('communication')
					}}
					title="Send message"
				>
					<Mail className="w-3 h-3" />
				</Button>
			</div>
		)}
	]

	const placementColumns: Column<Placement>[] = [
		{ key: 'candidateName', header: 'Candidate', render: (p) => <div className="font-medium">{p.candidateName}</div> },
		{ key: 'companyName', header: 'Company' },
		{ key: 'jobTitle', header: 'Position' },
		{ key: 'status', header: 'Status', render: (p) => (
			<Select
				value={p.status}
				onValueChange={(value) => updatePlacementStatus(p.id, value)}
			>
				<SelectTrigger className="w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="pending">Pending</SelectItem>
					<SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
					<SelectItem value="offer_extended">Offer Extended</SelectItem>
					<SelectItem value="accepted">Accepted</SelectItem>
					<SelectItem value="active">Active</SelectItem>
					<SelectItem value="completed">Completed</SelectItem>
					<SelectItem value="terminated">Terminated</SelectItem>
					<SelectItem value="withdrawn">Withdrawn</SelectItem>
				</SelectContent>
			</Select>
		)},
		{ key: 'startDate', header: 'Start Date', render: (p) => p.startDate ? new Date(p.startDate).toLocaleDateString() : '-' },
		{ key: 'endDate', header: 'End Date', render: (p) => p.endDate ? new Date(p.endDate).toLocaleDateString() : '-' },
		{ key: 'placementFee', header: 'Fee', render: (p) => `$${p.placementFee.toLocaleString()}` },
		{ key: 'actions', header: 'Actions', render: (p) => (
			<div className="flex gap-2">
				<Button size="sm" variant="outline" onClick={() => window.location.href = `/agency/placements/${p.id}`}>
					View
				</Button>
			</div>
		)}
	]

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
			<PageHeader title="Agency Dashboard" subtitle="Recruitment and placements overview" />
			
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			
			{/* Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard 
					title="Total Candidates" 
					value={totalCandidates.toString()} 
					subtitle={`${activeCandidates} active`}
					icon={<Users className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Total Placements" 
					value={totalPlacements.toString()} 
					subtitle={`${activePlacements} active, ${pendingPlacements} pending`}
					change={{ value: parseFloat(successRate), positive: true, label: `${successRate}% success rate` }} 
					icon={<UserCheck className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Placed Candidates" 
					value={placedCandidates.toString()} 
					subtitle={`${completedPlacements} completed`}
					icon={<CheckCircle className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Total Revenue" 
					value={`$${totalRevenue.toLocaleString()}`} 
					subtitle={`$${monthlyRevenue.toLocaleString()} active`}
					icon={<DollarSign className="w-6 h-6" />} 
				/>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard 
					title="Add candidate" 
					description="Register new candidate" 
					href="/agency/candidates" 
					icon={<Plus className="w-5 h-5" />}
				/>
				<QuickActionCard 
					title="Match to job" 
					description="Create new placement" 
					href="/agency/placements" 
					icon={<Briefcase className="w-5 h-5" />}
				/>
				<QuickActionCard 
					title="Schedule training" 
					description="Organize training session" 
					href="/agency/training" 
					icon={<Calendar className="w-5 h-5" />}
				/>
				<QuickActionCard 
					title="Contact company" 
					description="Reach out to partners" 
					href="/agency/companies" 
					icon={<Building2 className="w-5 h-5" />}
				/>
			</div>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="workers">Worker Management</TabsTrigger>
					<TabsTrigger value="placements">Placement Tracking</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
					<TabsTrigger value="communication">Communication</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Recent Placements</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{placements.slice(0, 5).map((placement) => (
										<div key={placement.id} className="flex items-center justify-between p-2 border rounded">
											<div>
												<p className="font-medium">{placement.candidateName}</p>
												<p className="text-sm text-gray-600">
													{placement.companyName} • {placement.jobTitle}
												</p>
											</div>
											<Badge variant={placement.status === 'active' ? 'default' : 'outline'}>
												{placement.status}
											</Badge>
										</div>
									))}
									{placements.length === 0 && (
										<p className="text-sm text-gray-500 text-center py-4">No placements yet</p>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Active Candidates</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{candidates.filter(c => c.status === 'active').slice(0, 5).map((candidate) => (
										<div key={candidate.id} className="flex items-center justify-between p-2 border rounded">
											<div>
												<p className="font-medium">{candidate.name}</p>
												<p className="text-sm text-gray-600">{candidate.email}</p>
											</div>
											<Badge variant="default">Active</Badge>
										</div>
									))}
									{candidates.filter(c => c.status === 'active').length === 0 && (
										<p className="text-sm text-gray-500 text-center py-4">No active candidates</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Worker Management Tab */}
				<TabsContent value="workers" className="space-y-4">
					<div className="flex justify-between items-center flex-wrap gap-4">
						<h3 className="text-lg font-semibold">Worker Management</h3>
						<div className="flex gap-2 flex-wrap">
							<div className="relative">
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Search candidates..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-8 w-64"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40">
									<Filter className="w-4 h-4 mr-2" />
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="placed">Placed</SelectItem>
									<SelectItem value="training">Training</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
									<SelectItem value="on_hold">On Hold</SelectItem>
								</SelectContent>
							</Select>
							<Button onClick={() => window.location.href = '/agency/candidates'}>
								<Plus className="w-4 h-4 mr-2" />
								Add Candidate
							</Button>
							<Button variant="outline" onClick={refreshData}>
								Refresh
							</Button>
						</div>
					</div>
					<Card>
						<CardContent className="p-0">
							<DataTable
								columns={candidateColumns}
								data={filteredCandidates}
								getRowKey={(c) => c.id}
								loading={loading}
								emptyState="No candidates found"
							/>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Placement Tracking Tab */}
				<TabsContent value="placements" className="space-y-4">
					<div className="flex justify-between items-center flex-wrap gap-4">
						<h3 className="text-lg font-semibold">Placement Tracking</h3>
						<div className="flex gap-2">
							<Select value={placementStatusFilter} onValueChange={setPlacementStatusFilter}>
								<SelectTrigger className="w-40">
									<Filter className="w-4 h-4 mr-2" />
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
									<SelectItem value="offer_extended">Offer Extended</SelectItem>
									<SelectItem value="accepted">Accepted</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="terminated">Terminated</SelectItem>
									<SelectItem value="withdrawn">Withdrawn</SelectItem>
								</SelectContent>
							</Select>
							<Button onClick={() => window.location.href = '/agency/placements'}>
								<Plus className="w-4 h-4 mr-2" />
								Create Placement
							</Button>
							<Button variant="outline" onClick={refreshData}>
								Refresh
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Pending</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{placements.filter(p => p.status === 'pending').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Interview</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-blue-600">
									{placements.filter(p => p.status === 'interview_scheduled').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Offer</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-purple-600">
									{placements.filter(p => p.status === 'offer_extended' || p.status === 'accepted').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Active</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{placements.filter(p => p.status === 'active').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Completed</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{placements.filter(p => p.status === 'completed').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Terminated</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{placements.filter(p => p.status === 'terminated' || p.status === 'withdrawn').length}
								</div>
							</CardContent>
						</Card>
					</div>
					<Card>
						<CardContent className="p-0">
							<DataTable
								columns={placementColumns}
								data={filteredPlacements}
								getRowKey={(p) => p.id}
								loading={loading}
								emptyState="No placements found"
							/>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Reports Tab */}
				<TabsContent value="reports" className="space-y-4">
					<div className="flex justify-between items-center flex-wrap gap-4">
						<h3 className="text-lg font-semibold">Reports & Analytics</h3>
						<div className="flex gap-2 flex-wrap">
							<Button 
								variant="outline" 
								onClick={() => generateReport('placements')}
								disabled={generatingReport === 'placements'}
							>
								<Download className="w-4 h-4 mr-2" />
								{generatingReport === 'placements' ? 'Generating...' : 'Placements Report'}
							</Button>
							<Button 
								variant="outline" 
								onClick={() => generateReport('candidates')}
								disabled={generatingReport === 'candidates'}
							>
								<Download className="w-4 h-4 mr-2" />
								{generatingReport === 'candidates' ? 'Generating...' : 'Candidates Report'}
							</Button>
							<Button 
								variant="outline" 
								onClick={() => generateReport('revenue')}
								disabled={generatingReport === 'revenue'}
							>
								<Download className="w-4 h-4 mr-2" />
								{generatingReport === 'revenue' ? 'Generating...' : 'Revenue Report'}
							</Button>
							<Button 
								variant="outline" 
								onClick={() => generateReport('performance')}
								disabled={generatingReport === 'performance'}
							>
								<Download className="w-4 h-4 mr-2" />
								{generatingReport === 'performance' ? 'Generating...' : 'Performance Report'}
							</Button>
							<Button 
								variant="outline" 
								onClick={() => generateReport('impact')}
								disabled={generatingReport === 'impact'}
							>
								<Download className="w-4 h-4 mr-2" />
								{generatingReport === 'impact' ? 'Generating...' : 'Impact Report'}
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Placement Statistics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Total Placements</span>
										<span className="font-semibold">{totalPlacements}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Active Placements</span>
										<span className="font-semibold text-green-600">{activePlacements}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Success Rate</span>
										<span className="font-semibold">
											{totalPlacements > 0 ? ((activePlacements / totalPlacements) * 100).toFixed(1) : 0}%
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
										<span className="text-sm text-gray-600">Monthly Revenue</span>
										<span className="font-semibold">${monthlyRevenue.toLocaleString()}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Average Placement Fee</span>
										<span className="font-semibold">
											${placements.length > 0 ? (placements.reduce((sum, p) => sum + p.placementFee, 0) / placements.length).toFixed(0) : 0}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Generated Reports</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{reports.map((report) => (
									<div key={report.id} className="flex items-center justify-between p-3 border rounded">
										<div>
											<p className="font-medium">{report.name}</p>
											<p className="text-sm text-gray-600">
												{report.period} • Generated {new Date(report.generatedAt).toLocaleDateString()}
											</p>
										</div>
										<Button size="sm" variant="outline">
											<Download className="w-4 h-4 mr-2" />
											Download
										</Button>
									</div>
								))}
								{reports.length === 0 && (
									<p className="text-sm text-gray-500 text-center py-4">No reports generated yet</p>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Communication Tab */}
				<TabsContent value="communication" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Communication Tools</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Send Message</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label className="text-sm font-medium mb-1 block">To</label>
									<Input
										placeholder="Email address"
										value={newMessage.to}
										onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-sm font-medium mb-1 block">Subject</label>
									<Input
										placeholder="Message subject"
										value={newMessage.subject}
										onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-sm font-medium mb-1 block">Message</label>
									<textarea
										className="w-full min-h-[100px] px-3 py-2 border rounded-md"
										placeholder="Type your message..."
										value={newMessage.message}
										onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
									/>
								</div>
								<Button 
									onClick={sendMessage} 
									className="w-full"
									disabled={sendingMessage}
								>
									<Send className="w-4 h-4 mr-2" />
									{sendingMessage ? 'Sending...' : 'Send Message'}
								</Button>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Message History</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{messages.map((msg) => (
										<div key={msg.id} className="p-3 border rounded">
											<div className="flex items-start justify-between mb-2">
												<div>
													<p className="font-medium text-sm">{msg.to}</p>
													<p className="text-xs text-gray-600">{msg.subject}</p>
												</div>
												<Badge variant={msg.status === 'sent' ? 'default' : 'outline'}>
													{msg.status}
												</Badge>
											</div>
											<p className="text-sm text-gray-700 mb-2">{msg.message}</p>
											<p className="text-xs text-gray-500">
												{new Date(msg.timestamp).toLocaleString()}
											</p>
										</div>
									))}
									{messages.length === 0 && (
										<p className="text-sm text-gray-500 text-center py-4">No messages sent yet</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}


