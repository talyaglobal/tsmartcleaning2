import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

interface KPIData {
  companies: {
    current: number
    target: number
    percentage: number
  }
  cleaners: {
    current: number
    target: number
    percentage: number
  }
  revenue: {
    current: number
    target: number
    percentage: number
  }
}

interface KPIAlert {
  type: 'ahead' | 'behind' | 'on_track' | 'target_reached'
  metric: 'companies' | 'cleaners' | 'revenue'
  message: string
  severity: 'success' | 'warning' | 'error' | 'info'
}

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const supabase = createServerSupabase(null)
    
    // Fetch companies count
    const { count: companiesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Fetch cleaners count (users with cleaner role)
    const { count: cleanersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cleaner')

    // Calculate revenue for current month
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM format
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('total_amount')
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${getNextMonth(currentMonth)}-01`)
      .eq('status', 'completed')

    const currentRevenue = bookingsData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0

    // KPI targets
    const targets = {
      companies: 5,
      cleaners: 25,
      revenue: 1850
    }

    // Build KPI data
    const kpiData: KPIData = {
      companies: {
        current: companiesCount || 0,
        target: targets.companies,
        percentage: Math.round(((companiesCount || 0) / targets.companies) * 100)
      },
      cleaners: {
        current: cleanersCount || 0,
        target: targets.cleaners,
        percentage: Math.round(((cleanersCount || 0) / targets.cleaners) * 100)
      },
      revenue: {
        current: currentRevenue,
        target: targets.revenue,
        percentage: Math.round((currentRevenue / targets.revenue) * 100)
      }
    }

    // Generate alerts
    const alerts: KPIAlert[] = []
    
    Object.entries(kpiData).forEach(([key, data]) => {
      const metric = key as keyof KPIData
      if (data.percentage >= 100) {
        alerts.push({
          type: 'target_reached',
          metric,
          message: `🎉 ${capitalize(metric)} target reached! ${data.current}/${data.target}`,
          severity: 'success'
        })
      } else if (data.percentage >= 90) {
        alerts.push({
          type: 'ahead',
          metric,
          message: `📈 ${capitalize(metric)} ahead of schedule (${data.percentage}%)`,
          severity: 'info'
        })
      } else if (data.percentage < 50) {
        alerts.push({
          type: 'behind',
          metric,
          message: `⚠️ ${capitalize(metric)} behind schedule (${data.percentage}%)`,
          severity: 'warning'
        })
      }
    })

    return NextResponse.json({
      kpis: kpiData,
      alerts,
      lastUpdated: new Date().toISOString()
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] KPI data fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Helper functions
function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number)
  const date = new Date(year, month, 1) // month is 0-indexed in Date constructor
  return date.toISOString().substring(0, 7)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}