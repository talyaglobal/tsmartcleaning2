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

			const { searchParams } = new URL(request.url)
			const status = searchParams.get('status')
			const paymentStatus = searchParams.get('payment_status')
			const startDate = searchParams.get('start_date')
			const endDate = searchParams.get('end_date')
			const limit = parseInt(searchParams.get('limit') || '50')
			const offset = parseInt(searchParams.get('offset') || '0')

			let query = auth.supabase
				.from('invoices')
				.select(`
					id,
					invoice_number,
					invoice_date,
					due_date,
					period_start,
					period_end,
					subtotal,
					tax_amount,
					total_amount,
					paid_amount,
					currency,
					status,
					payment_status,
					paid_at,
					payment_method,
					description,
					created_at,
					updated_at
				`)
				.eq('company_id', id)
				.order('invoice_date', { ascending: false })
				.order('created_at', { ascending: false })
				.range(offset, offset + limit - 1)

			if (status) {
				query = query.eq('status', status)
			}

			if (paymentStatus) {
				query = query.eq('payment_status', paymentStatus)
			}

			if (startDate) {
				query = query.gte('invoice_date', startDate)
			}

			if (endDate) {
				query = query.lte('invoice_date', endDate)
			}

			const { data, error } = await query

			if (error) {
				console.error('[v0] Company invoices GET error:', error)
				return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 })
			}

			// Get total count for pagination
			let countQuery = auth.supabase
				.from('invoices')
				.select('*', { count: 'exact', head: true })
				.eq('company_id', id)

			if (status) {
				countQuery = countQuery.eq('status', status)
			}

			if (paymentStatus) {
				countQuery = countQuery.eq('payment_status', paymentStatus)
			}

			if (startDate) {
				countQuery = countQuery.gte('invoice_date', startDate)
			}

			if (endDate) {
				countQuery = countQuery.lte('invoice_date', endDate)
			}

			const { count } = await countQuery

			return NextResponse.json({
				invoices: data ?? [],
				total: count ?? 0,
				limit,
				offset,
			})
		} catch (error) {
			console.error('[v0] Company invoices GET error:', error)
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
				invoice_date,
				due_date,
				period_start,
				period_end,
				subtotal,
				tax_amount,
				total_amount,
				description,
				notes,
				line_items,
			} = body

			// Generate invoice number
			const { data: invoiceNumberData, error: invoiceNumberError } = await auth.supabase
				.rpc('generate_invoice_number', { company_id_param: id })

			if (invoiceNumberError) {
				console.error('[v0] Invoice number generation error:', invoiceNumberError)
				// Fallback to manual generation
				const year = new Date().getFullYear()
				const timestamp = Date.now()
				const invoiceNumber = `INV-${year}-${timestamp.toString().slice(-4)}`
				
				const { data, error } = await auth.supabase
					.from('invoices')
					.insert({
						company_id: id,
						invoice_number: invoiceNumber,
						invoice_date: invoice_date || new Date().toISOString().split('T')[0],
						due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
						period_start: period_start || null,
						period_end: period_end || null,
						subtotal: subtotal || 0,
						tax_amount: tax_amount || 0,
						total_amount: total_amount || (subtotal || 0) + (tax_amount || 0),
						description: description || null,
						notes: notes || null,
						line_items: line_items || [],
						status: 'draft',
						payment_status: 'pending',
					})
					.select()
					.single()

				if (error) {
					console.error('[v0] Company invoice POST error:', error)
					return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
				}

				return NextResponse.json({ invoice: data })
			}

			const invoiceNumber = invoiceNumberData

			const { data, error } = await auth.supabase
				.from('invoices')
				.insert({
					company_id: id,
					invoice_number: invoiceNumber,
					invoice_date: invoice_date || new Date().toISOString().split('T')[0],
					due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
					period_start: period_start || null,
					period_end: period_end || null,
					subtotal: subtotal || 0,
					tax_amount: tax_amount || 0,
					total_amount: total_amount || (subtotal || 0) + (tax_amount || 0),
					description: description || null,
					notes: notes || null,
					line_items: line_items || [],
					status: 'draft',
					payment_status: 'pending',
				})
				.select()
				.single()

			if (error) {
				console.error('[v0] Company invoice POST error:', error)
				return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
			}

			return NextResponse.json({ invoice: data })
		} catch (error) {
			console.error('[v0] Company invoice POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

