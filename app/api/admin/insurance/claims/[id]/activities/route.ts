import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (
		request: NextRequest,
		{ supabase: authSupabase, tenantId: authTenantId },
		{ params }: { params: { id: string } }
	) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)

			const { data: activities, error } = await supabase
				.from('insurance_claim_activities')
				.select('*')
				.eq('claim_id', params.id)
				.order('created_at', { ascending: false })

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			return NextResponse.json({ activities: activities || [] })
		} catch (error: any) {
			console.error('[admin/insurance/claims/[id]/activities] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

export const POST = withAuth(
	async (
		request: NextRequest,
		{ supabase: authSupabase, tenantId: authTenantId },
		{ params }: { params: { id: string } }
	) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)
			const body = await request.json()
			const { actor, message } = body

			if (!actor || !message) {
				return NextResponse.json({ error: 'actor and message are required' }, { status: 400 })
			}

			// Verify claim exists
			let claimQuery = supabase
				.from('insurance_claims')
				.select('id')
				.eq('id', params.id)
				.single()

			if (tenantId) {
				claimQuery = claimQuery.eq('tenant_id', tenantId)
			}

			const { error: claimError } = await claimQuery
			if (claimError) {
				return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
			}

			const { data: activity, error } = await supabase
				.from('insurance_claim_activities')
				.insert({
					claim_id: params.id,
					actor,
					message,
				})
				.select('*')
				.single()

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			return NextResponse.json({ activity })
		} catch (error: any) {
			console.error('[admin/insurance/claims/[id]/activities] POST error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

