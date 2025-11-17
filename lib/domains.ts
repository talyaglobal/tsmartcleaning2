import crypto from 'crypto'

export type DomainRecord = {
	id: string
	tenant_id: string
	hostname: string
	cname_token: string
	status: 'pending' | 'verified' | 'disabled'
	verified_at: string | null
	created_at: string
	updated_at: string
}

export function generateToken(bytes: number = 16): string {
	return crypto.randomBytes(bytes).toString('hex')
}

export function normalizeHostname(host: string): string {
	const h = host.trim().toLowerCase()
	return h.replace(/:\d+$/, '')
}

export function getVerifyDomain(): string {
	// e.g., verify.domains.tsmartcleaning.com
	return process.env.CUSTOM_DOMAINS_VERIFY_DOMAIN || `verify.${getTargetCname()}`
}

export function getTargetCname(): string {
	// e.g., domains.tsmartcleaning.com (the platform CNAME apex that customer domains point to)
	const v = process.env.CUSTOM_DOMAINS_TARGET_CNAME
	if (!v) {
		throw new Error('Missing CUSTOM_DOMAINS_TARGET_CNAME environment variable')
	}
	return v
}

export function getVerificationFqdn(hostname: string): string {
	// Customers create CNAME record on _tsmart.<hostname>
	const h = normalizeHostname(hostname)
	return `_tsmart.${h}`
}

export function getExpectedCnameTarget(cnameToken: string): string {
	// Expected target: <token>.<verify-domain>
	return `${cnameToken}.${getVerifyDomain()}`.toLowerCase()
}


