import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

/**
 * POST /api/auth/reset-password
 * 
 * Two modes:
 * 1. Request reset: { email } - sends password reset email
 * 2. Reset password: { token, password } - resets password with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, password } = body

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createAnonSupabase(tenantId)

    // Mode 1: Request password reset email
    if (email && !token) {
      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }

      const origin = request.headers.get('origin') || request.headers.get('referer') || ''
      const baseUrl = origin.split('?')[0].split('#')[0]
      const redirectTo = `${baseUrl}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        // Don't reveal if email exists or not for security
        // Always return success to prevent email enumeration
        console.error('[reset-password] Error sending reset email:', error)
      }

      // Always return success message to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Mode 2: Reset password with token
    if (token && password) {
      if (!password || typeof password !== 'string' || password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        )
      }

      // For Supabase, the token from the email link needs to be handled via the callback
      // But if we receive a token hash, we can try to verify it
      try {
        // Try to verify the recovery token
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        })

        if (sessionError || !sessionData.session) {
          // If token verification fails, the token might be in a different format
          // or the user needs to go through the callback flow
          return NextResponse.json(
            { error: 'Invalid or expired reset token. Please request a new reset link.' },
            { status: 400 }
          )
        }

        // Update password using the session
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          console.error('[reset-password] Error updating password:', updateError)
          return NextResponse.json(
            { error: 'Failed to reset password. Please try again.' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Password has been reset successfully',
        })
      } catch (err) {
        console.error('[reset-password] Token verification error:', err)
        return NextResponse.json(
          { error: 'Invalid or expired reset token. Please request a new reset link.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Either email or token+password is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

