import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withCache, generateCacheKey } from '@/lib/cache'
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit'

type CompanyRow = {
  id: string
  name?: string
  company_name?: string
  slug?: string
  city?: string
  state?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  average_rating?: number | null
  total_reviews?: number | null
  verified?: boolean | null
  price_range?: string | null
  description?: string | null
  tagline?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  status?: string | null
  featured?: boolean | null
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8 // radius of Earth in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radiusMi = parseInt(searchParams.get('radiusMi') || '10', 10)
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const sort = (searchParams.get('sort') || 'distance') as 'distance' | 'rating' | 'featured'

    // Generate cache key
    const cacheKey = generateCacheKey('companies:search', {
      q,
      lat,
      lng,
      radiusMi,
      minRating,
      verifiedOnly,
      limit,
      offset,
      sort,
    })

    // Use cached query with 5 minute TTL
    const result = await withCache(
      cacheKey,
      async () => {
        const supabase = createServerSupabase()

        // Build base query
        let query = supabase
          .from('companies')
          .select(
            [
              'id',
              'name',
              'company_name',
              'legal_name',
              'slug',
              'city',
              'state',
              'country',
              'latitude',
              'longitude',
              'average_rating',
              'total_reviews',
              'verified',
              'price_range',
              'description',
              'tagline',
              'domain',
              'logo_url',
              'cover_image_url',
              'status',
              'featured',
            ].join(',')
          )
          .eq('status', 'active')

        // Optional text query across common fields
        if (q.length > 0) {
          // Combine ilike filters with or()
          // Try to match name/company_name/legal_name/city/state/domain/slug
          const escaped = q.replace(/[%_]/g, '\\$&')
          query = query.or(
            [
              `name.ilike.*${escaped}*`,
              `company_name.ilike.*${escaped}*`,
              `legal_name.ilike.*${escaped}*`,
              `slug.ilike.*${escaped}*`,
              `city.ilike.*${escaped}*`,
              `state.ilike.*${escaped}*`,
              `domain.ilike.*${escaped}*`,
              `tagline.ilike.*${escaped}*`,
              `description.ilike.*${escaped}*`,
            ].join(',')
          )
        }

        if (verifiedOnly) {
          query = query.eq('verified', true)
        }
        if (!Number.isNaN(minRating) && minRating > 0) {
          query = query.gte('average_rating', minRating)
        }

        // If we have lat/lng, fetch by a rough bounding box first to reduce payload, then filter client-side
        const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng)
        if (hasCoords) {
          // ~1 degree of lat ≈ 69 miles. Compute rough box to reduce scan.
          const latDelta = radiusMi / 69
          const lngDelta = radiusMi / (Math.cos(toRadians(lat)) * 69)
          query = query
            .gte('latitude', lat - latDelta)
            .lte('latitude', lat + latDelta)
            .gte('longitude', lng - lngDelta)
            .lte('longitude', lng + lngDelta)
        } else {
          // No geolocation: prioritize featured + verified first
          query = query.order('featured', { ascending: false }).order('average_rating', { ascending: false })
        }

        // Fetch a larger page to allow client-side distance filtering/sorting
        const pageSize = Math.min(limit + 100, 300)
        const { data, error } = await query.range(0, pageSize - 1)
        if (error) {
          throw new Error(error.message)
        }

        const rows = (data || []) as CompanyRow[]
        let results = rows
          .map((r) => {
            const displayName = r.name || r.company_name || 'Unknown Company'
            let distanceMiles: number | null = null
            if (hasCoords && r.latitude != null && r.longitude != null) {
              distanceMiles = haversineMiles(lat, lng, Number(r.latitude), Number(r.longitude))
            }
            return {
              id: r.id,
              name: displayName,
              slug: r.slug,
              city: r.city,
              state: r.state,
              country: r.country,
              latitude: r.latitude,
              longitude: r.longitude,
              averageRating: r.average_rating ?? null,
              totalReviews: r.total_reviews ?? 0,
              verified: !!r.verified,
              priceRange: r.price_range ?? null,
              description: r.description ?? r.tagline ?? null,
              logoUrl: r.logo_url ?? null,
              coverImageUrl: r.cover_image_url ?? null,
              featured: !!r.featured,
              distanceMiles,
            }
          })
          .filter((r) => {
            if (hasCoords && r.distanceMiles != null) {
              return r.distanceMiles <= radiusMi
            }
            return true
          })

        if (sort === 'distance' && hasCoords) {
          results.sort((a, b) => {
            const da = a.distanceMiles ?? Number.POSITIVE_INFINITY
            const db = b.distanceMiles ?? Number.POSITIVE_INFINITY
            return da - db
          })
        } else if (sort === 'rating') {
          results.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        } else if (sort === 'featured') {
          results.sort((a, b) => Number(b.featured) - Number(a.featured))
        }

        const total = results.length
        const sliced = results.slice(offset, offset + limit)

        return {
          total,
          count: sliced.length,
          results: sliced,
        }
      },
      300 // 5 minutes TTL
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('[directory] search error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}, RateLimitPresets.moderate)


