import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const milestoneId = params.id
    const body = await request.json()

    // In a real implementation, you would update the milestone in your database
    // For now, we'll simulate the update and return success

    const allowedFields = [
      'name',
      'description', 
      'status',
      'dueDate',
      'completionDate',
      'priority',
      'assignee',
      'notes',
      'category'
    ]

    // Validate that only allowed fields are being updated
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value
      }
    }

    // If status is being changed to completed, set completion date
    if (updates.status === 'completed' && !updates.completionDate) {
      updates.completionDate = new Date().toISOString()
    }

    // If status is changed from completed, remove completion date
    if (updates.status && updates.status !== 'completed') {
      updates.completionDate = null
    }

    // Simulate database update
    // In production, you would do something like:
    // const { data, error } = await supabase
    //   .from('gtm_milestones')
    //   .update(updates)
    //   .eq('id', milestoneId)
    //   .select()
    //   .single()

    // For now, simulate success
    console.log(`Updating milestone ${milestoneId} with:`, updates)

    return NextResponse.json({
      success: true,
      milestone: {
        id: milestoneId,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const milestoneId = params.id

    // In production, fetch the specific milestone from database
    // For now, return mock data
    return NextResponse.json({
      id: milestoneId,
      name: 'Sample Milestone',
      description: 'Sample milestone description',
      status: 'in-progress',
      dueDate: '2024-02-15T00:00:00Z',
      priority: 'high',
      assignee: 'Sample User',
      category: 'Technology',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching milestone:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}