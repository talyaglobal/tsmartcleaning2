import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Mock data for team TODO tasks - in production, this would come from database
    const tasks = [
      {
        id: 'task-1',
        title: 'Implement User Authentication System',
        description: 'Build secure login/logout functionality with JWT tokens and password encryption',
        status: 'completed',
        priority: 'critical',
        assignee: 'volkan',
        dueDate: '2024-01-20T00:00:00Z',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z',
        completedAt: '2024-01-18T00:00:00Z',
        category: 'Development',
        estimatedHours: 16,
        tags: ['authentication', 'security', 'backend']
      },
      {
        id: 'task-2',
        title: 'Design Mobile App UI Components',
        description: 'Create reusable UI components for the mobile application including buttons, forms, and navigation',
        status: 'completed',
        priority: 'high',
        assignee: 'ozgun',
        dueDate: '2024-01-25T00:00:00Z',
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-24T00:00:00Z',
        completedAt: '2024-01-24T00:00:00Z',
        category: 'Design',
        estimatedHours: 12,
        tags: ['ui', 'mobile', 'components']
      },
      {
        id: 'task-3',
        title: 'Set up CI/CD Pipeline',
        description: 'Configure automated testing and deployment pipeline for the application',
        status: 'in-progress',
        priority: 'high',
        assignee: 'volkan',
        dueDate: '2024-02-05T00:00:00Z',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-25T00:00:00Z',
        category: 'Development',
        estimatedHours: 8,
        tags: ['devops', 'automation', 'testing']
      },
      {
        id: 'task-4',
        title: 'Optimize Database Queries',
        description: 'Review and optimize slow database queries to improve application performance',
        status: 'todo',
        priority: 'medium',
        assignee: 'volkan',
        dueDate: '2024-02-10T00:00:00Z',
        createdAt: '2024-01-22T00:00:00Z',
        updatedAt: '2024-01-22T00:00:00Z',
        category: 'Development',
        estimatedHours: 6,
        tags: ['database', 'performance', 'optimization']
      },
      {
        id: 'task-5',
        title: 'Create Marketing Landing Pages',
        description: 'Design and implement landing pages for marketing campaigns',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'ozgun',
        dueDate: '2024-02-08T00:00:00Z',
        createdAt: '2024-01-18T00:00:00Z',
        updatedAt: '2024-01-26T00:00:00Z',
        category: 'Marketing',
        estimatedHours: 10,
        tags: ['landing-page', 'marketing', 'design']
      },
      {
        id: 'task-6',
        title: 'Write API Documentation',
        description: 'Document all API endpoints with examples and usage guidelines',
        status: 'todo',
        priority: 'low',
        assignee: 'volkan',
        dueDate: '2024-02-15T00:00:00Z',
        createdAt: '2024-01-25T00:00:00Z',
        updatedAt: '2024-01-25T00:00:00Z',
        category: 'Documentation',
        estimatedHours: 4,
        tags: ['documentation', 'api', 'developer']
      },
      {
        id: 'task-7',
        title: 'Conduct User Testing Sessions',
        description: 'Organize and conduct user testing sessions to gather feedback on the application',
        status: 'todo',
        priority: 'high',
        assignee: 'ozgun',
        dueDate: '2024-01-30T00:00:00Z', // Overdue task
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        category: 'Research',
        estimatedHours: 8,
        tags: ['user-testing', 'research', 'feedback']
      },
      {
        id: 'task-8',
        title: 'Implement Payment Processing',
        description: 'Integrate Stripe payment processing for subscription payments',
        status: 'todo',
        priority: 'critical',
        assignee: 'volkan',
        dueDate: '2024-02-12T00:00:00Z',
        createdAt: '2024-01-28T00:00:00Z',
        updatedAt: '2024-01-28T00:00:00Z',
        category: 'Development',
        estimatedHours: 12,
        tags: ['payments', 'stripe', 'integration']
      }
    ]

    return NextResponse.json({
      tasks,
      total: tasks.length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching team TODO tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team TODO tasks' },
      { status: 500 }
    )
  }
}