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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, UserPlus, Users, Mail, Phone } from 'lucide-react'

type CompanyUser = {
	id: string
	user_id: string
	role: string
	permissions: any
	status: string
	invited_at: string | null
	joined_at: string | null
	user: {
		id: string
		email: string
		full_name: string
		phone: string | null
		avatar_url: string | null
		role: string
	}
}

type User = {
	id: string
	email: string
	full_name: string
	phone: string | null
}

export default function CompanyUsersPage() {
	const [companyId, setCompanyId] = useState<string | null>(null)
	const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
	const [allUsers, setAllUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingUser, setEditingUser] = useState<CompanyUser | null>(null)
	const [formData, setFormData] = useState({
		user_id: '',
		role: 'member',
		status: 'active',
	})
	const [userSearchQuery, setUserSearchQuery] = useState('')

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

			const [usersRes, allUsersRes] = await Promise.all([
				fetch(`/api/companies/${id}/users`),
				fetch('/api/users').catch(() => ({ users: [] })),
			])

			const usersData = await usersRes.json()
			const allUsersData = await allUsersRes.json()

			setCompanyUsers(usersData.users || [])
			setAllUsers(allUsersData.users || [])
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleOpenDialog = (user?: CompanyUser) => {
		if (user) {
			setEditingUser(user)
			setFormData({
				user_id: user.user_id,
				role: user.role,
				status: user.status,
			})
		} else {
			setEditingUser(null)
			setFormData({
				user_id: '',
				role: 'member',
				status: 'active',
			})
		}
		setDialogOpen(true)
	}

	const handleSubmit = async () => {
		if (!companyId) return

		try {
			const url = editingUser
				? `/api/companies/${companyId}/users/${editingUser.id}`
				: `/api/companies/${companyId}/users`
			
			const method = editingUser ? 'PATCH' : 'POST'

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			})

			if (!response.ok) {
				const error = await response.json()
				alert(error.error || 'Failed to save user')
				return
			}

			setDialogOpen(false)
			fetchData()
		} catch (error) {
			console.error('Error saving user:', error)
			alert('Failed to save user')
		}
	}

	const handleDelete = async (userId: string) => {
		if (!companyId) return
		if (!confirm('Are you sure you want to remove this user from the company?')) return

		try {
			const response = await fetch(`/api/companies/${companyId}/users/${userId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				alert('Failed to remove user')
				return
			}

			fetchData()
		} catch (error) {
			console.error('Error removing user:', error)
			alert('Failed to remove user')
		}
	}

	const getRoleBadgeVariant = (role: string) => {
		switch (role) {
			case 'admin':
				return 'default'
			case 'manager':
				return 'secondary'
			default:
				return 'outline'
		}
	}

	const filteredUsers = allUsers.filter((user) => {
		if (!userSearchQuery) return true
		const query = userSearchQuery.toLowerCase()
		return (
			user.email.toLowerCase().includes(query) ||
			user.full_name?.toLowerCase().includes(query)
		)
	})

	if (loading) {
		return (
			<RequirePermission permission="view_own_company">
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg" />
					))}
				</div>
			</RequirePermission>
		)
	}

	return (
		<RequirePermission permission="view_own_company">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<PageHeader
						title="User Management"
						subtitle="Manage team members for your company"
					/>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button onClick={() => handleOpenDialog()}>
								<UserPlus className="w-4 h-4 mr-2" />
								Add User
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg">
							<DialogHeader>
								<DialogTitle>
									{editingUser ? 'Edit User' : 'Add User to Company'}
								</DialogTitle>
								<DialogDescription>
									{editingUser ? 'Update user role and status' : 'Add a user to your company'}
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								{!editingUser && (
									<div>
										<Label htmlFor="user_search">Search Users</Label>
										<Input
											id="user_search"
											value={userSearchQuery}
											onChange={(e) => setUserSearchQuery(e.target.value)}
											placeholder="Search by name or email..."
										/>
										<Label htmlFor="user_id" className="mt-2">Select User *</Label>
										<Select
											value={formData.user_id}
											onValueChange={(value) => setFormData({ ...formData, user_id: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a user" />
											</SelectTrigger>
											<SelectContent>
												{filteredUsers.slice(0, 50).map((user) => (
													<SelectItem key={user.id} value={user.id}>
														{user.full_name} ({user.email})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
								<div>
									<Label htmlFor="role">Role *</Label>
									<Select
										value={formData.role}
										onValueChange={(value) => setFormData({ ...formData, role: value })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="manager">Manager</SelectItem>
											<SelectItem value="member">Member</SelectItem>
											<SelectItem value="viewer">Viewer</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="status">Status *</Label>
									<Select
										value={formData.status}
										onValueChange={(value) => setFormData({ ...formData, status: value })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
											<SelectItem value="suspended">Suspended</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDialogOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleSubmit} disabled={!formData.user_id && !editingUser}>
									{editingUser ? 'Update' : 'Add'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{companyUsers.map((companyUser) => (
						<Card key={companyUser.id}>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div className="flex items-center gap-2">
										<Users className="w-5 h-5 text-gray-400" />
										<CardTitle className="text-lg">
											{companyUser.user?.full_name || 'Unknown User'}
										</CardTitle>
									</div>
									<Badge variant={getRoleBadgeVariant(companyUser.role)}>
										{companyUser.role}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-gray-600">
										<Mail className="w-4 h-4" />
										{companyUser.user?.email}
									</div>
									{companyUser.user?.phone && (
										<div className="flex items-center gap-2 text-sm text-gray-600">
											<Phone className="w-4 h-4" />
											{companyUser.user.phone}
										</div>
									)}
									<div className="flex items-center gap-2 pt-2">
										<Badge variant={companyUser.status === 'active' ? 'default' : 'secondary'}>
											{companyUser.status}
										</Badge>
										{companyUser.joined_at && (
											<span className="text-xs text-gray-500">
												Joined {new Date(companyUser.joined_at).toLocaleDateString()}
											</span>
										)}
									</div>
									<div className="flex gap-2 pt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleOpenDialog(companyUser)}
										>
											<Edit className="w-3 h-3 mr-1" />
											Edit
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleDelete(companyUser.id)}
										>
											<Trash2 className="w-3 h-3 mr-1" />
											Remove
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
					{companyUsers.length === 0 && (
						<Card className="col-span-full">
							<CardContent className="p-6 text-center text-gray-500">
								No users yet. Add your first team member to get started.
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</RequirePermission>
	)
}

