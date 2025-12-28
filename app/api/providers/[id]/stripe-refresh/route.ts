import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
    const { id } = await params

		if (!isStripeConfigured()) {
			return NextResponse.json(
				{ error: 'Stripe not configured' },
				{ status: 501 }
			)
		}

		// Look up provider's stored account id
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const { data: provider, error: providerError } = await supabase
			.from('provider_profiles')
			.select('stripe_account_id')
			.eq('id', id)
			.single()
		if (providerError || !provider) {
			return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
		}
		const accountId = provider.stripe_account_id as string | null
		if (!accountId) {
			return NextResponse.json({ error: 'No Stripe account on file' }, { status: 400 })
		}

		const stripe = getStripe()
		const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: `${origin}/provider/profile`,
			return_url: `${origin}/provider/profile`,
			type: 'account_onboarding',
		})

		return NextResponse.json({ url: accountLink.url })
	} catch (error) {
		console.error('[stripe-refresh] error', error)
		return NextResponse.json(
			{ error: 'Failed to refresh onboarding' },
			{ status: 500 }
		)
	}
}


