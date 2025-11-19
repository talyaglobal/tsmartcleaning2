import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'

export const PATCH = withAuth(
	async (
		request: NextRequest,
		auth: { user: any, supabase: any, tenantId: string | null },
		context?: { params: { id: string; jobId: string } }
	) => {
		try {
			if (!context?.params?.id || !context?.params?.jobId) {
				return NextResponse.json({ error: 'Company ID and Job ID are required' }, { status: 400 })
			}

			const { id, jobId } = context.params

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

			const body = await request.json()
			const { status, provider_id, notes, completed_at } = body

			// Verify job belongs to company
			const { data: existingJob } = await auth.supabase
				.from('jobs')
				.select('company_id')
				.eq('id', jobId)
				.single()

			if (!existingJob) {
				return NextResponse.json(
					{ error: 'Job not found' },
					{ status: 404 }
				)
			}

			if (existingJob.company_id !== id) {
				return NextResponse.json(
					{ error: 'Job does not belong to this company' },
					{ status: 403 }
				)
			}

			// Build update object
			const updates: any = {}
			if (status !== undefined) {
				updates.status = status
			}
			if (provider_id !== undefined) {
				updates.provider_id = provider_id || null
			}
			if (notes !== undefined) {
				updates.notes = notes || null
			}
			if (completed_at !== undefined) {
				updates.completed_at = completed_at || null
			}
			updates.updated_at = new Date().toISOString()

			// Update job
			const { data: updatedJob, error: updateError } = await auth.supabase
				.from('jobs')
				.update(updates)
				.eq('id', jobId)
				.select(`
					id,
					status,
					scheduled_date,
					scheduled_time,
					completed_at,
					total_amount,
					notes,
					created_at,
					customer:customer_id(id, full_name, email, phone),
					provider:provider_id(id, business_name),
					service:service_id(id, name)
				`)
				.single()

			if (updateError) {
				console.error('[v0] Company job PATCH error:', updateError)
				return NextResponse.json(
					{ error: 'Failed to update job', details: updateError.message },
					{ status: 500 }
				)
			}

			return NextResponse.json({ job: updatedJob })
		} catch (error) {
			console.error('[v0] Company job PATCH error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

