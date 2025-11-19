import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

export const GET = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: { id: string } }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      
      const { data: userProfile, error } = await auth.supabase
        .from('users')
        .select('id, full_name, email, phone, avatar_url, created_at')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        console.error('[v0] Get customer profile error:', error)
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
      }

      return NextResponse.json({ profile: userProfile })
    } catch (error) {
      console.error('[v0] Get customer profile error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const PATCH = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: { id: string } }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      const body = await request.json()
      const { full_name, phone, avatar_url } = body

      const updateData: any = {}
      if (full_name !== undefined) updateData.full_name = full_name
      if (phone !== undefined) updateData.phone = phone
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url

      const { data, error } = await auth.supabase
        .from('users')
        .update(updateData)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        console.error('[v0] Update customer profile error:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      return NextResponse.json({ profile: data, message: 'Profile updated successfully' })
    } catch (error) {
      console.error('[v0] Update customer profile error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

