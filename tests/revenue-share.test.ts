import { describe, it, expect, vi } from 'vitest'

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

import { computeRevenueShare } from '@/lib/revenue-share'

describe('revenue-share.computeRevenueShare', () => {
	it('splits revenue using mocked payoutConfig', async () => {
		const result = await computeRevenueShare({
			totalAmountCents: 10_000, // $100
		})
		expect(result.platformFeeCents).toBe(2000)
		expect(result.processingFeeFixedCents).toBe(50)
		expect(result.providerAmountCents).toBe(10_000 - 2000 - 50)
		expect(result.minimumPayoutCents).toBe(1000)
	})

	it('guards against negative totals', async () => {
		const result = await computeRevenueShare({
			totalAmountCents: -500,
		})
		// negative coerced to 0
		expect(result.platformFeeCents).toBe(0)
		expect(result.providerAmountCents).toBe(0)
	})
})


