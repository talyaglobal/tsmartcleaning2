import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { sendBookingEmail } from '@/lib/emails/booking/send'
import { withAuth } from '@/lib/auth/rbac'
import { UserRole, isAdminRole } from '@/lib/auth/roles'

// Get a single booking
export const GET = withAuth(
  async (
    request: NextRequest,
    auth: { user: any, supabase: any, tenantId: string | null },
    context?: { params: { id: string } }
  ) => {
    try {
      if (!context?.params?.id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
      }

      const { id } = context.params
      const tenantId = auth.tenantId || resolveTenantFromRequest(request)

      // Fetch booking
      const { data, error } = await auth.supabase
        .from('bookings')
        .select('*, services(*), addresses(*), provider_profiles(*)')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }
        console.error('[v0] Get booking supabase error:', error)
        return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 })
      }

      // Verify user has access to this booking
      const isAdmin = isAdminRole(auth.user.role)
      const isOwner = data.customer_id === auth.user.id
      const isProvider = data.provider_id === auth.user.id

      if (!isAdmin && !isOwner && !isProvider) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      return NextResponse.json({ booking: data })
    } catch (error) {
      console.error('[v0] Get booking error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

// Update a booking
export const PATCH = withAuth(
  async (
    request: NextRequest,
    auth: { user: any, supabase: any, tenantId: string | null },
    context?: { params: { id: string } }
  ) => {
    try {
      if (!context?.params?.id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
      }

      const { id } = context.params
      const tenantId = auth.tenantId || resolveTenantFromRequest(request)
      const updates = await request.json()

      // Verify user has access to this booking
      const { data: booking } = await auth.supabase
        .from('bookings')
        .select('customer_id, provider_id, status')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const isAdmin = isAdminRole(auth.user.role)
      const isOwner = booking.customer_id === auth.user.id
      const isProvider = booking.provider_id === auth.user.id

      // Only admins, owners, or assigned providers can update bookings
      if (!isAdmin && !isOwner && !isProvider) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Non-admins can only update certain fields
      if (!isAdmin) {
        // Customers can only cancel their own bookings
        if (isOwner && updates.status && updates.status !== 'cancelled') {
          return NextResponse.json(
            { error: 'You can only cancel your own bookings' },
            { status: 403 }
          )
        }
        // Providers can only update status to in-progress or completed
        if (isProvider && updates.status && !['in-progress', 'completed'].includes(updates.status)) {
          return NextResponse.json(
            { error: 'You can only update booking status to in-progress or completed' },
            { status: 403 }
          )
        }
      }

      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // Get old status before update to detect status changes
      const { data: oldBooking } = await auth.supabase
        .from('bookings')
        .select('status')
        .eq('id', id)
        .single()

      const { data, error } = await auth.supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }
        console.error('[v0] Update booking supabase error:', error)
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
      }

      // Send email notifications based on status changes
      const oldStatus = oldBooking?.status
      const newStatus = data?.status

      if (oldStatus !== newStatus && newStatus) {
        let emailType: 'confirmed' | 'inProgress' | 'completed' | 'cancelled' | 'refunded' | null = null

        switch (newStatus) {
          case 'confirmed':
            emailType = 'confirmed'
            break
          case 'in-progress':
            emailType = 'inProgress'
            break
          case 'completed':
            emailType = 'completed'
            break
          case 'cancelled':
            emailType = 'cancelled'
            break
          case 'refunded':
            emailType = 'refunded'
            break
        }

        if (emailType) {
          sendBookingEmail(request, id, emailType).catch((error) => {
            console.error('[v0] Failed to send booking status email:', error)
          })
        }
      }

      return NextResponse.json({
        booking: data,
        message: 'Booking updated successfully',
      })
    } catch (error) {
      console.error('[v0] Update booking error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

// Cancel a booking
export const DELETE = withAuth(
  async (
    request: NextRequest,
    auth: { user: any, supabase: any, tenantId: string | null },
    context?: { params: { id: string } }
  ) => {
    try {
      if (!context?.params?.id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
      }

      const { id } = context.params
      const tenantId = auth.tenantId || resolveTenantFromRequest(request)
      
      // Get request body for cancellation reason and refund preference
      const body = await request.json().catch(() => ({}))
      const { cancellation_reason, process_refund = true } = body

      // Fetch booking
      const { data: booking, error: fetchError } = await auth.supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }
        console.error('[v0] Cancel booking fetch error:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
      }

      // Verify user has access to cancel this booking
      const isAdmin = isAdminRole(auth.user.role)
      const isOwner = booking.customer_id === auth.user.id

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: 'Only the customer or an admin can cancel a booking' },
          { status: 403 }
        )
      }

    // Fetch associated payment transaction if payment was made
    let transaction = null
    if (booking.payment_status === 'paid') {
      const { data: transactions } = await auth.supabase
        .from('transactions')
        .select('id, stripe_payment_intent_id, amount, status, transaction_type')
        .eq('booking_id', id)
        .eq('transaction_type', 'payment')
        .eq('status', 'completed')
        .limit(1)
        .single()
      
      transaction = transactions
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a completed booking' }, { status: 400 })
    }

    // Process refund if payment was made and refund is requested
    let refundProcessed = false
    if (process_refund && booking.payment_status === 'paid' && transaction) {
      if (transaction.stripe_payment_intent_id && transaction.status === 'completed') {
        try {
          const { getStripe, isStripeConfigured } = await import('@/lib/stripe')
          
          if (isStripeConfigured()) {
            const stripe = getStripe()
            
            // Calculate hours until booking to determine refund policy
            const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
            const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
            
            // Full refund if cancelled more than 24 hours in advance, otherwise 50% refund
            const refundPercentage = hoursUntilBooking >= 24 ? 1.0 : 0.5
            const refundAmount = Math.round(Number(transaction.amount) * 100 * refundPercentage)
            
            if (refundAmount > 0) {
              const refund = await stripe.refunds.create({
                payment_intent: transaction.stripe_payment_intent_id,
                amount: refundAmount,
                reason: 'requested_by_customer',
                metadata: {
                  booking_id: id,
                  cancellation_reason: cancellation_reason || 'No reason provided',
                },
              })

              // Create refund transaction record
              await auth.supabase
                .from('transactions')
                .insert({
                  tenant_id: tenantId,
                  booking_id: id,
                  customer_id: booking.customer_id,
                  provider_id: booking.provider_id || null,
                  amount: refundAmount / 100,
                  platform_fee: 0,
                  provider_payout: 0,
                  transaction_type: 'refund',
                  payment_method: 'card',
                  stripe_payment_intent_id: transaction.stripe_payment_intent_id,
                  status: refund.status === 'succeeded' ? 'completed' : 'pending',
                })

              // Update original transaction status
              if (refund.status === 'succeeded') {
                await auth.supabase
                  .from('transactions')
                  .update({ status: refundPercentage >= 1.0 ? 'refunded' : 'partially_refunded' })
                  .eq('id', transaction.id)
              }

              refundProcessed = refund.status === 'succeeded'
            }
          }
        } catch (refundError: any) {
          console.error('[v0] Refund processing error:', refundError)
          // Continue with cancellation even if refund fails
        }
      }
    }

    // Update booking status to cancelled
    const updateData: any = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason
    }

    if (refundProcessed) {
      updateData.payment_status = refundProcessed && booking.payment_status === 'paid' ? 'refunded' : booking.payment_status
    }

    const { data: updatedBooking, error: updateError } = await auth.supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[v0] Cancel booking update error:', updateError)
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    // Send cancellation email
    sendBookingEmail(request, id, 'cancelled').catch((error) => {
      console.error('[v0] Failed to send booking cancellation email:', error)
    })

      return NextResponse.json({
        booking: updatedBooking,
        refundProcessed,
        message: refundProcessed 
          ? 'Booking cancelled and refund processed successfully' 
          : 'Booking cancelled successfully',
      })
    } catch (error) {
      console.error('[v0] Cancel booking error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
