import { createServerSupabase } from './supabase'

export interface ReportAnalytics {
	totalReports: number
	reportsByType: Record<string, number>
	reportsByPeriod: {
		last7Days: number
		last30Days: number
		last90Days: number
	}
	mostActiveCompanies: Array<{
		companyId: string
		companyName: string
		reportCount: number
	}>
	emailDeliveryStats: {
		totalSent: number
		totalDelivered: number
		totalOpened: number
		totalClicked: number
		totalFailed: number
		deliveryRate: number
		openRate: number
		clickRate: number
	}
	scheduleStats: {
		totalSchedules: number
		activeSchedules: number
		schedulesByFrequency: {
			daily: number
			weekly: number
			monthly: number
		}
	}
}

/**
 * Get comprehensive analytics for the reporting system
 */
export async function getReportAnalytics(
	companyId?: string,
	startDate?: Date,
	endDate?: Date
): Promise<ReportAnalytics> {
	const supabase = createServerSupabase()

	const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
	const end = endDate || new Date()

	// Build base query
	let reportsQuery = supabase
		.from('reports')
		.select('id, report_type, company_id, generated_at, companies(name)')
		.gte('generated_at', start.toISOString())
		.lte('generated_at', end.toISOString())

	if (companyId) {
		reportsQuery = reportsQuery.eq('company_id', companyId)
	}

	const { data: reports } = await reportsQuery

	// Calculate reports by type
	const reportsByType: Record<string, number> = {}
	for (const report of reports || []) {
		const type = report.report_type || 'unknown'
		reportsByType[type] = (reportsByType[type] || 0) + 1
	}

	// Calculate reports by period
	const now = new Date()
	const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
	const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
	const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

	const reportsByPeriod = {
		last7Days:
			reports?.filter(
				(r) => new Date(r.generated_at) >= last7Days
			).length || 0,
		last30Days:
			reports?.filter(
				(r) => new Date(r.generated_at) >= last30Days
			).length || 0,
		last90Days:
			reports?.filter(
				(r) => new Date(r.generated_at) >= last90Days
			).length || 0,
	}

	// Get most active companies
	const companyCounts: Record<
		string,
		{ name: string; count: number }
	> = {}
	for (const report of reports || []) {
		const cid = report.company_id
		if (!companyCounts[cid]) {
			companyCounts[cid] = {
				name:
					(report.companies as any)?.name || 'Unknown Company',
				count: 0,
			}
		}
		companyCounts[cid].count++
	}

	const mostActiveCompanies = Object.entries(companyCounts)
		.map(([companyId, data]) => ({
			companyId,
			companyName: data.name,
			reportCount: data.count,
		}))
		.sort((a, b) => b.reportCount - a.reportCount)
		.slice(0, 10)

	// Get email delivery stats
	let emailQuery = supabase
		.from('report_email_deliveries')
		.select('status, schedule_id')
		.gte('sent_at', start.toISOString())
		.lte('sent_at', end.toISOString())

	const { data: emailDeliveries } = await emailQuery

	// Filter by company if needed
	let filteredDeliveries = emailDeliveries || []
	if (companyId) {
		// Get schedule IDs for this company
		const { data: companySchedules } = await supabase
			.from('report_schedules')
			.select('id')
			.eq('company_id', companyId)

		const scheduleIds = (companySchedules || []).map((s) => s.id)
		filteredDeliveries = (emailDeliveries || []).filter((e) =>
			scheduleIds.includes(e.schedule_id)
		)
	}

	const totalSent =
		filteredDeliveries?.filter((e) => e.status === 'sent').length || 0
	const totalDelivered =
		filteredDeliveries?.filter((e) => e.status === 'delivered').length || 0
	const totalOpened =
		filteredDeliveries?.filter((e) => e.status === 'opened').length || 0
	const totalClicked =
		filteredDeliveries?.filter((e) => e.status === 'clicked').length || 0
	const totalFailed =
		filteredDeliveries?.filter((e) => e.status === 'failed').length || 0

	const emailDeliveryStats = {
		totalSent,
		totalDelivered,
		totalOpened,
		totalClicked,
		totalFailed,
		deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
		openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
		clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
	}

	// Get schedule stats
	let schedulesQuery = supabase
		.from('report_schedules')
		.select('frequency, is_active')

	if (companyId) {
		schedulesQuery = schedulesQuery.eq('company_id', companyId)
	}

	const { data: schedules } = await schedulesQuery

	const schedulesByFrequency = {
		daily:
			schedules?.filter((s) => s.frequency === 'daily').length || 0,
		weekly:
			schedules?.filter((s) => s.frequency === 'weekly').length || 0,
		monthly:
			schedules?.filter((s) => s.frequency === 'monthly').length || 0,
	}

	const scheduleStats = {
		totalSchedules: schedules?.length || 0,
		activeSchedules:
			schedules?.filter((s) => s.is_active).length || 0,
		schedulesByFrequency,
	}

	return {
		totalReports: reports?.length || 0,
		reportsByType,
		reportsByPeriod,
		mostActiveCompanies,
		emailDeliveryStats,
		scheduleStats,
	}
}

/**
 * Get report view/access analytics
 */
export async function getReportAccessAnalytics(
	reportId: string
): Promise<{
	viewCount: number
	lastViewedAt: Date | null
	uniqueViewers: number
}> {
	const supabase = createServerSupabase()

	// Note: This assumes you have a report_views table
	// If not, you'll need to create it or track views differently
	try {
		const { data: views } = await supabase
			.from('report_views')
			.select('*')
			.eq('report_id', reportId)

		return {
			viewCount: views?.length || 0,
			lastViewedAt:
				views && views.length > 0
					? new Date(
							Math.max(
								...views.map((v: any) =>
									new Date(v.viewed_at).getTime()
								)
							)
					  )
					: null,
			uniqueViewers:
				new Set(views?.map((v: any) => v.viewer_id)).size || 0,
		}
	} catch (error) {
		// Table might not exist yet
		return {
			viewCount: 0,
			lastViewedAt: null,
			uniqueViewers: 0,
		}
	}
}

