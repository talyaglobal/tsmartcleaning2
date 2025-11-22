import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'
import { withAuthAndParams } from '@/lib/auth/rbac'

export const POST = withAuthAndParams(async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }, { params }: { params: { id: string } }) => {
	try {
		const jobId = params.id
		const { providerId } = await request.json()

		if (!providerId) {
			return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
		}

		const tenantId = authTenantId || resolveTenantFromRequest(request)
		const supabase = authSupabase || createServerSupabase(tenantId ?? undefined)

		// Verify the booking exists
		const { data: booking, error: bookingError } = await supabase
			.from('bookings')
			.select('id, status, provider_id, tenant_id')
			.eq('id', jobId)
			.single()

		if (bookingError || !booking) {
			return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
		}

		// Verify the provider exists and is available
		const { data: provider, error: providerError } = await supabase
			.from('provider_profiles')
			.select('id, availability_status, tenant_id')
			.eq('id', providerId)
			.single()

		if (providerError || !provider) {
			return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
		}

		// Update the booking with the provider assignment
		const { error: updateError } = await supabase
			.from('bookings')
			.update({
				provider_id: providerId,
				status: booking.status === 'pending' ? 'confirmed' : booking.status,
				confirmed_at: booking.status === 'pending' ? new Date().toISOString() : undefined,
				updated_at: new Date().toISOString(),
			})
			.eq('id', jobId)

		if (updateError) {
			console.error('[assign] Update booking error:', updateError)
			return NextResponse.json({ error: 'Failed to assign provider' }, { status: 500 })
		}

		// Update provider availability if needed
		await supabase
			.from('provider_profiles')
			.update({
				availability_status: 'busy',
				updated_at: new Date().toISOString(),
			})
			.eq('id', providerId)

		// Create notification for provider
		const { data: providerUser } = await supabase
			.from('provider_profiles')
			.select('user_id')
			.eq('id', providerId)
			.single()

		if (providerUser?.user_id) {
			await supabase.from('notifications').insert({
				user_id: providerUser.user_id,
				title: 'New Job Assigned',
				message: `You have been assigned to a new job (Booking #${jobId.slice(0, 8)})`,
				type: 'booking',
				related_booking_id: jobId,
			})
		}

		// Log audit event
		await logAuditEventFromRequest(request, {
			action: 'assign_provider',
			resource: 'booking',
			resourceId: jobId,
			metadata: { providerId },
		})

		return NextResponse.json({ success: true, jobId, providerId })
	} catch (e: any) {
		console.error('[assign] Error:', e)
		return NextResponse.json({ error: e.message || 'Assignment failed' }, { status: 500 })
	}
},
{
	requireAdmin: true,
})


