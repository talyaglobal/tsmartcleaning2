import { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase'
import { isAdminRole, UserRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard'

export const metadata: Metadata = {
  title: 'Performance Metrics — Admin',
  description: 'View application performance metrics and Core Web Vitals',
}

export default async function PerformancePage() {
  const supabase = createServerSupabase()

  // Get current user session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = (userProfile?.role as UserRole) || UserRole.CLEANING_COMPANY
  
  if (!isAdminRole(role)) {
    redirect('/admin/login')
  }
  
  // Get recent performance metrics
  const { data: recentMetrics } = await supabase
    .from('performance_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Get performance summary - we'll fetch it client-side since we need proper auth headers
  const summary = null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
        <p className="text-gray-600 mt-2">
          Monitor application performance, Core Web Vitals, and API response times
        </p>
      </div>

      <PerformanceDashboard 
        initialMetrics={recentMetrics || []}
        initialSummary={summary}
      />
    </div>
  )
}

