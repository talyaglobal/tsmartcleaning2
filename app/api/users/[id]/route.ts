import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, name, role, phone, avatar_url, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('[v0] Get user supabase error:', error)
      return NextResponse.json({ error: 'Failed to load user' }, { status: 500 })
    }

    // Normalize name field
    const user = {
      ...data,
      name: data.name || data.full_name,
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[v0] Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    const updates = await request.json()

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, name, role, phone, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('[v0] Update user supabase error:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Normalize name field
    const user = {
      ...data,
      name: data.name || data.full_name,
    }

    return NextResponse.json({
      user,
      message: 'User profile updated successfully',
    })
  } catch (error) {
    console.error('[v0] Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
