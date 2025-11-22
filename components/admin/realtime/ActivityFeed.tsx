'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  Star, 
  Users, 
  Building2,
  Clock,
  RefreshCw,
  Zap
} from 'lucide-react'
import { getDashboardRealtimeManager, type ActivityFeedItem } from '@/lib/realtime/dashboard'
import { useRealtime } from '@/lib/hooks/use-realtime'

interface ActivityFeedProps {
  maxItems?: number
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

export function ActivityFeed({ 
  maxItems = 50, 
  autoRefresh = true, 
  refreshInterval = 30000,
  className 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  
  const { status } = useRealtime({
    enabled: autoRefresh,
    onConnect: () => setIsRealTimeConnected(true),
    onDisconnect: () => setIsRealTimeConnected(false),
    autoConnect: true
  })

  const addActivity = useCallback((newActivity: ActivityFeedItem) => {
    setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)])
  }, [maxItems])

  const fetchInitialActivities = useCallback(async () => {
    try {
      setLoading(true)
      // In a real implementation, you would fetch from your API
      const response = await fetch('/api/root-admin/activity-feed')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const manualRefresh = useCallback(() => {
    fetchInitialActivities()
  }, [fetchInitialActivities])

  useEffect(() => {
    // Fetch initial data
    fetchInitialActivities()

    if (autoRefresh) {
      // Set up real-time subscriptions
      const dashboardManager = getDashboardRealtimeManager()
      dashboardManager.subscribeToActivityFeed(addActivity)

      return () => {
        dashboardManager.disconnect()
      }
    }
  }, [autoRefresh, addActivity, fetchInitialActivities])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
      case 'booking_completed':
        return Calendar
      case 'cleaner_joined':
        return Users
      case 'company_verified':
        return Building2
      case 'payment_received':
        return DollarSign
      case 'review_submitted':
        return Star
      default:
        return CheckCircle2
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking_created':
        return 'bg-blue-500'
      case 'booking_completed':
        return 'bg-green-500'
      case 'cleaner_joined':
        return 'bg-purple-500'
      case 'company_verified':
        return 'bg-orange-500'
      case 'payment_received':
        return 'bg-emerald-500'
      case 'review_submitted':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>Real-time platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Feed
              {autoRefresh && (
                <Badge variant="secondary" className="ml-2">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time platform activity
              {status.isConnected && (
                <span className="ml-2 text-green-600">• Connected</span>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={manualRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No recent activity to display
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type)
                
                return (
                  <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-2 ${getActivityColor(activity.type)} text-white`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {activity.userName && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {activity.userName}
                            </Badge>
                          )}
                          
                          {activity.amount && (
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(activity.amount)}
                            </Badge>
                          )}
                          
                          {activity.rating && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {activity.rating}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}