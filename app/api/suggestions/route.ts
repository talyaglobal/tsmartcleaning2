import { NextRequest, NextResponse } from 'next/server'
import { generateSuggestionsForUser } from '@/lib/suggestions'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

export const GET = withAuth(
	async (request: NextRequest, { user }) => {
		try {
			const { searchParams } = new URL(request.url)
			const requestedUserId = searchParams.get('userId')
			const roleParam = (searchParams.get('role') || 'customer').toLowerCase()
			const role = (roleParam === 'provider' || roleParam === 'admin') ? roleParam : 'customer'

			// If userId is provided, verify the authenticated user owns it (unless admin)
			const userId = requestedUserId || user.id
			const isAdmin = isAdminRole(user.role)
			
			if (!isAdmin && userId !== user.id) {
				return NextResponse.json(
					{ error: 'You can only view suggestions for your own account' },
					{ status: 403 }
				)
			}

			const suggestions = await generateSuggestionsForUser(userId, role as 'customer' | 'provider' | 'admin')
			return NextResponse.json({ suggestions })
		} catch (error) {
			console.error('[v0] Suggestions GET error:', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	}
)


