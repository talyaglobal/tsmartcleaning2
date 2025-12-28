import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * Helper function to log webhook events to webhook_events table
 */
async function logWebhookEvent(
	supabase: ReturnType<typeof createServerSupabase>,
	vendor: string,
	eventType: string,
	status: 'received' | 'processing' | 'processed' | 'failed' | 'ignored',
	payload: any,
	tenantId: string | null = null,
	httpStatus?: number,
	errorMessage?: string
) {
	try {
		await supabase.from('webhook_events').insert({
			provider: vendor,
			event_type: eventType,
			event_id: payload?.id || payload?.event_id || `vendor-${Date.now()}`,
			tenant_id: tenantId,
			status,
			http_status: httpStatus || null,
			error_message: errorMessage || null,
			payload,
			processed_at: status === 'processed' || status === 'failed' ? new Date().toISOString() : null,
		})
	} catch (error) {
		// Don't fail webhook if logging fails
		console.error(`[webhook:${vendor}] Failed to log webhook event:`, error)
	}
}

// Minimal scaffold for multiple vendors (e.g., persona, veriff, checkr, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendor: string }> }
) {
  const supabase = createServerSupabase()
  let payload: any
  let eventId: string = `vendor-${Date.now()}`

  try {
    const { vendor } = await params

    payload = await request.json()

    // Log webhook received
    await logWebhookEvent(supabase, vendor, 'webhook_received', 'received', payload)

    // Expected generic payload fields (normalize per vendor mapping later)
    const userId: string | undefined = payload?.userId || payload?.user_id
    const type: string | undefined = payload?.type
    const status: string | undefined = payload?.status // pending|action_required|passed|failed|expired
    const vendorRef: string | undefined = payload?.vendor_ref || payload?.reference || payload?.id
    const score: number | undefined = payload?.score
    const flags: Record<string, unknown> | undefined = payload?.flags
    const expiresAt: string | undefined = payload?.expires_at

    if (vendorRef) {
      eventId = vendorRef
    }

    if (!userId || !type || !status) {
      const errorMsg = 'userId, type, and status are required in webhook payload'
      console.error(`[webhook:${vendor}] Validation error:`, errorMsg)
      await logWebhookEvent(supabase, vendor, 'webhook_received', 'failed', payload, null, 400, errorMsg)
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      )
    }

    // Update status to processing
    await logWebhookEvent(supabase, vendor, `${type}:${status}`, 'processing', payload)

    // Try to get tenant_id from user
    let tenantId: string | null = null
    try {
      const { data: user } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', userId)
        .single()
      tenantId = user?.tenant_id || null
    } catch {
      // Ignore if user lookup fails
    }

    // Upsert verification
    const { data: verificationRows, error: upsertErr } = await supabase
      .from('verifications')
      .upsert(
        {
          user_id: userId,
          type,
          status,
          vendor,
          vendor_ref: vendorRef ?? null,
          score: score ?? null,
          flags: flags ?? {},
          expires_at: expiresAt ?? null,
        },
        { onConflict: 'user_id,type' }
      )
      .select()
      .eq('user_id', userId)
      .eq('type', type)
      .limit(1)

    if (upsertErr) {
      const errorMsg = `Failed to upsert verification: ${upsertErr.message}`
      console.error(`[webhook:${vendor}] upsert error:`, upsertErr)
      await logWebhookEvent(supabase, vendor, `${type}:${status}`, 'failed', payload, tenantId, 500, errorMsg)
      // Return 500 to trigger retry
      return NextResponse.json({ error: 'Failed to upsert verification' }, { status: 500 })
    }

    const verification = verificationRows?.[0]
    if (verification?.id) {
      // Record event
      const { error: eventErr } = await supabase.from('verification_events').insert({
        verification_id: verification.id,
        event_type: `${vendor}:${status}`,
        payload,
      })

      if (eventErr) {
        console.warn(`[webhook:${vendor}] Failed to insert verification event:`, eventErr)
        // Don't fail webhook if event logging fails
      }
    }

    // Minimal policy example: compute identity_verified
    if (type === 'government_id' || type === 'face') {
      const { data: all, error: readErr } = await supabase
        .from('verifications')
        .select('type,status')
        .eq('user_id', userId)
        .in('type', ['government_id', 'face'])
      
      if (readErr) {
        console.warn(`[webhook:${vendor}] Failed to read verifications for policy:`, readErr)
      } else if (all) {
        const byType = Object.fromEntries((all ?? []).map((r: any) => [r.type, r.status]))
        const identityOk =
          byType['government_id'] === 'passed' && byType['face'] === 'passed'
        
        const { error: policyErr } = await supabase.from('policy_results').insert({
          user_id: userId,
          policy_name: 'identity_verified',
          result: identityOk ? 'pass' : 'review',
          reasons: identityOk ? {} : { missing: ['government_id', 'face'].filter((t) => byType[t] !== 'passed') },
        })

        if (policyErr) {
          console.warn(`[webhook:${vendor}] Failed to insert policy result:`, policyErr)
          // Don't fail webhook if policy computation fails
        }
      }
    }

    // Log successful processing
    await logWebhookEvent(supabase, vendor, `${type}:${status}`, 'processed', payload, tenantId, 200)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    const errorMsg = err.message || 'Internal server error'
    console.error(`[webhook:${vendor}] error:`, err)
    
    // Log failed webhook
    await logWebhookEvent(
      supabase,
      vendor,
      'webhook_received',
      'failed',
      payload || { error: 'Failed to parse payload' },
      null,
      500,
      errorMsg
    )
    
    // Return 500 to trigger retry for processing errors
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}


