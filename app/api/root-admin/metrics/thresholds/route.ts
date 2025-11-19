import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { createServerSupabase } from '@/lib/supabase'

export const GET = withAuth(
	async (request: NextRequest) => {
		try {
			const { searchParams } = new URL(request.url)
			const tenantId = searchParams.get('tenantId') || null

			const supabase = createServerSupabase()
			let query = supabase.from('api_alert_thresholds').select('*').order('created_at', { ascending: false })

			if (tenantId) {
				query = query.eq('tenant_id', tenantId)
			} else {
				query = query.is('tenant_id', null)
			}

			const { data: thresholds, error } = await query

			if (error) {
				return NextResponse.json({ error: 'Failed to fetch thresholds' }, { status: 500 })
			}

			return NextResponse.json({ thresholds: thresholds || [] })
		} catch (error) {
			console.error('[metrics] Get thresholds error:', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

export const POST = withAuth(
	async (request: NextRequest) => {
		try {
			const body = await request.json()
			const {
				tenantId,
				endpoint,
				method,
				maxResponseTimeMs,
				maxErrorRatePercent,
				minThroughputPerMinute,
				enabled = true,
				notificationChannels = [],
			} = body

			const supabase = createServerSupabase()
			const { data: threshold, error } = await supabase
				.from('api_alert_thresholds')
				.upsert(
					{
						tenant_id: tenantId || null,
						endpoint: endpoint || null,
						method: method || null,
						max_response_time_ms: maxResponseTimeMs || null,
						max_error_rate_percent: maxErrorRatePercent || null,
						min_throughput_per_minute: minThroughputPerMinute || null,
						enabled,
						notification_channels: notificationChannels,
						updated_at: new Date().toISOString(),
					},
					{
						onConflict: 'tenant_id,endpoint,method',
					}
				)
				.select()
				.single()

			if (error) {
				return NextResponse.json({ error: 'Failed to save threshold' }, { status: 500 })
			}

			return NextResponse.json({ threshold })
		} catch (error) {
			console.error('[metrics] Create threshold error:', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

export const DELETE = withAuth(
	async (request: NextRequest) => {
		try {
			const { searchParams } = new URL(request.url)
			const id = searchParams.get('id')

			if (!id) {
				return NextResponse.json({ error: 'Threshold ID is required' }, { status: 400 })
			}

			const supabase = createServerSupabase()
			const { error } = await supabase.from('api_alert_thresholds').delete().eq('id', id)

			if (error) {
				return NextResponse.json({ error: 'Failed to delete threshold' }, { status: 500 })
			}

			return NextResponse.json({ message: 'Threshold deleted' })
		} catch (error) {
			console.error('[metrics] Delete threshold error:', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	},
	{
		requireAdmin: true,
	}
)

