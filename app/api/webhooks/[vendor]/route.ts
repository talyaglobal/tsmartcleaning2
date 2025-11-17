import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Minimal scaffold for multiple vendors (e.g., persona, veriff, checkr, etc.)
export async function POST(
  request: NextRequest,
  context: { params: { vendor: string } }
) {
  try {
    const vendor = context.params.vendor
    const payload = await request.json()

    // Expected generic payload fields (normalize per vendor mapping later)
    const userId: string | undefined = payload?.userId
    const type: string | undefined = payload?.type
    const status: string | undefined = payload?.status // pending|action_required|passed|failed|expired
    const vendorRef: string | undefined = payload?.vendor_ref || payload?.reference
    const score: number | undefined = payload?.score
    const flags: Record<string, unknown> | undefined = payload?.flags
    const expiresAt: string | undefined = payload?.expires_at

    if (!userId || !type || !status) {
      return NextResponse.json(
        { error: 'userId, type, and status are required in webhook payload' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

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
      console.error(`[webhook:${vendor}] upsert error:`, upsertErr)
      return NextResponse.json({ error: 'Failed to upsert verification' }, { status: 500 })
    }

    const verification = verificationRows?.[0]
    if (verification?.id) {
      // Record event
      await supabase.from('verification_events').insert({
        verification_id: verification.id,
        event_type: `${vendor}:${status}`,
        payload,
      })
    }

    // Minimal policy example: compute identity_verified
    if (type === 'government_id' || type === 'face') {
      const { data: all, error: readErr } = await supabase
        .from('verifications')
        .select('type,status')
        .eq('user_id', userId)
        .in('type', ['government_id', 'face'])
      if (!readErr) {
        const byType = Object.fromEntries((all ?? []).map((r: any) => [r.type, r.status]))
        const identityOk =
          byType['government_id'] === 'passed' && byType['face'] === 'passed'
        await supabase.from('policy_results').insert({
          user_id: userId,
          policy_name: 'identity_verified',
          result: identityOk ? 'pass' : 'review',
          reasons: identityOk ? {} : { missing: ['government_id', 'face'].filter((t) => byType[t] !== 'passed') },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhooks] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


