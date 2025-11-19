import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get schedule for a date range
export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)
		const { searchParams } = new URL(request.url)
		const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]
		const endDate = searchParams.get('endDate') || startDate
		const providerId = searchParams.get('providerId')
		const teamId = searchParams.get('teamId')

		let query = supabase
			.from('bookings')
			.select(`
				id,
				booking_date,
				booking_time,
				duration_hours,
				status,
				customer:customer_id (id, full_name, phone),
				provider:provider_id (id, business_name),
				service:service_id (name),
				address:address_id (street_address, city, state, zip_code)
			`)
			.gte('booking_date', startDate)
			.lte('booking_date', endDate)
			.order('booking_date', { ascending: true })
			.order('booking_time', { ascending: true })

		if (providerId) {
			query = query.eq('provider_id', providerId)
		}

		if (teamId) {
			// Get team members
			const { data: teamMembers } = await supabase
				.from('team_members')
				.select('user_id')
				.eq('team_id', teamId)

			if (teamMembers && teamMembers.length > 0) {
				const userIds = teamMembers.map((m: any) => m.user_id)
				// Get provider profiles for team members
				const { data: providers } = await supabase
					.from('provider_profiles')
					.select('id')
					.in('user_id', userIds)

				if (providers && providers.length > 0) {
					const providerIds = providers.map((p: any) => p.id)
					query = query.in('provider_id', providerIds)
				} else {
					// No providers in team, return empty
					return NextResponse.json({ schedule: [] })
				}
			} else {
				// No team members, return empty
				return NextResponse.json({ schedule: [] })
			}
		}

		const { data, error } = await query

		if (error) {
			console.error('[schedule] Error:', error)
			return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
		}

		return NextResponse.json({ schedule: data || [] })
	} catch (e: any) {
		console.error('[schedule] Error:', e)
		return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
	}
}

