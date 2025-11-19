import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const PATCH = withRootAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase()
		const body = await req.json()
		const { status, effective_date, expiration_date, billing_cycle } = body

		const updates: any = {}
		if (status !== undefined) updates.status = status
		if (effective_date !== undefined) updates.effective_date = effective_date
		if (expiration_date !== undefined) updates.expiration_date = expiration_date
		if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle

		const { data, error } = await supabase
			.from('insurance_policies')
			.update(updates)
			.eq('id', params.id)
			.select('*')
			.single()

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ policy: data })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/policies/[id]] PATCH error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

export const DELETE = withRootAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase()

		const { error } = await supabase.from('insurance_policies').delete().eq('id', params.id)

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/policies/[id]] DELETE error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

