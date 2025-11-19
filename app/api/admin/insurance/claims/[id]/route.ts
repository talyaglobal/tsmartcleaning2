import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (
		request: NextRequest,
		auth: { supabase: any, tenantId: string | null },
		context?: { params: { id: string } }
	) => {
		try {
			if (!context?.params?.id) {
				return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 })
			}

			const { id } = context.params
			const tenantId = auth.tenantId || resolveTenantFromRequest(request)
			const supabase = auth.supabase || createServerSupabase(tenantId || undefined)

			let query = supabase
				.from('insurance_claims')
				.select(`
					*,
					insurance_policies(policy_number, status, effective_date, expiration_date, insurance_plans(name, code)),
					insurance_claim_documents(*),
					insurance_claim_activities(*)
				`)
				.eq('id', id)
				.single()

			if (tenantId) {
				query = query.eq('tenant_id', tenantId)
			}

			const { data, error } = await query

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			return NextResponse.json({ claim: data })
		} catch (error: any) {
			console.error('[admin/insurance/claims/[id]] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{ requireAdmin: true }
)

export const PATCH = withAuth(
	async (
		request: NextRequest,
		auth: { supabase: any, tenantId: string | null },
		context?: { params: { id: string } }
	) => {
		try {
			if (!context?.params?.id) {
				return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 })
			}

			const { id } = context.params
			const tenantId = auth.tenantId || resolveTenantFromRequest(request)
			const supabase = auth.supabase || createServerSupabase(tenantId || undefined)
			const body = await request.json()
			const { status, adjuster_name, internal_notes, amount_paid, denial_reason, activity_message, actor } = body

			// Get current claim
			let claimQuery = supabase
				.from('insurance_claims')
				.select('*')
				.eq('id', id)
				.single()

			if (tenantId) {
				claimQuery = claimQuery.eq('tenant_id', tenantId)
			}

			const { data: currentClaim, error: claimError } = await claimQuery

			if (claimError || !currentClaim) {
				return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
			}

			// Build update object
			const updateData: any = {
				updated_at: new Date().toISOString(),
			}

			if (status !== undefined) updateData.status = status
			if (adjuster_name !== undefined) updateData.adjuster_name = adjuster_name
			if (internal_notes !== undefined) updateData.internal_notes = internal_notes
			if (amount_paid !== undefined) updateData.amount_paid = amount_paid ? Number(amount_paid) : null
			if (denial_reason !== undefined) updateData.denial_reason = denial_reason

			// Update claim
			let updateQuery = supabase
				.from('insurance_claims')
				.update(updateData)
				.eq('id', id)
				.select('*')
				.single()

			if (tenantId) {
				updateQuery = updateQuery.eq('tenant_id', tenantId)
			}

			const { data: updatedClaim, error: updateError } = await updateQuery

			if (updateError) {
				return NextResponse.json({ error: updateError.message }, { status: 500 })
			}

			// Add activity log entry if message provided
			if (activity_message && actor) {
				await supabase.from('insurance_claim_activities').insert({
					claim_id: id,
					actor,
					message: activity_message,
				})
			}

			return NextResponse.json({ claim: updatedClaim })
		} catch (error: any) {
			console.error('[admin/insurance/claims/[id]] PATCH error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{ requireAdmin: true }
)

