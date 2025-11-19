import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get cleaner's earnings breakdown
export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createAnonSupabase(tenantId)
		const { searchParams } = new URL(request.url)
		const period = searchParams.get('period') || 'month' // 'week', 'month', 'year', 'all'

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
		let startDate: Date

		switch (period) {
			case 'week':
				startDate = new Date(now)
				startDate.setDate(now.getDate() - 7)
				break
			case 'month':
				startDate = new Date(now.getFullYear(), now.getMonth(), 1)
				break
			case 'year':
				startDate = new Date(now.getFullYear(), 0, 1)
				break
			default:
				startDate = new Date(0) // All time
		}

		// Get completed jobs with earnings
		let query = serverSupabase
			.from('bookings')
			.select(`
				id,
				booking_date,
				booking_time,
				total_amount,
				duration_hours,
				completed_at,
				service:service_id (
					name
				),
				customer:customer_id (
					full_name
				)
			`)
			.eq('provider_id', providerId)
			.eq('status', 'completed')
			.order('completed_at', { ascending: false })

		if (period !== 'all') {
			query = query.gte('completed_at', startDate.toISOString())
		}

		const { data: jobs, error } = await query

		if (error) {
			console.error('[cleaner earnings] Error:', error)
			return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
		}

		// Calculate totals
		const totalEarnings = (jobs || []).reduce((sum, job) => {
			return sum + (Number(job.total_amount) || 0)
		}, 0)

		const totalHours = (jobs || []).reduce((sum, job) => {
			return sum + (Number(job.duration_hours) || 0)
		}, 0)

		const averagePerJob = jobs && jobs.length > 0
			? totalEarnings / jobs.length
			: 0

		const hourlyRate = totalHours > 0
			? totalEarnings / totalHours
			: 0

		// Group by month for chart data
		const byMonth: Record<string, number> = {}
		for (const job of jobs || []) {
			if (job.completed_at) {
				const d = new Date(job.completed_at)
				const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
				byMonth[key] = (byMonth[key] || 0) + (Number(job.total_amount) || 0)
			}
		}

		const monthlyBreakdown = Object.entries(byMonth)
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([month, amount]) => ({ month, amount }))

		return NextResponse.json({
			period,
			totalEarnings: Math.round(totalEarnings * 100) / 100,
			totalHours: Math.round(totalHours * 10) / 10,
			totalJobs: jobs?.length || 0,
			averagePerJob: Math.round(averagePerJob * 100) / 100,
			hourlyRate: Math.round(hourlyRate * 100) / 100,
			monthlyBreakdown,
			jobs: jobs || []
		})
	} catch (error) {
		console.error('[cleaner earnings] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

