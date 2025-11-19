import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export type ReportType = 'revenue' | 'bookings' | 'users' | 'performance' | 'custom'
export type ReportPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_12_months' | 'custom'
export type ReportFormat = 'json' | 'csv' | 'pdf'

interface GenerateReportRequest {
  reportType: ReportType
  period: ReportPeriod
  startDate?: string
  endDate?: string
  format?: ReportFormat
  filters?: Record<string, any>
}

export const POST = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {
      const body: GenerateReportRequest = await request.json()
      const { reportType, period, startDate, endDate, format = 'json', filters = {} } = body

    // Calculate date range
    let start: Date
    let end: Date = new Date()

    switch (period) {
      case 'last_7_days':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'last_12_months':
        start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate())
        break
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        end = endDate ? new Date(endDate) : new Date()
        break
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    let reportData: any = {}

    // Generate report based on type
    switch (reportType) {
      case 'revenue':
        reportData = await generateRevenueReport(supabase, start, end, filters)
        break
      case 'bookings':
        reportData = await generateBookingsReport(supabase, start, end, filters)
        break
      case 'users':
        reportData = await generateUsersReport(supabase, start, end, filters)
        break
      case 'performance':
        reportData = await generatePerformanceReport(supabase, start, end, filters)
        break
      case 'custom':
        reportData = await generateCustomReport(supabase, start, end, filters)
        break
    }

    // Save report record
    const { data: reportRecord, error: insertError } = await supabase
      .from('reports')
      .insert({
        report_type: reportType,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${period}`,
        description: `Generated report for ${period} period`,
        data: reportData,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Report insert error:', insertError)
    }

    // Format response based on requested format
    if (format === 'csv') {
      const csv = convertToCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${Date.now()}.csv"`,
        },
      })
    }

    if (format === 'pdf') {
      // For PDF, return a URL to generate/download
      // In a real implementation, you'd generate PDF here or queue it
      return NextResponse.json({
        reportId: reportRecord?.id,
        message: 'PDF generation queued',
        downloadUrl: `/api/admin/reports/${reportRecord?.id}/download?format=pdf`,
      })
    }

    return NextResponse.json({
      reportId: reportRecord?.id,
      data: reportData,
      period: { start: start.toISOString(), end: end.toISOString() },
      generatedAt: new Date().toISOString(),
    })
    } catch (error) {
      console.error('[v0] Generate report error:', error)
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

async function generateRevenueReport(supabase: any, start: Date, end: Date, filters: any) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'completed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  const totalRevenue = (transactions || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
  const paymentCount = (transactions || []).filter((t: any) => t.transaction_type === 'payment').length
  const payoutCount = (transactions || []).filter((t: any) => t.transaction_type === 'payout').length

  // Group by month
  const byMonth: Record<string, number> = {}
  for (const t of transactions || []) {
    const date = new Date(t.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] || 0) + Number(t.amount || 0)
  }

  return {
    summary: {
      totalRevenue,
      paymentCount,
      payoutCount,
      averageTransaction: totalRevenue / (transactions?.length || 1),
    },
    monthlyBreakdown: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })),
    transactions: transactions || [],
  }
}

async function generateBookingsReport(supabase: any, start: Date, end: Date, filters: any) {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('booking_date', start.toISOString().split('T')[0])
    .lte('booking_date', end.toISOString().split('T')[0])

  const totalBookings = bookings?.length || 0
  const completed = bookings?.filter((b: any) => b.status === 'completed').length || 0
  const cancelled = bookings?.filter((b: any) => b.status === 'cancelled').length || 0
  const totalRevenue = (bookings || []).reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0)

  // Group by status
  const byStatus: Record<string, number> = {}
  for (const b of bookings || []) {
    byStatus[b.status] = (byStatus[b.status] || 0) + 1
  }

  return {
    summary: {
      totalBookings,
      completed,
      cancelled,
      totalRevenue,
      completionRate: totalBookings > 0 ? (completed / totalBookings) * 100 : 0,
    },
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    bookings: bookings || [],
  }
}

async function generateUsersReport(supabase: any, start: Date, end: Date, filters: any) {
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: providers } = await supabase
    .from('provider_profiles')
    .select('*', { count: 'exact', head: true })

  const { count: companies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  // New users in period
  const { data: newUsers } = await supabase
    .from('users')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  return {
    summary: {
      totalUsers: totalUsers || 0,
      totalProviders: providers || 0,
      totalCompanies: companies || 0,
      newUsersInPeriod: newUsers?.length || 0,
    },
    newUsers: newUsers || [],
  }
}

async function generatePerformanceReport(supabase: any, start: Date, end: Date, filters: any) {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, reviews(rating, comment)')
    .gte('booking_date', start.toISOString().split('T')[0])
    .lte('booking_date', end.toISOString().split('T')[0])
    .eq('status', 'completed')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length
    : 0

  const totalCompleted = bookings?.length || 0
  const totalRevenue = (bookings || []).reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0)

  return {
    summary: {
      totalCompletedBookings: totalCompleted,
      totalRevenue,
      averageRating: avgRating,
      totalReviews: reviews?.length || 0,
    },
    reviews: reviews || [],
    bookings: bookings || [],
  }
}

async function generateCustomReport(supabase: any, start: Date, end: Date, filters: any) {
  // Custom report combines multiple data sources
  const [revenue, bookings, users] = await Promise.all([
    generateRevenueReport(supabase, start, end, filters),
    generateBookingsReport(supabase, start, end, filters),
    generateUsersReport(supabase, start, end, filters),
  ])

  return {
    revenue: revenue.summary,
    bookings: bookings.summary,
    users: users.summary,
    period: { start: start.toISOString(), end: end.toISOString() },
  }
}

function convertToCSV(data: any): string {
  // Simple CSV conversion for summary data
  const rows: string[] = []
  
  if (data.summary) {
    rows.push('Metric,Value')
    for (const [key, value] of Object.entries(data.summary)) {
      rows.push(`${key},${value}`)
    }
  }

  return rows.join('\n')
}

