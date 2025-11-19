import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)
		const today = new Date().toISOString().split('T')[0]

		const { data, error } = await supabase
			.from('provider_profiles')
			.select('id, business_name, availability_status, rating, total_bookings, user_id')
			.order('updated_at', { ascending: false })

		if (error) {
			console.error('[available-providers] Supabase error:', error)
			return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 })
		}

		// Get provider user IDs for phone numbers
		const userIds = (data ?? []).map((p: any) => p.user_id).filter(Boolean)
		let userPhones: Record<string, string> = {}
		if (userIds.length > 0) {
			const { data: users } = await supabase
				.from('users')
				.select('id, phone')
				.in('id', userIds)

			userPhones = (users || []).reduce((acc: Record<string, string>, u: any) => {
				acc[u.id] = u.phone || ''
				return acc
			}, {})
		}

		// Get today's jobs for each provider
		const providerIds = (data ?? []).map((p: any) => p.id)
		let todayJobsMap: Record<string, number> = {}
		let currentJobMap: Record<string, string> = {}
		let nextJobMap: Record<string, string> = {}

		if (providerIds.length > 0) {
			const { data: todayBookings } = await supabase
				.from('bookings')
				.select('id, provider_id, booking_time, status')
				.eq('booking_date', today)
				.in('provider_id', providerIds)
				.in('status', ['confirmed', 'in-progress'])
				.order('booking_time', { ascending: true })

			// Count jobs per provider
			;(todayBookings || []).forEach((b: any) => {
				const pid = b.provider_id
				todayJobsMap[pid] = (todayJobsMap[pid] || 0) + 1

				// Set current job if in-progress
				if (b.status === 'in-progress' && !currentJobMap[pid]) {
					currentJobMap[pid] = b.id
				}

				// Set next job (first upcoming confirmed job)
				if (b.status === 'confirmed' && !nextJobMap[pid]) {
					const bookingTime = new Date(`${today}T${b.booking_time}`)
					if (bookingTime > new Date()) {
						nextJobMap[pid] = b.id
					}
				}
			})
		}

		const providers = (data ?? []).map((p: any) => ({
			id: p.id,
			name: p.business_name,
			isActive: true,
			isAvailable: p.availability_status === 'available',
			currentJob: currentJobMap[p.id] || null,
			eta: undefined,
			location: undefined,
			todayJobs: todayJobsMap[p.id] || 0,
			rating: Number(p.rating || 0),
			nextJob: nextJobMap[p.id] || undefined,
			phone: userPhones[p.user_id] || '',
		}))

		return NextResponse.json(providers)
	} catch (e) {
		console.error('[available-providers] Error:', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


