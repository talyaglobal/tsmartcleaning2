import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

// Create a new company
export const POST = withRootAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name, description, city, state, country, email, phone, website } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)
    
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name,
        description: description || null,
        city: city || null,
        state: state || null,
        country: country || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        slug,
        status: 'active',
        verified: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[root-admin] Create company error:', error)
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      company: data, 
      message: 'Company created successfully' 
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Create company error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

