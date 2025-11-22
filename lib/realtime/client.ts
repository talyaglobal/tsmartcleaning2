'use client'

import { createClient } from '@supabase/supabase-js'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeConfig {
  url: string
  anonKey: string
}

interface RealtimeEventHandlers {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
  onReconnect?: () => void
}

interface TableSubscription {
  table: string
  schema?: string
  filter?: string
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void
}

class RealtimeClient {
  private client
  private channels: Map<string, RealtimeChannel> = new Map()
  private isConnected = false
  private connectionRetryAttempts = 0
  private maxRetryAttempts = 5
  private retryDelay = 1000
  private eventHandlers: RealtimeEventHandlers = {}
  private reconnectTimeoutId: NodeJS.Timeout | null = null

  constructor(config: RealtimeConfig) {
    this.client = createClient(config.url, config.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    this.setupConnectionHandlers()
  }

  private setupConnectionHandlers() {
    // Listen for connection events
    this.client.realtime.onOpen(() => {
      this.isConnected = true
      this.connectionRetryAttempts = 0
      this.eventHandlers.onConnect?.()
      console.log('🟢 Realtime connected')
    })

    this.client.realtime.onClose(() => {
      this.isConnected = false
      this.eventHandlers.onDisconnect?.()
      console.log('🔴 Realtime disconnected')
      this.handleReconnection()
    })

    this.client.realtime.onError((error) => {
      console.error('❌ Realtime error:', error)
      this.eventHandlers.onError?.(error)
    })
  }

  private handleReconnection() {
    if (this.connectionRetryAttempts >= this.maxRetryAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.connectionRetryAttempts++
    const delay = this.retryDelay * Math.pow(2, this.connectionRetryAttempts - 1)

    console.log(`🔄 Attempting reconnection ${this.connectionRetryAttempts}/${this.maxRetryAttempts} in ${delay}ms`)

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect()
      this.eventHandlers.onReconnect?.()
    }, delay)
  }

  setEventHandlers(handlers: RealtimeEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  connect() {
    if (!this.isConnected) {
      this.client.realtime.connect()
    }
  }

  disconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }

    this.channels.forEach(channel => {
      this.client.removeChannel(channel)
    })
    this.channels.clear()
    
    this.client.realtime.disconnect()
    this.isConnected = false
  }

  subscribeToTable(subscription: TableSubscription): () => void {
    const channelName = `table:${subscription.schema || 'public'}:${subscription.table}${subscription.filter ? `:${subscription.filter}` : ''}`
    
    // Remove existing channel if exists
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName)!
      this.client.removeChannel(existingChannel)
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: subscription.schema || 'public',
          table: subscription.table,
          filter: subscription.filter
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              subscription.onInsert?.(payload)
              break
            case 'UPDATE':
              subscription.onUpdate?.(payload)
              break
            case 'DELETE':
              subscription.onDelete?.(payload)
              break
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${channelName}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to ${channelName}`)
        }
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      if (this.channels.has(channelName)) {
        this.client.removeChannel(this.channels.get(channelName)!)
        this.channels.delete(channelName)
        console.log(`🗑️ Unsubscribed from ${channelName}`)
      }
    }
  }

  subscribeToChannel(channelName: string, eventHandlers: Record<string, (payload: any) => void>): () => void {
    // Remove existing channel if exists
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName)!
      this.client.removeChannel(existingChannel)
    }

    let channel = this.client.channel(channelName)

    // Subscribe to all provided events
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel = channel.on(event, handler)
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to channel ${channelName}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Failed to subscribe to channel ${channelName}`)
      }
    })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      if (this.channels.has(channelName)) {
        this.client.removeChannel(this.channels.get(channelName)!)
        this.channels.delete(channelName)
        console.log(`🗑️ Unsubscribed from channel ${channelName}`)
      }
    }
  }

  broadcast(channelName: string, event: string, payload: any) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event,
        payload
      })
    } else {
      console.warn(`Channel ${channelName} not found for broadcast`)
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      retryAttempts: this.connectionRetryAttempts,
      channels: Array.from(this.channels.keys())
    }
  }
}

// Global instance
let realtimeClient: RealtimeClient | null = null

export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables for realtime client')
    }

    realtimeClient = new RealtimeClient({ url, anonKey })
  }

  return realtimeClient
}

export function disconnectRealtime() {
  if (realtimeClient) {
    realtimeClient.disconnect()
    realtimeClient = null
  }
}

export type { TableSubscription, RealtimeEventHandlers }