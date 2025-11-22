import { createServerSupabase } from './supabase'

export interface ReportData {
	company: {
		name: string
		id: string
	}
	property?: {
		name: string
		address: string
	}
	period: {
		start: Date
		end: Date
	}
	jobs: Array<{
		id: string
		date: Date
		customer: string
		provider: string
		services: string[]
		duration: number
		cost: number
		photos: string[]
		notes: string
		rating?: number
	}>
	summary: {
		totalJobs: number
		totalHours: number
		totalCost: number
		averageRating: number
		topServices: string[]
	}
}

export async function generatePropertyReport(
	companyId: string,
	propertyId?: string,
	startDate?: Date,
	endDate?: Date,
	template: ReportTemplate = 'detailed',
	format: 'html' | 'pdf' = 'html'
): Promise<string> {
	const supabase = createServerSupabase()

	const start =
		startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
	const end = endDate || new Date()

	// Fetch company info
	const { data: company, error: companyError } = await supabase
		.from('companies')
		.select('*')
		.eq('id', companyId)
		.single()

	if (companyError || !company) {
		throw new Error('Company not found')
	}

	// Fetch property info if specified
	let property: any = null
	if (propertyId) {
		const { data: propertyData } = await supabase
			.from('properties')
			.select('*, addresses(*)')
			.eq('id', propertyId)
			.single()
		property = propertyData
	}

	// Fetch jobs for the period
	let jobsQuery = supabase
		.from('jobs')
		.select(
			`
      *,
      profiles!jobs_customer_id_fkey(full_name),
      providers(profiles(full_name)),
      reviews(rating, comment)
    `
		)
		.eq('company_id', companyId)
		.gte('start_datetime', start.toISOString())
		.lte('start_datetime', end.toISOString())
		.eq('status', 'completed')

	if (propertyId) {
		jobsQuery = jobsQuery.eq('property_id', propertyId)
	}

	const { data: jobs } = await jobsQuery

	// Process job data
	const processedJobs =
		jobs?.map((job: any) => ({
			id: job.id,
			date: new Date(job.start_datetime),
			customer: job.profiles?.full_name || 'Unknown',
			provider: job.providers?.profiles?.full_name || 'Unassigned',
			services: job.service_ids || [],
			duration: job.timesheets?.total_minutes || 0,
			cost: job.total_amount || 0,
			photos: job.photos || [],
			notes: job.notes || '',
			rating: job.reviews?.[0]?.rating,
		})) || []

	// Calculate summary
	const ratedJobs = processedJobs.filter((j) => j.rating != null)
	const summary = {
		totalJobs: processedJobs.length,
		totalHours: processedJobs.reduce(
			(sum, job) => sum + job.duration / 60,
			0
		),
		totalCost: processedJobs.reduce((sum, job) => sum + job.cost, 0),
		averageRating:
			ratedJobs.reduce((sum, job) => sum + (job.rating as number), 0) /
				(ratedJobs.length || 1) || 0,
		topServices: [], // TODO: compute from service usage once schema confirmed
	}

	const reportData: ReportData = {
		company: { name: company.name, id: company.id },
		property: property
			? {
					name: property.name,
					address: `${property.addresses?.line1 ?? ''}${
						property.addresses?.city ? `, ${property.addresses.city}` : ''
					}${property.addresses?.state ? `, ${property.addresses.state}` : ''}`,
			  }
			: undefined,
		period: { start, end },
		jobs: processedJobs,
		summary,
	}

	// Generate document with specified template and format
	const documentUrl = await createReportDocument(reportData, template, format)

	// Persist report record (best-effort; do not fail generation if insert fails)
	try {
		await supabase
			.from('reports')
			.insert({
				company_id: companyId,
				property_id: propertyId ?? null,
				pdf_url: documentUrl,
				period_start: start.toISOString(),
				period_end: end.toISOString(),
				summary: summary as unknown as any,
			})
	} catch {
		// swallow in MVP
	}

	return documentUrl
}

export type ReportTemplate = 'detailed' | 'summary' | 'executive'

async function createReportDocument(
	data: ReportData,
	template: ReportTemplate = 'detailed',
	format: 'html' | 'pdf' = 'html'
): Promise<string> {
	const htmlTemplate = generateReportHTML(data, template)

	// Generate PDF if requested and puppeteer is available
	if (format === 'pdf') {
		try {
			const pdfUrl = await generatePDFFromHTML(htmlTemplate, data.company.name)
			return pdfUrl
		} catch (error) {
			console.error('[v0] PDF generation failed, falling back to HTML:', error)
			// Fall through to HTML generation
		}
	}

	// Upload HTML report
	const reportId = `report_${Date.now()}_${Math.random()
		.toString(36)
		.slice(2, 9)}`
	const htmlUrl = await uploadReportHTML(htmlTemplate, reportId)

	return htmlUrl
}

function generateReportHTML(data: ReportData, template: ReportTemplate): string {
	switch (template) {
		case 'summary':
			return generateSummaryTemplate(data)
		case 'executive':
			return generateExecutiveTemplate(data)
		case 'detailed':
		default:
			return generateDetailedTemplate(data)
	}
}

function generateDetailedTemplate(data: ReportData): string {
	return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Property Report - ${data.company.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .job { border-bottom: 1px solid #eee; padding: 15px 0; }
            .job:last-child { border-bottom: none; }
            .photos { display: flex; gap: 10px; margin-top: 10px; }
            .photo { width: 100px; height: 75px; object-fit: cover; border-radius: 3px; }
            .rating { color: #f59e0b; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Property Cleaning Report</h1>
            <p><strong>Company:</strong> ${data.company.name}</p>
            ${data.property ? `<p><strong>Property:</strong> ${data.property.name} - ${data.property.address}</p>` : ''}
            <p><strong>Period:</strong> ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <h2>Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div>
                    <p><strong>Total Cleanings:</strong> ${data.summary.totalJobs}</p>
                    <p><strong>Total Hours:</strong> ${data.summary.totalHours.toFixed(1)}</p>
                </div>
                <div>
                    <p><strong>Total Cost:</strong> $${data.summary.totalCost.toFixed(2)}</p>
                    <p><strong>Average Rating:</strong> ${data.summary.averageRating.toFixed(1)}/5 ⭐</p>
                </div>
            </div>
        </div>

        <h2>Detailed Job History</h2>
        ${data.jobs
					.map(
						(job) => `
            <div class="job">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3>${job.date.toLocaleDateString()} - ${job.date.toLocaleTimeString()}</h3>
                        <p><strong>Provider:</strong> ${job.provider}</p>
                        <p><strong>Services:</strong> ${job.services.join(', ') || 'N/A'}</p>
                        <p><strong>Duration:</strong> ${(job.duration / 60).toFixed(1)} hours</p>
                        ${job.rating ? `<p class="rating">Rating: ${job.rating}/5 ⭐</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <p><strong>$${job.cost.toFixed(2)}</strong></p>
                    </div>
                </div>
                ${job.notes ? `<p><strong>Notes:</strong> ${job.notes}</p>` : ''}
                ${job.photos.length > 0 ? `
                    <div class="photos">
                        ${job.photos.slice(0, 4).map(photo => `
                            <img src="${photo}" alt="Job photo" class="photo">
                        `).join('')}
                        ${job.photos.length > 4 ? `<p>+${job.photos.length - 4} more photos</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `
					)
					.join('')}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666;">
            <p>Generated by KolayCleaning - Professional Cleaning Services</p>
            <p>For questions about this report, contact your property manager.</p>
        </div>
    </body>
    </html>
  `
}

function generateSummaryTemplate(data: ReportData): string {
	return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Summary Report - ${data.company.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
            .metric { display: inline-block; margin: 15px 30px 15px 0; }
            .metric-value { font-size: 32px; font-weight: bold; }
            .metric-label { font-size: 14px; opacity: 0.9; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Cleaning Summary Report</h1>
            <p><strong>Company:</strong> ${data.company.name}</p>
            ${data.property ? `<p><strong>Property:</strong> ${data.property.name}</p>` : ''}
            <p><strong>Period:</strong> ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}</p>
        </div>

        <div class="summary">
            <h2 style="margin-top: 0;">Key Metrics</h2>
            <div class="metric">
                <div class="metric-value">${data.summary.totalJobs}</div>
                <div class="metric-label">Total Cleanings</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.totalHours.toFixed(1)}h</div>
                <div class="metric-label">Total Hours</div>
            </div>
            <div class="metric">
                <div class="metric-value">$${data.summary.totalCost.toFixed(0)}</div>
                <div class="metric-label">Total Cost</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.averageRating.toFixed(1)}⭐</div>
                <div class="metric-label">Avg Rating</div>
            </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666;">
            <p>Generated by KolayCleaning - Professional Cleaning Services</p>
        </div>
    </body>
    </html>
  `
}

function generateExecutiveTemplate(data: ReportData): string {
	const completionRate = data.summary.totalJobs > 0 ? 100 : 0
	const avgCostPerJob = data.summary.totalJobs > 0 ? data.summary.totalCost / data.summary.totalJobs : 0

	return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Executive Report - ${data.company.name}</title>
        <style>
            body { font-family: 'Georgia', serif; margin: 40px; background: #fafafa; }
            .container { background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin: 30px 0; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .metric-card { background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; }
            .metric-value { font-size: 28px; font-weight: bold; color: #2c3e50; }
            .metric-label { color: #7f8c8d; font-size: 14px; margin-top: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; color: #2c3e50;">Executive Summary Report</h1>
                <p style="color: #7f8c8d; margin: 10px 0 0 0;"><strong>${data.company.name}</strong></p>
                ${data.property ? `<p style="color: #7f8c8d;">${data.property.name}</p>` : ''}
                <p style="color: #7f8c8d;">${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}</p>
            </div>

            <div class="section">
                <h2 style="color: #2c3e50;">Performance Overview</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">${data.summary.totalJobs}</div>
                        <div class="metric-label">Services Completed</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${data.summary.totalCost.toFixed(2)}</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.summary.averageRating.toFixed(1)}</div>
                        <div class="metric-label">Average Rating</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.summary.totalHours.toFixed(1)}h</div>
                        <div class="metric-label">Total Service Hours</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${avgCostPerJob.toFixed(2)}</div>
                        <div class="metric-label">Avg Cost per Service</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${completionRate}%</div>
                        <div class="metric-label">Completion Rate</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 style="color: #2c3e50;">Quality Metrics</h2>
                <p>Average customer rating: <strong>${data.summary.averageRating.toFixed(2)}/5.0</strong></p>
                <p>Total jobs completed: <strong>${data.summary.totalJobs}</strong></p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #95a5a6; font-size: 12px;">
                <p>Generated by KolayCleaning - Professional Cleaning Services</p>
                <p>Confidential - For internal use only</p>
            </div>
        </div>
    </body>
    </html>
  `
}

/**
 * Generates a PDF from HTML using Puppeteer (if available)
 * Falls back to HTML if Puppeteer is not available
 */
async function generatePDFFromHTML(html: string, filename: string): Promise<string> {
	// Try to use Puppeteer if available
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
			format: 'A4',
			printBackground: true,
			margin: {
				top: '20px',
				right: '20px',
				bottom: '20px',
				left: '20px',
			},
		})

		await browser.close()

		// Upload PDF to storage
		const reportId = `report_${Date.now()}_${Math.random()
			.toString(36)
			.slice(2, 9)}`
		const pdfUrl = await uploadReportPDF(pdfBuffer, reportId)

		return pdfUrl
	} catch (error) {
		// If Puppeteer fails, throw to fall back to HTML
		throw error
	}
}

/**
 * Uploads report HTML to Supabase Storage
 * @param html - The HTML content to upload
 * @param reportId - Unique identifier for the report
 * @returns Public URL to access the uploaded file
 */
async function uploadReportHTML(html: string, reportId: string): Promise<string> {
	const supabase = createServerSupabase()
	
	// Convert HTML string to Buffer
	const buffer = Buffer.from(html, 'utf-8')
	
	// Validate file size (10MB limit for HTML reports)
	const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
	if (buffer.length > MAX_FILE_SIZE) {
		throw new Error(`Report file size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
	}
	
	// Create storage path: reports/{reportId}.html
	const storagePath = `reports/${reportId}.html`
	
	// Upload to Supabase Storage bucket 'reports'
	const { error: uploadError } = await supabase.storage
		.from('reports')
		.upload(storagePath, buffer, {
			contentType: 'text/html',
			upsert: false, // Don't overwrite existing files
		})
	
	if (uploadError) {
		// If file already exists, try with timestamp suffix
		if (uploadError.message?.includes('already exists')) {
			const timestampedPath = `reports/${reportId}_${Date.now()}.html`
			const { error: retryError } = await supabase.storage
				.from('reports')
				.upload(timestampedPath, buffer, {
					contentType: 'text/html',
					upsert: false,
				})
			
			if (retryError) {
				throw new Error(`Failed to upload report: ${retryError.message}`)
			}
			
			// Get public URL
			const { data: urlData } = supabase.storage
				.from('reports')
				.getPublicUrl(timestampedPath)
			
			return urlData.publicUrl
		}
		
		throw new Error(`Failed to upload report: ${uploadError.message}`)
	}
	
	// Get public URL for the uploaded file
	const { data: urlData } = supabase.storage
		.from('reports')
		.getPublicUrl(storagePath)
	
	return urlData.publicUrl
}

/**
 * Uploads report PDF to Supabase Storage
 * @param pdfBuffer - The PDF buffer to upload
 * @param reportId - Unique identifier for the report
 * @returns Public URL to access the uploaded file
 */
async function uploadReportPDF(pdfBuffer: Buffer, reportId: string): Promise<string> {
	const supabase = createServerSupabase()
	
	// Validate file size (50MB limit for PDF reports)
	const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
	if (pdfBuffer.length > MAX_FILE_SIZE) {
		throw new Error(`Report PDF size (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
	}
	
	// Create storage path: reports/{reportId}.pdf
	const storagePath = `reports/${reportId}.pdf`
	
	// Upload to Supabase Storage bucket 'reports'
	const { error: uploadError } = await supabase.storage
		.from('reports')
		.upload(storagePath, pdfBuffer, {
			contentType: 'application/pdf',
			upsert: false, // Don't overwrite existing files
		})
	
	if (uploadError) {
		// If file already exists, try with timestamp suffix
		if (uploadError.message?.includes('already exists')) {
			const timestampedPath = `reports/${reportId}_${Date.now()}.pdf`
			const { error: retryError } = await supabase.storage
				.from('reports')
				.upload(timestampedPath, pdfBuffer, {
					contentType: 'application/pdf',
					upsert: false,
				})
			
			if (retryError) {
				throw new Error(`Failed to upload PDF report: ${retryError.message}`)
			}
			
			// Get public URL
			const { data: urlData } = supabase.storage
				.from('reports')
				.getPublicUrl(timestampedPath)
			
			return urlData.publicUrl
		}
		
		throw new Error(`Failed to upload PDF report: ${uploadError.message}`)
	}
	
	// Get public URL for the uploaded file
	const { data: urlData } = supabase.storage
		.from('reports')
		.getPublicUrl(storagePath)
	
	return urlData.publicUrl
}
