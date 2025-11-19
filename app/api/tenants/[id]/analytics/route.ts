import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(
	async (
		request: NextRequest,
		context?: { params: { id: string } }
	) => {
		try {
			if (!context?.params?.id) {
				return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
			}

			const { id: tenantId } = context.params
			const supabase = createServerSupabase(null)

			// Verify tenant exists
			const { data: tenant, error: tenantError } = await supabase
				.from('tenants')
				.select('id, name, status')
				.eq('id', tenantId)
				.single()

			if (tenantError || !tenant) {
				return NextResponse.json(
					{ error: 'Tenant not found' },
					{ status: 404 }
				)
			}

			const now = new Date()
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
			const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

			// ============================================
			// User Metrics
			// ============================================
			const { count: totalUsers } = await supabase
				.from('users')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)

			// New users this month
			const { count: newUsersThisMonth } = await supabase
				.from('users')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('created_at', startOfMonth.toISOString())

			// New users last month
			const { count: newUsersLastMonth } = await supabase
				.from('users')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('created_at', lastMonthStart.toISOString())
				.lte('created_at', lastMonthEnd.toISOString())

			const userGrowth =
				newUsersLastMonth && newUsersLastMonth > 0
					? Math.round(((newUsersThisMonth || 0) - newUsersLastMonth) / newUsersLastMonth * 100)
					: 0

			// ============================================
			// Provider Metrics
			// ============================================
			const { count: totalProviders } = await supabase
				.from('provider_profiles')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)

			// Active providers (verified)
			const { count: activeProviders } = await supabase
				.from('provider_profiles')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.eq('verification_status', 'verified')

			// Pending verifications
			const { count: pendingVerifications } = await supabase
				.from('provider_profiles')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.eq('verification_status', 'pending')

			// ============================================
			// Booking Metrics
			// ============================================
			const { count: totalBookings } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)

			// This month bookings
			const { count: thisMonthBookings } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('booking_date', startOfMonth.toISOString().slice(0, 10))
				.lte('booking_date', now.toISOString().slice(0, 10))

			// Last month bookings
			const { count: lastMonthBookings } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('booking_date', lastMonthStart.toISOString().slice(0, 10))
				.lte('booking_date', lastMonthEnd.toISOString().slice(0, 10))

			// Completed bookings this month
			const { count: completedThisMonth } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('booking_date', startOfMonth.toISOString().slice(0, 10))
				.lte('booking_date', now.toISOString().slice(0, 10))
				.eq('status', 'completed')

			const bookingGrowth =
				lastMonthBookings && lastMonthBookings > 0
					? Math.round(((thisMonthBookings || 0) - lastMonthBookings) / lastMonthBookings * 100)
					: 0

			// Active bookings today
			const todayStr = now.toISOString().slice(0, 10)
			const { count: activeBookingsToday } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.eq('booking_date', todayStr)
				.in('status', ['pending', 'confirmed', 'in-progress'])

			// ============================================
			// Revenue Metrics
			// ============================================
			// All-time revenue from transactions
			const { data: allTransactions } = await supabase
				.from('transactions')
				.select('amount, transaction_type')
				.eq('tenant_id', tenantId)
				.eq('status', 'completed')
				.in('transaction_type', ['payment', 'charge'])

			const totalRevenue = (allTransactions ?? []).reduce(
				(sum, t: any) => sum + Number(t.amount || 0),
				0
			)

			// This month revenue
			const { data: thisMonthTransactions } = await supabase
				.from('transactions')
				.select('amount, transaction_type, created_at')
				.eq('tenant_id', tenantId)
				.gte('created_at', startOfMonth.toISOString())
				.eq('status', 'completed')
				.in('transaction_type', ['payment', 'charge'])

			const monthlyRevenue = (thisMonthTransactions ?? []).reduce(
				(sum, t: any) => sum + Number(t.amount || 0),
				0
			)

			// Last month revenue
			const { data: lastMonthTransactions } = await supabase
				.from('transactions')
				.select('amount, transaction_type, created_at')
				.eq('tenant_id', tenantId)
				.gte('created_at', lastMonthStart.toISOString())
				.lte('created_at', lastMonthEnd.toISOString())
				.eq('status', 'completed')
				.in('transaction_type', ['payment', 'charge'])

			const lastMonthRevenue = (lastMonthTransactions ?? []).reduce(
				(sum, t: any) => sum + Number(t.amount || 0),
				0
			)

			const revenueGrowth =
				lastMonthRevenue && lastMonthRevenue > 0
					? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
					: 0

			// ============================================
			// Review Metrics
			// ============================================
			const { data: reviews } = await supabase
				.from('reviews')
				.select('rating, created_at')
				.eq('tenant_id', tenantId)

			const totalReviews = (reviews ?? []).length
			const averageRating =
				totalReviews > 0
					? (reviews ?? []).reduce((sum, r: any) => sum + (r.rating || 0), 0) / totalReviews
					: 0

			// Reviews this month
			const reviewsThisMonth = (reviews ?? []).filter(
				(r: any) => new Date(r.created_at) >= startOfMonth
			).length

			// ============================================
			// Usage Metrics (from usage_events if available)
			// ============================================
			let monthBookings = 0
			let monthMessages = 0

			// Check if usage_events table exists and has tenant_id
			const { data: usageEvents, error: usageError } = await supabase
				.from('usage_events')
				.select('resource, quantity, occurred_at')
				.eq('tenant_id', tenantId)
				.gte('occurred_at', startOfMonth.toISOString())

			// Only process if query succeeded and data exists
			if (!usageError && usageEvents) {
				for (const event of usageEvents as any[]) {
					const q = Number(event.quantity || 0)
					if (event.resource === 'booking') monthBookings += q
					if (event.resource === 'message') monthMessages += q
				}
			}

			// ============================================
			// Activity Chart (last 30 days)
			// ============================================
			const start30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
			const { data: last30Bookings } = await supabase
				.from('bookings')
				.select('id, booking_date, status')
				.eq('tenant_id', tenantId)
				.gte('booking_date', start30.toISOString().slice(0, 10))
				.lte('booking_date', now.toISOString().slice(0, 10))

			const byDay: Record<string, { total: number; completed: number }> = {}
			for (let i = 0; i < 30; i++) {
				const d = new Date(start30.getTime() + i * 24 * 60 * 60 * 1000)
				const key = d.toISOString().slice(0, 10)
				byDay[key] = { total: 0, completed: 0 }
			}

			for (const booking of last30Bookings ?? []) {
				const key = booking.booking_date
				if (byDay[key]) {
					byDay[key].total++
					if (booking.status === 'completed') {
						byDay[key].completed++
					}
				}
			}

			const activityChart = Object.entries(byDay).map(([date, data]) => ({
				date,
				total: data.total,
				completed: data.completed,
			}))

			// ============================================
			// Revenue Chart (last 12 months)
			// ============================================
			const twelveMonthsBack = new Date(now.getFullYear(), now.getMonth() - 11, 1)
			const { data: revenueRows } = await supabase
				.from('transactions')
				.select('amount, created_at')
				.eq('tenant_id', tenantId)
				.gte('created_at', twelveMonthsBack.toISOString())
				.eq('status', 'completed')
				.in('transaction_type', ['payment', 'charge'])

			const revenueByMonth: Record<string, number> = {}
			for (const row of revenueRows ?? []) {
				const d = new Date(row.created_at)
				const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
				revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(row.amount || 0)
			}

			const revenueChart = Object.entries(revenueByMonth)
				.sort(([a], [b]) => (a < b ? -1 : 1))
				.map(([month, revenue]) => ({ month, revenue }))

			// ============================================
			// Performance Metrics
			// ============================================
			// Completion rate (last 30 days)
			const { count: total30 } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('booking_date', start30.toISOString().slice(0, 10))

			const { count: completed30 } = await supabase
				.from('bookings')
				.select('*', { count: 'exact', head: true })
				.eq('tenant_id', tenantId)
				.gte('booking_date', start30.toISOString().slice(0, 10))
				.eq('status', 'completed')

			const completionRate =
				total30 && total30 > 0
					? Math.round(((completed30 || 0) / total30) * 100)
					: 0

			// Average bookings per day (last 30 days)
			const avgBookingsPerDay =
				activityChart.reduce((sum, d) => sum + d.total, 0) / 30

			// ============================================
			// Top Services (if available)
			// ============================================
			const { data: serviceBookings } = await supabase
				.from('bookings')
				.select('service_id')
				.eq('tenant_id', tenantId)
				.gte('booking_date', start30.toISOString().slice(0, 10))
				.not('service_id', 'is', null)

			const serviceCounts: Record<string, number> = {}
			for (const booking of serviceBookings ?? []) {
				const serviceId = booking.service_id
				if (serviceId) {
					serviceCounts[serviceId] = (serviceCounts[serviceId] || 0) + 1
				}
			}

			const topServices = Object.entries(serviceCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([serviceId, count]) => ({ serviceId, count }))

			// ============================================
			// Compile Analytics Response
			// ============================================
			const analytics = {
				tenant: {
					id: tenant.id,
					name: tenant.name,
					status: tenant.status,
				},
				users: {
					total: totalUsers || 0,
					newThisMonth: newUsersThisMonth || 0,
					growth: userGrowth,
				},
				providers: {
					total: totalProviders || 0,
					active: activeProviders || 0,
					pendingVerifications: pendingVerifications || 0,
				},
				bookings: {
					total: totalBookings || 0,
					thisMonth: thisMonthBookings || 0,
					completedThisMonth: completedThisMonth || 0,
					activeToday: activeBookingsToday || 0,
					growth: bookingGrowth,
				},
				revenue: {
					total: totalRevenue,
					thisMonth: monthlyRevenue,
					growth: revenueGrowth,
				},
				reviews: {
					total: totalReviews,
					averageRating: Math.round(averageRating * 10) / 10,
					thisMonth: reviewsThisMonth,
				},
				usage: {
					bookingsThisMonth: monthBookings || thisMonthBookings || 0,
					messagesThisMonth: monthMessages || 0,
				},
				performance: {
					completionRate,
					avgBookingsPerDay: Math.round(avgBookingsPerDay * 100) / 100,
				},
				charts: {
					activity: activityChart,
					revenue: revenueChart,
				},
				topServices,
			}

			return NextResponse.json(analytics)
		} catch (error) {
			console.error('[Tenant Analytics] GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

