'use client'

import React, { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Building, Settings, Plus, Trash2, CheckCircle2 } from 'lucide-react'

type BillingSettings = {
	id?: string
	company_id: string
	billing_email: string | null
	billing_address: string | null
	billing_city: string | null
	billing_state: string | null
	billing_zip_code: string | null
	billing_country: string
	payment_method: string | null
	payment_terms: string
	auto_pay: boolean
	tax_id: string | null
	currency: string
	settings: any
}

type PaymentMethod = {
	id: string
	type: string
	provider: string | null
	last4: string | null
	brand: string | null
	expiry_month: number | null
	expiry_year: number | null
	is_default: boolean
	status: string
}

export default function CompanyBillingPage() {
	const [companyId, setCompanyId] = useState<string | null>(null)
	const [billing, setBilling] = useState<BillingSettings | null>(null)
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [formData, setFormData] = useState<BillingSettings>({
		company_id: '',
		billing_email: '',
		billing_address: '',
		billing_city: '',
		billing_state: '',
		billing_zip_code: '',
		billing_country: 'US',
		payment_method: '',
		payment_terms: 'net_30',
		auto_pay: false,
		tax_id: '',
		currency: 'USD',
		settings: {},
	})

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		try {
			const companyRes = await fetch('/api/companies/me')
			const companyData = await companyRes.json()
			
			if (!companyData.company) {
				setLoading(false)
				return
			}

			const id = companyData.company.id
			setCompanyId(id)

			const [billingRes, paymentMethodsRes] = await Promise.all([
				fetch(`/api/companies/${id}/billing`),
				fetch(`/api/companies/${id}/payment-methods`),
			])

			const billingData = await billingRes.json()
			const paymentMethodsData = await paymentMethodsRes.json()

			if (billingData.billing) {
				setBilling(billingData.billing)
				setFormData({
					...billingData.billing,
					billing_email: billingData.billing.billing_email || '',
					billing_address: billingData.billing.billing_address || '',
					billing_city: billingData.billing.billing_city || '',
					billing_state: billingData.billing.billing_state || '',
					billing_zip_code: billingData.billing.billing_zip_code || '',
					tax_id: billingData.billing.tax_id || '',
					payment_method: billingData.billing.payment_method || '',
				})
			}

			setPaymentMethods(paymentMethodsData.payment_methods || [])
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSaveBilling = async () => {
		if (!companyId) return

		setSaving(true)
		try {
			const response = await fetch(`/api/companies/${companyId}/billing`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					billing_email: formData.billing_email || null,
					billing_address: formData.billing_address || null,
					billing_city: formData.billing_city || null,
					billing_state: formData.billing_state || null,
					billing_zip_code: formData.billing_zip_code || null,
					tax_id: formData.tax_id || null,
					payment_method: formData.payment_method || null,
				}),
			})

			if (!response.ok) {
				const error = await response.json()
				alert(error.error || 'Failed to save billing settings')
				return
			}

			alert('Billing settings saved successfully')
			fetchData()
		} catch (error) {
			console.error('Error saving billing:', error)
			alert('Failed to save billing settings')
		} finally {
			setSaving(false)
		}
	}

	const handleSetDefaultPaymentMethod = async (methodId: string) => {
		if (!companyId) return

		try {
			const response = await fetch(`/api/companies/${companyId}/payment-methods/${methodId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_default: true }),
			})

			if (!response.ok) {
				alert('Failed to set default payment method')
				return
			}

			fetchData()
		} catch (error) {
			console.error('Error setting default payment method:', error)
			alert('Failed to set default payment method')
		}
	}

	const handleDeletePaymentMethod = async (methodId: string) => {
		if (!companyId) return
		if (!confirm('Are you sure you want to delete this payment method?')) return

		try {
			const response = await fetch(`/api/companies/${companyId}/payment-methods/${methodId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				alert('Failed to delete payment method')
				return
			}

			fetchData()
		} catch (error) {
			console.error('Error deleting payment method:', error)
			alert('Failed to delete payment method')
		}
	}

	if (loading) {
		return (
			<RequirePermission permission="manage_invoices">
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg" />
					))}
				</div>
			</RequirePermission>
		)
	}

	return (
		<RequirePermission permission="manage_invoices">
			<div className="space-y-6">
				<PageHeader
					title="Billing & Payments"
					subtitle="Manage billing settings and payment methods"
				/>

				<Tabs defaultValue="settings" className="space-y-4">
					<TabsList>
						<TabsTrigger value="settings">Billing Settings</TabsTrigger>
						<TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Settings className="w-5 h-5" />
									Billing Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label htmlFor="billing_email">Billing Email</Label>
									<Input
										id="billing_email"
										type="email"
										value={formData.billing_email}
										onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
										placeholder="billing@company.com"
									/>
								</div>
								<div>
									<Label htmlFor="billing_address">Billing Address</Label>
									<Input
										id="billing_address"
										value={formData.billing_address}
										onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
										placeholder="Street address"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="billing_city">City</Label>
										<Input
											id="billing_city"
											value={formData.billing_city}
											onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="billing_state">State</Label>
										<Input
											id="billing_state"
											value={formData.billing_state}
											onChange={(e) => setFormData({ ...formData, billing_state: e.target.value })}
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="billing_zip_code">Zip Code</Label>
										<Input
											id="billing_zip_code"
											value={formData.billing_zip_code}
											onChange={(e) => setFormData({ ...formData, billing_zip_code: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="billing_country">Country</Label>
										<Input
											id="billing_country"
											value={formData.billing_country}
											onChange={(e) => setFormData({ ...formData, billing_country: e.target.value })}
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="tax_id">Tax ID</Label>
									<Input
										id="tax_id"
										value={formData.tax_id}
										onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
										placeholder="EIN or Tax ID"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="payment_terms">Payment Terms</Label>
										<Select
											value={formData.payment_terms}
											onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
												<SelectItem value="net_15">Net 15</SelectItem>
												<SelectItem value="net_30">Net 30</SelectItem>
												<SelectItem value="net_60">Net 60</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="currency">Currency</Label>
										<Select
											value={formData.currency}
											onValueChange={(value) => setFormData({ ...formData, currency: value })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="USD">USD ($)</SelectItem>
												<SelectItem value="EUR">EUR (€)</SelectItem>
												<SelectItem value="GBP">GBP (£)</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Switch
										id="auto_pay"
										checked={formData.auto_pay}
										onCheckedChange={(checked) => setFormData({ ...formData, auto_pay: checked })}
									/>
									<Label htmlFor="auto_pay">Enable Auto Pay</Label>
								</div>
								<Button onClick={handleSaveBilling} disabled={saving}>
									{saving ? 'Saving...' : 'Save Billing Settings'}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="payment-methods" className="space-y-4">
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle className="flex items-center gap-2">
										<CreditCard className="w-5 h-5" />
										Payment Methods
									</CardTitle>
									<Button variant="outline" size="sm">
										<Plus className="w-4 h-4 mr-2" />
										Add Payment Method
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{paymentMethods.map((method) => (
										<div
											key={method.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center gap-4">
												<CreditCard className="w-8 h-8 text-gray-400" />
												<div>
													<div className="font-medium capitalize">
														{method.brand || method.type} •••• {method.last4 || '****'}
													</div>
													<div className="text-sm text-gray-600">
														{method.expiry_month && method.expiry_year
															? `Expires ${method.expiry_month}/${method.expiry_year}`
															: method.type}
													</div>
												</div>
												{method.is_default && (
													<Badge variant="default">
														<CheckCircle2 className="w-3 h-3 mr-1" />
														Default
													</Badge>
												)}
											</div>
											<div className="flex gap-2">
												{!method.is_default && (
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleSetDefaultPaymentMethod(method.id)}
													>
														Set Default
													</Button>
												)}
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleDeletePaymentMethod(method.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>
									))}
									{paymentMethods.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											No payment methods added yet. Add a payment method to get started.
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</RequirePermission>
	)
}

