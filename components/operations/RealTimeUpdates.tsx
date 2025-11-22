'use client'

import { useEffect, useRef, useState } from 'react'
import { createAnonSupabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
	Bell, 
	CheckCircle, 
	AlertTriangle, 
	Info, 
	Users, 
	Truck,
	Clock,
	DollarSign,
	X
} from 'lucide-react'

interface RealtimeNotification {
	id: string
	type: 'job_assigned' | 'job_completed' | 'job_cancelled' | 'provider_arrived' | 'payment_received' | 'system_alert'
	title: string
	message: string
	timestamp: string
	metadata?: {
		jobId?: string
		providerId?: string
		customerId?: string
		amount?: number
		severity?: 'low' | 'medium' | 'high'
	}
}

interface RealTimeUpdatesProps {
	onJobUpdate?: (jobId: string, updates: any) => void
	onProviderUpdate?: (providerId: string, updates: any) => void
	onStatsUpdate?: (stats: any) => void
	showToasts?: boolean
}

export function RealTimeUpdates({
	onJobUpdate,
	onProviderUpdate,
	onStatsUpdate,
	showToasts = true,
}: RealTimeUpdatesProps) {
	const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
	const [isConnected, setIsConnected] = useState(false)
	const supabase = useRef(createAnonSupabase())
	const channelRef = useRef<any>(null)

	useEffect(() => {
		const setupRealtimeSubscriptions = () => {
			// Subscribe to bookings changes
			const bookingsChannel = supabase.current
				.channel('realtime-bookings')
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'bookings',
					},
					(payload) => {
						handleBookingChange(payload)
					}
				)
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'provider_profiles',
					},
					(payload) => {
						handleProviderChange(payload)
					}
				)
				.on(
					'postgres_changes',
					{
						event: 'INSERT',
						schema: 'public',
						table: 'notifications',
					},
					(payload) => {
						handleNotificationInsert(payload)
					}
				)
				.subscribe((status: string) => {
					if (status === 'SUBSCRIBED') {
						setIsConnected(true)
						if (showToasts) {
							toast.success('Real-time updates connected', {
								description: 'You will receive live updates for jobs and providers',
								duration: 3000,
							})
						}
					} else if (status === 'CHANNEL_ERROR') {
						setIsConnected(false)
						if (showToasts) {
							toast.error('Connection error', {
								description: 'Real-time updates may be delayed',
							})
						}
					}
				})

			channelRef.current = bookingsChannel
		}

		setupRealtimeSubscriptions()

		// Cleanup on unmount
		return () => {
			if (channelRef.current) {
				channelRef.current.unsubscribe()
			}
		}
	}, [onJobUpdate, onProviderUpdate, onStatsUpdate, showToasts])

	const handleBookingChange = (payload: any) => {
		const { eventType, new: newRecord, old: oldRecord } = payload

		let notification: RealtimeNotification | null = null

		switch (eventType) {
			case 'INSERT':
				notification = {
					id: `booking-${newRecord.id}-${Date.now()}`,
					type: 'job_assigned',
					title: 'New Booking Created',
					message: `New booking #${newRecord.id.slice(0, 8)} has been created`,
					timestamp: new Date().toISOString(),
					metadata: {
						jobId: newRecord.id,
						customerId: newRecord.customer_id,
					},
				}
				break

			case 'UPDATE':
				if (oldRecord.status !== newRecord.status) {
					const statusMessages: Record<string, { type: RealtimeNotification['type']; title: string; message: string }> = {
						'confirmed': {
							type: 'job_assigned',
							title: 'Job Assigned',
							message: `Job #${newRecord.id.slice(0, 8)} has been assigned to a provider`,
						},
						'in-progress': {
							type: 'provider_arrived',
							title: 'Service Started',
							message: `Service has started for job #${newRecord.id.slice(0, 8)}`,
						},
						'completed': {
							type: 'job_completed',
							title: 'Job Completed',
							message: `Job #${newRecord.id.slice(0, 8)} has been completed successfully`,
						},
						'cancelled': {
							type: 'job_cancelled',
							title: 'Job Cancelled',
							message: `Job #${newRecord.id.slice(0, 8)} has been cancelled`,
						},
					}

					const statusInfo = statusMessages[newRecord.status]
					if (statusInfo) {
						notification = {
							id: `booking-status-${newRecord.id}-${Date.now()}`,
							...statusInfo,
							timestamp: new Date().toISOString(),
							metadata: {
								jobId: newRecord.id,
								providerId: newRecord.provider_id,
								customerId: newRecord.customer_id,
							},
						}
					}
				}
				break
		}

		if (notification) {
			setNotifications(prev => [notification!, ...prev.slice(0, 49)]) // Keep last 50
			
			if (showToasts) {
				showNotificationToast(notification)
			}
		}

		// Call update callback
		if (onJobUpdate && (eventType === 'UPDATE' || eventType === 'INSERT')) {
			onJobUpdate(newRecord.id, newRecord)
		}

		// Trigger stats refresh
		if (onStatsUpdate) {
			setTimeout(() => {
				// Debounce stats updates
				fetchAndUpdateStats()
			}, 1000)
		}
	}

	const handleProviderChange = (payload: any) => {
		const { eventType, new: newRecord, old: oldRecord } = payload

		if (eventType === 'UPDATE' && oldRecord.availability_status !== newRecord.availability_status) {
			const notification: RealtimeNotification = {
				id: `provider-${newRecord.id}-${Date.now()}`,
				type: 'system_alert',
				title: 'Provider Status Changed',
				message: `Provider ${newRecord.business_name} is now ${newRecord.availability_status}`,
				timestamp: new Date().toISOString(),
				metadata: {
					providerId: newRecord.id,
					severity: 'low',
				},
			}

			setNotifications(prev => [notification, ...prev.slice(0, 49)])
		}

		// Call update callback
		if (onProviderUpdate) {
			onProviderUpdate(newRecord.id, newRecord)
		}
	}

	const handleNotificationInsert = (payload: any) => {
		const { new: newNotification } = payload

		if (newNotification.type === 'system') {
			const notification: RealtimeNotification = {
				id: `notification-${newNotification.id}`,
				type: 'system_alert',
				title: newNotification.title,
				message: newNotification.message,
				timestamp: newNotification.created_at,
				metadata: {
					severity: 'medium',
				},
			}

			setNotifications(prev => [notification, ...prev.slice(0, 49)])
			
			if (showToasts) {
				showNotificationToast(notification)
			}
		}
	}

	const fetchAndUpdateStats = async () => {
		try {
			const response = await fetch('/api/operations/stats')
			if (response.ok) {
				const stats = await response.json()
				onStatsUpdate?.(stats)
			}
		} catch (error) {
			console.error('Error fetching updated stats:', error)
		}
	}

	const showNotificationToast = (notification: RealtimeNotification) => {
		const icon = getNotificationIcon(notification.type)
		
		switch (notification.type) {
			case 'job_completed':
				toast.success(notification.title, {
					description: notification.message,
					icon,
					duration: 5000,
				})
				break
			case 'job_cancelled':
				toast.warning(notification.title, {
					description: notification.message,
					icon,
					duration: 5000,
				})
				break
			case 'payment_received':
				toast.success(notification.title, {
					description: notification.message,
					icon,
					duration: 4000,
				})
				break
			case 'system_alert':
				const severity = notification.metadata?.severity || 'medium'
				if (severity === 'high') {
					toast.error(notification.title, {
						description: notification.message,
						icon,
						duration: 8000,
					})
				} else {
					toast.info(notification.title, {
						description: notification.message,
						icon,
						duration: 4000,
					})
				}
				break
			default:
				toast.info(notification.title, {
					description: notification.message,
					icon,
					duration: 4000,
				})
		}
	}

	const getNotificationIcon = (type: RealtimeNotification['type']) => {
		switch (type) {
			case 'job_completed':
				return <CheckCircle className="w-4 h-4 text-green-500" />
			case 'job_cancelled':
				return <AlertTriangle className="w-4 h-4 text-red-500" />
			case 'job_assigned':
				return <Users className="w-4 h-4 text-blue-500" />
			case 'provider_arrived':
				return <Truck className="w-4 h-4 text-blue-500" />
			case 'payment_received':
				return <DollarSign className="w-4 h-4 text-green-500" />
			case 'system_alert':
				return <Info className="w-4 h-4 text-orange-500" />
			default:
				return <Bell className="w-4 h-4 text-gray-500" />
		}
	}

	const clearNotification = (id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id))
	}

	const clearAllNotifications = () => {
		setNotifications([])
	}

	return (
		<div className="relative">
			{/* Connection Status Indicator */}
			<div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
				<div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
				<span>{isConnected ? 'Live updates active' : 'Connection lost'}</span>
			</div>

			{/* Recent Notifications List */}
			{notifications.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<h4 className="text-sm font-medium">Recent Activity</h4>
						{notifications.length > 3 && (
							<button
								onClick={clearAllNotifications}
								className="text-xs text-gray-500 hover:text-gray-700"
							>
								Clear all
							</button>
						)}
					</div>
					
					<div className="space-y-1 max-h-80 overflow-y-auto">
						{notifications.slice(0, 10).map((notification) => (
							<div
								key={notification.id}
								className="flex items-start space-x-3 p-2 bg-white rounded border text-xs"
							>
								<div className="mt-0.5">
									{getNotificationIcon(notification.type)}
								</div>
								<div className="flex-1">
									<p className="font-medium text-gray-900">{notification.title}</p>
									<p className="text-gray-600">{notification.message}</p>
									<p className="text-gray-400 mt-1">
										{new Date(notification.timestamp).toLocaleTimeString()}
									</p>
								</div>
								<button
									onClick={() => clearNotification(notification.id)}
									className="text-gray-400 hover:text-gray-600"
								>
									<X className="w-3 h-3" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}