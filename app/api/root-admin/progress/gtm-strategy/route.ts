import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Mock data for GTM strategy phases - in production, this would come from database
    const phases = [
      {
        id: 'phase1',
        name: 'Phase 1: Foundation',
        description: 'Platform development, legal framework, and initial team building',
        duration: '2 months',
        timeline: 'Months 1-2',
        status: 'in-progress',
        completion: 75,
        milestones: [
          {
            id: 'milestone1-1',
            name: 'Platform Core Development',
            description: 'Complete core platform features including booking, payments, and user management',
            status: 'completed',
            dueDate: '2024-01-15T00:00:00Z',
            completionDate: '2024-01-12T00:00:00Z',
            priority: 'critical',
            assignee: 'Development Team',
            category: 'Technology',
            notes: 'Completed ahead of schedule with all core features implemented'
          },
          {
            id: 'milestone1-2',
            name: 'Legal Framework Setup',
            description: 'Establish legal structure, terms of service, privacy policy, and compliance framework',
            status: 'completed',
            dueDate: '2024-01-20T00:00:00Z',
            completionDate: '2024-01-18T00:00:00Z',
            priority: 'critical',
            assignee: 'Legal Team',
            category: 'Legal & Compliance'
          },
          {
            id: 'milestone1-3',
            name: 'Core Team Hiring',
            description: 'Hire key positions: CTO, Lead Developer, Marketing Manager, Operations Manager',
            status: 'in-progress',
            dueDate: '2024-02-01T00:00:00Z',
            priority: 'high',
            assignee: 'HR Team',
            category: 'Human Resources',
            notes: 'CTO and Lead Developer hired, still recruiting Marketing and Operations managers'
          },
          {
            id: 'milestone1-4',
            name: 'Beta User Acquisition',
            description: 'Recruit and onboard 100 beta users for testing and feedback',
            status: 'in-progress',
            dueDate: '2024-02-10T00:00:00Z',
            priority: 'high',
            assignee: 'Marketing Team',
            category: 'User Acquisition',
            notes: 'Currently at 73 beta users, on track to reach 100'
          },
          {
            id: 'milestone1-5',
            name: 'Quality Assurance Testing',
            description: 'Complete comprehensive testing of all platform features',
            status: 'not-started',
            dueDate: '2024-02-15T00:00:00Z',
            priority: 'high',
            assignee: 'QA Team',
            category: 'Technology'
          }
        ]
      },
      {
        id: 'phase2',
        name: 'Phase 2: Soft Launch',
        description: 'Limited geographic launch with customer acquisition and provider onboarding',
        duration: '2 months',
        timeline: 'Months 3-4',
        status: 'not-started',
        completion: 0,
        milestones: [
          {
            id: 'milestone2-1',
            name: 'Geographic Market Selection',
            description: 'Select and analyze 3 initial launch markets based on demand and competition',
            status: 'not-started',
            dueDate: '2024-03-01T00:00:00Z',
            priority: 'critical',
            assignee: 'Strategy Team',
            category: 'Market Research'
          },
          {
            id: 'milestone2-2',
            name: 'Provider Onboarding Program',
            description: 'Launch provider recruitment and onboarding program to acquire 50 active providers',
            status: 'not-started',
            dueDate: '2024-03-15T00:00:00Z',
            priority: 'critical',
            assignee: 'Operations Team',
            category: 'Provider Network'
          },
          {
            id: 'milestone2-3',
            name: 'Customer Acquisition Campaign',
            description: 'Launch marketing campaigns to acquire first 500 paying customers',
            status: 'not-started',
            dueDate: '2024-04-01T00:00:00Z',
            priority: 'high',
            assignee: 'Marketing Team',
            category: 'Customer Acquisition'
          },
          {
            id: 'milestone2-4',
            name: 'Customer Support Infrastructure',
            description: 'Establish customer support team and processes for handling inquiries',
            status: 'not-started',
            dueDate: '2024-03-10T00:00:00Z',
            priority: 'high',
            assignee: 'Operations Team',
            category: 'Customer Support'
          },
          {
            id: 'milestone2-5',
            name: 'Feedback Loop Implementation',
            description: 'Implement systems for collecting and analyzing customer and provider feedback',
            status: 'not-started',
            dueDate: '2024-04-15T00:00:00Z',
            priority: 'medium',
            assignee: 'Product Team',
            category: 'Product Development'
          }
        ]
      },
      {
        id: 'phase3',
        name: 'Phase 3: Growth',
        description: 'Market expansion, scaling operations, and revenue optimization',
        duration: '2 months',
        timeline: 'Months 5-6',
        status: 'not-started',
        completion: 0,
        milestones: [
          {
            id: 'milestone3-1',
            name: 'Market Expansion Strategy',
            description: 'Expand to 10 total markets based on soft launch learnings',
            status: 'not-started',
            dueDate: '2024-05-15T00:00:00Z',
            priority: 'critical',
            assignee: 'Strategy Team',
            category: 'Market Expansion'
          },
          {
            id: 'milestone3-2',
            name: 'Operations Scaling',
            description: 'Scale operations to handle 200 active providers and 2000+ monthly bookings',
            status: 'not-started',
            dueDate: '2024-05-30T00:00:00Z',
            priority: 'critical',
            assignee: 'Operations Team',
            category: 'Operations'
          },
          {
            id: 'milestone3-3',
            name: 'Advanced Feature Rollout',
            description: 'Launch premium features: scheduling optimization, quality guarantees, loyalty program',
            status: 'not-started',
            dueDate: '2024-06-01T00:00:00Z',
            priority: 'high',
            assignee: 'Product Team',
            category: 'Product Development'
          },
          {
            id: 'milestone3-4',
            name: 'Partnership Development',
            description: 'Establish strategic partnerships with property management companies and suppliers',
            status: 'not-started',
            dueDate: '2024-06-10T00:00:00Z',
            priority: 'medium',
            assignee: 'Business Development',
            category: 'Partnerships'
          },
          {
            id: 'milestone3-5',
            name: 'Revenue Optimization',
            description: 'Optimize pricing strategy and achieve $50K monthly recurring revenue',
            status: 'not-started',
            dueDate: '2024-06-30T00:00:00Z',
            priority: 'critical',
            assignee: 'Revenue Team',
            category: 'Revenue'
          }
        ]
      }
    ]

    // Calculate overall completion
    const totalMilestones = phases.reduce((sum, phase) => sum + phase.milestones.length, 0)
    const completedMilestones = phases.reduce((sum, phase) => 
      sum + phase.milestones.filter(m => m.status === 'completed').length, 0
    )
    const overallCompletion = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

    return NextResponse.json({
      phases,
      overallCompletion,
      summary: {
        totalPhases: phases.length,
        completedPhases: phases.filter(p => p.status === 'completed').length,
        totalMilestones,
        completedMilestones,
        overdueMilestones: phases.reduce((sum, phase) => 
          sum + phase.milestones.filter(m => 
            m.status !== 'completed' && new Date(m.dueDate) < new Date()
          ).length, 0
        )
      }
    })

  } catch (error) {
    console.error('Error fetching GTM progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GTM progress' },
      { status: 500 }
    )
  }
}