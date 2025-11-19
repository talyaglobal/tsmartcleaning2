import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (
		request: NextRequest,
		auth: { user: any, supabase: any, tenantId: string | null },
		context?: { params: { id: string; propertyId: string } }
	) => {
		try {
			if (!context?.params?.id || !context?.params?.propertyId) {
				return NextResponse.json({ error: 'Company ID and Property ID are required' }, { status: 400 })
			}

			const { id, propertyId } = context.params

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
				.eq('id', propertyId)
				.eq('company_id', id)
				.single()

			if (error) {
				return NextResponse.json({ error: 'Property not found' }, { status: 404 })
			}

			return NextResponse.json({ property: data })
		} catch (error) {
			console.error('[v0] Company property GET error:', error)
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
		context?: { params: { id: string; propertyId: string } }
	) => {
		try {
			if (!context?.params?.id || !context?.params?.propertyId) {
				return NextResponse.json({ error: 'Company ID and Property ID are required' }, { status: 400 })
			}

			const { id, propertyId } = context.params

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

			const updateData: any = {}
			
			if (name !== undefined) updateData.name = name
			if (address !== undefined) updateData.address = address
			if (city !== undefined) updateData.city = city
			if (state !== undefined) updateData.state = state
			if (zip_code !== undefined) updateData.zip_code = zip_code
			if (property_type !== undefined) updateData.property_type = property_type
			if (square_feet !== undefined) updateData.square_feet = square_feet
			if (bedrooms !== undefined) updateData.bedrooms = bedrooms
			if (bathrooms !== undefined) updateData.bathrooms = bathrooms
			if (status !== undefined) updateData.status = status
			if (notes !== undefined) updateData.notes = notes

			const { data, error } = await auth.supabase
				.from('properties')
				.update(updateData)
				.eq('id', propertyId)
				.eq('company_id', id)
				.select()
				.single()

			if (error) {
				console.error('[v0] Company property PATCH error:', error)
				return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
			}

			return NextResponse.json({ property: data })
		} catch (error) {
			console.error('[v0] Company property PATCH error:', error)
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
		context?: { params: { id: string; propertyId: string } }
	) => {
		try {
			if (!context?.params?.id || !context?.params?.propertyId) {
				return NextResponse.json({ error: 'Company ID and Property ID are required' }, { status: 400 })
			}

			const { id, propertyId } = context.params

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
				.from('properties')
				.delete()
				.eq('id', propertyId)
				.eq('company_id', id)

			if (error) {
				console.error('[v0] Company property DELETE error:', error)
				return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
			}

			return NextResponse.json({ message: 'Property deleted successfully' })
		} catch (error) {
			console.error('[v0] Company property DELETE error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

