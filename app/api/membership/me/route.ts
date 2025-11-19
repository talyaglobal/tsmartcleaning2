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

    // Fetch membership card
    const { data: card, error: cardError } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cardError && cardError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[membership] Error fetching card:', cardError)
      return NextResponse.json({ error: 'Failed to fetch membership card' }, { status: 500 })
    }

    if (!card) {
      return NextResponse.json({ card: null, message: 'No membership card found' })
    }

    // Calculate days until renewal
    const expirationDate = new Date(card.expiration_date)
    const now = new Date()
    const daysUntilRenewal = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Fetch recent usage
    const { data: recentUsage } = await supabase
      .from('membership_usage')
      .select('*')
      .eq('membership_card_id', card.id)
      .order('order_date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      card: {
        ...card,
        daysUntilRenewal,
        needsRenewal: daysUntilRenewal <= 30 && daysUntilRenewal > 0,
        isExpired: daysUntilRenewal <= 0,
      },
      recentUsage: recentUsage || [],
    })
  } catch (error) {
    console.error('[membership] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

