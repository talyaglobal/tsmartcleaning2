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

    // Get GMV (Gross Merchandise Volume) - sum of completed payment transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .eq('transaction_type', 'payment')
      .gte('created_at', daysAgo.toISOString())

    const gmv = transactions
      ? transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
      : 0

    // Get bookings count
    const { count: bookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['confirmed', 'completed'])
      .gte('booking_date', daysAgo.toISOString().split('T')[0])

    // Get cancellations
    const { count: cancellations } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'cancelled')
      .gte('booking_date', daysAgo.toISOString().split('T')[0])

    // Get total bookings for cancellation rate
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('booking_date', daysAgo.toISOString().split('T')[0])

    const cancellationRate = totalBookings && totalBookings > 0
      ? Math.round((cancellations || 0) / totalBookings * 1000) / 10
      : 0

    return NextResponse.json({
      metrics: {
        gmv,
        bookings: bookings || 0,
        cancellations: cancellations || 0,
        cancellationRate,
        period: parseInt(period),
      },
    })
  } catch (error) {
    console.error('[v0] Get partner metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

