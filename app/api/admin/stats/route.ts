import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Total users
    const { count: usersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    // Providers count
    const { count: providersCount } = await supabase
      .from('provider_profiles')
      .select('id', { count: 'exact', head: true })

    // Companies count (active)
    let companiesCount = 0
    {
      const { count } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
      companiesCount = count ?? 0
    }

    // Bookings metrics
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    const { count: activeToday } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', todayStr)
      .in('status', ['pending', 'confirmed', 'in-progress'])

    // Transactions: revenue totals (all-time and current month)
    const monthStart = `${yyyy}-${mm}-01`
    // Usage metering totals (current month)
    const { data: usageMonth } = await supabase
      .from('usage_events')
      .select('resource, quantity, occurred_at')
      .gte('occurred_at', `${monthStart}T00:00:00Z`)

    const { data: revenueAll } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'completed')
      .in('transaction_type', ['payment', 'payout'])

    const { data: revenueMonth } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .gte('created_at', monthStart)
      .eq('status', 'completed')
      .in('transaction_type', ['payment', 'payout'])

    const totalRevenue = (revenueAll ?? []).reduce((sum, t: any) => sum + Number(t.amount || 0), 0)
    const monthlyRevenue = (revenueMonth ?? []).reduce((sum, t: any) => sum + Number(t.amount || 0), 0)
    let monthBookings = 0
    let monthMessages = 0
    for (const u of usageMonth ?? []) {
      const q = Number((u as any).quantity || 0)
      if ((u as any).resource === 'booking') monthBookings += q
      if ((u as any).resource === 'message') monthMessages += q
    }

    // Pending provider verifications (from added column in 05 script)
    const { count: pendingVerifications } = await supabase
      .from('provider_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    // Monthly growth placeholder: compute as ratio of this month to last month if needed
    const stats = {
      totalUsers: usersCount ?? 0,
      totalProviders: providersCount ?? 0,
      totalBookings: bookingsCount ?? 0,
      totalRevenue,
      activeBookings: activeToday ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
      monthlyRevenue,
      monthlyGrowth: 0,
      monthBookings,
      monthMessages,
    }

    // Back-compat flat fields for existing dashboard
    return NextResponse.json({
      stats,
      bookingsCount: bookingsCount ?? 0,
      activeToday: activeToday ?? 0,
      companiesCount,
      providersCount: providersCount ?? 0,
      monthlyRevenue,
      totalRevenue,
    })
  } catch (error) {
    console.error('[v0] Get stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
