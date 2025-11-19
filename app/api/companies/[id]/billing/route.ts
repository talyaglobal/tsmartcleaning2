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
				.from('company_billing_settings')
				.select('*')
				.eq('company_id', id)
				.single()

			if (error) {
				if (error.code === 'PGRST116') {
					// No billing settings found, return default
					return NextResponse.json({
						billing: {
							company_id: id,
							payment_terms: 'net_30',
							auto_pay: false,
							currency: 'USD',
						}
					})
				}
				console.error('[v0] Company billing GET error:', error)
				return NextResponse.json({ error: 'Failed to load billing settings' }, { status: 500 })
			}

			return NextResponse.json({ billing: data })
		} catch (error) {
			console.error('[v0] Company billing GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

export const PUT = withAuth(
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
				billing_email,
				billing_address,
				billing_city,
				billing_state,
				billing_zip_code,
				billing_country,
				payment_method,
				payment_terms,
				auto_pay,
				tax_id,
				currency,
				settings,
			} = body

			// Check if billing settings exist
			const { data: existing } = await auth.supabase
				.from('company_billing_settings')
				.select('id')
				.eq('company_id', id)
				.single()

			let data, error
			if (existing) {
				// Update existing
				const updateData: any = {}
				if (billing_email !== undefined) updateData.billing_email = billing_email
				if (billing_address !== undefined) updateData.billing_address = billing_address
				if (billing_city !== undefined) updateData.billing_city = billing_city
				if (billing_state !== undefined) updateData.billing_state = billing_state
				if (billing_zip_code !== undefined) updateData.billing_zip_code = billing_zip_code
				if (billing_country !== undefined) updateData.billing_country = billing_country
				if (payment_method !== undefined) updateData.payment_method = payment_method
				if (payment_terms !== undefined) updateData.payment_terms = payment_terms
				if (auto_pay !== undefined) updateData.auto_pay = auto_pay
				if (tax_id !== undefined) updateData.tax_id = tax_id
				if (currency !== undefined) updateData.currency = currency
				if (settings !== undefined) updateData.settings = settings

				const result = await auth.supabase
					.from('company_billing_settings')
					.update(updateData)
					.eq('company_id', id)
					.select()
					.single()
				data = result.data
				error = result.error
			} else {
				// Create new
				const result = await auth.supabase
					.from('company_billing_settings')
					.insert({
						company_id: id,
						billing_email: billing_email || null,
						billing_address: billing_address || null,
						billing_city: billing_city || null,
						billing_state: billing_state || null,
						billing_zip_code: billing_zip_code || null,
						billing_country: billing_country || 'US',
						payment_method: payment_method || null,
						payment_terms: payment_terms || 'net_30',
						auto_pay: auto_pay || false,
						tax_id: tax_id || null,
						currency: currency || 'USD',
						settings: settings || {},
					})
					.select()
					.single()
				data = result.data
				error = result.error
			}

			if (error) {
				console.error('[v0] Company billing PUT error:', error)
				return NextResponse.json({ error: 'Failed to update billing settings' }, { status: 500 })
			}

			return NextResponse.json({ billing: data })
		} catch (error) {
			console.error('[v0] Company billing PUT error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

