import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get a single recurring booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    const { data, error } = await supabase
      .from('recurring_bookings')
      .select('*, services(*), addresses(*), provider_profiles(*)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Recurring booking not found' }, { status: 404 })
      }
      console.error('[recurring] Get recurring booking error:', error)
      return NextResponse.json({ error: 'Failed to load recurring booking' }, { status: 500 })
    }

    return NextResponse.json({ recurringBooking: data })
  } catch (error) {
    console.error('[recurring] Get recurring booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a recurring booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    const updates = await request.json()

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // If frequency or schedule changed, recalculate next_booking_date
    if (updates.frequency || updates.dayOfWeek || updates.dayOfMonth || updates.startDate) {
      const { data: existing } = await supabase
        .from('recurring_bookings')
        .select('frequency, day_of_week, day_of_month, start_date')
        .eq('id', id)
        .single()

      if (existing) {
        const frequency = updates.frequency || existing.frequency
        const dayOfWeek = updates.dayOfWeek !== undefined ? updates.dayOfWeek : existing.day_of_week
        const dayOfMonth = updates.dayOfMonth !== undefined ? updates.dayOfMonth : existing.day_of_month
        const startDate = updates.startDate || existing.start_date

        const { data: nextDateResult } = await supabase.rpc('calculate_next_recurring_date', {
          p_frequency: frequency,
          p_start_date: startDate,
          p_day_of_week: dayOfWeek || null,
          p_day_of_month: dayOfMonth || null,
          p_current_date: new Date().toISOString().split('T')[0],
        })

        if (nextDateResult) {
          updateData.next_booking_date = nextDateResult
        }
      }
    }

    const { data, error } = await supabase
      .from('recurring_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Recurring booking not found' }, { status: 404 })
      }
      console.error('[recurring] Update recurring booking error:', error)
      return NextResponse.json({ error: 'Failed to update recurring booking' }, { status: 500 })
    }

    return NextResponse.json({
      recurringBooking: data,
      message: 'Recurring booking updated successfully',
    })
  } catch (error) {
    console.error('[recurring] Update recurring booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel/pause a recurring booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    const body = await request.json().catch(() => ({}))
    const { action = 'cancel' } = body // 'cancel' or 'pause'

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (action === 'cancel') {
      updateData.status = 'cancelled'
      updateData.cancelled_at = new Date().toISOString()
    } else if (action === 'pause') {
      updateData.status = 'paused'
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "cancel" or "pause"' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('recurring_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Recurring booking not found' }, { status: 404 })
      }
      console.error('[recurring] Cancel recurring booking error:', error)
      return NextResponse.json({ error: 'Failed to cancel recurring booking' }, { status: 500 })
    }

    return NextResponse.json({
      recurringBooking: data,
      message: `Recurring booking ${action === 'cancel' ? 'cancelled' : 'paused'} successfully`,
    })
  } catch (error) {
    console.error('[recurring] Cancel recurring booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

