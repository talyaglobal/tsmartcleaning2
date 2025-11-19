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
			.from('insurance_policies')
			.select(`
				*,
				insurance_plans(id, name, code, monthly_price, annual_price),
				users:user_id(id, email, full_name)
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

		// Client-side search filtering (can be moved to DB query if needed)
		let filteredData = data || []
		if (search) {
			const searchLower = search.toLowerCase()
			filteredData = filteredData.filter((policy: any) => {
				const user = policy.users as any
				return (
					policy.policy_number?.toLowerCase().includes(searchLower) ||
					user?.email?.toLowerCase().includes(searchLower) ||
					user?.full_name?.toLowerCase().includes(searchLower) ||
					(policy.insurance_plans as any)?.name?.toLowerCase().includes(searchLower)
				)
			})
		}

		// Transform data for frontend
		const policies = filteredData.map((policy: any) => ({
			id: policy.id,
			policy_number: policy.policy_number,
			user_id: policy.user_id,
			user_name: (policy.users as any)?.full_name || 'Unknown',
			user_email: (policy.users as any)?.email || '',
			plan_id: policy.plan_id,
			plan_name: (policy.insurance_plans as any)?.name || 'Unknown',
			plan_code: (policy.insurance_plans as any)?.code || '',
			status: policy.status,
			effective_date: policy.effective_date,
			expiration_date: policy.expiration_date,
			billing_cycle: policy.billing_cycle,
			auto_renew: policy.auto_renew,
			created_at: policy.created_at,
			updated_at: policy.updated_at,
		}))

			return NextResponse.json({ policies })
		} catch (error: any) {
			console.error('[admin/insurance/policies] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

export const POST = withAuth(
	async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)
		const body = await request.json()
		const { user_id, plan_id, effective_date, expiration_date, billing_cycle, status, auto_renew } = body

		if (!user_id || !plan_id) {
			return NextResponse.json({ error: 'user_id and plan_id are required' }, { status: 400 })
		}

		// Generate policy number
		const now = new Date()
		const policyNumber = `CG-${now.getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

		const { data: policy, error: polErr } = await supabase
			.from('insurance_policies')
			.insert({
				user_id,
				tenant_id: tenantId || null,
				plan_id,
				policy_number: policyNumber,
				status: status || 'pending_activation',
				effective_date: effective_date || now.toISOString().split('T')[0],
				expiration_date: expiration_date || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0],
				billing_cycle: billing_cycle || 'annual',
				auto_renew: auto_renew !== undefined ? auto_renew : true,
			})
			.select('*')
			.single()

		if (polErr) {
			return NextResponse.json({ error: polErr.message }, { status: 500 })
		}

			return NextResponse.json({ policy })
		} catch (error: any) {
			console.error('[admin/insurance/policies] POST error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

