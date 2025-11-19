import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { createInsuranceEmailClient } from '@/lib/emails/insurance'

async function sendEmailViaApi(request: NextRequest, payload: { to: string; subject: string; html: string }) {
	const tenantId = resolveTenantFromRequest(request) || ''
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
	try {
		await fetch(`${baseUrl}/api/send-email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-tenant-id': tenantId,
			},
			body: JSON.stringify(payload),
		})
	} catch (error) {
		console.error('[claims/[claimId]] Email send failed:', error)
		// Non-fatal: continue even if email fails
	}
}

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

export async function PATCH(
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

		const body = await request.json()
		const { status, amount_paid, notes } = body

		// Validate status if provided
		const validStatuses = ['filed', 'under_review', 'adjuster_assigned', 'approved', 'denied', 'paid', 'withdrawn']
		if (status && !validStatuses.includes(status)) {
			return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
		}

		// Get current claim details
		const { data: currentClaim, error: claimError } = await supabase
			.from('insurance_claims')
			.select('id, user_id, claim_code, status, amount_paid')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		if (claimError || !currentClaim) {
			return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
		}

		const actualClaimId = currentClaim.id
		const oldStatus = currentClaim.status

		// Prepare update object
		const updateData: any = {
			updated_at: new Date().toISOString(),
		}

		if (status) {
			updateData.status = status
		}

		if (amount_paid !== undefined) {
			updateData.amount_paid = amount_paid ? Number(amount_paid) : null
		}

		// Update claim
		const { data: updatedClaim, error: updateError } = await supabase
			.from('insurance_claims')
			.update(updateData)
			.eq('id', actualClaimId)
			.select('*')
			.single()

		if (updateError) {
			console.error('[insurance/claims/[claimId]] Update error:', updateError)
			return NextResponse.json({ error: updateError.message }, { status: 500 })
		}

		// Send email notification if status changed
		if (status && status !== oldStatus) {
			try {
				// Get user email
				const { data: userData } = await supabase
					.from('users')
					.select('email, name, full_name')
					.eq('id', currentClaim.user_id)
					.single()

				if (userData?.email) {
					const client = createInsuranceEmailClient(async ({ to, subject, html }) => {
						await sendEmailViaApi(request, { to, subject, html })
					})

					const userName = userData.name || userData.full_name || 'Member'

					// Send appropriate email based on status
					if (status === 'approved') {
						await client.sendClaimApproved({
							to: userData.email,
							userName,
							claimId: currentClaim.claim_code,
							tenantId: tenantId || undefined,
						})
					} else if (status === 'denied') {
						await client.sendClaimDenied({
							to: userData.email,
							userName,
							claimId: currentClaim.claim_code,
							tenantId: tenantId || undefined,
						})
					} else if (status === 'paid') {
						await client.sendPaymentProcessed({
							to: userData.email,
							userName,
							claimId: currentClaim.claim_code,
							tenantId: tenantId || undefined,
						})
					} else {
						// Generic status update for other statuses
						await client.sendClaimStatusUpdate({
							to: userData.email,
							userName,
							claimId: currentClaim.claim_code,
							tenantId: tenantId || undefined,
						})
					}
				}
			} catch (emailError) {
				console.error('[insurance/claims/[claimId]] Email notification failed:', emailError)
				// Non-fatal: continue
			}
		}

		return NextResponse.json({ claim: updatedClaim })
	} catch (error: any) {
		console.error('[insurance/claims/[claimId]] PATCH error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

