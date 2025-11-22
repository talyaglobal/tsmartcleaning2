import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'
import { withAuthAndParams } from '@/lib/auth/rbac'

const VALID_STATUSES = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'refunded'] as const
type BookingStatus = typeof VALID_STATUSES[number]

// Map operations dashboard status to database status
const statusMap: Record<string, BookingStatus> = {
	scheduled: 'confirmed',
	en_route: 'confirmed',
	in_progress: 'in-progress',
	completed: 'completed',
	cancelled: 'cancelled',
}

export const PATCH = withAuthAndParams(async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }, { params }: { params: { id: string } }) => {
	try {
		const jobId = params.id
		const { status } = await request.json()

		if (!status) {
			return NextResponse.json({ error: 'status is required' }, { status: 400 })
		}

		const tenantId = authTenantId || resolveTenantFromRequest(request)
		const supabase = authSupabase || createServerSupabase(tenantId ?? undefined)

		// Verify the booking exists
		const { data: booking, error: bookingError } = await supabase
			.from('bookings')
			.select('id, status, provider_id, customer_id, tenant_id')
			.eq('id', jobId)
			.single()

		if (bookingError || !booking) {
			return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
		}

		// Map operations status to database status
		const dbStatus = statusMap[status] || (VALID_STATUSES.includes(status as BookingStatus) ? (status as BookingStatus) : null)
		if (!dbStatus) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}

		// Prepare update object with appropriate timestamps
		const updateData: any = {
			status: dbStatus,
			updated_at: new Date().toISOString(),
		}

		// Set appropriate timestamp based on status
		if (dbStatus === 'in-progress' && booking.status !== 'in-progress') {
			updateData.started_at = new Date().toISOString()
		} else if (dbStatus === 'completed' && booking.status !== 'completed') {
			updateData.completed_at = new Date().toISOString()
		} else if (dbStatus === 'cancelled' && booking.status !== 'cancelled') {
			updateData.cancelled_at = new Date().toISOString()
		}

		// Update the booking status
		const { error: updateError } = await supabase
			.from('bookings')
			.update(updateData)
			.eq('id', jobId)

		if (updateError) {
			console.error('[status] Update booking error:', updateError)
			return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
		}

		// Update provider availability when job is completed or cancelled
		if ((dbStatus === 'completed' || dbStatus === 'cancelled') && booking.provider_id) {
			// Check if provider has other active jobs
			const { data: activeJobs } = await supabase
				.from('bookings')
				.select('id')
				.eq('provider_id', booking.provider_id)
				.in('status', ['confirmed', 'in-progress'])
				.neq('id', jobId)
				.limit(1)

			if (!activeJobs || activeJobs.length === 0) {
				await supabase
					.from('provider_profiles')
					.update({
						availability_status: 'available',
						updated_at: new Date().toISOString(),
					})
					.eq('id', booking.provider_id)
			}
		}

		// Create notifications for status changes
		const statusMessages: Record<BookingStatus, { title: string; message: string }> = {
			'confirmed': { title: 'Booking Confirmed', message: `Your booking has been confirmed` },
			'in-progress': { title: 'Service Started', message: `Service has started for your booking` },
			'completed': { title: 'Service Completed', message: `Your service has been completed` },
			'cancelled': { title: 'Booking Cancelled', message: `Your booking has been cancelled` },
			'refunded': { title: 'Refund Processed', message: `A refund has been processed for your booking` },
			'pending': { title: 'Booking Pending', message: `Your booking is pending confirmation` },
		}

		const notification = statusMessages[dbStatus]
		if (notification && booking.customer_id) {
			await supabase.from('notifications').insert({
				user_id: booking.customer_id,
				title: notification.title,
				message: notification.message,
				type: 'booking',
				related_booking_id: jobId,
			})
		}

		// Log audit event
		await logAuditEventFromRequest(request, {
			action: 'update_status',
			resource: 'booking',
			resourceId: jobId,
			metadata: { status: dbStatus, previousStatus: booking.status },
		})

		return NextResponse.json({ success: true, jobId, status: dbStatus })
	} catch (e: any) {
		console.error('[status] Error:', e)
		return NextResponse.json({ error: e.message || 'Status update failed' }, { status: 500 })
	}
},
{
	requireAdmin: true,
})


