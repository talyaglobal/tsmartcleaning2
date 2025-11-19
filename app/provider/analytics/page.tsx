import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { ProviderAnalytics } from '@/components/providers/ProviderAnalytics'
import { createServerSupabase } from '@/lib/supabase'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'

export default async function ProviderAnalyticsPage({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const userId = searchParams?.userId || ''
  const supabase = createServerSupabase()

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

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="provider" userName={providerName} />
      
      <div className="container mx-auto px-4 py-8">
        <ProviderAnalytics providerId={providerId} userId={userId} />
      </div>
    </div>
  )
}

