'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bell, Search, Plus, Send, Calendar, BarChart3, FileText } from 'lucide-react'

type Notification = {
	id: string
	title: string
	message: string
	type: 'email' | 'sms' | 'push' | 'in_app'
	status: 'draft' | 'scheduled' | 'sent' | 'failed'
	recipients: number
	sent_at: string | null
	scheduled_for: string | null
	created_at: string
}

type Template = {
	id: string
	name: string
	type: 'email' | 'sms' | 'push' | 'in_app'
	subject: string
	body: string
	created_at: string
}

export default function NotificationsPage() {
	const [activeTab, setActiveTab] = useState<'notifications' | 'templates'>('notifications')
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [templates, setTemplates] = useState<Template[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')

	useEffect(() => {
		fetchData()
	}, [activeTab])

	const fetchData = async () => {
		setLoading(true)
		try {
			if (activeTab === 'notifications') {
				const res = await fetch('/api/notifications', { cache: 'no-store' })
				if (res.ok) {
					const data = await res.json()
					setNotifications(data.notifications || [])
				}
			} else if (activeTab === 'templates') {
				// Note: You may need to create an endpoint for templates
				setTemplates([])
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredNotifications = useMemo(() => {
		let filtered = notifications

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(n) =>
					n.title.toLowerCase().includes(query) ||
					n.message.toLowerCase().includes(query)
			)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((n) => n.status === statusFilter)
		}

		return filtered
	}, [notifications, searchQuery, statusFilter])

	const notificationColumns: Column<Notification>[] = [
		{
			key: 'title',
			header: 'Title',
		},
		{
			key: 'type',
			header: 'Type',
			render: (notif) => (
				<Badge variant="outline">
					{notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
				</Badge>
			),
		},
		{
			key: 'recipients',
			header: 'Recipients',
			render: (notif) => <span>{notif.recipients.toLocaleString()}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (notif) => (
				<Badge
					variant={
						notif.status === 'sent'
							? 'default'
							: notif.status === 'scheduled'
							? 'secondary'
							: notif.status === 'failed'
							? 'destructive'
							: 'outline'
					}
				>
					{notif.status}
				</Badge>
			),
		},
		{
			key: 'scheduled_for',
			header: 'Scheduled',
			render: (notif) =>
				notif.scheduled_for ? new Date(notif.scheduled_for).toLocaleString() : '—',
		},
		{
			key: 'sent_at',
			header: 'Sent',
			render: (notif) =>
				notif.sent_at ? new Date(notif.sent_at).toLocaleString() : '—',
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (notif) => (
				<div className="flex items-center gap-2">
					{notif.status === 'draft' && (
						<Button variant="ghost" size="sm">
							<Send className="h-4 w-4" />
						</Button>
					)}
				</div>
			),
		},
	]

	const templateColumns: Column<Template>[] = [
		{
			key: 'name',
			header: 'Template Name',
		},
		{
			key: 'type',
			header: 'Type',
			render: (template) => (
				<Badge variant="outline">
					{template.type.charAt(0).toUpperCase() + template.type.slice(1)}
				</Badge>
			),
		},
		{
			key: 'subject',
			header: 'Subject',
		},
		{
			key: 'created_at',
			header: 'Created',
			render: (template) => new Date(template.created_at).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (template) => (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm">
						<FileText className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Notification Center"
				subtitle="Manage notifications, templates, and scheduling."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Notifications</span>
					</div>
				}
				tabs={
					<div className="flex gap-1 border-b border-slate-200">
						<button
							onClick={() => setActiveTab('notifications')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'notifications'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Notifications
						</button>
						<button
							onClick={() => setActiveTab('templates')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'templates'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Templates
						</button>
					</div>
				}
				actions={
					activeTab === 'notifications' ? (
						<Button size="sm">
							<Plus className="h-4 w-4 mr-2" />
							New Notification
						</Button>
					) : (
						<>
							<Button variant="outline" size="sm">
								<BarChart3 className="h-4 w-4 mr-2" />
								Analytics
							</Button>
							<Button size="sm">
								<Plus className="h-4 w-4 mr-2" />
								New Template
							</Button>
						</>
					)
				}
			/>

			{activeTab === 'notifications' && (
				<>
					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search notifications..."
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
							<option value="draft">Draft</option>
							<option value="scheduled">Scheduled</option>
							<option value="sent">Sent</option>
							<option value="failed">Failed</option>
						</select>
					</div>

					{/* Notifications Table */}
					<DataTable
						columns={notificationColumns}
						data={filteredNotifications}
						loading={loading}
						emptyState={
							<EmptyState
								title="No notifications found"
								description="Create and schedule notifications to keep users informed."
								icon={<Bell className="h-8 w-8" />}
								action={
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										New Notification
									</Button>
								}
							/>
						}
					/>
				</>
			)}

			{activeTab === 'templates' && (
				<>
					{/* Templates Table */}
					<DataTable
						columns={templateColumns}
						data={templates}
						loading={loading}
						emptyState={
							<EmptyState
								title="No templates found"
								description="Create reusable notification templates for common messages."
								icon={<FileText className="h-8 w-8" />}
								action={
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										New Template
									</Button>
								}
							/>
						}
					/>
				</>
			)}
		</>
	)
}
