import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const body = await request.json()
    const {
      job_id,
      full_name,
      email,
      phone,
      resume_url,
      cover_letter,
      linkedin_url,
      portfolio_url,
    } = body

    if (!job_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id, full_name, and email are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        tenant_id: tenantId,
        job_id,
        full_name,
        email,
        phone: phone || null,
        resume_url: resume_url || null,
        cover_letter: cover_letter || null,
        linkedin_url: linkedin_url || null,
        portfolio_url: portfolio_url || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Submit job application error:', error)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    // Optionally send confirmation email
    // await sendEmail({ to: email, subject: 'Application Received', body: '...' })

    return NextResponse.json({
      application: data,
      message: 'Application submitted successfully',
    })
  } catch (error) {
    console.error('[v0] Submit job application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

