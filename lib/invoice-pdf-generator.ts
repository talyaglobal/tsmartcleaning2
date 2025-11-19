// Invoice PDF generator
// Generates minimal PDF invoices for download

export interface InvoiceData {
	id: string
	invoice_number: string
	invoice_date: string
	due_date: string
	period_start?: string | null
	period_end?: string | null
	subtotal: number
	tax_amount: number
	total_amount: number
	paid_amount: number
	currency: string
	status: string
	payment_status: string
	description?: string | null
	notes?: string | null
	line_items?: Array<{
		description: string
		quantity?: number
		unit_price?: number
		amount: number
	}> | null
	company?: {
		name: string
		email?: string
		phone?: string
		address?: string
		city?: string
		state?: string
		zip_code?: string
	}
}

export function generateInvoicePdf(invoice: InvoiceData): Buffer {
	const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString()
	const dueDate = new Date(invoice.due_date).toLocaleDateString()
	const companyName = invoice.company?.name || 'Company'
	const companyAddress = [
		invoice.company?.address,
		invoice.company?.city,
		invoice.company?.state,
		invoice.company?.zip_code,
	]
		.filter(Boolean)
		.join(', ')

	// Build line items text
	const lineItemsText = invoice.line_items && invoice.line_items.length > 0
		? invoice.line_items
			.map((item, idx) => {
				const qty = item.quantity || 1
				const unitPrice = item.unit_price || item.amount
				return `${idx + 1}. ${escapePdfText(item.description)} - Qty: ${qty} x $${unitPrice.toFixed(2)} = $${item.amount.toFixed(2)}`
			})
			.join('\\n')
		: escapePdfText(invoice.description || 'Services rendered')

	// Build PDF content
	const title = `Invoice ${invoice.invoice_number}`
	const bodyLines = [
		`Invoice Number: ${invoice.invoice_number}`,
		`Invoice Date: ${invoiceDate}`,
		`Due Date: ${dueDate}`,
		'',
		`Bill To:`,
		companyName,
		companyAddress || '',
		invoice.company?.email || '',
		invoice.company?.phone || '',
		'',
		`Description:`,
		lineItemsText,
		'',
		`Subtotal: $${invoice.subtotal.toFixed(2)}`,
		`Tax: $${invoice.tax_amount.toFixed(2)}`,
		`Total: $${invoice.total_amount.toFixed(2)}`,
		`Paid: $${invoice.paid_amount.toFixed(2)}`,
		`Balance: $${(invoice.total_amount - invoice.paid_amount).toFixed(2)}`,
		'',
		`Status: ${invoice.status.toUpperCase()}`,
		`Payment Status: ${invoice.payment_status.toUpperCase()}`,
	]

	if (invoice.notes) {
		bodyLines.push('', `Notes: ${escapePdfText(invoice.notes)}`)
	}

	if (invoice.period_start && invoice.period_end) {
		bodyLines.splice(4, 0, `Period: ${new Date(invoice.period_start).toLocaleDateString()} - ${new Date(invoice.period_end).toLocaleDateString()}`)
	}

	const bodyText = bodyLines.join('\\n')
	const escapedTitle = escapePdfText(title)
	const escapedBody = escapePdfText(bodyText)
	const streamContent = `BT
/F1 20 Tf
72 750 Td
(${escapedTitle}) Tj
/F1 12 Tf
72 720 Td
(${escapedBody}) Tj
ET`
	const streamLength = streamContent.length

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
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000325 00000 n 
0000000749 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
835
%%EOF`

	return Buffer.from(content)
}

function escapePdfText(text: string): string {
	return text.replace(/([()\\])/g, '\\$1').replace(/\n/g, '\\n')
}

