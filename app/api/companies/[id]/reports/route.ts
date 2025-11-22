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
			const reportType = url.searchParams.get('type') || 'all'
			const timeframe = url.searchParams.get('timeframe') || '30'
			const propertyId = url.searchParams.get('propertyId')

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

			let query = auth.supabase
				.from('reports')
				.select(`
					*,
					properties(name),
					report_schedules(frequency, recipients)
				`)
				.eq('company_id', id)

			// Filter by report type
			if (reportType !== 'all') {
				query = query.eq('report_type', reportType)
			}

			// Filter by property
			if (propertyId) {
				query = query.eq('property_id', propertyId)
			}

			// Filter by timeframe
			if (timeframe && timeframe !== 'all') {
				const days = parseInt(timeframe)
				if (!isNaN(days)) {
					const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
					query = query.gte('created_at', cutoff.toISOString())
				}
			}

			const { data, error } = await query
				.order('created_at', { ascending: false })
				.limit(100)

			if (error) {
				return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
			}

			return NextResponse.json(data ?? [])
		} catch (error) {
			console.error('[v0] Company reports GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

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
				reportType = 'monthly_summary',
				propertyId,
				startDate,
				endDate,
				includeCharts = true,
				includeDetails = true,
				format = 'pdf'
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
				: new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000)

			// Create report record
			const { data: reportData, error: insertError } = await auth.supabase
				.from('reports')
				.insert({
					company_id: id,
					property_id: propertyId || null,
					report_type: reportType,
					period_start: startDateObj.toISOString(),
					period_end: endDateObj.toISOString(),
					status: 'generating',
					generated_by: auth.user.id,
					format,
					settings: {
						includeCharts,
						includeDetails,
						timeframe: Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
					}
				})
				.select()
				.single()

			if (insertError) {
				return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
			}

			// TODO: Trigger background report generation here
			// For now, we'll mark it as completed immediately
			const { error: updateError } = await auth.supabase
				.from('reports')
				.update({ 
					status: 'completed',
					generated_at: new Date().toISOString()
				})
				.eq('id', reportData.id)

			if (updateError) {
				console.error('Failed to update report status:', updateError)
			}

			return NextResponse.json({
				report: reportData,
				message: 'Report generation started'
			})

		} catch (error) {
			console.error('[v0] Company reports POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)


