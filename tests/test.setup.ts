import { vi } from 'vitest'

// Minimal env to satisfy modules that expect certain env vars
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Provide a global fetch mock where needed
if (typeof global.fetch === 'undefined') {
	// @ts-ignore
	global.fetch = vi.fn(async () => ({
		ok: true,
		status: 200,
		json: async () => ({}),
		text: async () => '',
	})) as unknown as typeof fetch
}


