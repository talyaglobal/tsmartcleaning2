import { createServerSupabase } from '@/lib/supabase'

/**
 * Email Monitoring and Quota Tracking
 * 
 * Tracks email usage, quotas, and delivery status
 */

export interface EmailUsageStats {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
  quotaLimit?: number
  quotaRemaining?: number
  quotaPercentage?: number
}

export interface EmailDeliveryStats {
  sent: number
  delivered: number
  bounced: number
  failed: number
  opened: number
  clicked: number
  spamReported: number
  deliveryRate: number
  bounceRate: number
}

/**
 * Record email usage event
 */
export async function recordEmailUsage(
  tenantId: string | null,
  metadata?: {
    recipient?: string
    subject?: string
    type?: string
    success?: boolean
  }
): Promise<void> {
  try {
    const supabase = createServerSupabase(tenantId || undefined)

    // Record in usage_events table (if it exists)
    await supabase
      .from('usage_events')
      .insert({
        tenant_id: tenantId,
        resource: 'email',
        quantity: 1,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      })
      .catch(() => {
        // Ignore if table doesn't exist
      })

    // Also track in a dedicated email_logs table if it exists
    await supabase
      .from('email_logs')
      .insert({
        tenant_id: tenantId,
        recipient: metadata?.recipient || null,
        subject: metadata?.subject || null,
        email_type: metadata?.type || null,
        status: metadata?.success ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      })
      .catch(() => {
        // Ignore if table doesn't exist
      })
  } catch (error) {
    console.error('[email-monitoring] Failed to record usage:', error)
    // Don't throw - monitoring should not break email sending
  }
}

/**
 * Get email usage statistics
 */
export async function getEmailUsageStats(
  tenantId: string | null,
  period: 'today' | 'week' | 'month' | 'all' = 'month'
): Promise<EmailUsageStats> {
  try {
    const supabase = createServerSupabase(tenantId || undefined)

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
    }

    // Try to get from usage_events table
    const { data: usageEvents } = await supabase
      .from('usage_events')
      .select('quantity, created_at')
      .eq('resource', 'email')
      .gte('created_at', startDate.toISOString())
      .catch(() => ({ data: null }))

    // Try to get from email_logs table
    const { data: emailLogs } = await supabase
      .from('email_logs')
      .select('sent_at')
      .gte('sent_at', startDate.toISOString())
      .catch(() => ({ data: null }))

    // Count emails
    const countFromEvents = usageEvents?.reduce((sum, event) => sum + (event.quantity || 1), 0) || 0
    const countFromLogs = emailLogs?.length || 0
    const totalCount = Math.max(countFromEvents, countFromLogs)

    // Get quota limit from environment or tenant settings
    const quotaLimit = process.env.EMAIL_QUOTA_LIMIT
      ? parseInt(process.env.EMAIL_QUOTA_LIMIT, 10)
      : undefined

    // Calculate remaining quota
    const quotaRemaining = quotaLimit ? Math.max(0, quotaLimit - totalCount) : undefined
    const quotaPercentage = quotaLimit ? (totalCount / quotaLimit) * 100 : undefined

    return {
      today: period === 'today' ? totalCount : 0, // Would need separate query for today
      thisWeek: period === 'week' ? totalCount : 0,
      thisMonth: period === 'month' ? totalCount : 0,
      total: period === 'all' ? totalCount : 0,
      quotaLimit,
      quotaRemaining,
      quotaPercentage,
    }
  } catch (error) {
    console.error('[email-monitoring] Failed to get usage stats:', error)
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
    }
  }
}

/**
 * Get email delivery statistics from webhook events
 */
export async function getEmailDeliveryStats(
  tenantId: string | null,
  period: 'today' | 'week' | 'month' = 'month'
): Promise<EmailDeliveryStats> {
  try {
    const supabase = createServerSupabase(tenantId || undefined)

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Get webhook events for email
    const { data: webhookEvents } = await supabase
      .from('webhook_events')
      .select('event_type')
      .eq('provider', 'email')
      .gte('created_at', startDate.toISOString())
      .catch(() => ({ data: null }))

    if (!webhookEvents) {
      return {
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        spamReported: 0,
        deliveryRate: 0,
        bounceRate: 0,
      }
    }

    const stats = {
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      spamReported: 0,
    }

    webhookEvents.forEach((event) => {
      switch (event.event_type) {
        case 'delivered':
          stats.delivered++
          stats.sent++
          break
        case 'bounced':
          stats.bounced++
          stats.sent++
          stats.failed++
          break
        case 'dropped':
          stats.failed++
          stats.sent++
          break
        case 'opened':
          stats.opened++
          break
        case 'clicked':
          stats.clicked++
          break
        case 'spam_reported':
          stats.spamReported++
          break
      }
    })

    // Calculate rates
    const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0
    const bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0

    return {
      ...stats,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
    }
  } catch (error) {
    console.error('[email-monitoring] Failed to get delivery stats:', error)
    return {
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      spamReported: 0,
      deliveryRate: 0,
      bounceRate: 0,
    }
  }
}

/**
 * Check if email quota is exceeded
 */
export async function checkEmailQuota(
  tenantId: string | null
): Promise<{ exceeded: boolean; remaining?: number; limit?: number }> {
  try {
    const stats = await getEmailUsageStats(tenantId, 'month')

    if (stats.quotaLimit === undefined) {
      return { exceeded: false }
    }

    return {
      exceeded: (stats.quotaRemaining || 0) <= 0,
      remaining: stats.quotaRemaining,
      limit: stats.quotaLimit,
    }
  } catch (error) {
    console.error('[email-monitoring] Failed to check quota:', error)
    return { exceeded: false }
  }
}

/**
 * Get bounce rate and check if it's too high
 */
export async function checkBounceRate(
  tenantId: string | null,
  threshold: number = 5.0 // 5% bounce rate threshold
): Promise<{ high: boolean; rate: number; threshold: number }> {
  try {
    const stats = await getEmailDeliveryStats(tenantId, 'month')

    return {
      high: stats.bounceRate > threshold,
      rate: stats.bounceRate,
      threshold,
    }
  } catch (error) {
    console.error('[email-monitoring] Failed to check bounce rate:', error)
    return {
      high: false,
      rate: 0,
      threshold,
    }
  }
}

