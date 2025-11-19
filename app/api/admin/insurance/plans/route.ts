import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)
		
		const { data, error } = await supabase
			.from('insurance_plans')
			.select('*')
			.order('monthly_price', { ascending: true })

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

			return NextResponse.json({ plans: data || [] })
		} catch (error: any) {
			console.error('[admin/insurance/plans] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

