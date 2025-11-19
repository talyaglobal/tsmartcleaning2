import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import {
  testBasicEmail,
  testBookingConfirmationEmail,
  testInsuranceEmail,
  testSMTPConnection,
  runAllEmailTests,
} from '@/lib/emails/testing'
import { resolveTenantFromRequest } from '@/lib/supabase'

/**
 * POST /api/emails/test
 * 
 * Test email delivery functionality
 * 
 * Body:
 * - email: string (required) - Email address to send test to
 * - testType: 'basic' | 'booking' | 'insurance' | 'smtp' | 'all' (optional, default: 'basic')
 * 
 * Requires: Admin role
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      // Only admins can test emails
      if (!isAdminRole(user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { email, testType = 'basic' } = body

      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Email address is required' },
          { status: 400 }
        )
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        )
      }

      const tenantId = resolveTenantFromRequest(request)

      let result

      switch (testType) {
        case 'smtp':
          result = await testSMTPConnection()
          break
        case 'basic':
          result = await testBasicEmail(email)
          break
        case 'booking':
          result = await testBookingConfirmationEmail(email, tenantId || undefined)
          break
        case 'insurance':
          result = await testInsuranceEmail(email, tenantId || undefined)
          break
        case 'all':
          result = await runAllEmailTests(email, tenantId || undefined)
          break
        default:
          return NextResponse.json(
            { error: `Invalid testType: ${testType}. Must be one of: basic, booking, insurance, smtp, all` },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        testType,
        result,
        message: testType === 'all'
          ? `Ran ${result.summary.total} tests: ${result.summary.passed} passed, ${result.summary.failed} failed`
          : result.success
            ? 'Test email sent successfully'
            : `Test failed: ${result.error}`,
      })
    } catch (error: any) {
      console.error('[emails/test] Error:', error)
      return NextResponse.json(
        { error: 'Failed to send test email', message: error.message },
        { status: 500 }
      )
    }
  }
)

