import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get all support tickets (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const assignedTo = searchParams.get('assigned_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const supabase = createServerSupabase()

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email
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
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('[v0] Get support tickets error:', ticketsError)
      return NextResponse.json({ error: 'Failed to load support tickets' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (priority) {
      countQuery = countQuery.eq('priority', priority)
    }
    if (category) {
      countQuery = countQuery.eq('category', category)
    }
    if (assignedTo) {
      countQuery = countQuery.eq('assigned_to', assignedTo)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('[v0] Get support tickets count error:', countError)
    }

    return NextResponse.json({
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('[v0] Get support tickets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, subject, description, category, priority } = body

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: 'Subject, description, and category are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Generate ticket number - try RPC function first, fallback to manual generation
    let ticketNumber: string
    try {
      const { data: ticketNumberData, error: ticketNumberError } = await supabase
        .rpc('generate_ticket_number')
      
      if (ticketNumberError || !ticketNumberData) {
        throw new Error('RPC function failed')
      }
      ticketNumber = ticketNumberData
    } catch {
      // Fallback if function doesn't exist or fails
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
      ticketNumber = `TKT-${dateStr}-${randomNum}`
      
      // Check if ticket number already exists and regenerate if needed
      const { data: existing } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single()
      
      if (existing) {
        // Regenerate if collision
        const randomNum2 = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
        ticketNumber = `TKT-${dateStr}-${randomNum2}`
      }
    }

    const { data: post, error: postError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id,
        subject,
        description,
        category,
        priority: priority || 'medium',
        status: 'open'
      })
      .select()
      .single()

    if (postError) {
      console.error('[v0] Create support ticket error:', postError)
      return NextResponse.json(
        { error: 'Failed to create support ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ticket: post }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create support ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

