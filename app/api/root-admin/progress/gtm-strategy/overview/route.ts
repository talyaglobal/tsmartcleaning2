import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Calculate high-level overview metrics
    // In production, this would aggregate data from your database
    
    const overview = {
      overall: {
        completion: 25, // Overall GTM strategy completion percentage
        timeline: 'On track',
        riskLevel: 'low',
        momentum: 'high'
      },
      phases: {
        total: 3,
        completed: 0,
        inProgress: 1,
        delayed: 0,
        notStarted: 2
      },
      milestones: {
        total: 15,
        completed: 2,
        inProgress: 3,
        overdue: 0,
        critical: 5
      },
      timeline: {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-06-30T00:00:00Z',
        currentPhase: 'Phase 1: Foundation',
        nextMilestone: {
          name: 'Core Team Hiring',
          dueDate: '2024-02-01T00:00:00Z',
          daysRemaining: 5
        }
      },
      metrics: {
        teamVelocity: 2.5, // Milestones completed per week
        averageCompletionTime: 12, // Days
        onTimeDelivery: 85, // Percentage
        qualityScore: 4.2 // Out of 5
      },
      recentActivity: [
        {
          id: '1',
          type: 'milestone_completed',
          milestone: 'Platform Core Development',
          date: '2024-01-12T00:00:00Z',
          user: 'Development Team'
        },
        {
          id: '2',
          type: 'milestone_completed', 
          milestone: 'Legal Framework Setup',
          date: '2024-01-18T00:00:00Z',
          user: 'Legal Team'
        },
        {
          id: '3',
          type: 'milestone_started',
          milestone: 'Core Team Hiring',
          date: '2024-01-20T00:00:00Z',
          user: 'HR Team'
        }
      ],
      upcomingDeadlines: [
        {
          milestoneId: 'milestone1-3',
          name: 'Core Team Hiring',
          dueDate: '2024-02-01T00:00:00Z',
          priority: 'high',
          assignee: 'HR Team',
          daysRemaining: 5
        },
        {
          milestoneId: 'milestone1-4',
          name: 'Beta User Acquisition',
          dueDate: '2024-02-10T00:00:00Z', 
          priority: 'high',
          assignee: 'Marketing Team',
          daysRemaining: 14
        },
        {
          milestoneId: 'milestone1-5',
          name: 'Quality Assurance Testing',
          dueDate: '2024-02-15T00:00:00Z',
          priority: 'high', 
          assignee: 'QA Team',
          daysRemaining: 19
        }
      ],
      risks: [
        {
          id: '1',
          title: 'Hiring Delays',
          description: 'Difficulty finding qualified Marketing and Operations managers',
          severity: 'medium',
          impact: 'Could delay Phase 2 launch',
          mitigation: 'Expand search criteria and consider contractors',
          owner: 'HR Team'
        }
      ],
      recommendations: [
        {
          id: '1',
          title: 'Accelerate Hiring Process',
          description: 'Consider using recruitment agencies for critical positions',
          priority: 'high',
          effort: 'medium',
          impact: 'high'
        },
        {
          id: '2', 
          title: 'Start Phase 2 Planning',
          description: 'Begin preliminary work on Phase 2 market research',
          priority: 'medium',
          effort: 'low',
          impact: 'medium'
        }
      ]
    }

    return NextResponse.json(overview)

  } catch (error) {
    console.error('Error fetching GTM overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GTM overview' },
      { status: 500 }
    )
  }
}