import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const ambassadorId = searchParams.get('ambassadorId')

    if (!ambassadorId) {
      return NextResponse.json(
        { error: 'ambassadorId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    // Get team members (users with role 'cleaner' associated with this ambassador)
    // Assuming there's a relationship table or a field in users table
    const { data: teamMembers, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        created_at
      `)
      .eq('tenant_id', tenantId)
      .eq('role', 'cleaner')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[v0] Get team members error:', error)
      return NextResponse.json({ error: 'Failed to load team members' }, { status: 500 })
    }

    // Get additional stats for each team member
    const membersWithStats = await Promise.all(
      (teamMembers || []).map(async (member) => {
        // Get job completion stats
        const { count: jobsCompleted } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)
          .eq('status', 'completed')

        // Get average rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)

        const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0

        // Get last active (last booking date)
        const { data: lastBooking } = await supabase
          .from('bookings')
          .select('booking_date')
          .eq('tenant_id', tenantId)
          .eq('provider_id', member.id)
          .order('booking_date', { ascending: false })
          .limit(1)
          .single()

        return {
          id: member.id,
          name: member.full_name || 'Unknown',
          email: member.email || '',
          phone: member.phone || '',
          status: 'active' as const, // Could be determined by availability or other logic
          rating: Math.round(avgRating * 10) / 10,
          jobsCompleted: jobsCompleted || 0,
          lastActive: lastBooking?.booking_date 
            ? new Date(lastBooking.booking_date).toLocaleDateString()
            : 'Never',
        }
      })
    )

    return NextResponse.json({ teamMembers: membersWithStats })
  } catch (error) {
    console.error('[v0] Get team members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add team member
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { ambassadorId, email, name, phone } = await request.json()

    if (!ambassadorId || !email || !name) {
      return NextResponse.json(
        { error: 'ambassadorId, email, and name are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('tenant_id', tenantId)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (findError && findError.code !== 'PGRST116') {
      console.error('[v0] Find user error:', findError)
      return NextResponse.json({ error: 'Failed to check user existence' }, { status: 500 })
    }

    if (existingUser) {
      // User exists - update their role to cleaner if not already
      if (existingUser.role === 'cleaner') {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 400 }
        )
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'cleaner',
          full_name: name,
          phone: phone || existingUser.phone || null,
        })
        .eq('id', existingUser.id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Update user error:', updateError)
        return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
      }

      return NextResponse.json({
        teamMember: updatedUser,
        message: 'Team member added successfully'
      })
    } else {
      // User doesn't exist - they need to sign up first
      // In a production system, you might want to send an invitation email here
      return NextResponse.json(
        { 
          error: 'User not found. Please ask them to sign up first, or send them an invitation.',
          requiresSignup: true
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[v0] Add team member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const ambassadorId = searchParams.get('ambassadorId')

    if (!memberId || !ambassadorId) {
      return NextResponse.json(
        { error: 'memberId and ambassadorId are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if member exists and is a cleaner
    const { data: member, error: findError } = await supabase
      .from('users')
      .select('id, role')
      .eq('tenant_id', tenantId)
      .eq('id', memberId)
      .eq('role', 'cleaner')
      .maybeSingle()

    if (findError) {
      console.error('[v0] Find member error:', findError)
      return NextResponse.json({ error: 'Failed to find team member' }, { status: 500 })
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check if member has any active bookings
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('provider_id', memberId)
      .in('status', ['scheduled', 'in-progress', 'en_route'])

    if (activeBookings && activeBookings > 0) {
      return NextResponse.json(
        { 
          error: `Cannot remove team member. They have ${activeBookings} active booking(s). Please reassign or complete these bookings first.`,
          activeBookings
        },
        { status: 400 }
      )
    }

    // Change role from cleaner to customer (or another appropriate role)
    // This effectively removes them from the team without deleting the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'customer' })
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateError) {
      console.error('[v0] Remove team member error:', updateError)
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Team member removed successfully',
      removedMember: updatedUser
    })
  } catch (error) {
    console.error('[v0] Remove team member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

