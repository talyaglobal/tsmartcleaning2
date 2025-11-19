import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { recordUsageEvent } from '@/lib/usage'
import { sendEmail } from '@/lib/emails/smtp'

// Email endpoint used by payout notifications and other flows.
// Uses GoDaddy Workspace SMTP for sending emails.
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { to, subject, html, text, from, replyTo } = await request.json()

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      )
    }

    try {
      // Send email via SMTP
      await sendEmail({
        to,
        subject,
        html: html || text,
        text,
        from,
        replyTo,
      })

      const result = {
        success: true,
        messageId: `sent-${Date.now()}`,
      }

      // Best-effort usage metering for outbound email as messages
      recordUsageEvent({
        tenantId,
        resource: 'message',
        quantity: 1,
        metadata: { channel: 'email', recipient: to, subject },
      }).catch(() => {})

      return NextResponse.json(result)
    } catch (emailError: any) {
      console.error('[send-email] SMTP error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[send-email] Request error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


