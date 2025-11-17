import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET() {
	try {
		const supabase = createServerSupabase()
		// Try to read active campaigns if table exists; otherwise fall back to empty list
		const { data, error } = await supabase
			.from('campaigns')
			.select('id,name,channel,status,created_at')
			.in('status', ['preparing', 'sending'])
			.order('created_at', { ascending: false })

		if (error) {
			// Table may not exist yet; return empty list gracefully
			return NextResponse.json([], { status: 200 })
		}

		return NextResponse.json(data ?? [], { status: 200 })
	} catch {
		return NextResponse.json([], { status: 200 })
	}
}


