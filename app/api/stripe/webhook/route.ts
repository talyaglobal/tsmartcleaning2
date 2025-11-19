import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase'
import { sendBookingEmail } from '@/lib/emails/booking/send'
import type Stripe from 'stripe'
import { logAuditEvent } from '@/lib/audit'

export const runtime = 'nodejs'

/**
 * Helper function to log webhook events to webhook_events table
 */
async function logWebhookEvent(
	supabase: ReturnType<typeof createServerSupabase>,
	eventId: string,
	eventType: string,
	status: 'received' | 'processing' | 'processed' | 'failed' | 'ignored',
	payload: any,
	tenantId: string | null = null,
	httpStatus?: number,
	errorMessage?: string
) {
	try {
		await supabase.from('webhook_events').insert({
			provider: 'stripe',
			event_type: eventType,
			event_id: eventId,
			tenant_id: tenantId,
			status,
			http_status: httpStatus || null,
			error_message: errorMessage || null,
			payload,
			processed_at: status === 'processed' || status === 'failed' ? new Date().toISOString() : null,
		})
	} catch (error) {
		// Don't fail webhook if logging fails, but log the error
		console.error('[stripe-webhook] Failed to log webhook event:', error)
	}
}

export async function POST(request: NextRequest) {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
	if (!webhookSecret) {
		console.error('[stripe-webhook] Webhook secret not configured')
		return NextResponse.json(
			{ error: 'Webhook not configured' },
			{ status: 501 }
		)
	}

	const supabase = createServerSupabase()
	let rawBody: string
	let event: Stripe.Event
	let eventId: string = 'unknown'
	let tenantId: string | null = null

	try {
		const stripe = getStripe()
		rawBody = await request.text()
		const signature = request.headers.get('stripe-signature') || ''
		
		// Verify webhook signature - this will throw if invalid
		event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
		eventId = event.id

		// Extract tenant_id from event metadata
		const payload: any = (event as any).data?.object || {}
		const metadata = (payload?.metadata || {}) as Record<string, string>
		tenantId = metadata['tenant_id'] || metadata['tenantId'] || null

		// Log webhook received
		await logWebhookEvent(supabase, eventId, event.type, 'received', event, tenantId)

		// Update status to processing
		await logWebhookEvent(supabase, eventId, event.type, 'processing', event, tenantId)

		// Persist selected billing events for audit/analytics
		try {
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
					event_id: eventId,
					payload: event as any,
				})
			}
		} catch (persistErr) {
			console.error('[stripe-webhook] persist billing_events error', persistErr)
			// Don't fail webhook if billing_events insert fails
		}

		// Process event based on type
		let processingError: Error | null = null
		try {
			switch (event.type) {
				case 'payment_intent.succeeded': {
					const paymentIntent = event.data.object as Stripe.PaymentIntent
					const metadata = paymentIntent.metadata || {}
					const bookingId = metadata.booking_id

					if (bookingId) {
						// Check if transaction already exists (idempotency)
						const { data: existingTransaction } = await supabase
							.from('transactions')
							.select('id')
							.eq('stripe_payment_intent_id', paymentIntent.id)
							.single()

						if (!existingTransaction) {
							// Fetch booking to get customer and provider info
							const { data: booking, error: bookingError } = await supabase
								.from('bookings')
								.select('customer_id, provider_id, total_amount, service_id, tenant_id')
								.eq('id', bookingId)
								.single()

							if (bookingError || !booking) {
								throw new Error(`Booking not found: ${bookingId} - ${bookingError?.message || 'Unknown error'}`)
							}

							const amountInCents = paymentIntent.amount
							const platformFeeCents = parseInt(metadata.platform_fee || '0')
							const providerPayoutCents = parseInt(metadata.provider_payout || '0')

							// Create transaction record
							const { error: transactionError } = await supabase.from('transactions').insert({
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

							if (transactionError) {
								throw new Error(`Failed to create transaction: ${transactionError.message}`)
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
								throw new Error(`Failed to update booking: ${updateError.message}`)
							}

							// Send payment confirmation email (non-blocking)
							try {
								await sendBookingEmail(null, bookingId, 'paymentConfirmation')
							} catch (emailError) {
								console.error('[stripe-webhook] Error sending payment confirmation email:', emailError)
								// Don't fail webhook if email fails
							}
						} else {
							console.log(`[stripe-webhook] Transaction already exists for payment intent ${paymentIntent.id}, skipping`)
						}
					} else {
						console.log(`[stripe-webhook] No booking_id in metadata for payment_intent.succeeded event ${eventId}`)
					}
					break
				}
				case 'payment_intent.payment_failed': {
					const paymentIntent = event.data.object as Stripe.PaymentIntent
					const metadata = paymentIntent.metadata || {}
					const bookingId = metadata.booking_id

					if (bookingId) {
						// Update transaction status if exists
						const { error: transactionError } = await supabase
							.from('transactions')
							.update({ status: 'failed' })
							.eq('stripe_payment_intent_id', paymentIntent.id)

						if (transactionError) {
							console.warn(`[stripe-webhook] Failed to update transaction status: ${transactionError.message}`)
						}

						// Update booking payment status
						const { error: bookingError } = await supabase
							.from('bookings')
							.update({
								payment_status: 'failed',
								updated_at: new Date().toISOString(),
							})
							.eq('id', bookingId)

						if (bookingError) {
							throw new Error(`Failed to update booking payment status: ${bookingError.message}`)
						}
					}
					break
				}
				case 'charge.refunded': {
					const charge = event.data.object as Stripe.Charge
					const paymentIntentId = charge.payment_intent as string

					if (paymentIntentId) {
						// Find transaction by payment intent
						const { data: transaction, error: findError } = await supabase
							.from('transactions')
							.select('id, booking_id, customer_id, amount')
							.eq('stripe_payment_intent_id', paymentIntentId)
							.eq('transaction_type', 'payment')
							.single()

						if (findError && findError.code !== 'PGRST116') {
							throw new Error(`Failed to find transaction: ${findError.message}`)
						}

						if (transaction) {
							// Check if refund transaction already exists (idempotency)
							const { data: existingRefund } = await supabase
								.from('transactions')
								.select('id')
								.eq('stripe_payment_intent_id', paymentIntentId)
								.eq('transaction_type', 'refund')
								.single()

							if (!existingRefund) {
								// Create refund transaction record
								const { error: refundError } = await supabase.from('transactions').insert({
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

								if (refundError) {
									throw new Error(`Failed to create refund transaction: ${refundError.message}`)
								}

								// Update original transaction
								const { error: updateError } = await supabase
									.from('transactions')
									.update({ status: 'refunded' })
									.eq('id', transaction.id)

								if (updateError) {
									throw new Error(`Failed to update transaction status: ${updateError.message}`)
								}

								// Update booking
								const { error: bookingError } = await supabase
									.from('bookings')
									.update({
										payment_status: 'refunded',
										status: 'refunded',
										updated_at: new Date().toISOString(),
									})
									.eq('id', transaction.booking_id)

								if (bookingError) {
									throw new Error(`Failed to update booking: ${bookingError.message}`)
								}
							}
						}
					}
					break
				}
				case 'account.updated': {
					const account = event.data.object as Stripe.Account
					// Update provider_profiles by stripe_account_id
					const { data: updated, error: updErr } = await supabase
						.from('provider_profiles')
						.update({
							payouts_enabled: account.payouts_enabled ?? false,
							details_submitted: account.details_submitted ?? false,
						})
						.eq('stripe_account_id', account.id)
						.select('id, tenant_id')
					
					if (updErr) {
						throw new Error(`Failed to update provider profile: ${updErr.message}`)
					}

					if (updated && updated.length > 0) {
						const profileTenantId = (updated[0] as any)?.tenant_id ?? null
						await logAuditEvent(
							{ tenantId: profileTenantId },
							{
								action: 'stripe_account_updated',
								resource: 'provider_profile',
								resourceId: (updated[0] as any)?.id ?? null,
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
					// Currently no-op, but logged for future implementation
					console.log(`[stripe-webhook] Payout event received: ${event.type}`)
					break
				}
				default:
					// Unknown event type - log but don't fail
					console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
					await logWebhookEvent(supabase, eventId, event.type, 'ignored', event, tenantId, 200, `Unhandled event type: ${event.type}`)
					break
			}

			// Log successful processing
			await logWebhookEvent(supabase, eventId, event.type, 'processed', event, tenantId, 200)
			return new NextResponse(null, { status: 200 })
		} catch (processingErr: any) {
			processingError = processingErr
			throw processingErr
		}
	} catch (error: any) {
		// Determine if this is a signature verification error or processing error
		const isSignatureError = error.type === 'StripeSignatureVerificationError' || error.message?.includes('signature')
		const isProcessingError = processingError !== null

		let httpStatus = 400
		let errorMessage = 'Invalid payload'
		
		if (isSignatureError) {
			// Signature verification failed - return 401 to prevent retries
			httpStatus = 401
			errorMessage = 'Invalid signature'
			console.error('[stripe-webhook] Signature verification failed:', error.message)
		} else if (isProcessingError) {
			// Processing error - return 500 to trigger retry
			httpStatus = 500
			errorMessage = processingError.message || 'Processing failed'
			console.error('[stripe-webhook] Processing error:', processingError)
		} else {
			// Unknown error
			console.error('[stripe-webhook] Unexpected error:', error)
		}

		// Log failed webhook
		try {
			const supabase = createServerSupabase()
			await logWebhookEvent(
				supabase,
				eventId,
				event?.type || 'unknown',
				'failed',
				{ rawBody: rawBody?.substring(0, 1000) || 'N/A' }, // Limit payload size
				tenantId,
				httpStatus,
				errorMessage
			)
		} catch (logError) {
			console.error('[stripe-webhook] Failed to log error event:', logError)
		}

		// Return appropriate status code
		// 401 = don't retry (signature error)
		// 500 = retry (processing error)
		// 400 = don't retry (malformed request)
		return NextResponse.json(
			{ error: errorMessage },
			{ status: httpStatus }
		)
	}
}


