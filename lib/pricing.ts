export interface AddOnItem {
	id: string
	name: string
	basePrice: number
	category?: string
}

export interface AddOnsCommissionConfig {
	defaultPercentage: number
	categoryOverrides?: Record<string, number>
}

export const addOnsCommission: AddOnsCommissionConfig = {
	// Default commission applied to add-ons portion only
	defaultPercentage: 18,
	// Optional category-based overrides
	categoryOverrides: {
		// example: 'pest_control': 20
	},
}

export const addOnCatalog: AddOnItem[] = [
	{ id: 'laundry_ironing', name: 'Laundry & Ironing', basePrice: 25, category: 'home_care' },
	{ id: 'interior_design', name: 'Interior Design Consultation', basePrice: 120, category: 'consulting' },
	{ id: 'organization', name: 'Organization Services', basePrice: 60, category: 'home_care' },
	{ id: 'handyman', name: 'Handyman Repairs', basePrice: 85, category: 'repairs' },
	{ id: 'gardening', name: 'Gardening / Outdoor Cleaning', basePrice: 70, category: 'outdoor' },
	{ id: 'pest_control', name: 'Pest Control', basePrice: 150, category: 'pest_control' },
	{ id: 'hvac_cleaning', name: 'HVAC Cleaning', basePrice: 140, category: 'hvac' },
	{ id: 'smart_home_setup', name: 'Smart Home Setup', basePrice: 110, category: 'tech' },
]

export function getAddOnsCommissionPercent(category?: string): number {
	if (!category) return addOnsCommission.defaultPercentage
	const override = addOnsCommission.categoryOverrides?.[category]
	return typeof override === 'number' ? override : addOnsCommission.defaultPercentage
}

export function calculateAddOnsCommission(addOnsSubtotal: number, addOnCategoryBreakdown?: Record<string, number>): number {
	// If category breakdown is provided, apply per-category overrides; otherwise apply default
	if (addOnCategoryBreakdown && Object.keys(addOnCategoryBreakdown).length > 0) {
		let total = 0
		for (const [category, subtotal] of Object.entries(addOnCategoryBreakdown)) {
			const pct = getAddOnsCommissionPercent(category) / 100
			total += subtotal * pct
		}
		return Math.round(total * 100) / 100
	}
	const pct = addOnsCommission.defaultPercentage / 100
	return Math.round(addOnsSubtotal * pct * 100) / 100
}

import { calculateSalesTax } from '@/lib/usa-compliance'

export type PricingInputs = {
	basePrice: number
	addonsTotal?: number
	demandIndex?: number
	utilization?: number
	distanceKm?: number
	freeRadiusKm?: number
	perKmAfterFree?: number
	sizeBand?: number
	bedrooms?: number
	bathrooms?: number
	pet?: boolean
	clutter?: number
	firstTime?: boolean
	month?: number
	leadHours?: number
	jobsInCart?: number
	recurring?: 'weekly' | 'biweekly' | 'monthly' | null
	city?: string
	state?: string
	serviceFeePct?: number
	taxState?: string
	taxCity?: string
}

export type PricingBreakdown = {
	base: number
	surgeMultiplier: number
	offPeakMultiplier: number
	complexityMultiplier: number
	seasonalMultiplier: number
	distanceFee: number
	lastMinuteFee: number
	bulkDiscount: number
	competitiveAdjustment: number
	subtotalBeforeFees: number
	serviceFee: number
	tax: number
	total: number
}

export function computePrice(inputs: PricingInputs): PricingBreakdown {
	const i = inputs
	const addons = i.addonsTotal ?? 0

	const surgeMultiplier = 1 + (i.demandIndex ?? 0) * 0.7
	const offPeakMultiplier = (i.utilization ?? 1) < 0.55 ? 0.9 : 1.0

	const complexityScore =
		(i.sizeBand ?? 0) * 1 +
		(i.bedrooms ?? 0) * 0.2 +
		(i.bathrooms ?? 0) * 0.4 +
		(i.pet ? 0.3 : 0) +
		(i.clutter ?? 0) * 0.5 +
		(i.firstTime ? 0.4 : 0)
	const complexityMultiplier = Math.min(1.8, 1 + 0.05 * complexityScore)

	const seasonalTable = [1, 1, 1.05, 1.1, 1.1, 1.05, 1.02, 1.07, 1.07, 1.02, 1.0, 1.12]
	const seasonalMultiplier = seasonalTable[(i.month ?? new Date().getMonth() + 1) - 1] ?? 1

	const km = Math.max(0, i.distanceKm ?? 0)
	const freeKm = i.freeRadiusKm ?? 8
	const perKm = i.perKmAfterFree ?? 0.9
	const distanceFee = Math.max(0, km - freeKm) * perKm

	const L = Math.max(0.01, i.leadHours ?? 999)
	const lastMinuteRate = L < 6 ? 0.2 : L < 24 ? 0.1 : L < 48 ? 0.05 : 0

	let bulkDiscount = 0
	if (i.recurring) {
		bulkDiscount = i.recurring === 'weekly' ? 0.12 : i.recurring === 'biweekly' ? 0.08 : 0.04
	} else {
		const n = i.jobsInCart ?? 1
		bulkDiscount = n >= 10 ? 0.15 : n >= 5 ? 0.1 : n >= 3 ? 0.05 : 0
	}

	const baseAfterMultipliers =
		i.basePrice * surgeMultiplier * offPeakMultiplier * complexityMultiplier * seasonalMultiplier

	const beforeBulk =
		baseAfterMultipliers + addons + distanceFee + baseAfterMultipliers * lastMinuteRate
	const afterBulk = beforeBulk * (1 - bulkDiscount)

	// Placeholder for future competitive adjustment integration
	const competitiveAdjustment = 0
	const adjusted = afterBulk * (1 + competitiveAdjustment)

	const subtotalBeforeFees = Math.max(0, Math.round(adjusted * 100) / 100)
	const serviceFeePct = i.serviceFeePct ?? 0.1
	const serviceFee = Math.round(subtotalBeforeFees * serviceFeePct * 100) / 100

	const taxBase = subtotalBeforeFees + serviceFee
	const tax = Math.round(calculateSalesTax(taxBase, i.taxState || '', i.taxCity) * 100) / 100

	const total = Math.round((subtotalBeforeFees + serviceFee + tax) * 100) / 100

	return {
		base: i.basePrice,
		surgeMultiplier,
		offPeakMultiplier,
		complexityMultiplier,
		seasonalMultiplier,
		distanceFee: Math.round(distanceFee * 100) / 100,
		lastMinuteFee: Math.round(baseAfterMultipliers * lastMinuteRate * 100) / 100,
		bulkDiscount,
		competitiveAdjustment,
		subtotalBeforeFees,
		serviceFee,
		tax,
		total
	}
}


