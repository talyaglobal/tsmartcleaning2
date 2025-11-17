import { createServerSupabase } from '@/lib/supabase'
import { getStripe, isStripeConfigured } from '@/lib/stripe'

export type MeteredResource = 'booking' | 'message'

type RecordUsageInput = {
	tenantId: string
	resource: MeteredResource
	quantity?: number
	metadata?: Record<string, unknown>
}

/**
 * Records a usage event in Supabase and optionally reports to Stripe metered billing
 * if configured via environment variables.
 *
 * Stripe configuration (optional):
 * - STRIPE_METER_BOOKING_ITEM: subscription item id for bookings
 * - STRIPE_METER_MESSAGE_ITEM: subscription item id for messages
 */
export async function recordUsageEvent(input: RecordUsageInput): Promise<void> {
	const { tenantId, resource, quantity = 1, metadata } = input

	const supabase = createServerSupabase(tenantId)
	const { error } = await supabase.from('usage_events').insert({
		tenant_id: tenantId,
		resource,
		quantity,
		metadata: metadata ?? {},
	})
	if (error) {
		// Log but don't throw; metering must not break the main flow
		console.error('[usage] insert error', error)
	}

	// Best-effort Stripe usage reporting
	try {
		await maybeReportStripeUsage(resource, quantity, { tenantId, metadata })
	} catch (err) {
		console.error('[usage] stripe usage error', err)
	}
}

async function maybeReportStripeUsage(
	resource: MeteredResource,
	quantity: number,
	context: { tenantId: string; metadata?: Record<string, unknown> }
) {
	if (!isStripeConfigured()) return
	const itemEnv =
		resource === 'booking'
			? process.env.STRIPE_METER_BOOKING_ITEM
			: process.env.STRIPE_METER_MESSAGE_ITEM
	if (!itemEnv) return

	const stripe = getStripe()
	await stripe.subscriptionItems.createUsageRecord(itemEnv, {
		quantity,
		timestamp: Math.floor(Date.now() / 1000),
		action: 'increment',
	})
}


