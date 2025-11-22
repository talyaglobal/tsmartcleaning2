import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'

export const POST = withAuth(
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
			const body = await request.json()
			const { 
				format = 'csv',
				reportType = 'all',
				startDate,
				endDate,
				propertyId,
				includeRawData = false,
				includeAnalytics = true
			} = body

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

			// Calculate date range
			const endDateObj = endDate ? new Date(endDate) : new Date()
			const startDateObj = startDate 
				? new Date(startDate) 
				: new Date(endDateObj.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days default

			let exportData: any[] = []

			switch (format.toLowerCase()) {
				case 'csv':
					exportData = await generateCSVExport(auth.supabase, id, {
						reportType,
						startDate: startDateObj,
						endDate: endDateObj,
						propertyId,
						includeRawData,
						includeAnalytics
					})
					break

				case 'json':
					exportData = await generateJSONExport(auth.supabase, id, {
						reportType,
						startDate: startDateObj,
						endDate: endDateObj,
						propertyId,
						includeRawData,
						includeAnalytics
					})
					break

				case 'xlsx':
					exportData = await generateExcelExport(auth.supabase, id, {
						reportType,
						startDate: startDateObj,
						endDate: endDateObj,
						propertyId,
						includeRawData,
						includeAnalytics
					})
					break

				default:
					return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
			}

			// Create export record for tracking
			const { data: exportRecord } = await auth.supabase
				.from('report_exports')
				.insert({
					company_id: id,
					property_id: propertyId || null,
					export_type: reportType,
					format,
					period_start: startDateObj.toISOString(),
					period_end: endDateObj.toISOString(),
					exported_by: auth.user.id,
					record_count: Array.isArray(exportData) ? exportData.length : 1,
					settings: {
						includeRawData,
						includeAnalytics
					}
				})
				.select()
				.single()

			return NextResponse.json({
				exportId: exportRecord?.id,
				data: exportData,
				format,
				recordCount: Array.isArray(exportData) ? exportData.length : 1,
				message: 'Export completed successfully'
			})

		} catch (error) {
			console.error('[v0] Company reports export error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

async function generateCSVExport(supabase: any, companyId: string, options: any) {
	const { reportType, startDate, endDate, propertyId, includeRawData, includeAnalytics } = options

	let query = supabase
		.from('reports')
		.select(`
			id,
			report_type,
			period_start,
			period_end,
			status,
			generated_at,
			properties(name),
			summary,
			analytics
		`)
		.eq('company_id', companyId)
		.gte('period_start', startDate.toISOString())
		.lte('period_end', endDate.toISOString())

	if (reportType !== 'all') {
		query = query.eq('report_type', reportType)
	}

	if (propertyId) {
		query = query.eq('property_id', propertyId)
	}

	const { data: reports } = await query.order('generated_at', { ascending: false })

	// Convert to CSV format
	const csvData = (reports || []).map(report => ({
		id: report.id,
		type: report.report_type,
		property: report.properties?.name || 'All Properties',
		period_start: report.period_start,
		period_end: report.period_end,
		status: report.status,
		generated_at: report.generated_at,
		total_jobs: report.summary?.totalJobs || 0,
		total_cost: report.summary?.totalCost || 0,
		average_rating: report.summary?.averageRating || 0,
		...(includeAnalytics && report.analytics ? {
			completion_rate: report.analytics.completionRate || 0,
			customer_satisfaction: report.analytics.customerSatisfaction || 0
		} : {})
	}))

	if (includeRawData) {
		// Include raw job data
		const { data: jobs } = await supabase
			.from('jobs')
			.select(`
				id,
				start_datetime,
				status,
				total_amount,
				properties(name),
				reviews(rating, comment)
			`)
			.eq('company_id', companyId)
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString())
			.order('start_datetime', { ascending: false })

		return {
			reports: csvData,
			rawJobs: jobs || []
		}
	}

	return csvData
}

async function generateJSONExport(supabase: any, companyId: string, options: any) {
	const { reportType, startDate, endDate, propertyId, includeRawData, includeAnalytics } = options

	let query = supabase
		.from('reports')
		.select(`
			*,
			properties(name, address),
			users!reports_generated_by_fkey(email)
		`)
		.eq('company_id', companyId)
		.gte('period_start', startDate.toISOString())
		.lte('period_end', endDate.toISOString())

	if (reportType !== 'all') {
		query = query.eq('report_type', reportType)
	}

	if (propertyId) {
		query = query.eq('property_id', propertyId)
	}

	const { data: reports } = await query.order('generated_at', { ascending: false })

	const exportData = {
		meta: {
			companyId,
			exportDate: new Date().toISOString(),
			period: {
				start: startDate.toISOString(),
				end: endDate.toISOString()
			},
			filters: {
				reportType,
				propertyId,
				includeRawData,
				includeAnalytics
			}
		},
		reports: reports || [],
		summary: {
			totalReports: (reports || []).length,
			reportTypes: [...new Set((reports || []).map(r => r.report_type))],
			dateRange: {
				earliest: reports && reports.length > 0 ? 
					Math.min(...reports.map(r => new Date(r.period_start).getTime())) : null,
				latest: reports && reports.length > 0 ? 
					Math.max(...reports.map(r => new Date(r.period_end).getTime())) : null
			}
		}
	}

	if (includeRawData) {
		const { data: jobs } = await supabase
			.from('jobs')
			.select(`
				*,
				properties(name, address),
				reviews(rating, comment, created_at),
				bookings(booking_date, status)
			`)
			.eq('company_id', companyId)
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString())
			.order('start_datetime', { ascending: false })

		exportData.rawData = {
			jobs: jobs || [],
			jobsSummary: {
				totalJobs: (jobs || []).length,
				completedJobs: (jobs || []).filter(j => j.status === 'completed').length,
				totalRevenue: (jobs || []).reduce((sum, j) => sum + (j.total_amount || 0), 0),
				averageRating: calculateAverageRating(jobs || [])
			}
		}
	}

	return exportData
}

async function generateExcelExport(supabase: any, companyId: string, options: any) {
	// For now, return the same structure as JSON
	// In a real implementation, you'd use a library like ExcelJS to create actual Excel files
	const jsonData = await generateJSONExport(supabase, companyId, options)
	
	return {
		...jsonData,
		format: 'excel',
		note: 'Excel export format - would generate actual .xlsx file in production'
	}
}

function calculateAverageRating(jobs: any[]): number {
	const ratingsData = jobs
		.filter(job => job.reviews && job.reviews.length > 0)
		.flatMap(job => job.reviews)
		.filter(review => review.rating)
		.map(review => review.rating)

	if (ratingsData.length === 0) return 0
	return ratingsData.reduce((sum, rating) => sum + rating, 0) / ratingsData.length
}