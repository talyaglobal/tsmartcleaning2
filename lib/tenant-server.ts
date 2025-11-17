import { headers as nextHeaders, cookies as nextCookies } from 'next/headers'

export async function getTenantIdFromHeaders(): Promise<string | null> {
	try {
		const h = await nextHeaders()
		const c = await nextCookies()
		const headerVal = h.get('x-tenant-id') || null
		const cookieVal = c.get('tenant_id')?.value || null
		const candidate = headerVal || cookieVal
		if (!candidate) return null
		const uuidV4 =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		return uuidV4.test(candidate) ? candidate : null
	} catch {
		return null
	}
}


