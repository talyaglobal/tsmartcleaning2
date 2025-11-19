'use client'

import React, { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Download, Filter, Search, Calendar, DollarSign } from 'lucide-react'

type Invoice = {
	id: string
	invoice_number: string
	invoice_date: string
	due_date: string
	period_start?: string | null
	period_end?: string | null
	subtotal: number
	tax_amount: number
	total_amount: number
	paid_amount: number
	currency: string
	status: string
	payment_status: string
	paid_at?: string | null
	payment_method?: string | null
	description?: string | null
	created_at: string
}

type Company = {
	id: string
	name: string
}

export default function CompanyInvoicesPage() {
	const [company, setCompany] = useState<Company | null>(null)
	const [invoices, setInvoices] = useState<Invoice[]>([])
	const [loading, setLoading] = useState(true)
	const [total, setTotal] = useState(0)
	
	// Filters
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
	const [startDateFilter, setStartDateFilter] = useState<string>('')
	const [endDateFilter, setEndDateFilter] = useState<string>('')
	const [searchQuery, setSearchQuery] = useState<string>('')
	
	// Invoice generation dialog
	const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [newInvoice, setNewInvoice] = useState({
		invoice_date: new Date().toISOString().split('T')[0],
		due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		period_start: '',
		period_end: '',
		subtotal: '',
		tax_amount: '',
		description: '',
		notes: '',
	})

	useEffect(() => {
		fetchCompanyAndInvoices()
	}, [statusFilter, paymentStatusFilter, startDateFilter, endDateFilter])

	const fetchCompanyAndInvoices = async () => {
		try {
			// Get company
			const companyRes = await fetch('/api/companies/me')
			const companyData = await companyRes.json()
			
			if (!companyData.company) {
				console.error('No company found for user')
				setLoading(false)
				return
			}

			const companyId = companyData.company.id
			setCompany(companyData.company)

			// Build query params
			const params = new URLSearchParams()
			if (statusFilter !== 'all') params.append('status', statusFilter)
			if (paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter)
			if (startDateFilter) params.append('start_date', startDateFilter)
			if (endDateFilter) params.append('end_date', endDateFilter)

			// Fetch invoices
			const invoicesRes = await fetch(`/api/companies/${companyId}/invoices?${params.toString()}`)
			const invoicesData = await invoicesRes.json()

			setInvoices(invoicesData.invoices || [])
			setTotal(invoicesData.total || 0)
		} catch (error) {
			console.error('Error fetching invoices:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleGenerateInvoice = async () => {
		if (!company) return

		setGenerating(true)
		try {
			const response = await fetch(`/api/companies/${company.id}/invoices`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					invoice_date: newInvoice.invoice_date,
					due_date: newInvoice.due_date,
					period_start: newInvoice.period_start || null,
					period_end: newInvoice.period_end || null,
					subtotal: parseFloat(newInvoice.subtotal) || 0,
					tax_amount: parseFloat(newInvoice.tax_amount) || 0,
					total_amount: (parseFloat(newInvoice.subtotal) || 0) + (parseFloat(newInvoice.tax_amount) || 0),
					description: newInvoice.description || null,
					notes: newInvoice.notes || null,
					line_items: newInvoice.description ? [{
						description: newInvoice.description,
						quantity: 1,
						unit_price: parseFloat(newInvoice.subtotal) || 0,
						amount: parseFloat(newInvoice.subtotal) || 0,
					}] : [],
				}),
			})

			if (response.ok) {
				setIsGenerateDialogOpen(false)
				setNewInvoice({
					invoice_date: new Date().toISOString().split('T')[0],
					due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
					period_start: '',
					period_end: '',
					subtotal: '',
					tax_amount: '',
					description: '',
					notes: '',
				})
				fetchCompanyAndInvoices()
			} else {
				const error = await response.json()
				alert(`Failed to generate invoice: ${error.error || 'Unknown error'}`)
			}
		} catch (error) {
			console.error('Error generating invoice:', error)
			alert('Failed to generate invoice')
		} finally {
			setGenerating(false)
		}
	}

	const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
		if (!company) return

		try {
			const response = await fetch(`/api/companies/${company.id}/invoices/${invoiceId}/download`)
			if (response.ok) {
				const blob = await response.blob()
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = `invoice-${invoiceNumber}.pdf`
				document.body.appendChild(a)
				a.click()
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			} else {
				alert('Failed to download invoice')
			}
		} catch (error) {
			console.error('Error downloading invoice:', error)
			alert('Failed to download invoice')
		}
	}

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'paid':
				return 'default'
			case 'sent':
				return 'secondary'
			case 'overdue':
				return 'destructive'
			case 'draft':
				return 'outline'
			default:
				return 'outline'
		}
	}

	const getPaymentStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'paid':
				return 'default'
			case 'partial':
				return 'secondary'
			case 'overdue':
				return 'destructive'
			default:
				return 'outline'
		}
	}

	// Filter invoices by search query
	const filteredInvoices = invoices.filter((invoice) => {
		if (!searchQuery) return true
		const query = searchQuery.toLowerCase()
		return (
			invoice.invoice_number.toLowerCase().includes(query) ||
			invoice.description?.toLowerCase().includes(query) ||
			invoice.total_amount.toString().includes(query)
		)
	})

	// Calculate summary stats
	const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
	const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0)
	const totalOutstanding = totalInvoiced - totalPaid

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
					title="Invoices & Payments"
					subtitle="Manage and track company invoices and payments"
					actions={
						<Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
							<DialogTrigger asChild>
								<Button>
									<Plus className="w-4 h-4 mr-2" />
									Generate Invoice
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle>Generate New Invoice</DialogTitle>
									<DialogDescription>
										Create a new invoice for your company
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium mb-1 block">Invoice Date</label>
											<Input
												type="date"
												value={newInvoice.invoice_date}
												onChange={(e) => setNewInvoice({ ...newInvoice, invoice_date: e.target.value })}
											/>
										</div>
										<div>
											<label className="text-sm font-medium mb-1 block">Due Date</label>
											<Input
												type="date"
												value={newInvoice.due_date}
												onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
											/>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium mb-1 block">Period Start (Optional)</label>
											<Input
												type="date"
												value={newInvoice.period_start}
												onChange={(e) => setNewInvoice({ ...newInvoice, period_start: e.target.value })}
											/>
										</div>
										<div>
											<label className="text-sm font-medium mb-1 block">Period End (Optional)</label>
											<Input
												type="date"
												value={newInvoice.period_end}
												onChange={(e) => setNewInvoice({ ...newInvoice, period_end: e.target.value })}
											/>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium mb-1 block">Description</label>
										<Input
											value={newInvoice.description}
											onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
											placeholder="Service description"
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium mb-1 block">Subtotal ($)</label>
											<Input
												type="number"
												step="0.01"
												value={newInvoice.subtotal}
												onChange={(e) => setNewInvoice({ ...newInvoice, subtotal: e.target.value })}
												placeholder="0.00"
											/>
										</div>
										<div>
											<label className="text-sm font-medium mb-1 block">Tax Amount ($)</label>
											<Input
												type="number"
												step="0.01"
												value={newInvoice.tax_amount}
												onChange={(e) => setNewInvoice({ ...newInvoice, tax_amount: e.target.value })}
												placeholder="0.00"
											/>
										</div>
									</div>
									<div>
										<label className="text-sm font-medium mb-1 block">Total: ${((parseFloat(newInvoice.subtotal) || 0) + (parseFloat(newInvoice.tax_amount) || 0)).toFixed(2)}</label>
									</div>
									<div>
										<label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
										<Input
											value={newInvoice.notes}
											onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
											placeholder="Additional notes"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setIsGenerateDialogOpen(false)}
										disabled={generating}
									>
										Cancel
									</Button>
									<Button onClick={handleGenerateInvoice} disabled={generating}>
										{generating ? 'Generating...' : 'Generate Invoice'}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					}
				/>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div>
							<p className="text-xs text-muted-foreground">{invoices.length} invoices</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Paid</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
							<p className="text-xs text-muted-foreground">
								{((totalPaid / totalInvoiced) * 100 || 0).toFixed(1)}% paid
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Outstanding</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(2)}</div>
							<p className="text-xs text-muted-foreground">Pending payment</p>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Filter className="w-4 h-4" />
							Filters
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
							<div className="md:col-span-2">
								<div className="relative">
									<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search invoices..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-8"
									/>
								</div>
							</div>
							<div>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger>
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="draft">Draft</SelectItem>
										<SelectItem value="sent">Sent</SelectItem>
										<SelectItem value="paid">Paid</SelectItem>
										<SelectItem value="overdue">Overdue</SelectItem>
										<SelectItem value="cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
									<SelectTrigger>
										<SelectValue placeholder="Payment Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Payment Statuses</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
										<SelectItem value="partial">Partial</SelectItem>
										<SelectItem value="paid">Paid</SelectItem>
										<SelectItem value="overdue">Overdue</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex gap-2">
								<Input
									type="date"
									placeholder="Start Date"
									value={startDateFilter}
									onChange={(e) => setStartDateFilter(e.target.value)}
									className="flex-1"
								/>
								<Input
									type="date"
									placeholder="End Date"
									value={endDateFilter}
									onChange={(e) => setEndDateFilter(e.target.value)}
									className="flex-1"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Invoices Table */}
				<Card>
					<CardHeader>
						<CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 border-b">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{filteredInvoices.map((invoice) => (
										<tr key={invoice.id} className="hover:bg-gray-50">
											<td className="px-4 py-3 text-sm font-medium">{invoice.invoice_number}</td>
											<td className="px-4 py-3 text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
											<td className="px-4 py-3 text-sm">{new Date(invoice.due_date).toLocaleDateString()}</td>
											<td className="px-4 py-3 text-sm">{invoice.description || '—'}</td>
											<td className="px-4 py-3 text-sm font-medium">${invoice.total_amount.toFixed(2)}</td>
											<td className="px-4 py-3 text-sm">${invoice.paid_amount.toFixed(2)}</td>
											<td className="px-4 py-3">
												<div className="flex flex-col gap-1">
													<Badge variant={getStatusBadgeVariant(invoice.status)}>
														{invoice.status}
													</Badge>
													<Badge variant={getPaymentStatusBadgeVariant(invoice.payment_status)}>
														{invoice.payment_status}
													</Badge>
												</div>
											</td>
											<td className="px-4 py-3">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
												>
													<Download className="w-4 h-4 mr-1" />
													Download
												</Button>
											</td>
										</tr>
									))}
									{filteredInvoices.length === 0 && (
										<tr>
											<td colSpan={8} className="px-4 py-8 text-center text-gray-500">
												No invoices found
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</RequirePermission>
	)
}
