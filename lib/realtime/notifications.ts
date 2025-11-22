'use client'

import { getRealtimeClient } from './client'

export interface PushNotification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  timestamp: string
  actionUrl?: string
  actionLabel?: string
  icon?: string
  persistent?: boolean
  sound?: boolean
}

export interface NotificationPermissionState {
  permission: NotificationPermission
  supported: boolean
}

class NotificationManager {
  private client = getRealtimeClient()
  private subscriptions: (() => void)[] = []
  private notificationHandlers: ((notification: PushNotification) => void)[] = []

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) {
      return { permission: 'denied', supported: false }
    }

    let permission = Notification.permission
    
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return { permission, supported: true }
  }

  async initialize() {
    const { permission, supported } = await this.requestPermission()
    
    if (!supported) {
      console.warn('Push notifications not supported in this browser')
      return false
    }

    if (permission !== 'granted') {
      console.warn('Push notifications permission not granted')
      return false
    }

    // Subscribe to notification channel
    const unsubscribe = this.client.subscribeToChannel('admin-notifications', {
      'notification': (payload: any) => {
        this.handleNotification(payload)
      },
      'alert': (payload: any) => {
        this.handleAlert(payload)
      },
      'broadcast': (payload: any) => {
        this.handleBroadcast(payload)
      }
    })

    this.subscriptions.push(unsubscribe)
    return true
  }

  private handleNotification(payload: PushNotification) {
    // Show browser notification
    this.showBrowserNotification(payload)
    
    // Notify all handlers
    this.notificationHandlers.forEach(handler => handler(payload))
  }

  private handleAlert(payload: any) {
    const notification: PushNotification = {
      id: payload.id || `alert_${Date.now()}`,
      title: payload.title || 'System Alert',
      message: payload.message,
      type: payload.type || 'info',
      timestamp: payload.timestamp || new Date().toISOString(),
      persistent: true,
      sound: payload.type === 'error' || payload.type === 'warning'
    }

    this.handleNotification(notification)
  }

  private handleBroadcast(payload: any) {
    const notification: PushNotification = {
      id: payload.id || `broadcast_${Date.now()}`,
      title: payload.title || 'System Update',
      message: payload.message,
      type: payload.type || 'info',
      timestamp: payload.timestamp || new Date().toISOString(),
      persistent: false
    }

    this.handleNotification(notification)
  }

  private showBrowserNotification(notification: PushNotification) {
    if (Notification.permission !== 'granted') return

    const options: NotificationOptions = {
      body: notification.message,
      icon: notification.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      timestamp: new Date(notification.timestamp).getTime(),
      requireInteraction: notification.persistent,
      silent: !notification.sound
    }

    // Add action buttons if actionUrl is provided
    if (notification.actionUrl && 'actions' in Notification.prototype) {
      options.actions = [
        {
          action: 'view',
          title: notification.actionLabel || 'View',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/favicon.ico'
        }
      ]
    }

    const browserNotification = new Notification(notification.title, options)

    // Handle notification clicks
    browserNotification.onclick = () => {
      window.focus()
      if (notification.actionUrl) {
        window.open(notification.actionUrl, '_blank')
      }
      browserNotification.close()
    }

    // Auto-close non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }

  sendNotification(notification: Omit<PushNotification, 'id' | 'timestamp'>) {
    const fullNotification: PushNotification = {
      ...notification,
      id: `notification_${Date.now()}`,
      timestamp: new Date().toISOString()
    }

    this.client.broadcast('admin-notifications', 'notification', fullNotification)
  }

  sendAlert(alert: {
    title: string
    message: string
    type: 'success' | 'warning' | 'error' | 'info'
    actionUrl?: string
    actionLabel?: string
  }) {
    this.client.broadcast('admin-notifications', 'alert', {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  }

  sendBroadcast(message: {
    title: string
    message: string
    type?: 'success' | 'warning' | 'error' | 'info'
  }) {
    this.client.broadcast('admin-notifications', 'broadcast', {
      ...message,
      type: message.type || 'info',
      id: `broadcast_${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  }

  onNotification(handler: (notification: PushNotification) => void) {
    this.notificationHandlers.push(handler)
    
    return () => {
      const index = this.notificationHandlers.indexOf(handler)
      if (index > -1) {
        this.notificationHandlers.splice(index, 1)
      }
    }
  }

  disconnect() {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []
    this.notificationHandlers = []
  }

  // Predefined notification types
  notifyKPITargetReached(metric: string, value: number, target: number) {
    this.sendAlert({
      title: '🎉 KPI Target Reached!',
      message: `${metric.charAt(0).toUpperCase() + metric.slice(1)} target reached: ${value}/${target}`,
      type: 'success',
      actionUrl: '/root-admin/progress/kpi',
      actionLabel: 'View KPIs'
    })
  }

  notifyKPIBehindSchedule(metric: string, percentage: number) {
    this.sendAlert({
      title: '⚠️ KPI Behind Schedule',
      message: `${metric.charAt(0).toUpperCase() + metric.slice(1)} is ${percentage}% behind target`,
      type: 'warning',
      actionUrl: '/root-admin/progress/kpi',
      actionLabel: 'View KPIs'
    })
  }

  notifySystemError(error: string) {
    this.sendAlert({
      title: '🚨 System Error',
      message: error,
      type: 'error',
      actionUrl: '/root-admin/logs',
      actionLabel: 'View Logs'
    })
  }

  notifyNewBooking(bookingId: string, amount: number) {
    this.sendNotification({
      title: '📋 New Booking',
      message: `New booking #${bookingId} received (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)})`,
      type: 'info',
      actionUrl: `/root-admin/booking-requests`,
      actionLabel: 'View Booking'
    })
  }

  notifyNewCleaner(cleanerName: string) {
    this.sendNotification({
      title: '👥 New Cleaner',
      message: `${cleanerName} joined the platform`,
      type: 'success',
      actionUrl: '/root-admin/users',
      actionLabel: 'View Profile'
    })
  }

  notifyCompanyVerified(companyName: string) {
    this.sendNotification({
      title: '✅ Company Verified',
      message: `${companyName} has been verified`,
      type: 'success',
      actionUrl: '/root-admin/companies',
      actionLabel: 'View Companies'
    })
  }
}

// Global instance
let notificationManager: NotificationManager | null = null

export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager()
  }
  return notificationManager
}

export function disconnectNotifications() {
  if (notificationManager) {
    notificationManager.disconnect()
    notificationManager = null
  }
}