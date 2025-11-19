import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    const period = searchParams.get('period') || '30' // days

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Get commission transactions
    const { data: commissions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('partner_id', partnerId)
      .eq('transaction_type', 'commission')
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Get partner commissions error:', error)
      return NextResponse.json({ error: 'Failed to load commissions' }, { status: 500 })
    }

    const totalCommission = commissions
      ? commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
      : 0

    const paidCommission = commissions
      ? commissions
          .filter((c) => c.status === 'completed')
          .reduce((sum, c) => sum + Number(c.amount || 0), 0)
      : 0

    const pendingCommission = totalCommission - paidCommission

    return NextResponse.json({
      commissions: commissions || [],
      summary: {
        total: totalCommission,
        paid: paidCommission,
        pending: pendingCommission,
        period: parseInt(period),
      },
    })
  } catch (error) {
    console.error('[v0] Get partner commissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

