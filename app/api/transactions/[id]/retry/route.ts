import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import Stripe from 'stripe'

/**
 * Retry a failed payment
 * POST /api/transactions/[id]/retry
 * Body: { paymentMethodId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transactionId = id
    const { paymentMethodId } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'paymentMethodId is required' },
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

    // Fetch failed transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*, bookings(*)')
      .eq('id', transactionId)
      .eq('status', 'failed')
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Failed transaction not found' },
        { status: 404 }
      )
    }

    const stripe = getStripe()
    const amountInCents = Math.round(Number(transaction.amount) * 100)

    // Create new payment intent for retry
    let paymentIntent: Stripe.PaymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${request.headers.get('origin') || ''}/customer/bookings`,
        metadata: {
          booking_id: transaction.booking_id,
          customer_id: transaction.customer_id,
          provider_id: transaction.provider_id || '',
          tenant_id: tenantId || '',
          original_transaction_id: transactionId,
          retry: 'true',
        },
      })
    } catch (error: any) {
      console.error('[retry] Stripe payment intent creation error:', error)
      
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

    // Check payment intent status
    if (paymentIntent.status !== 'succeeded') {
      if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
        return NextResponse.json({
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }, { status: 200 })
      }

      if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
        return NextResponse.json(
          { error: 'Payment failed. Please try again with a different payment method.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        processing: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      }, { status: 200 })
    }

    // Payment succeeded - update transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) {
      console.error('[retry] Error updating transaction:', updateError)
      return NextResponse.json(
        { error: 'Payment succeeded but failed to update transaction record' },
        { status: 500 }
      )
    }

    // Update booking payment status
    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.booking_id)

    return NextResponse.json({
      transaction: updatedTransaction,
      paymentIntentId: paymentIntent.id,
      message: 'Payment retry successful',
    })
  } catch (error: any) {
    console.error('[retry] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

