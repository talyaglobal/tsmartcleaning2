import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status')
    
    let query = supabase
      .from('verifications')
      .select(`
        *,
        user:users!verifications_user_id_fkey(id, full_name, email),
        provider:provider_profiles!inner(user_id)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[admin:verifications] error:', error)
      return NextResponse.json({ error: 'Failed to load verifications' }, { status: 500 })
    }

    // Transform data to include provider info
    const verifications = (data || []).map((v: any) => ({
      ...v,
      user: v.user,
      provider: v.provider ? {
        id: v.provider.id,
        business_name: v.provider.business_name
      } : null
    }))

      return NextResponse.json({ verifications })
    } catch (error) {
      console.error('[admin:verifications] error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

