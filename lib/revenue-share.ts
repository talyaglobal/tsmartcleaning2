import { payoutConfig } from './stripe-payouts'
import { createServerSupabase } from './supabase'

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

export interface RevenueShareRule {
	id: string
	tenant_id?: string | null
	provider_id?: string | null
	service_id?: string | null
	territory_id?: string | null
	platform_percent: number
	processing_fee_fixed_cents: number
	minimum_payout_cents: number
	priority: number
	active: boolean
	valid_from: string
	valid_to?: string | null
	name?: string | null
}

/**
 * Look up the most specific revenue share rule matching the input criteria.
 * Rules are matched hierarchically: more specific rules (with more non-null scoping fields)
 * take precedence over less specific ones. Priority field is used as a tiebreaker.
 * 
 * Matching order (most specific to least):
 * 1. tenant + provider + service + territory
 * 2. tenant + provider + service
 * 3. tenant + provider + territory
 * 4. tenant + provider
 * 5. tenant + service + territory
 * 6. tenant + service
 * 7. tenant + territory
 * 8. tenant
 * 9. provider + service + territory
 * 10. provider + service
 * 11. provider + territory
 * 12. provider
 * 13. service + territory
 * 14. service
 * 15. territory
 * 16. global (all null)
 */
async function lookupRevenueShareRule(
	input: RevenueShareInput
): Promise<RevenueShareRule | null> {
	const supabase = createServerSupabase(null)
	const asOf = input.asOf ? new Date(input.asOf) : new Date()

	// Fetch all active rules that are valid at the given time
	// We'll filter for matching scoping fields in memory
	const asOfISO = asOf.toISOString()
	const { data: rules, error } = await supabase
		.from('revenue_share_rules')
		.select('*')
		.eq('active', true)
		.lte('valid_from', asOfISO)
		.or(`valid_to.is.null,valid_to.gte.${asOfISO}`)

	if (error) {
		console.error('[revenue-share] Error looking up rules:', error)
		return null
	}

	if (!rules || rules.length === 0) {
		return null
	}

	// Filter rules that match the input criteria
	// A rule matches if each scoping field either:
	// 1. Matches the input value, OR
	// 2. Is null (meaning it applies to all values for that dimension)
	const matchingRules = rules.filter((rule: any) => {
		// Check tenant_id
		if (rule.tenant_id !== null && rule.tenant_id !== input.tenantId) {
			return false
		}
		if (input.tenantId && rule.tenant_id === null) {
			// This is fine - null means applies to all tenants
		}

		// Check provider_id
		if (rule.provider_id !== null && rule.provider_id !== input.providerId) {
			return false
		}
		if (input.providerId && rule.provider_id === null) {
			// This is fine - null means applies to all providers
		}

		// Check service_id
		if (rule.service_id !== null && rule.service_id !== input.serviceId) {
			return false
		}
		if (input.serviceId && rule.service_id === null) {
			// This is fine - null means applies to all services
		}

		// Check territory_id
		if (rule.territory_id !== null && rule.territory_id !== input.territoryId) {
			return false
		}
		if (input.territoryId && rule.territory_id === null) {
			// This is fine - null means applies to all territories
		}

		return true
	})

	if (matchingRules.length === 0) {
		return null
	}

	// Score each rule by specificity (more non-null scoping fields = higher score)
	// Then sort by score (desc) and priority (desc)
	const scoredRules = matchingRules.map((rule: any) => {
		let score = 0
		if (rule.tenant_id !== null) score += 1000
		if (rule.provider_id !== null) score += 100
		if (rule.service_id !== null) score += 10
		if (rule.territory_id !== null) score += 1
		return { ...rule, score }
	})

	// Sort by score (desc) then priority (desc)
	scoredRules.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score
		return b.priority - a.priority
	})

	// Return the most specific matching rule
	return scoredRules[0] as RevenueShareRule
}

/**
 * Compute revenue share split between platform and provider.
 * Looks up tenant/service/territory/provider-specific overrides from the database,
 * falling back to the global payoutConfig if no matching rule is found.
 */
export async function computeRevenueShare(
	input: RevenueShareInput
): Promise<RevenueShareResult> {
	const total = Math.max(0, Math.round(input.totalAmountCents))

	// Look up tenant/service/territory/provider specific overrides
	const rule = await lookupRevenueShareRule(input)

	let platformFeePercent: number
	let processingFeeFixedCents: number
	let minimumPayoutCents: number
	let ruleId: string | undefined

	if (rule) {
		// Use rule values
		platformFeePercent = Number(rule.platform_percent)
		processingFeeFixedCents = rule.processing_fee_fixed_cents
		minimumPayoutCents = rule.minimum_payout_cents
		ruleId = rule.id
	} else {
		// Fall back to global config
		platformFeePercent = payoutConfig.platformFeePercentage
		processingFeeFixedCents = payoutConfig.processingFeeFixed
		minimumPayoutCents = payoutConfig.minimumPayout
	}

	const platformFeeCents = Math.round(total * (platformFeePercent / 100))
	const providerAmountCents = Math.max(
		0,
		total - platformFeeCents - processingFeeFixedCents
	)

	return {
		ruleId,
		platformFeeCents,
		providerAmountCents,
		processingFeeFixedCents,
		minimumPayoutCents,
	}
}

