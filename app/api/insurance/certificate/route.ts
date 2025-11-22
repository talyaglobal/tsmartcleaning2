import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

async function generateCertificateHTML(policy: any, plan: any, user: any): Promise<string> {
	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '—'
		return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
	}

	const formatCurrency = (amount: number | null) => {
		if (amount === null || amount === undefined) return '—'
		return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
	}

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Insurance Certificate - ${policy.policy_number}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Georgia', 'Times New Roman', serif;
			background: #fff;
			color: #2c3e50;
			line-height: 1.6;
		}
		.container {
			max-width: 800px;
			margin: 0 auto;
			padding: 40px;
		}
		.header {
			text-align: center;
			border-bottom: 4px solid #3498db;
			padding-bottom: 30px;
			margin-bottom: 40px;
		}
		.header h1 {
			font-size: 36px;
			color: #2c3e50;
			margin-bottom: 10px;
			letter-spacing: 2px;
		}
		.header .subtitle {
			font-size: 18px;
			color: #7f8c8d;
			text-transform: uppercase;
			letter-spacing: 1px;
		}
		.certificate-body {
			margin: 40px 0;
		}
		.section {
			margin-bottom: 30px;
		}
		.section-title {
			font-size: 20px;
			font-weight: bold;
			color: #2c3e50;
			margin-bottom: 15px;
			border-bottom: 2px solid #ecf0f1;
			padding-bottom: 8px;
		}
		.info-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 20px;
			margin-bottom: 20px;
		}
		.info-item {
			padding: 15px;
			background: #f8f9fa;
			border-left: 4px solid #3498db;
		}
		.info-label {
			font-size: 12px;
			text-transform: uppercase;
			color: #7f8c8d;
			letter-spacing: 0.5px;
			margin-bottom: 5px;
		}
		.info-value {
			font-size: 16px;
			font-weight: bold;
			color: #2c3e50;
		}
		.coverage-table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 15px;
		}
		.coverage-table th,
		.coverage-table td {
			padding: 12px;
			text-align: left;
			border-bottom: 1px solid #ecf0f1;
		}
		.coverage-table th {
			background: #3498db;
			color: white;
			font-weight: bold;
			text-transform: uppercase;
			font-size: 12px;
			letter-spacing: 0.5px;
		}
		.coverage-table td {
			background: #f8f9fa;
		}
		.coverage-table tr:last-child td {
			border-bottom: none;
		}
		.footer {
			margin-top: 60px;
			padding-top: 30px;
			border-top: 2px solid #ecf0f1;
			text-align: center;
			color: #7f8c8d;
			font-size: 12px;
		}
		.footer .disclaimer {
			margin-top: 20px;
			font-style: italic;
			text-align: left;
			max-width: 600px;
			margin-left: auto;
			margin-right: auto;
		}
		.badge {
			display: inline-block;
			padding: 8px 16px;
			background: #27ae60;
			color: white;
			border-radius: 4px;
			font-weight: bold;
			font-size: 14px;
			text-transform: uppercase;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>CleanGuard Protection</h1>
			<div class="subtitle">Certificate of Insurance</div>
		</div>

		<div class="certificate-body">
			<div class="section">
				<div class="section-title">Policy Information</div>
				<div class="info-grid">
					<div class="info-item">
						<div class="info-label">Policy Number</div>
						<div class="info-value">${policy.policy_number}</div>
					</div>
					<div class="info-item">
						<div class="info-label">Plan</div>
						<div class="info-value">${plan.name}</div>
					</div>
					<div class="info-item">
						<div class="info-label">Policyholder</div>
						<div class="info-value">${user?.full_name || user?.name || 'N/A'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">Status</div>
						<div class="info-value">
							<span class="badge">${policy.status === 'active' ? 'Active' : policy.status}</span>
						</div>
					</div>
					<div class="info-item">
						<div class="info-label">Effective Date</div>
						<div class="info-value">${formatDate(policy.effective_date)}</div>
					</div>
					<div class="info-item">
						<div class="info-label">Expiration Date</div>
						<div class="info-value">${formatDate(policy.expiration_date)}</div>
					</div>
				</div>
			</div>

			<div class="section">
				<div class="section-title">Coverage Details</div>
				<table class="coverage-table">
					<thead>
						<tr>
							<th>Coverage Type</th>
							<th>Coverage Amount</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Property Damage</td>
							<td>${formatCurrency(plan.property_damage_limit)}</td>
						</tr>
						${plan.theft_limit ? `
						<tr>
							<td>Theft Protection</td>
							<td>${formatCurrency(plan.theft_limit)}</td>
						</tr>
						` : ''}
						<tr>
							<td>Liability Coverage</td>
							<td>${formatCurrency(plan.liability_limit)}</td>
						</tr>
						${plan.key_replacement_limit ? `
						<tr>
							<td>Key Replacement</td>
							<td>${formatCurrency(plan.key_replacement_limit)}</td>
						</tr>
						` : ''}
						<tr>
							<td>Deductible</td>
							<td>${formatCurrency(plan.deductible)}</td>
						</tr>
						${plan.emergency_cleans_per_year > 0 ? `
						<tr>
							<td>Emergency Cleanings per Year</td>
							<td>${plan.emergency_cleans_per_year}</td>
						</tr>
						` : ''}
					</tbody>
				</table>
			</div>

			<div class="section">
				<div class="section-title">Billing Information</div>
				<div class="info-grid">
					<div class="info-item">
						<div class="info-label">Billing Cycle</div>
						<div class="info-value">${policy.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">Auto-Renew</div>
						<div class="info-value">${policy.auto_renew ? 'Yes' : 'No'}</div>
					</div>
				</div>
			</div>
		</div>

		<div class="footer">
			<p><strong>Certificate Generated:</strong> ${new Date().toLocaleString('en-US')}</p>
			<div class="disclaimer">
				<p><strong>Disclaimer:</strong> This certificate is provided as proof of insurance coverage. 
				Coverage details are subject to the terms and conditions of the insurance policy. 
				For questions or to file a claim, please contact your insurance provider or visit 
				our claims portal.</p>
			</div>
		</div>
	</div>
</body>
</html>
`
}

async function generatePDFFromHTML(html: string, filename: string): Promise<Buffer> {
	try {
		// Check if puppeteer is available before attempting import
		const moduleName = 'puppeteer'
		const puppeteer = await import(moduleName).catch(() => null)
		if (!puppeteer) {
			throw new Error('Puppeteer not available')
		}

		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})

		const page = await browser.newPage()
		await page.setContent(html, { waitUntil: 'networkidle0' })

		const pdfBuffer = await page.pdf({
			format: 'Letter',
			printBackground: true,
			margin: {
				top: '20px',
				right: '20px',
				bottom: '20px',
				left: '20px',
			},
		})

		await browser.close()
		return pdfBuffer
	} catch (error) {
		throw error
	}
}

export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const { searchParams } = new URL(request.url)
		const policyId = searchParams.get('policy_id')
		const policyNumber = searchParams.get('policy_number')
		const userId = searchParams.get('user_id')

		if (!policyId && !policyNumber && !userId) {
			return NextResponse.json({ error: 'policy_id, policy_number, or user_id is required' }, { status: 400 })
		}

		// Fetch policy
		let policyQuery = supabase
			.from('insurance_policies')
			.select(`
				*,
				insurance_plans(*)
			`)

		if (policyId) {
			policyQuery = policyQuery.eq('id', policyId)
		} else if (policyNumber) {
			policyQuery = policyQuery.eq('policy_number', policyNumber)
		} else if (userId) {
			policyQuery = policyQuery.eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false })
		}

		if (tenantId) {
			policyQuery = policyQuery.eq('tenant_id', tenantId)
		}

		const { data: policies, error: policyError } = await policyQuery

		if (policyError || !policies || policies.length === 0) {
			return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
		}

		const policy = Array.isArray(policies) ? policies[0] : policies
		const plan = (policy as any).insurance_plans

		if (!plan) {
			return NextResponse.json({ error: 'Plan information not found' }, { status: 404 })
		}

		// Fetch user information
		const { data: user } = await supabase
			.from('users')
			.select('id, full_name, name, email')
			.eq('id', policy.user_id)
			.single()

		// Generate HTML certificate
		const html = await generateCertificateHTML(policy, plan, user || null)

		// Try to generate PDF, fall back to HTML
		try {
			const pdfBuffer = await generatePDFFromHTML(html, `certificate_${policy.policy_number}`)
			return new NextResponse(pdfBuffer, {
				status: 200,
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="CleanGuard_Certificate_${policy.policy_number}.pdf"`,
				},
			})
		} catch (pdfError) {
			// Fall back to HTML
			console.warn('[insurance/certificate] PDF generation failed, returning HTML:', pdfError)
			return new NextResponse(html, {
				status: 200,
				headers: {
					'Content-Type': 'text/html',
					'Content-Disposition': `attachment; filename="CleanGuard_Certificate_${policy.policy_number}.html"`,
				},
			})
		}
	} catch (error: any) {
		console.error('[insurance/certificate] Error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


