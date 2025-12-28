'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UsersRound, Search, Plus, Shield, Clock, Eye } from 'lucide-react'

type TeamMember = {
	id: string
	name: string
	email: string
	role: 'root_admin' | 'admin' | 'support' | 'analyst'
	status: 'active' | 'inactive'
	last_active: string | null
	created_at: string
	permissions: string[]
}

type ActivityLog = {
	id: string
	user_name: string
	action: string
	resource: string
	timestamp: string
}

export default function TeamPage() {
	const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'activity'>('members')
	const [members, setMembers] = useState<TeamMember[]>([])
	const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [roleFilter, setRoleFilter] = useState<string>('all')

	useEffect(() => {
		fetchData()
	}, [activeTab])

	const fetchData = async () => {
		setLoading(true)
		try {
			if (activeTab === 'members') {
				// Note: You may need to create an endpoint for team members
				setMembers([])
			} else if (activeTab === 'activity') {
				// Note: You may need to create an endpoint for activity logs
				setActivityLogs([])
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredMembers = useMemo(() => {
		let filtered = members

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.email.toLowerCase().includes(query)
			)
		}

		if (roleFilter !== 'all') {
			filtered = filtered.filter((m) => m.role === roleFilter)
		}

		return filtered
	}, [members, searchQuery, roleFilter])

	const roleLabels: Record<TeamMember['role'], string> = {
		root_admin: 'Root Admin',
		admin: 'Admin',
		support: 'Support',
		analyst: 'Analyst',
	}

	const memberColumns: Column<TeamMember>[] = [
		{
			key: 'name',
			header: 'Member',
			render: (member) => (
				<div>
					<p className="font-medium">{member.name}</p>
					<p className="text-xs text-slate-500">{member.email}</p>
				</div>
			),
		},
		{
			key: 'role',
			header: 'Role',
			render: (member) => (
				<Badge variant="secondary">
					<Shield className="h-3 w-3 mr-1" />
					{roleLabels[member.role]}
				</Badge>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (member) => (
				<Badge variant={member.status === 'active' ? 'default' : 'outline'}>
					{member.status}
				</Badge>
			),
		},
		{
			key: 'last_active',
			header: 'Last Active',
			render: (member) =>
				member.last_active ? new Date(member.last_active).toLocaleString() : 'Never',
		},
		{
			key: 'permissions',
			header: 'Permissions',
			render: (member) => (
				<span className="text-sm text-slate-600">{member.permissions.length} permissions</span>
			),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (member) => (
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm">
						<Eye className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	]

	const activityColumns: Column<ActivityLog>[] = [
		{
			key: 'user_name',
			header: 'User',
		},
		{
			key: 'action',
			header: 'Action',
		},
		{
			key: 'resource',
			header: 'Resource',
		},
		{
			key: 'timestamp',
			header: 'Timestamp',
			render: (log) => new Date(log.timestamp).toLocaleString(),
		},
	]

	return (
		<>
			<PageHeader
				title="Team Management"
				subtitle="Manage team members, roles, and permissions."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Team</span>
					</div>
				}
				tabs={
					<div className="flex gap-1 border-b border-slate-200">
						<button
							onClick={() => setActiveTab('members')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'members'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Members
						</button>
						<button
							onClick={() => setActiveTab('roles')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'roles'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Roles & Permissions
						</button>
						<button
							onClick={() => setActiveTab('activity')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'activity'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Activity Logs
						</button>
					</div>
				}
				actions={
					activeTab === 'members' && (
						<Button size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Add Member
						</Button>
					)
				}
			/>

			{activeTab === 'members' && (
				<>
					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search team members..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<select
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Roles</option>
							<option value="root_admin">Root Admin</option>
							<option value="admin">Admin</option>
							<option value="support">Support</option>
							<option value="analyst">Analyst</option>
						</select>
					</div>

					{/* Members Table */}
					<DataTable
						columns={memberColumns}
						data={filteredMembers}
						loading={loading}
						emptyState={
							<EmptyState
								title="No team members found"
								subtitle="Add team members to manage your platform."
								icon={<UsersRound className="h-8 w-8" />}
								actions={
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										Add Member
									</Button>
								}
							/>
						}
					/>
				</>
			)}

			{activeTab === 'roles' && (
				<div className="py-12 text-center">
					<EmptyState
						title="Role & Permission Management"
						subtitle="Configure roles and permissions for team members. This interface will allow you to create custom roles and assign specific permissions."
						icon={<Shield className="h-8 w-8" />}
					/>
				</div>
			)}

			{activeTab === 'activity' && (
				<>
					{/* Activity Logs Table */}
					<DataTable
						columns={activityColumns}
						data={activityLogs}
						loading={loading}
						emptyState={
							<EmptyState
								title="No activity logs found"
								subtitle="Activity logs will appear here once team members start using the system."
								icon={<Clock className="h-8 w-8" />}
							/>
						}
					/>
				</>
			)}
		</>
	)
}
