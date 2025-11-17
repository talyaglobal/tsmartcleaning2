import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		if (!isStripeConfigured()) {
			// Return a sane default so UI can render without Stripe setup
			return NextResponse.json({
				hasAccount: false,
				isVerified: false,
				canReceivePayouts: false,
				requiresAction: false,
				payoutsEnabled: false,
				detailsSubmitted: false,
				requirements: ['Connect Stripe to enable payouts'],
			})
		}

		const tenantId = resolveTenantFromRequest(_request)
		const supabase = createServerSupabase(tenantId || undefined)
		const { data: provider, error } = await supabase
			.from('provider_profiles')
			.select('stripe_account_id, payouts_enabled, details_submitted')
			.eq('id', params.id)
			.single()
		if (error || !provider) {
			return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
		}

		const accountId = provider.stripe_account_id as string | null
		if (!accountId) {
			return NextResponse.json({
				hasAccount: false,
				isVerified: false,
				canReceivePayouts: false,
				requiresAction: false,
				payoutsEnabled: false,
				detailsSubmitted: false,
				requirements: ['Connect Stripe to enable payouts'],
			})
		}

		const stripe = getStripe()
		const account = await stripe.accounts.retrieve(accountId)
		return NextResponse.json({
			hasAccount: true,
			isVerified: Boolean(account.details_submitted && account.charges_enabled),
			canReceivePayouts: Boolean(account.payouts_enabled),
			requiresAction: Boolean((account.requirements?.currently_due?.length || 0) > 0),
			payoutsEnabled: Boolean(account.payouts_enabled),
			detailsSubmitted: Boolean(account.details_submitted),
			requirements: account.requirements?.currently_due || [],
		})
	} catch (error) {
		console.error('[stripe-status] error', error)
		return NextResponse.json(
			{ error: 'Failed to get status' },
			{ status: 500 }
		)
	}
}


