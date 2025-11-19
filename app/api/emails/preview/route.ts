import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { BookingEmailTemplates } from '@/lib/emails/booking/templates'
import { InsuranceEmailTemplates } from '@/lib/emails/insurance/templates'
import { resolveTenantFromRequest } from '@/lib/supabase'

/**
 * GET /api/emails/preview
 * 
 * Preview email templates without sending
 * 
 * Query params:
 * - template: 'booking-confirmation' | 'booking-confirmed' | 'booking-reminder' | 
 *             'booking-completed' | 'booking-cancelled' | 'insurance-welcome' | 
 *             'insurance-coverage-reminder' | 'insurance-claim-filed'
 * 
 * Requires: Admin role
 */
export const GET = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      // Only admins can preview emails
      if (!isAdminRole(user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }

      const { searchParams } = new URL(request.url)
      const template = searchParams.get('template')

      if (!template) {
        return NextResponse.json(
          { error: 'Template parameter is required' },
          { status: 400 }
        )
      }

      const tenantId = resolveTenantFromRequest(request)

      // Sample data for preview
      const sampleBookingPayload = {
        to: 'test@example.com',
        userName: 'John Doe',
        bookingId: 'test-booking-123',
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: '14:00',
        serviceName: 'Standard Cleaning',
        address: '123 Test Street, Test City, TS 12345',
        totalAmount: 150.00,
        status: 'confirmed',
        tenantId: tenantId || undefined,
        providerName: 'Test Cleaning Company',
        specialInstructions: 'Please use eco-friendly products',
      }

      const sampleInsurancePayload = {
        to: 'test@example.com',
        userName: 'John Doe',
        policyNumber: 'POL-2025-001',
        tenantId: tenantId || undefined,
      }

      let preview

      switch (template) {
        case 'booking-confirmation':
          preview = await BookingEmailTemplates.confirmation(sampleBookingPayload)
          break
        case 'booking-confirmed':
          preview = await BookingEmailTemplates.confirmed(sampleBookingPayload)
          break
        case 'booking-reminder':
          preview = await BookingEmailTemplates.reminder(sampleBookingPayload)
          break
        case 'booking-completed':
          preview = await BookingEmailTemplates.completed(sampleBookingPayload)
          break
        case 'booking-cancelled':
          preview = await BookingEmailTemplates.cancelled(sampleBookingPayload)
          break
        case 'booking-refunded':
          preview = await BookingEmailTemplates.refunded(sampleBookingPayload)
          break
        case 'insurance-welcome':
          preview = await InsuranceEmailTemplates.welcome(sampleInsurancePayload)
          break
        case 'insurance-coverage-reminder':
          preview = await InsuranceEmailTemplates.coverageReminder(sampleInsurancePayload)
          break
        default:
          return NextResponse.json(
            { 
              error: `Invalid template: ${template}`,
              availableTemplates: [
                'booking-confirmation',
                'booking-confirmed',
                'booking-reminder',
                'booking-completed',
                'booking-cancelled',
                'booking-refunded',
                'insurance-welcome',
                'insurance-coverage-reminder',
              ],
            },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        template,
        subject: preview.subject,
        html: preview.html,
        // Also return as text for easier inspection
        text: preview.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      })
    } catch (error: any) {
      console.error('[emails/preview] Error:', error)
      return NextResponse.json(
        { error: 'Failed to generate preview', message: error.message },
        { status: 500 }
      )
    }
  }
)

