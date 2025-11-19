import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get cleaner's timesheet entries
export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createAnonSupabase(tenantId)
		const { searchParams } = new URL(request.url)
		const startDate = searchParams.get('startDate')
		const endDate = searchParams.get('endDate')

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

		// Get jobs as timesheet entries (using bookings table)
		// For now, we'll use completed jobs as timesheet entries
		// In a full implementation, you'd have a separate timesheet table
		let query = serverSupabase
			.from('bookings')
			.select(`
				id,
				booking_date,
				booking_time,
				duration_hours,
				started_at,
				completed_at,
				status,
				service:service_id (
					name
				),
				customer:customer_id (
					full_name
				)
			`)
			.eq('provider_id', providerId)
			.in('status', ['in-progress', 'completed'])
			.order('booking_date', { ascending: false })
			.order('booking_time', { ascending: false })

		if (startDate) {
			query = query.gte('booking_date', startDate)
		}
		if (endDate) {
			query = query.lte('booking_date', endDate)
		}

		const { data: entries, error } = await query

		if (error) {
			console.error('[cleaner timesheet] Error:', error)
			return NextResponse.json({ error: 'Failed to fetch timesheet' }, { status: 500 })
		}

		// Calculate total hours
		const totalHours = (entries || []).reduce((sum, entry) => {
			return sum + (Number(entry.duration_hours) || 0)
		}, 0)

		// Group by date
		const byDate: Record<string, any[]> = {}
		for (const entry of entries || []) {
			const date = entry.booking_date
			if (!byDate[date]) {
				byDate[date] = []
			}
			byDate[date].push(entry)
		}

		return NextResponse.json({
			entries: entries || [],
			totalHours: Math.round(totalHours * 10) / 10,
			byDate,
			totalEntries: entries?.length || 0
		})
	} catch (error) {
		console.error('[cleaner timesheet] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// Clock in/out (update job status)
export async function POST(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createAnonSupabase(tenantId)
		const body = await request.json()
		const { jobId, action } = body // action: 'clock_in' or 'clock_out'

		// Get current user from session
		const { data: { session } } = await supabase.auth.getSession()
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id
		const serverSupabase = createServerSupabase(tenantId)

		// Get provider profile
		const { data: providerProfile, error: providerError } = await serverSupabase
			.from('provider_profiles')
			.select('id')
			.eq('user_id', userId)
			.single()

		if (providerError || !providerProfile) {
			return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 })
		}

		const providerId = providerProfile.id

		// Verify the job belongs to this provider
		const { data: job, error: jobError } = await serverSupabase
			.from('bookings')
			.select('id, status, provider_id')
			.eq('id', jobId)
			.eq('provider_id', providerId)
			.single()

		if (jobError || !job) {
			return NextResponse.json({ error: 'Job not found' }, { status: 404 })
		}

		// Update job status
		const updateData: any = {}
		if (action === 'clock_in') {
			updateData.status = 'in-progress'
			updateData.started_at = new Date().toISOString()
		} else if (action === 'clock_out') {
			updateData.status = 'completed'
			updateData.completed_at = new Date().toISOString()
		}

		const { error: updateError } = await serverSupabase
			.from('bookings')
			.update(updateData)
			.eq('id', jobId)

		if (updateError) {
			console.error('[cleaner timesheet] Update error:', updateError)
			return NextResponse.json({ error: 'Failed to update timesheet' }, { status: 500 })
		}

		return NextResponse.json({ success: true, action })
	} catch (error) {
		console.error('[cleaner timesheet] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

