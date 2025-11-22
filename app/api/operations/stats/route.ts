import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(async (request: NextRequest, { user, supabase, tenantId }) => {
	try {
		const today = new Date().toISOString().split('T')[0]
		const resolvedTenantId = tenantId || resolveTenantFromRequest(request)
		
		// Get all bookings for today
		const { data: todayBookings, error: bookingsError } = await supabase
			.from('bookings')
			.select('id, status, provider_id, total_amount, created_at, confirmed_at')
			.eq('booking_date', today)

		if (bookingsError) {
			console.error('[stats] Error fetching bookings:', bookingsError)
			return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
		}

		const totalJobs = todayBookings?.length || 0
		const completedJobs = todayBookings?.filter(b => b.status === 'completed').length || 0
		const activeJobs = todayBookings?.filter(b => ['confirmed', 'in-progress'].includes(b.status)).length || 0
		const unassignedJobs = todayBookings?.filter(b => !b.provider_id && b.status === 'pending').length || 0
		const revenueToday = todayBookings?.filter(b => b.status === 'completed').reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0

		// Get available providers count
		const { data: availableProviders, error: providersError } = await supabase
			.from('provider_profiles')
			.select('id')
			.eq('availability_status', 'available')

		const availableProvidersCount = availableProviders?.length || 0

		// Calculate average response time (from booking creation to assignment)
		const assignedBookings = todayBookings?.filter(b => b.provider_id && b.confirmed_at && b.created_at) || []
		let averageResponseTime = 0
		if (assignedBookings.length > 0) {
			const totalResponseTime = assignedBookings.reduce((sum, b) => {
				const createdAt = new Date(b.created_at).getTime()
				const confirmedAt = new Date(b.confirmed_at).getTime()
				return sum + (confirmedAt - createdAt)
			}, 0)
			averageResponseTime = Math.round((totalResponseTime / assignedBookings.length) / (1000 * 60)) // Convert to minutes
		}

		// Get customer satisfaction from reviews
		const { data: reviews, error: reviewsError } = await supabase
			.from('reviews')
			.select('rating')
			.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

		let customerSatisfaction = 0
		if (reviews && reviews.length > 0) {
			const totalRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)
			customerSatisfaction = totalRating / reviews.length
		}

		const stats = {
			totalJobs,
			completedJobs,
			activeJobs,
			availableProviders: availableProvidersCount,
			unassignedJobs,
			averageResponseTime,
			customerSatisfaction,
			revenueToday,
		}

		return NextResponse.json(stats)
	} catch (error: any) {
		console.error('[stats] Error:', error)
		return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 })
	}
}, { requireAdmin: true })