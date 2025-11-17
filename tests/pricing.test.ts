import { describe, it, expect } from 'vitest'
import { computePrice, calculateAddOnsCommission, getAddOnsCommissionPercent } from '@/lib/pricing'

describe('pricing.computePrice', () => {
	it('computes deterministic breakdown with basic inputs', () => {
		const result = computePrice({
			basePrice: 100,
			addonsTotal: 20,
			demandIndex: 0.2, // +14%
			utilization: 0.6, // no off-peak
			distanceKm: 15,
			freeRadiusKm: 10,
			perKmAfterFree: 1,
			sizeBand: 2,
			bedrooms: 2,
			bathrooms: 1,
			pet: false,
			clutter: 1,
			firstTime: false,
			month: 1, // seasonal 1.0
			leadHours: 72,
			jobsInCart: 1,
			recurring: null,
			serviceFeePct: 0.1,
			taxState: 'CA',
			taxCity: 'San Francisco',
		})

		// Basic shape assertions
		expect(result.base).toBe(100)
		expect(result.subtotalBeforeFees).toBeGreaterThan(0)
		expect(result.serviceFee).toBeCloseTo(result.subtotalBeforeFees * 0.1, 2)
		expect(result.total).toBeGreaterThan(result.subtotalBeforeFees)
		// Reasonable ranges
		expect(result.surgeMultiplier).toBeGreaterThanOrEqual(1)
		expect(result.complexityMultiplier).toBeGreaterThanOrEqual(1)
		expect(result.distanceFee).toBeCloseTo(5, 2) // 15km - 10km = 5 * $1
	})
})

describe('pricing add-ons commission helpers', () => {
	it('returns default commission when no category', () => {
		expect(getAddOnsCommissionPercent()).toBeGreaterThan(0)
	})

	it('applies default commission to subtotal when no breakdown provided', () => {
		const amount = calculateAddOnsCommission(100)
		// default is 18% per current config
		expect(amount).toBeCloseTo(18, 2)
	})

	it('applies per-category overrides when breakdown is provided', () => {
		// Ensure override behaves even if category has no explicit override (falls back to default)
		const total = calculateAddOnsCommission(0, {
			home_care: 50,
			pest_control: 50,
		})
		// With current config, both categories default to 18% (no overrides set)
		expect(total).toBeCloseTo(18, 2)
	})
})


