import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
    const { slug } = await params

		const supabase = createServerSupabase()
		const { data, error } = await supabase
			.from('companies')
			.select('*')
			.eq('slug', slug)
			.eq('status', 'active')
			.single()

		if (error) {
			return NextResponse.json({ error: 'Company not found' }, { status: 404 })
		}

		// Fetch related data - handle cases where tables might not exist
		let services: any[] = []
		let reviews: any[] = []
		let photos: any[] = []

		// Try to fetch services
		try {
			const servicesResult = await supabase
				.from('company_services')
				.select('*')
				.eq('company_id', data.id)
				.eq('available', true)
				.order('service_name', { ascending: true })
			if (!servicesResult.error) {
				services = servicesResult.data || []
			}
		} catch (error) {
			// Table might not exist, continue with empty array
			console.log('company_services table not found or error:', error)
		}

		// Try to fetch reviews
		try {
			const reviewsResult = await supabase
				.from('reviews')
				.select('*')
				.or(`company_id.eq.${data.id},provider_id.eq.${data.id}`)
				.order('created_at', { ascending: false })
				.limit(50)
			if (!reviewsResult.error) {
				reviews = reviewsResult.data || []
			}
		} catch (error) {
			// Table might not exist, continue with empty array
			console.log('reviews table error:', error)
		}

		// Try to fetch photos
		try {
			const photosResult = await supabase
				.from('company_photos')
				.select('*')
				.eq('company_id', data.id)
				.order('created_at', { ascending: false })
			if (!photosResult.error) {
				photos = photosResult.data || []
			}
		} catch (error) {
			// Table might not exist, continue with empty array
			console.log('company_photos table not found or error:', error)
		}

		return NextResponse.json({
			company: data,
			services,
			reviews,
			photos
		})
	} catch (error) {
		console.error('[v0] Company by slug GET error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

