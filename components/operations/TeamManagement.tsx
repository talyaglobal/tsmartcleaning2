'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, Plus, UserPlus, Trash2 } from 'lucide-react'

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

export function TeamManagement() {
	const [teams, setTeams] = useState<Team[]>([])
	const [loading, setLoading] = useState(true)
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [newTeamName, setNewTeamName] = useState('')
	const [newTeamDescription, setNewTeamDescription] = useState('')

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
											<div>
												<p className="font-medium text-sm">{member.user.full_name}</p>
												<p className="text-xs text-gray-600">{member.user.email}</p>
											</div>
											<Badge variant="outline">{member.role}</Badge>
										</div>
									))
								) : (
									<p className="text-sm text-gray-500">No members yet</p>
								)}
							</div>
							<Button variant="outline" className="w-full mt-4" size="sm">
								<UserPlus className="w-4 h-4 mr-2" />
								Add Member
							</Button>
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

