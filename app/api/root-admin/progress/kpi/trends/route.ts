import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

interface TrendData {
  month: string
  companies: number
  cleaners: number
  revenue: number
}

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const supabase = createServerSupabase(null)
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')
    
    // Generate last N months
    const monthsArray = Array.from({ length: months }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return date.toISOString().substring(0, 7) // YYYY-MM format
    }).reverse()

    const trends: TrendData[] = []

    for (const month of monthsArray) {
      // Count companies created up to this month
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', `${month}-31`)
        .eq('status', 'active')

      // Count cleaners created up to this month
      const { count: cleanersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', `${month}-31`)
        .eq('role', 'cleaner')

      // Calculate revenue for this specific month
      const nextMonth = getNextMonth(month)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('total_amount')
        .gte('created_at', `${month}-01`)
        .lt('created_at', `${nextMonth}-01`)
        .eq('status', 'completed')

      const monthlyRevenue = bookingsData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0

      trends.push({
        month,
        companies: companiesCount || 0,
        cleaners: cleanersCount || 0,
        revenue: monthlyRevenue
      })
    }

    return NextResponse.json({
      trends,
      period: `${months} months`
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] KPI trends fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number)
  const date = new Date(year, month, 1) // month is 0-indexed in Date constructor
  return date.toISOString().substring(0, 7)
}