import { createServerSupabase } from '@/lib/supabase'

export type Suggestion = {
	id: string
	title: string
	message: string
	cta?: { label: string; href: string }
	category:
		| 'cadence'
		| 'seasonal'
		| 'maintenance'
		| 'holiday'
		| 'weather'
		| 'event'
	priority: 'low' | 'medium' | 'high'
}

type BookingRow = {
	id: string
	booking_date: string // YYYY-MM-DD
	booking_time?: string | null
	service_id?: string | null
	status?: string | null
	created_at?: string | null
	service?: { name?: string | null } | null
}

function parseDate(dateStr: string | null | undefined): Date | null {
	if (!dateStr) return null
	const d = new Date(dateStr)
	return isNaN(d.getTime()) ? null : d
}

function daysBetween(a: Date, b: Date): number {
	const MS_PER_DAY = 24 * 60 * 60 * 1000
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
	return Math.round((utc2 - utc1) / MS_PER_DAY)
}

function upcomingFixedHolidays(year: number): Array<{ name: string; date: Date }> {
	// Minimal set; can be expanded or localized later
	return [
		{ name: 'Thanksgiving', date: nthWeekdayOfMonth(year, 10, 4, 4) }, // 4th Thu of Nov (month index 10)
		{ name: 'Christmas', date: new Date(Date.UTC(year, 11, 25)) }, // Dec 25
		{ name: 'New Year', date: new Date(Date.UTC(year + 1, 0, 1)) }, // Jan 1 next year
	]
}

function nthWeekdayOfMonth(year: number, monthIndex: number, nth: number, weekday: number): Date {
	// weekday: 0 Sun .. 6 Sat; monthIndex: 0 Jan .. 11 Dec
	const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1))
	const firstWeekday = firstOfMonth.getUTCDay()
	const offset = (weekday - firstWeekday + 7) % 7
	const day = 1 + offset + (nth - 1) * 7
	return new Date(Date.UTC(year, monthIndex, day))
}

function monthInRange(month: number, start: number, end: number): boolean {
	// inclusive, using month index (0-11)
	return month >= start && month <= end
}

export async function generateSuggestionsForUser(userId: string, role: 'customer' | 'provider' | 'admin' = 'customer'): Promise<Suggestion[]> {
	const supabase = createServerSupabase()

	// Fetch recent booking history
	const { data: bookingsRaw, error } = await supabase
		.from('bookings')
		.select(`
      id,
      booking_date,
      booking_time,
      service_id,
      status,
      created_at,
      service:service_id ( name )
    `)
		.eq(role === 'provider' ? 'provider_id' : 'customer_id', userId)
		.order('booking_date', { ascending: false })
		.limit(24)

	if (error) {
		console.error('[suggestions] supabase error:', error)
		return []
	}

	const bookings: BookingRow[] = (bookingsRaw || []).filter((b: any) => !!b.booking_date)
	const now = new Date()
	const todayIso = now.toISOString().split('T')[0]
	const suggestions: Suggestion[] = []

	// 1) Cadence: "You usually book every 2 weeks, schedule your next?"
	if (bookings.length >= 3) {
		const intervals: number[] = []
		for (let i = 0; i < Math.min(bookings.length - 1, 5); i++) {
			const a = parseDate(bookings[i + 1]?.booking_date)
			const b = parseDate(bookings[i]?.booking_date)
			if (a && b) intervals.push(Math.abs(daysBetween(a, b)))
		}
		if (intervals.length >= 2) {
			const avg = Math.round(intervals.reduce((s, d) => s + d, 0) / intervals.length)
			// If cadence looks like ~14 or ~30 days within tolerance, surface it
			const biweekly = Math.abs(avg - 14) <= 3
			const monthly = Math.abs(avg - 30) <= 5
			if (biweekly || monthly) {
				const lastDate = parseDate(bookings[0]?.booking_date) || now
				const nextDate = new Date(lastDate)
				nextDate.setDate(nextDate.getDate() + (biweekly ? 14 : 30))
				const label = biweekly ? 'every 2 weeks' : 'every month'
				const nextIso = nextDate.toISOString().split('T')[0]
				suggestions.push({
					id: 'cadence-next',
					title: `You usually book ${label}`,
					message: `Keep your routine going. Next slot around ${nextIso}.`,
					cta: { label: 'Schedule now', href: `/customer/book?date=${encodeURIComponent(nextIso)}` },
					category: 'cadence',
					priority: 'high',
				})
			}
		}
	}

	// 2) Seasonal: "Spring cleaning season approaching"
	const month = now.getMonth() // 0-11
	if (monthInRange(month, 2, 4)) {
		suggestions.push({
			id: `seasonal-spring-${todayIso}`,
			title: 'Spring cleaning season is here',
			message: 'Refresh your home after winter. Deep clean slots fill quickly in spring.',
			cta: { label: 'Book spring clean', href: '/customer/book?service=deep' },
			category: 'seasonal',
			priority: 'medium',
		})
	} else if (monthInRange(month, 8, 9)) {
		suggestions.push({
			id: `seasonal-fall-${todayIso}`,
			title: 'Fall cleaning prep',
			message: 'Get ahead of the busy season before holidays ramp up.',
			cta: { label: 'Plan a fall clean', href: '/customer/book' },
			category: 'seasonal',
			priority: 'low',
		})
	}

	// 3) Last deep clean was 6 months ago
	const lastDeep = bookings.find((b) => {
		const name = (b.service?.name || '').toLowerCase()
		return name.includes('deep')
	})
	if (lastDeep) {
		const lastDeepDate = parseDate(lastDeep.booking_date)
		if (lastDeepDate) {
			const diff = Math.abs(daysBetween(lastDeepDate, now))
			if (diff >= 180) {
				suggestions.push({
					id: 'maintenance-deep-6mo',
					title: 'Time for a deep clean',
					message: 'Your last deep clean was about 6 months ago. Consider a refresh.',
					cta: { label: 'Book deep clean', href: '/customer/book?service=deep' },
					category: 'maintenance',
					priority: 'high',
				})
			}
		}
	}

	// 4) Pre-holiday reminders (3–4 weeks out)
	const year = now.getUTCFullYear()
	const holidays = [
		...upcomingFixedHolidays(year),
		...upcomingFixedHolidays(year + 1), // include early next-year New Year
	]
	for (const h of holidays) {
		const diff = daysBetween(now, h.date)
		if (diff >= 21 && diff <= 35) {
			const hIso = h.date.toISOString().split('T')[0]
			suggestions.push({
				id: `holiday-${h.name}-${hIso}`,
				title: `Prep for ${h.name}`,
				message: `Spots book up fast before ${h.name}. Secure your preferred time.`,
				cta: { label: 'Book pre-holiday clean', href: '/customer/book' },
				category: 'holiday',
				priority: 'medium',
			})
		}
	}

	// 5) Weather-based suggestions (placeholder heuristic)
	// Without location and a weather API, use seasonal heuristics
	if (monthInRange(month, 11, 1)) {
		// Winter: mud/salt
		suggestions.push({
			id: `weather-winter-${todayIso}`,
			title: 'Winter mess alert',
			message: 'Snow and salt can quickly dirty floors. Consider extra mopping and entryway care.',
			cta: { label: 'Add floor care', href: '/customer/book?addon=floor-care' },
			category: 'weather',
			priority: 'low',
		})
	} else if (monthInRange(month, 3, 6)) {
		// Allergy season
		suggestions.push({
			id: `weather-allergy-${todayIso}`,
			title: 'Allergy season cleaning',
			message: 'Reduce allergens with dusting and filter-friendly cleaning.',
			cta: { label: 'Book allergy-friendly clean', href: '/customer/book' },
			category: 'weather',
			priority: 'low',
		})
	}

	// 6) Event-based (generic nudges)
	// Heuristic: long gap since last booking -> suggest move/reno resets
	const mostRecent = bookings[0]
	const mostRecentDate = parseDate(mostRecent?.booking_date)
	if (!mostRecentDate || daysBetween(mostRecentDate, now) >= 90) {
		suggestions.push({
			id: 'event-long-gap',
			title: 'Big reset clean?',
			message: 'If you moved, renovated, or hosted events, consider a reset clean.',
			cta: { label: 'Plan a reset', href: '/customer/book?service=deep' },
			category: 'event',
			priority: 'medium',
		})
	}

	return dedupeById(suggestions)
}

function dedupeById(items: Suggestion[]): Suggestion[] {
	const seen = new Set<string>()
	const out: Suggestion[] = []
	for (const s of items) {
		if (!seen.has(s.id)) {
			seen.add(s.id)
			out.push(s)
		}
	}
	return out
}


