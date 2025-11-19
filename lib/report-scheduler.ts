import { createServerSupabase } from './supabase'
import { generatePropertyReport } from './pdf-generator'
import { createReportEmailClient } from './emails/reports'

export interface ReportSchedule {
	id: string
	company_id: string
	property_id?: string | null
	frequency: 'daily' | 'weekly' | 'monthly'
	recipients: string[]
	is_active: boolean
	next_run_at: string
}

export async function scheduleReport(input: {
	companyId: string
	propertyId?: string
	frequency: 'daily' | 'weekly' | 'monthly'
	recipients: string[]
}) {
	const supabase = createServerSupabase()
	const nextRunAt = calculateNextRun(input.frequency)

	const { data, error } = await supabase
		.from('report_schedules')
		.insert({
			company_id: input.companyId,
			property_id: input.propertyId ?? null,
			frequency: input.frequency,
			recipients: input.recipients,
			is_active: true,
			next_run_at: nextRunAt.toISOString(),
		})
		.select()
		.single()

	if (error) throw error
	return data as unknown as ReportSchedule
}

function calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
	const now = new Date()
	switch (frequency) {
		case 'daily':
			return new Date(now.getTime() + 24 * 60 * 60 * 1000)
		case 'weekly': {
			const nextWeek = new Date(now)
			nextWeek.setDate(now.getDate() + 7)
			return nextWeek
		}
		case 'monthly': {
			const nextMonth = new Date(now)
			nextMonth.setMonth(now.getMonth() + 1)
			return nextMonth
		}
		default:
			return new Date(now.getTime() + 24 * 60 * 60 * 1000)
	}
}

async function sendEmailViaApi(tenantId: string | null, payload: { to: string; subject: string; html: string }): Promise<{ messageId?: string }> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
	const response = await fetch(`${baseUrl}/api/send-email`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(tenantId ? { 'x-tenant-id': tenantId } : {}),
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }))
		throw new Error(`Email send failed: ${error.error || response.statusText}`)
	}

	const result = await response.json()
	return { messageId: result.messageId }
}

export async function processScheduledReports() {
	const supabase = createServerSupabase()

	const { data: schedules, error } = await supabase
		.from('report_schedules')
		.select('*')
		.eq('is_active', true)
		.lte('next_run_at', new Date().toISOString())

	if (error) throw error
	for (const schedule of (schedules ?? []) as unknown as ReportSchedule[]) {
		try {
			// Fetch company info to get tenant_id and name
			const { data: company, error: companyError } = await supabase
				.from('companies')
				.select('id, name, tenant_id')
				.eq('id', schedule.company_id)
				.single()

			if (companyError || !company) {
				console.error('[v0] processScheduledReports: Company not found', schedule.company_id)
				continue
			}

			// Fetch property info if specified
			let property: { name: string } | null = null
			if (schedule.property_id) {
				const { data: propertyData } = await supabase
					.from('properties')
					.select('name')
					.eq('id', schedule.property_id)
					.single()
				property = propertyData
			}

			// Calculate report period (based on frequency)
			const now = new Date()
			let periodStart: Date
			let periodEnd: Date = now

			switch (schedule.frequency) {
				case 'daily':
					periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
					break
				case 'weekly':
					periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
					break
				case 'monthly':
					periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
					break
				default:
					periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
			}

			// Generate report
			const reportUrl = await generatePropertyReport(
				schedule.company_id,
				schedule.property_id ?? undefined,
				periodStart,
				periodEnd
			)

			// Send emails to all recipients
			const emailClient = createReportEmailClient(async ({ to, subject, html }) => {
				return await sendEmailViaApi(company.tenant_id, { to, subject, html })
			})

			const emailResults: Array<{ recipient: string; messageId?: string; error?: string }> = []

			for (const recipient of schedule.recipients) {
				try {
					const result = await emailClient.sendScheduledReport({
						to: recipient,
						companyName: company.name,
						propertyName: property?.name,
						reportUrl,
						periodStart,
						periodEnd,
						frequency: schedule.frequency,
						tenantId: company.tenant_id || undefined,
					})

					emailResults.push({
						recipient,
						messageId: result.messageId,
					})

					// Track email delivery
					await supabase.from('report_email_deliveries').insert({
						schedule_id: schedule.id,
						recipient_email: recipient,
						report_url: reportUrl,
						message_id: result.messageId,
						status: 'sent',
						sent_at: new Date().toISOString(),
					})
				} catch (emailError: any) {
					console.error(`[v0] processScheduledReports: Failed to send email to ${recipient}`, emailError)
					emailResults.push({
						recipient,
						error: emailError.message || 'Unknown error',
					})

					// Track failed email delivery
					await supabase.from('report_email_deliveries').insert({
						schedule_id: schedule.id,
						recipient_email: recipient,
						report_url: reportUrl,
						status: 'failed',
						error_message: emailError.message || 'Unknown error',
						sent_at: new Date().toISOString(),
					})
				}
			}

			// Update next run time
			const nextRunAt = calculateNextRun(schedule.frequency)
			await supabase
				.from('report_schedules')
				.update({ next_run_at: nextRunAt.toISOString() })
				.eq('id', schedule.id)

			console.log(`[v0] processScheduledReports: Processed schedule ${schedule.id}, sent ${emailResults.filter(r => !r.error).length}/${emailResults.length} emails`)
		} catch (e) {
			// Log and continue
			console.error('[v0] processScheduledReports error:', e)
		}
	}
}


