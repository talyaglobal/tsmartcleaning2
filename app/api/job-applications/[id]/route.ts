import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { sendJobApplicationStatusUpdate } from '@/lib/emails/job-applications'

// Get a specific job application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    const { data, error } = await supabase
      .from('job_applications')
      .select('*, job_listing:job_listing_id(*)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      console.error('[job-applications] GET by id supabase error:', error)
      return NextResponse.json({ error: 'Failed to load application' }, { status: 500 })
    }

    return NextResponse.json({ application: data })
  } catch (error) {
    console.error('[job-applications] GET by id error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a job application (admin only, for status updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    // Get current application to check if status is changing
    const { data: currentApplication, error: fetchError } = await supabase
      .from('job_applications')
      .select('*, job_listing:job_listing_id(*)')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      console.error('[job-applications] PATCH fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to load application' }, { status: 500 })
    }

    const body = await request.json()
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    // If status is being updated, set reviewed_at and reviewed_by if not provided
    const statusChanged = body.status && body.status !== currentApplication.status
    if (body.status && !body.reviewed_at) {
      updateData.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', id)
      .select('*, job_listing:job_listing_id(*)')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      console.error('[job-applications] PATCH supabase error:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // Send status update email if status changed
    if (statusChanged && data.status && currentApplication) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const trackingUrl = `${baseUrl}/careers/application-tracker?email=${encodeURIComponent(data.applicant_email)}`
        const jobTitle = (data.job_listing as any)?.title || 'Position'

        await sendJobApplicationStatusUpdate({
          applicantName: data.applicant_name,
          applicantEmail: data.applicant_email,
          jobTitle,
          status: data.status,
          notes: body.notes || undefined,
          applicationId: data.id,
          trackingUrl,
        })
      } catch (emailError) {
        console.error('[job-applications] Failed to send status update email:', emailError)
        // Non-fatal: continue even if email fails
      }
    }

    return NextResponse.json({ application: data })
  } catch (error) {
    console.error('[job-applications] PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

