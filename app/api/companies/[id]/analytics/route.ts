import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createServerSupabase()
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

		// This month jobs count
		const { count: thisMonthJobs } = await supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', params.id)
			.gte('start_datetime', startOfMonth.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')

		// Last month jobs count
		const { count: lastMonthJobs } = await supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', params.id)
			.gte('start_datetime', lastMonthStart.toISOString())
			.lte('startOfMonth' in {} ? '' : lastMonthEnd.toISOString()) // TS hint noop
			.lte('start_datetime', lastMonthEnd.toISOString())
			.eq('status', 'completed')

		// Spending this month
		const { data: thisMonthTotals } = await supabase
			.from('jobs')
			.select('total_amount')
			.eq('company_id', params.id)
			.gte('start_datetime', startOfMonth.toISOString())
			.lte('start_datetime', now.toISOString())
			.eq('status', 'completed')

		const thisMonthSpend =
			(thisMonthTotals ?? []).reduce((s, j: any) => s + (j.total_amount || 0), 0) || 0

		// Ratings
		const { data: ratings } = await supabase
			.from('reviews')
			.select('rating')
			.eq('company_id', params.id)
			.gte('created_at', startOfMonth.toISOString())

		const averageRating =
			(ratings ?? []).reduce((s, r: any) => s + (r.rating || 0), 0) /
				((ratings ?? []).length || 1) || 0

		// Simple activity chart (last 30 days)
		const start30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
		const { data: last30 } = await supabase
			.from('jobs')
			.select('id,start_datetime')
			.eq('company_id', params.id)
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
		const { data: spendingRows } = await supabase
			.from('jobs')
			.select('total_amount,start_datetime')
			.eq('company_id', params.id)
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
		const { data: revenueRows } = await supabase
			.from('jobs')
			.select('total_amount,start_datetime')
			.eq('company_id', params.id)
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
		const { count: total30 } = await supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', params.id)
			.gte('start_datetime', start30.toISOString())
		const { count: completed30 } = await supabase
			.from('jobs')
			.select('*', { count: 'exact', head: true })
			.eq('company_id', params.id)
			.gte('start_datetime', start30.toISOString())
			.eq('status', 'completed')
		const performance = {
			completionRate: total30 && total30 > 0 ? Math.round(((completed30 || 0) / total30) * 100) : 0,
			onTimeRate: null as number | null,
			avgJobsPerDay30d: Math.round((activityChart.reduce((s, d) => s + (d as any).jobs, 0) / 30) * 100) / 100,
		}

		// CLV (rough): average spend per unique customer in last 6 months
		const { data: clvRows } = await supabase
			.from('bookings')
			.select('user_id,total_amount,booking_date')
			.eq('company_id', params.id)
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
		const { data: recentCustomerRows } = await supabase
			.from('bookings')
			.select('user_id,booking_date')
			.eq('company_id', params.id)
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
		const { data: weekRows } = await supabase
			.from('jobs')
			.select('id,start_datetime')
			.eq('company_id', params.id)
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

		const analytics = {
			thisMonthJobs: thisMonthJobs || 0,
			jobGrowth,
			thisMonthSpend,
			spendGrowth: 0,
			averageRating,
			totalReviews: (ratings ?? []).length || 0,
			activityChart,
			spendingChart,
			propertyGrowth: 0,
			topServices: [],
			revenueAnalytics,
			bookingTrends: activityChart,
			performance,
			customerLifetimeValue,
			churnPrediction: churnRiskCustomers,
			demandForecasting,
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


