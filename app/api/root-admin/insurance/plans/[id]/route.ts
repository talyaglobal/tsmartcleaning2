import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const PATCH = withRootAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase()
		const body = await req.json()
		const { name, code, description, monthly_price, annual_price, coverage_limit, status } = body

		const updates: any = {}
		if (name !== undefined) updates.name = name
		if (code !== undefined) updates.code = code
		if (description !== undefined) updates.description = description
		if (monthly_price !== undefined) updates.monthly_price = monthly_price
		if (annual_price !== undefined) updates.annual_price = annual_price
		if (coverage_limit !== undefined) updates.coverage_limit = coverage_limit
		if (status !== undefined) updates.status = status

		const { data, error } = await supabase
			.from('insurance_plans')
			.update(updates)
			.eq('id', params.id)
			.select('*')
			.single()

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ plan: data })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/plans/[id]] PATCH error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

export const DELETE = withRootAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase()

		// Check if plan is in use
		const { data: policies, error: checkError } = await supabase
			.from('insurance_policies')
			.select('id')
			.eq('plan_id', params.id)
			.limit(1)

		if (checkError) {
			return NextResponse.json({ error: checkError.message }, { status: 500 })
		}

		if (policies && policies.length > 0) {
			return NextResponse.json(
				{ error: 'Cannot delete plan that is in use by existing policies' },
				{ status: 400 }
			)
		}

		const { error } = await supabase.from('insurance_plans').delete().eq('id', params.id)

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/plans/[id]] DELETE error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

