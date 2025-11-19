import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { requireTenantId } from '@/lib/tenant'

/**
 * Create a Stripe Payment Intent
 * POST /api/payments/create-intent
 * Body: { amount: number (in cents), currency: string, metadata?: Record<string, any> }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      )
    }

    const tenantId = requireTenantId(request)
    const body = await request.json().catch(() => ({}))
    const { amount, currency = 'usd', metadata = {} } = body

    if (!amount || typeof amount !== 'number' || amount < 50) {
      return NextResponse.json(
        { error: 'Invalid amount (minimum $0.50)' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      metadata: {
        ...metadata,
        tenant_id: tenantId || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    })
  } catch (error: any) {
    console.error('[payments/create-intent] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

