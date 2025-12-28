import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export function getTenantIdFromRequest(request: NextRequest): string | null {
	const header = request.headers.get('x-tenant-id')
	const cookie = request.cookies.get('tenant_id')?.value
	const candidate = header || cookie || null
	if (!candidate) return null
	// basic UUID v4 validation
	const uuidV4 =
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	return uuidV4.test(candidate) ? candidate : null
}

export function requireTenantId(request: NextRequest): string {
	const tenantId = getTenantIdFromRequest(request)
	if (!tenantId) {
		throw new Error('Missing or invalid tenant context')
	}
	return tenantId
}

export type TenantBranding = {
	tenant_id: string | null
	logo_url: string | null
	favicon_url: string | null
	primary_color: string | null
	secondary_color: string | null
	theme: string | null
	typography: Record<string, unknown> | null
	styles: Record<string, unknown> | null
}

export type EffectiveBranding = {
	logoUrl: string
	faviconUrl: string
	primaryColor: string
	secondaryColor: string
	theme: string
}

const DEFAULT_BRANDING: EffectiveBranding = {
	logoUrl: '/tsmart_cleaning_orange.png',
	faviconUrl: '/icon-32.png', // Use PNG for better WhatsApp compatibility
	primaryColor: '#556B2F',
	secondaryColor: '#f5f1eb',
	theme: 'light',
}

// Moved server-only header accessors to lib/tenant-server.ts to avoid client bundling issues.

export async function loadBranding(tenantId: string | null): Promise<EffectiveBranding> {
	if (!tenantId) {
		return DEFAULT_BRANDING
	}
	const supabase = createServerSupabase(tenantId)
	const { data, error } = await supabase
		.from('tenant_branding')
		.select('logo_url,favicon_url,primary_color,secondary_color,theme')
		.eq('tenant_id', tenantId)
		.maybeSingle()
	if (error) {
		console.error('[branding] load error', error)
		return DEFAULT_BRANDING
	}
	return {
		logoUrl: data?.logo_url || DEFAULT_BRANDING.logoUrl,
		faviconUrl: data?.favicon_url || DEFAULT_BRANDING.faviconUrl,
		primaryColor: data?.primary_color || DEFAULT_BRANDING.primaryColor,
		secondaryColor: data?.secondary_color || DEFAULT_BRANDING.secondaryColor,
		theme: data?.theme || DEFAULT_BRANDING.theme,
	}
}


