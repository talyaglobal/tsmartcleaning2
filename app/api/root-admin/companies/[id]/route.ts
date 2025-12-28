import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

// Get a company by ID
export const GET = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = createServerSupabase(null)
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('[root-admin] Get company error:', error)
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ company: data })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Get company error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

// Update a company
export const PATCH = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const body = await request.json()
    const { name, description, city, state, country, email, phone, website } = body

    const supabase = createServerSupabase(null)
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updateData.name = name
      // Regenerate slug if name changed
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    if (description !== undefined) updateData.description = description
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (country !== undefined) updateData.country = country
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (website !== undefined) updateData.website = website

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[root-admin] Update company error:', error)
      return NextResponse.json(
        { error: 'Failed to update company' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      company: data, 
      message: 'Company updated successfully' 
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Update company error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

