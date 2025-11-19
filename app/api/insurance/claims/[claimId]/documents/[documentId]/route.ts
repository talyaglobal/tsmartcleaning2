import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PATCH endpoint for updating document review status
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { claimId: string; documentId: string } }
) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const { claimId, documentId } = params

		if (!claimId || !documentId) {
			return NextResponse.json({ error: 'claimId and documentId are required' }, { status: 400 })
		}

		const body = await request.json()
		const { review_status, review_notes } = body

		// Validate review_status if provided
		const validStatuses = ['pending', 'approved', 'rejected', 'needs_revision']
		if (review_status && !validStatuses.includes(review_status)) {
			return NextResponse.json(
				{ error: `Invalid review_status. Must be one of: ${validStatuses.join(', ')}` },
				{ status: 400 }
			)
		}

		// Verify claim exists and get the actual claim UUID
		const { data: claim, error: claimError } = await supabase
			.from('insurance_claims')
			.select('id')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		if (claimError || !claim) {
			return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
		}

		const actualClaimId = claim.id

		// Verify document exists and belongs to this claim
		const { data: doc, error: docError } = await supabase
			.from('insurance_claim_documents')
			.select('id, claim_id')
			.eq('id', documentId)
			.eq('claim_id', actualClaimId)
			.single()

		if (docError || !doc) {
			return NextResponse.json({ error: 'Document not found' }, { status: 404 })
		}

		// Prepare update object
		const updateData: any = {}

		if (review_status) {
			updateData.review_status = review_status
			updateData.reviewed_at = new Date().toISOString()
		}

		if (review_notes !== undefined) {
			updateData.review_notes = review_notes
		}

		// TODO: Get current user ID for reviewed_by field
		// For now, we'll leave it null or you can add authentication here

		// Update document
		const { data: updatedDoc, error: updateError } = await supabase
			.from('insurance_claim_documents')
			.update(updateData)
			.eq('id', documentId)
			.eq('claim_id', actualClaimId)
			.select('*')
			.single()

		if (updateError) {
			console.error('[claims/documents/[documentId]] Update error:', updateError)
			return NextResponse.json({ error: updateError.message }, { status: 500 })
		}

		return NextResponse.json({ document: updatedDoc })
	} catch (error: any) {
		console.error('[insurance/claims/[claimId]/documents/[documentId]] PATCH error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

