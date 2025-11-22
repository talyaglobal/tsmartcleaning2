import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(async (request: NextRequest, { user, supabase, tenantId }) => {
	try {
		const { searchParams } = new URL(request.url)
		const limit = parseInt(searchParams.get('limit') || '20')
		const resolvedTenantId = tenantId || resolveTenantFromRequest(request)
		
		// Get audit events for recent activity
		const { data: auditEvents, error: auditError } = await supabase
			.from('audit_events')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit)

		if (auditError) {
			console.error('[activity] Error fetching audit events:', auditError)
			return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
		}

		// Transform audit events into activity items
		const activities = (auditEvents || []).map((event: any) => {
			let type: 'job_assigned' | 'job_completed' | 'provider_joined' | 'payment_processed' = 'job_assigned'
			let message = `${event.action} on ${event.resource}`

			// Map audit actions to activity types and messages
			switch (event.action) {
				case 'assign_provider':
				case 'auto_assign_provider':
					type = 'job_assigned'
					message = `Provider assigned to job #${event.resource_id?.slice(0, 8) || 'unknown'}`
					break
				case 'update_status':
					if (event.metadata?.status === 'completed') {
						type = 'job_completed'
						message = `Job #${event.resource_id?.slice(0, 8) || 'unknown'} completed`
					} else {
						message = `Job #${event.resource_id?.slice(0, 8) || 'unknown'} status updated to ${event.metadata?.status || 'unknown'}`
					}
					break
				case 'create':
					if (event.resource === 'provider_profile') {
						type = 'provider_joined'
						message = 'New provider joined the platform'
					} else if (event.resource === 'booking') {
						message = `New booking created #${event.resource_id?.slice(0, 8) || 'unknown'}`
					}
					break
				case 'payment_processed':
					type = 'payment_processed'
					message = `Payment processed for job #${event.resource_id?.slice(0, 8) || 'unknown'}`
					break
				default:
					message = `${event.action} performed on ${event.resource} #${event.resource_id?.slice(0, 8) || 'unknown'}`
			}

			return {
				id: event.id,
				type,
				message,
				timestamp: event.created_at,
				relatedId: event.resource_id,
			}
		})

		// Also fetch recent bookings to supplement activity
		const today = new Date().toISOString().split('T')[0]
		const { data: recentBookings, error: bookingsError } = await supabase
			.from('bookings')
			.select(`
				id,
				status,
				created_at,
				updated_at,
				customer:customer_id (full_name),
				provider:provider_id (business_name)
			`)
			.eq('booking_date', today)
			.order('updated_at', { ascending: false })
			.limit(10)

		// Add booking-specific activities
		if (recentBookings && !bookingsError) {
			const bookingActivities = recentBookings
				.filter(b => b.updated_at !== b.created_at) // Only include bookings that have been updated
				.map((booking: any) => ({
					id: `booking-${booking.id}`,
					type: booking.status === 'completed' ? 'job_completed' as const : 'job_assigned' as const,
					message: booking.status === 'completed' 
						? `${booking.customer?.full_name || 'Customer'}'s cleaning service completed`
						: `${booking.customer?.full_name || 'Customer'}'s booking updated`,
					timestamp: booking.updated_at,
					relatedId: booking.id,
				}))

			// Merge and sort activities
			const allActivities = [...activities, ...bookingActivities]
				.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
				.slice(0, limit)

			return NextResponse.json({ activities: allActivities })
		}

		return NextResponse.json({ activities })
	} catch (error: any) {
		console.error('[activity] Error:', error)
		return NextResponse.json({ error: error.message || 'Failed to fetch activity' }, { status: 500 })
	}
}, { requireAdmin: true })