import { NextRequest, NextResponse } from 'next/server'
import { computePrice, PricingInputs } from '@/lib/pricing'

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json().catch(() => ({}))) as Partial<PricingInputs>

		if (!body || typeof body.basePrice !== 'number') {
			return NextResponse.json({ error: 'basePrice is required' }, { status: 400 })
		}

		const result = computePrice({
			basePrice: body.basePrice,
			addonsTotal: body.addonsTotal ?? 0,
			demandIndex: body.demandIndex ?? 0,
			utilization: body.utilization ?? 1,
			distanceKm: body.distanceKm ?? 0,
			freeRadiusKm: body.freeRadiusKm ?? 8,
			perKmAfterFree: body.perKmAfterFree ?? 0.9,
			sizeBand: body.sizeBand ?? 0,
			bedrooms: body.bedrooms ?? 0,
			bathrooms: body.bathrooms ?? 0,
			pet: !!body.pet,
			clutter: body.clutter ?? 0,
			firstTime: !!body.firstTime,
			month: body.month,
			leadHours: body.leadHours ?? 999,
			jobsInCart: body.jobsInCart ?? 1,
			recurring: body.recurring ?? null,
			city: body.city,
			state: body.state,
			serviceFeePct: body.serviceFeePct ?? 0.1,
			taxState: body.taxState,
			taxCity: body.taxCity
		})

		return NextResponse.json({ quote: result })
	} catch (error) {
		console.error('[pricing/quote] error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


