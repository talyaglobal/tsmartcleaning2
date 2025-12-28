'use client'

import { useEffect, useState } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type FinancialMetric = {
	label: string
	value: string
	change?: number
	trend?: 'up' | 'down'
}

type Transaction = {
	id: string
	type: 'revenue' | 'payout' | 'fee' | 'refund'
	amount: number
	description: string
	date: string
	status: 'completed' | 'pending' | 'failed'
}

export default function FinancesPage() {
	const [metrics, setMetrics] = useState<FinancialMetric[]>([])
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [loading, setLoading] = useState(true)
	const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

	useEffect(() => {
		fetchFinancialData()
	}, [period])

	const fetchFinancialData = async () => {
		setLoading(true)
		try {
			// Note: You may need to create endpoints for financial data
			// For now, using placeholder data
			setMetrics([
				{ label: 'Total Revenue', value: '$125,430', change: 12.5, trend: 'up' },
				{ label: 'Total Costs', value: '$89,200', change: -5.2, trend: 'down' },
				{ label: 'Net Profit', value: '$36,230', change: 8.3, trend: 'up' },
				{ label: 'Pending Payouts', value: '$12,450', change: 2.1, trend: 'up' },
			])
			setTransactions([])
		} catch (error) {
			console.error('Error fetching financial data:', error)
		} finally {
			setLoading(false)
		}
	}

	const transactionColumns: Column<Transaction>[] = [
		{
			key: 'date',
			header: 'Date',
			render: (tx) => new Date(tx.date).toLocaleDateString(),
		},
		{
			key: 'type',
			header: 'Type',
			render: (tx) => (
				<Badge
					variant={
						tx.type === 'revenue'
							? 'default'
							: tx.type === 'payout'
							? 'secondary'
							: 'outline'
					}
				>
					{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
				</Badge>
			),
		},
		{
			key: 'description',
			header: 'Description',
		},
		{
			key: 'amount',
			header: 'Amount',
			render: (tx) => (
				<span
					className={`font-medium ${
						tx.type === 'revenue' ? 'text-green-600' : 'text-red-600'
					}`}
				>
					{tx.type === 'revenue' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (tx) => (
				<Badge
					variant={
						tx.status === 'completed'
							? 'default'
							: tx.status === 'pending'
							? 'secondary'
							: 'destructive'
					}
				>
					{tx.status}
				</Badge>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Financial Overview"
				subtitle="Revenue, costs, payouts, and more."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Financial Overview</span>
					</div>
				}
				actions={
					<>
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
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4 mr-2" />
							Export
						</Button>
					</>
				}
			/>

			{/* Metrics Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{metrics.map((metric, idx) => (
					<div key={idx} className="bg-white rounded-lg border border-slate-200 p-4">
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm text-slate-600">{metric.label}</p>
							{metric.trend === 'up' ? (
								<ArrowUpRight className="h-4 w-4 text-green-500" />
							) : metric.trend === 'down' ? (
								<ArrowDownRight className="h-4 w-4 text-red-500" />
							) : null}
						</div>
						<p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
						{metric.change !== undefined && (
							<p
								className={`text-xs mt-1 ${
									metric.change >= 0 ? 'text-green-600' : 'text-red-600'
								}`}
							>
								{metric.change >= 0 ? '+' : ''}
								{metric.change.toFixed(1)}% from last period
							</p>
						)}
					</div>
				))}
			</div>

			{/* Transaction History */}
			<div className="mb-6">
				<h2 className="text-lg font-semibold text-slate-900 mb-4">Transaction History</h2>
				<DataTable
					columns={transactionColumns}
					data={transactions}
					loading={loading}
					emptyState={
						<EmptyState
							title="No transactions found"
							subtitle="Transaction history will appear here once data is available."
							icon={<DollarSign className="h-8 w-8" />}
						/>
					}
				/>
			</div>

			{/* Payout Tracking */}
			<div>
				<h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Payouts</h2>
				<div className="bg-white rounded-lg border border-slate-200 p-6">
					<EmptyState
						title="Payout tracking"
						subtitle="Payout tracking and processing interface coming soon."
						icon={<DollarSign className="h-8 w-8" />}
						compact
					/>
				</div>
			</div>
		</>
	)
}
