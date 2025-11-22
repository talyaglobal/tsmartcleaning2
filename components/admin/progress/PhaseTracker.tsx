'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Target,
  Users,
  TrendingUp,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface GTMPhase {
  id: string
  name: string
  description: string
  duration: string
  timeline: string
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed'
  completion: number
  milestones: Milestone[]
}

interface Milestone {
  id: string
  name: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed'
  dueDate: string
  completionDate?: string
  notes?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  category: string
}

interface PhaseTrackerProps {
  phase: GTMPhase
  onMilestoneUpdate: (milestoneId: string, updates: Partial<Milestone>) => void
}

export function PhaseTracker({ phase, onMilestoneUpdate }: PhaseTrackerProps) {
  const getPhaseIcon = () => {
    switch (phase.id) {
      case 'phase1': return Target
      case 'phase2': return Users  
      case 'phase3': return TrendingUp
      default: return Target
    }
  }

  const getStatusIcon = () => {
    switch (phase.status) {
      case 'completed': return CheckCircle2
      case 'in-progress': return Play
      case 'delayed': return AlertCircle
      default: return Clock
    }
  }

  const getStatusColor = () => {
    switch (phase.status) {
      case 'completed': return 'text-green-600'
      case 'in-progress': return 'text-blue-600'
      case 'delayed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPhaseDetails = () => {
    switch (phase.id) {
      case 'phase1':
        return {
          objectives: [
            'Platform Development & Testing',
            'Legal Framework & Compliance',
            'Core Team Hiring & Training',
            'Initial Market Research',
            'Beta User Acquisition'
          ],
          keyMetrics: [
            { label: 'Platform Completion', target: '100%', current: '85%' },
            { label: 'Beta Users', target: '100', current: '73' },
            { label: 'Core Features', target: '15', current: '12' },
            { label: 'Team Members', target: '8', current: '6' }
          ]
        }
      case 'phase2':
        return {
          objectives: [
            'Limited Geographic Launch',
            'Customer Acquisition Strategy',
            'Provider Onboarding Program',
            'Marketing Campaign Launch',
            'Feedback Loop Implementation'
          ],
          keyMetrics: [
            { label: 'Active Cities', target: '3', current: '1' },
            { label: 'Monthly Customers', target: '500', current: '127' },
            { label: 'Active Providers', target: '50', current: '23' },
            { label: 'Customer Satisfaction', target: '4.5/5', current: '4.2/5' }
          ]
        }
      case 'phase3':
        return {
          objectives: [
            'Market Expansion Strategy',
            'Scaling Operations',
            'Advanced Feature Rollout',
            'Partnership Development',
            'Revenue Optimization'
          ],
          keyMetrics: [
            { label: 'Market Coverage', target: '10 cities', current: '3 cities' },
            { label: 'Monthly Revenue', target: '$50K', current: '$18K' },
            { label: 'Provider Network', target: '200', current: '87' },
            { label: 'Booking Completion', target: '95%', current: '88%' }
          ]
        }
      default:
        return { objectives: [], keyMetrics: [] }
    }
  }

  const phaseDetails = getPhaseDetails()
  const IconComponent = getPhaseIcon()
  const StatusIcon = getStatusIcon()

  const completedMilestones = phase.milestones.filter(m => m.status === 'completed').length
  const totalMilestones = phase.milestones.length
  const overdueMilestones = phase.milestones.filter(m => 
    m.status !== 'completed' && new Date(m.dueDate) < new Date()
  ).length

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{phase.name}</CardTitle>
                <CardDescription className="text-base">{phase.description}</CardDescription>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                <StatusIcon className={`h-3 w-3 mr-1 ${getStatusColor()}`} />
                {phase.status.replace('-', ' ')}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {phase.timeline} • {phase.duration}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Progress Section */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold">{phase.completion}%</span>
                </div>
                <Progress value={phase.completion} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-lg font-bold text-green-600">{completedMilestones}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-lg font-bold text-blue-600">{totalMilestones - completedMilestones}</div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-lg font-bold text-red-600">{overdueMilestones}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold">Key Metrics</h4>
              <div className="space-y-3">
                {phaseDetails.keyMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{metric.label}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{metric.current}</div>
                      <div className="text-xs text-muted-foreground">Target: {metric.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {phaseDetails.objectives.map((objective, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{objective}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(
          phase.milestones.reduce((acc, milestone) => {
            if (!acc[milestone.category]) acc[milestone.category] = []
            acc[milestone.category].push(milestone)
            return acc
          }, {} as Record<string, Milestone[]>)
        ).map(([category, milestones]) => {
          const completedCount = milestones.filter(m => m.status === 'completed').length
          const progress = (completedCount / milestones.length) * 100

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{category}</CardTitle>
                  <Badge variant="outline">
                    {completedCount}/{milestones.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}