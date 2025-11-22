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
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

		// This month jobs count
		const { count: thisMonthJobs } = await auth.supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', id)
			.gte('start_datetime', startOfMonth.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')

		// Last month jobs count
		const { count: lastMonthJobs } = await auth.supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', id)
			.gte('start_datetime', lastMonthStart.toISOString())
			.lte('startOfMonth' in {} ? '' : lastMonthEnd.toISOString()) // TS hint noop
			.lte('start_datetime', lastMonthEnd.toISOString())
			.eq('status', 'completed')

		// Spending this month
		const { data: thisMonthTotals } = await auth.supabase
			.from('jobs')
			.select('total_amount')
			.eq('company_id', id)
			.gte('start_datetime', startOfMonth.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')

		const thisMonthSpend =
			(thisMonthTotals ?? []).reduce((s, j: any) => s + (j.total_amount || 0), 0) || 0

		// Ratings
		const { data: ratings } = await auth.supabase
			.from('reviews')
			.select('rating')
			.eq('company_id', id)
			.gte('created_at', startOfMonth.toISOString())

		const averageRating =
			(ratings ?? []).reduce((s, r: any) => s + (r.rating || 0), 0) /
				((ratings ?? []).length || 1) || 0

		// Simple activity chart (last 30 days)
		const start30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
		const { data: last30 } = await auth.supabase
			.from('jobs')
			.select('id,start_datetime')
			.eq('company_id', id)
			.gte('start_datetime', start30.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')

		const byDay: Record<string, number> = {}
		for (let i = 0; i < 30; i++) {
			const d = new Date(start30.getTime() + i * 24 * 60 * 60 * 1000)
			byDay[d.toISOString().slice(0, 10)] = 0
		}
		for (const j of last30 ?? []) {
			const key = new Date(j.start_datetime).toISOString().slice(0, 10)
			if (byDay[key] != null) byDay[key]++
		}
		const activityChart = Object.entries(byDay).map(([date, jobs]) => ({ date, jobs }))

		// Spending chart (last 6 months)
		const sixMonthsBack = new Date(now.getFullYear(), now.getMonth() - 5, 1)
		const { data: spendingRows } = await auth.supabase
			.from('jobs')
			.select('total_amount,start_datetime')
			.eq('company_id', id)
			.gte('start_datetime', sixMonthsBack.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')

		const byMonth: Record<string, number> = {}
		for (const row of spendingRows ?? []) {
			const d = new Date(row.start_datetime)
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
			byMonth[key] = (byMonth[key] || 0) + (row.total_amount || 0)
		}
		const spendingChart = Object.entries(byMonth)
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([month, amount]) => ({ month, amount }))

		// Simple growth rates
		const jobGrowth =
			lastMonthJobs && lastMonthJobs > 0
				? Math.round(((thisMonthJobs || 0) - lastMonthJobs) / lastMonthJobs * 100)
				: 0

		// Revenue analytics (use completed jobs total_amount as proxy)
		const twelveMonthsBack = new Date(now.getFullYear(), now.getMonth() - 11, 1)
		const { data: revenueRows } = await auth.supabase
			.from('jobs')
			.select('total_amount,start_datetime')
			.eq('company_id', id)
			.gte('start_datetime', twelveMonthsBack.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')
		const revenueByMonth: Record<string, number> = {}
		for (const row of revenueRows ?? []) {
			const d = new Date(row.start_datetime)
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
			revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(row.total_amount || 0)
		}
		const revenueAnalytics = Object.entries(revenueByMonth)
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([month, revenue]) => ({ month, revenue }))

		// Performance metrics (completion rate in last 30 days)
		const { count: total30 } = await auth.supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', id)
			.gte('start_datetime', start30.toISOString())
		const { count: completed30 } = await auth.supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', id)
			.gte('start_datetime', start30.toISOString())
			.eq('status', 'completed')
		const performance = {
			completionRate: total30 && total30 > 0 ? Math.round(((completed30 || 0) / total30) * 100) : 0,
			onTimeRate: null as number | null,
			avgJobsPerDay30d: Math.round((activityChart.reduce((s, d) => s + (d as any).jobs, 0) / 30) * 100) / 100,
		}

		// CLV (rough): average spend per unique customer in last 6 months
		const { data: clvRows } = await auth.supabase
			.from('bookings')
			.select('user_id,total_amount,booking_date')
			.eq('company_id', id)
			.gte('booking_date', sixMonthsBack.toISOString().slice(0, 10))
			.lte('booking_date', now.toISOString().slice(0, 10))
			.eq('status', 'completed')
		const perCustomer: Record<string, number> = {}
		for (const r of clvRows ?? []) {
			const uid = r.user_id || 'unknown'
			perCustomer[uid] = (perCustomer[uid] || 0) + Number(r.total_amount || 0)
		}
		const clvValues = Object.entries(perCustomer)
			.filter(([uid]) => uid !== 'unknown')
			.map(([, sum]) => sum)
		const customerLifetimeValue = clvValues.length > 0 ? Math.round(clvValues.reduce((s, v) => s + v, 0) / clvValues.length) : 0

		// Churn prediction (heuristic): customers with no bookings in last 60 days
		const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
		const { data: recentCustomerRows } = await auth.supabase
			.from('bookings')
			.select('user_id,booking_date')
			.eq('company_id', id)
			.gte('booking_date', new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().slice(0, 10))
			.order('booking_date', { ascending: false })
		const lastSeen: Record<string, Date> = {}
		for (const r of recentCustomerRows ?? []) {
			const uid = r.user_id
			if (!uid) continue
			const d = new Date(r.booking_date)
			if (!lastSeen[uid] || d > lastSeen[uid]) lastSeen[uid] = d
		}
		const churnRiskCustomers = Object.entries(lastSeen)
			.filter(([, d]) => d < sixtyDaysAgo)
			.map(([userId]) => ({ userId }))
			.slice(0, 50)

		// Demand forecasting (naive): next 4 weeks = moving average of last 12 weeks
		const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
		const { data: weekRows } = await auth.supabase
			.from('jobs')
			.select('id,start_datetime')
			.eq('company_id', id)
			.gte('start_datetime', twelveWeeksAgo.toISOString())
		const byWeek: Record<string, number> = {}
		for (const r of weekRows ?? []) {
			const d = new Date(r.start_datetime)
			const jan4 = new Date(d.getFullYear(), 0, 4)
			const weekStart = new Date(d)
			weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7))
			const key = `${weekStart.getFullYear()}-W${String(Math.ceil(((weekStart.getTime() - jan4.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)).padStart(2, '0')}`
			byWeek[key] = (byWeek[key] || 0) + 1
		}
		const weekCounts = Object.entries(byWeek).map(([, c]) => c)
		const avgPerWeek = weekCounts.length > 0 ? Math.round((weekCounts.reduce((s, v) => s + v, 0) / weekCounts.length) * 100) / 100 : 0
		const demandForecasting = {
			next4Weeks: [avgPerWeek, avgPerWeek, avgPerWeek, avgPerWeek],
			method: '12w_moving_average',
		}

		// Enhanced analytics for enterprise features
		
		// Usage metrics
		const { data: totalBookings } = await auth.supabase
			.from('bookings')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', id)
			.gte('booking_date', startOfMonth.toISOString().slice(0, 10))

		const { data: activeUsers } = await auth.supabase
			.from('bookings')
			.select('user_id')
			.eq('company_id', id)
			.gte('booking_date', startOfMonth.toISOString().slice(0, 10))

		const uniqueActiveUsers = [...new Set((activeUsers || []).map(b => b.user_id))].length

		// Performance tracking
		const { data: onTimeJobs } = await auth.supabase
			.from('jobs')
			.select('id')
			.eq('company_id', id)
			.gte('start_datetime', start30.toISOString())
			.eq('status', 'completed')
			.is('delay_minutes', null)

		const onTimeRate = completed30 && completed30 > 0 ? 
			Math.round(((onTimeJobs?.length || 0) / completed30) * 100) : 0

		// Service type breakdown
		const { data: serviceBreakdown } = await auth.supabase
			.from('jobs')
			.select('service_type')
			.eq('company_id', id)
			.gte('start_datetime', startOfMonth.toISOString())
			.eq('status', 'completed')

		const topServices = Object.entries(
			(serviceBreakdown || []).reduce((acc: any, job) => {
				const service = job.service_type || 'Other'
				acc[service] = (acc[service] || 0) + 1
				return acc
			}, {})
		)
		.sort(([,a], [,b]) => (b as number) - (a as number))
		.slice(0, 5)
		.map(([service, count]) => ({ service, count }))

		// Cost efficiency metrics
		const avgJobValue = thisMonthSpend > 0 && thisMonthJobs > 0 ? 
			thisMonthSpend / thisMonthJobs : 0

		// Customer metrics
		const { data: repeatCustomers } = await auth.supabase
			.from('bookings')
			.select('user_id', { count: 'exact' })
			.eq('company_id', id)
			.gte('booking_date', new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().slice(0, 10))

		const customerRetentionRate = uniqueActiveUsers > 0 ? 
			Math.round((repeatCustomers || 0) / uniqueActiveUsers * 100) : 0

		// Territory/Property performance
		const { data: propertyPerformance } = await auth.supabase
			.from('jobs')
			.select(`
				property_id,
				total_amount,
				properties(name)
			`)
			.eq('company_id', id)
			.eq('status', 'completed')
			.gte('start_datetime', startOfMonth.toISOString())

		const propertyStats = Object.entries(
			(propertyPerformance || []).reduce((acc: any, job) => {
				const propertyName = job.properties?.name || 'Unknown Property'
				if (!acc[propertyName]) {
					acc[propertyName] = { revenue: 0, jobs: 0 }
				}
				acc[propertyName].revenue += job.total_amount || 0
				acc[propertyName].jobs += 1
				return acc
			}, {})
		)
		.sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
		.slice(0, 10)
		.map(([property, stats]) => ({
			property,
			...(stats as any)
		}))

		const analytics = {
			// Basic metrics
			thisMonthJobs: thisMonthJobs || 0,
			jobGrowth,
			thisMonthSpend,
			spendGrowth: 0,
			averageRating,
			totalReviews: (ratings ?? []).length || 0,
			propertyGrowth: 0,

			// Charts and trends
			activityChart,
			spendingChart,
			revenueAnalytics,
			bookingTrends: activityChart,

			// Enhanced performance metrics
			performance: {
				...performance,
				onTimeRate,
				avgJobValue: Math.round(avgJobValue * 100) / 100,
				customerRetentionRate
			},

			// Usage metrics
			usageMetrics: {
				totalBookings: totalBookings || 0,
				uniqueActiveUsers,
				avgBookingsPerUser: uniqueActiveUsers > 0 ? 
					Math.round(((totalBookings || 0) / uniqueActiveUsers) * 100) / 100 : 0,
				bookingGrowthRate: 0 // Could calculate vs previous month
			},

			// Service insights
			topServices,
			serviceBreakdown: topServices,

			// Customer insights
			customerLifetimeValue,
			churnPrediction: churnRiskCustomers,
			customerRetentionRate,

			// Territory performance
			propertyPerformance: propertyStats,

			// Forecasting
			demandForecasting,

			// Enterprise metrics summary
			enterpriseMetrics: {
				totalProperties: propertyStats.length,
				averageRevenuePerProperty: propertyStats.length > 0 ? 
					Math.round((propertyStats.reduce((sum, p) => sum + p.revenue, 0) / propertyStats.length) * 100) / 100 : 0,
				mostProfitableService: topServices.length > 0 ? topServices[0].service : 'N/A',
				operationalEfficiency: Math.round((onTimeRate + performance.completionRate) / 2),
				growthTrend: jobGrowth > 0 ? 'positive' : jobGrowth < 0 ? 'negative' : 'stable'
			}
		}

		return NextResponse.json(analytics)
	} catch (error) {
		console.error('[v0] Company analytics GET error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
	}
)


