import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { recordUsageEvent } from '@/lib/usage'

// Minimal email endpoint used by payout notifications and other flows.
// In production, integrate with an email provider (e.g., Resend, SendGrid).
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { to, subject, html, text } = await request.json()

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      )
    }

    // Stub implementation: log payload for now.
    // Replace with actual email sending integration as needed.
    console.log('[v0] send-email request:', {
      to,
      subject,
      hasHtml: Boolean(html),
      hasText: Boolean(text),
    })

    // If you add a provider, do it here and return its response id
    const result = {
      success: true,
      messageId: `queued-${Date.now()}`,
    }

    // Best-effort usage metering for outbound email as messages
    recordUsageEvent({
      tenantId,
      resource: 'message',
      quantity: 1,
      metadata: { channel: 'email', recipient: to, subject },
    }).catch(() => {})

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] send-email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


