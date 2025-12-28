import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'
import { RevenueShareRuleInput, validateRuleInput } from '../route'

/**
 * GET /api/root-admin/revenue-share-rules/[id]
 * Get a specific revenue share rule by ID
 */
export const GET = withRootAdmin(async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) => {
	const supabase = createServerSupabase(null)
	const { id } = await params

	const { data, error } = await supabase
		.from('revenue_share_rules')
		.select('*')
		.eq('id', id)
		.single()

	if (error) {
		if (error.code === 'PGRST116') {
			return NextResponse.json(
				{ error: 'Revenue share rule not found' },
				{ status: 404 }
			)
		}
		console.error('[revenue-share-rules] GET error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch revenue share rule', details: error.message },
			{ status: 500 }
		)
	}

	return NextResponse.json({ rule: data })
})

/**
 * PATCH /api/root-admin/revenue-share-rules/[id]
 * Update a revenue share rule
 */
export const PATCH = withRootAdmin(async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) => {
	const supabase = createServerSupabase(null)
	const { id } = await params
	const body = await req.json().catch(() => ({})) as Partial<RevenueShareRuleInput>

	// Validate input
	const validationError = validateRuleInput(body)
	if (validationError) {
		return NextResponse.json(
			{ error: validationError },
			{ status: 400 }
		)
	}

	// Prepare update data (only include provided fields)
	const updateData: any = {}
	if (body.tenant_id !== undefined) updateData.tenant_id = body.tenant_id || null
	if (body.provider_id !== undefined) updateData.provider_id = body.provider_id || null
	if (body.service_id !== undefined) updateData.service_id = body.service_id || null
	if (body.territory_id !== undefined) updateData.territory_id = body.territory_id || null
	if (body.platform_percent !== undefined) updateData.platform_percent = body.platform_percent
	if (body.processing_fee_fixed_cents !== undefined) updateData.processing_fee_fixed_cents = body.processing_fee_fixed_cents
	if (body.minimum_payout_cents !== undefined) updateData.minimum_payout_cents = body.minimum_payout_cents
	if (body.priority !== undefined) updateData.priority = body.priority
	if (body.active !== undefined) updateData.active = body.active
	if (body.valid_from !== undefined) updateData.valid_from = body.valid_from
	if (body.valid_to !== undefined) updateData.valid_to = body.valid_to || null
	if (body.name !== undefined) updateData.name = body.name || null

	if (Object.keys(updateData).length === 0) {
		return NextResponse.json(
			{ error: 'No fields to update' },
			{ status: 400 }
		)
	}

	const { data, error } = await supabase
		.from('revenue_share_rules')
		.update(updateData)
		.eq('id', id)
		.select()
		.single()

	if (error) {
		if (error.code === 'PGRST116') {
			return NextResponse.json(
				{ error: 'Revenue share rule not found' },
				{ status: 404 }
			)
		}
		console.error('[revenue-share-rules] PATCH error:', error)
		return NextResponse.json(
			{ error: 'Failed to update revenue share rule', details: error.message },
			{ status: 500 }
		)
	}

	return NextResponse.json({ rule: data })
})

/**
 * DELETE /api/root-admin/revenue-share-rules/[id]
 * Delete a revenue share rule
 */
export const DELETE = withRootAdmin(async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) => {
	const supabase = createServerSupabase(null)
	const { id } = await params

	const { error } = await supabase
		.from('revenue_share_rules')
		.delete()
		.eq('id', id)

	if (error) {
		console.error('[revenue-share-rules] DELETE error:', error)
		return NextResponse.json(
			{ error: 'Failed to delete revenue share rule', details: error.message },
			{ status: 500 }
		)
	}

	return NextResponse.json({ success: true })
})

