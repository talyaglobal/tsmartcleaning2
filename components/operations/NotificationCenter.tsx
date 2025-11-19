'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'

interface Notification {
	id: string
	title: string
	message: string
	type: 'booking' | 'payment' | 'review' | 'system'
	is_read: boolean
	related_booking_id?: string
	created_at: string
}

interface NotificationCenterProps {
	userId?: string
	maxHeight?: string
	showMarkAllRead?: boolean
}

export function NotificationCenter({ userId, maxHeight = '400px', showMarkAllRead = true }: NotificationCenterProps) {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [loading, setLoading] = useState(true)
	const [unreadCount, setUnreadCount] = useState(0)
	const supabase = createAnonSupabase()

	useEffect(() => {
		if (!userId) return

		fetchNotifications()

		// Subscribe to real-time notification changes
		const channel = supabase
			.channel('notifications-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${userId}`,
				},
				() => {
					fetchNotifications()
				}
			)
			.subscribe()

		return () => {
			channel.unsubscribe()
		}
	}, [userId])

	const fetchNotifications = async () => {
		if (!userId) return

		try {
			const res = await fetch(`/api/notifications?userId=${userId}`)
			if (res.ok) {
				const data = await res.json()
				const notifs = data.notifications || []
				setNotifications(notifs)
				setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length)
			}
		} catch (e) {
			console.error('Error fetching notifications:', e)
		} finally {
			setLoading(false)
		}
	}

	const markAsRead = async (notificationId: string) => {
		try {
			const res = await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notificationId }),
			})

			if (res.ok) {
				setNotifications((prev) =>
					prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
				)
				setUnreadCount((prev) => Math.max(0, prev - 1))
			}
		} catch (e) {
			console.error('Error marking notification as read:', e)
		}
	}

	const markAllAsRead = async () => {
		try {
			const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
			await Promise.all(unreadIds.map((id) => markAsRead(id)))
		} catch (e) {
			console.error('Error marking all as read:', e)
		}
	}

	const getNotificationIcon = (type: Notification['type']) => {
		switch (type) {
			case 'booking':
				return <CheckCircle className="w-4 h-4 text-blue-500" />
			case 'payment':
				return <AlertCircle className="w-4 h-4 text-green-500" />
			case 'review':
				return <Info className="w-4 h-4 text-yellow-500" />
			case 'system':
				return <AlertTriangle className="w-4 h-4 text-orange-500" />
			default:
				return <Bell className="w-4 h-4 text-gray-500" />
		}
	}

	const getNotificationColor = (type: Notification['type']) => {
		switch (type) {
			case 'booking':
				return 'bg-blue-50 border-blue-200'
			case 'payment':
				return 'bg-green-50 border-green-200'
			case 'review':
				return 'bg-yellow-50 border-yellow-200'
			case 'system':
				return 'bg-orange-50 border-orange-200'
			default:
				return 'bg-gray-50 border-gray-200'
		}
	}

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-gray-500">Loading notifications...</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center space-x-2">
						<Bell className="w-5 h-5" />
						<span>Notifications</span>
						{unreadCount > 0 && (
							<Badge variant="destructive" className="ml-2">
								{unreadCount}
							</Badge>
						)}
					</CardTitle>
					{showMarkAllRead && unreadCount > 0 && (
						<Button variant="ghost" size="sm" onClick={markAllAsRead}>
							Mark all read
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
					{notifications.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
							<p>No notifications</p>
						</div>
					) : (
						notifications.map((notification) => (
							<div
								key={notification.id}
								className={`p-3 rounded-lg border transition-colors ${
									notification.is_read
										? 'bg-white border-gray-200'
										: `${getNotificationColor(notification.type)} font-medium`
								}`}
							>
								<div className="flex items-start space-x-3">
									<div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<p className={`text-sm ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
													{notification.title}
												</p>
												<p className={`text-xs mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
													{notification.message}
												</p>
												<p className="text-xs text-gray-400 mt-1">
													{new Date(notification.created_at).toLocaleString()}
												</p>
											</div>
											{!notification.is_read && (
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => markAsRead(notification.id)}
													title="Mark as read"
												>
													<X className="w-3 h-3" />
												</Button>
											)}
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	)
}

