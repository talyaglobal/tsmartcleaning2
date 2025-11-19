import { sendEmail } from './smtp'
import { createBookingEmailClient, BookingEmailPayload } from './booking'
import { createInsuranceEmailClient } from './insurance'
import { verifySMTPConnection } from './smtp'

/**
 * Email Testing Utilities
 * 
 * These utilities help test email delivery, templates, and SMTP configuration
 */

export interface EmailTestResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: string
}

/**
 * Test basic email sending functionality
 */
export async function testBasicEmail(
  to: string,
  subject: string = 'Test Email from tSmartCleaning'
): Promise<EmailTestResult> {
  try {
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Email Test Successful</h1>
        <p>This is a test email from tSmartCleaning to verify email delivery is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Recipient:</strong> ${to}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          If you received this email, your email service is configured correctly.
        </p>
      </div>
    `

    await sendEmail({
      to,
      subject,
      html: testHtml,
      text: 'Email Test Successful - This is a test email from tSmartCleaning to verify email delivery is working correctly.',
    })

    return {
      success: true,
      messageId: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Test booking confirmation email template
 */
export async function testBookingConfirmationEmail(
  to: string,
  tenantId?: string
): Promise<EmailTestResult> {
  try {
    const testPayload: BookingEmailPayload = {
      to,
      userName: 'Test User',
      bookingId: 'test-booking-id',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '14:00',
      serviceName: 'Standard Cleaning',
      address: '123 Test Street, Test City, TS 12345',
      totalAmount: 150.00,
      status: 'confirmed',
      tenantId,
      providerName: 'Test Cleaning Company',
      specialInstructions: 'Please use eco-friendly products',
    }

    const client = createBookingEmailClient(async ({ to, subject, html }) => {
      await sendEmail({ to, subject, html })
    })

    await client.sendConfirmation(testPayload)

    return {
      success: true,
      messageId: `booking-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Test password reset email (via Supabase Auth)
 * Note: This requires actual Supabase Auth integration
 */
export async function testPasswordResetEmailFlow(
  email: string,
  supabase: any
): Promise<EmailTestResult> {
  try {
    // This would trigger Supabase's password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: true,
      messageId: `password-reset-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Test insurance email templates
 */
export async function testInsuranceEmail(
  to: string,
  tenantId?: string
): Promise<EmailTestResult> {
  try {
    const client = createInsuranceEmailClient(async ({ to, subject, html }) => {
      await sendEmail({ to, subject, html })
    })

    await client.sendWelcome({
      to,
      userName: 'Test User',
      policyNumber: 'TEST-POL-2025-001',
      tenantId,
    })

    return {
      success: true,
      messageId: `insurance-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(): Promise<EmailTestResult> {
  try {
    const isConnected = await verifySMTPConnection()
    
    if (!isConnected) {
      return {
        success: false,
        error: 'SMTP connection verification failed',
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: true,
      messageId: `smtp-connection-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Run all email tests
 */
export async function runAllEmailTests(
  testEmail: string,
  tenantId?: string
): Promise<{
  smtp: EmailTestResult
  basic: EmailTestResult
  booking: EmailTestResult
  insurance: EmailTestResult
  summary: {
    total: number
    passed: number
    failed: number
  }
}> {
  const results = {
    smtp: await testSMTPConnection(),
    basic: await testBasicEmail(testEmail),
    booking: await testBookingConfirmationEmail(testEmail, tenantId),
    insurance: await testInsuranceEmail(testEmail, tenantId),
  }

  const passed = Object.values(results).filter((r) => r.success).length
  const total = Object.keys(results).length

  return {
    ...results,
    summary: {
      total,
      passed,
      failed: total - passed,
    },
  }
}

