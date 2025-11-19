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
				.from('properties')
				.select('*')
				.eq('company_id', id)
				.order('created_at', { ascending: false })

			if (error) {
				return NextResponse.json({ error: 'Failed to load properties' }, { status: 500 })
			}

			return NextResponse.json(data ?? [])
		} catch (error) {
			console.error('[v0] Company properties GET error:', error)
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
				name,
				address,
				city,
				state,
				zip_code,
				property_type,
				square_feet,
				bedrooms,
				bathrooms,
				status,
				notes,
			} = body

			if (!name || !address || !city || !state || !zip_code) {
				return NextResponse.json(
					{ error: 'Name, address, city, state, and zip_code are required' },
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

			const { data, error } = await auth.supabase
				.from('properties')
				.insert({
					company_id: id,
					name,
					address,
					city,
					state,
					zip_code,
					property_type: property_type || null,
					square_feet: square_feet || null,
					bedrooms: bedrooms || null,
					bathrooms: bathrooms || null,
					status: status || 'active',
					notes: notes || null,
				})
				.select()
				.single()

			if (error) {
				console.error('[v0] Company property POST error:', error)
				return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
			}

			return NextResponse.json({ property: data }, { status: 201 })
		} catch (error) {
			console.error('[v0] Company property POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)


