import { NextRequest, NextResponse } from 'next/server'
import { processBatchPayouts } from '@/lib/stripe-payouts'
import { resolveTenantFromRequest } from '@/lib/supabase'

/**
 * Cron job endpoint to process batch payouts
 * This should be called periodically (e.g., weekly) by a cron service
 * 
 * To set up with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/payouts/scheduler/run",
 *     "schedule": "0 0 * * 1"
 *   }]
 * }
 * 
 * Or use an external cron service to call this endpoint
 */
async function handleRequest(request: NextRequest) {
	try {
		// Verify cron secret if set (for security)
		const authHeader = request.headers.get('authorization')
		const cronSecret = process.env.CRON_SECRET

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			// In production, require auth. In dev, allow if no secret is set
			if (process.env.NODE_ENV === 'production') {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
			}
		}

		resolveTenantFromRequest(request)
		const result = await processBatchPayouts()
		return NextResponse.json({
			success: true,
			...result,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error('[v0] payouts/scheduler/run error:', error)
		return NextResponse.json({ error: 'Scheduler run failed' }, { status: 500 })
	}
}

// GET support for Vercel cron jobs
export async function GET(request: NextRequest) {
	return handleRequest(request)
}

// POST support for external cron services and backward compatibility
export async function POST(request: NextRequest) {
	return handleRequest(request)
}

