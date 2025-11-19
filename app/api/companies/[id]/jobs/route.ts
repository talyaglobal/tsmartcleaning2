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
			const { searchParams } = new URL(request.url)
			const status = searchParams.get('status')
			const limit = parseInt(searchParams.get('limit') || '50')
			const offset = parseInt(searchParams.get('offset') || '0')

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
				.from('jobs')
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
				.eq('company_id', id)
				.order('scheduled_date', { ascending: false })
				.order('scheduled_time', { ascending: false })
				.range(offset, offset + limit - 1)

			if (status) {
				query = query.eq('status', status)
			}

			const { data, error } = await query

			if (error) {
				console.error('[v0] Company jobs GET error:', error)
				return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
			}

			return NextResponse.json({ jobs: data ?? [] })
		} catch (error) {
			console.error('[v0] Company jobs GET error:', error)
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
			const {
				service_id,
				customer_id,
				provider_id,
				scheduled_date,
				scheduled_time,
				total_amount,
				notes,
				status = 'scheduled',
			} = body

			// Validate required fields
			if (!service_id || !customer_id || !scheduled_date || !scheduled_time) {
				return NextResponse.json(
					{ error: 'Missing required fields: service_id, customer_id, scheduled_date, scheduled_time' },
					{ status: 400 }
				)
			}

			// Check if customer exists (could be email or ID)
			let customerId = customer_id
			if (!customer_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
				// Looks like an email, try to find user
				const { data: userData } = await auth.supabase
					.from('users')
					.select('id')
					.eq('email', customer_id)
					.single()

				if (!userData) {
					return NextResponse.json(
						{ error: 'Customer not found. Please provide a valid customer ID or email.' },
						{ status: 404 }
					)
				}
				customerId = userData.id
			}

			// Get tenant_id from company
			const { data: companyData } = await auth.supabase
				.from('companies')
				.select('tenant_id')
				.eq('id', id)
				.single()

			if (!companyData) {
				return NextResponse.json(
					{ error: 'Company not found' },
					{ status: 404 }
				)
			}

			// Create job
			const { data: jobData, error: jobError } = await auth.supabase
				.from('jobs')
				.insert({
					tenant_id: companyData.tenant_id,
					company_id: id,
					service_id,
					customer_id: customerId,
					provider_id: provider_id || null,
					scheduled_date,
					scheduled_time,
					total_amount: total_amount ? parseFloat(total_amount) : null,
					notes: notes || null,
					status,
				})
				.select()
				.single()

			if (jobError) {
				console.error('[v0] Company jobs POST error:', jobError)
				return NextResponse.json(
					{ error: 'Failed to create job', details: jobError.message },
					{ status: 500 }
				)
			}

			return NextResponse.json({ job: jobData }, { status: 201 })
		} catch (error) {
			console.error('[v0] Company jobs POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

