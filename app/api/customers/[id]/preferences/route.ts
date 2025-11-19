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
      
      const { data: preferences, error } = await auth.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[v0] Get customer preferences error:', error)
        return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
      }

      // Return default preferences if none exist
      const defaultPreferences = {
        special_instructions: null,
        preferred_cleaning_time: null,
        eco_friendly: false,
        pet_friendly: false,
        notification_email: true,
        notification_sms: false,
        notification_push: true,
      }

      return NextResponse.json({ preferences: preferences || defaultPreferences })
    } catch (error) {
      console.error('[v0] Get customer preferences error:', error)
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
      const {
        special_instructions,
        preferred_cleaning_time,
        eco_friendly,
        pet_friendly,
        notification_email,
        notification_sms,
        notification_push,
      } = body

      const updateData: any = {}
      if (special_instructions !== undefined) updateData.special_instructions = special_instructions
      if (preferred_cleaning_time !== undefined) updateData.preferred_cleaning_time = preferred_cleaning_time
      if (eco_friendly !== undefined) updateData.eco_friendly = eco_friendly
      if (pet_friendly !== undefined) updateData.pet_friendly = pet_friendly
      if (notification_email !== undefined) updateData.notification_email = notification_email
      if (notification_sms !== undefined) updateData.notification_sms = notification_sms
      if (notification_push !== undefined) updateData.notification_push = notification_push

      const { data, error } = await auth.supabase
        .from('user_preferences')
        .upsert({
          tenant_id: tenantId,
          user_id: params.id,
          ...updateData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,tenant_id'
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Update customer preferences error:', error)
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
      }

      return NextResponse.json({ preferences: data, message: 'Preferences updated successfully' })
    } catch (error) {
      console.error('[v0] Update customer preferences error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
