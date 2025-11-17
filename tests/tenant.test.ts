import { describe, it, expect } from 'vitest'
import { getTenantIdFromRequest, requireTenantId } from '@/lib/tenant'

const validUuid = '123e4567-e89b-42d3-a456-426614174000'

function makeRequest(_url = 'http://localhost/test', headers: Record<string, string> = {}) {
	const cookieHeader = headers.cookie
	const cookieMap: Record<string, string> = {}
	if (cookieHeader) {
		for (const part of cookieHeader.split(';')) {
			const [k, v] = part.trim().split('=')
			cookieMap[k] = v
		}
	}
	return {
		headers: new Headers(headers),
		cookies: {
			get: (key: string) => {
				const v = cookieMap[key]
				return v ? { value: v } : undefined
			},
		},
	} as any
}

describe('tenant id helpers', () => {
	it('extracts tenant id from x-tenant-id header', () => {
		const req = makeRequest('http://localhost/api', { 'x-tenant-id': validUuid })
		expect(getTenantIdFromRequest(req)).toBe(validUuid)
	})

	it('extracts tenant id from cookie when header missing', () => {
		const req = makeRequest('http://localhost/api', {
			cookie: `tenant_id=${validUuid}`,
		})
		expect(getTenantIdFromRequest(req)).toBe(validUuid)
	})

	it('returns null for invalid uuid', () => {
		const req = makeRequest('http://localhost/api', { 'x-tenant-id': 'not-a-uuid' })
		expect(getTenantIdFromRequest(req)).toBeNull()
	})

	it('requireTenantId throws when missing', () => {
		const req = makeRequest('http://localhost/api')
		expect(() => requireTenantId(req)).toThrowError()
	})
})


