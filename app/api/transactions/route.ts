import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { computeRevenueShare } from '@/lib/revenue-share'
import { withAuth } from '@/lib/auth/rbac'
import { UserRole, isAdminRole } from '@/lib/auth/roles'
import Stripe from 'stripe'

// Get transactions
export const GET = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role') || 'customer'

      const tenantId = resolveTenantFromRequest(request)
      
      // Determine which column to filter by based on user role
      // Providers see their transactions, customers see their transactions
      const column = (user.role === UserRole.CLEANING_LADY || user.role === UserRole.AMBASSADOR || role === 'provider') 
        ? 'provider_id' 
        : 'customer_id'
      
      // Always use authenticated user's ID - never accept userId from query params
      const { data, error } = await supabase
        .from('transactions')
        .select('*, bookings(*)')
        .eq(column, user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] transactions GET supabase error:', error)
        return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })
      }

      return NextResponse.json({
        transactions: data ?? [],
      })
    } catch (error) {
      console.error('[v0] Get transactions error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

// Create a transaction (payment)
export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, paymentMethodId, paymentIntentId } = await request.json()

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and amount are required' },
        { status: 400 }
      )
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(*), provider_profiles(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('[transactions] Booking not found:', bookingError)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if booking is already paid
    if (booking.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Booking is already paid' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const amountInCents = Math.round(Number(amount) * 100)

    if (amountInCents < 50) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50' },
        { status: 400 }
      )
    }

    let paymentIntent: Stripe.PaymentIntent
    let finalPaymentIntentId: string

    // If paymentIntentId is provided, retrieve and confirm it
    if (paymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        // If payment method is provided, confirm the payment intent
        if (paymentMethodId && paymentIntent.status === 'requires_payment_method') {
          paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
          })
        }

        finalPaymentIntentId = paymentIntent.id
      } catch (error: any) {
        console.error('[transactions] Error retrieving/confirming payment intent:', error)
        return NextResponse.json(
          { error: `Payment intent error: ${error.message}` },
          { status: 400 }
        )
      }
    } else {
      // Create new payment intent
      if (!paymentMethodId) {
        return NextResponse.json(
          { error: 'Either paymentMethodId or paymentIntentId is required' },
          { status: 400 }
        )
      }

      try {
        // Compute revenue share
        const revenueShare = await computeRevenueShare({
          tenantId: tenantId || undefined,
          providerId: booking.provider_id || undefined,
          serviceId: booking.service_id || undefined,
          totalAmountCents: amountInCents,
          asOf: new Date().toISOString(),
        })

        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          return_url: `${request.headers.get('origin') || ''}/customer/bookings`,
          metadata: {
            booking_id: bookingId,
            customer_id: booking.customer_id,
            provider_id: booking.provider_id || '',
            tenant_id: tenantId || '',
            platform_fee: revenueShare.platformFeeCents.toString(),
            provider_payout: revenueShare.providerAmountCents.toString(),
          },
        })

        finalPaymentIntentId = paymentIntent.id
      } catch (error: any) {
        console.error('[transactions] Stripe payment intent creation error:', error)
        
        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
          return NextResponse.json(
            { error: `Card error: ${error.message}`, code: error.code },
            { status: 402 }
          )
        }

        return NextResponse.json(
          { error: `Payment processing failed: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Check payment intent status
    if (paymentIntent.status !== 'succeeded') {
      // Payment requires additional action (3D Secure, etc.)
      if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
        return NextResponse.json({
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }, { status: 200 })
      }

      // Payment failed
      if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
        return NextResponse.json(
          { error: 'Payment failed. Please try again with a different payment method.' },
          { status: 400 }
        )
      }

      // Payment is processing
      return NextResponse.json({
        processing: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      }, { status: 200 })
    }

    // Payment succeeded - create transaction record
    const revenueShare = await computeRevenueShare({
      tenantId: tenantId || undefined,
      providerId: booking.provider_id || undefined,
      serviceId: booking.service_id || undefined,
      totalAmountCents: amountInCents,
      asOf: new Date().toISOString(),
    })

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        customer_id: booking.customer_id,
        provider_id: booking.provider_id || null,
        amount: Number(amount),
        platform_fee: revenueShare.platformFeeCents / 100,
        provider_payout: revenueShare.providerAmountCents / 100,
        transaction_type: 'payment',
        payment_method: 'card',
        stripe_payment_intent_id: finalPaymentIntentId,
        status: 'completed',
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[transactions] Error creating transaction record:', transactionError)
      // Payment succeeded but transaction record failed - attempt refund
      try {
        await stripe.refunds.create({
          payment_intent: finalPaymentIntentId,
          reason: 'requested_by_customer',
        })
      } catch (refundError) {
        console.error('[transactions] Error creating refund:', refundError)
      }

      return NextResponse.json(
        { error: 'Payment processed but failed to record transaction. Refund initiated.' },
        { status: 500 }
      )
    }

    // Update booking payment status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('[transactions] Error updating booking payment status:', updateError)
      // Transaction recorded but booking update failed - log but don't fail
    }

    return NextResponse.json({
      transaction,
      paymentIntentId: finalPaymentIntentId,
      message: 'Payment processed successfully',
    })
  } catch (error: any) {
    console.error('[v0] Create transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
