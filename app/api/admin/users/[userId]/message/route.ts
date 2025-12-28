import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { logAuditEventFromRequest } from '@/lib/audit'
import { withAuth } from '@/lib/auth/rbac'

// Send message to user (email or WhatsApp)
export const POST = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase },
    { params }: { params: Promise<{ userId: string }> }
  ) => {
  try {
    const body = await request.json()
    const { type, subject, message, email, phone } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'type and message are required' },
        { status: 400 }
      )
    }

    const supabase = authSupabase || createServerSupabase()
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, phone, full_name')
      .eq('id', params.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recipientEmail = email || user.email
    const recipientPhone = phone || user.phone

    if (type === 'email') {
      if (!recipientEmail) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 })
      }

      // Send email via API
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const emailRes = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject || 'Message from tSmartCleaning',
          html: message,
          text: message.replace(/<[^>]*>/g, ''),
        }),
      })

      if (!emailRes.ok) {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      await logAuditEventFromRequest(request, {
        action: 'send_email_to_user',
        resource: 'user',
        resourceId: params.userId,
        metadata: { recipient: recipientEmail, subject },
      })

      return NextResponse.json({ success: true, messageId: 'email-sent' })
    } else if (type === 'whatsapp') {
      if (!recipientPhone) {
        return NextResponse.json({ error: 'User phone not found' }, { status: 400 })
      }

      const phoneFormatted = recipientPhone.startsWith('whatsapp:')
        ? recipientPhone
        : `whatsapp:${recipientPhone.replace(/\D/g, '')}`

      const messageId = await sendWhatsAppMessage(
        { to: phoneFormatted, body: message },
        { tenantId: null }
      )

      await logAuditEventFromRequest(request, {
        action: 'send_whatsapp_to_user',
        resource: 'user',
        resourceId: params.userId,
        metadata: { recipient: phoneFormatted },
      })

      return NextResponse.json({ success: true, messageId })
    } else {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
},
  {
    requireAdmin: true,
  }
)

