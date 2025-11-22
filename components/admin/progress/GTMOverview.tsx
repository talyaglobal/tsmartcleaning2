'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap
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

interface GTMOverviewProps {
  phases: GTMPhase[]
  overallCompletion: number
}

export function GTMOverview({ phases, overallCompletion }: GTMOverviewProps) {
  // Calculate metrics
  const totalMilestones = phases.reduce((sum, phase) => sum + phase.milestones.length, 0)
  const completedMilestones = phases.reduce((sum, phase) => 
    sum + phase.milestones.filter(m => m.status === 'completed').length, 0
  )
  const overdueMilestones = phases.reduce((sum, phase) => 
    sum + phase.milestones.filter(m => 
      m.status !== 'completed' && new Date(m.dueDate) < new Date()
    ).length, 0
  )
  const criticalMilestones = phases.reduce((sum, phase) => 
    sum + phase.milestones.filter(m => 
      m.priority === 'critical' && m.status !== 'completed'
    ).length, 0
  )

  const completedPhases = phases.filter(p => p.status === 'completed').length
  const inProgressPhases = phases.filter(p => p.status === 'in-progress').length
  const delayedPhases = phases.filter(p => p.status === 'delayed').length

  // Risk indicators
  const riskLevel = overdueMilestones > 5 ? 'high' : overdueMilestones > 2 ? 'medium' : 'low'
  const riskColor = riskLevel === 'high' ? 'text-red-600' : riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
  
  // Momentum calculation (simplified)
  const recentCompletions = phases.reduce((sum, phase) => 
    sum + phase.milestones.filter(m => 
      m.completionDate && 
      new Date(m.completionDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length, 0
  )
  
  const momentum = recentCompletions > 3 ? 'high' : recentCompletions > 1 ? 'medium' : 'low'
  const momentumColor = momentum === 'high' ? 'text-green-600' : momentum === 'medium' ? 'text-blue-600' : 'text-gray-600'

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{overallCompletion}%</p>
                <Progress value={overallCompletion} className="mt-2 h-2" />
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phases Complete</p>
                <p className="text-2xl font-bold">{completedPhases}/{phases.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inProgressPhases} in progress
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Milestones Complete</p>
                <p className="text-2xl font-bold">{completedMilestones}/{totalMilestones}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((completedMilestones / totalMilestones) * 100)}% completion rate
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                <p className={`text-2xl font-bold capitalize ${riskColor}`}>{riskLevel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overdueMilestones} overdue milestones
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${riskColor}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Phase Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phase Status</CardTitle>
            <CardDescription>Current status of all GTM phases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phases.map((phase) => (
                <div key={phase.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{phase.name}</span>
                      <Badge variant={
                        phase.status === 'completed' ? 'default' : 
                        phase.status === 'in-progress' ? 'secondary' :
                        phase.status === 'delayed' ? 'destructive' : 'outline'
                      }>
                        {phase.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <Progress value={phase.completion} className="mt-2 h-2" />
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-bold">{phase.completion}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Critical Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical Items</CardTitle>
            <CardDescription>High-priority tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalMilestones > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Critical Milestones</p>
                    <p className="text-xs text-red-600">{criticalMilestones} pending</p>
                  </div>
                  <Badge variant="destructive">{criticalMilestones}</Badge>
                </div>
              )}
              
              {overdueMilestones > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">Overdue Items</p>
                    <p className="text-xs text-orange-600">Require immediate attention</p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {overdueMilestones}
                  </Badge>
                </div>
              )}
              
              {delayedPhases > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Delayed Phases</p>
                    <p className="text-xs text-yellow-600">Behind schedule</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {delayedPhases}
                  </Badge>
                </div>
              )}
              
              {criticalMilestones === 0 && overdueMilestones === 0 && delayedPhases === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">All on Track</p>
                    <p className="text-xs text-green-600">No critical issues</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">✓</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Momentum & Velocity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Momentum</CardTitle>
            <CardDescription>Recent progress and velocity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`h-5 w-5 ${momentumColor}`} />
                  <span className="font-medium">Current Momentum</span>
                </div>
                <Badge variant="outline" className={`capitalize ${momentumColor}`}>
                  {momentum}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed this week:</span>
                  <span className="font-medium">{recentCompletions} milestones</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Average completion rate:</span>
                  <span className="font-medium">
                    {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Days since last milestone:</span>
                  <span className="font-medium">
                    {phases.some(p => p.milestones.some(m => m.completionDate)) ? '2 days' : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Next milestone due in 3 days
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}