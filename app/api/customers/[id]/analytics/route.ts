import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Customer analytics: spending tracking, savings estimate, service history summary,
// preferred cleaners, peak usage times, ROI on membership (basic heuristic).
export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createServerSupabase()
		const userId = params.id
		const now = new Date()

		// Service history (recent 20)
		const { data: recentBookings } = await supabase
			.from('bookings')
			.select('id, booking_date, booking_time, status, total_amount, service_id, provider_id')
			.eq('user_id', userId)
			.order('booking_date', { ascending: false })
			.limit(20)

		// Spending tracking
		const sixMonthsBack = new Date(now.getFullYear(), now.getMonth() - 5, 1)
		const { data: spendRows } = await supabase
			.from('bookings')
			.select('total_amount, booking_date')
			.eq('user_id', userId)
			.gte('booking_date', sixMonthsBack.toISOString().slice(0, 10))
			.lte('booking_date', now.toISOString().slice(0, 10))
			.in('status', ['completed', 'confirmed'])

		const byMonth: Record<string, number> = {}
		let totalSpent = 0
		for (const row of spendRows ?? []) {
			const d = new Date(row.booking_date)
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
			byMonth[key] = (byMonth[key] || 0) + Number(row.total_amount || 0)
			totalSpent += Number(row.total_amount || 0)
		}
		const monthlySpending = Object.entries(byMonth)
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(([month, amount]) => ({ month, amount }))

		// Preferred cleaners (top providers by count)
		const providerCounts: Record<string, number> = {}
		for (const b of recentBookings ?? []) {
			const pid = b.provider_id ?? 'unknown'
			providerCounts[pid] = (providerCounts[pid] || 0) + 1
		}
		const preferredCleaners = Object.entries(providerCounts)
			.filter(([pid]) => pid !== 'unknown')
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([providerId, count]) => ({ providerId, jobs: count }))

		// Peak usage times (by hour across last 90 days)
		const start90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
		const { data: timeRows } = await supabase
			.from('bookings')
			.select('booking_time')
			.eq('user_id', userId)
			.gte('booking_date', start90.toISOString().slice(0, 10))
			.in('status', ['completed', 'confirmed'])
		const byHour: Record<string, number> = {}
		for (let h = 0; h < 24; h++) byHour[String(h).padStart(2, '0')] = 0
		for (const r of timeRows ?? []) {
			const time: string = r.booking_time || ''
			const hour = time.split(':')[0]
			if (byHour[hour] != null) byHour[hour]++
		}
		const peakUsage = Object.entries(byHour)
			.map(([hour, count]) => ({ hour, count }))
			.sort((a, b) => b.count - a.count)

		// Savings calculator / ROI on membership (heuristic):
		// Assume recurring bookings receive an implicit discount vs one-off.
		// Estimate savings as difference between customer's average price and
		// an assumed non-recurring baseline (+8%).
		let avgPrice = 0
		let nCompleted = 0
		for (const b of recentBookings ?? []) {
			if (b.status === 'completed') {
				avgPrice += Number(b.total_amount || 0)
				nCompleted++
			}
		}
		avgPrice = nCompleted > 0 ? avgPrice / nCompleted : 0
		const baseline = avgPrice * 1.08
		const estimatedPerJobSavings = Math.max(0, baseline - avgPrice)
		const estimatedAnnualJobs = Math.min(52, Math.max(4, nCompleted * 2)) // naive forecast
		const estimatedAnnualSavings = Math.round(estimatedPerJobSavings * estimatedAnnualJobs)
		// If membership_fee exists on user_profiles, use it; else default
		let membershipFeeYear = 0
		{
			const { data: profile } = await supabase
				.from('user_profiles')
				.select('membership_plan, membership_fee_monthly')
				.eq('user_id', userId)
				.single()
			const monthly = Number(profile?.membership_fee_monthly || 0)
			membershipFeeYear = monthly > 0 ? monthly * 12 : 0
		}
		const roiOnMembership = {
			estimatedAnnualSavings,
			membershipAnnualCost: membershipFeeYear || 0,
			estimatedNetBenefit: estimatedAnnualSavings - (membershipFeeYear || 0),
		}

		const analytics = {
			spending: {
				totalSpent,
				monthlySpending,
			},
			savingsCalculator: {
				estimatedPerJobSavings: Math.round(estimatedPerJobSavings),
				estimatedAnnualJobs,
				estimatedAnnualSavings,
			},
			serviceHistory: {
				recentBookings: (recentBookings ?? []).map((b: any) => ({
					id: b.id,
					date: b.booking_date,
					time: b.booking_time,
					status: b.status,
					total: Number(b.total_amount || 0),
					serviceId: b.service_id,
					providerId: b.provider_id,
				})),
			},
			preferredCleaners,
			peakUsageTimes: peakUsage, // sorted desc by count
			roiOnMembership,
		}

		return NextResponse.json(analytics)
	} catch (error) {
		console.error('[v0] Customer analytics GET error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}


