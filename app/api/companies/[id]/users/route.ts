import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

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
			const role = searchParams.get('role')

			// Check if user is a member of this company or is an admin
			const isAdmin = isAdminRole(auth.user.role)
			
			if (!isAdmin) {
				// Verify user is a member of this company
				const { data: membership } = await auth.supabase
					.from('company_users')
					.select('id')
					.eq('company_id', id)
					.eq('user_id', auth.user.id)
					.eq('status', 'active')
					.single()

				if (!membership) {
					return NextResponse.json(
						{ error: 'You do not have access to this company' },
						{ status: 403 }
					)
				}
			}

			let query = auth.supabase
				.from('company_users')
				.select(`
					*,
					user:users(id, email, full_name, phone, avatar_url, role)
				`)
				.eq('company_id', id)
				.order('created_at', { ascending: false })

			if (status) {
				query = query.eq('status', status)
			}

			if (role) {
				query = query.eq('role', role)
			}

			const { data, error } = await query

			if (error) {
				console.error('[v0] Company users GET error:', error)
				return NextResponse.json({ error: 'Failed to load company users' }, { status: 500 })
			}

			return NextResponse.json({ users: data ?? [] })
		} catch (error) {
			console.error('[v0] Company users GET error:', error)
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
			const { user_id, role, permissions, status } = body

			if (!user_id) {
				return NextResponse.json(
					{ error: 'user_id is required' },
					{ status: 400 }
				)
			}

			// Check if user is a member of this company or is an admin
			const isAdmin = isAdminRole(auth.user.role)
			
			if (!isAdmin) {
				// Verify user is a member (and preferably an admin/owner) of this company
				const { data: membership } = await auth.supabase
					.from('company_users')
					.select('role')
					.eq('company_id', id)
					.eq('user_id', auth.user.id)
					.eq('status', 'active')
					.single()

				if (!membership) {
					return NextResponse.json(
						{ error: 'You do not have access to this company' },
						{ status: 403 }
					)
				}

				// Only admins and owners can add users
				if (!['admin', 'owner'].includes(membership.role)) {
					return NextResponse.json(
						{ error: 'You do not have permission to add users to this company' },
						{ status: 403 }
					)
				}
			}

			const { data, error } = await auth.supabase
				.from('company_users')
				.insert({
					company_id: id,
					user_id,
					role: role || 'member',
					permissions: permissions || {},
					status: status || 'active',
					invited_by: auth.user.id,
					invited_at: new Date().toISOString(),
				})
				.select(`
					*,
					user:users(id, email, full_name, phone, avatar_url, role)
				`)
				.single()

			if (error) {
				console.error('[v0] Company user POST error:', error)
				if (error.code === '23505') {
					return NextResponse.json({ error: 'User is already a member of this company' }, { status: 409 })
				}
				return NextResponse.json({ error: 'Failed to add user to company' }, { status: 500 })
			}

			return NextResponse.json({ user: data }, { status: 201 })
		} catch (error) {
			console.error('[v0] Company user POST error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

