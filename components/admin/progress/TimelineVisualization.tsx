'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  PlayCircle
} from 'lucide-react'
import { format, differenceInDays, parseISO, addMonths } from 'date-fns'

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

interface TimelineVisualizationProps {
  phases: GTMPhase[]
}

export function TimelineVisualization({ phases }: TimelineVisualizationProps) {
  const getPhaseIcon = (phaseId: string) => {
    switch (phaseId) {
      case 'phase1': return Target
      case 'phase2': return Users
      case 'phase3': return TrendingUp
      default: return Target
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in-progress': return 'bg-blue-500'
      case 'delayed': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2
      case 'in-progress': return PlayCircle
      case 'delayed': return AlertCircle
      default: return Clock
    }
  }

  // Calculate timeline dates
  const startDate = new Date('2024-01-01') // Adjust based on actual start date
  const phaseTimelines = phases.map((phase, index) => {
    const phaseStartDate = addMonths(startDate, index * 2)
    const phaseEndDate = addMonths(phaseStartDate, 2)
    
    return {
      ...phase,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      isActive: phase.status === 'in-progress',
      daysRemaining: phase.status !== 'completed' 
        ? Math.max(0, differenceInDays(phaseEndDate, new Date()))
        : 0
    }
  })

  const totalDuration = 6 // 6 months total
  const currentDate = new Date()
  const projectStart = startDate
  const projectEnd = addMonths(startDate, totalDuration)
  const overallProgress = Math.min(100, (differenceInDays(currentDate, projectStart) / differenceInDays(projectEnd, projectStart)) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          GTM Timeline Visualization
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Project timeline: {format(projectStart, 'MMM yyyy')} - {format(projectEnd, 'MMM yyyy')}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Timeline Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Timeline Progress</span>
            <span>{Math.round(overallProgress)}% Complete</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{format(projectStart, 'MMM d, yyyy')}</span>
            <span>Today: {format(currentDate, 'MMM d, yyyy')}</span>
            <span>{format(projectEnd, 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Phase Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
          
          <div className="space-y-8">
            {phaseTimelines.map((phase, index) => {
              const IconComponent = getPhaseIcon(phase.id)
              const StatusIcon = getStatusIcon(phase.status)
              const isLast = index === phaseTimelines.length - 1
              
              return (
                <div key={phase.id} className="relative flex items-start gap-6">
                  {/* Timeline Node */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${getStatusColor(phase.status)}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  
                  {/* Phase Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-card border rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{phase.name}</h3>
                            <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {phase.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold">{phase.completion}%</div>
                          <div className="text-xs text-muted-foreground">Complete</div>
                        </div>
                      </div>
                      
                      {/* Timeline Dates */}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Start: </span>
                            <span className="font-medium">{format(phase.startDate, 'MMM d, yyyy')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End: </span>
                            <span className="font-medium">{format(phase.endDate, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        
                        {phase.daysRemaining > 0 && phase.status !== 'completed' && (
                          <Badge variant="outline">
                            {phase.daysRemaining} days remaining
                          </Badge>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Progress value={phase.completion} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {phase.milestones.filter(m => m.status === 'completed').length} / {phase.milestones.length} milestones
                          </span>
                          <span>{phase.duration}</span>
                        </div>
                      </div>
                      
                      {/* Key Milestones */}
                      {phase.milestones.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <h4 className="text-sm font-medium mb-2">Key Milestones</h4>
                          <div className="grid gap-2">
                            {phase.milestones
                              .filter(m => m.priority === 'critical' || m.priority === 'high')
                              .slice(0, 3)
                              .map((milestone) => {
                                const MilestoneStatusIcon = getStatusIcon(milestone.status)
                                const isOverdue = milestone.status !== 'completed' && new Date(milestone.dueDate) < new Date()
                                
                                return (
                                  <div key={milestone.id} className="flex items-center gap-2 text-xs">
                                    <MilestoneStatusIcon className={`h-3 w-3 ${milestone.status === 'completed' ? 'text-green-500' : milestone.status === 'in-progress' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className={`flex-1 ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                      {milestone.name}
                                    </span>
                                    <span className={`text-muted-foreground ${isOverdue ? 'text-red-500' : ''}`}>
                                      {format(new Date(milestone.dueDate), 'MMM d')}
                                    </span>
                                    {isOverdue && (
                                      <Badge variant="destructive" className="text-xs h-4">
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                )
                              })}
                            {phase.milestones.filter(m => m.priority === 'critical' || m.priority === 'high').length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{phase.milestones.filter(m => m.priority === 'critical' || m.priority === 'high').length - 3} more high priority milestones
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="grid gap-4 md:grid-cols-3 pt-6 border-t">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Phases Completed</div>
                <div className="text-lg font-bold text-green-600">
                  {phases.filter(p => p.status === 'completed').length} / {phases.length}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Current Phase</div>
                <div className="text-sm font-bold">
                  {phases.find(p => p.status === 'in-progress')?.name || 'Not Started'}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Days Until Launch</div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.max(0, differenceInDays(projectEnd, currentDate))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}