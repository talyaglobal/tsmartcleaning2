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
			const tenantId = auth.tenantId || resolveTenantFromRequest(request)

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

			const { data, error } = await auth.supabase
				.from('companies')
				.select('*')
				.eq('id', id)
				.single()

			if (error) {
				if (error.code === 'PGRST116') {
					return NextResponse.json({ error: 'Company not found' }, { status: 404 })
				}
				console.error('[v0] Company GET error:', error)
				return NextResponse.json(
					{ error: 'Failed to load company' },
					{ status: 500 }
				)
			}

			return NextResponse.json(data)
		} catch (error) {
			console.error('[v0] Company GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)


