import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const { data, error } = await supabase.from('insurance_plans').select('*').order('monthly_price', { ascending: true })
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}
		return NextResponse.json({ plans: data || [] })
	} catch (error: any) {
		console.error('[insurance/plans] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


