import { payoutConfig } from './stripe-payouts'

export interface RevenueShareInput {
	tenantId?: string
	providerId?: string
	serviceId?: string
	territoryId?: string
	totalAmountCents: number
	asOf?: string | Date
}

export interface RevenueShareResult {
	ruleId?: string
	platformFeeCents: number
	providerAmountCents: number
	processingFeeFixedCents: number
	minimumPayoutCents: number
}

/**
 * Compute revenue share split between platform and provider.
 * For MVP this applies a global rule from payoutConfig, with placeholders for future overrides.
 */
export async function computeRevenueShare(
	input: RevenueShareInput
): Promise<RevenueShareResult> {
	const total = Math.max(0, Math.round(input.totalAmountCents))

	// TODO: Look up tenant/service/territory specific overrides when available
	const platformFeeCents = Math.round(
		total * ((payoutConfig as any).platformFeePercentage / 100)
	)
	const processingFeeFixedCents = Math.max(
		0,
		Math.round((payoutConfig as any).processingFeeFixed)
	)
	const providerAmountCents = Math.max(
		0,
		total - platformFeeCents - processingFeeFixedCents
	)

	return {
		ruleId: undefined,
		platformFeeCents,
		providerAmountCents,
		processingFeeFixedCents,
		minimumPayoutCents: Math.max(
			0,
			Math.round((payoutConfig as any).minimumPayout)
		),
	}
}

