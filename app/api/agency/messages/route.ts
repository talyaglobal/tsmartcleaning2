import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[v0] Get agency messages error:', error)
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('[v0] Get agency messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const body = await request.json()
    const { agencyId, to, subject, message } = body

    if (!agencyId || !to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        tenant_id: tenantId,
        agency_id: agencyId,
        to_email: to,
        subject,
        message,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Send agency message error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Optionally send email via your email service
    // await sendEmail({ to, subject, body: message })

    return NextResponse.json({ message: data, success: true })
  } catch (error) {
    console.error('[v0] Send agency message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

