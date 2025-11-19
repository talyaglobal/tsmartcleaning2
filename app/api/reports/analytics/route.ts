import { NextRequest, NextResponse } from 'next/server'
import { getReportAnalytics } from '@/lib/report-analytics'

/**
 * GET /api/reports/analytics
 * Get comprehensive analytics for the reporting system
 * 
 * Query params:
 * - companyId: Filter by company ID
 * - startDate: Start date for analytics period (ISO string)
 * - endDate: End date for analytics period (ISO string)
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const companyId = searchParams.get('companyId') || undefined
		const startDateParam = searchParams.get('startDate')
		const endDateParam = searchParams.get('endDate')

		const startDate = startDateParam
			? new Date(startDateParam)
			: undefined
		const endDate = endDateParam ? new Date(endDateParam) : undefined

		const analytics = await getReportAnalytics(
			companyId,
			startDate,
			endDate
		)

		return NextResponse.json(analytics)
	} catch (error: any) {
		console.error('[v0] Get report analytics error:', error)
		return NextResponse.json(
			{ error: 'Failed to get report analytics', message: error.message },
			{ status: 500 }
		)
	}
}

