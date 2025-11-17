import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createServerSupabase()
		const { data, error } = await supabase
			.from('companies')
			.select('*')
			.eq('id', params.id)
			.single()

		if (error) {
			return NextResponse.json({ error: 'Company not found' }, { status: 404 })
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


