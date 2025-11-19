import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get a single support ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email,
          phone
        ),
        assigned_user:assigned_to (
          id,
          full_name,
          email
        ),
        messages:support_ticket_messages (
          id,
          message,
          is_internal,
          created_at,
          user_id,
          users:user_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('[v0] Get support ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a support ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, priority, assigned_to, resolved_at, closed_at } = body

    const supabase = createServerSupabase()

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to
    if (resolved_at !== undefined) updateData.resolved_at = resolved_at
    if (closed_at !== undefined) updateData.closed_at = closed_at

    // Auto-set timestamps based on status
    if (status === 'resolved' && !resolved_at) {
      updateData.resolved_at = new Date().toISOString()
    }
    if (status === 'closed' && !closed_at) {
      updateData.closed_at = new Date().toISOString()
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (ticketError) {
      console.error('[v0] Update support ticket error:', ticketError)
      return NextResponse.json(
        { error: 'Failed to update support ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('[v0] Update support ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add a message to a support ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { message, is_internal, user_id } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: ticketMessage, error: messageError } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: params.id,
        user_id,
        message,
        is_internal: is_internal || false
      })
      .select()
      .single()

    if (messageError) {
      console.error('[v0] Add support ticket message error:', messageError)
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      )
    }

    // Update ticket's updated_at timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ message: ticketMessage }, { status: 201 })
  } catch (error) {
    console.error('[v0] Add support ticket message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

