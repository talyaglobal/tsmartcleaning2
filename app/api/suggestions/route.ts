import { NextRequest, NextResponse } from 'next/server'
import { generateSuggestionsForUser } from '@/lib/suggestions'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')
		const roleParam = (searchParams.get('role') || 'customer').toLowerCase()
		const role = (roleParam === 'provider' || roleParam === 'admin') ? roleParam : 'customer'

		if (!userId) {
			return NextResponse.json({ error: 'userId is required' }, { status: 400 })
		}

		const suggestions = await generateSuggestionsForUser(userId, role as 'customer' | 'provider' | 'admin')
		return NextResponse.json({ suggestions })
	} catch (error) {
		console.error('[v0] Suggestions GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


