import { NextRequest, NextResponse } from 'next/server'

// Handle contact form submissions
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // TODO: Send email notification or store in database
    // Could use Resend or similar service for email
    // Or store in a contact_submissions table in Supabase

    console.log('[v0] Contact form submission:', { name, email, subject })

    return NextResponse.json({
      message: 'Contact form submitted successfully',
    })
  } catch (error) {
    console.error('[v0] Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
