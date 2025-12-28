'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
	ShieldCheck, Search, FileText, Download, Plus, Settings, Edit, Trash2, 
	X, BarChart3, TrendingUp, DollarSign, Users, FileCheck, FileCheck2, Calendar, Eye
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Policy = {
	id: string
	policy_number: string
	user_id: string
	user_name: string
	user_email: string
	plan_id: string
	plan_name: string
	plan_code: string
	status: 'active' | 'expired' | 'cancelled' | 'pending_activation' | 'draft'
	effective_date: string
	expiration_date: string
	billing_cycle: string
	auto_renew: boolean
	created_at: string
}

type Claim = {
	id: string
	claim_code: string
	status: 'filed' | 'under_review' | 'adjuster_assigned' | 'approved' | 'denied' | 'paid' | 'withdrawn'
	incident_type: string
	incident_date: string
	amount_claimed: number | null
	description: string
	user_id: string
	user_name: string
	user_email: string
	policy_id: string
	policy_number: string
	created_at: string
	updated_at: string
	documents: Array<{
		id: string
		file_url: string
		file_name: string
		document_type: string
	}>
}

type Plan = {
	id: string
	name: string
	code: string
	monthly_price: number
	annual_price: number
	property_damage_limit: number
	theft_limit: number | null
	liability_limit: number
	key_replacement_limit: number | null
	emergency_cleans_per_year: number
	deductible: number
}

type Analytics = {
	metrics: {
		totalPolicies: number
		activePolicies: number
		newPolicies: number
		totalRevenue: number
		totalClaims: number
		totalClaimAmount: number
		approvedClaimAmount: number
	}
	statusCounts: Record<string, number>
	claimStatusCounts: Record<string, number>
	planCounts: Record<string, number>
	timeSeries?: Array<{ date: string; policies: number; claims: number; revenue: number }>
	revenueByPlan?: Array<{ name: string; policies: number }>
}

const statusColors: Record<Claim['status'], string> = {
	filed: 'bg-slate-100 text-slate-700',
	under_review: 'bg-blue-100 text-blue-700',
	adjuster_assigned: 'bg-purple-100 text-purple-700',
	approved: 'bg-green-100 text-green-700',
	denied: 'bg-red-100 text-red-700',
	paid: 'bg-emerald-100 text-emerald-700',
	withdrawn: 'bg-gray-100 text-gray-700',
}

const statusLabels: Record<Claim['status'], string> = {
	filed: 'Filed',
	under_review: 'Under Review',
	adjuster_assigned: 'Adjuster Assigned',
	approved: 'Approved',
	denied: 'Denied',
	paid: 'Paid',
	withdrawn: 'Withdrawn',
}

export default function InsuranceAdminPage() {
	const [activeTab, setActiveTab] = useState<'analytics' | 'policies' | 'claims' | 'certificates'>('analytics')
	const [policies, setPolicies] = useState<Policy[]>([])
	const [claims, setClaims] = useState<Claim[]>([])
	const [plans, setPlans] = useState<Plan[]>([])
	const [analytics, setAnalytics] = useState<Analytics | null>(null)
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
	
	// Modal states
	const [showPolicyModal, setShowPolicyModal] = useState(false)
	const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
	const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
	const [claimActivities, setClaimActivities] = useState<Array<{ id: string; actor: string; message: string; created_at: string }>>([])
	const [loadingActivities, setLoadingActivities] = useState(false)
	const [newActivityMessage, setNewActivityMessage] = useState('')
	const [claimReviewForm, setClaimReviewForm] = useState({
		adjuster_name: '',
		internal_notes: '',
		denial_reason: '',
		amount_paid: '',
	})
	
	// Form states
	const [policyForm, setPolicyForm] = useState({
		user_id: '',
		plan_id: '',
		effective_date: new Date().toISOString().split('T')[0],
		expiration_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
		billing_cycle: 'annual' as 'annual' | 'monthly',
		status: 'active' as 'active' | 'expired' | 'cancelled' | 'pending_activation',
		auto_renew: true,
	})

	useEffect(() => {
		fetchData()
	}, [activeTab, period])

	const fetchData = async () => {
		setLoading(true)
		try {
			if (activeTab === 'analytics') {
				const res = await fetch(`/api/admin/insurance/analytics?period=${period}`, { 
					cache: 'no-store' 
				})
				if (res.ok) {
					const data = await res.json()
					setAnalytics(data)
				}
			} else if (activeTab === 'policies') {
				const res = await fetch('/api/admin/insurance/policies', { 
					cache: 'no-store' 
				})
				if (res.ok) {
					const data = await res.json()
					setPolicies(data.policies || [])
				}
				// Also fetch plans for the form
				const plansRes = await fetch('/api/admin/insurance/plans', { cache: 'no-store' })
				if (plansRes.ok) {
					const plansData = await plansRes.json()
					setPlans(plansData.plans || [])
				}
			} else if (activeTab === 'claims') {
				const res = await fetch('/api/admin/insurance/claims', { 
					cache: 'no-store' 
				})
				if (res.ok) {
					const data = await res.json()
					setClaims(data.claims || [])
				}
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleCreatePolicy = () => {
		setEditingPolicy(null)
		setPolicyForm({
			user_id: '',
			plan_id: '',
			effective_date: new Date().toISOString().split('T')[0],
			expiration_date: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
			billing_cycle: 'annual',
			status: 'active',
			auto_renew: true,
		})
		setShowPolicyModal(true)
	}

	const handleEditPolicy = (policy: Policy) => {
		setEditingPolicy(policy)
		setPolicyForm({
			user_id: policy.user_id,
			plan_id: policy.plan_id,
			effective_date: policy.effective_date,
			expiration_date: policy.expiration_date,
			billing_cycle: policy.billing_cycle as 'annual' | 'monthly',
			status: policy.status as 'active' | 'cancelled' | 'pending_activation' | 'expired',
			auto_renew: policy.auto_renew,
		})
		setShowPolicyModal(true)
	}

	const handleSavePolicy = async () => {
		try {
			const url = editingPolicy 
				? `/api/admin/insurance/policies/${editingPolicy.id}`
				: '/api/admin/insurance/policies'
			
			const res = await fetch(url, {
				method: editingPolicy ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(policyForm),
			})
			
			if (res.ok) {
				setShowPolicyModal(false)
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to save policy')
			}
		} catch (error) {
			console.error('Error saving policy:', error)
			alert('Failed to save policy')
		}
	}

	const handleDeletePolicy = async (id: string) => {
		if (!confirm('Are you sure you want to delete this policy?')) return
		try {
			const res = await fetch(`/api/admin/insurance/policies/${id}`, {
				method: 'DELETE',
			})
			if (res.ok) {
				fetchData()
			}
		} catch (error) {
			console.error('Error deleting policy:', error)
		}
	}

	const loadClaimDetails = async (claim: Claim) => {
		setSelectedClaim(claim)
		setClaimReviewForm({
			adjuster_name: (claim as any).adjuster_name || '',
			internal_notes: (claim as any).internal_notes || '',
			denial_reason: (claim as any).denial_reason || '',
			amount_paid: (claim as any).amount_paid ? String((claim as any).amount_paid) : '',
		})
		
		// Load activities
		setLoadingActivities(true)
		try {
			const res = await fetch(`/api/admin/insurance/claims/${claim.id}/activities`)
			if (res.ok) {
				const data = await res.json()
				setClaimActivities(data.activities || [])
			}
		} catch (error) {
			console.error('Error loading activities:', error)
		} finally {
			setLoadingActivities(false)
		}
	}

	const updateClaimStatus = async (claimId: string, newStatus: Claim['status'], options?: { adjuster_name?: string; internal_notes?: string; denial_reason?: string; amount_paid?: number; activity_message?: string }) => {
		try {
			const body: any = { 
				status: newStatus,
				actor: 'Admin',
			}
			
			if (options?.adjuster_name !== undefined) body.adjuster_name = options.adjuster_name
			if (options?.internal_notes !== undefined) body.internal_notes = options.internal_notes
			if (options?.denial_reason !== undefined) body.denial_reason = options.denial_reason
			if (options?.amount_paid !== undefined) body.amount_paid = options.amount_paid
			if (options?.activity_message) body.activity_message = options.activity_message

			const res = await fetch(`/api/admin/insurance/claims/${claimId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			if (res.ok) {
				fetchData()
				if (selectedClaim?.id === claimId) {
					loadClaimDetails({ ...selectedClaim, status: newStatus } as Claim)
				}
			}
		} catch (error) {
			console.error('Error updating claim status:', error)
		}
	}

	const addActivity = async () => {
		if (!selectedClaim || !newActivityMessage.trim()) return

		try {
			const res = await fetch(`/api/admin/insurance/claims/${selectedClaim.id}/activities`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					actor: 'Admin',
					message: newActivityMessage,
				}),
			})
			if (res.ok) {
				const data = await res.json()
				setClaimActivities([data.activity, ...claimActivities])
				setNewActivityMessage('')
			}
		} catch (error) {
			console.error('Error adding activity:', error)
		}
	}

	const saveClaimReview = async () => {
		if (!selectedClaim) return

		await updateClaimStatus(selectedClaim.id, selectedClaim.status, {
			adjuster_name: claimReviewForm.adjuster_name,
			internal_notes: claimReviewForm.internal_notes,
			denial_reason: claimReviewForm.denial_reason,
			amount_paid: claimReviewForm.amount_paid ? Number(claimReviewForm.amount_paid) : undefined,
			activity_message: 'Review details updated',
		})
	}

	const handleGenerateCertificate = async (policy: Policy) => {
		try {
			// Try to get policy number first
			const url = policy.policy_number 
				? `/api/insurance/certificate?policy_number=${encodeURIComponent(policy.policy_number)}`
				: `/api/insurance/certificate?policy_id=${encodeURIComponent(policy.id)}`
			window.open(url, '_blank')
		} catch (error) {
			console.error('Error generating certificate:', error)
		}
	}

	const filteredPolicies = useMemo(() => {
		let filtered = policies

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(p) =>
					p.policy_number.toLowerCase().includes(query) ||
					p.user_name.toLowerCase().includes(query) ||
					p.user_email.toLowerCase().includes(query) ||
					p.plan_name.toLowerCase().includes(query)
			)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((p) => p.status === statusFilter)
		}

		return filtered
	}, [policies, searchQuery, statusFilter])

	const filteredClaims = useMemo(() => {
		let filtered = claims

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(c) =>
					c.claim_code.toLowerCase().includes(query) ||
					c.incident_type.toLowerCase().includes(query) ||
					c.description.toLowerCase().includes(query) ||
					c.policy_number.toLowerCase().includes(query) ||
					c.user_name.toLowerCase().includes(query)
			)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((c) => c.status === statusFilter)
		}

		return filtered
	}, [claims, searchQuery, statusFilter])

	const policyColumns: Column<Policy>[] = [
		{
			key: 'policy_number',
			header: 'Policy Number',
			render: (policy) => (
				<span className="font-mono text-sm font-medium text-blue-600">
					{policy.policy_number}
				</span>
			),
		},
		{
			key: 'user_name',
			header: 'Policyholder',
			render: (policy) => (
				<div>
					<p className="font-medium">{policy.user_name}</p>
					<p className="text-xs text-slate-500">{policy.user_email}</p>
				</div>
			),
		},
		{
			key: 'plan_name',
			header: 'Plan',
		},
		{
			key: 'status',
			header: 'Status',
			render: (policy) => (
				<Badge
					variant={
						policy.status === 'active'
							? 'default'
							: policy.status === 'expired'
							? 'secondary'
							: 'outline'
					}
				>
					{policy.status.replace('_', ' ')}
				</Badge>
			),
		},
		{
			key: 'effective_date',
			header: 'Effective Date',
			render: (policy) => new Date(policy.effective_date).toLocaleDateString(),
		},
		{
			key: 'expiration_date',
			header: 'Expiration Date',
			render: (policy) => new Date(policy.expiration_date).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (policy) => (
				<div className="flex items-center gap-2">
					<Button 
						variant="ghost" 
						size="sm"
						onClick={() => handleGenerateCertificate(policy)}
						title="Generate Certificate"
					>
						<FileCheck className="h-4 w-4" />
					</Button>
					<Button 
						variant="ghost" 
						size="sm"
						onClick={() => handleEditPolicy(policy)}
						title="Edit Policy"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button 
						variant="ghost" 
						size="sm"
						onClick={() => handleDeletePolicy(policy.id)}
						title="Delete Policy"
					>
						<Trash2 className="h-4 w-4 text-red-500" />
					</Button>
				</div>
			),
		},
	]

	const claimColumns: Column<Claim>[] = [
		{
			key: 'claim_code',
			header: 'Claim Code',
			render: (claim) => (
				<Link
					href={`/insurance/claims/${claim.claim_code}`}
					className="font-mono text-sm font-medium text-blue-600 hover:underline"
				>
					{claim.claim_code}
				</Link>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (claim) => (
				<Badge className={statusColors[claim.status]}>
					{statusLabels[claim.status]}
				</Badge>
			),
		},
		{
			key: 'user_name',
			header: 'Policyholder',
			render: (claim) => (
				<div>
					<p className="font-medium">{claim.user_name}</p>
					<p className="text-xs text-slate-500">{claim.user_email}</p>
				</div>
			),
		},
		{
			key: 'incident_type',
			header: 'Incident Type',
		},
		{
			key: 'incident_date',
			header: 'Incident Date',
			render: (claim) => new Date(claim.incident_date).toLocaleDateString(),
		},
		{
			key: 'amount_claimed',
			header: 'Amount',
			render: (claim) =>
				claim.amount_claimed ? (
					<span className="font-medium">${claim.amount_claimed.toLocaleString()}</span>
				) : (
					<span className="text-slate-400">—</span>
				),
		},
		{
			key: 'policy_number',
			header: 'Policy',
			render: (claim) => claim.policy_number || '—',
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (claim) => (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => loadClaimDetails(claim)}
				>
					<Eye className="h-4 w-4" />
				</Button>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Insurance Management"
				subtitle="Manage policies, review claims, generate certificates, and view analytics."
				withBorder
				breadcrumb={
					<div>
						<Link href="/admin" className="hover:underline">Admin</Link>
						<span className="mx-1">/</span>
						<span>Insurance</span>
					</div>
				}
				tabs={
					<div className="flex gap-1 border-b border-slate-200">
						<button
							onClick={() => setActiveTab('analytics')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'analytics'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Analytics
						</button>
						<button
							onClick={() => setActiveTab('policies')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'policies'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Policies
						</button>
						<button
							onClick={() => setActiveTab('claims')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'claims'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Claims
						</button>
						<button
							onClick={() => setActiveTab('certificates')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'certificates'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Certificates
						</button>
					</div>
				}
				actions={
					activeTab === 'analytics' ? (
						<div className="flex gap-2">
							<select
								value={period}
								onChange={(e) => setPeriod(e.target.value as typeof period)}
								className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="7d">Last 7 days</option>
								<option value="30d">Last 30 days</option>
								<option value="90d">Last 90 days</option>
								<option value="all">All time</option>
							</select>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (!analytics) return
									const csv = [
										['Metric', 'Value'],
										['Total Policies', analytics.metrics.totalPolicies],
										['Active Policies', analytics.metrics.activePolicies],
										['New Policies', analytics.metrics.newPolicies],
										['Total Revenue', analytics.metrics.totalRevenue],
										['Total Claims', analytics.metrics.totalClaims],
										['Total Claim Amount', analytics.metrics.totalClaimAmount],
										['Approved Claim Amount', analytics.metrics.approvedClaimAmount],
									].map(row => row.join(',')).join('\n')
									const blob = new Blob([csv], { type: 'text/csv' })
									const url = URL.createObjectURL(blob)
									const a = document.createElement('a')
									a.href = url
									a.download = `insurance_analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`
									a.click()
									URL.revokeObjectURL(url)
								}}
							>
								<Download className="h-4 w-4 mr-2" />
								Export CSV
							</Button>
						</div>
					) : activeTab === 'policies' ? (
						<>
							<Button size="sm" onClick={handleCreatePolicy}>
								<Plus className="h-4 w-4 mr-2" />
								Add Policy
							</Button>
							<Button variant="outline" size="sm">
								<Download className="h-4 w-4 mr-2" />
								Export
							</Button>
						</>
					) : activeTab === 'claims' ? (
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4 mr-2" />
							Export
						</Button>
					) : null
				}
			/>

			{activeTab === 'analytics' && (
				<>
					{loading ? (
						<div className="text-center py-12">Loading analytics...</div>
					) : analytics ? (
						<>
							{/* Metrics Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">Total Policies</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">{analytics.metrics.totalPolicies}</p>
											<ShieldCheck className="h-8 w-8 text-blue-500" />
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">Active Policies</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">{analytics.metrics.activePolicies}</p>
											<Users className="h-8 w-8 text-green-500" />
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">Total Claims</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">{analytics.metrics.totalClaims}</p>
											<FileCheck className="h-8 w-8 text-purple-500" />
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">${analytics.metrics.totalRevenue.toLocaleString()}</p>
											<DollarSign className="h-8 w-8 text-green-500" />
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Additional Metrics */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">New Policies</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">{analytics.metrics.newPolicies}</p>
											<TrendingUp className="h-8 w-8 text-purple-500" />
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">Total Claim Amount</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">${analytics.metrics.totalClaimAmount.toLocaleString()}</p>
											<DollarSign className="h-8 w-8 text-orange-500" />
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle className="text-sm font-medium text-slate-600">Approved Claims</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-semibold">${analytics.metrics.approvedClaimAmount.toLocaleString()}</p>
											<FileCheck className="h-8 w-8 text-green-500" />
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Status Breakdown */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<Card>
									<CardHeader>
										<CardTitle>Policies by Status</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{Object.entries(analytics.statusCounts).map(([status, count]) => (
												<div key={status} className="flex items-center justify-between">
													<span className="text-sm capitalize">{status.replace('_', ' ')}</span>
													<Badge variant="outline">{count}</Badge>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Claims by Status</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{Object.entries(analytics.claimStatusCounts).map(([status, count]) => (
												<div key={status} className="flex items-center justify-between">
													<span className="text-sm capitalize">{status.replace('_', ' ')}</span>
													<Badge variant="outline">{count}</Badge>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Plans Breakdown */}
							<Card className="mb-6">
								<CardHeader>
									<CardTitle>Policies by Plan</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{Object.entries(analytics.planCounts).map(([plan, count]) => (
											<div key={plan} className="flex items-center justify-between">
												<span className="text-sm">{plan}</span>
												<Badge variant="outline">{count}</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Charts */}
							{analytics.timeSeries && analytics.timeSeries.length > 0 && (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
									<Card>
										<CardHeader>
											<CardTitle>Policies & Claims Over Time</CardTitle>
										</CardHeader>
										<CardContent>
											<ResponsiveContainer width="100%" height={300}>
												<LineChart data={analytics.timeSeries}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis 
														dataKey="date" 
														tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
													/>
													<YAxis />
													<Tooltip 
														labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
													/>
													<Legend />
													<Line type="monotone" dataKey="policies" stroke="#3b82f6" name="Policies" strokeWidth={2} />
													<Line type="monotone" dataKey="claims" stroke="#8b5cf6" name="Claims" strokeWidth={2} />
												</LineChart>
											</ResponsiveContainer>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Claim Status Distribution</CardTitle>
										</CardHeader>
										<CardContent>
											<ResponsiveContainer width="100%" height={300}>
												<PieChart>
													<Pie
														data={Object.entries(analytics.claimStatusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value }))}
														cx="50%"
														cy="50%"
														labelLine={false}
														label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
														outerRadius={80}
														fill="#8884d8"
														dataKey="value"
													>
														{Object.entries(analytics.claimStatusCounts).map((_, index) => {
															const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6b7280']
															return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
														})}
													</Pie>
													<Tooltip />
												</PieChart>
											</ResponsiveContainer>
										</CardContent>
									</Card>
								</div>
							)}

							{analytics.revenueByPlan && analytics.revenueByPlan.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Policies by Plan</CardTitle>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={300}>
											<BarChart data={analytics.revenueByPlan}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="name" />
												<YAxis />
												<Tooltip />
												<Legend />
												<Bar dataKey="policies" fill="#3b82f6" name="Policies" />
											</BarChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>
							)}
						</>
					) : (
						<EmptyState
							title="No analytics data"
							description="Analytics data will appear here once policies are created."
							icon={<BarChart3 className="h-8 w-8" />}
						/>
					)}
				</>
			)}

			{activeTab === 'policies' && (
				<>
					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search policies..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Statuses</option>
							<option value="active">Active</option>
							<option value="expired">Expired</option>
							<option value="cancelled">Cancelled</option>
							<option value="pending_activation">Pending Activation</option>
						</select>
					</div>

					{/* Policies Table */}
					<DataTable
						columns={policyColumns}
						data={filteredPolicies}
						loading={loading}
						emptyState={
							<EmptyState
								title="No policies found"
								description="There are no insurance policies matching your filters."
								icon={<ShieldCheck className="h-8 w-8" />}
								action={
									<Button onClick={handleCreatePolicy}>
										<Plus className="h-4 w-4 mr-2" />
										Create Policy
									</Button>
								}
							/>
						}
					/>
				</>
			)}

			{activeTab === 'claims' && (
				<>
					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search by claim code, incident type, policy..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Statuses</option>
							<option value="filed">Filed</option>
							<option value="under_review">Under Review</option>
							<option value="adjuster_assigned">Adjuster Assigned</option>
							<option value="approved">Approved</option>
							<option value="denied">Denied</option>
							<option value="paid">Paid</option>
							<option value="withdrawn">Withdrawn</option>
						</select>
					</div>

					{/* Claims Table */}
					<DataTable
						columns={claimColumns}
						data={filteredClaims}
						loading={loading}
						emptyState={
							<EmptyState
								title="No claims found"
								description="There are no insurance claims matching your filters."
								icon={<FileCheck2 className="h-8 w-8" />}
							/>
						}
					/>
				</>
			)}

			{activeTab === 'certificates' && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Certificate Generation</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-slate-600 mb-4">
								Generate insurance certificates for policyholders. Use the certificate button in the Policies tab to generate certificates for specific policies.
							</p>
							<div className="space-y-4">
								{filteredPolicies.length > 0 ? (
									<div className="space-y-2">
										{filteredPolicies.slice(0, 10).map((policy) => (
											<div key={policy.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-md">
												<div>
													<p className="font-medium">{policy.policy_number}</p>
													<p className="text-sm text-slate-500">{policy.user_name}</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleGenerateCertificate(policy)}
												>
													<FileCheck className="h-4 w-4 mr-2" />
													Generate Certificate
												</Button>
											</div>
										))}
									</div>
								) : (
									<EmptyState
										title="No policies available"
										description="Create policies first to generate certificates."
										icon={<FileCheck className="h-8 w-8" />}
									/>
								)}
							</div>
						</CardContent>
					</Card>
				</>
			)}

			{/* Policy Modal */}
			{showPolicyModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>{editingPolicy ? 'Edit Policy' : 'Create Policy'}</CardTitle>
								<Button variant="ghost" size="sm" onClick={() => setShowPolicyModal(false)}>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="user_id">User ID</Label>
								<Input
									id="user_id"
									value={policyForm.user_id}
									onChange={(e) => setPolicyForm({ ...policyForm, user_id: e.target.value })}
									placeholder="Enter user ID"
								/>
							</div>
							<div>
								<Label htmlFor="plan_id">Plan</Label>
								<select
									id="plan_id"
									value={policyForm.plan_id}
									onChange={(e) => setPolicyForm({ ...policyForm, plan_id: e.target.value })}
									className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">Select a plan</option>
									{plans.map((plan) => (
										<option key={plan.id} value={plan.id}>
											{plan.name} ({plan.code})
										</option>
									))}
								</select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="effective_date">Effective Date</Label>
									<Input
										id="effective_date"
										type="date"
										value={policyForm.effective_date}
										onChange={(e) => setPolicyForm({ ...policyForm, effective_date: e.target.value })}
									/>
								</div>
								<div>
									<Label htmlFor="expiration_date">Expiration Date</Label>
									<Input
										id="expiration_date"
										type="date"
										value={policyForm.expiration_date}
										onChange={(e) => setPolicyForm({ ...policyForm, expiration_date: e.target.value })}
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="billing_cycle">Billing Cycle</Label>
								<select
									id="billing_cycle"
									value={policyForm.billing_cycle}
									onChange={(e) => setPolicyForm({ ...policyForm, billing_cycle: e.target.value as 'annual' | 'monthly' })}
									className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="annual">Annual</option>
									<option value="monthly">Monthly</option>
								</select>
							</div>
							<div>
								<Label htmlFor="status">Status</Label>
								<select
									id="status"
									value={policyForm.status}
									onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value as any })}
									className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="active">Active</option>
									<option value="pending_activation">Pending Activation</option>
									<option value="expired">Expired</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="auto_renew"
									checked={policyForm.auto_renew}
									onChange={(e) => setPolicyForm({ ...policyForm, auto_renew: e.target.checked })}
									className="h-4 w-4 rounded border-slate-300"
								/>
								<Label htmlFor="auto_renew">Auto-renew</Label>
							</div>
							<div className="flex justify-end gap-2 pt-4">
								<Button variant="outline" onClick={() => setShowPolicyModal(false)}>
									Cancel
								</Button>
								<Button onClick={handleSavePolicy}>
									{editingPolicy ? 'Update' : 'Create'} Policy
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Claim Detail Modal */}
			{selectedClaim && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
						<div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
							<div>
								<h2 className="text-xl font-semibold">Claim Review</h2>
								<p className="text-sm text-slate-500">{selectedClaim.claim_code}</p>
							</div>
							<Button variant="ghost" size="sm" onClick={() => setSelectedClaim(null)}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="p-6 space-y-6">
							{/* Status Section */}
							<div>
								<h3 className="text-sm font-medium text-slate-700 mb-3">Status</h3>
								<div className="flex items-center gap-3">
									<Badge className={statusColors[selectedClaim.status]}>
										{statusLabels[selectedClaim.status]}
									</Badge>
									{selectedClaim.status !== 'paid' && selectedClaim.status !== 'denied' && selectedClaim.status !== 'withdrawn' && (
										<select
											value={selectedClaim.status}
											onChange={(e) =>
												updateClaimStatus(selectedClaim.id, e.target.value as Claim['status'], {
													activity_message: `Status changed to ${statusLabels[e.target.value as Claim['status']]}`,
												})
											}
											className="h-8 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
										>
											<option value="filed">Filed</option>
											<option value="under_review">Under Review</option>
											<option value="adjuster_assigned">Adjuster Assigned</option>
											<option value="approved">Approved</option>
											<option value="denied">Denied</option>
											<option value="paid">Paid</option>
											<option value="withdrawn">Withdrawn</option>
										</select>
									)}
								</div>
							</div>

							{/* Claim Information */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs text-slate-500">Policyholder</label>
									<p className="text-sm font-medium">{selectedClaim.user_name}</p>
									<p className="text-xs text-slate-500">{selectedClaim.user_email}</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Policy Number</label>
									<p className="text-sm font-medium">{selectedClaim.policy_number || '—'}</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Incident Type</label>
									<p className="text-sm font-medium">{selectedClaim.incident_type}</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Incident Date</label>
									<p className="text-sm font-medium">
										{new Date(selectedClaim.incident_date).toLocaleDateString()}
									</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Amount Claimed</label>
									<p className="text-sm font-medium">
										{selectedClaim.amount_claimed
											? `$${selectedClaim.amount_claimed.toLocaleString()}`
											: '—'}
									</p>
								</div>
								<div>
									<label className="text-xs text-slate-500">Filed Date</label>
									<p className="text-sm font-medium">
										{new Date(selectedClaim.created_at).toLocaleDateString()}
									</p>
								</div>
							</div>

							{/* Description */}
							<div>
								<label className="text-xs text-slate-500">Description</label>
								<p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
									{selectedClaim.description}
								</p>
							</div>

							{/* Review Section */}
							<div className="border-t border-slate-200 pt-4 space-y-4">
								<h3 className="text-sm font-medium text-slate-700">Review Details</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="adjuster_name">Assigned Adjuster</Label>
										<Input
											id="adjuster_name"
											value={claimReviewForm.adjuster_name}
											onChange={(e) => setClaimReviewForm({ ...claimReviewForm, adjuster_name: e.target.value })}
											placeholder="Enter adjuster name"
										/>
									</div>
									<div>
										<Label htmlFor="amount_paid">Amount Paid</Label>
										<Input
											id="amount_paid"
											type="number"
											value={claimReviewForm.amount_paid}
											onChange={(e) => setClaimReviewForm({ ...claimReviewForm, amount_paid: e.target.value })}
											placeholder="0.00"
										/>
									</div>
								</div>
								{selectedClaim.status === 'denied' && (
									<div>
										<Label htmlFor="denial_reason">Denial Reason</Label>
										<Textarea
											id="denial_reason"
											value={claimReviewForm.denial_reason}
											onChange={(e) => setClaimReviewForm({ ...claimReviewForm, denial_reason: e.target.value })}
											placeholder="Enter reason for denial"
											rows={3}
										/>
									</div>
								)}
								<div>
									<Label htmlFor="internal_notes">Internal Notes</Label>
									<Textarea
										id="internal_notes"
										value={claimReviewForm.internal_notes}
										onChange={(e) => setClaimReviewForm({ ...claimReviewForm, internal_notes: e.target.value })}
										placeholder="Internal notes (not visible to customer)"
										rows={3}
									/>
								</div>
								<Button onClick={saveClaimReview} size="sm">
									Save Review Details
								</Button>
							</div>

							{/* Activity Log */}
							<div className="border-t border-slate-200 pt-4">
								<h3 className="text-sm font-medium text-slate-700 mb-3">Activity Log</h3>
								{loadingActivities ? (
									<p className="text-sm text-slate-500">Loading activities...</p>
								) : claimActivities.length > 0 ? (
									<div className="space-y-3 max-h-64 overflow-y-auto">
										{claimActivities.map((activity) => (
											<div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-md">
												<div className="flex-1">
													<div className="flex items-center justify-between mb-1">
														<span className="text-sm font-medium">{activity.actor}</span>
														<span className="text-xs text-slate-500">
															{new Date(activity.created_at).toLocaleString()}
														</span>
													</div>
													<p className="text-sm text-slate-700">{activity.message}</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-500">No activities yet</p>
								)}
								<div className="mt-4 flex gap-2">
									<Input
										value={newActivityMessage}
										onChange={(e) => setNewActivityMessage(e.target.value)}
										placeholder="Add activity note..."
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault()
												addActivity()
											}
										}}
									/>
									<Button onClick={addActivity} size="sm" disabled={!newActivityMessage.trim()}>
										Add Note
									</Button>
								</div>
							</div>

							{/* Documents */}
							<div>
								<h3 className="text-sm font-medium text-slate-700 mb-3">Documents</h3>
								{selectedClaim.documents && selectedClaim.documents.length > 0 ? (
									<div className="space-y-2">
										{selectedClaim.documents.map((doc) => (
											<div
												key={doc.id}
												className="flex items-center justify-between p-3 border border-slate-200 rounded-md"
											>
												<div className="flex items-center gap-3">
													<FileCheck className="h-5 w-5 text-slate-400" />
													<div>
														<p className="text-sm font-medium">{doc.file_name}</p>
														<p className="text-xs text-slate-500">{doc.document_type}</p>
													</div>
												</div>
												<Button variant="outline" size="sm" asChild>
													<a href={doc.file_url} target="_blank" rel="noreferrer">
														View
													</a>
												</Button>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-500">No documents uploaded</p>
								)}
							</div>

							{/* Actions */}
							{selectedClaim.status === 'approved' && (
								<div className="pt-4 border-t border-slate-200">
									<Button
										onClick={() => updateClaimStatus(selectedClaim.id, 'paid', {
											activity_message: 'Payment processed',
										})}
										className="w-full"
									>
										<DollarSign className="h-4 w-4 mr-2" />
										Process Payout
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}

