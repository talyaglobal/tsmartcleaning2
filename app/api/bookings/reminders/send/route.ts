import { NextRequest, NextResponse } from 'next/server'
import { processBookingReminders, processAllBookingReminders, ReminderType } from '@/lib/booking-reminder-scheduler'
import { resolveTenantFromRequest } from '@/lib/supabase'

/**
 * API endpoint to send booking reminder emails.
 * Intended to be triggered by cron jobs at different times.
 * 
 * Query parameters:
 * - type: '24h' | '2h' | 'same-day' | 'all' (default: '24h')
 * 
 * This endpoint:
 * - Finds bookings based on reminder type
 * - Sends reminder emails to customers
 * - Returns statistics about the process
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: verify tenant context if needed
    resolveTenantFromRequest(request)

    const { searchParams } = new URL(request.url)
    const reminderType = (searchParams.get('type') || '24h') as ReminderType | 'all'

    let result

    if (reminderType === 'all') {
      result = await processAllBookingReminders(request)
    } else {
      result = await processBookingReminders(request, reminderType)
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: reminderType === 'all'
        ? `Processed ${result.totalProcessed} bookings, sent ${result.totalSent} reminders, ${result.totalErrors} errors`
        : `Processed ${result.processed} bookings, sent ${result.sent} reminders, ${result.errors} errors`,
    })
  } catch (error: any) {
    console.error('[bookings/reminders/send] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process booking reminders' },
      { status: 500 }
    )
  }
}

