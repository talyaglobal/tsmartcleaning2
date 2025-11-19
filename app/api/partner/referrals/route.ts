import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    // Get referrals (users referred by this partner)
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referred_user_id,
        status,
        commission_amount,
        created_at,
        users:referred_user_id (
          full_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get partner referrals error:', error)
      return NextResponse.json({ error: 'Failed to load referrals' }, { status: 500 })
    }

    const formattedReferrals = (referrals || []).map((referral: any) => ({
      id: referral.id,
      referredUserName: referral.users?.full_name || 'Unknown',
      referredUserEmail: referral.users?.email || '',
      status: referral.status || 'pending',
      commissionAmount: Number(referral.commission_amount || 0),
      createdAt: referral.created_at,
    }))

    // Calculate totals
    const totalReferrals = formattedReferrals.length
    const completedReferrals = formattedReferrals.filter((r) => r.status === 'completed').length
    const totalCommission = formattedReferrals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.commissionAmount, 0)

    return NextResponse.json({
      referrals: formattedReferrals,
      summary: {
        total: totalReferrals,
        completed: completedReferrals,
        pending: totalReferrals - completedReferrals,
        totalCommission,
      },
    })
  } catch (error) {
    console.error('[v0] Get partner referrals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

