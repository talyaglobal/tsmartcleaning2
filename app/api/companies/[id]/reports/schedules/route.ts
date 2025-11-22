import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'
import { scheduleReport } from '@/lib/report-scheduler'

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

			const { data, error } = await auth.supabase
				.from('report_schedules')
				.select(`
					*,
					properties(name),
					users!report_schedules_created_by_fkey(email)
				`)
				.eq('company_id', id)
				.order('created_at', { ascending: false })

			if (error) {
				return NextResponse.json({ error: 'Failed to load schedules' }, { status: 500 })
			}

			return NextResponse.json(data ?? [])
		} catch (error) {
			console.error('[v0] Company report schedules GET error:', error)
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
				frequency,
				recipients,
				scheduleSettings = {},
				isActive = true
			} = body

			// Validate required fields
			if (!frequency || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
				return NextResponse.json(
					{ error: 'frequency and recipients array are required' },
					{ status: 400 }
				)
			}

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

			// Use the existing report scheduler
			const schedule = await scheduleReport({
				companyId: id,
				propertyId,
				frequency: frequency as 'daily' | 'weekly' | 'monthly',
				recipients
			})

			// Update with additional settings
			const { data: updatedSchedule, error: updateError } = await auth.supabase
				.from('report_schedules')
				.update({
					report_type: reportType,
					is_active: isActive,
					settings: scheduleSettings,
					created_by: auth.user.id
				})
				.eq('id', schedule.id)
				.select()
				.single()

			if (updateError) {
				console.error('Failed to update schedule:', updateError)
			}

			return NextResponse.json({
				schedule: updatedSchedule || schedule,
				message: 'Report schedule created successfully'
			})

		} catch (error) {
			console.error('[v0] Company report schedules POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

export const PATCH = withAuth(
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
			const { scheduleId, ...updates } = body

			if (!scheduleId) {
				return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
			}

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

			const { data, error } = await auth.supabase
				.from('report_schedules')
				.update(updates)
				.eq('id', scheduleId)
				.eq('company_id', id)
				.select()
				.single()

			if (error) {
				return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
			}

			return NextResponse.json({
				schedule: data,
				message: 'Schedule updated successfully'
			})

		} catch (error) {
			console.error('[v0] Company report schedules PATCH error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

export const DELETE = withAuth(
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
			const scheduleId = url.searchParams.get('scheduleId')

			if (!scheduleId) {
				return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
			}

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

			const { error } = await auth.supabase
				.from('report_schedules')
				.update({ is_active: false })
				.eq('id', scheduleId)
				.eq('company_id', id)

			if (error) {
				return NextResponse.json({ error: 'Failed to deactivate schedule' }, { status: 500 })
			}

			return NextResponse.json({
				message: 'Schedule deactivated successfully'
			})

		} catch (error) {
			console.error('[v0] Company report schedules DELETE error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)