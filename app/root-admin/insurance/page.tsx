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
	X, BarChart3, TrendingUp, DollarSign, Users, FileCheck, Calendar
} from 'lucide-react'

type Policy = {
	id: string
	policy_number: string
	user_id: string
	user_name: string
	user_email: string
	plan_id: string
	plan_name: string
	plan_code: string
	status: 'active' | 'expired' | 'cancelled' | 'pending_activation'
	effective_date: string
	expiration_date: string
	billing_cycle: string
	created_at: string
}

type Plan = {
	id: string
	name: string
	code: string
	description: string | null
	monthly_price: number
	annual_price: number
	coverage_limit: number | null
	status: 'active' | 'inactive'
}

type Analytics = {
	metrics: {
		totalPolicies: number
		activePolicies: number
		newPolicies: number
		totalRevenue: number
		totalPlans: number
		activePlans: number
	}
	statusCounts: Record<string, number>
	planCounts: Record<string, number>
}

export default function InsurancePage() {
	const [activeTab, setActiveTab] = useState<'analytics' | 'policies' | 'plans'>('analytics')
	const [policies, setPolicies] = useState<Policy[]>([])
	const [plans, setPlans] = useState<Plan[]>([])
	const [analytics, setAnalytics] = useState<Analytics | null>(null)
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
	
	// Modal states
	const [showPolicyModal, setShowPolicyModal] = useState(false)
	const [showPlanModal, setShowPlanModal] = useState(false)
	const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
	const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
	
	// Form states
	const [policyForm, setPolicyForm] = useState({
		user_id: '',
		plan_id: '',
		effective_date: new Date().toISOString().split('T')[0],
		billing_cycle: 'annual' as 'annual' | 'monthly',
		status: 'active' as 'active' | 'expired' | 'cancelled' | 'pending_activation',
	})
	const [planForm, setPlanForm] = useState({
		name: '',
		code: '',
		description: '',
		monthly_price: '',
		annual_price: '',
		coverage_limit: '',
		status: 'active' as 'active' | 'inactive',
	})

	useEffect(() => {
		fetchData()
	}, [activeTab, period])

	const fetchData = async () => {
		setLoading(true)
		try {
			const headers: HeadersInit = {}

			if (activeTab === 'analytics') {
				const res = await fetch(`/api/root-admin/insurance/analytics?period=${period}`, { 
					headers,
					cache: 'no-store' 
				})
				if (res.ok) {
					const data = await res.json()
					setAnalytics(data)
				}
			} else if (activeTab === 'policies') {
				const res = await fetch('/api/root-admin/insurance/policies', { 
					headers,
					cache: 'no-store' 
				})
				if (res.ok) {
					const data = await res.json()
					setPolicies(data.policies || [])
				}
			} else if (activeTab === 'plans') {
				const res = await fetch('/api/root-admin/insurance/plans', { 
					headers,
					cache: 'no-store' 
				})
				if (res.ok) {
					const data = await res.json()
					setPlans(data.plans || [])
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
			billing_cycle: 'annual',
			status: 'active',
		})
		setShowPolicyModal(true)
	}

	const handleEditPolicy = (policy: Policy) => {
		setEditingPolicy(policy)
		setPolicyForm({
			user_id: policy.user_id,
			plan_id: policy.plan_id,
			effective_date: policy.effective_date,
			billing_cycle: policy.billing_cycle as 'annual' | 'monthly',
			status: policy.status,
		})
		setShowPolicyModal(true)
	}

	const handleSavePolicy = async () => {
		try {
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
				'x-user-role': 'root_admin',
			}

			if (editingPolicy) {
				const res = await fetch(`/api/root-admin/insurance/policies/${editingPolicy.id}`, {
					method: 'PATCH',
					headers,
					body: JSON.stringify(policyForm),
				})
				if (res.ok) {
					setShowPolicyModal(false)
					fetchData()
				}
			} else {
				const res = await fetch('/api/root-admin/insurance/policies', {
					method: 'POST',
					headers,
					body: JSON.stringify(policyForm),
				})
				if (res.ok) {
					setShowPolicyModal(false)
					fetchData()
				}
			}
		} catch (error) {
			console.error('Error saving policy:', error)
		}
	}

	const handleDeletePolicy = async (id: string) => {
		if (!confirm('Are you sure you want to delete this policy?')) return
		try {
			const headers: HeadersInit = {}
			const res = await fetch(`/api/root-admin/insurance/policies/${id}`, {
				method: 'DELETE',
				headers,
			})
			if (res.ok) {
				fetchData()
			}
		} catch (error) {
			console.error('Error deleting policy:', error)
		}
	}

	const handleCreatePlan = () => {
		setEditingPlan(null)
		setPlanForm({
			name: '',
			code: '',
			description: '',
			monthly_price: '',
			annual_price: '',
			coverage_limit: '',
			status: 'active',
		})
		setShowPlanModal(true)
	}

	const handleEditPlan = (plan: Plan) => {
		setEditingPlan(plan)
		setPlanForm({
			name: plan.name,
			code: plan.code,
			description: plan.description || '',
			monthly_price: plan.monthly_price.toString(),
			annual_price: plan.annual_price.toString(),
			coverage_limit: plan.coverage_limit?.toString() || '',
			status: plan.status,
		})
		setShowPlanModal(true)
	}

	const handleSavePlan = async () => {
		try {
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
				'x-user-role': 'root_admin',
			}

			const payload = {
				...planForm,
				monthly_price: parseFloat(planForm.monthly_price),
				annual_price: parseFloat(planForm.annual_price),
				coverage_limit: planForm.coverage_limit ? parseFloat(planForm.coverage_limit) : null,
			}

			if (editingPlan) {
				const res = await fetch(`/api/root-admin/insurance/plans/${editingPlan.id}`, {
					method: 'PATCH',
					headers,
					body: JSON.stringify(payload),
				})
				if (res.ok) {
					setShowPlanModal(false)
					fetchData()
				}
			} else {
				const res = await fetch('/api/root-admin/insurance/plans', {
					method: 'POST',
					headers,
					body: JSON.stringify(payload),
				})
				if (res.ok) {
					setShowPlanModal(false)
					fetchData()
				}
			}
		} catch (error) {
			console.error('Error saving plan:', error)
		}
	}

	const handleDeletePlan = async (id: string) => {
		if (!confirm('Are you sure you want to delete this plan?')) return
		try {
			const headers: HeadersInit = {}
			const res = await fetch(`/api/root-admin/insurance/plans/${id}`, {
				method: 'DELETE',
				headers,
			})
			if (res.ok) {
				fetchData()
			} else {
				const data = await res.json()
				alert(data.error || 'Failed to delete plan')
			}
		} catch (error) {
			console.error('Error deleting plan:', error)
		}
	}

	const handleGenerateCertificate = async (policy: Policy) => {
		try {
			const url = `/api/insurance/certificate?name=${encodeURIComponent(policy.user_name)}`
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

	const planColumns: Column<Plan>[] = [
		{
			key: 'name',
			header: 'Plan Name',
		},
		{
			key: 'code',
			header: 'Code',
			render: (plan) => <span className="font-mono text-sm">{plan.code}</span>,
		},
		{
			key: 'pricing',
			header: 'Pricing',
			render: (plan) => (
				<div>
					<p className="text-sm">${plan.monthly_price}/mo</p>
					<p className="text-xs text-slate-500">${plan.annual_price}/yr</p>
				</div>
			),
		},
		{
			key: 'coverage_limit',
			header: 'Coverage',
			render: (plan) => (
				<span className="text-sm">
					{plan.coverage_limit ? `$${plan.coverage_limit.toLocaleString()}` : 'N/A'}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (plan) => (
				<Badge variant={plan.status === 'active' ? 'default' : 'outline'}>
					{plan.status}
				</Badge>
			),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (plan) => (
				<div className="flex items-center gap-2">
					<Button 
						variant="ghost" 
						size="sm"
						onClick={() => handleEditPlan(plan)}
						title="Edit Plan"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button 
						variant="ghost" 
						size="sm"
						onClick={() => handleDeletePlan(plan.id)}
						title="Delete Plan"
					>
						<Trash2 className="h-4 w-4 text-red-500" />
					</Button>
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Insurance Management"
				subtitle="Manage policies, plans, certificates, and analytics."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
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
							onClick={() => setActiveTab('plans')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'plans'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Plans
						</button>
					</div>
				}
				actions={
					activeTab === 'analytics' ? (
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
					) : activeTab === 'plans' ? (
						<Button size="sm" onClick={handleCreatePlan}>
							<Plus className="h-4 w-4 mr-2" />
							Add Plan
						</Button>
					) : (
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
					)
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
							</div>
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

			{activeTab === 'plans' && (
				<>
					{/* Plans Table */}
					<DataTable
						columns={planColumns}
						data={plans}
						loading={loading}
						emptyState={
							<EmptyState
								title="No plans found"
								description="Insurance plan configuration. Add plans to manage pricing and features."
								icon={<FileText className="h-8 w-8" />}
								action={
									<Button onClick={handleCreatePlan}>
										<Plus className="h-4 w-4 mr-2" />
										Add Plan
									</Button>
								}
							/>
						}
					/>
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

			{/* Plan Modal */}
			{showPlanModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</CardTitle>
								<Button variant="ghost" size="sm" onClick={() => setShowPlanModal(false)}>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="plan_name">Plan Name</Label>
								<Input
									id="plan_name"
									value={planForm.name}
									onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
									placeholder="e.g., Basic Protection"
								/>
							</div>
							<div>
								<Label htmlFor="plan_code">Plan Code</Label>
								<Input
									id="plan_code"
									value={planForm.code}
									onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
									placeholder="e.g., BASIC"
								/>
							</div>
							<div>
								<Label htmlFor="plan_description">Description</Label>
								<Textarea
									id="plan_description"
									value={planForm.description}
									onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
									placeholder="Plan description..."
									rows={3}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="monthly_price">Monthly Price ($)</Label>
									<Input
										id="monthly_price"
										type="number"
										step="0.01"
										value={planForm.monthly_price}
										onChange={(e) => setPlanForm({ ...planForm, monthly_price: e.target.value })}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="annual_price">Annual Price ($)</Label>
									<Input
										id="annual_price"
										type="number"
										step="0.01"
										value={planForm.annual_price}
										onChange={(e) => setPlanForm({ ...planForm, annual_price: e.target.value })}
										placeholder="0.00"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="coverage_limit">Coverage Limit ($)</Label>
								<Input
									id="coverage_limit"
									type="number"
									step="0.01"
									value={planForm.coverage_limit}
									onChange={(e) => setPlanForm({ ...planForm, coverage_limit: e.target.value })}
									placeholder="Optional"
								/>
							</div>
							<div>
								<Label htmlFor="plan_status">Status</Label>
								<select
									id="plan_status"
									value={planForm.status}
									onChange={(e) => setPlanForm({ ...planForm, status: e.target.value as 'active' | 'inactive' })}
									className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</select>
							</div>
							<div className="flex justify-end gap-2 pt-4">
								<Button variant="outline" onClick={() => setShowPlanModal(false)}>
									Cancel
								</Button>
								<Button onClick={handleSavePlan}>
									{editingPlan ? 'Update' : 'Create'} Plan
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</>
	)
}
