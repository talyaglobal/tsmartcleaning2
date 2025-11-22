import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (
		request: NextRequest,
		auth: { user: any, supabase: any, tenantId: string | null },
		context?: { params: { id: string } }
	) => {
		try {
			if (!context?.params?.id) {
				return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
			}

			const { id } = context.params
			const url = new URL(request.url)
			const period = url.searchParams.get('period') || '30' // days
			const granularity = url.searchParams.get('granularity') || 'daily'

			// Verify user is a member of this company or is an admin
			const hasAccess = await verifyCompanyMembership(
				id,
				auth.user.id,
				auth.supabase,
				auth.user.role
			)

			if (!hasAccess) {
				return NextResponse.json(
					{ error: 'You do not have access to this company' },
					{ status: 403 }
				)
			}

			const now = new Date()
			const periodDays = parseInt(period)
			const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

			// Overall usage metrics
			const usageMetrics = await calculateUsageMetrics(auth.supabase, id, startDate, now)
			
			// Time-series data based on granularity
			const timeSeriesData = await calculateTimeSeriesUsage(
				auth.supabase, 
				id, 
				startDate, 
				now, 
				granularity
			)

			// Feature usage metrics
			const featureUsage = await calculateFeatureUsage(auth.supabase, id, startDate, now)

			// User engagement metrics
			const userEngagement = await calculateUserEngagement(auth.supabase, id, startDate, now)

			// Cost and efficiency metrics
			const costMetrics = await calculateCostMetrics(auth.supabase, id, startDate, now)

			return NextResponse.json({
				period: {
					start: startDate.toISOString(),
					end: now.toISOString(),
					days: periodDays
				},
				overview: usageMetrics,
				timeSeries: timeSeriesData,
				features: featureUsage,
				userEngagement,
				costMetrics,
				generatedAt: now.toISOString()
			})

		} catch (error) {
			console.error('[v0] Usage metrics GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

async function calculateUsageMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Total bookings and jobs
	const [bookingsResult, jobsResult, usersResult, propertiesResult] = await Promise.all([
		supabase
			.from('bookings')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
			.gte('booking_date', startDate.toISOString().slice(0, 10))
			.lte('booking_date', endDate.toISOString().slice(0, 10)),
		
		supabase
			.from('jobs')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString()),
		
		supabase
			.from('bookings')
			.select('user_id')
			.eq('company_id', companyId)
			.gte('booking_date', startDate.toISOString().slice(0, 10))
			.lte('booking_date', endDate.toISOString().slice(0, 10)),
		
		supabase
			.from('properties')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
	])

	const uniqueUsers = [...new Set((usersResult.data || []).map(b => b.user_id))].length

	return {
		totalBookings: bookingsResult.count || 0,
		totalJobs: jobsResult.count || 0,
		uniqueUsers,
		totalProperties: propertiesResult.count || 0,
		avgBookingsPerUser: uniqueUsers > 0 ? 
			Math.round(((bookingsResult.count || 0) / uniqueUsers) * 100) / 100 : 0,
		avgJobsPerDay: Math.round(((jobsResult.count || 0) / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) * 100) / 100
	}
}

async function calculateTimeSeriesUsage(supabase: any, companyId: string, startDate: Date, endDate: Date, granularity: string) {
	const { data: jobs } = await supabase
		.from('jobs')
		.select('start_datetime, status, total_amount')
		.eq('company_id', companyId)
		.gte('start_datetime', startDate.toISOString())
		.lte('start_datetime', endDate.toISOString())
		.order('start_datetime', { ascending: true })

	const { data: bookings } = await supabase
		.from('bookings')
		.select('booking_date, total_amount, status')
		.eq('company_id', companyId)
		.gte('booking_date', startDate.toISOString().slice(0, 10))
		.lte('booking_date', endDate.toISOString().slice(0, 10))
		.order('booking_date', { ascending: true })

	// Group data by time period
	const jobsByPeriod: Record<string, any> = {}
	const bookingsByPeriod: Record<string, any> = {}

	// Initialize periods
	const periods = generateTimePeriods(startDate, endDate, granularity)
	periods.forEach(period => {
		jobsByPeriod[period] = { count: 0, revenue: 0, completed: 0 }
		bookingsByPeriod[period] = { count: 0, revenue: 0 }
	})

	// Aggregate jobs
	(jobs || []).forEach(job => {
		const period = formatDateForGranularity(new Date(job.start_datetime), granularity)
		if (jobsByPeriod[period]) {
			jobsByPeriod[period].count += 1
			jobsByPeriod[period].revenue += job.total_amount || 0
			if (job.status === 'completed') {
				jobsByPeriod[period].completed += 1
			}
		}
	})

	// Aggregate bookings
	(bookings || []).forEach(booking => {
		const period = formatDateForGranularity(new Date(booking.booking_date), granularity)
		if (bookingsByPeriod[period]) {
			bookingsByPeriod[period].count += 1
			bookingsByPeriod[period].revenue += booking.total_amount || 0
		}
	})

	return periods.map(period => ({
		period,
		jobs: jobsByPeriod[period],
		bookings: bookingsByPeriod[period]
	}))
}

async function calculateFeatureUsage(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Reports generated
	const { count: reportCount } = await supabase
		.from('reports')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.gte('generated_at', startDate.toISOString())
		.lte('generated_at', endDate.toISOString())

	// Active schedules
	const { count: activeSchedules } = await supabase
		.from('report_schedules')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('is_active', true)

	// Messages/communications
	const { count: messageCount } = await supabase
		.from('messages')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString())

	// Reviews received
	const { count: reviewCount } = await supabase
		.from('reviews')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString())

	return {
		reportsGenerated: reportCount || 0,
		activeSchedules: activeSchedules || 0,
		messagesSent: messageCount || 0,
		reviewsReceived: reviewCount || 0,
		apiUsage: {
			// This would track API endpoints usage in a real implementation
			totalRequests: 0,
			avgResponseTime: 0
		}
	}
}

async function calculateUserEngagement(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// User activity patterns
	const { data: userActivity } = await supabase
		.from('bookings')
		.select('user_id, booking_date')
		.eq('company_id', companyId)
		.gte('booking_date', startDate.toISOString().slice(0, 10))
		.lte('booking_date', endDate.toISOString().slice(0, 10))

	// Calculate engagement metrics
	const userBookingCounts = (userActivity || []).reduce((acc, booking) => {
		acc[booking.user_id] = (acc[booking.user_id] || 0) + 1
		return acc
	}, {} as Record<string, number>)

	const bookingCounts = Object.values(userBookingCounts)
	const totalUsers = bookingCounts.length

	return {
		totalActiveUsers: totalUsers,
		avgBookingsPerUser: totalUsers > 0 ? 
			Math.round((bookingCounts.reduce((sum, count) => sum + count, 0) / totalUsers) * 100) / 100 : 0,
		repeatCustomerRate: totalUsers > 0 ? 
			Math.round((bookingCounts.filter(count => count > 1).length / totalUsers) * 100) : 0,
		engagementDistribution: {
			singleBooking: bookingCounts.filter(c => c === 1).length,
			multipleBookings: bookingCounts.filter(c => c > 1 && c <= 5).length,
			highlyActive: bookingCounts.filter(c => c > 5).length
		}
	}
}

async function calculateCostMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Revenue and cost analysis
	const { data: jobFinancials } = await supabase
		.from('jobs')
		.select('total_amount, status, service_type')
		.eq('company_id', companyId)
		.gte('start_datetime', startDate.toISOString())
		.lte('start_datetime', endDate.toISOString())

	const completedJobs = (jobFinancials || []).filter(j => j.status === 'completed')
	const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)

	// Service type profitability
	const serviceRevenue = completedJobs.reduce((acc, job) => {
		const service = job.service_type || 'Other'
		acc[service] = (acc[service] || 0) + (job.total_amount || 0)
		return acc
	}, {} as Record<string, number>)

	const mostProfitableService = Object.entries(serviceRevenue)
		.sort(([,a], [,b]) => b - a)
		.slice(0, 1)[0]

	return {
		totalRevenue: Math.round(totalRevenue * 100) / 100,
		avgRevenuePerJob: completedJobs.length > 0 ? 
			Math.round((totalRevenue / completedJobs.length) * 100) / 100 : 0,
		totalJobs: completedJobs.length,
		revenueByService: serviceRevenue,
		mostProfitableService: mostProfitableService ? {
			service: mostProfitableService[0],
			revenue: Math.round(mostProfitableService[1] * 100) / 100
		} : null
	}
}

function generateTimePeriods(startDate: Date, endDate: Date, granularity: string): string[] {
	const periods: string[] = []
	const current = new Date(startDate)

	while (current <= endDate) {
		periods.push(formatDateForGranularity(current, granularity))
		
		switch (granularity) {
			case 'hourly':
				current.setHours(current.getHours() + 1)
				break
			case 'daily':
				current.setDate(current.getDate() + 1)
				break
			case 'weekly':
				current.setDate(current.getDate() + 7)
				break
			case 'monthly':
				current.setMonth(current.getMonth() + 1)
				break
		}
	}

	return [...new Set(periods)]
}

function formatDateForGranularity(date: Date, granularity: string): string {
	switch (granularity) {
		case 'hourly':
			return date.toISOString().slice(0, 13) + ':00'
		case 'daily':
			return date.toISOString().slice(0, 10)
		case 'weekly':
			const week = getWeekNumber(date)
			return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`
		case 'monthly':
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
		default:
			return date.toISOString().slice(0, 10)
	}
}

function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}