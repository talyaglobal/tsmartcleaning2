'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Plus, UserPlus, Trash2, X } from 'lucide-react'

interface TeamMember {
	id: string
	user_id: string
	role: string
	user: {
		id: string
		full_name: string
		email: string
		phone?: string
	}
}

interface Team {
	id: string
	name: string
	description?: string
	company_id?: string
	ambassador_id?: string
	created_at: string
	members?: TeamMember[]
}

interface AvailableUser {
	id: string
	full_name: string
	email: string
	role: string
}

export function TeamManagement() {
	const [teams, setTeams] = useState<Team[]>([])
	const [loading, setLoading] = useState(true)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [newTeamName, setNewTeamName] = useState('')
	const [newTeamDescription, setNewTeamDescription] = useState('')
	const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
	const [selectedTeamForMember, setSelectedTeamForMember] = useState<string | null>(null)
	const [selectedUserId, setSelectedUserId] = useState<string>('')
	const [selectedRole, setSelectedRole] = useState<string>('member')

	useEffect(() => {
		fetchTeams()
	}, [])

	const fetchTeams = async () => {
		try {
			const res = await fetch('/api/operations/teams')
			if (res.ok) {
				const data = await res.json()
				setTeams(data.teams || [])
			}
		} catch (e) {
			console.error('Error fetching teams:', e)
		} finally {
			setLoading(false)
		}
	}

	const createTeam = async () => {
		if (!newTeamName.trim()) return

		try {
			const res = await fetch('/api/operations/teams', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newTeamName,
					description: newTeamDescription || null,
				}),
			})

			if (res.ok) {
				setNewTeamName('')
				setNewTeamDescription('')
				setShowCreateForm(false)
				fetchTeams()
			}
		} catch (e) {
			console.error('Error creating team:', e)
		}
	}

	const fetchAvailableUsers = async () => {
		try {
			const res = await fetch('/api/users')
			if (res.ok) {
				const data = await res.json()
				setAvailableUsers(data.users || [])
			}
		} catch (e) {
			console.error('Error fetching users:', e)
		}
	}

	const handleAddMember = async (teamId: string) => {
		if (!selectedUserId) return

		try {
			const res = await fetch(`/api/operations/teams/${teamId}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedUserId,
					role: selectedRole,
				}),
			})

			if (res.ok) {
				setSelectedTeamForMember(null)
				setSelectedUserId('')
				setSelectedRole('member')
				fetchTeams()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to add member')
			}
		} catch (e) {
			console.error('Error adding member:', e)
			alert('Failed to add member')
		}
	}

	const handleRemoveMember = async (teamId: string, userId: string) => {
		if (!confirm('Are you sure you want to remove this member?')) return

		try {
			const res = await fetch(`/api/operations/teams/${teamId}/members?userId=${userId}`, {
				method: 'DELETE',
			})

			if (res.ok) {
				fetchTeams()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to remove member')
			}
		} catch (e) {
			console.error('Error removing member:', e)
			alert('Failed to remove member')
		}
	}

	if (loading) {
		return <div className="p-6">Loading teams...</div>
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Team Management</h2>
				<Button onClick={() => setShowCreateForm(!showCreateForm)}>
					<Plus className="w-4 h-4 mr-2" />
					Create Team
				</Button>
			</div>

			{showCreateForm && (
				<Card>
					<CardHeader>
						<CardTitle>Create New Team</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Input
							placeholder="Team name"
							value={newTeamName}
							onChange={(e) => setNewTeamName(e.target.value)}
						/>
						<Input
							placeholder="Description (optional)"
							value={newTeamDescription}
							onChange={(e) => setNewTeamDescription(e.target.value)}
						/>
						<div className="flex space-x-2">
							<Button onClick={createTeam}>Create</Button>
							<Button variant="outline" onClick={() => setShowCreateForm(false)}>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{teams.map((team) => (
					<Card key={team.id}>
						<CardHeader>
							<div className="flex justify-between items-start">
								<div>
									<CardTitle className="text-lg">{team.name}</CardTitle>
									{team.description && <p className="text-sm text-gray-600 mt-1">{team.description}</p>}
								</div>
								<Badge>{team.members?.length || 0} members</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{team.members && team.members.length > 0 ? (
									team.members.map((member) => (
										<div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
											<div className="flex-1">
												<p className="font-medium text-sm">{member.user.full_name}</p>
												<p className="text-xs text-gray-600">{member.user.email}</p>
											</div>
											<div className="flex items-center space-x-2">
												<Badge variant="outline">{member.role}</Badge>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => handleRemoveMember(team.id, member.user_id)}
													title="Remove member"
												>
													<X className="w-3 h-3" />
												</Button>
											</div>
										</div>
									))
								) : (
									<p className="text-sm text-gray-500">No members yet</p>
								)}
							</div>
							<Dialog open={selectedTeamForMember === team.id} onOpenChange={(open) => {
								if (!open) {
									setSelectedTeamForMember(null)
									setSelectedUserId('')
									setSelectedRole('member')
								} else {
									setSelectedTeamForMember(team.id)
									fetchAvailableUsers()
								}
							}}>
								<DialogTrigger asChild>
									<Button variant="outline" className="w-full mt-4" size="sm" onClick={() => {
										setSelectedTeamForMember(team.id)
										fetchAvailableUsers()
									}}>
										<UserPlus className="w-4 h-4 mr-2" />
										Add Member
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add Member to {team.name}</DialogTitle>
									</DialogHeader>
									<div className="space-y-4">
										<div>
											<label className="text-sm font-medium mb-1 block">User</label>
											<Select value={selectedUserId} onValueChange={setSelectedUserId}>
												<SelectTrigger>
													<SelectValue placeholder="Select a user" />
												</SelectTrigger>
												<SelectContent>
													{availableUsers
														.filter((user) => !team.members?.some((m) => m.user_id === user.id))
														.map((user) => (
															<SelectItem key={user.id} value={user.id}>
																{user.full_name} ({user.email}) - {user.role}
															</SelectItem>
														))}
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="text-sm font-medium mb-1 block">Role</label>
											<Select value={selectedRole} onValueChange={setSelectedRole}>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="member">Member</SelectItem>
													<SelectItem value="leader">Leader</SelectItem>
													<SelectItem value="supervisor">Supervisor</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="flex space-x-2">
											<Button onClick={() => handleAddMember(team.id)} disabled={!selectedUserId}>
												Add Member
											</Button>
											<Button variant="outline" onClick={() => {
												setSelectedTeamForMember(null)
												setSelectedUserId('')
												setSelectedRole('member')
											}}>
												Cancel
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</CardContent>
					</Card>
				))}
			</div>

			{teams.length === 0 && (
				<Card>
					<CardContent className="py-12 text-center">
						<Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-600">No teams yet. Create your first team to get started.</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}

