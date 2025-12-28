import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const PATCH = withAuth(
	async (
		request: NextRequest,
		{ supabase: authSupabase },
		{ params }: { params: Promise<{ id: string }> }
	) => {
		try {
			const { verified, notes } = await request.json().catch(() => ({}))
			
			if (typeof verified !== 'boolean') {
				return NextResponse.json(
					{ error: 'verified (boolean) is required' },
					{ status: 400 }
				)
			}

			const supabase = authSupabase || createServerSupabase()
			
			// Update company verification status
			const { data, error } = await supabase
				.from('companies')
				.update({ verified, notes: notes || null })
				.eq('id', params.id)
				.select()
				.single()

			if (error) {
				console.error('[admin:companies:verify] update error:', error)
				return NextResponse.json(
					{ error: 'Failed to update verification status' },
					{ status: 500 }
				)
			}

			// Optionally log verification action (if audit table exists)
			// This could be added to an audit_log or company_verification_history table

			return NextResponse.json({ 
				success: true, 
				company: data,
				message: verified ? 'Company verified successfully' : 'Company verification removed'
			})
	} catch (error) {
		console.error('[admin:companies:verify] error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
},
{
	requireAdmin: true,
}
)

