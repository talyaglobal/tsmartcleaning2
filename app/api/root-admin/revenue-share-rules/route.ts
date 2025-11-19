import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export interface RevenueShareRuleInput {
	tenant_id?: string | null
	provider_id?: string | null
	service_id?: string | null
	territory_id?: string | null
	platform_percent: number
	processing_fee_fixed_cents: number
	minimum_payout_cents: number
	priority?: number
	active?: boolean
	valid_from?: string
	valid_to?: string | null
	name?: string | null
}

/**
 * Validate revenue share rule input
 */
export function validateRuleInput(input: Partial<RevenueShareRuleInput>): string | null {
	if (input.platform_percent !== undefined) {
		if (typeof input.platform_percent !== 'number' || input.platform_percent < 0 || input.platform_percent > 100) {
			return 'platform_percent must be a number between 0 and 100'
		}
	}

	if (input.processing_fee_fixed_cents !== undefined) {
		if (typeof input.processing_fee_fixed_cents !== 'number' || input.processing_fee_fixed_cents < 0) {
			return 'processing_fee_fixed_cents must be a non-negative number'
		}
	}

	if (input.minimum_payout_cents !== undefined) {
		if (typeof input.minimum_payout_cents !== 'number' || input.minimum_payout_cents < 0) {
			return 'minimum_payout_cents must be a non-negative number'
		}
	}

	if (input.priority !== undefined) {
		if (typeof input.priority !== 'number') {
			return 'priority must be a number'
		}
	}

	return null
}

/**
 * GET /api/root-admin/revenue-share-rules
 * List all revenue share rules with optional filtering
 */
export const GET = withRootAdmin(async (req: NextRequest) => {
	const supabase = createServerSupabase(null)
	const { searchParams } = new URL(req.url)
	
	const tenantId = searchParams.get('tenant_id')
	const providerId = searchParams.get('provider_id')
	const serviceId = searchParams.get('service_id')
	const territoryId = searchParams.get('territory_id')
	const active = searchParams.get('active')
	
	let query = supabase
		.from('revenue_share_rules')
		.select('*')
		.order('priority', { ascending: false })
		.order('created_at', { ascending: false })

	if (tenantId) {
		query = query.eq('tenant_id', tenantId)
	}
	if (providerId) {
		query = query.eq('provider_id', providerId)
	}
	if (serviceId) {
		query = query.eq('service_id', serviceId)
	}
	if (territoryId) {
		query = query.eq('territory_id', territoryId)
	}
	if (active !== null) {
		query = query.eq('active', active === 'true')
	}

	const { data, error } = await query

	if (error) {
		console.error('[revenue-share-rules] GET error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch revenue share rules', details: error.message },
			{ status: 500 }
		)
	}

	return NextResponse.json({ rules: data || [] })
})

/**
 * POST /api/root-admin/revenue-share-rules
 * Create a new revenue share rule
 */
export const POST = withRootAdmin(async (req: NextRequest) => {
	const supabase = createServerSupabase(null)
	const body = await req.json().catch(() => ({})) as RevenueShareRuleInput

	// Validate required fields
	if (body.platform_percent === undefined) {
		return NextResponse.json(
			{ error: 'platform_percent is required' },
			{ status: 400 }
		)
	}
	if (body.processing_fee_fixed_cents === undefined) {
		return NextResponse.json(
			{ error: 'processing_fee_fixed_cents is required' },
			{ status: 400 }
		)
	}
	if (body.minimum_payout_cents === undefined) {
		return NextResponse.json(
			{ error: 'minimum_payout_cents is required' },
			{ status: 400 }
		)
	}

	// Validate input
	const validationError = validateRuleInput(body)
	if (validationError) {
		return NextResponse.json(
			{ error: validationError },
			{ status: 400 }
		)
	}

	// Prepare insert data
	const insertData: any = {
		tenant_id: body.tenant_id || null,
		provider_id: body.provider_id || null,
		service_id: body.service_id || null,
		territory_id: body.territory_id || null,
		platform_percent: body.platform_percent,
		processing_fee_fixed_cents: body.processing_fee_fixed_cents,
		minimum_payout_cents: body.minimum_payout_cents,
		priority: body.priority ?? 0,
		active: body.active ?? true,
		valid_from: body.valid_from || new Date().toISOString(),
		valid_to: body.valid_to || null,
		name: body.name || null,
	}

	const { data, error } = await supabase
		.from('revenue_share_rules')
		.insert(insertData)
		.select()
		.single()

	if (error) {
		console.error('[revenue-share-rules] POST error:', error)
		return NextResponse.json(
			{ error: 'Failed to create revenue share rule', details: error.message },
			{ status: 500 }
		)
	}

	return NextResponse.json({ rule: data }, { status: 201 })
})

