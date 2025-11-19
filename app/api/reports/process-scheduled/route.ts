import { NextRequest, NextResponse } from 'next/server'
import { processScheduledReports } from '@/lib/report-scheduler'

/**
 * Cron job endpoint to process scheduled reports
 * This should be called periodically (e.g., every hour) by a cron service
 * 
 * To set up with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/reports/process-scheduled",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * Or use an external cron service like cron-job.org to call this endpoint
 */
export async function GET(request: NextRequest) {
	try {
		// Verify cron secret if set (for security)
		const authHeader = request.headers.get('authorization')
		const cronSecret = process.env.CRON_SECRET

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			// In production, require auth. In dev, allow if no secret is set
			if (process.env.NODE_ENV === 'production') {
				return NextResponse.json(
					{ error: 'Unauthorized' },
					{ status: 401 }
				)
			}
		}

		// Process scheduled reports
		await processScheduledReports()

		return NextResponse.json({
			success: true,
			message: 'Scheduled reports processed',
			timestamp: new Date().toISOString(),
		})
	} catch (error: any) {
		console.error('[v0] Process scheduled reports error:', error)
		return NextResponse.json(
			{
				error: 'Failed to process scheduled reports',
				message: error.message,
			},
			{ status: 500 }
		)
	}
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
	return GET(request)
}

