import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// Get messages for a booking (using notifications or creating a simple message log)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    // Fetch booking to get customer and provider info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        provider_id,
        customer:customer_id(id, email),
        provider:provider_id(id, user_id)
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // For now, return empty messages array
    // In production, you'd query a messages table
    return NextResponse.json({
      messages: [],
      booking: {
        id: booking.id,
        customerId: booking.customer_id,
        providerId: booking.provider_id,
      },
    })
  } catch (error) {
    console.error('[bookings] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Send a message for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    const { message, recipientPhone, recipientEmail } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch booking to get customer info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        provider_id,
        customer:customer_id(id, email),
        provider:provider_id(id, user_id)
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Send WhatsApp message if phone provided
    if (recipientPhone) {
      try {
        const to = recipientPhone.startsWith('whatsapp:') ? recipientPhone : `whatsapp:${recipientPhone}`
        await sendWhatsAppMessage(
          {
            to,
            body: `[Booking ${id}] ${message}`,
          },
          { tenantId: tenantId || undefined }
        )
      } catch (error) {
        console.warn('[bookings] WhatsApp send failed:', error)
      }
    }

    // Send email if email provided
    if (recipientEmail) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `Message about your booking #${id}`,
            text: message,
            html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
          }),
        })
      } catch (error) {
        console.warn('[bookings] Email send failed:', error)
      }
    }

    // Create a notification for the recipient
    const recipientId = booking.customer_id || booking.provider_id
    if (recipientId) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message',
        title: 'New message about your booking',
        message: message,
        metadata: { booking_id: id },
        is_read: false,
      }).catch(() => {}) // Best effort
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    })
  } catch (error) {
    console.error('[bookings] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

