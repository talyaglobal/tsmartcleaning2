'use client'

import { getRealtimeClient } from './client'

export interface DashboardMetrics {
  totalBookings: number
  totalRevenue: number
  activeCleaners: number
  completionRate: number
  averageRating: number
  totalCompanies: number
}

export interface ActivityFeedItem {
  id: string
  type: 'booking_created' | 'booking_completed' | 'cleaner_joined' | 'company_verified' | 'payment_received' | 'review_submitted'
  title: string
  description: string
  timestamp: string
  userId?: string
  userName?: string
  amount?: number
  rating?: number
  metadata?: Record<string, any>
}

export interface DashboardAlert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

class DashboardRealtimeManager {
  private client = getRealtimeClient()
  private subscriptions: (() => void)[] = []

  subscribeToMetrics(onUpdate: (metrics: Partial<DashboardMetrics>) => void) {
    const tables = ['bookings', 'profiles', 'companies', 'reviews']
    
    tables.forEach(table => {
      const unsubscribe = this.client.subscribeToTable({
        table,
        onInsert: () => this.fetchAndEmitMetrics(onUpdate),
        onUpdate: () => this.fetchAndEmitMetrics(onUpdate),
        onDelete: () => this.fetchAndEmitMetrics(onUpdate)
      })
      this.subscriptions.push(unsubscribe)
    })

    // Initial fetch
    this.fetchAndEmitMetrics(onUpdate)
  }

  subscribeToActivityFeed(onNewActivity: (activity: ActivityFeedItem) => void) {
    // Subscribe to bookings
    const unsubscribeBookings = this.client.subscribeToTable({
      table: 'bookings',
      onInsert: (payload) => {
        const booking = payload.new
        onNewActivity({
          id: `booking_${booking.id}`,
          type: 'booking_created',
          title: 'New Booking Created',
          description: `Booking #${booking.id} created for ${booking.service_type || 'cleaning service'}`,
          timestamp: booking.created_at,
          userId: booking.user_id,
          amount: booking.total_amount,
          metadata: { bookingId: booking.id }
        })
      },
      onUpdate: (payload) => {
        const booking = payload.new
        const oldBooking = payload.old
        
        if (oldBooking.status !== booking.status && booking.status === 'completed') {
          onNewActivity({
            id: `booking_completed_${booking.id}`,
            type: 'booking_completed',
            title: 'Booking Completed',
            description: `Booking #${booking.id} has been completed`,
            timestamp: new Date().toISOString(),
            userId: booking.cleaner_id,
            amount: booking.total_amount,
            metadata: { bookingId: booking.id }
          })
        }
      }
    })

    // Subscribe to cleaner registrations
    const unsubscribeProfiles = this.client.subscribeToTable({
      table: 'profiles',
      filter: 'role=eq.cleaner',
      onInsert: (payload) => {
        const profile = payload.new
        onNewActivity({
          id: `cleaner_${profile.id}`,
          type: 'cleaner_joined',
          title: 'New Cleaner Joined',
          description: `${profile.first_name} ${profile.last_name} joined as a cleaner`,
          timestamp: profile.created_at,
          userId: profile.id,
          userName: `${profile.first_name} ${profile.last_name}`,
          metadata: { profileId: profile.id }
        })
      }
    })

    // Subscribe to company verifications
    const unsubscribeCompanies = this.client.subscribeToTable({
      table: 'companies',
      onUpdate: (payload) => {
        const company = payload.new
        const oldCompany = payload.old
        
        if (!oldCompany.verified && company.verified) {
          onNewActivity({
            id: `company_verified_${company.id}`,
            type: 'company_verified',
            title: 'Company Verified',
            description: `${company.name} has been verified`,
            timestamp: new Date().toISOString(),
            metadata: { companyId: company.id }
          })
        }
      }
    })

    // Subscribe to reviews
    const unsubscribeReviews = this.client.subscribeToTable({
      table: 'reviews',
      onInsert: (payload) => {
        const review = payload.new
        onNewActivity({
          id: `review_${review.id}`,
          type: 'review_submitted',
          title: 'New Review Submitted',
          description: `${review.rating}-star review for booking #${review.booking_id}`,
          timestamp: review.created_at,
          rating: review.rating,
          metadata: { reviewId: review.id, bookingId: review.booking_id }
        })
      }
    })

    this.subscriptions.push(unsubscribeBookings, unsubscribeProfiles, unsubscribeCompanies, unsubscribeReviews)
  }

  subscribeToAlerts(onNewAlert: (alert: DashboardAlert) => void) {
    // Subscribe to admin notifications table if it exists
    const unsubscribeNotifications = this.client.subscribeToTable({
      table: 'admin_notifications',
      onInsert: (payload) => {
        const notification = payload.new
        onNewAlert({
          id: notification.id,
          type: notification.type || 'info',
          title: notification.title,
          message: notification.message,
          timestamp: notification.created_at,
          read: false,
          actionUrl: notification.action_url,
          actionLabel: notification.action_label
        })
      }
    })

    this.subscriptions.push(unsubscribeNotifications)
  }

  subscribeToKPIUpdates(onKPIUpdate: (kpi: string, value: number) => void) {
    // Subscribe to changes that affect KPIs
    const unsubscribeCompanies = this.client.subscribeToTable({
      table: 'companies',
      filter: 'status=eq.active',
      onInsert: async () => {
        const count = await this.getCompaniesCount()
        onKPIUpdate('companies', count)
      },
      onUpdate: async () => {
        const count = await this.getCompaniesCount()
        onKPIUpdate('companies', count)
      },
      onDelete: async () => {
        const count = await this.getCompaniesCount()
        onKPIUpdate('companies', count)
      }
    })

    const unsubscribeCleaners = this.client.subscribeToTable({
      table: 'profiles',
      filter: 'role=eq.cleaner',
      onInsert: async () => {
        const count = await this.getCleanersCount()
        onKPIUpdate('cleaners', count)
      },
      onUpdate: async () => {
        const count = await this.getCleanersCount()
        onKPIUpdate('cleaners', count)
      },
      onDelete: async () => {
        const count = await this.getCleanersCount()
        onKPIUpdate('cleaners', count)
      }
    })

    const unsubscribeBookings = this.client.subscribeToTable({
      table: 'bookings',
      filter: 'status=eq.completed',
      onInsert: async () => {
        const revenue = await this.getCurrentMonthRevenue()
        onKPIUpdate('revenue', revenue)
      },
      onUpdate: async () => {
        const revenue = await this.getCurrentMonthRevenue()
        onKPIUpdate('revenue', revenue)
      }
    })

    this.subscriptions.push(unsubscribeCompanies, unsubscribeCleaners, unsubscribeBookings)
  }

  private async fetchAndEmitMetrics(onUpdate: (metrics: Partial<DashboardMetrics>) => void) {
    try {
      // In a real implementation, you would fetch from your API
      // For now, we'll emit a partial update to trigger refresh
      onUpdate({})
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    }
  }

  private async getCompaniesCount(): Promise<number> {
    try {
      const response = await fetch('/api/root-admin/companies')
      const data = await response.json()
      return data.companies?.length || 0
    } catch (error) {
      console.error('Error fetching companies count:', error)
      return 0
    }
  }

  private async getCleanersCount(): Promise<number> {
    try {
      const response = await fetch('/api/root-admin/users?role=cleaner')
      const data = await response.json()
      return data.users?.length || 0
    } catch (error) {
      console.error('Error fetching cleaners count:', error)
      return 0
    }
  }

  private async getCurrentMonthRevenue(): Promise<number> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7)
      const response = await fetch(`/api/root-admin/analytics/revenue?month=${currentMonth}`)
      const data = await response.json()
      return data.revenue || 0
    } catch (error) {
      console.error('Error fetching revenue:', error)
      return 0
    }
  }

  broadcastAlert(alert: Omit<DashboardAlert, 'id' | 'timestamp'>) {
    this.client.broadcast('admin-alerts', 'new-alert', {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  }

  broadcastMetricUpdate(metric: string, value: number, change: number) {
    this.client.broadcast('dashboard-metrics', 'metric-update', {
      metric,
      value,
      change,
      timestamp: new Date().toISOString()
    })
  }

  disconnect() {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []
  }
}

// Global instance
let dashboardManager: DashboardRealtimeManager | null = null

export function getDashboardRealtimeManager(): DashboardRealtimeManager {
  if (!dashboardManager) {
    dashboardManager = new DashboardRealtimeManager()
  }
  return dashboardManager
}