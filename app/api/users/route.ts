import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// List users
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, name, role, phone')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] List users supabase error:', error)
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
    }

    const users = (data ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      name: (u as any).name || (u as any).full_name,
      role: (u as any).role,
      phone: (u as any).phone || '',
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[v0] List users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Create/Upsert into public.users (expects an existing auth user id)
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('users')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[v0] Create user supabase error:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json({ user: data, message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


