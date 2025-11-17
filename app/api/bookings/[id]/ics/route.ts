import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { generateICSForBooking } from '@/lib/ics'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        booking_date,
        booking_time,
        duration_hours,
        special_instructions,
        service:service_id ( name )
      `
      )
      .eq('id', bookingId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const startISO = `${data.booking_date}T${data.booking_time}`
    const durationMinutes = Math.round(Number(data.duration_hours || 1) * 60)

    const ics = generateICSForBooking({
      id: bookingId,
      title: data.service?.name || 'Cleaning Service',
      description: data.special_instructions || 'Cleaning appointment',
      startISO,
      durationMinutes,
      location: undefined,
    })

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${bookingId}.ics"`,
      },
    })
  } catch (error) {
    console.error('[ics] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


