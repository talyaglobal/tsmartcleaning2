import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get status history for a job
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: jobId } = await params
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)

		// Verify the booking exists
		const { data: booking, error: bookingError } = await supabase
			.from('bookings')
			.select('id, status, created_at, confirmed_at, started_at, completed_at, cancelled_at')
			.eq('id', jobId)
			.single()

		if (bookingError || !booking) {
			return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
		}

		// Build status history from timestamps
		const history: Array<{ status: string; timestamp: string; note?: string }> = []

		if (booking.created_at) {
			history.push({
				status: 'pending',
				timestamp: booking.created_at,
				note: 'Booking created',
			})
		}

		if (booking.confirmed_at && booking.confirmed_at !== booking.created_at) {
			history.push({
				status: 'confirmed',
				timestamp: booking.confirmed_at,
				note: 'Booking confirmed',
			})
		}

		if (booking.started_at) {
			history.push({
				status: 'in-progress',
				timestamp: booking.started_at,
				note: 'Service started',
			})
		}

		if (booking.completed_at) {
			history.push({
				status: 'completed',
				timestamp: booking.completed_at,
				note: 'Service completed',
			})
		}

		if (booking.cancelled_at) {
			history.push({
				status: 'cancelled',
				timestamp: booking.cancelled_at,
				note: 'Booking cancelled',
			})
		}

		// Sort by timestamp
		history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

		return NextResponse.json({ history })
	} catch (e: any) {
		console.error('[status-history] Error:', e)
		return NextResponse.json({ error: e.message || 'Failed to fetch status history' }, { status: 500 })
	}
}

