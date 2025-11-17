import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    const { data, error } = await supabase
      .from('bookings')
      .select('*, services(*), addresses(*), provider_profiles(*)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      console.error('[v0] Get booking supabase error:', error)
      return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 })
    }

    return NextResponse.json({ booking: data })
  } catch (error) {
    console.error('[v0] Get booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a booking
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

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      console.error('[v0] Update booking supabase error:', error)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    return NextResponse.json({
      booking: data,
      message: 'Booking updated successfully',
    })
  } catch (error) {
    console.error('[v0] Update booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    // Soft delete by updating status to cancelled
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      console.error('[v0] Cancel booking supabase error:', error)
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Booking cancelled successfully',
    })
  } catch (error) {
    console.error('[v0] Cancel booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
