import { NextRequest, NextResponse } from 'next/server'
import { processBatchPayouts } from '@/lib/stripe-payouts'
import { resolveTenantFromRequest } from '@/lib/supabase'

// Intended to be triggered by a cron/external scheduler
export async function POST(request: NextRequest) {
	try {
		resolveTenantFromRequest(request)
		const result = await processBatchPayouts()
		return NextResponse.json({ success: true, ...result })
	} catch (error) {
		console.error('[v0] payouts/scheduler/run error:', error)
		return NextResponse.json({ error: 'Scheduler run failed' }, { status: 500 })
	}
}

