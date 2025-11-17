import { NextRequest, NextResponse } from 'next/server'
import { processBatchPayouts } from '@/lib/stripe-payouts'
import { resolveTenantFromRequest } from '@/lib/supabase'

export async function POST(request: NextRequest) {
	try {
		// Resolve tenant for multi-tenant headers in downstream clients if needed
		resolveTenantFromRequest(request)
		const result = await processBatchPayouts()
		return NextResponse.json({ success: true, ...result })
	} catch (error) {
		console.error('[v0] payouts/process error:', error)
		return NextResponse.json({ error: 'Failed to process payouts' }, { status: 500 })
	}
}

