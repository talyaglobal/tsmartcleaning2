import { vi } from 'vitest'

/**
 * Comprehensive Supabase mock factory for testing
 */
export function createSupabaseMock() {
	const mockData: Record<string, any[]> = {}
	const mockErrors: Record<string, any> = {}

	const createQueryBuilder = (table: string) => {
		const chain: any = {
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			upsert: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			neq: vi.fn().mockReturnThis(),
			gt: vi.fn().mockReturnThis(),
			gte: vi.fn().mockReturnThis(),
			lt: vi.fn().mockReturnThis(),
			lte: vi.fn().mockReturnThis(),
			like: vi.fn().mockReturnThis(),
			ilike: vi.fn().mockReturnThis(),
			is: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			contains: vi.fn().mockReturnThis(),
			not: vi.fn().mockReturnThis(),
			or: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			range: vi.fn().mockReturnThis(),
			single: vi.fn(),
			maybeSingle: vi.fn(),
		}

		// Default single() implementation
		chain.single.mockImplementation(async () => {
			const data = mockData[table]?.[0] || null
			const error = mockErrors[table] || null
			return { data, error }
		})

		// Default maybeSingle() implementation
		chain.maybeSingle.mockImplementation(async () => {
			const data = mockData[table]?.[0] || null
			const error = mockErrors[table] || null
			return { data, error }
		})

		// Handle order() - when called, return data
		let orderCallCount = 0
		chain.order.mockImplementation((column: string, options?: any) => {
			orderCallCount++
			if (orderCallCount >= 2) {
				orderCallCount = 0
				return Promise.resolve({
					data: mockData[table] || [],
					error: mockErrors[table] || null,
				})
			}
			return chain
		})

		// Handle limit() - when called, return data
		chain.limit.mockImplementation((count: number) => {
			return Promise.resolve({
				data: (mockData[table] || []).slice(0, count),
				error: mockErrors[table] || null,
			})
		})

		// Handle insert() chain
		chain.insert.mockImplementation((values: any) => {
			const insertChain = {
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockImplementation(async () => {
					const newRecord = Array.isArray(values) ? values[0] : values
					if (!mockData[table]) mockData[table] = []
					mockData[table].push(newRecord)
					return {
						data: newRecord,
						error: mockErrors[table] || null,
					}
				}),
			}
			return insertChain
		})

		// Handle update() chain
		chain.update.mockImplementation((values: any) => {
			const updateChain = {
				eq: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockImplementation(async () => {
					if (mockData[table]?.[0]) {
						Object.assign(mockData[table][0], values)
					}
					return {
						data: mockData[table]?.[0] || null,
						error: mockErrors[table] || null,
					}
				}),
			}
			return updateChain
		})

		return chain
	}

	const mockSupabase = {
		from: vi.fn((table: string) => createQueryBuilder(table)),
		auth: {
			getUser: vi.fn(async (token: string) => {
				// Default mock user
				return {
					data: {
						user: {
							id: 'user_123',
							email: 'test@example.com',
							role: 'cleaning_lady',
						},
					},
					error: null,
				}
			}),
			signInWithPassword: vi.fn(async () => ({
				data: {
					user: { id: 'user_123', email: 'test@example.com' },
					session: { access_token: 'token_123' },
				},
				error: null,
			})),
			signUp: vi.fn(async () => ({
				data: { user: { id: 'user_123', email: 'test@example.com' } },
				error: null,
			})),
			signOut: vi.fn(async () => ({ error: null })),
		},
		rpc: vi.fn(async () => ({ data: null, error: null })),
	}

	return {
		mockSupabase,
		setMockData: (table: string, data: any[]) => {
			mockData[table] = data
		},
		setMockError: (table: string, error: any) => {
			mockErrors[table] = error
		},
		clearMocks: () => {
			Object.keys(mockData).forEach(key => delete mockData[key])
			Object.keys(mockErrors).forEach(key => delete mockErrors[key])
		},
	}
}

