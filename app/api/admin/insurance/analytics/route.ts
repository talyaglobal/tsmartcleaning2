import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
		try {
			const tenantId = resolveTenantFromRequest(request) || authTenantId
			const supabase = authSupabase || createServerSupabase(tenantId || undefined)
		const { searchParams } = new URL(request.url)
		const period = searchParams.get('period') || '30d'

		// Calculate date range
		const now = new Date()
		let startDate = new Date()
		if (period === '7d') {
			startDate.setDate(now.getDate() - 7)
		} else if (period === '30d') {
			startDate.setDate(now.getDate() - 30)
		} else if (period === '90d') {
			startDate.setDate(now.getDate() - 90)
		} else {
			startDate = new Date(0) // All time
		}

		// Build base query with tenant filter
		const buildQuery = (table: string) => {
			let query = supabase.from(table).select('*', { count: 'exact', head: false })
			if (tenantId) {
				query = query.eq('tenant_id', tenantId)
			}
			return query
		}

		// Get total policies
		const { count: totalPolicies } = await buildQuery('insurance_policies').select('*', { count: 'exact', head: true })

		// Get active policies
		const { count: activePolicies } = await buildQuery('insurance_policies')
			.eq('status', 'active')
			.select('*', { count: 'exact', head: true })

		// Get policies by status
		const { data: statusData } = await buildQuery('insurance_policies')
			.select('status')
			.gte('created_at', startDate.toISOString())

		const statusCounts = (statusData || []).reduce(
			(acc: any, p: any) => {
				acc[p.status] = (acc[p.status] || 0) + 1
				return acc
			},
			{}
		)

		// Get policies created in period
		const { count: newPolicies } = await buildQuery('insurance_policies')
			.gte('created_at', startDate.toISOString())
			.select('*', { count: 'exact', head: true })

		// Get revenue from insurance payments
		const { data: payments } = await buildQuery('insurance_payments')
			.select('amount, status, created_at')
			.eq('status', 'completed')
			.gte('created_at', startDate.toISOString())

		const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

		// Get total claims
		const { count: totalClaims } = await buildQuery('insurance_claims')
			.select('*', { count: 'exact', head: true })

		// Get claims by status
		const { data: claimStatusData } = await buildQuery('insurance_claims')
			.select('status')
			.gte('created_at', startDate.toISOString())

		const claimStatusCounts = (claimStatusData || []).reduce(
			(acc: any, c: any) => {
				acc[c.status] = (acc[c.status] || 0) + 1
				return acc
			},
			{}
		)

		// Get total claim amount
		const { data: claims } = await buildQuery('insurance_claims')
			.select('amount_claimed, status')
			.gte('created_at', startDate.toISOString())

		const totalClaimAmount = (claims || []).reduce((sum: number, c: any) => sum + Number(c.amount_claimed || 0), 0)
		const approvedClaimAmount = (claims || [])
			.filter((c: any) => c.status === 'approved' || c.status === 'paid')
			.reduce((sum: number, c: any) => sum + Number(c.amount_claimed || 0), 0)

		// Get policies by plan
		const { data: planData } = await buildQuery('insurance_policies')
			.select('plan_id, insurance_plans(name)')
			.gte('created_at', startDate.toISOString())

		const planCounts = (planData || []).reduce(
			(acc: any, p: any) => {
				const planName = (p.insurance_plans as any)?.name || 'Unknown'
				acc[planName] = (acc[planName] || 0) + 1
				return acc
			},
			{}
		)

		// Get time series data for policies and claims
		const { data: policyTimeData } = await buildQuery('insurance_policies')
			.select('created_at')
			.gte('created_at', startDate.toISOString())
			.order('created_at', { ascending: true })

		const { data: claimTimeData } = await buildQuery('insurance_claims')
			.select('created_at, amount_claimed, status')
			.gte('created_at', startDate.toISOString())
			.order('created_at', { ascending: true })

		// Build daily time series
		const timeSeriesMap = new Map<string, { date: string; policies: number; claims: number; revenue: number }>()
		
		const currentDate = new Date()
		const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
		for (let i = daysBack - 1; i >= 0; i--) {
			const date = new Date(currentDate)
			date.setDate(date.getDate() - i)
			const dateStr = date.toISOString().split('T')[0]
			timeSeriesMap.set(dateStr, { date: dateStr, policies: 0, claims: 0, revenue: 0 })
		}

		// Aggregate policy data
		;(policyTimeData || []).forEach((p: any) => {
			const dateStr = new Date(p.created_at).toISOString().split('T')[0]
			const entry = timeSeriesMap.get(dateStr)
			if (entry) entry.policies++
		})

		// Aggregate claim data
		;(claimTimeData || []).forEach((c: any) => {
			const dateStr = new Date(c.created_at).toISOString().split('T')[0]
			const entry = timeSeriesMap.get(dateStr)
			if (entry) {
				entry.claims++
				if (c.status === 'approved' || c.status === 'paid') {
					entry.revenue += Number(c.amount_claimed || 0)
				}
			}
		})

		const timeSeries = Array.from(timeSeriesMap.values())

		// Get revenue by plan
		const { data: revenueByPlanData } = await buildQuery('insurance_policies')
			.select('plan_id, insurance_plans(name, code)')
			.gte('created_at', startDate.toISOString())

		const planRevenueMap = new Map<string, number>()
		;(revenueByPlanData || []).forEach((p: any) => {
			const planName = (p.insurance_plans as any)?.name || 'Unknown'
			planRevenueMap.set(planName, (planRevenueMap.get(planName) || 0) + 1)
		})

		const revenueByPlan = Array.from(planRevenueMap.entries()).map(([name, count]) => ({
			name,
			policies: count,
		}))

		return NextResponse.json({
			metrics: {
				totalPolicies: totalPolicies || 0,
				activePolicies: activePolicies || 0,
				newPolicies: newPolicies || 0,
				totalRevenue,
				totalClaims: totalClaims || 0,
				totalClaimAmount,
				approvedClaimAmount,
			},
			statusCounts,
			claimStatusCounts,
			planCounts,
			timeSeries,
			revenueByPlan,
		})
		} catch (error: any) {
			console.error('[admin/insurance/analytics] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

