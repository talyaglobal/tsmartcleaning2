import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'

export async function POST(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)
		const { jobIds, strategy } = await request.json()

		// Strategy: 'distance' (closest provider), 'workload' (least busy), 'rating' (highest rated), 'balanced' (combination)
		const assignmentStrategy = strategy || 'balanced'

		// Get unassigned jobs
		let query = supabase
			.from('bookings')
			.select(`
				id,
				booking_date,
				booking_time,
				status,
				address:address_id (latitude, longitude),
				service:service_id (name, duration_minutes)
			`)
			.eq('status', 'pending')
			.is('provider_id', null)

		if (jobIds && Array.isArray(jobIds) && jobIds.length > 0) {
			query = query.in('id', jobIds)
		}

		const { data: unassignedJobs, error: jobsError } = await query

		if (jobsError || !unassignedJobs || unassignedJobs.length === 0) {
			return NextResponse.json({ 
				success: true, 
				assigned: 0, 
				message: 'No unassigned jobs found' 
			})
		}

		// Get available providers with their locations
		const { data: availableProviders, error: providersError } = await supabase
			.from('provider_profiles')
			.select(`
				id,
				user_id,
				business_name,
				availability_status,
				rating,
				total_bookings,
				service_radius
			`)
			.eq('availability_status', 'available')

		if (providersError || !availableProviders || availableProviders.length === 0) {
			return NextResponse.json({ 
				success: false, 
				error: 'No available providers found' 
			}, { status: 400 })
		}

		// Get provider user IDs for location lookup
		const userIds = availableProviders.map((p: any) => p.user_id).filter(Boolean)
		const { data: providerUsers } = await supabase
			.from('users')
			.select('id, phone')
			.in('id', userIds)

		// Get today's job counts for workload calculation
		const today = new Date().toISOString().split('T')[0]
		const providerIds = availableProviders.map((p: any) => p.id)
		const { data: todayJobs } = await supabase
			.from('bookings')
			.select('provider_id')
			.eq('booking_date', today)
			.in('provider_id', providerIds)
			.in('status', ['confirmed', 'in-progress'])

		const jobCounts: Record<string, number> = {}
		;(todayJobs || []).forEach((job: any) => {
			jobCounts[job.provider_id] = (jobCounts[job.provider_id] || 0) + 1
		})

		// Calculate distance between two coordinates (Haversine formula)
		const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
			const R = 3959 // Earth radius in miles
			const dLat = (lat2 - lat1) * Math.PI / 180
			const dLon = (lon2 - lon1) * Math.PI / 180
			const a = 
				Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
				Math.sin(dLon / 2) * Math.sin(dLon / 2)
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
			return R * c
		}

		// Score providers for a job
		const scoreProvider = (provider: any, job: any, distance: number): number => {
			let score = 0

			switch (assignmentStrategy) {
				case 'distance':
					score = 1000 - (distance * 10) // Lower distance = higher score
					break
				case 'workload':
					score = 1000 - (jobCounts[provider.id] || 0) * 100
					break
				case 'rating':
					score = (provider.rating || 0) * 200
					break
				case 'balanced':
				default:
					// Combined scoring: distance (40%), workload (30%), rating (30%)
					const distanceScore = (100 - Math.min(distance, 50)) * 4 // Max 50 miles
					const workloadScore = (10 - Math.min(jobCounts[provider.id] || 0, 10)) * 30
					const ratingScore = (provider.rating || 0) * 30
					score = distanceScore + workloadScore + ratingScore
					break
			}

			// Check if provider is within service radius
			if (provider.service_radius && distance > provider.service_radius) {
				score = 0 // Out of range
			}

			return score
		}

		const assignments: Array<{ jobId: string; providerId: string; distance: number }> = []
		const assignedProviderIds = new Set<string>()

		// Sort jobs by urgency (earliest first)
		const sortedJobs = [...unassignedJobs].sort((a, b) => {
			const timeA = new Date(`${a.booking_date}T${a.booking_time}`).getTime()
			const timeB = new Date(`${b.booking_date}T${b.booking_time}`).getTime()
			return timeA - timeB
		})

		// Assign each job to the best available provider
		for (const job of sortedJobs) {
			if (!job.address?.latitude || !job.address?.longitude) {
				continue // Skip jobs without location
			}

			let bestProvider: any = null
			let bestScore = -1
			let bestDistance = Infinity

			for (const provider of availableProviders) {
				// Skip if provider already assigned to another job in this batch
				if (assignedProviderIds.has(provider.id)) {
					continue
				}

				// Get provider location (simplified - in real app, would fetch from provider_profiles or separate location table)
				// For now, we'll use a simplified approach
				const distance = 5 // Default distance - in production, would calculate from actual provider location

				const score = scoreProvider(provider, job, distance)

				if (score > bestScore) {
					bestScore = score
					bestProvider = provider
					bestDistance = distance
				}
			}

			if (bestProvider && bestScore > 0) {
				assignments.push({
					jobId: job.id,
					providerId: bestProvider.id,
					distance: bestDistance,
				})
				assignedProviderIds.add(bestProvider.id)
			}
		}

		// Execute assignments
		let assignedCount = 0
		const errors: string[] = []

		for (const assignment of assignments) {
			try {
				// Update booking
				const { error: updateError } = await supabase
					.from('bookings')
					.update({
						provider_id: assignment.providerId,
						status: 'confirmed',
						confirmed_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					})
					.eq('id', assignment.jobId)

				if (updateError) {
					errors.push(`Failed to assign job ${assignment.jobId}: ${updateError.message}`)
					continue
				}

				// Update provider availability
				await supabase
					.from('provider_profiles')
					.update({
						availability_status: 'busy',
						updated_at: new Date().toISOString(),
					})
					.eq('id', assignment.providerId)

				// Create notification for provider
				const provider = availableProviders.find((p: any) => p.id === assignment.providerId)
				if (provider?.user_id) {
					await supabase.from('notifications').insert({
						user_id: provider.user_id,
						title: 'New Job Assigned',
						message: `You have been assigned to a new job (Booking #${assignment.jobId.slice(0, 8)})`,
						type: 'booking',
						related_booking_id: assignment.jobId,
					})
				}

				assignedCount++

				// Log audit event
				await logAuditEventFromRequest(request, {
					action: 'auto_assign_provider',
					resource: 'booking',
					resourceId: assignment.jobId,
					metadata: { 
						providerId: assignment.providerId,
						strategy: assignmentStrategy,
						distance: assignment.distance,
					},
				})
			} catch (e: any) {
				errors.push(`Error assigning job ${assignment.jobId}: ${e.message}`)
			}
		}

		return NextResponse.json({
			success: true,
			assigned: assignedCount,
			total: unassignedJobs.length,
			errors: errors.length > 0 ? errors : undefined,
		})
	} catch (e: any) {
		console.error('[auto-assign] Error:', e)
		return NextResponse.json({ error: e.message || 'Auto-assignment failed' }, { status: 500 })
	}
}

