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

			// Get teams - assuming teams table exists with company_id
			// If teams don't exist, we'll return empty array for now
			const { data: teams, error: teamsError } = await auth.supabase
				.from('teams')
				.select(`
					id,
					name,
					description,
					created_at,
					members:team_members(
						id,
						user_id,
						role,
						user:users(id, full_name, email)
					)
				`)
				.eq('company_id', id)
				.order('created_at', { ascending: false })

			if (teamsError) {
				// If teams table doesn't exist, return empty array
				if (teamsError.code === '42P01') {
					return NextResponse.json({ teams: [] })
				}
				console.error('[v0] Company teams GET error:', teamsError)
				return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 })
			}

			// Also get all cleaners/providers associated with the company
			const { data: providers, error: providersError } = await auth.supabase
				.from('provider_profiles')
				.select(`
					id,
					business_name,
					email,
					phone,
					status,
					created_at
				`)
				.eq('company_id', id)
				.order('created_at', { ascending: false })

			if (providersError && providersError.code !== '42P01') {
				console.error('[v0] Company providers GET error:', providersError)
			}

			return NextResponse.json({
				teams: teams ?? [],
				providers: providers ?? [],
			})
		} catch (error) {
			console.error('[v0] Company teams GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

