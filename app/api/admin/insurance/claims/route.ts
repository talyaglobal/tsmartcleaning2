import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)
		const { searchParams } = new URL(request.url)
		const status = searchParams.get('status')
		const search = searchParams.get('search')

		let query = supabase
			.from('insurance_claims')
			.select(`
				*,
				insurance_policies(policy_number, user_id),
				insurance_claim_documents(id, file_url, file_name, document_type)
			`)
			.order('created_at', { ascending: false })

		// Filter by tenant if multi-tenant
		if (tenantId) {
			query = query.eq('tenant_id', tenantId)
		}

		// Filter by status if provided
		if (status && status !== 'all') {
			query = query.eq('status', status)
		}

		const { data, error } = await query

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// Get user information for claims
		const userIds = [...new Set((data || []).map((claim: any) => claim.user_id))]
		const { data: users } = await supabase
			.from('users')
			.select('id, email, full_name')
			.in('id', userIds)

		const userMap = new Map((users || []).map((u: any) => [u.id, u]))

		// Client-side search filtering
		let filteredData = data || []
		if (search) {
			const searchLower = search.toLowerCase()
			filteredData = filteredData.filter((claim: any) => {
				const user = userMap.get(claim.user_id)
				const policy = claim.insurance_policies as any
				return (
					claim.claim_code?.toLowerCase().includes(searchLower) ||
					claim.incident_type?.toLowerCase().includes(searchLower) ||
					claim.description?.toLowerCase().includes(searchLower) ||
					policy?.policy_number?.toLowerCase().includes(searchLower) ||
					user?.email?.toLowerCase().includes(searchLower) ||
					user?.full_name?.toLowerCase().includes(searchLower)
				)
			})
		}

		// Transform data for frontend
		const claims = filteredData.map((claim: any) => {
			const user = userMap.get(claim.user_id)
			const policy = claim.insurance_policies as any
			return {
				id: claim.id,
				claim_code: claim.claim_code,
				status: claim.status,
				incident_type: claim.incident_type,
				incident_date: claim.incident_date,
				incident_time: claim.incident_time,
				description: claim.description,
				amount_claimed: claim.amount_claimed,
				user_id: claim.user_id,
				user_name: user?.full_name || 'Unknown',
				user_email: user?.email || '',
				policy_id: claim.policy_id,
				policy_number: policy?.policy_number || '',
				created_at: claim.created_at,
				updated_at: claim.updated_at,
				documents: claim.insurance_claim_documents || [],
			}
		})

			return NextResponse.json({ claims })
		} catch (error: any) {
			console.error('[admin/insurance/claims] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

