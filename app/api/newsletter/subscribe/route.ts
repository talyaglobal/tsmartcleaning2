import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import crypto from 'node:crypto'
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit'

// Subscribe to newsletter
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { email, first_name, last_name, source } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      if (existing.status === 'confirmed') {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 400 }
        )
      } else if (existing.status === 'pending') {
        return NextResponse.json(
          { message: 'Please check your email to confirm your subscription' },
          { status: 200 }
        )
      } else if (existing.status === 'unsubscribed') {
        // Allow resubscription
        const confirmationToken = crypto.randomBytes(32).toString('hex')
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'pending',
            confirmation_token: confirmationToken,
            confirmed_at: null,
            unsubscribed_at: null,
            first_name,
            last_name,
            source: source || 'blog',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('[v0] Update newsletter subscriber error:', updateError)
          return NextResponse.json(
            { error: 'Failed to resubscribe' },
            { status: 500 }
          )
        }

        // TODO: Send confirmation email
        // await sendConfirmationEmail(email, confirmationToken)

        return NextResponse.json({
          message: 'Please check your email to confirm your subscription'
        })
      }
    }

    // Create new subscription
    const confirmationToken = crypto.randomBytes(32).toString('hex')
    const unsubscribeToken = crypto.randomBytes(32).toString('hex')

    const { data: subscriber, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        first_name,
        last_name,
        status: 'pending',
        confirmation_token: confirmationToken,
        unsubscribe_token: unsubscribeToken,
        source: source || 'blog',
        metadata: {}
      })
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Create newsletter subscriber error:', insertError)
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email with double opt-in
    // await sendConfirmationEmail(email, confirmationToken)

    return NextResponse.json({
      message: 'Please check your email to confirm your subscription',
      subscriber
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Newsletter subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, RateLimitPresets.strict)

// Confirm newsletter subscription (double opt-in)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Confirmation token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: subscriber, error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('confirmation_token', token)
      .eq('status', 'pending')
      .select()
      .single()

    if (updateError || !subscriber) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Subscription confirmed successfully',
      subscriber
    })
  } catch (error) {
    console.error('[v0] Confirm newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token && !email) {
      return NextResponse.json(
        { error: 'Unsubscribe token or email is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    let query = supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (token) {
      query = query.eq('unsubscribe_token', token)
    } else if (email) {
      query = query.eq('email', email.toLowerCase())
    }

    const { data: subscriber, error: updateError } = await query
      .select()
      .single()

    if (updateError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed',
      subscriber
    })
  } catch (error) {
    console.error('[v0] Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

