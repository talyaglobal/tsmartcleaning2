import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

/**
 * Cron job endpoint to aggregate API metrics hourly
 * Should be called by a cron job (e.g., Vercel Cron) every hour
 * 
 * To set up in Vercel:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/aggregate-metrics",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
	// Verify this is called by a cron job (check for cron secret)
	const authHeader = request.headers.get('authorization')
	const cronSecret = process.env.CRON_SECRET

	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		// In production, require auth. In dev, allow if no secret is set
		if (process.env.NODE_ENV === 'production') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
	}

	try {
		const supabase = createServerSupabase()

		// Call the aggregation function
		const { error } = await supabase.rpc('aggregate_api_metrics_hourly')

		if (error) {
			console.error('[cron:aggregate-metrics] Error:', error)
			return NextResponse.json(
				{ error: 'Failed to aggregate metrics', details: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			message: 'Metrics aggregated successfully',
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error('[cron:aggregate-metrics] Unexpected error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

