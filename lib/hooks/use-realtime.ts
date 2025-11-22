'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getRealtimeClient, disconnectRealtime, type TableSubscription, type RealtimeEventHandlers } from '@/lib/realtime/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  enabled?: boolean
  onError?: (error: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  autoConnect?: boolean
}

interface RealtimeStatus {
  isConnected: boolean
  retryAttempts: number
  channels: string[]
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { enabled = true, onError, onConnect, onDisconnect, autoConnect = true } = options
  const [status, setStatus] = useState<RealtimeStatus>({
    isConnected: false,
    retryAttempts: 0,
    channels: []
  })

  const clientRef = useRef(getRealtimeClient())
  const unsubscribeFunctionsRef = useRef<(() => void)[]>([])

  useEffect(() => {
    if (!enabled) return

    const client = clientRef.current

    // Set up event handlers
    client.setEventHandlers({
      onConnect: () => {
        setStatus(client.getConnectionStatus())
        onConnect?.()
      },
      onDisconnect: () => {
        setStatus(client.getConnectionStatus())
        onDisconnect?.()
      },
      onError: (error) => {
        onError?.(error)
      },
      onReconnect: () => {
        setStatus(client.getConnectionStatus())
      }
    })

    // Auto-connect if enabled
    if (autoConnect) {
      client.connect()
    }

    // Cleanup on unmount
    return () => {
      // Unsubscribe from all subscriptions
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe())
      unsubscribeFunctionsRef.current = []
    }
  }, [enabled, autoConnect, onConnect, onDisconnect, onError])

  const subscribeToTable = useCallback((subscription: TableSubscription) => {
    if (!enabled) return () => {}

    const client = clientRef.current
    const unsubscribe = client.subscribeToTable(subscription)
    
    unsubscribeFunctionsRef.current.push(unsubscribe)
    setStatus(client.getConnectionStatus())

    return unsubscribe
  }, [enabled])

  const subscribeToChannel = useCallback((channelName: string, eventHandlers: Record<string, (payload: any) => void>) => {
    if (!enabled) return () => {}

    const client = clientRef.current
    const unsubscribe = client.subscribeToChannel(channelName, eventHandlers)
    
    unsubscribeFunctionsRef.current.push(unsubscribe)
    setStatus(client.getConnectionStatus())

    return unsubscribe
  }, [enabled])

  const broadcast = useCallback((channelName: string, event: string, payload: any) => {
    if (!enabled) return

    const client = clientRef.current
    client.broadcast(channelName, event, payload)
  }, [enabled])

  const connect = useCallback(() => {
    if (!enabled) return

    const client = clientRef.current
    client.connect()
  }, [enabled])

  const disconnect = useCallback(() => {
    const client = clientRef.current
    client.disconnect()
    setStatus(client.getConnectionStatus())
  }, [])

  return {
    status,
    subscribeToTable,
    subscribeToChannel,
    broadcast,
    connect,
    disconnect
  }
}

interface UseTableSubscriptionOptions<T = any> {
  table: string
  schema?: string
  filter?: string
  enabled?: boolean
  onInsert?: (record: T) => void
  onUpdate?: (record: T, oldRecord?: T) => void
  onDelete?: (record: T) => void
}

export function useTableSubscription<T = any>(options: UseTableSubscriptionOptions<T>) {
  const { table, schema, filter, enabled = true, onInsert, onUpdate, onDelete } = options
  const { subscribeToTable } = useRealtime({ enabled })

  useEffect(() => {
    if (!enabled) return

    const unsubscribe = subscribeToTable({
      table,
      schema,
      filter,
      onInsert: (payload: RealtimePostgresChangesPayload<T>) => {
        onInsert?.(payload.new as T)
      },
      onUpdate: (payload: RealtimePostgresChangesPayload<T>) => {
        onUpdate?.(payload.new as T, payload.old as T)
      },
      onDelete: (payload: RealtimePostgresChangesPayload<T>) => {
        onDelete?.(payload.old as T)
      }
    })

    return unsubscribe
  }, [table, schema, filter, enabled, onInsert, onUpdate, onDelete, subscribeToTable])
}

interface UseAutoRefreshOptions {
  interval?: number
  enabled?: boolean
  immediate?: boolean
}

export function useAutoRefresh(callback: () => void | Promise<void>, options: UseAutoRefreshOptions = {}) {
  const { interval = 30000, enabled = true, immediate = true } = options
  const callbackRef = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Call immediately if requested
    if (immediate) {
      callbackRef.current()
    }

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, immediate])

  const refresh = useCallback(() => {
    callbackRef.current()
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!intervalRef.current && enabled) {
      intervalRef.current = setInterval(() => {
        callbackRef.current()
      }, interval)
    }
  }, [enabled, interval])

  return { refresh, stop, start }
}

export function useRealtimePresence(channelName: string, userInfo?: any) {
  const [presenceState, setPresenceState] = useState<Record<string, any[]>>({})
  const { subscribeToChannel } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribeToChannel(channelName, {
      'presence': { state: 'sync' },
      'presence_diff': (payload: any) => {
        // Handle presence changes
        setPresenceState(payload.state)
      }
    })

    return unsubscribe
  }, [channelName, subscribeToChannel])

  return presenceState
}