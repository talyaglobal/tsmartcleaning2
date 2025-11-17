import { createServerSupabase } from './supabase'
import { generatePropertyReport } from './pdf-generator'

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
			const url = await generatePropertyReport(
				schedule.company_id,
				schedule.property_id ?? undefined
			)
			// TODO: integrate email service to send report link

			const nextRunAt = calculateNextRun(schedule.frequency)
			await supabase
				.from('report_schedules')
				.update({ next_run_at: nextRunAt.toISOString() })
				.eq('id', schedule.id)
		} catch (e) {
			// Log and continue
			console.error('[v0] processScheduledReports error:', e)
		}
	}
}


