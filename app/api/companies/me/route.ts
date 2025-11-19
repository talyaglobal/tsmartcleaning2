import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createAnonSupabase(tenantId)
		
		// Get the current user from the session
		const {
			data: { session },
		} = await supabase.auth.getSession()

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id
		const serverSupabase = createServerSupabase(tenantId)

		// Try to get company from users table first
		const { data: userData, error: userError } = await serverSupabase
			.from('users')
			.select('company_id')
			.eq('id', userId)
			.single()

		if (!userError && userData?.company_id) {
			// Get company details
			const { data: company, error: companyError } = await serverSupabase
				.from('companies')
				.select('*')
				.eq('id', userData.company_id)
				.single()

			if (!companyError && company) {
				return NextResponse.json({ company })
			}
		}

		// Fallback: try to find company by user email or name
		const { data: companies, error: companiesError } = await serverSupabase
			.from('companies')
			.select('*')
			.eq('email', session.user.email || '')
			.limit(1)

		if (!companiesError && companies && companies.length > 0) {
			return NextResponse.json({ company: companies[0] })
		}

		// If no company found, return null
		return NextResponse.json({ company: null })
	} catch (error) {
		console.error('[v0] Get company for user error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

