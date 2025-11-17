import { NextRequest, NextResponse } from 'next/server'
import {
	generatePayoutStatement,
	payoutStatementToCSV,
	payoutStatementToMinimalPdf,
} from '@/lib/payout-statements'
import { resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	try {
		resolveTenantFromRequest(request)
		const { searchParams } = new URL(request.url)
		const providerId = searchParams.get('providerId') || undefined
		const companyId = searchParams.get('companyId') || undefined
		const start = searchParams.get('start') || undefined
		const end = searchParams.get('end') || undefined
		const format = (searchParams.get('format') || 'json').toLowerCase()

		const statement = await generatePayoutStatement({ providerId, companyId, start, end })

		if (format === 'csv') {
			const csv = payoutStatementToCSV(statement)
			return new NextResponse(csv, {
				status: 200,
				headers: {
					'Content-Type': 'text/csv; charset=utf-8',
					'Content-Disposition': 'attachment; filename="payout-statement.csv"',
				},
			})
		}
		if (format === 'pdf') {
			const pdf = payoutStatementToMinimalPdf(statement)
			return new NextResponse(pdf, {
				status: 200,
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': 'attachment; filename="payout-statement.pdf"',
				},
			})
		}

		return NextResponse.json(statement)
	} catch (error) {
		console.error('[v0] payouts/statements GET error:', error)
		return NextResponse.json({ error: 'Failed to generate payout statement' }, { status: 500 })
	}
}

