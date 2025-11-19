import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)

		// Fetch bookings for the given date; join customer/provider/service/address info
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
        provider:provider_id ( id, business_name, user_id ),
        service:service_id ( name, base_price ),
        address:address_id ( street_address, apt_suite, city, state, zip_code, latitude, longitude )
      `)
			.eq('booking_date', date)
			.order('booking_time', { ascending: true })

		if (error) {
			console.error('[live-jobs] Supabase error:', error)
			return NextResponse.json([], { status: 200 })
		}

		// Get provider phone numbers from users table
		const providerIds = (data ?? [])
			.map((b: any) => b.provider?.user_id)
			.filter(Boolean) as string[]

		let providerPhones: Record<string, string> = {}
		if (providerIds.length > 0) {
			const { data: providerUsers } = await supabase
				.from('users')
				.select('id, phone')
				.in('id', providerIds)

			providerPhones = (providerUsers || []).reduce((acc: Record<string, string>, u: any) => {
				acc[u.id] = u.phone || ''
				return acc
			}, {})
		}

		const jobs = (data ?? []).map((b: any) => {
			const startTime = `${b.booking_date}T${b.booking_time}`
			const address = b.address
			const addressString = address
				? `${address.street_address}${address.apt_suite ? ' ' + address.apt_suite : ''}, ${address.city}, ${address.state} ${address.zip_code}`
				: 'Address not available'

			// Determine urgency based on time until booking
			const bookingDateTime = new Date(startTime)
			const now = new Date()
			const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
			let urgency: 'low' | 'medium' | 'high' = 'low'
			if (hoursUntilBooking < 2 && hoursUntilBooking > 0) {
				urgency = 'high'
			} else if (hoursUntilBooking < 4 && hoursUntilBooking > 0) {
				urgency = 'medium'
			}

			// Map database status to operations dashboard status
			let opsStatus: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled' = 'scheduled'
			if (b.status === 'in-progress') {
				opsStatus = 'in_progress'
			} else if (b.status === 'completed') {
				opsStatus = 'completed'
			} else if (b.status === 'cancelled') {
				opsStatus = 'cancelled'
			} else if (b.status === 'confirmed') {
				opsStatus = 'scheduled'
			}

			return {
				id: b.id,
				customer: {
					name: b.customer?.full_name || 'Customer',
					phone: b.customer?.phone || '',
					address: addressString,
				},
				provider: b.provider
					? {
							id: b.provider.id,
							name: b.provider.business_name,
							phone: providerPhones[b.provider.user_id] || '',
					  }
					: null,
				service: {
					name: b.service?.name || 'Service',
					duration: Number(b.duration_hours || 0),
					price: Number(b.total_amount || b.service?.base_price || 0),
				},
				startTime,
				status: opsStatus,
				location: {
					lat: address?.latitude ? Number(address.latitude) : 0,
					lng: address?.longitude ? Number(address.longitude) : 0,
				},
				urgency,
				notes: b.special_instructions || undefined,
			}
		})

		return NextResponse.json(jobs)
	} catch (e) {
		console.error('[live-jobs] Error:', e)
		return NextResponse.json([], { status: 200 })
	}
}


