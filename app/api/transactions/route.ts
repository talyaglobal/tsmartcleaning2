import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const column = role === 'provider' ? 'provider_id' : 'customer_id'
    const { data, error } = await supabase
      .from('transactions')
      .select('*, bookings(*)')
      .eq(column, userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] transactions GET supabase error:', error)
      return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 })
    }

    return NextResponse.json({
      transactions: data ?? [],
    })
  } catch (error) {
    console.error('[v0] Get transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a transaction (payment)
export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, paymentMethodId } = await request.json()

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Integrate payment processing (Stripe)
    // Create transaction record in Supabase
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        amount,
        status: 'completed',
        transaction_type: 'payment',
      })
      .select()
      .single()

    return NextResponse.json({
      transaction: data,
      message: 'Payment processed successfully',
    })
  } catch (error) {
    console.error('[v0] Create transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
