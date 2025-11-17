import { createServerSupabase } from './supabase'

export interface PayoutStatementFilters {
	providerId?: string
	companyId?: string
	start?: string | Date
	end?: string | Date
}

export interface PayoutLineItem {
	jobId: string
	date: string
	totalCents: number
	providerCents: number
	platformFeeCents: number
	processingFeeCents: number
	stripeTransferId?: string
}

export interface PayoutStatement {
	scope: { providerId?: string; companyId?: string }
	period: { start: string; end: string }
	items: PayoutLineItem[]
	summary: {
		count: number
		totalGrossCents: number
		totalProviderCents: number
		totalPlatformFeeCents: number
		totalProcessingFeeCents: number
	}
}

export async function generatePayoutStatement(
	filters: PayoutStatementFilters
): Promise<PayoutStatement> {
	const supabase = createServerSupabase()
	const end = new Date(filters.end ?? new Date())
	const start =
		filters.start instanceof Date
			? filters.start
			: new Date(filters.start ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000))

	// Load completed, payout-eligible jobs
	let jobsQuery = supabase
		.from('jobs')
		.select(
			`
      id,
      company_id,
      provider_id,
      start_datetime,
      end_datetime,
      total_amount,
      payout_processed,
      payout_amount,
      payouts(stripe_transfer_id, amount, platform_fee, processing_fee)
    `
		)
		.eq('status', 'completed')
		.gte('end_datetime', start.toISOString())
		.lte('end_datetime', end.toISOString())

	if (filters.providerId) {
		jobsQuery = jobsQuery.eq('provider_id', filters.providerId)
	}
	if (filters.companyId) {
		jobsQuery = jobsQuery.eq('company_id', filters.companyId)
	}

	const { data: jobs, error } = await jobsQuery
	if (error) {
		throw error
	}

	const items: PayoutLineItem[] =
		(jobs ?? []).map((j: any) => {
			const payout = Array.isArray(j.payouts) && j.payouts.length > 0 ? j.payouts[0] : null
			const totalCents = Math.round(Number(j.total_amount || 0) * 100)
			const providerCents = payout
				? Number(payout.amount || 0)
				: Math.round(Number(j.payout_amount || 0))
			const platformFeeCents = payout ? Number(payout.platform_fee || 0) : 0
			const processingFeeCents = payout ? Number(payout.processing_fee || 0) : 0
			return {
				jobId: j.id,
				date: new Date(j.end_datetime || j.start_datetime).toISOString(),
				totalCents,
				providerCents,
				platformFeeCents,
				processingFeeCents,
				stripeTransferId: payout?.stripe_transfer_id || undefined,
			}
		}) || []

	const summary = items.reduce(
		(acc, it) => {
			acc.count += 1
			acc.totalGrossCents += it.totalCents
			acc.totalProviderCents += it.providerCents
			acc.totalPlatformFeeCents += it.platformFeeCents
			acc.totalProcessingFeeCents += it.processingFeeCents
			return acc
		},
		{
			count: 0,
			totalGrossCents: 0,
			totalProviderCents: 0,
			totalPlatformFeeCents: 0,
			totalProcessingFeeCents: 0,
		}
	)

	return {
		scope: { providerId: filters.providerId, companyId: filters.companyId },
		period: { start: start.toISOString(), end: end.toISOString() },
		items,
		summary,
	}
}

export function payoutStatementToCSV(statement: PayoutStatement): string {
	const headers = [
		'Job ID',
		'Date',
		'Total (USD)',
		'Provider (USD)',
		'Platform Fee (USD)',
		'Processing Fee (USD)',
		'Stripe Transfer ID',
	]
	const rows = statement.items.map((i) => [
		i.jobId,
		i.date,
		(i.totalCents / 100).toFixed(2),
		(i.providerCents / 100).toFixed(2),
		(i.platformFeeCents / 100).toFixed(2),
		(i.processingFeeCents / 100).toFixed(2),
		i.stripeTransferId ?? '',
	])
	return [headers, ...rows].map((r) => r.join(',')).join('\n')
}

export function payoutStatementToMinimalPdf(statement: PayoutStatement): Buffer {
	// Minimal PDF text approach (simple and sufficient for a downloadable document in MVP)
	// Note: For production-grade PDFs, integrate a renderer (e.g., headless chromium) and storage.
	const title = `Payout Statement ${new Date(statement.period.start).toLocaleDateString()} - ${new Date(
		statement.period.end
	).toLocaleDateString()}`
	const bodyLines = statement.items
		.slice(0, 150) // keep PDF small in MVP
		.map(
			(i) =>
				`${i.jobId}  ${new Date(i.date).toLocaleDateString()}  $${(i.providerCents / 100).toFixed(2)}`
		)
		.join('\\n')
	const total = (statement.summary.totalProviderCents / 100).toFixed(2)

	const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 5 0 R >>
stream
BT
/F1 18 Tf
72 740 Td
(${escapePdfText(title)}) Tj
/F1 12 Tf
72 710 Td
(Total Provider Amount: $${total}) Tj
0 -20 Td
(Items:) Tj
/F1 10 Tf
0 -20 Td
(${escapePdfText(bodyLines)}) Tj
ET
endstream
endobj
5 0 obj
90
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000325 00000 n 
0000000749 00000 n 
0000000772 00000 n 
trailer
<< /Root 1 0 R /Size 7 >>
startxref
835
%%EOF`
	return Buffer.from(content)
}

function escapePdfText(text: string): string {
	return text.replace(/([()\\])/g, '\\$1')
}


