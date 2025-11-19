import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/stripe-payouts', () => {
	return {
		payoutConfig: {
			platformFeePercentage: 20,
			providerPercentage: 80,
			processingFeeFixed: 50, // cents
			minimumPayout: 1000, // cents
		},
	}
})

// Mock Supabase client
const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({
	select: mockSelect,
	eq: vi.fn().mockReturnThis(),
	lte: vi.fn().mockReturnThis(),
	or: vi.fn().mockReturnThis(),
	order: vi.fn().mockReturnThis(),
}))

vi.mock('@/lib/supabase', () => {
	return {
		createServerSupabase: vi.fn(() => ({
			from: mockFrom,
		})),
	}
})

import { computeRevenueShare } from '@/lib/revenue-share'

describe('revenue-share.computeRevenueShare', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Default: no rules found, use fallback config
		mockSelect.mockResolvedValue({
			data: [],
			error: null,
		})
	})

	it('splits revenue using mocked payoutConfig when no rules exist', async () => {
		const result = await computeRevenueShare({
			totalAmountCents: 10_000, // $100
		})
		expect(result.platformFeeCents).toBe(2000)
		expect(result.processingFeeFixedCents).toBe(50)
		expect(result.providerAmountCents).toBe(10_000 - 2000 - 50)
		expect(result.minimumPayoutCents).toBe(1000)
		expect(result.ruleId).toBeUndefined()
	})

	it('guards against negative totals', async () => {
		const result = await computeRevenueShare({
			totalAmountCents: -500,
		})
		// negative coerced to 0
		expect(result.platformFeeCents).toBe(0)
		expect(result.providerAmountCents).toBe(0)
	})

	it('uses global rule when no scoping fields match', async () => {
		mockSelect.mockResolvedValue({
			data: [
				{
					id: 'global-rule-id',
					tenant_id: null,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 15,
					processing_fee_fixed_cents: 30,
					minimum_payout_cents: 2000,
					priority: 0,
					active: true,
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
			],
			error: null,
		})

		const result = await computeRevenueShare({
			totalAmountCents: 10_000,
		})

		expect(result.ruleId).toBe('global-rule-id')
		expect(result.platformFeeCents).toBe(1500) // 15% of 10000
		expect(result.processingFeeFixedCents).toBe(30)
		expect(result.minimumPayoutCents).toBe(2000)
	})

	it('uses tenant-specific rule when tenant matches', async () => {
		const tenantId = 'tenant-123'
		mockSelect.mockResolvedValue({
			data: [
				{
					id: 'tenant-rule-id',
					tenant_id: tenantId,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 12,
					processing_fee_fixed_cents: 25,
					minimum_payout_cents: 1500,
					priority: 10,
					active: true,
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
				{
					id: 'global-rule-id',
					tenant_id: null,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 15,
					processing_fee_fixed_cents: 30,
					minimum_payout_cents: 2000,
					priority: 0,
					active: true,
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
			],
			error: null,
		})

		const result = await computeRevenueShare({
			tenantId,
			totalAmountCents: 10_000,
		})

		expect(result.ruleId).toBe('tenant-rule-id')
		expect(result.platformFeeCents).toBe(1200) // 12% of 10000
		expect(result.processingFeeFixedCents).toBe(25)
		expect(result.minimumPayoutCents).toBe(1500)
	})

	it('uses most specific rule when multiple rules match', async () => {
		const tenantId = 'tenant-123'
		const serviceId = 'service-456'
		mockSelect.mockResolvedValue({
			data: [
				{
					id: 'tenant-service-rule-id',
					tenant_id: tenantId,
					provider_id: null,
					service_id: serviceId,
					territory_id: null,
					platform_percent: 10,
					processing_fee_fixed_cents: 20,
					minimum_payout_cents: 1000,
					priority: 5,
					active: true,
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
				{
					id: 'tenant-rule-id',
					tenant_id: tenantId,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 12,
					processing_fee_fixed_cents: 25,
					minimum_payout_cents: 1500,
					priority: 10,
					active: true,
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
				{
					id: 'global-rule-id',
					tenant_id: null,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 15,
					processing_fee_fixed_cents: 30,
					minimum_payout_cents: 2000,
					priority: 0,
					active: true,
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
			],
			error: null,
		})

		const result = await computeRevenueShare({
			tenantId,
			serviceId,
			totalAmountCents: 10_000,
		})

		// Should use tenant+service rule (most specific)
		expect(result.ruleId).toBe('tenant-service-rule-id')
		expect(result.platformFeeCents).toBe(1000) // 10% of 10000
		expect(result.processingFeeFixedCents).toBe(20)
		expect(result.minimumPayoutCents).toBe(1000)
	})

	it('filters out inactive rules', async () => {
		mockSelect.mockResolvedValue({
			data: [
				{
					id: 'inactive-rule-id',
					tenant_id: null,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 10,
					processing_fee_fixed_cents: 20,
					minimum_payout_cents: 1000,
					priority: 0,
					active: false, // inactive
					valid_from: new Date().toISOString(),
					valid_to: null,
				},
			],
			error: null,
		})

		const result = await computeRevenueShare({
			totalAmountCents: 10_000,
		})

		// Should fall back to default config since rule is inactive
		expect(result.ruleId).toBeUndefined()
		expect(result.platformFeeCents).toBe(2000) // 20% from default config
	})

	it('filters out expired rules', async () => {
		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)

		mockSelect.mockResolvedValue({
			data: [
				{
					id: 'expired-rule-id',
					tenant_id: null,
					provider_id: null,
					service_id: null,
					territory_id: null,
					platform_percent: 10,
					processing_fee_fixed_cents: 20,
					minimum_payout_cents: 1000,
					priority: 0,
					active: true,
					valid_from: new Date(Date.now() - 100000).toISOString(),
					valid_to: yesterday.toISOString(), // expired
				},
			],
			error: null,
		})

		const result = await computeRevenueShare({
			totalAmountCents: 10_000,
		})

		// Should fall back to default config since rule is expired
		expect(result.ruleId).toBeUndefined()
		expect(result.platformFeeCents).toBe(2000) // 20% from default config
	})

	it('handles database errors gracefully', async () => {
		mockSelect.mockResolvedValue({
			data: null,
			error: { message: 'Database connection failed' },
		})

		const result = await computeRevenueShare({
			totalAmountCents: 10_000,
		})

		// Should fall back to default config on error
		expect(result.ruleId).toBeUndefined()
		expect(result.platformFeeCents).toBe(2000) // 20% from default config
	})
})


