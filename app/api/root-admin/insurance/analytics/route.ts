import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase()
		const { searchParams } = new URL(req.url)
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

		// Get total policies
		const { count: totalPolicies } = await supabase
			.from('insurance_policies')
			.select('*', { count: 'exact', head: true })

		// Get active policies
		const { count: activePolicies } = await supabase
			.from('insurance_policies')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'active')

		// Get policies by status
		const { data: statusData } = await supabase
			.from('insurance_policies')
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
		const { count: newPolicies } = await supabase
			.from('insurance_policies')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', startDate.toISOString())

		// Get revenue from insurance payments
		const { data: payments } = await supabase
			.from('insurance_payments')
			.select('amount, status, created_at')
			.eq('status', 'completed')
			.gte('created_at', startDate.toISOString())

		const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

		// Get plans count
		const { count: totalPlans } = await supabase
			.from('insurance_plans')
			.select('*', { count: 'exact', head: true })

		const { count: activePlans } = await supabase
			.from('insurance_plans')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'active')

		// Get policies by plan
		const { data: planData } = await supabase
			.from('insurance_policies')
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

		return NextResponse.json({
			metrics: {
				totalPolicies: totalPolicies || 0,
				activePolicies: activePolicies || 0,
				newPolicies: newPolicies || 0,
				totalRevenue,
				totalPlans: totalPlans || 0,
				activePlans: activePlans || 0,
			},
			statusCounts,
			planCounts,
		})
	} catch (error: any) {
		if (error.status === 403) return error
		console.error('[root-admin/insurance/analytics] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
});

