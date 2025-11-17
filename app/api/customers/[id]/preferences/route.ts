import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'

// Get preferences for a customer
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('customer_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // not found is ok; otherwise error
      console.error('[v0] Preferences GET error:', error)
      return NextResponse.json({ error: 'Failed to load preferences' }, { status: 400 })
    }

    return NextResponse.json({ preferences: data || null })
  } catch (error) {
    console.error('[v0] Preferences GET exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Upsert preferences for a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const updates = await request.json()
    const supabase = createServerSupabase()

    // Ensure row exists or create
    const payload = { user_id: userId, ...updates }
    const { data, error } = await supabase
      .from('customer_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      console.error('[v0] Preferences PUT error:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 400 })
    }

    await logAuditEventFromRequest(request, {
      action: 'upsert_preferences',
      resource: 'customer_preferences',
      resourceId: userId,
      metadata: { updates },
    })
    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('[v0] Preferences PUT exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


