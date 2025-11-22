'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Search, User, Clock } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

type Message = {
	id: string
	senderId: string
	senderName: string
	recipientId: string
	recipientName: string
	subject: string
	content: string
	createdAt: string
	read: boolean
}

export default function AmbassadorMessagesPage() {
	const { user } = useAuth()
	const [messages, setMessages] = useState<Message[]>([])
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [newMessage, setNewMessage] = useState({ recipientId: '', subject: '', content: '' })

	useEffect(() => {
		if (user?.id) {
			fetchMessages()
		}
	}, [user?.id])

	const fetchMessages = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const response = await fetch(`/api/messages?userId=${user.id}`)
			const data = await response.json()
			if (data.messages) {
				setMessages(data.messages.map((m: any) => ({
					id: m.id,
					senderId: m.sender_id || m.senderId,
					senderName: m.sender_name || m.sender?.full_name || 'Unknown',
					recipientId: m.recipient_id || m.recipientId,
					recipientName: m.recipient_name || m.recipient?.full_name || 'Unknown',
					subject: m.subject || 'No subject',
					content: m.content || m.message || '',
					createdAt: m.created_at || m.createdAt,
					read: m.read || false,
				})))
			}
		} catch (error) {
			console.error('Error fetching messages:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSendMessage = async () => {
		if (!user?.id || !newMessage.recipientId || !newMessage.content) return
		
		try {
			const response = await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					senderId: user.id,
					recipientId: newMessage.recipientId,
					subject: newMessage.subject,
					content: newMessage.content,
				}),
			})
			
			if (response.ok) {
				setNewMessage({ recipientId: '', subject: '', content: '' })
				fetchMessages()
			}
		} catch (error) {
			console.error('Error sending message:', error)
		}
	}

	const filteredMessages = messages.filter(msg =>
		msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
		msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		msg.content.toLowerCase().includes(searchQuery.toLowerCase())
	)

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Messages"
				description="Communicate with your team and management"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-1">
					<CardHeader>
						<div className="relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search messages..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
					</CardHeader>
					<CardContent className="space-y-2">
						{filteredMessages.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No messages found
							</p>
						) : (
							filteredMessages.map((message) => (
								<div
									key={message.id}
									className={`p-3 rounded-md cursor-pointer transition-colors ${
										selectedMessage?.id === message.id
											? 'bg-primary text-primary-foreground'
											: message.read
											? 'bg-muted hover:bg-muted/80'
											: 'bg-primary/10 hover:bg-primary/20'
									}`}
									onClick={() => setSelectedMessage(message)}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<p className={`font-medium truncate ${!message.read ? 'font-bold' : ''}`}>
												{message.senderName}
											</p>
											<p className={`text-sm truncate ${selectedMessage?.id === message.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
												{message.subject}
											</p>
										</div>
										{!message.read && (
											<Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
										)}
									</div>
									<p className={`text-xs mt-1 ${selectedMessage?.id === message.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
										{new Date(message.createdAt).toLocaleDateString()}
									</p>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					{selectedMessage ? (
						<>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle>{selectedMessage.subject}</CardTitle>
										<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
											<User className="h-4 w-4" />
											<span>From: {selectedMessage.senderName}</span>
											<Clock className="h-4 w-4 ml-4" />
											<span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="prose max-w-none">
									<p className="whitespace-pre-wrap">{selectedMessage.content}</p>
								</div>
							</CardContent>
						</>
					) : (
						<div className="flex items-center justify-center h-full min-h-[400px]">
							<div className="text-center">
								<MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">Select a message to view</p>
							</div>
						</div>
					)}
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Send New Message</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Input
							placeholder="Recipient ID or email"
							value={newMessage.recipientId}
							onChange={(e) => setNewMessage({ ...newMessage, recipientId: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Input
							placeholder="Subject"
							value={newMessage.subject}
							onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Textarea
							placeholder="Message content..."
							value={newMessage.content}
							onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
							rows={6}
						/>
					</div>
					<Button onClick={handleSendMessage} className="w-full">
						<Send className="h-4 w-4 mr-2" />
						Send Message
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
