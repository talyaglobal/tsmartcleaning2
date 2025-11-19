'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Plus, Edit, Trash2, X, Save, Search } from 'lucide-react'

type RevenueShareRule = {
	id: string
	tenant_id?: string | null
	provider_id?: string | null
	service_id?: string | null
	territory_id?: string | null
	platform_percent: number
	processing_fee_fixed_cents: number
	minimum_payout_cents: number
	priority: number
	active: boolean
	valid_from: string
	valid_to?: string | null
	name?: string | null
	created_at?: string
}

type Tenant = {
	id: string
	name: string
}

type Service = {
	id: string
	name: string
}

type Territory = {
	id: string
	name: string
	code: string
}

export default function RevenueShareRulesPage() {
	const [rules, setRules] = useState<RevenueShareRule[]>([])
	const [loading, setLoading] = useState(false)
	const [editingRule, setEditingRule] = useState<RevenueShareRule | null>(null)
	const [showForm, setShowForm] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	
	// Filter states
	const [filterTenantId, setFilterTenantId] = useState<string>('')
	const [filterActive, setFilterActive] = useState<string>('')
	
	// Lookup data
	const [tenants, setTenants] = useState<Tenant[]>([])
	const [services, setServices] = useState<Service[]>([])
	const [territories, setTerritories] = useState<Territory[]>([])

	// Form state
	const [form, setForm] = useState<Partial<RevenueShareRule>>({
		platform_percent: 15,
		processing_fee_fixed_cents: 30,
		minimum_payout_cents: 2000,
		priority: 0,
		active: true,
		valid_from: new Date().toISOString().split('T')[0],
	})

	useEffect(() => {
		loadRules()
		loadLookupData()
	}, [])

	async function loadLookupData() {
		try {
			// Load tenants
			const tenantsRes = await fetch('/api/root-admin/tenants')
			const tenantsData = await tenantsRes.json()
			setTenants(tenantsData.tenants || [])

			// Load services
			const servicesRes = await fetch('/api/services')
			const servicesData = await servicesRes.json()
			setServices(servicesData.services || [])

			// Load territories
			const territoriesRes = await fetch('/api/root-admin/territories')
			const territoriesData = await territoriesRes.json()
			setTerritories(territoriesData.territories || [])
		} catch (err) {
			console.error('Error loading lookup data:', err)
		}
	}

	async function loadRules() {
		setLoading(true)
		setError(null)
		try {
			const params = new URLSearchParams()
			if (filterTenantId) params.set('tenant_id', filterTenantId)
			if (filterActive) params.set('active', filterActive)

			const res = await fetch(`/api/root-admin/revenue-share-rules?${params.toString()}`, {
				cache: 'no-store',
			})
			const json = await res.json()
			if (!res.ok) {
				throw new Error(json.error || 'Failed to load rules')
			}
			setRules(json.rules || [])
		} catch (err: any) {
			setError(err.message)
			console.error('Error loading rules:', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadRules()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterTenantId, filterActive])

	function startEdit(rule: RevenueShareRule) {
		setEditingRule(rule)
		setForm({
			...rule,
			valid_from: rule.valid_from ? rule.valid_from.split('T')[0] : new Date().toISOString().split('T')[0],
			valid_to: rule.valid_to ? rule.valid_to.split('T')[0] : undefined,
		})
		setShowForm(true)
	}

	function cancelEdit() {
		setEditingRule(null)
		setShowForm(false)
		setForm({
			platform_percent: 15,
			processing_fee_fixed_cents: 30,
			minimum_payout_cents: 2000,
			priority: 0,
			active: true,
			valid_from: new Date().toISOString().split('T')[0],
		})
		setError(null)
	}

	async function saveRule(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		setError(null)

		// Validate
		if (form.platform_percent === undefined || form.platform_percent < 0 || form.platform_percent > 100) {
			setError('Platform fee percentage must be between 0 and 100')
			setSaving(false)
			return
		}
		if (form.processing_fee_fixed_cents === undefined || form.processing_fee_fixed_cents < 0) {
			setError('Processing fee must be non-negative')
			setSaving(false)
			return
		}
		if (form.minimum_payout_cents === undefined || form.minimum_payout_cents < 0) {
			setError('Minimum payout must be non-negative')
			setSaving(false)
			return
		}

		try {
			const url = editingRule
				? `/api/root-admin/revenue-share-rules/${editingRule.id}`
				: '/api/root-admin/revenue-share-rules'
			const method = editingRule ? 'PATCH' : 'POST'

			const body: any = {
				tenant_id: form.tenant_id || null,
				provider_id: form.provider_id || null,
				service_id: form.service_id || null,
				territory_id: form.territory_id || null,
				platform_percent: form.platform_percent,
				processing_fee_fixed_cents: form.processing_fee_fixed_cents,
				minimum_payout_cents: form.minimum_payout_cents,
				priority: form.priority ?? 0,
				active: form.active ?? true,
				valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : new Date().toISOString(),
				valid_to: form.valid_to ? new Date(form.valid_to).toISOString() : null,
				name: form.name || null,
			}

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			const json = await res.json()
			if (!res.ok) {
				throw new Error(json.error || 'Failed to save rule')
			}

			cancelEdit()
			loadRules()
		} catch (err: any) {
			setError(err.message)
			console.error('Error saving rule:', err)
		} finally {
			setSaving(false)
		}
	}

	async function deleteRule(id: string) {
		if (!confirm('Are you sure you want to delete this revenue share rule?')) return

		try {
			const res = await fetch(`/api/root-admin/revenue-share-rules/${id}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				const json = await res.json()
				throw new Error(json.error || 'Failed to delete rule')
			}

			loadRules()
		} catch (err: any) {
			alert(err.message || 'Failed to delete rule')
			console.error('Error deleting rule:', err)
		}
	}

	function getScopeDescription(rule: RevenueShareRule): string {
		const parts: string[] = []
		if (rule.tenant_id) {
			const tenant = tenants.find((t) => t.id === rule.tenant_id)
			parts.push(`Tenant: ${tenant?.name || rule.tenant_id}`)
		}
		if (rule.provider_id) {
			parts.push(`Provider: ${rule.provider_id.substring(0, 8)}...`)
		}
		if (rule.service_id) {
			const service = services.find((s) => s.id === rule.service_id)
			parts.push(`Service: ${service?.name || rule.service_id}`)
		}
		if (rule.territory_id) {
			const territory = territories.find((t) => t.id === rule.territory_id)
			parts.push(`Territory: ${territory?.name || rule.territory_id}`)
		}
		return parts.length > 0 ? parts.join(', ') : 'Global (all)'
	}

	return (
		<>
			<PageHeader
				title="Revenue Share Rules"
				subtitle="Configure tenant/service/territory-specific revenue share overrides"
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">
							Root Admin
						</Link>
						<span className="mx-1">/</span>
						<span>Revenue Share Rules</span>
					</div>
				}
				actions={
					!showForm && (
						<Button onClick={() => setShowForm(true)}>
							<Plus className="h-4 w-4 mr-2" />
							New Rule
						</Button>
					)
				}
			/>

			<div className="space-y-6">
				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Filters</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<Label htmlFor="filter-tenant">Tenant</Label>
								<select
									id="filter-tenant"
									className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
									value={filterTenantId}
									onChange={(e) => setFilterTenantId(e.target.value)}
								>
									<option value="">All Tenants</option>
									{tenants.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<Label htmlFor="filter-active">Status</Label>
								<select
									id="filter-active"
									className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
									value={filterActive}
									onChange={(e) => setFilterActive(e.target.value)}
								>
									<option value="">All</option>
									<option value="true">Active</option>
									<option value="false">Inactive</option>
								</select>
							</div>
							<div className="flex items-end">
								<Button variant="outline" onClick={loadRules} disabled={loading}>
									<Search className="h-4 w-4 mr-2" />
									Refresh
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Form */}
				{showForm && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{editingRule ? 'Edit Rule' : 'New Revenue Share Rule'}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{error && (
								<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
									{error}
								</div>
							)}
							<form onSubmit={saveRule} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="name">Rule Name (optional)</Label>
										<Input
											id="name"
											value={form.name || ''}
											onChange={(e) => setForm({ ...form, name: e.target.value })}
											placeholder="e.g., Premium Tenant Override"
										/>
									</div>
									<div>
										<Label htmlFor="priority">Priority</Label>
										<Input
											id="priority"
											type="number"
											value={form.priority ?? 0}
											onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
										/>
										<p className="text-xs text-slate-500 mt-1">Higher priority rules take precedence</p>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="tenant_id">Tenant (optional)</Label>
										<select
											id="tenant_id"
											className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
											value={form.tenant_id || ''}
											onChange={(e) => setForm({ ...form, tenant_id: e.target.value || null })}
										>
											<option value="">All Tenants</option>
											{tenants.map((t) => (
												<option key={t.id} value={t.id}>
													{t.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<Label htmlFor="service_id">Service (optional)</Label>
										<select
											id="service_id"
											className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
											value={form.service_id || ''}
											onChange={(e) => setForm({ ...form, service_id: e.target.value || null })}
										>
											<option value="">All Services</option>
											{services.map((s) => (
												<option key={s.id} value={s.id}>
													{s.name}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="provider_id">Provider ID (optional)</Label>
										<Input
											id="provider_id"
											value={form.provider_id || ''}
											onChange={(e) => setForm({ ...form, provider_id: e.target.value || null })}
											placeholder="UUID"
										/>
									</div>
									<div>
										<Label htmlFor="territory_id">Territory (optional)</Label>
										<select
											id="territory_id"
											className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
											value={form.territory_id || ''}
											onChange={(e) => setForm({ ...form, territory_id: e.target.value || null })}
										>
											<option value="">All Territories</option>
											{territories.map((t) => (
												<option key={t.id} value={t.id}>
													{t.name} ({t.code})
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<Label htmlFor="platform_percent">
											Platform Fee (%) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="platform_percent"
											type="number"
											step="0.01"
											min="0"
											max="100"
											required
											value={form.platform_percent ?? ''}
											onChange={(e) =>
												setForm({ ...form, platform_percent: parseFloat(e.target.value) || 0 })
											}
										/>
									</div>
									<div>
										<Label htmlFor="processing_fee_fixed_cents">
											Processing Fee (cents) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="processing_fee_fixed_cents"
											type="number"
											min="0"
											required
											value={form.processing_fee_fixed_cents ?? ''}
											onChange={(e) =>
												setForm({
													...form,
													processing_fee_fixed_cents: parseInt(e.target.value) || 0,
												})
											}
										/>
									</div>
									<div>
										<Label htmlFor="minimum_payout_cents">
											Minimum Payout (cents) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="minimum_payout_cents"
											type="number"
											min="0"
											required
											value={form.minimum_payout_cents ?? ''}
											onChange={(e) =>
												setForm({
													...form,
													minimum_payout_cents: parseInt(e.target.value) || 0,
												})
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<Label htmlFor="valid_from">Valid From</Label>
										<Input
											id="valid_from"
											type="date"
											required
											value={form.valid_from || ''}
											onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="valid_to">Valid To (optional)</Label>
										<Input
											id="valid_to"
											type="date"
											value={form.valid_to || ''}
											onChange={(e) => setForm({ ...form, valid_to: e.target.value || null })}
										/>
									</div>
									<div className="flex items-end">
										<label className="flex items-center space-x-2 cursor-pointer">
											<input
												type="checkbox"
												checked={form.active ?? true}
												onChange={(e) => setForm({ ...form, active: e.target.checked })}
												className="rounded border-slate-300"
											/>
											<span className="text-sm">Active</span>
										</label>
									</div>
								</div>

								<div className="flex gap-2">
									<Button type="submit" disabled={saving}>
										<Save className="h-4 w-4 mr-2" />
										{saving ? 'Saving...' : 'Save Rule'}
									</Button>
									<Button type="button" variant="outline" onClick={cancelEdit}>
										<X className="h-4 w-4 mr-2" />
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				)}

				{/* Rules List */}
				{loading && <div className="text-center py-8 text-slate-500">Loading rules...</div>}
				{!loading && rules.length === 0 && (
					<Card>
						<CardContent className="py-8 text-center text-slate-500">
							<DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
							<p>No revenue share rules found.</p>
							<Button onClick={() => setShowForm(true)} className="mt-4">
								<Plus className="h-4 w-4 mr-2" />
								Create First Rule
							</Button>
						</CardContent>
					</Card>
				)}
				{!loading && rules.length > 0 && (
					<div className="grid grid-cols-1 gap-4">
						{rules.map((rule) => (
							<Card key={rule.id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="text-base">
												{rule.name || 'Unnamed Rule'}
											</CardTitle>
											<p className="text-sm text-slate-500 mt-1">
												{getScopeDescription(rule)}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge
												variant={rule.active ? 'default' : 'secondary'}
												className={rule.active ? 'bg-green-100 text-green-700' : ''}
											>
												{rule.active ? 'Active' : 'Inactive'}
											</Badge>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => startEdit(rule)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => deleteRule(rule.id)}
											>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
										<div>
											<p className="text-slate-500">Platform Fee</p>
											<p className="font-medium">{rule.platform_percent}%</p>
										</div>
										<div>
											<p className="text-slate-500">Processing Fee</p>
											<p className="font-medium">${(rule.processing_fee_fixed_cents / 100).toFixed(2)}</p>
										</div>
										<div>
											<p className="text-slate-500">Min Payout</p>
											<p className="font-medium">${(rule.minimum_payout_cents / 100).toFixed(2)}</p>
										</div>
										<div>
											<p className="text-slate-500">Priority</p>
											<p className="font-medium">{rule.priority}</p>
										</div>
									</div>
									<div className="mt-4 text-xs text-slate-500">
										<p>
											Valid: {new Date(rule.valid_from).toLocaleDateString()}
											{rule.valid_to && ` - ${new Date(rule.valid_to).toLocaleDateString()}`}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</>
	)
}

