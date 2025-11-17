import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

	try {
		const supabase = createServerSupabase()
		// Fetch bookings for the given date; join minimal customer/provider/service info where possible
		const { data, error } = await supabase
			.from('bookings')
			.select(`
        id,
        booking_date,
        booking_time,
        status,
        duration_hours,
        total_amount,
        special_instructions,
        customer:customer_id ( id, full_name, phone ),
        provider:provider_id ( id, business_name ),
        service:service_id ( name, base_price )
      `)
			.eq('booking_date', date)
			.order('booking_time', { ascending: true })

		if (error) {
			console.error('[v0] Live jobs supabase error:', error)
			return NextResponse.json([], { status: 200 })
		}

		const jobs = (data ?? []).map((b: any) => {
			const startTime = `${b.booking_date}T${b.booking_time}`
			return {
				id: b.id,
				customer: {
					name: b.customer?.full_name || 'Customer',
					phone: b.customer?.phone || '',
					address: '', // address join not included here
				},
				provider: b.provider
					? {
							id: b.provider.id,
							name: b.provider.business_name,
							phone: '', // phone not on provider_profiles schema
					  }
					: null,
				service: {
					name: b.service?.name || 'Service',
					duration: Number(b.duration_hours || 0),
					price: Number(b.total_amount || b.service?.base_price || 0),
				},
				startTime,
				status:
					b.status === 'in-progress'
						? 'in_progress'
						: (b.status as 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled') || 'scheduled',
				location: { lat: 0, lng: 0 },
				urgency: 'low' as const,
				notes: b.special_instructions || undefined,
			}
		})

		return NextResponse.json(jobs)
	} catch (e) {
		console.error('[v0] Live jobs error:', e)
		return NextResponse.json([], { status: 200 })
	}
}


