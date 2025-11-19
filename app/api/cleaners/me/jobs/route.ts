import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get cleaner's jobs (schedule and history)
export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createAnonSupabase(tenantId)
		const { searchParams } = new URL(request.url)
		const status = searchParams.get('status') // 'upcoming', 'completed', 'all'
		const limit = parseInt(searchParams.get('limit') || '50')

		// Get current user from session
		const { data: { session } } = await supabase.auth.getSession()
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id
		const serverSupabase = createServerSupabase(tenantId)

		// Get provider profile for this user
		const { data: providerProfile, error: providerError } = await serverSupabase
			.from('provider_profiles')
			.select('id')
			.eq('user_id', userId)
			.single()

		if (providerError || !providerProfile) {
			return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 })
		}

		const providerId = providerProfile.id
		const now = new Date()
		const today = now.toISOString().split('T')[0]

		let query = serverSupabase
			.from('bookings')
			.select(`
				id,
				booking_date,
				booking_time,
				status,
				duration_hours,
				total_amount,
				special_instructions,
				completed_at,
				started_at,
				customer:customer_id (
					id,
					full_name,
					email,
					phone
				),
				service:service_id (
					id,
					name,
					base_price
				),
				address:address_id (
					id,
					street_address,
					city,
					state,
					zip_code
				)
			`)
			.eq('provider_id', providerId)
			.order('booking_date', { ascending: true })
			.order('booking_time', { ascending: true })
			.limit(limit)

		// Filter by status
		if (status === 'upcoming') {
			query = query
				.in('status', ['confirmed', 'in-progress'])
				.gte('booking_date', today)
		} else if (status === 'completed') {
			query = query.eq('status', 'completed')
		} else if (status === 'past') {
			query = query
				.lt('booking_date', today)
				.in('status', ['completed', 'cancelled'])
		}

		const { data: jobs, error } = await query

		if (error) {
			console.error('[cleaner jobs] Error:', error)
			return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
		}

		return NextResponse.json({ jobs: jobs || [] })
	} catch (error) {
		console.error('[cleaner jobs] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

