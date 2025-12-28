import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

// List favorites for a customer
export const GET = withAuthAndParams(
  async (
    _request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const userId = params.id
      const { data, error } = await auth.supabase
        .from('favorite_cleaners')
        .select('id, provider_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Favorites GET error:', error)
        return NextResponse.json({ error: 'Failed to load favorites' }, { status: 400 })
      }

      return NextResponse.json({ favorites: data || [] })
    } catch (error) {
      console.error('[v0] Favorites GET exception:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// Add a favorite cleaner
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

      const userId = params.id
      const body = await request.json()
      const providerId: string | undefined = body?.provider_id
      if (!providerId) {
        return NextResponse.json({ error: 'provider_id is required' }, { status: 400 })
      }

      const { data, error } = await auth.supabase
        .from('favorite_cleaners')
        .upsert({ user_id: userId, provider_id: providerId }, { onConflict: 'user_id,provider_id', ignoreDuplicates: false })
        .select('id, provider_id, created_at')
        .single()

      if (error) {
        console.error('[v0] Favorites POST error:', error)
        return NextResponse.json({ error: 'Failed to save favorite' }, { status: 400 })
      }

      return NextResponse.json({ favorite: data })
    } catch (error) {
      console.error('[v0] Favorites POST exception:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)

// Remove a favorite cleaner
export const DELETE = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const userId = params.id
      const { searchParams } = new URL(request.url)
      const providerId = searchParams.get('provider_id')
      if (!providerId) {
        return NextResponse.json({ error: 'provider_id query param is required' }, { status: 400 })
      }

      const { error } = await auth.supabase
        .from('favorite_cleaners')
        .delete()
        .eq('user_id', userId)
        .eq('provider_id', providerId)

      if (error) {
        console.error('[v0] Favorites DELETE error:', error)
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('[v0] Favorites DELETE exception:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
)
