import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { EarningsClient } from '@/components/providers/EarningsClient'
import { createServerSupabase } from '@/lib/supabase'

export default async function ProviderEarningsPage({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const userId = searchParams?.userId || ''
  const supabase = createServerSupabase()

  // Get provider profile to get provider_id
  let providerId = ''
  let providerName = 'Provider'
  
  if (userId) {
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id, users:profiles!provider_profiles_user_id_fkey(full_name)')
      .eq('user_id', userId)
      .single()
    
    if (profile) {
      providerId = profile.id
      providerName = (profile as any).users?.full_name || 'Provider'
    }
  }

  // Fetch transactions
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const res = await fetch(
    `${baseUrl}/api/transactions?role=provider&userId=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }
  )
    .then((r) => r.json())
    .catch(() => ({ transactions: [] }))

  const transactions = res.transactions || []
  
  // Calculate earnings breakdown
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  const totalEarnings = transactions.reduce((s: number, t: any) => s + Number(t.amount || 0), 0) || 0
  
  const thisMonthEarnings = transactions
    .filter((t: any) => {
      const date = new Date(t.created_at || '')
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear
    })
    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0) || 0

  const lastMonthEarnings = transactions
    .filter((t: any) => {
      const date = new Date(t.created_at || '')
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })
    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0) || 0

  // Breakdown by service
  const byService: Record<string, { amount: number; count: number }> = {}
  transactions.forEach((t: any) => {
    const serviceName = t.bookings?.service_id 
      ? `Service #${t.bookings.service_id}` 
      : 'Other'
    if (!byService[serviceName]) {
      byService[serviceName] = { amount: 0, count: 0 }
    }
    byService[serviceName].amount += Number(t.amount || 0)
    byService[serviceName].count += 1
  })

  // Breakdown by month (last 12 months)
  const byMonth: Record<string, { amount: number; count: number }> = {}
  transactions.forEach((t: any) => {
    const date = new Date(t.created_at || '')
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { amount: 0, count: 0 }
    }
    byMonth[monthKey].amount += Number(t.amount || 0)
    byMonth[monthKey].count += 1
  })

  const earningsData = {
    totalEarnings,
    thisMonthEarnings,
    lastMonthEarnings,
    transactions: transactions.map((t: any) => ({
      id: t.id,
      date: (t.created_at || '').slice(0, 10),
      service: t.bookings?.service_id ? `Service #${t.bookings.service_id}` : 'Service',
      customer: t.bookings?.customer_id ? `#${t.bookings.customer_id}` : '-',
      amount: Number(t.amount || 0),
      status: t.status || 'completed',
    })),
    breakdown: {
      byService: Object.entries(byService).map(([service, data]) => ({
        service,
        amount: data.amount,
        count: data.count,
      })),
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, data]) => ({
          month: `${month}-01`,
          amount: data.amount,
          count: data.count,
        })),
    },
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="provider" userName={providerName} />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Earnings</h1>
        
        {providerId ? (
          <EarningsClient 
            providerId={providerId}
            userId={userId}
            initialData={earningsData}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Provider profile not found. Please ensure you are logged in as a provider.
          </div>
        )}
      </div>
    </div>
  )
}
