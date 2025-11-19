import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

export const GET = withAuth(
	async (request: NextRequest, { user, supabase }) => {
		try {
			const { searchParams } = new URL(request.url)
			const requestedUserId = searchParams.get('user_id')
			const limit = parseInt(searchParams.get('limit') || '50')
			
			// If user_id is provided, verify the authenticated user owns it (unless admin)
			const userId = requestedUserId || user.id
			const isAdmin = isAdminRole(user.role)
			
			if (!isAdmin && userId !== user.id) {
				return NextResponse.json(
					{ error: 'You can only view your own loyalty transactions' },
					{ status: 403 }
				)
			}
		
			const { data: transactions, error } = await supabase
				.from('loyalty_transactions')
				.select('*')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(limit)
		
		if (error) {
			console.error('[loyalty] transactions fetch error', error)
			return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
		}
		
		return NextResponse.json({ transactions: transactions || [] })
	} catch (e) {
		console.error('[loyalty] transactions error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
	}
)

