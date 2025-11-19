import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase()
		const { data, error } = await supabase
			.from('insurance_plans')
			.select('*')
			.order('monthly_price', { ascending: true })

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ plans: data || [] })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/plans] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

export const POST = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase()
		const body = await req.json()
		const { name, code, description, monthly_price, annual_price, coverage_limit, status = 'active' } = body

		if (!name || !code || monthly_price === undefined || annual_price === undefined) {
			return NextResponse.json(
				{ error: 'name, code, monthly_price, and annual_price are required' },
				{ status: 400 }
			)
		}

		const { data, error } = await supabase
			.from('insurance_plans')
			.insert({
				name,
				code,
				description: description || null,
				monthly_price,
				annual_price,
				coverage_limit: coverage_limit || null,
				status,
			})
			.select('*')
			.single()

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ plan: data })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/plans] POST error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

