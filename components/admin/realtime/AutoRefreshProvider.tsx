'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  RefreshCw, 
  Pause, 
  Play, 
  Zap,
  Clock
} from 'lucide-react'
import { useAutoRefresh } from '@/lib/hooks/use-realtime'

interface AutoRefreshConfig {
  enabled: boolean
  interval: number
  pauseOnHidden: boolean
  pauseOnError: boolean
}

interface AutoRefreshContextType {
  config: AutoRefreshConfig
  setConfig: (config: Partial<AutoRefreshConfig>) => void
  isActive: boolean
  lastRefresh: Date | null
  errorCount: number
  registerRefreshable: (id: string, callback: () => Promise<void> | void) => () => void
  manualRefresh: (id?: string) => void
  pauseAll: () => void
  resumeAll: () => void
  resetErrors: () => void
}

const AutoRefreshContext = createContext<AutoRefreshContextType | null>(null)

interface AutoRefreshProviderProps {
  children: ReactNode
  defaultConfig?: Partial<AutoRefreshConfig>
}

export function AutoRefreshProvider({ 
  children, 
  defaultConfig = {} 
}: AutoRefreshProviderProps) {
  const [config, setConfigState] = useState<AutoRefreshConfig>({
    enabled: true,
    interval: 30000, // 30 seconds default
    pauseOnHidden: true,
    pauseOnError: false,
    ...defaultConfig
  })
  
  const [isActive, setIsActive] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [refreshables, setRefreshables] = useState<Map<string, () => Promise<void> | void>>(new Map())
  const [isDocumentHidden, setIsDocumentHidden] = useState(false)

  // Handle document visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden
      setIsDocumentHidden(hidden)
      
      if (config.pauseOnHidden) {
        setIsActive(!hidden && config.enabled)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [config.pauseOnHidden, config.enabled])

  // Auto-refresh timer
  const executeRefresh = async () => {
    if (refreshables.size === 0) return

    setLastRefresh(new Date())
    
    try {
      const promises = Array.from(refreshables.values()).map(async (callback) => {
        try {
          await callback()
        } catch (error) {
          console.error('Refresh callback error:', error)
          throw error
        }
      })
      
      await Promise.allSettled(promises)
      setErrorCount(0) // Reset error count on successful refresh
    } catch (error) {
      const newErrorCount = errorCount + 1
      setErrorCount(newErrorCount)
      
      if (config.pauseOnError && newErrorCount >= 3) {
        setIsActive(false)
        console.warn('Auto-refresh paused due to repeated errors')
      }
    }
  }

  useAutoRefresh(executeRefresh, {
    interval: config.interval,
    enabled: isActive && config.enabled,
    immediate: false
  })

  const setConfig = (newConfig: Partial<AutoRefreshConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfigState(updatedConfig)
    
    if ('enabled' in newConfig) {
      setIsActive(updatedConfig.enabled && !isDocumentHidden)
    }
  }

  const registerRefreshable = (id: string, callback: () => Promise<void> | void) => {
    setRefreshables(prev => new Map(prev.set(id, callback)))
    
    return () => {
      setRefreshables(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
    }
  }

  const manualRefresh = async (id?: string) => {
    if (id && refreshables.has(id)) {
      try {
        await refreshables.get(id)!()
        setLastRefresh(new Date())
      } catch (error) {
        console.error(`Manual refresh error for ${id}:`, error)
      }
    } else {
      await executeRefresh()
    }
  }

  const pauseAll = () => {
    setIsActive(false)
  }

  const resumeAll = () => {
    setIsActive(config.enabled && !isDocumentHidden)
    setErrorCount(0)
  }

  const resetErrors = () => {
    setErrorCount(0)
    if (config.pauseOnError) {
      setIsActive(config.enabled && !isDocumentHidden)
    }
  }

  const contextValue: AutoRefreshContextType = {
    config,
    setConfig,
    isActive: isActive && config.enabled,
    lastRefresh,
    errorCount,
    registerRefreshable,
    manualRefresh,
    pauseAll,
    resumeAll,
    resetErrors
  }

  return (
    <AutoRefreshContext.Provider value={contextValue}>
      {children}
    </AutoRefreshContext.Provider>
  )
}

export function useAutoRefreshContext(): AutoRefreshContextType {
  const context = useContext(AutoRefreshContext)
  if (!context) {
    throw new Error('useAutoRefreshContext must be used within AutoRefreshProvider')
  }
  return context
}

interface AutoRefreshConfigPanelProps {
  className?: string
}

export function AutoRefreshConfigPanel({ className }: AutoRefreshConfigPanelProps) {
  const { 
    config, 
    setConfig, 
    isActive, 
    lastRefresh, 
    errorCount, 
    manualRefresh,
    pauseAll,
    resumeAll,
    resetErrors 
  } = useAutoRefreshContext()

  const intervalOptions = [
    { value: '5000', label: '5 seconds' },
    { value: '10000', label: '10 seconds' },
    { value: '30000', label: '30 seconds' },
    { value: '60000', label: '1 minute' },
    { value: '300000', label: '5 minutes' },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Auto-Refresh Settings
          <Badge variant={isActive ? 'default' : 'secondary'} className="ml-2">
            {isActive ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Paused
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure automatic refresh behavior for dashboard components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-refresh-enabled">Enable Auto-Refresh</Label>
          <Switch
            id="auto-refresh-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig({ enabled })}
          />
        </div>

        <div className="space-y-2">
          <Label>Refresh Interval</Label>
          <Select 
            value={config.interval.toString()} 
            onValueChange={(value) => setConfig({ interval: parseInt(value) })}
            disabled={!config.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="pause-on-hidden">Pause When Tab Hidden</Label>
          <Switch
            id="pause-on-hidden"
            checked={config.pauseOnHidden}
            onCheckedChange={(pauseOnHidden) => setConfig({ pauseOnHidden })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="pause-on-error">Pause On Errors</Label>
          <Switch
            id="pause-on-error"
            checked={config.pauseOnError}
            onCheckedChange={(pauseOnError) => setConfig({ pauseOnError })}
          />
        </div>

        {errorCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">
                {errorCount} error(s) detected
              </span>
              <Button size="sm" variant="outline" onClick={resetErrors}>
                Reset
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => manualRefresh()}
            disabled={!config.enabled}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Now
          </Button>
          
          {isActive ? (
            <Button size="sm" variant="outline" onClick={pauseAll}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={resumeAll}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
        </div>

        {lastRefresh && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AutoRefreshableProps {
  id: string
  refreshFn: () => Promise<void> | void
  children: ReactNode
  manual?: boolean
}

export function AutoRefreshable({ 
  id, 
  refreshFn, 
  children, 
  manual = false 
}: AutoRefreshableProps) {
  const { registerRefreshable } = useAutoRefreshContext()

  useEffect(() => {
    if (!manual) {
      const unregister = registerRefreshable(id, refreshFn)
      return unregister
    }
  }, [id, refreshFn, manual, registerRefreshable])

  return <>{children}</>
}