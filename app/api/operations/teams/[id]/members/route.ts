import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { logAuditEventFromRequest } from '@/lib/audit'

// Add member to team
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const teamId = params.id
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)
		const { userId, role } = await request.json()

		if (!userId) {
			return NextResponse.json({ error: 'userId is required' }, { status: 400 })
		}

		// Verify team exists
		const { data: team, error: teamError } = await supabase
			.from('teams')
			.select('id')
			.eq('id', teamId)
			.single()

		if (teamError || !team) {
			return NextResponse.json({ error: 'Team not found' }, { status: 404 })
		}

		// Verify user exists
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, full_name')
			.eq('id', userId)
			.single()

		if (userError || !user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		// Check if member already exists
		const { data: existingMember } = await supabase
			.from('team_members')
			.select('id')
			.eq('team_id', teamId)
			.eq('user_id', userId)
			.single()

		if (existingMember) {
			return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 })
		}

		// Add member
		const { data: member, error: memberError } = await supabase
			.from('team_members')
			.insert({
				team_id: teamId,
				user_id: userId,
				role: role || 'member',
			})
			.select()
			.single()

		if (memberError) {
			console.error('[team-members] Add error:', memberError)
			return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
		}

		// Log audit event
		await logAuditEventFromRequest(request, {
			action: 'add_team_member',
			resource: 'team',
			resourceId: teamId,
			metadata: { userId, role: role || 'member' },
		})

		return NextResponse.json({ member }, { status: 201 })
	} catch (e: any) {
		console.error('[team-members] Error:', e)
		return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
	}
}

// Remove member from team
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const teamId = params.id
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId ?? undefined)
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')

		if (!userId) {
			return NextResponse.json({ error: 'userId is required' }, { status: 400 })
		}

		// Remove member
		const { error: deleteError } = await supabase
			.from('team_members')
			.delete()
			.eq('team_id', teamId)
			.eq('user_id', userId)

		if (deleteError) {
			console.error('[team-members] Delete error:', deleteError)
			return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
		}

		// Log audit event
		await logAuditEventFromRequest(request, {
			action: 'remove_team_member',
			resource: 'team',
			resourceId: teamId,
			metadata: { userId },
		})

		return NextResponse.json({ success: true })
	} catch (e: any) {
		console.error('[team-members] Error:', e)
		return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
	}
}

