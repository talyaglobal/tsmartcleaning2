import { NextRequest, NextResponse } from 'next/server'
import { generatePropertyReport } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const companyId: string = body.companyId
		const propertyId: string | undefined = body.propertyId
		const period: string | undefined = body.period

		if (!companyId) {
			return NextResponse.json(
				{ error: 'companyId is required' },
				{ status: 400 }
			)
		}

		let start: Date | undefined
		let end: Date | undefined
		if (period === 'last_30_days') {
			end = new Date()
			start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
		}

		const reportUrl = await generatePropertyReport(companyId, propertyId, start, end)
		return NextResponse.json({ reportUrl })
	} catch (error) {
		console.error('[v0] Report generate error:', error)
		return NextResponse.json(
			{ error: 'Failed to generate report' },
			{ status: 500 }
		)
	}
}


