import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import crypto from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    
    // Extract form fields
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const businessName = formData.get('businessName') as string
    const businessDescription = formData.get('businessDescription') as string
    const yearsExperience = formData.get('yearsExperience') as string
    const serviceRadius = formData.get('serviceRadius') as string || '25'
    const hourlyRate = formData.get('hourlyRate') as string || '0'

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !businessName || !businessDescription || !yearsExperience) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabaseAuth = createAnonSupabase(tenantId)
    const supabase = createServerSupabase(tenantId)

    // Create user account
    const fullName = `${firstName} ${lastName}`
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'provider',
        },
        emailRedirectTo: `${request.headers.get('origin') || ''}/auth/callback`,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Upload helper function
    const uploadFile = async (fileField: string | null, folder: string): Promise<string | null> => {
      if (!fileField) return null
      const file = formData.get(fileField)
      if (!(file instanceof File)) return null

      try {
        const buf = Buffer.from(await file.arrayBuffer())
        const fileExtension = file.name.split('.').pop() || 'bin'
        const fileName = `${crypto.randomUUID()}.${fileExtension}`
        const path = `providers/${userId}/${folder}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('provider-documents')
          .upload(path, buf, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          })

        if (uploadError) {
          console.error(`[provider-signup] File upload error for ${fileField}:`, uploadError)
          return null
        }

        const { data: publicUrl } = supabase.storage
          .from('provider-documents')
          .getPublicUrl(path)

        return publicUrl.publicUrl
      } catch (err) {
        console.error(`[provider-signup] File upload exception for ${fileField}:`, err)
        return null
      }
    }

    // Upload documents
    const businessLicenseUrl = await uploadFile('businessLicense', 'business-license')
    const insuranceDocumentUrl = await uploadFile('insuranceDocument', 'insurance')
    const idDocumentUrl = await uploadFile('idDocument', 'id')

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          phone,
          role: 'provider',
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('[provider-signup] Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'User created, but profile setup failed' },
        { status: 500 }
      )
    }

    // Create provider profile
    const { error: providerProfileError } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: userId,
        business_name: businessName,
        business_description: businessDescription,
        years_experience: parseInt(yearsExperience, 10) || 0,
        service_radius: parseInt(serviceRadius, 10) || 25,
        hourly_rate: parseFloat(hourlyRate) || null,
        is_verified: false, // Will be verified after document review
        is_background_checked: false,
        is_insured: !!insuranceDocumentUrl,
      })

    if (providerProfileError) {
      console.error('[provider-signup] Provider profile creation error:', providerProfileError)
      return NextResponse.json(
        { error: 'Profile created, but provider profile setup failed' },
        { status: 500 }
      )
    }

    // Store document URLs in a separate table or as metadata
    // For now, we'll create a provider_documents table entry if needed
    // This is a simplified version - you may want to create a proper documents table
    if (businessLicenseUrl || insuranceDocumentUrl || idDocumentUrl) {
      // Optionally store document metadata
      // You can create a provider_documents table to track these
      console.log('[provider-signup] Documents uploaded:', {
        businessLicense: !!businessLicenseUrl,
        insurance: !!insuranceDocumentUrl,
        id: !!idDocumentUrl,
      })
    }

    // Send welcome email (optional)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || ''
      await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'Welcome to TSmart Cleaning - Verify Your Email',
          html: `
            <h1>Welcome to TSmart Cleaning, ${firstName}!</h1>
            <p>Thank you for signing up as a provider. We're excited to have you join our network.</p>
            <p>Please verify your email address by clicking the link we sent to complete your registration.</p>
            <p>Our team will review your documents and verify your account within 1-2 business days.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The TSmart Cleaning Team</p>
          `,
        }),
      }).catch((err) => {
        console.error('[provider-signup] Email send error:', err)
        // Don't fail signup if email fails
      })
    } catch (emailErr) {
      console.error('[provider-signup] Email error:', emailErr)
      // Don't fail signup if email fails
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Provider account created successfully. Please check your email to verify your account.',
      requiresEmailVerification: !authData.session, // Supabase returns session only if email confirmation is disabled
    })
  } catch (error) {
    console.error('[provider-signup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

