import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createServerSupabase()
		const { data, error } = await supabase
			.from('reports')
			.select('*')
			.eq('company_id', params.id)
			.order('created_at', { ascending: false })
			.limit(50)

		if (error) {
			return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
		}

		return NextResponse.json(data ?? [])
	} catch (error) {
		console.error('[v0] Company reports GET error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}


