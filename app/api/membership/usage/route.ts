import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId)
    
    // Get user from session
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch membership card
    const { data: card } = await supabase
      .from('membership_cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!card) {
      return NextResponse.json({ usage: [], total: 0, totalSavings: 0 })
    }

    // Fetch usage with pagination
    const { data: usage, error: usageError } = await supabase
      .from('membership_usage')
      .select('*', { count: 'exact' })
      .eq('membership_card_id', card.id)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (usageError) {
      console.error('[membership] Error fetching usage:', usageError)
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }

    // Calculate total savings
    const totalSavings = usage?.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0) || 0

    // Get total count
    const { count } = await supabase
      .from('membership_usage')
      .select('*', { count: 'exact', head: true })
      .eq('membership_card_id', card.id)

    return NextResponse.json({
      usage: usage || [],
      total: count || 0,
      totalSavings,
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

