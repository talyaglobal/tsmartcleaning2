import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { createBookingEmailClient, BookingEmailPayload } from './index'
import { resolveTenantFromRequest } from '@/lib/tenant'

async function sendEmailViaApi(
  request: NextRequest | null,
  tenantId: string | null,
  payload: { to: string; subject: string; html: string }
) {
  const resolvedTenantId = request ? resolveTenantFromRequest(request) : tenantId || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  try {
    await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': resolvedTenantId,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('[booking-email] Failed to send email:', error)
  }
}

export async function sendBookingEmail(
  request: NextRequest | null,
  bookingId: string,
  emailType: 'confirmation' | 'confirmed' | 'reminder' | 'inProgress' | 'completed' | 'cancelled' | 'refunded'
) {
  try {
    // Try to get tenant_id from request first, fallback to getting it from booking
    let tenantId = request ? resolveTenantFromRequest(request) : null
    const supabase = createServerSupabase(tenantId || undefined)

    // Fetch booking with all related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_id(id, email, full_name),
        service:service_id(name),
        address:address_id(street_address, apt_suite, city, state, zip_code),
        provider:provider_id(business_name)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('[booking-email] Failed to fetch booking:', bookingError)
      return
    }

    // If tenant_id wasn't in request, get it from booking
    if (!tenantId && booking.tenant_id) {
      tenantId = booking.tenant_id as string
    }

    const customer = booking.customer as any
    const service = booking.service as any
    const address = booking.address as any
    const provider = booking.provider as any

    if (!customer?.email) {
      console.warn('[booking-email] No email address for customer:', booking.customer_id)
      return
    }

    // Format address
    const addressString = [
      address?.street_address,
      address?.apt_suite,
      address?.city,
      address?.state,
      address?.zip_code,
    ]
      .filter(Boolean)
      .join(', ')

    const payload: BookingEmailPayload = {
      to: customer.email,
      userName: customer.full_name || 'Customer',
      bookingId: booking.id,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      serviceName: service?.name || 'Service',
      address: addressString || 'Address not available',
      totalAmount: Number(booking.total_amount || 0),
      status: booking.status,
      tenantId: tenantId || undefined,
      providerName: provider?.business_name,
      specialInstructions: booking.special_instructions || undefined,
    }

    const client = createBookingEmailClient(async ({ to, subject, html }) => {
      await sendEmailViaApi(request, tenantId, { to, subject, html })
    })

    switch (emailType) {
      case 'confirmation':
        await client.sendConfirmation(payload)
        break
      case 'confirmed':
        await client.sendConfirmed(payload)
        break
      case 'reminder':
        await client.sendReminder(payload)
        break
      case 'inProgress':
        await client.sendInProgress(payload)
        break
      case 'completed':
        await client.sendCompleted(payload)
        break
      case 'cancelled':
        await client.sendCancelled(payload)
        break
      case 'refunded':
        await client.sendRefunded(payload)
        break
    }
  } catch (error) {
    console.error('[booking-email] Error sending booking email:', error)
  }
}

