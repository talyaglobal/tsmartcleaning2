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


