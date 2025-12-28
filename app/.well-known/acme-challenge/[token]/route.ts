import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
	try {
		const params = await context.params
		const token = (params.token || '').trim()
		if (!token) {
			return new NextResponse('Not Found', { status: 404 })
		}
		// ACME validation hits plain HTTP; we cannot rely on tenant context here.
		const supabase = createServerSupabase()
		const { data, error } = await supabase
			.from('domain_acme_challenges')
			.select('key_authorization')
			.eq('token', token)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle()
		if (error || !data?.key_authorization) {
			return new NextResponse('Not Found', { status: 404 })
		}
		return new NextResponse(data.key_authorization, {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})
	} catch {
		return new NextResponse('Not Found', { status: 404 })
	}
}


