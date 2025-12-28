import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

export const PATCH = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string; addressId: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      const body = await request.json()
      const { street_address, apt_suite, city, state, zip_code, is_default } = body

      // If this is set as default, unset other defaults
      if (is_default) {
        await auth.supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', params.id)
          .eq('tenant_id', tenantId)
          .neq('id', params.addressId)
      }

      const updateData: any = {}
      if (street_address !== undefined) updateData.street_address = street_address
      if (apt_suite !== undefined) updateData.apt_suite = apt_suite
      if (city !== undefined) updateData.city = city
      if (state !== undefined) updateData.state = state
      if (zip_code !== undefined) updateData.zip_code = zip_code
      if (is_default !== undefined) updateData.is_default = is_default

      const { data, error } = await auth.supabase
        .from('addresses')
        .update(updateData)
        .eq('id', params.addressId)
        .eq('user_id', params.id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        console.error('[v0] Update customer address error:', error)
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
      }

      return NextResponse.json({ address: data, message: 'Address updated successfully' })
    } catch (error) {
      console.error('[v0] Update customer address error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string; addressId: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      
      const { error } = await auth.supabase
        .from('addresses')
        .delete()
        .eq('id', params.addressId)
        .eq('user_id', params.id)
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('[v0] Delete customer address error:', error)
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Address deleted successfully' })
    } catch (error) {
      console.error('[v0] Delete customer address error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

