import { createServerSupabase } from './supabase'
import { sendBookingEmail } from './emails/booking/send'
import { NextRequest } from 'next/server'

export type ReminderType = '24h' | '2h' | 'same-day'

/**
 * Sends reminder emails for bookings based on the reminder type.
 * This should be run periodically (e.g., via cron jobs) to send reminders.
 * 
 * @param reminderType - Type of reminder: '24h' (24 hours before), '2h' (2 hours before), 'same-day' (same day morning)
 */
export async function processBookingReminders(
  request?: NextRequest,
  reminderType: ReminderType = '24h'
) {
  const supabase = createServerSupabase()

  let targetDate: Date
  let targetTime: string | null = null

  // Calculate target date and time based on reminder type
  const now = new Date()
  switch (reminderType) {
    case '24h':
      // 24 hours before = tomorrow
      targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + 1)
      break
    case '2h':
      // 2 hours before = today, but only for bookings happening in ~2 hours
      targetDate = new Date(now)
      targetDate.setHours(targetDate.getHours() + 2)
      // Only send reminders for bookings happening within the next 2-3 hours
      const twoHoursFromNow = new Date(now)
      twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)
      const threeHoursFromNow = new Date(now)
      threeHoursFromNow.setHours(threeHoursFromNow.getHours() + 3)
      targetTime = `${twoHoursFromNow.getHours().toString().padStart(2, '0')}:${twoHoursFromNow.getMinutes().toString().padStart(2, '0')}`
      break
    case 'same-day':
      // Same day morning reminders (for bookings happening today after 9 AM)
      targetDate = new Date(now)
      break
    default:
      targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + 1)
  }

  const targetDateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD format

  // Build query based on reminder type
  let query = supabase
    .from('bookings')
    .select(`
      id,
      tenant_id,
      customer_id,
      booking_date,
      booking_time,
      status
    `)
    .eq('booking_date', targetDateStr)
    .in('status', ['pending', 'confirmed'])
    .not('status', 'eq', 'cancelled')

  // For 2h reminders, filter by time range
  if (reminderType === '2h' && targetTime) {
    const twoHoursFromNow = new Date(now)
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)
    const threeHoursFromNow = new Date(now)
    threeHoursFromNow.setHours(threeHoursFromNow.getHours() + 3)
    
    const timeStart = `${twoHoursFromNow.getHours().toString().padStart(2, '0')}:${twoHoursFromNow.getMinutes().toString().padStart(2, '0')}`
    const timeEnd = `${threeHoursFromNow.getHours().toString().padStart(2, '0')}:${threeHoursFromNow.getMinutes().toString().padStart(2, '0')}`
    
    query = query.gte('booking_time', timeStart).lte('booking_time', timeEnd)
  }

  // For same-day reminders, only send for bookings after 9 AM
  if (reminderType === 'same-day') {
    query = query.gte('booking_time', '09:00')
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error(`[booking-reminder-${reminderType}] Failed to fetch bookings:`, error)
    throw error
  }

  if (!bookings || bookings.length === 0) {
    return {
      reminderType,
      processed: 0,
      sent: 0,
      errors: 0,
    }
  }

  let sent = 0
  let errors = 0

  // Send reminder emails for each booking
  for (const booking of bookings) {
    try {
      // Check if reminder was already sent (optional: track in a reminders_sent table)
      // For now, we'll send reminders each time the job runs
      
      // Pass null for request - tenant_id will be extracted from booking
      await sendBookingEmail(request || null, booking.id, 'reminder')
      sent++
    } catch (error) {
      console.error(`[booking-reminder-${reminderType}] Failed to send reminder for booking ${booking.id}:`, error)
      errors++
    }
  }

  return {
    reminderType,
    processed: bookings.length,
    sent,
    errors,
  }
}

/**
 * Sends all types of booking reminders.
 * This is a convenience function that processes all reminder types.
 */
export async function processAllBookingReminders(request?: NextRequest) {
  const results = {
    '24h': await processBookingReminders(request, '24h'),
    '2h': await processBookingReminders(request, '2h'),
    'same-day': await processBookingReminders(request, 'same-day'),
  }

  return {
    results,
    totalProcessed: results['24h'].processed + results['2h'].processed + results['same-day'].processed,
    totalSent: results['24h'].sent + results['2h'].sent + results['same-day'].sent,
    totalErrors: results['24h'].errors + results['2h'].errors + results['same-day'].errors,
  }
}

