import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const PATCH = withAuth(
	async (
		request: NextRequest,
		{ supabase: authSupabase, tenantId: authTenantId },
		{ params }: { params: { id: string } }
	) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)
			const body = await request.json()
			const { status, effective_date, expiration_date, billing_cycle, auto_renew } = body

			const updates: any = {}
			if (status !== undefined) updates.status = status
			if (effective_date !== undefined) updates.effective_date = effective_date
			if (expiration_date !== undefined) updates.expiration_date = expiration_date
			if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle
			if (auto_renew !== undefined) updates.auto_renew = auto_renew
			updates.updated_at = new Date().toISOString()

			let query = supabase
				.from('insurance_policies')
				.update(updates)
				.eq('id', params.id)
				.select('*')
				.single()

			if (tenantId) {
				query = query.eq('tenant_id', tenantId)
			}

			const { data, error } = await query

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			return NextResponse.json({ policy: data })
	} catch (error: any) {
		console.error('[admin/insurance/policies/[id]] PATCH error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	},
	{
		requireAdmin: true,
	}
)

export const DELETE = withAuth(
	async (
		request: NextRequest,
		{ supabase: authSupabase, tenantId: authTenantId },
		{ params }: { params: { id: string } }
	) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)

			let query = supabase
				.from('insurance_policies')
				.delete()
				.eq('id', params.id)

			if (tenantId) {
				query = query.eq('tenant_id', tenantId)
			}

			const { error } = await query

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 })
			}

			return NextResponse.json({ success: true })
	} catch (error: any) {
		console.error('[admin/insurance/policies/[id]] DELETE error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	},
	{
		requireAdmin: true,
	}
)

