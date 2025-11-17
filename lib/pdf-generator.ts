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
	endDate?: Date
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

	// Generate document (HTML for MVP)
	const documentUrl = await createReportDocument(reportData)

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

async function createReportDocument(data: ReportData): Promise<string> {
	const htmlTemplate = `
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
                    <p><strong>Total Cost:</strong> ${data.summary.totalCost.toFixed(2)}</p>
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
                        <p><strong>Services:</strong> ${job.services.join(', ')}</p>
                        <p><strong>Duration:</strong> ${(job.duration / 60).toFixed(1)} hours</p>
                        ${job.rating ? `<p class="rating">Rating: ${job.rating}/5 ⭐</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <p><strong>${job.cost.toFixed(2)}</strong></p>
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

	// For MVP: "upload" HTML and return a fake URL (replace with real storage)
	const reportId = `report_${Date.now()}_${Math.random()
		.toString(36)
		.slice(2, 9)}`
	const htmlUrl = await uploadReportHTML(htmlTemplate, reportId)

	return htmlUrl
}

async function uploadReportHTML(html: string, reportId: string): Promise<string> {
	// TODO: Replace with Supabase Storage upload
	// This is a placeholder URL for MVP
	return `https://example.com/reports/${reportId}.html`
}


