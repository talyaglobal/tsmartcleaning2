import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { 
  sendJobApplicationConfirmation, 
  sendJobApplicationNotification 
} from '@/lib/emails/job-applications'
import crypto from 'node:crypto'

// Get job applications (filtered by job listing or applicant email)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobListingId = searchParams.get('jobListingId')
    const applicantEmail = searchParams.get('applicantEmail')
    const status = searchParams.get('status')

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    let query = supabase
      .from('job_applications')
      .select('*, job_listing:job_listing_id(*)')
      .order('created_at', { ascending: false })

    if (jobListingId) {
      query = query.eq('job_listing_id', jobListingId)
    }

    if (applicantEmail) {
      query = query.eq('applicant_email', applicantEmail)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[job-applications] GET supabase error:', error)
      return NextResponse.json({ error: 'Failed to load job applications' }, { status: 500 })
    }

    return NextResponse.json({
      applications: data ?? [],
    })
  } catch (error) {
    console.error('[job-applications] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to upload file to Supabase Storage
async function uploadFile(
  supabase: any,
  file: File,
  folder: string,
  applicationId: string
): Promise<string | null> {
  if (!file || file.size === 0) return null

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExt = file.name.split('.').pop() || 'bin'
    const fileName = `${folder}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`
    const filePath = `${applicationId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('job-applications')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error(`[job-applications] Upload error for ${folder}:`, uploadError)
      return null
    }

    const { data: publicUrl } = supabase.storage
      .from('job-applications')
      .getPublicUrl(filePath)
    return publicUrl.publicUrl
  } catch (error) {
    console.error(`[job-applications] Error uploading ${folder}:`, error)
    return null
  }
}


// Submit a job application
export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    
    // Parse application data JSON
    const applicationDataRaw = formData.get('applicationData')
    if (!applicationDataRaw || typeof applicationDataRaw !== 'string') {
      return NextResponse.json(
        { error: 'Missing application data' },
        { status: 400 }
      )
    }

    let applicationData: any
    try {
      applicationData = JSON.parse(applicationDataRaw)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid application data format' },
        { status: 400 }
      )
    }
    const { jobListingId, step1, step2, step3, step4, step5, step6, step7, step8, resume, coverLetter, portfolioUrl, linkedinUrl } = applicationData

    // Validate required fields
    if (!jobListingId || !step2?.email || !step1?.firstName || !step1?.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify job listing exists and is active
    const { data: jobListing, error: jobError } = await supabase
      .from('job_listings')
      .select('id, title, is_active, application_deadline')
      .eq('id', jobListingId)
      .single()

    if (jobError || !jobListing) {
      return NextResponse.json(
        { error: 'Job listing not found' },
        { status: 404 }
      )
    }

    if (!jobListing.is_active) {
      return NextResponse.json(
        { error: 'This job listing is no longer accepting applications' },
        { status: 400 }
      )
    }

    if (jobListing.application_deadline && new Date(jobListing.application_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'The application deadline for this job has passed' },
        { status: 400 }
      )
    }

    // Generate a unique application ID for organizing files
    const applicationIdForFiles = crypto.randomUUID()
    
    // Upload address proof files
    const addressProofUrls: string[] = []
    // Files are sent with keys like addressProof_0, addressProof_1, etc.
    let addressProofIndex = 0
    while (true) {
      const file = formData.get(`addressProof_${addressProofIndex}`) as File | null
      if (!file || !(file instanceof File) || file.size === 0) break
      const url = await uploadFile(supabase, file, `address-proof-${addressProofIndex}`, applicationIdForFiles)
      if (url) addressProofUrls.push(url)
      addressProofIndex++
    }

    // Upload other files
    const resumeFile = formData.get('resume') as File | null
    const resumeUrl = resumeFile && resumeFile instanceof File && resumeFile.size > 0
      ? await uploadFile(supabase, resumeFile, 'resume', applicationIdForFiles)
      : null

    const workPermitFile = formData.get('workPermitDocument') as File | null
    const workPermitDocumentUrl = workPermitFile && workPermitFile instanceof File && workPermitFile.size > 0
      ? await uploadFile(supabase, workPermitFile, 'work-permit', applicationIdForFiles)
      : null

    const photoFile = formData.get('photo') as File | null
    const photoUrl = photoFile && photoFile instanceof File && photoFile.size > 0
      ? await uploadFile(supabase, photoFile, 'photo', applicationIdForFiles)
      : null

    const idDocumentFile = formData.get('idDocument') as File | null
    const idDocumentUrl = idDocumentFile && idDocumentFile instanceof File && idDocumentFile.size > 0
      ? await uploadFile(supabase, idDocumentFile, 'id-document', applicationIdForFiles)
      : null

    // Prepare database record
    const applicantName = `${step1.firstName} ${step1.middleName ? step1.middleName + ' ' : ''}${step1.lastName}`.trim()

    // Update application data with file URLs
    const applicationDataWithUrls = {
      ...applicationData,
      resume_url: resumeUrl,
      step4: {
        ...applicationData.step4,
        addressProofUrls,
      },
      step5: {
        ...applicationData.step5,
        workPermitDocumentUrl,
      },
      step6: {
        ...applicationData.step6,
        photoUrl,
        idDocumentUrl,
      },
    }

    const dbRecord: any = {
      job_listing_id: jobListingId,
      applicant_email: step2.email,
      applicant_name: applicantName,
      applicant_phone: step2.phone || null,
      cover_letter: coverLetter || null,
      resume_url: resumeUrl,
      portfolio_url: portfolioUrl || null,
      linkedin_url: linkedinUrl || null,
      status: 'pending',
      address_proof_urls: addressProofUrls.length > 0 ? addressProofUrls : null,
      work_permit_document_url: workPermitDocumentUrl,
      photo_url: photoUrl,
      id_document_url: idDocumentUrl,
      // Store full application data as JSON
      application_data: applicationDataWithUrls,
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert(dbRecord)
      .select()
      .single()

    if (error) {
      console.error('[job-applications] POST supabase error:', error)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    // Get base URL for tracking link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const trackingUrl = `${baseUrl}/careers/application-tracker?email=${encodeURIComponent(step2.email)}`
    const applicationUrl = `${baseUrl}/admin/applications/${data.id}`

    // Send confirmation email to applicant
    try {
      await sendJobApplicationConfirmation({
        applicantName: step1.firstName,
        applicantEmail: step2.email,
        jobTitle: jobListing.title,
        applicationId: data.id,
        trackingUrl,
      })
    } catch (emailError) {
      console.error('[job-applications] Failed to send confirmation email:', emailError)
      // Non-fatal: continue even if email fails
    }

    // Send notification to hiring team
    try {
      const { data: jobListingDetails } = await supabase
        .from('job_listings')
        .select('department')
        .eq('id', jobListingId)
        .single()

      await sendJobApplicationNotification({
        applicantName,
        applicantEmail: step2.email,
        applicantPhone: step2.phone,
        jobTitle: jobListing.title,
        jobDepartment: jobListingDetails?.department || 'Unknown',
        applicationId: data.id,
        applicationUrl,
      })
    } catch (emailError) {
      console.error('[job-applications] Failed to send notification email:', emailError)
      // Non-fatal: continue even if email fails
    }

    return NextResponse.json({ application: data }, { status: 201 })
  } catch (error) {
    console.error('[job-applications] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

