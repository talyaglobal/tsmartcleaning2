import { NextRequest, NextResponse } from 'next/server'
import { generatePropertyReport, ReportTemplate } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const companyId: string = body.companyId
		const propertyId: string | undefined = body.propertyId
		const period: string | undefined = body.period
		const template: ReportTemplate = body.template || 'detailed'
		const format: 'html' | 'pdf' = body.format || 'html'
		const startDate: string | undefined = body.startDate
		const endDate: string | undefined = body.endDate

		if (!companyId) {
			return NextResponse.json(
				{ error: 'companyId is required' },
				{ status: 400 }
			)
		}

		let start: Date | undefined
		let end: Date | undefined
		
		if (startDate && endDate) {
			start = new Date(startDate)
			end = new Date(endDate)
		} else if (period === 'last_30_days') {
			end = new Date()
			start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
		} else if (period === 'last_7_days') {
			end = new Date()
			start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
		} else if (period === 'last_90_days') {
			end = new Date()
			start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
		}

		const reportUrl = await generatePropertyReport(
			companyId,
			propertyId,
			start,
			end,
			template,
			format
		)
		return NextResponse.json({ reportUrl, template, format })
	} catch (error: any) {
		console.error('[v0] Report generate error:', error)
		return NextResponse.json(
			{ error: 'Failed to generate report', message: error.message },
			{ status: 500 }
		)
	}
}


