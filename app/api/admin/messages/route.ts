import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { withAuth } from '@/lib/auth/rbac'

// Get all conversations for admin
export const GET = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const supabase = authSupabase || createServerSupabase()

    let query = supabase
      .from('conversations')
      .select(`
        *,
        participant_1:users!conversations_participant_1_id_fkey(id, full_name, email, avatar_url),
        participant_2:users!conversations_participant_2_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (search) {
      // Search in participant names or message preview
      query = query.or(`last_message_preview.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[admin/messages] GET error:', error)
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
    }

    // Get total count
    let countQuery = supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (search) {
      countQuery = countQuery.or(`last_message_preview.ilike.%${search}%`)
    }

    const { count } = await countQuery

      return NextResponse.json({
        conversations: data || [],
        total: count || 0,
      })
    } catch (error) {
      console.error('[admin/messages] GET error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAdmin: true,
  }
)

// Create a new conversation and send initial message
export const POST = withAuth(
  async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
    const { participant_1_id, participant_2_id, content } = await request.json()

    if (!participant_1_id || !participant_2_id || !content) {
      return NextResponse.json(
        { error: 'participant_1_id, participant_2_id, and content are required' },
        { status: 400 }
      )
    }

      const supabase = authSupabase || createServerSupabase()

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`and(participant_1_id.eq.${participant_1_id},participant_2_id.eq.${participant_2_id}),and(participant_1_id.eq.${participant_2_id},participant_2_id.eq.${participant_1_id})`)
      .single()

    let conversationId: string

    if (existingConv) {
      conversationId = existingConv.id
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          participant_1_id,
          participant_2_id,
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        console.error('[admin/messages] POST conversation error:', convError)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }

      conversationId = newConv.id
    }

    // Send message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: participant_1_id,
        recipient_id: participant_2_id,
        content,
      })
      .select()
      .single()

    if (msgError || !message) {
      console.error('[admin/messages] POST message error:', msgError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

      return NextResponse.json({ conversation_id: conversationId, message })
    } catch (error) {
      console.error('[admin/messages] POST error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAdmin: true,
  }
)

