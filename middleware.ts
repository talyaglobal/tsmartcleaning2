import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Resolve tenant from cookie/header or by host mapping
	const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
	const hostOnly = (hostHeader || '').split(',')[0]?.trim().split(':')[0]?.trim() || ''

	const tenantCookie = request.cookies.get('tenant_id')?.value
	const rootAdminCookie = request.cookies.get('root_admin')?.value
	const requestHeaders = new Headers(request.headers)

	// If a tenant cookie exists and no header yet, forward it to API as an internal header
	if (tenantCookie && !requestHeaders.has('x-tenant-id')) {
		requestHeaders.set('x-tenant-id', tenantCookie)
	}
	// If a root-admin session cookie exists, assert role header for internal API auth
	if (rootAdminCookie === '1' && !requestHeaders.has('x-user-role')) {
		requestHeaders.set('x-user-role', 'root_admin')
	}

	// If we still don't have tenant context, try host -> tenant resolution using Supabase REST.
	// Cache results briefly in-memory on the edge runtime.
	if (!requestHeaders.get('x-tenant-id') && hostOnly && !isLocalhost(hostOnly)) {
		const cached = getDomainCache().get(hostOnly)
		if (cached && cached.expiresAt > Date.now()) {
			if (cached.tenantId) {
				requestHeaders.set('x-tenant-id', cached.tenantId)
			}
		} else {
			getDomainCache().delete(hostOnly)
			// Perform a lightweight fetch against Supabase REST
			const supabaseUrl = process.env.SUPABASE_URL || ''
			const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
			if (supabaseUrl && serviceKey) {
				const url = new URL(`${supabaseUrl}/rest/v1/domains`)
				url.searchParams.set('select', 'tenant_id,hostname,status,verified_at')
				url.searchParams.set('hostname', `eq.${hostOnly}`)
				url.searchParams.set('status', 'eq.verified')
				try {
					const resp = await fetch(url.toString(), {
						headers: {
							apikey: serviceKey,
							Authorization: `Bearer ${serviceKey}`
						},
						cache: 'no-store'
					})
					if (resp.ok) {
						const rows = (await resp.json()) as Array<{ tenant_id: string }>
						const row = rows?.[0]
						const tenantId = row?.tenant_id || ''
						getDomainCache().set(hostOnly, {
							tenantId,
							expiresAt: Date.now() + 60_000
						})
						if (tenantId) {
							requestHeaders.set('x-tenant-id', tenantId)
						}
					}
				} catch {
					// ignore
				}
			}
		}
	}

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	})

	// Add caching headers for static assets and API responses
	if (pathname.startsWith('/_next/static') || pathname.startsWith('/images/') || pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
	} else if (pathname.startsWith('/api/')) {
		// Cache API responses based on endpoint type
		if (pathname.includes('/services') || pathname.includes('/companies/search')) {
			// Cache public data for 5 minutes
			response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
		} else {
			// Short cache for dynamic data
			response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
		}
	} else {
		// Cache HTML pages for 1 hour, revalidate in background
		response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
	}

	// Redirect unauthenticated root-admin attempts to login page
	if (pathname.startsWith('/root-admin') && pathname !== '/root-admin/login') {
		const isRootAdmin = requestHeaders.get('x-user-role') === 'root_admin'
		if (!isRootAdmin) {
			const url = new URL('/root-admin/login', request.url)
			return NextResponse.redirect(url)
		}
	}

	// If we resolved a tenant id this request, persist it in a cookie for subsequent requests.
	const resolvedTenantId = requestHeaders.get('x-tenant-id')
	if (resolvedTenantId && resolvedTenantId !== tenantCookie) {
		response.cookies.set('tenant_id', resolvedTenantId, {
			httpOnly: true,
			path: '/',
			maxAge: 60 * 60 * 24 * 30, // 30 days
			sameSite: 'lax'
		})
	}

	return response
}

export const config = {
	// Apply to all routes, excluding Next internals and static assets
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-dark-32x32.png|icon-light-32x32.png|apple-icon.png|public/|css/|js/|images/|.*\\.(?:jpg|jpeg|png|gif|svg|css|js|map|txt|woff|woff2|avif|ico)).*)',
	],
}

type DomainCacheEntry = { tenantId: string; expiresAt: number }
type DomainCache = Map<string, DomainCacheEntry>

function getDomainCache(): DomainCache {
	const g = globalThis as unknown as { __domainCache?: DomainCache }
	if (!g.__domainCache) {
		g.__domainCache = new Map()
	}
	return g.__domainCache
}

function isLocalhost(host: string): boolean {
	if (host === 'localhost') return true
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true
	return false
}


