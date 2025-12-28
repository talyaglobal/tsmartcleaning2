import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'
import { withAuth } from '@/lib/auth/rbac'

// Get messages in a conversation
export const GET = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase, tenantId: authTenantId },
    { params }: { params: Promise<{ conversationId: string }> }
  ) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = authSupabase || createServerSupabase()

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1:users!conversations_participant_1_id_fkey(id, full_name, email, avatar_url),
        participant_2:users!conversations_participant_2_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, email, avatar_url),
        recipient:users!messages_recipient_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (msgError) {
      console.error('[admin/messages/[id]] GET error:', msgError)
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    // Get total count
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    return NextResponse.json({
      conversation,
      messages: (messages || []).reverse(), // Reverse to show oldest first
      total: count || 0,
    })
  } catch (error) {
    console.error('[admin/messages/[id]] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  },
  {
    requireAdmin: true,
  }
)

// Send a message in a conversation
export const POST = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase, tenantId: authTenantId },
    { params }: { params: Promise<{ conversationId: string }> }
  ) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { conversationId } = await params
      const { sender_id, recipient_id, content } = await request.json()

      if (!sender_id || !recipient_id || !content) {
        return NextResponse.json(
          { error: 'sender_id, recipient_id, and content are required' },
          { status: 400 }
        )
      }

      const supabase = authSupabase || createServerSupabase()

    // Verify conversation exists and belongs to tenant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id,
        recipient_id,
        content,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, email, avatar_url),
        recipient:users!messages_recipient_id_fkey(id, full_name, email, avatar_url)
      `)
      .single()

    if (msgError || !message) {
      console.error('[admin/messages/[id]] POST error:', msgError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('[admin/messages/[id]] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  },
  {
    requireAdmin: true,
  }
)

// Mark messages as read
export const PATCH = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase, tenantId: authTenantId },
    { params }: { params: Promise<{ conversationId: string }> }
  ) => {
    try {
      const tenantId = requireTenantId(request) || authTenantId
      const { conversationId } = await params
      const { user_id } = await request.json()

      if (!user_id) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
      }

      const supabase = authSupabase || createServerSupabase()

    // Verify conversation exists
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Mark messages as read
    const { error: updateError } = await supabase.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: user_id,
    })

    if (updateError) {
      console.error('[admin/messages/[id]] PATCH error:', updateError)
      // Fallback to manual update if RPC doesn't exist
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user_id)
        .eq('is_read', false)

      // Reset unread counts
      const { data: conv } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_2_id')
        .eq('id', conversationId)
        .single()

      if (conv) {
        const updateData: any = {}
        if (conv.participant_1_id === user_id) {
          updateData.unread_count_participant_1 = 0
        }
        if (conv.participant_2_id === user_id) {
          updateData.unread_count_participant_2 = 0
        }
        await supabase.from('conversations').update(updateData).eq('id', conversationId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/messages/[id]] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  },
  {
    requireAdmin: true,
  }
)

