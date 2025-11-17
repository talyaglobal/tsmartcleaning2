import { createClient } from '@supabase/supabase-js'

/**
 * Resolve tenant context from an incoming request via, in order of precedence:
 * - Explicit x-tenant-id header
 * - Query param tenantId (if URL available)
 * - Subdomain from Host/X-Forwarded-Host (e.g., acme.example.com -> acme)
 * Returns the tenant identifier (string) or null if not resolvable.
 */
export function resolveTenantFromRequest(input: Request | { headers: Headers; url?: string } | null): string | null {
	if (!input) return null
	const headers = input.headers
	if (!headers) return null

	// 1) Explicit header
	const explicitTenant = headers.get('x-tenant-id') || headers.get('X-Tenant-Id')
	if (explicitTenant && explicitTenant.trim().length > 0) {
		return explicitTenant.trim()
	}

	// 2) Query param if URL available
	const urlString = (input as Request)?.url ?? (input as any)?.url
	if (typeof urlString === 'string') {
		try {
			const u = new URL(urlString)
			const qpTenant = u.searchParams.get('tenantId')
			if (qpTenant && qpTenant.trim().length > 0) {
				return qpTenant.trim()
			}
		} catch {
			// ignore URL parse errors
		}
	}

	// 3) Subdomain from host
	const host = headers.get('x-forwarded-host') || headers.get('host') || headers.get('Host') || ''
	if (!host) return null
	// Normalize potential host:port
	const hostOnly = host.split(',')[0]?.trim().split(':')[0]?.trim() ?? ''
	if (!hostOnly) return null
	// If it's an IP or localhost, skip
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostOnly) || hostOnly === 'localhost') return null

	const parts = hostOnly.split('.').filter(Boolean)
	// e.g., sub.domain.tld -> subdomain is first part
	if (parts.length >= 3) {
		const subdomain = parts[0]
		if (subdomain && subdomain.toLowerCase() !== 'www') {
			return subdomain
		}
	}

	// For two-part hosts (example.com), no subdomain to infer
	return null
}

// Server-side Supabase client using Service Role for trusted API routes.
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
export function createServerSupabase(tenantId?: string | null) {
	const supabaseUrl = process.env.SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !serviceRoleKey) {
		// For build-time, provide dummy values to allow static generation
		if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
			return createClient('https://dummy.supabase.co', 'dummy_key', {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				}
			})
		}
		throw new Error(
			'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
		)
	}

	return createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
		global: {
			headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
		},
	})
}

// Public Supabase client for server components/edge using anon key if needed later.
export function createAnonSupabase(tenantId?: string | null) {
	const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !anonKey) {
		// For build-time, provide dummy values to allow static generation
		if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
			return createClient('https://dummy.supabase.co', 'dummy_key', {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
				}
			})
		}
		throw new Error(
			'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
		)
	}

	return createClient(supabaseUrl, anonKey, {
		auth: {
			autoRefreshToken: true,
			persistSession: true,
		},
		global: {
			headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
		},
	})
}


