// USA-specific validation, tax logic, and contractor compliance helpers
// Note: City/local tax handling is simplified. For production, integrate with a tax API.

import { createServerSupabase } from './supabase'

export const US_STATES: Record<string, string> = {
	AL: 'Alabama',
	AK: 'Alaska',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New Hampshire',
	NJ: 'New Jersey',
	NM: 'New Mexico',
	NY: 'New York',
	NC: 'North Carolina',
	ND: 'North Dakota',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	RI: 'Rhode Island',
	SC: 'South Carolina',
	SD: 'South Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming',
	DC: 'District of Columbia',
}

// Approximate base state tax rates (does not include all local rates)
export const STATE_TAX_RATES: Record<string, number> = {
	NY: 0.08875, // NYC combined rate
	CA: 0.0725, // Base rate
	TX: 0.0625, // Base rate
	FL: 0.06, // Base rate
	NJ: 0.06625, // Base rate
	PA: 0.06, // Base rate
	IL: 0.0625, // Base rate
	OH: 0.0575, // Base rate
	GA: 0.04, // Base rate
	NC: 0.0475, // Base rate
}

export interface USAddress {
	line1: string
	line2?: string
	city: string
	state: string
	zip: string
	county?: string
	phone?: string
}

export function validateUSZipCode(zip: string): boolean {
	// Patterns: 12345 or 12345-6789
	const zipRegex = /^(\d{5})(-\d{4})?$/
	return zipRegex.test(zip)
}

export function validateUSPhoneNumber(phone: string): boolean {
	// Variations for US numbers, optionally prefixed with +1/1
	const phoneRegex =
		/^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
	return phoneRegex.test(phone)
}

export function formatUSPhoneNumber(phone: string): string {
	const cleaned = phone.replace(/\D/g, '')
	if (cleaned.length === 10) {
		return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
	}
	if (cleaned.length === 11 && cleaned[0] === '1') {
		return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
	}
	return phone
}

export async function validateUSAddress(address: USAddress): Promise<{
	isValid: boolean
	formatted?: USAddress
	suggestions?: USAddress[]
	error?: string
}> {
	// Required fields
	if (!address.line1 || !address.city || !address.state || !address.zip) {
		return { isValid: false, error: 'Missing required address fields' }
	}
	// State code check
	if (!US_STATES[address.state.toUpperCase()]) {
		return { isValid: false, error: 'Invalid US state code' }
	}
	// ZIP check
	if (!validateUSZipCode(address.zip)) {
		return { isValid: false, error: 'Invalid ZIP code format' }
	}

	// For production, integrate USPS/CASS. Here we simply normalize.
	const formatted: USAddress = {
		line1: address.line1.trim(),
		line2: address.line2?.trim(),
		city: address.city.trim().toUpperCase(),
		state: address.state.toUpperCase(),
		zip: address.zip.trim(),
		phone: address.phone,
	}
	return { isValid: true, formatted }
}

export function calculateSalesTax(subtotal: number, state: string, city?: string): number {
	const stateCode = state.toUpperCase()
	const baseRate = STATE_TAX_RATES[stateCode] || 0

	// Very simplified city adjustments
	let cityRate = 0
	if (city) {
		const cityName = city.toUpperCase()
		if (stateCode === 'NY' && cityName.includes('NEW YORK')) {
			cityRate = 0.01
		} else if (stateCode === 'CA' && cityName.includes('LOS ANGELES')) {
			cityRate = 0.015
		}
	}

	const totalRate = baseRate + cityRate
	return Math.round(subtotal * totalRate * 100) / 100
}

export interface ContractorInfo {
	providerId: string
	taxId?: string // SSN or EIN
	businessName?: string
	annualEarnings: number
	requiresForm1099: boolean
}

export function requiresForm1099(annualEarnings: number): boolean {
	// IRS threshold for 1099-NEC
	return annualEarnings >= 600
}

export async function generateForm1099Data(providerId: string, year: number) {
	// In production, integrate with a tax forms provider.
	const supabase = createServerSupabase()

	const startDate = new Date(year, 0, 1)
	const endDate = new Date(year, 11, 31)

	// Example: assuming a payouts table with amount in cents and provider relations
	const { data: payouts, error } = await supabase
		.from('payouts')
		.select(
			`
      amount,
      created_at,
      providers (
        profiles ( full_name, email ),
        payout_details
      )
    `
		)
		.eq('provider_id', providerId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString())

	if (error) {
		throw error
	}

	const totalEarnings = payouts?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

	return {
		providerId,
		year,
		totalEarnings: totalEarnings / 100,
		requiresForm1099: requiresForm1099(totalEarnings / 100),
		provider: payouts?.[0]?.providers,
	}
}

export const US_TIME_ZONES: Record<string, string[]> = {
	ET: ['NY', 'FL', 'GA', 'NC', 'SC', 'VA', 'MD', 'DE', 'NJ', 'PA', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'],
	CT: ['IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'MN', 'MS', 'MO', 'NE', 'ND', 'OK', 'SD', 'TN', 'TX', 'WI'],
	MT: ['CO', 'MT', 'NM', 'UT', 'WY', 'AZ', 'ID'],
	PT: ['CA', 'NV', 'OR', 'WA'],
	AT: ['AK'],
	HT: ['HI'],
}

export function getStateTimeZone(state: string): string {
	const stateCode = state.toUpperCase()
	for (const [zone, states] of Object.entries(US_TIME_ZONES)) {
		if (states.includes(stateCode)) return zone
	}
	return 'ET'
}

export function convertToStateTime(utcDate: Date, state: string): Date {
	const timeZone = getStateTimeZone(state)
	const timeZoneMap: Record<string, string> = {
		ET: 'America/New_York',
		CT: 'America/Chicago',
		MT: 'America/Denver',
		PT: 'America/Los_Angeles',
		AT: 'America/Anchorage',
		HT: 'Pacific/Honolulu',
	}
	return new Date(
		utcDate.toLocaleString('en-US', {
			timeZone: timeZoneMap[timeZone] || 'America/New_York',
		})
	)
}

export function validateServiceArea(zipCode: string): boolean {
	// Simplified service areas; replace with geofencing or ZIP datasets in production
	const serviceZipCodes: RegExp[] = [
		// New York City area (very rough)
		/^1[0-2]\d{3}$/,
		// Los Angeles area (very rough)
		/^9[0-1]\d{3}$/,
		// Chicago area (very rough)
		/^60[0-6]\d{2}$/,
	]
	return serviceZipCodes.some((pattern) => pattern.test(zipCode))
}


