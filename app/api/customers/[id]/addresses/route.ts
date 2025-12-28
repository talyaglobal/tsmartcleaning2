import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

export const GET = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      
      const { data: addresses, error } = await auth.supabase
        .from('addresses')
        .select('*')
        .eq('user_id', params.id)
        .eq('tenant_id', tenantId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Get customer addresses error:', error)
        return NextResponse.json({ error: 'Failed to load addresses' }, { status: 500 })
      }

      return NextResponse.json({ addresses: addresses || [] })
    } catch (error) {
      console.error('[v0] Get customer addresses error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const POST = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      const body = await request.json()
      const { street_address, apt_suite, city, state, zip_code, is_default } = body

      if (!street_address || !city || !state || !zip_code) {
        return NextResponse.json(
          { error: 'Missing required address fields' },
          { status: 400 }
        )
      }
      
      // If this is set as default, unset other defaults
      if (is_default) {
        await auth.supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', params.id)
          .eq('tenant_id', tenantId)
      }

      const { data, error } = await auth.supabase
        .from('addresses')
        .insert({
          tenant_id: tenantId,
          user_id: params.id,
          street_address,
          apt_suite: apt_suite || null,
          city,
          state,
          zip_code,
          is_default: is_default || false,
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Create customer address error:', error)
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
      }

      return NextResponse.json({ address: data, message: 'Address added successfully' })
    } catch (error) {
      console.error('[v0] Create customer address error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

