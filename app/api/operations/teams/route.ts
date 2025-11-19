import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

// Get all teams
export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)

		const { data, error } = await supabase
			.from('teams')
			.select(`
				id,
				name,
				description,
				company_id,
				ambassador_id,
				created_at,
				members:team_members (
					id,
					user_id,
					role,
					user:users (id, full_name, email, phone)
				)
			`)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('[teams] Error:', error)
			return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
		}

		return NextResponse.json({ teams: data || [] })
	} catch (e: any) {
		console.error('[teams] Error:', e)
		return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
	}
}

// Create a new team
export async function POST(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)
		const body = await request.json()
		const { name, description, companyId, ambassadorId, memberIds } = body

		if (!name) {
			return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
		}

		// Create team
		const { data: team, error: teamError } = await supabase
			.from('teams')
			.insert({
				name,
				description: description || null,
				company_id: companyId || null,
				ambassador_id: ambassadorId || null,
				tenant_id: tenantId,
			})
			.select()
			.single()

		if (teamError || !team) {
			console.error('[teams] Create error:', teamError)
			return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
		}

		// Add members if provided
		if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
			const members = memberIds.map((userId: string) => ({
				team_id: team.id,
				user_id: userId,
				role: 'member',
			}))

			await supabase.from('team_members').insert(members)
		}

		return NextResponse.json({ team }, { status: 201 })
	} catch (e: any) {
		console.error('[teams] Error:', e)
		return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
	}
}

