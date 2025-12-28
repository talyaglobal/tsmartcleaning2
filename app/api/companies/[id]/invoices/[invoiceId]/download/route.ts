import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { generateInvoicePdf } from '@/lib/invoice-pdf-generator'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
	try {
    const { invoiceId, id } = await params

		const supabase = createServerSupabase()

		// Fetch invoice with company details
		const { data: invoice, error: invoiceError } = await supabase
			.from('invoices')
			.select(`
				*,
				company:companies(*)
			`)
			.eq('id', invoiceId)
			.eq('company_id', id)
			.single()

		if (invoiceError || !invoice) {
			console.error('[v0] Invoice download GET error:', invoiceError)
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
		}

		// Generate PDF
		const pdfBuffer = await generateInvoicePdf(invoice)

		// Update invoice with PDF URL if not already set
		if (!invoice.pdf_url) {
			const pdfUrl = `/api/companies/${id}/invoices/${invoiceId}/download`
			await supabase
				.from('invoices')
				.update({ pdf_url: pdfUrl })
				.eq('id', invoiceId)
		}

		return new NextResponse(pdfBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
			},
		})
	} catch (error) {
		console.error('[v0] Invoice download GET error:', error)
		return NextResponse.json(
			{ error: 'Failed to generate invoice PDF' },
			{ status: 500 }
		)
	}
}

