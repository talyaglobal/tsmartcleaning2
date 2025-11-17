import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		if (!isStripeConfigured()) {
			return NextResponse.json(
				{ error: 'Stripe not configured' },
				{ status: 501 }
			)
		}

		const stripe = getStripe()
		const tenantId = resolveTenantFromRequest(_request)
		const supabase = createServerSupabase(tenantId || undefined)

		// 1) Load provider profile to check existing Connect account
		const { data: provider, error: providerError } = await supabase
			.from('provider_profiles')
			.select('id, stripe_account_id')
			.eq('id', params.id)
			.single()
		if (providerError || !provider) {
			return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
		}

		// 2) Reuse existing account or create a new one
		let accountId = provider.stripe_account_id as string | null
		if (!accountId) {
			const account = await stripe.accounts.create({
				type: 'express',
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
			})
			accountId = account.id
			const { error: updateError } = await supabase
				.from('provider_profiles')
				.update({ stripe_account_id: accountId })
				.eq('id', params.id)
			if (updateError) {
				return NextResponse.json(
					{ error: 'Failed to save Stripe account' },
					{ status: 500 }
				)
			}
		}

		// 3) Create onboarding link
		const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: `${origin}/provider/profile`,
			return_url: `${origin}/provider/profile`,
			type: 'account_onboarding',
		})

		return NextResponse.json({ url: accountLink.url, accountId })
	} catch (error) {
		console.error('[stripe-onboard] error', error)
		return NextResponse.json(
			{ error: 'Failed to start onboarding' },
			{ status: 500 }
		)
	}
}


