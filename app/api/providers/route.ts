import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

// Get all providers
export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const zipCode = searchParams.get('zipCode')

    const supabase = createServerSupabase()
    let query = supabase
      .from('provider_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_verified', true)

    // Optional: filter by service if provided via junction table
    if (serviceId) {
      // Filter providers who offer the serviceId
      const { data: providerServices, error: psError } = await supabase
        .from('provider_services')
        .select('provider_id')
        .eq('tenant_id', tenantId)
        .eq('service_id', serviceId)
      if (psError) {
        console.error('[v0] providers: provider_services error', psError)
        return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 })
      }
      const allowedIds = (providerServices ?? []).map((r) => r.provider_id)
      if (allowedIds.length > 0) {
        // @ts-ignore: in() types
        query = query.in('id', allowedIds)
      } else {
        return NextResponse.json({ providers: [] })
      }
    }

    // zipCode filtering would require geo/addresses; skipping pending schema
    void zipCode

    const { data, error } = await query
    if (error) {
      console.error('[v0] Get providers supabase error:', error)
      return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 })
    }

    return NextResponse.json({ providers: data ?? [] })
  } catch (error) {
    console.error('[v0] Get providers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
