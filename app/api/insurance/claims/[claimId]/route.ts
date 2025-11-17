import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(
	request: NextRequest,
	{ params }: { params: { claimId: string } }
) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const claimId = params.claimId

		if (!claimId) {
			return NextResponse.json({ error: 'claimId is required' }, { status: 400 })
		}

		// Try to find by claim_code first (if it looks like a code), then by id
		let query = supabase
			.from('insurance_claims')
			.select('*, insurance_policies(policy_number, status, effective_date, expiration_date, insurance_plans(name, code)), insurance_claim_documents(*)')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		const { data: claim, error } = await query

		if (error) {
			if (error.code === 'PGRST116') {
				return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
			}
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// Get activity log / status history if available
		// For now, we'll construct a basic timeline from the claim status
		const statusTimeline = [
			{ status: 'filed', label: 'Filed', done: true, timestamp: claim.created_at },
			{ status: 'under_review', label: 'Under Review', done: claim.status === 'under_review' || ['adjuster_assigned', 'approved', 'denied', 'paid'].includes(claim.status), timestamp: claim.updated_at },
			{ status: 'adjuster_assigned', label: 'Adjuster Assigned', done: ['adjuster_assigned', 'approved', 'denied', 'paid'].includes(claim.status), timestamp: null },
			{ status: 'approved', label: 'Approved', done: ['approved', 'paid'].includes(claim.status), timestamp: claim.status === 'approved' ? claim.updated_at : null },
			{ status: 'paid', label: 'Paid', done: claim.status === 'paid', timestamp: claim.status === 'paid' ? claim.updated_at : null },
		]

		// Filter out denied status if claim is denied
		if (claim.status === 'denied') {
			statusTimeline.push({ status: 'denied', label: 'Denied', done: true, timestamp: claim.updated_at })
		}

		return NextResponse.json({
			claim: {
				...claim,
				timeline: statusTimeline,
			},
		})
	} catch (error: any) {
		console.error('[insurance/claims/[claimId]] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

