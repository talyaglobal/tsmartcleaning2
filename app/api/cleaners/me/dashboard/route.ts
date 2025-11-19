import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get cleaner dashboard metrics
export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createAnonSupabase(tenantId)

		// Get current user from session
		const { data: { session } } = await supabase.auth.getSession()
		
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id

		// Use server supabase for database queries
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
		const startOfWeek = new Date(now)
		startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
		startOfWeek.setHours(0, 0, 0, 0)
		
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const endOfWeek = new Date(startOfWeek)
		endOfWeek.setDate(startOfWeek.getDate() + 7)

		// This week's jobs count
		const { count: thisWeekJobs } = await serverSupabase
			.from('bookings')
			.select('*', { count: 'exact', head: true })
			.eq('provider_id', providerId)
			.gte('booking_date', startOfWeek.toISOString().split('T')[0])
			.lte('booking_date', endOfWeek.toISOString().split('T')[0])
			.in('status', ['confirmed', 'in-progress', 'completed'])

		// Hours worked this week (from completed jobs)
		const { data: weekJobs } = await serverSupabase
			.from('bookings')
			.select('duration_hours, completed_at')
			.eq('provider_id', providerId)
			.eq('status', 'completed')
			.gte('completed_at', startOfWeek.toISOString())
			.lte('completed_at', now.toISOString())

		const hoursWorked = (weekJobs || []).reduce((sum, job) => {
			return sum + (Number(job.duration_hours) || 0)
		}, 0)

		// Monthly earnings (completed jobs this month)
		const { data: monthJobs } = await serverSupabase
			.from('bookings')
			.select('total_amount')
			.eq('provider_id', providerId)
			.eq('status', 'completed')
			.gte('completed_at', startOfMonth.toISOString())
			.lte('completed_at', now.toISOString())

		const monthlyEarnings = (monthJobs || []).reduce((sum, job) => {
			return sum + (Number(job.total_amount) || 0)
		}, 0)

		// Average rating
		const { data: reviews } = await serverSupabase
			.from('reviews')
			.select('rating')
			.eq('provider_id', providerId)

		const averageRating = reviews && reviews.length > 0
			? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
			: 0

		return NextResponse.json({
			thisWeekJobs: thisWeekJobs || 0,
			hoursWorked: Math.round(hoursWorked * 10) / 10, // Round to 1 decimal
			monthlyEarnings: Math.round(monthlyEarnings * 100) / 100, // Round to 2 decimals
			averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
			totalReviews: reviews?.length || 0
		})
	} catch (error) {
		console.error('[cleaner dashboard] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

