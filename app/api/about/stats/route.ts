import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get company stats for About page
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Total customers (users with role 'customer')
    const { count: customersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')

    // Total verified providers
    const { count: providersCount } = await supabase
      .from('provider_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', true)

    // Total bookings completed
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get unique cities from addresses (cities covered)
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

    // Average rating from reviews
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

