import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET() {
	try {
		const supabase = createServerSupabase()
		const { data, error } = await supabase
			.from('provider_profiles')
			.select('id, business_name, availability_status, rating, total_bookings')
			.order('updated_at', { ascending: false })

		if (error) {
			console.error('[v0] Get available providers supabase error:', error)
			return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 })
		}

		const providers = (data ?? []).map((p) => ({
			id: p.id,
			name: (p as any).business_name,
			isActive: true,
			isAvailable: (p as any).availability_status === 'available',
			currentJob: null,
			eta: undefined,
			location: undefined,
			todayJobs: undefined,
			rating: Number((p as any).rating || 0),
			nextJob: undefined,
		}))

		return NextResponse.json(providers)
	} catch (e) {
		console.error('[v0] Get available providers error:', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


