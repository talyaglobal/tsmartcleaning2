import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

type VerificationType =
  | 'government_id'
  | 'face'
  | 'social'
  | 'background'
  | 'reference'
  | 'drug'
  | 'vaccination'
  | 'insurance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId: string | undefined = body?.userId
    const types: VerificationType[] = body?.types ?? []
    const tier: 'standard' | 'premium' | undefined = body?.tier

    if (!userId || !Array.isArray(types) || types.length === 0) {
      return NextResponse.json(
        { error: 'userId and types[] are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Create or upsert verification rows as pending
    const toInsert = types.map((t) => ({
      user_id: userId,
      type: t,
      status: 'pending',
    }))

    const { error: upsertErr } = await supabase
      .from('verifications')
      .upsert(toInsert, { onConflict: 'user_id,type' })

    if (upsertErr) {
      console.error('[verification:start] upsert error:', upsertErr)
      return NextResponse.json(
        { error: 'Failed to initialize verifications' },
        { status: 500 }
      )
    }

    // Placeholder vendor URLs/tokens; integrate real vendors later
    const vendorFlows: Record<string, { url: string }> = {}
    for (const t of types) {
      vendorFlows[t] = { url: `/provider/verification/${t}` }
    }

    // Optionally create monitoring subscriptions for premium tier
    if (tier === 'premium') {
      const monitorTypes: Array<'background' | 'insurance'> = ['background', 'insurance']
      const existing = await supabase
        .from('monitoring_subscriptions')
        .select('type')
        .eq('user_id', userId)
        .in('type', monitorTypes)

      const existingSet = new Set(existing.data?.map((r) => r.type))
      const createSubs = monitorTypes
        .filter((t) => !existingSet.has(t))
        .map((t) => ({ user_id: userId, type: t }))

      if (createSubs.length > 0) {
        await supabase.from('monitoring_subscriptions').insert(createSubs)
      }
    }

    return NextResponse.json({
      message: 'Verification initialized',
      vendorFlows,
    })
  } catch (err) {
    console.error('[verification:start] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


