'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Mail, MessageSquare, Phone, Users, Send, Clock } from 'lucide-react'

interface CampaignProgress {
	sent: number
	delivered: number
	failed: number
	total: number
	status: 'preparing' | 'sending' | 'completed' | 'failed'
}

export function CampaignLauncher() {
	const [selectedChannel, setSelectedChannel] = useState<'email' | 'whatsapp' | 'sms'>('email')
	const [audienceSize, setAudienceSize] = useState(0)
	const [campaign, setCampaign] = useState({
		name: '',
		subject: '',
		content: '',
		audienceFilter: {} as any,
		scheduledAt: null as null | string,
	})
	const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
	const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null)

	const channels = [
		{ id: 'email', name: 'Email', icon: Mail, limit: 10000 },
		{ id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, limit: 1000 },
		{ id: 'sms', name: 'SMS', icon: Phone, limit: 500 },
	] as const

	const templates: Record<string, Array<{ name: string; subject?: string; content: string }>> = {
		email: [
			{ name: 'Welcome Series', subject: 'Welcome to TSmartCleaning!', content: 'Hi {{name}}, welcome to our cleaning service...' },
			{ name: 'Win-back Campaign', subject: 'We miss you! Special offer inside', content: "Hi {{name}}, it's been a while since your last cleaning..." },
		],
		whatsapp: [
			{ name: 'Booking Reminder', content: 'Hi {{name}}! Your cleaning is scheduled for {{date}} at {{time}}.' },
			{ name: 'Payment Due', content: 'Hi {{name}}, your payment of ${{amount}} is due. Pay now: {{payment_link}}' },
		],
		sms: [{ name: 'Appointment Reminder', content: 'Reminder: Cleaning tomorrow at {{time}}. Provider: {{provider}}.' }],
	}

	useEffect(() => {
		fetchActiveCampaigns()
		// Fetch audience count for initial estimate
		previewAudience({})
	}, [])

	const fetchActiveCampaigns = async () => {
		try {
			const response = await fetch('/api/campaigns/active')
			if (response.ok) {
				const data = await response.json()
				setActiveCampaigns(data)
			}
		} catch (error) {
			console.error('Error fetching campaigns:', error)
		}
	}

	const previewAudience = async (filters: any) => {
		try {
			const response = await fetch('/api/campaigns/audience-preview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(filters),
			})
			const { count } = await response.json()
			setAudienceSize(count)
		} catch (error) {
			console.error('Error previewing audience:', error)
		}
	}

	const launchCampaign = async () => {
		try {
			const response = await fetch('/api/campaigns/launch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...campaign,
					channel: selectedChannel,
				}),
			})

			if (response.ok) {
				const { campaignId } = await response.json()
				monitorCampaignProgress(campaignId)
				alert('Campaign launched successfully!')
			}
		} catch (error) {
			console.error('Error launching campaign:', error)
			alert('Failed to launch campaign. Please try again.')
		}
	}

	const monitorCampaignProgress = async (campaignId: string) => {
		const pollProgress = async () => {
			try {
				const response = await fetch(`/api/campaigns/${campaignId}/progress`)
				if (response.ok) {
					const progress = (await response.json()) as CampaignProgress
					setCampaignProgress(progress)
					if (progress.status === 'sending' && progress.sent < progress.total) {
						setTimeout(pollProgress, 2000)
					}
				}
			} catch (error) {
				console.error('Error monitoring progress:', error)
			}
		}
		pollProgress()
	}

	const ChannelIcon = channels.find((c) => c.id === selectedChannel)?.icon || Mail

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">Campaign Manager</h1>
				<p className="text-gray-600">Create and manage bulk messaging campaigns</p>
			</div>

			<Tabs defaultValue="create" className="space-y-6">
				<TabsList>
					<TabsTrigger value="create">Create Campaign</TabsTrigger>
					<TabsTrigger value="active">Active Campaigns</TabsTrigger>
					<TabsTrigger value="templates">Templates</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="create" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Campaign Setup</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<label className="block text-sm font-medium mb-3">Select Channel</label>
								<div className="grid grid-cols-3 gap-4">
									{channels.map((channel) => {
										const Icon = channel.icon
										return (
											<div
												key={channel.id}
												className={`p-4 border rounded-lg cursor-pointer transition-all ${
													selectedChannel === channel.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
												}`}
												onClick={() => setSelectedChannel(channel.id)}
											>
												<div className="flex flex-col items-center space-y-2">
													<Icon className="w-8 h-8" />
													<span className="font-medium">{channel.name}</span>
													<span className="text-xs text-gray-500">Up to {channel.limit.toLocaleString()} recipients</span>
												</div>
											</div>
										)
									})}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium mb-2">Campaign Name</label>
									<Input placeholder="Holiday Special Campaign" value={campaign.name} onChange={(e) => setCampaign((prev) => ({ ...prev, name: e.target.value }))} />
								</div>
								<div>
									<label className="block text-sm font-medium mb-2">Template</label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Choose a template" />
										</SelectTrigger>
										<SelectContent>
											{templates[selectedChannel]?.map((template) => (
												<SelectItem key={template.name} value={template.name}>{template.name}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{selectedChannel === 'email' && (
								<div>
									<label className="block text-sm font-medium mb-2">Subject Line</label>
									<Input
										placeholder="🏠 Special Cleaning Offer Just for You!"
										value={campaign.subject}
										onChange={(e) => setCampaign((prev) => ({ ...prev, subject: e.target.value }))}
									/>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium mb-2">Message Content</label>
								<Textarea
									rows={8}
									placeholder={
										selectedChannel === 'whatsapp'
											? 'Hi {{name}}! We have a special offer for you...'
											: selectedChannel === 'sms'
											? 'Hi {{name}}! Get 20% off your next cleaning. Book now: {{link}}'
											: "Hi {{name}}, We hope you're doing well..."
									}
									value={campaign.content}
									onChange={(e) => setCampaign((prev) => ({ ...prev, content: e.target.value }))}
								/>
								<p className="text-sm text-gray-500 mt-2">
									Available variables: {'{{name}}'}, {'{{email}}'}, {'{{loyalty_tier}}'}, {'{{last_booking_date}}'}
									{selectedChannel !== 'email' && ` (${campaign.content.length}/160 characters)`}
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium mb-3">Target Audience</label>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="User Type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Users</SelectItem>
											<SelectItem value="customers">Customers Only</SelectItem>
											<SelectItem value="providers">Providers Only</SelectItem>
										</SelectContent>
									</Select>

									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Loyalty Tier" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Tiers</SelectItem>
											<SelectItem value="basic">Basic</SelectItem>
											<SelectItem value="silver">Silver</SelectItem>
											<SelectItem value="gold">Gold</SelectItem>
											<SelectItem value="platinum">Platinum</SelectItem>
										</SelectContent>
									</Select>

									<Input placeholder="ZIP Codes (comma separated)" />
									<Input placeholder="Last booking (days ago)" type="number" />
								</div>

								<div className="mt-4 p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">Estimated audience size:</span>
										<Badge variant="outline" className="text-lg px-3 py-1">
											<Users className="w-4 h-4 mr-1" />
											{audienceSize.toLocaleString()} recipients
										</Badge>
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-3">Schedule</label>
								<div className="flex space-x-4">
                                    <Button variant="outline" onClick={launchCampaign}>
										<Send className="w-4 h-4 mr-2" />
										Send Now
									</Button>
									<Button variant="outline">
										<Clock className="w-4 h-4 mr-2" />
										Schedule for Later
									</Button>
								</div>
							</div>

							<div className="pt-6 border-t">
								<div className="flex justify-between items-center">
									<div>
										<p className="text-sm text-gray-600">
											Ready to send to {audienceSize.toLocaleString()} recipients via {selectedChannel}
										</p>
									</div>
									<Button onClick={launchCampaign}>
										<ChannelIcon className="w-4 h-4 mr-2" />
										Launch Campaign
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{campaignProgress && (
						<Card>
							<CardHeader>
								<CardTitle>Sending Progress</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Progress value={(campaignProgress.sent / Math.max(1, campaignProgress.total)) * 100} />
								<div className="text-sm text-gray-600">
									Sent {campaignProgress.sent}/{campaignProgress.total} • Delivered {campaignProgress.delivered} • Failed {campaignProgress.failed}
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="active">
					<Card>
						<CardHeader>
							<CardTitle>Active Campaigns</CardTitle>
						</CardHeader>
						<CardContent>
							{activeCampaigns.length === 0 ? (
								<p className="text-sm text-gray-600">No active campaigns</p>
							) : (
								<ul className="space-y-2">
									{activeCampaigns.map((c) => (
										<li key={c.id} className="flex items-center justify-between">
											<span className="font-medium">{c.name}</span>
											<Badge variant="outline">{c.status}</Badge>
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="templates">
					<Card>
						<CardHeader>
							<CardTitle>Templates</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">Predefined templates will appear here.</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics">
					<Card>
						<CardHeader>
							<CardTitle>Analytics</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">Campaign analytics coming soon.</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}


