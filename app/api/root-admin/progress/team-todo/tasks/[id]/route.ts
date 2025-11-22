import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const taskId = params.id
    const body = await request.json()

    // Validate enum values if provided
    if (body.status) {
      const validStatuses = ['todo', 'in-progress', 'completed']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
    }

    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        )
      }
    }

    if (body.assignee) {
      const validAssignees = ['volkan', 'ozgun']
      if (!validAssignees.includes(body.assignee)) {
        return NextResponse.json(
          { error: 'Invalid assignee value' },
          { status: 400 }
        )
      }
    }

    // Prepare updates
    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'assignee',
      'dueDate',
      'category',
      'estimatedHours',
      'actualHours',
      'tags',
      'completedAt'
    ]

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    }

    // Only include allowed fields that are present in the request
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value
      }
    }

    // Automatically set/unset completion date based on status
    if (body.status === 'completed' && !body.completedAt) {
      updates.completedAt = new Date().toISOString()
    } else if (body.status && body.status !== 'completed') {
      updates.completedAt = null
    }

    // In production, you would update the database:
    // const { data, error } = await supabase
    //   .from('team_tasks')
    //   .update(updates)
    //   .eq('id', taskId)
    //   .select()
    //   .single()
    //
    // if (error) {
    //   console.error('Database error:', error)
    //   return NextResponse.json(
    //     { error: 'Failed to update task' },
    //     { status: 500 }
    //   )
    // }

    console.log(`Updating task ${taskId} with:`, updates)

    return NextResponse.json({
      success: true,
      task: {
        id: taskId,
        ...updates
      }
    })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const taskId = params.id

    // In production, you would delete from database:
    // const { error } = await supabase
    //   .from('team_tasks')
    //   .delete()
    //   .eq('id', taskId)
    //
    // if (error) {
    //   console.error('Database error:', error)
    //   return NextResponse.json(
    //     { error: 'Failed to delete task' },
    //     { status: 500 }
    //   )
    // }

    console.log(`Deleting task ${taskId}`)

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
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
    const taskId = params.id

    // In production, fetch from database:
    // const { data, error } = await supabase
    //   .from('team_tasks')
    //   .select('*')
    //   .eq('id', taskId)
    //   .single()
    //
    // if (error) {
    //   console.error('Database error:', error)
    //   return NextResponse.json(
    //     { error: 'Task not found' },
    //     { status: 404 }
    //   )
    // }

    // Mock response for development
    const mockTask = {
      id: taskId,
      title: 'Sample Task',
      description: 'Sample task description',
      status: 'todo',
      priority: 'medium',
      assignee: 'volkan',
      dueDate: '2024-02-15T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      category: 'Development',
      estimatedHours: 4,
      tags: ['sample']
    }

    return NextResponse.json(mockTask)

  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}