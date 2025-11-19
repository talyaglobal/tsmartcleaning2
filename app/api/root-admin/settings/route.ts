import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // 'general' | 'email' | 'payment' | 'integration'

    const supabase = createServerSupabase(null)
    
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: settings, error } = await query

    if (error) {
      console.error('[v0] Get settings error:', error)
      // If table doesn't exist, return empty settings
      return NextResponse.json({ settings: [] })
    }

    // Group settings by category
    const grouped: Record<string, Record<string, any>> = {}
    ;(settings || []).forEach((setting: any) => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {}
      }
      grouped[setting.category][setting.key] = setting.value
    })

    return NextResponse.json({ settings: grouped })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

export const PATCH = withRootAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { category, key, value } = body

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)
    
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        category,
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'category,key'
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Update settings error:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ setting: data, message: 'Setting updated successfully' })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[v0] Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

