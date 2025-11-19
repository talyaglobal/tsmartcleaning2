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

			const { data, error } = await auth.supabase
				.from('company_payment_methods')
				.select('*')
				.eq('company_id', id)
				.order('is_default', { ascending: false })
				.order('created_at', { ascending: false })

			if (error) {
				console.error('[v0] Company payment methods GET error:', error)
				return NextResponse.json({ error: 'Failed to load payment methods' }, { status: 500 })
			}

			return NextResponse.json({ payment_methods: data ?? [] })
		} catch (error) {
			console.error('[v0] Company payment methods GET error:', error)
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
				type,
				provider,
				provider_account_id,
				is_default,
				last4,
				brand,
				expiry_month,
				expiry_year,
				status,
				metadata,
			} = body

			if (!type) {
				return NextResponse.json(
					{ error: 'type is required' },
					{ status: 400 }
				)
			}

			// If this is set as default, unset other defaults
			if (is_default) {
				await auth.supabase
					.from('company_payment_methods')
					.update({ is_default: false })
					.eq('company_id', id)
			}

			const { data, error } = await auth.supabase
				.from('company_payment_methods')
				.insert({
					company_id: id,
					type,
					provider: provider || null,
					provider_account_id: provider_account_id || null,
					is_default: is_default || false,
					last4: last4 || null,
					brand: brand || null,
					expiry_month: expiry_month || null,
					expiry_year: expiry_year || null,
					status: status || 'active',
					metadata: metadata || {},
				})
				.select()
				.single()

			if (error) {
				console.error('[v0] Company payment method POST error:', error)
				return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 })
			}

			return NextResponse.json({ payment_method: data }, { status: 201 })
		} catch (error) {
			console.error('[v0] Company payment method POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

