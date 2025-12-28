'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Phone, MapPin, Save, Camera } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

type Profile = {
	id: string
	name: string
	email: string
	phone?: string
	address?: string
	bio?: string
	avatar?: string
}

export default function AmbassadorProfilePage() {
	const { user } = useAuth()
	const [profile, setProfile] = useState<Profile | null>(null)
	const [loading, setLoading] = useState(true)
	const [editing, setEditing] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
		bio: '',
	})

	useEffect(() => {
		if (user?.id) {
			fetchProfile()
		}
	}, [user?.id])

	const fetchProfile = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const response = await fetch(`/api/users/${user.id}`)
			const data = await response.json()
			if (data.user) {
				const profileData = {
					id: data.user.id,
					name: data.user.full_name || data.user.name || '',
					email: data.user.email || '',
					phone: data.user.phone || '',
					address: data.user.address || '',
					bio: data.user.bio || '',
					avatar: data.user.avatar_url || data.user.profile_image || '',
				}
				setProfile(profileData)
				setFormData({
					name: profileData.name,
					email: profileData.email,
					phone: profileData.phone || '',
					address: profileData.address || '',
					bio: profileData.bio || '',
				})
			}
		} catch (error) {
			console.error('Error fetching profile:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		if (!user?.id) return
		
		try {
			const response = await fetch(`/api/users/${user.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			})
			
			if (response.ok) {
				setEditing(false)
				fetchProfile()
			}
		} catch (error) {
			console.error('Error updating profile:', error)
		}
	}

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	if (!profile) {
		return <div className="p-6">Profile not found</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Profile"
				subtitle="Manage your profile information"
				actions={
					editing ? (
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => { setEditing(false); fetchProfile(); }}>
								Cancel
							</Button>
							<Button onClick={handleSave}>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</Button>
						</div>
					) : (
						<Button onClick={() => setEditing(true)}>
							Edit Profile
						</Button>
					)
				}
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="text-center">
						<div className="flex justify-center mb-4">
							<div className="relative">
								<Avatar className="h-24 w-24">
									<AvatarImage src={profile.avatar} />
									<AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
								{editing && (
									<Button
										size="sm"
										variant="secondary"
										className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
									>
										<Camera className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
						<CardTitle>{profile.name}</CardTitle>
						<p className="text-sm text-muted-foreground">{profile.email}</p>
					</CardHeader>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Profile Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							{editing ? (
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								/>
							) : (
								<div className="flex items-center gap-2 text-sm">
									<User className="h-4 w-4 text-muted-foreground" />
									<span>{profile.name}</span>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							{editing ? (
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								/>
							) : (
								<div className="flex items-center gap-2 text-sm">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span>{profile.email}</span>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							{editing ? (
								<Input
									id="phone"
									value={formData.phone}
									onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
									placeholder="+1 (555) 000-0000"
								/>
							) : (
								<div className="flex items-center gap-2 text-sm">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<span>{profile.phone || 'Not provided'}</span>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							{editing ? (
								<Textarea
									id="address"
									value={formData.address}
									onChange={(e) => setFormData({ ...formData, address: e.target.value })}
									rows={3}
								/>
							) : (
								<div className="flex items-start gap-2 text-sm">
									<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
									<span>{profile.address || 'Not provided'}</span>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="bio">Bio</Label>
							{editing ? (
								<Textarea
									id="bio"
									value={formData.bio}
									onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
									rows={4}
									placeholder="Tell us about yourself..."
								/>
							) : (
								<p className="text-sm text-muted-foreground">
									{profile.bio || 'No bio provided'}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
