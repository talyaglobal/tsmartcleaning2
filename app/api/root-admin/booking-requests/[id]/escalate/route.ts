import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { logAuditEvent } from '@/lib/audit'
import { withRootAdmin } from '@/lib/auth/rbac'

export const POST = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = createServerSupabase(null)

    // Get the booking request
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, created_at, customer_id, provider_id')
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking request not found' },
        { status: 404 }
      )
    }

    // Check if already escalated (you might want to add an escalated_at field)
    // For now, we'll just log the escalation and update metadata
    const now = new Date()
    const createdAt = new Date(booking.created_at)
    const hoursAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    // Log escalation in audit trail
    await logAuditEvent(
      { request, tenantId: null, userId: null },
      {
        action: 'escalate_booking_request',
        resource: 'booking',
        resourceId: params.id,
        metadata: {
          hoursSinceCreation: hoursAgo,
          previousStatus: booking.status,
          escalatedAt: now.toISOString(),
        },
      }
    )

    // You could also:
    // 1. Send notification to admin team
    // 2. Update booking with escalated flag
    // 3. Create a ticket in a support system
    // 4. Send email to customer about escalation

    return NextResponse.json({
      success: true,
      message: 'Booking request escalated successfully',
      bookingId: params.id,
      hoursSinceCreation: hoursAgo,
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Escalate booking request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

