import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase()
		const { searchParams } = new URL(req.url)
		const status = searchParams.get('status')
		const tenantId = searchParams.get('tenant_id')

		let query = supabase
			.from('insurance_policies')
			.select(`
				*,
				insurance_plans(*),
				profiles!insurance_policies_user_id_fkey(id, full_name, email)
			`)
			.order('created_at', { ascending: false })

		if (status && status !== 'all') {
			query = query.eq('status', status)
		}

		if (tenantId) {
			query = query.eq('tenant_id', tenantId)
		}

		const { data, error } = await query

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// Transform data to include user info
		const policies = (data || []).map((policy: any) => ({
			id: policy.id,
			policy_number: policy.policy_number,
			user_id: policy.user_id,
			user_name: policy.profiles?.full_name || 'Unknown',
			user_email: policy.profiles?.email || '',
			plan_id: policy.plan_id,
			plan_name: policy.insurance_plans?.name || 'Unknown Plan',
			plan_code: policy.insurance_plans?.code || '',
			status: policy.status,
			effective_date: policy.effective_date,
			expiration_date: policy.expiration_date,
			billing_cycle: policy.billing_cycle,
			tenant_id: policy.tenant_id,
			created_at: policy.created_at,
		}))

		return NextResponse.json({ policies })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/policies] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

export const POST = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase()
		const body = await req.json()
		const { user_id, plan_id, effective_date, billing_cycle = 'annual' } = body

		if (!user_id || !plan_id) {
			return NextResponse.json({ error: 'user_id and plan_id are required' }, { status: 400 })
		}

		// Load plan
		const { data: plan, error: planErr } = await supabase
			.from('insurance_plans')
			.select('*')
			.eq('id', plan_id)
			.single()

		if (planErr || !plan) {
			return NextResponse.json({ error: 'Invalid plan_id' }, { status: 400 })
		}

		// Create policy
		const now = new Date()
		const startDate = effective_date ? new Date(effective_date) : now
		const expiry = new Date(startDate)
		expiry.setFullYear(startDate.getFullYear() + 1)
		const policyNumber = `CG-${now.getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

		const { data: policy, error: polErr } = await supabase
			.from('insurance_policies')
			.insert({
				user_id,
				plan_id,
				policy_number,
				status: 'active',
				effective_date: startDate.toISOString().slice(0, 10),
				expiration_date: expiry.toISOString().slice(0, 10),
				billing_cycle,
			})
			.select('*')
			.single()

		if (polErr) {
			return NextResponse.json({ error: polErr.message }, { status: 500 })
		}

		return NextResponse.json({ policy })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/policies] POST error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

