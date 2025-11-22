'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Zap,
  WifiOff
} from 'lucide-react'
import { useTableSubscription, useRealtime } from '@/lib/hooks/use-realtime'

interface KPIMetric {
  current: number
  target: number
  percentage: number
}

interface RealtimeKPICardProps {
  metric: 'companies' | 'cleaners' | 'revenue'
  title: string
  data: KPIMetric
  onUpdate?: (newData: KPIMetric) => void
  className?: string
}

export function RealtimeKPICard({ 
  metric, 
  title, 
  data, 
  onUpdate,
  className 
}: RealtimeKPICardProps) {
  const [currentData, setCurrentData] = useState(data)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isUpdating, setIsUpdating] = useState(false)
  const [changeIndicator, setChangeIndicator] = useState<'up' | 'down' | null>(null)
  
  const { status } = useRealtime({ enabled: true })

  const getIcon = () => {
    switch (metric) {
      case 'companies': return Building2
      case 'cleaners': return Users
      case 'revenue': return DollarSign
    }
  }

  const getTableName = () => {
    switch (metric) {
      case 'companies': return 'companies'
      case 'cleaners': return 'profiles'
      case 'revenue': return 'bookings'
    }
  }

  const getTableFilter = () => {
    switch (metric) {
      case 'companies': return 'status=eq.active'
      case 'cleaners': return 'role=eq.cleaner'
      case 'revenue': return 'status=eq.completed'
    }
  }

  const fetchCurrentValue = async () => {
    try {
      setIsUpdating(true)
      
      let response
      switch (metric) {
        case 'companies':
          response = await fetch('/api/root-admin/companies')
          break
        case 'cleaners':
          response = await fetch('/api/root-admin/users?role=cleaner')
          break
        case 'revenue':
          const currentMonth = new Date().toISOString().substring(0, 7)
          response = await fetch(`/api/root-admin/analytics/revenue?month=${currentMonth}`)
          break
      }

      if (response?.ok) {
        const data = await response.json()
        let newValue = 0
        
        switch (metric) {
          case 'companies':
            newValue = data.companies?.length || 0
            break
          case 'cleaners':
            newValue = data.users?.length || 0
            break
          case 'revenue':
            newValue = data.revenue || 0
            break
        }

        const newData = {
          ...currentData,
          current: newValue,
          percentage: Math.round((newValue / currentData.target) * 100)
        }

        // Show change indicator
        const oldValue = currentData.current
        if (newValue > oldValue) {
          setChangeIndicator('up')
          setTimeout(() => setChangeIndicator(null), 2000)
        } else if (newValue < oldValue) {
          setChangeIndicator('down')
          setTimeout(() => setChangeIndicator(null), 2000)
        }

        setCurrentData(newData)
        setLastUpdate(new Date())
        onUpdate?.(newData)
      }
    } catch (error) {
      console.error(`Error fetching ${metric} data:`, error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Subscribe to real-time updates
  useTableSubscription({
    table: getTableName(),
    filter: getTableFilter(),
    enabled: true,
    onInsert: fetchCurrentValue,
    onUpdate: fetchCurrentValue,
    onDelete: fetchCurrentValue
  })

  useEffect(() => {
    setCurrentData(data)
  }, [data])

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return CheckCircle2
    if (percentage >= 75) return TrendingUp
    if (percentage >= 50) return Target
    return AlertTriangle
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatValue = (value: number) => {
    if (metric === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    }
    return value.toString()
  }

  const formatTarget = (target: number) => {
    if (metric === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(target)
    }
    return target.toString()
  }

  const IconComponent = getIcon()
  const StatusIcon = getStatusIcon(currentData.percentage)

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {status.isConnected ? (
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${isUpdating ? 'animate-pulse' : ''}`}>
                {formatValue(currentData.current)}
              </div>
              {changeIndicator && (
                <div className={`flex items-center ${
                  changeIndicator === 'up' ? 'text-green-600' : 'text-red-600'
                } animate-bounce`}>
                  {changeIndicator === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(currentData.percentage)}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{currentData.percentage}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Target:</span>
              <span className="font-medium">
                {formatTarget(currentData.target)}
              </span>
            </div>
            <Progress 
              value={Math.min(currentData.percentage, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Remaining: {formatValue(Math.max(0, currentData.target - currentData.current))}
              </span>
              <span>{Math.min(currentData.percentage, 100)}% complete</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}