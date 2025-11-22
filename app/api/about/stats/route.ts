import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get company stats for About page (tenant-scoped)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Note: With RLS policies in place, these queries will automatically 
    // filter to the current tenant context via the current_tenant_id() function
    
    // Total customers (users with role 'customer') - tenant-scoped by RLS
    const { count: customersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')

    // Total verified providers - tenant-scoped by RLS
    const { count: providersCount } = await supabase
      .from('provider_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', true)

    // Total bookings completed - tenant-scoped by RLS
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get unique cities from addresses (cities covered) - tenant-scoped by RLS
    const { data: addresses } = await supabase
      .from('addresses')
      .select('city, state')
    
    const uniqueCities = new Set<string>()
    addresses?.forEach(addr => {
      if (addr.city && addr.state) {
        uniqueCities.add(`${addr.city}, ${addr.state}`)
      }
    })
    const citiesCount = uniqueCities.size

    // Average rating from reviews - tenant-scoped by RLS
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')

    let averageRating = 0
    if (reviews && reviews.length > 0) {
      const validRatings = reviews.filter((r: any) => r.rating != null)
      if (validRatings.length > 0) {
        const sum = validRatings.reduce((acc, r: any) => acc + (Number(r.rating) || 0), 0)
        averageRating = Math.round((sum / validRatings.length) * 10) / 10 // Round to 1 decimal
      }
    }

    const stats = {
      happyCustomers: customersCount ?? 0,
      verifiedProviders: providersCount ?? 0,
      completedBookings: bookingsCount ?? 0,
      citiesCovered: citiesCount,
      averageRating: averageRating || 4.9, // Fallback to 4.9 if no reviews
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[About Stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

