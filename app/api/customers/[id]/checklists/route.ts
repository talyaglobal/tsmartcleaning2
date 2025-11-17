import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// List checklists for a customer
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('custom_checklists')
      .select('id, name, items, is_default, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Checklists GET error:', error)
      return NextResponse.json({ error: 'Failed to load checklists' }, { status: 400 })
    }

    return NextResponse.json({ checklists: data || [] })
  } catch (error) {
    console.error('[v0] Checklists GET exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a checklist
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()
    const name: string | undefined = body?.name
    const items: unknown = body?.items
    const isDefault: boolean = Boolean(body?.is_default)
    if (!name || !items) {
      return NextResponse.json({ error: 'name and items are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    // If creating default, unset others
    if (isDefault) {
      await supabase.from('custom_checklists').update({ is_default: false }).eq('user_id', userId)
    }
    const { data, error } = await supabase
      .from('custom_checklists')
      .insert({ user_id: userId, name, items, is_default: isDefault })
      .select('id, name, items, is_default, created_at, updated_at')
      .single()

    if (error) {
      console.error('[v0] Checklists POST error:', error)
      return NextResponse.json({ error: 'Failed to create checklist' }, { status: 400 })
    }

    return NextResponse.json({ checklist: data })
  } catch (error) {
    console.error('[v0] Checklists POST exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update a checklist (name/items/is_default)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()
    const checklistId: string | undefined = body?.id
    if (!checklistId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof body?.name === 'string') updates.name = body.name
    if (typeof body?.items !== 'undefined') updates.items = body.items
    if (typeof body?.is_default === 'boolean') updates.is_default = body.is_default

    const supabase = createServerSupabase()
    if (updates.is_default === true) {
      await supabase.from('custom_checklists').update({ is_default: false }).eq('user_id', userId)
    }

    const { data, error } = await supabase
      .from('custom_checklists')
      .update(updates)
      .eq('id', checklistId)
      .eq('user_id', userId)
      .select('id, name, items, is_default, created_at, updated_at')
      .single()

    if (error) {
      console.error('[v0] Checklists PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update checklist' }, { status: 400 })
    }

    return NextResponse.json({ checklist: data })
  } catch (error) {
    console.error('[v0] Checklists PATCH exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('custom_checklists')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Checklists DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Checklists DELETE exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


