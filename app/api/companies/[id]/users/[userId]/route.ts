import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'

export const PATCH = withAuth(
	async (
		request: NextRequest,
		auth: { user: any, supabase: any, tenantId: string | null },
		context?: { params: { id: string; userId: string } }
	) => {
		try {
			if (!context?.params?.id || !context?.params?.userId) {
				return NextResponse.json({ error: 'Company ID and User ID are required' }, { status: 400 })
			}

			const { id, userId } = context.params

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
			const { role, permissions, status } = body

			const updateData: any = {}
			
			if (role !== undefined) updateData.role = role
			if (permissions !== undefined) updateData.permissions = permissions
			if (status !== undefined) updateData.status = status
			if (status === 'active' && !updateData.joined_at) {
				updateData.joined_at = new Date().toISOString()
			}

			const { data, error } = await auth.supabase
				.from('company_users')
				.update(updateData)
				.eq('id', userId)
				.eq('company_id', id)
				.select(`
					*,
					user:users(id, email, full_name, phone, avatar_url, role)
				`)
				.single()

			if (error) {
				console.error('[v0] Company user PATCH error:', error)
				return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
			}

			return NextResponse.json({ user: data })
		} catch (error) {
			console.error('[v0] Company user PATCH error:', error)
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
		context?: { params: { id: string; userId: string } }
	) => {
		try {
			if (!context?.params?.id || !context?.params?.userId) {
				return NextResponse.json({ error: 'Company ID and User ID are required' }, { status: 400 })
			}

			const { id, userId } = context.params

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
				.from('company_users')
				.delete()
				.eq('id', userId)
				.eq('company_id', id)

			if (error) {
				console.error('[v0] Company user DELETE error:', error)
				return NextResponse.json({ error: 'Failed to remove user from company' }, { status: 500 })
			}

			return NextResponse.json({ message: 'User removed from company successfully' })
		} catch (error) {
			console.error('[v0] Company user DELETE error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

