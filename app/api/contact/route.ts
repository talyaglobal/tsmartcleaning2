import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { sendContactNotification, sendContactAutoReply } from '@/lib/emails/contact'
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { handleApiError, ApiErrors, logError } from '@/lib/api/errors'
import { validateRequestBody, RequestSchemas } from '@/lib/api/validation'

// Handle contact form submissions
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // Validate request body
    const validation = await validateRequestBody(request, RequestSchemas.contactForm)
    if (!validation.success) {
      return validation.response
    }
    
    const { firstName, lastName, email, phone, serviceType, message } = validation.data

    // Resolve tenant ID
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    // Combine first and last name for database storage
    const fullName = `${firstName.trim()} ${lastName.trim()}`

    // Store submission in database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: fullName,
        email: email.trim(),
        phone: phone?.trim() || null,
        subject: `Contact Form: ${serviceType}`,
        message: message.trim(),
        status: 'new',
        tenant_id: tenantId || null,
      })
      .select()
      .single()

    if (dbError) {
      logError('contact', dbError, { operation: 'store_submission' })
      // Continue even if DB insert fails - still try to send email
    }

    // Send email notifications
    try {
      // Send notification email to support team
      await sendContactNotification({
        name: fullName,
        email: email.trim(),
        phone: phone?.trim() || null,
        serviceType,
        message: message.trim(),
        submissionId: submission?.id,
        tenantId: tenantId || null,
      })

      // Send auto-reply email to the user
      await sendContactAutoReply({
        name: fullName,
        email: email.trim(),
        serviceType,
        tenantId: tenantId || null,
      })
    } catch (emailError) {
      logError('contact', emailError, { operation: 'send_emails' })
      // Continue - submission is stored even if email fails
    }

    return NextResponse.json({
      message: 'Contact form submitted successfully',
      submissionId: submission?.id,
    })
  } catch (error) {
    return handleApiError('contact', error, { operation: 'submit_contact_form' })
  }
}, RateLimitPresets.strict)
