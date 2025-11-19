import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase'
import type Stripe from 'stripe'
import { logAuditEvent } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
	if (!webhookSecret) {
		return NextResponse.json(
			{ error: 'Webhook not configured' },
			{ status: 501 }
		)
	}

	try {
		const stripe = getStripe()
		const rawBody = await request.text()
		const signature = request.headers.get('stripe-signature') || ''
		const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

		// Persist selected billing events for audit/analytics
		try {
			const supabase = createServerSupabase()
			const payload: any = (event as any).data?.object || {}
			const metadata = (payload?.metadata || {}) as Record<string, string>
			const tenantId = metadata['tenant_id'] || metadata['tenantId'] || null
			const captureTypes = new Set<string>([
				'invoice.created',
				'invoice.finalized',
				'invoice.payment_succeeded',
				'invoice.payment_failed',
				'customer.subscription.created',
				'customer.subscription.updated',
				'customer.subscription.deleted',
				'charge.succeeded',
				'charge.failed',
				'charge.refunded',
				'payment_intent.succeeded',
				'payment_intent.payment_failed',
				'payment_intent.requires_action',
			])
			if (captureTypes.has(event.type)) {
				await supabase.from('billing_events').insert({
					tenant_id: tenantId,
					provider: 'stripe',
					event_type: event.type,
					event_id: (event as any).id,
					payload: event as any,
				})
			}
		} catch (persistErr) {
			console.error('[stripe-webhook] persist billing_events error', persistErr)
		}

		switch (event.type) {
			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent
				const metadata = paymentIntent.metadata || {}
				const bookingId = metadata.booking_id

				if (bookingId) {
					const supabase = createServerSupabase()
					
					// Check if transaction already exists
					const { data: existingTransaction } = await supabase
						.from('transactions')
						.select('id')
						.eq('stripe_payment_intent_id', paymentIntent.id)
						.single()

					if (!existingTransaction) {
						// Fetch booking to get customer and provider info
						const { data: booking } = await supabase
							.from('bookings')
							.select('customer_id, provider_id, total_amount, service_id, tenant_id')
							.eq('id', bookingId)
							.single()

						if (booking) {
							const amountInCents = paymentIntent.amount
							const platformFeeCents = parseInt(metadata.platform_fee || '0')
							const providerPayoutCents = parseInt(metadata.provider_payout || '0')

							// Create transaction record
							await supabase.from('transactions').insert({
								booking_id: bookingId,
								customer_id: booking.customer_id,
								provider_id: booking.provider_id || null,
								amount: amountInCents / 100,
								platform_fee: platformFeeCents / 100,
								provider_payout: providerPayoutCents / 100,
								transaction_type: 'payment',
								payment_method: 'card',
								stripe_payment_intent_id: paymentIntent.id,
								status: 'completed',
							})

							// Update booking payment status
							await supabase
								.from('bookings')
								.update({
									payment_status: 'paid',
									updated_at: new Date().toISOString(),
								})
								.eq('id', bookingId)
						}
					}
				}
				break
			}
			case 'payment_intent.payment_failed': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent
				const metadata = paymentIntent.metadata || {}
				const bookingId = metadata.booking_id

				if (bookingId) {
					const supabase = createServerSupabase()
					
					// Update transaction status if exists
					await supabase
						.from('transactions')
						.update({ status: 'failed' })
						.eq('stripe_payment_intent_id', paymentIntent.id)

					// Update booking payment status
					await supabase
						.from('bookings')
						.update({
							payment_status: 'failed',
							updated_at: new Date().toISOString(),
						})
						.eq('id', bookingId)
				}
				break
			}
			case 'charge.refunded': {
				const charge = event.data.object as Stripe.Charge
				const paymentIntentId = charge.payment_intent as string

				if (paymentIntentId) {
					const supabase = createServerSupabase()
					
					// Find transaction by payment intent
					const { data: transaction } = await supabase
						.from('transactions')
						.select('id, booking_id, customer_id, amount')
						.eq('stripe_payment_intent_id', paymentIntentId)
						.eq('transaction_type', 'payment')
						.single()

					if (transaction) {
						// Create refund transaction record
						await supabase.from('transactions').insert({
							booking_id: transaction.booking_id,
							customer_id: transaction.customer_id,
							amount: transaction.amount,
							platform_fee: 0,
							provider_payout: 0,
							transaction_type: 'refund',
							payment_method: 'card',
							stripe_payment_intent_id: paymentIntentId,
							status: 'completed',
						})

						// Update original transaction
						await supabase
							.from('transactions')
							.update({ status: 'refunded' })
							.eq('id', transaction.id)

						// Update booking
						await supabase
							.from('bookings')
							.update({
								payment_status: 'refunded',
								status: 'refunded',
								updated_at: new Date().toISOString(),
							})
							.eq('id', transaction.booking_id)
					}
				}
				break
			}
			case 'account.updated': {
				const account = event.data.object as Stripe.Account
				const supabase = createServerSupabase()
				// Update provider_profiles by stripe_account_id
				const { data: updated, error: updErr } = await supabase
					.from('provider_profiles')
					.update({
						payouts_enabled: account.payouts_enabled ?? false,
						details_submitted: account.details_submitted ?? false,
					})
					.eq('stripe_account_id', account.id)
					.select('id, tenant_id')
				if (!updErr) {
					const tenantId = (updated?.[0] as any)?.tenant_id ?? null
					await logAuditEvent(
						{ tenantId },
						{
							action: 'stripe_account_updated',
							resource: 'provider_profile',
							resourceId: (updated?.[0] as any)?.id ?? null,
							metadata: {
								stripe_account_id: account.id,
								payouts_enabled: account.payouts_enabled ?? null,
								details_submitted: account.details_submitted ?? null,
							},
						}
					)
				}
				break
			}
			case 'payout.paid':
			case 'payout.failed':
			case 'payout.canceled': {
				// Handle payout lifecycle events if needed
				break
			}
			default:
				// no-op
				break
		}

		return new NextResponse(null, { status: 200 })
	} catch (error) {
		console.error('[stripe-webhook] error', error)
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
	}
}


