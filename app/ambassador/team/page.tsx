'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column } from '@/components/admin/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, UserPlus, Phone, Mail, Star, CheckCircle, Clock, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

type TeamMember = {
	id: string
	name: string
	email: string
	phone: string
	status: 'active' | 'on_leave' | 'unavailable'
	rating: number
	jobsCompleted: number
	lastActive: string
}

export default function AmbassadorTeamPage() {
	const { user } = useAuth()
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
	const [loading, setLoading] = useState(true)
	const [addDialogOpen, setAddDialogOpen] = useState(false)
	const [newMemberEmail, setNewMemberEmail] = useState('')
	const [newMemberName, setNewMemberName] = useState('')
	const [newMemberPhone, setNewMemberPhone] = useState('')

	useEffect(() => {
		if (user?.id) {
			fetchTeamMembers()
		}
	}, [user?.id])

	const fetchTeamMembers = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const response = await fetch(`/api/ambassador/team?ambassadorId=${user.id}`)
			const data = await response.json()
			if (data.teamMembers) {
				setTeamMembers(data.teamMembers.map((m: any) => ({
					id: m.id,
					name: m.name || `${m.first_name} ${m.last_name}`,
					email: m.email,
					phone: m.phone || '',
					status: m.status || 'active',
					rating: m.rating || 0,
					jobsCompleted: m.jobs_completed || 0,
					lastActive: m.last_active || 'Never',
				})))
			}
		} catch (error) {
			console.error('Error fetching team members:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleAddMember = async () => {
		if (!user?.id || !newMemberEmail || !newMemberName) return
		
		try {
			const response = await fetch('/api/ambassador/team', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ambassadorId: user.id,
					email: newMemberEmail,
					name: newMemberName,
					phone: newMemberPhone,
				}),
			})
			
			if (response.ok) {
				setNewMemberEmail('')
				setNewMemberName('')
				setNewMemberPhone('')
				setAddDialogOpen(false)
				fetchTeamMembers()
			}
		} catch (error) {
			console.error('Error adding team member:', error)
		}
	}

	const columns: Column<TeamMember>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email' },
		{ key: 'phone', header: 'Phone' },
		{ 
			key: 'status', 
			header: 'Status',
			render: (member) => (
				<Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
					{member.status === 'active' ? 'Active' : member.status === 'on_leave' ? 'On Leave' : 'Unavailable'}
				</Badge>
			)
		},
		{ 
			key: 'rating', 
			header: 'Rating',
			render: (member) => (
				<div className="flex items-center gap-1">
					<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
					<span>{member.rating.toFixed(1)}</span>
				</div>
			)
		},
		{ key: 'jobsCompleted', header: 'Jobs Completed' },
		{ key: 'lastActive', header: 'Last Active' },
	]

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="My Team"
				subtitle="Manage your team members"
				actions={
					<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<UserPlus className="h-4 w-4 mr-2" />
								Add Team Member
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Team Member</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={newMemberName}
										onChange={(e) => setNewMemberName(e.target.value)}
										placeholder="Full name"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={newMemberEmail}
										onChange={(e) => setNewMemberEmail(e.target.value)}
										placeholder="email@example.com"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">Phone</Label>
									<Input
										id="phone"
										value={newMemberPhone}
										onChange={(e) => setNewMemberPhone(e.target.value)}
										placeholder="+1 (555) 000-0000"
									/>
								</div>
								<Button onClick={handleAddMember} className="w-full">
									Add Member
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Team Members ({teamMembers.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						data={teamMembers}
						columns={columns}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
