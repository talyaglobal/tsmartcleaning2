import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { recordEmailUsage } from '@/lib/emails/monitoring'

/**
 * POST /api/webhooks/email
 * 
 * Generic email webhook handler for bounce, delivery, and engagement events
 * 
 * Supports multiple email providers:
 * - SendGrid
 * - Mailgun
 * - Resend
 * - AWS SES (via SNS)
 * - Generic webhook format
 * 
 * This endpoint processes webhook events from email service providers
 * to track delivery status, bounces, spam reports, opens, and clicks.
 */

interface EmailWebhookEvent {
  event: string // 'delivered', 'bounced', 'dropped', 'opened', 'clicked', 'spam_reported', 'unsubscribed'
  email: string
  timestamp?: number | string
  messageId?: string
  reason?: string
  bounceType?: 'hard' | 'soft'
  category?: string[]
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const headers = request.headers

    // Try to detect provider from headers or payload
    const provider = detectProvider(headers, payload)
    
    // Normalize events based on provider
    const events = normalizeEvents(payload, provider)

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'No valid events found in payload' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Process each event
    const results = await Promise.allSettled(
      events.map((event) => processEmailEvent(supabase, event))
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      processed: successful,
      failed,
      total: events.length,
    })
  } catch (error: any) {
    console.error('[email-webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Detect email provider from headers or payload structure
 */
function detectProvider(headers: Headers, payload: any): string {
  // Check headers for provider-specific signatures
  if (headers.get('x-sendgrid-eventid')) return 'sendgrid'
  if (headers.get('x-mailgun-signature')) return 'mailgun'
  if (headers.get('x-resend-signature')) return 'resend'
  if (headers.get('x-amz-sns-message-type')) return 'ses'

  // Check payload structure
  if (Array.isArray(payload) && payload[0]?.sg_event_id) return 'sendgrid'
  if (payload['event-data'] || payload['signature']) return 'mailgun'
  if (payload['type'] && payload['Type']) return 'ses'

  return 'generic'
}

/**
 * Normalize events from different providers into a common format
 */
function normalizeEvents(payload: any, provider: string): EmailWebhookEvent[] {
  switch (provider) {
    case 'sendgrid':
      return normalizeSendGridEvents(payload)
    case 'mailgun':
      return normalizeMailgunEvents(payload)
    case 'resend':
      return normalizeResendEvents(payload)
    case 'ses':
      return normalizeSESEvents(payload)
    default:
      return normalizeGenericEvents(payload)
  }
}

/**
 * Normalize SendGrid webhook events
 */
function normalizeSendGridEvents(payload: any): EmailWebhookEvent[] {
  if (!Array.isArray(payload)) return []

  return payload.map((event) => ({
    event: mapSendGridEvent(event.event),
    email: event.email,
    timestamp: event.timestamp,
    messageId: event.sg_message_id,
    reason: event.reason,
    bounceType: event.event === 'bounce' ? (event.type === 'bounce' ? 'hard' : 'soft') : undefined,
    category: event.category,
    metadata: event,
  }))
}

/**
 * Normalize Mailgun webhook events
 */
function normalizeMailgunEvents(payload: any): EmailWebhookEvent[] {
  const eventData = payload['event-data'] || payload
  if (!eventData) return []

  return [
    {
      event: mapMailgunEvent(eventData.event),
      email: eventData.recipient || eventData['user-variables']?.email,
      timestamp: eventData.timestamp,
      messageId: eventData['message-id'],
      reason: eventData.reason,
      bounceType: eventData.severity === 'permanent' ? 'hard' : 'soft',
      metadata: eventData,
    },
  ]
}

/**
 * Normalize Resend webhook events
 */
function normalizeResendEvents(payload: any): EmailWebhookEvent[] {
  if (!payload.type) return []

  return [
    {
      event: mapResendEvent(payload.type),
      email: payload.data?.email?.to || payload.recipient,
      timestamp: payload.created_at,
      messageId: payload.data?.email?.id,
      reason: payload.data?.error?.message,
      metadata: payload,
    },
  ]
}

/**
 * Normalize AWS SES webhook events (via SNS)
 */
function normalizeSESEvents(payload: any): EmailWebhookEvent[] {
  // SES sends events via SNS, need to parse the Message
  let message
  try {
    message = typeof payload.Message === 'string' ? JSON.parse(payload.Message) : payload.Message
  } catch {
    message = payload
  }

  if (!message || !message.eventType) return []

  return [
    {
      event: mapSESEvent(message.eventType),
      email: message.mail?.destination?.[0] || message.mail?.commonHeaders?.to?.[0],
      timestamp: message.mail?.timestamp,
      messageId: message.mail?.messageId,
      reason: message.bounce?.bouncedRecipients?.[0]?.diagnosticCode,
      bounceType: message.bounce?.bounceType === 'Permanent' ? 'hard' : 'soft',
      metadata: message,
    },
  ]
}

/**
 * Normalize generic webhook events
 */
function normalizeGenericEvents(payload: any): EmailWebhookEvent[] {
  // Try to extract event from common patterns
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      event: item.event || item.type || 'unknown',
      email: item.email || item.recipient || item.to,
      timestamp: item.timestamp || item.time || Date.now(),
      messageId: item.messageId || item.message_id || item.id,
      reason: item.reason || item.error,
      bounceType: item.bounceType || item.bounce_type,
      metadata: item,
    }))
  }

  // Single event
  return [
    {
      event: payload.event || payload.type || 'unknown',
      email: payload.email || payload.recipient || payload.to,
      timestamp: payload.timestamp || payload.time || Date.now(),
      messageId: payload.messageId || payload.message_id || payload.id,
      reason: payload.reason || payload.error,
      bounceType: payload.bounceType || payload.bounce_type,
      metadata: payload,
    },
  ]
}

/**
 * Map SendGrid event types to standard format
 */
function mapSendGridEvent(event: string): string {
  const mapping: Record<string, string> = {
    processed: 'sent',
    delivered: 'delivered',
    bounce: 'bounced',
    dropped: 'dropped',
    open: 'opened',
    click: 'clicked',
    spamreport: 'spam_reported',
    unsubscribe: 'unsubscribed',
  }
  return mapping[event] || event
}

/**
 * Map Mailgun event types to standard format
 */
function mapMailgunEvent(event: string): string {
  const mapping: Record<string, string> = {
    accepted: 'sent',
    delivered: 'delivered',
    failed: 'bounced',
    opened: 'opened',
    clicked: 'clicked',
    complained: 'spam_reported',
    unsubscribed: 'unsubscribed',
  }
  return mapping[event] || event
}

/**
 * Map Resend event types to standard format
 */
function mapResendEvent(event: string): string {
  const mapping: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.bounced': 'bounced',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.complained': 'spam_reported',
  }
  return mapping[event] || event.replace('email.', '')
}

/**
 * Map AWS SES event types to standard format
 */
function mapSESEvent(event: string): string {
  const mapping: Record<string, string> = {
    Send: 'sent',
    Delivery: 'delivered',
    Bounce: 'bounced',
    Reject: 'dropped',
    Open: 'opened',
    Click: 'clicked',
    Complaint: 'spam_reported',
  }
  return mapping[event] || event.toLowerCase()
}

/**
 * Process a single email webhook event
 */
async function processEmailEvent(supabase: any, event: EmailWebhookEvent) {
  try {
    // Store webhook event for analytics
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'email',
        event_type: event.event,
        event_id: event.messageId || `email-${Date.now()}-${Math.random()}`,
        payload: event.metadata || event,
        recipient: event.email,
        created_at: event.timestamp
          ? new Date(typeof event.timestamp === 'string' ? event.timestamp : event.timestamp * 1000).toISOString()
          : new Date().toISOString(),
      })
      .catch((error) => {
        console.error('[email-webhook] Failed to store webhook event:', error)
        // Don't throw - continue processing
      })

    // Handle hard bounces - disable email notifications for that user
    if (event.event === 'bounced' && event.bounceType === 'hard') {
      await handleHardBounce(supabase, event.email)
    }

    // Handle spam reports - disable email notifications
    if (event.event === 'spam_reported') {
      await handleSpamReport(supabase, event.email)
    }

    // Record email usage for delivered emails
    if (event.event === 'delivered') {
      await recordEmailUsage(null, {
        recipient: event.email,
        type: 'delivery',
        success: true,
      }).catch(() => {
        // Ignore errors in monitoring
      })
    }

    // Record failed emails
    if (event.event === 'bounced' || event.event === 'dropped') {
      await recordEmailUsage(null, {
        recipient: event.email,
        type: 'bounce',
        success: false,
      }).catch(() => {
        // Ignore errors in monitoring
      })
    }
  } catch (error) {
    console.error('[email-webhook] Error processing event:', error)
    throw error
  }
}

/**
 * Handle hard bounce - disable email notifications for user
 */
async function handleHardBounce(supabase: any, email: string) {
  try {
    // Find user by email
    const { data: users } = await supabase
      .from('users')
      .select('id, email_notifications_enabled')
      .eq('email', email)
      .limit(1)

    if (users && users.length > 0) {
      // Disable email notifications
      await supabase
        .from('users')
        .update({
          email_notifications_enabled: false,
          email_bounced: true,
          email_bounced_at: new Date().toISOString(),
        })
        .eq('id', users[0].id)

      console.log(`[email-webhook] Disabled email notifications for user ${users[0].id} due to hard bounce`)
    }
  } catch (error) {
    console.error('[email-webhook] Error handling hard bounce:', error)
  }
}

/**
 * Handle spam report - disable email notifications for user
 */
async function handleSpamReport(supabase: any, email: string) {
  try {
    // Find user by email
    const { data: users } = await supabase
      .from('users')
      .select('id, email_notifications_enabled')
      .eq('email', email)
      .limit(1)

    if (users && users.length > 0) {
      // Disable email notifications
      await supabase
        .from('users')
        .update({
          email_notifications_enabled: false,
          email_marked_spam: true,
          email_marked_spam_at: new Date().toISOString(),
        })
        .eq('id', users[0].id)

      console.log(`[email-webhook] Disabled email notifications for user ${users[0].id} due to spam report`)
    }
  } catch (error) {
    console.error('[email-webhook] Error handling spam report:', error)
  }
}
