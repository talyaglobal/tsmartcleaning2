import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'description', 'priority', 'assignee', 'dueDate', 'category']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate enum values
    const validStatuses = ['todo', 'in-progress', 'completed']
    const validPriorities = ['low', 'medium', 'high', 'critical']
    const validAssignees = ['volkan', 'ozgun']

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      )
    }

    if (!validAssignees.includes(body.assignee)) {
      return NextResponse.json(
        { error: 'Invalid assignee value' },
        { status: 400 }
      )
    }

    // Create task object
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: body.title,
      description: body.description,
      status: body.status || 'todo',
      priority: body.priority,
      assignee: body.assignee,
      dueDate: body.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: body.category,
      estimatedHours: body.estimatedHours || undefined,
      tags: body.tags || []
    }

    // In production, you would save to database:
    // const { data, error } = await supabase
    //   .from('team_tasks')
    //   .insert(newTask)
    //   .select()
    //   .single()

    console.log('Creating new task:', newTask)

    return NextResponse.json({
      success: true,
      task: newTask
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}