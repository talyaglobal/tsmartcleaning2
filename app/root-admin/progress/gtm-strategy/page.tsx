'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, CheckCircle2, Clock, AlertCircle, TrendingUp, Target, Users, DollarSign } from 'lucide-react'
import { PhaseTracker } from '@/components/admin/progress/PhaseTracker'
import { MilestoneTracker } from '@/components/admin/progress/MilestoneTracker'
import { TimelineVisualization } from '@/components/admin/progress/TimelineVisualization'
import { GTMOverview } from '@/components/admin/progress/GTMOverview'

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

export default function GTMStrategyProgressPage() {
  const [phases, setPhases] = useState<GTMPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [overallCompletion, setOverallCompletion] = useState(0)
  const [selectedPhase, setSelectedPhase] = useState<string>('phase1')

  useEffect(() => {
    fetchGTMProgress()
  }, [])

  const fetchGTMProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/root-admin/progress/gtm-strategy')
      const data = await response.json()
      
      setPhases(data.phases)
      setOverallCompletion(data.overallCompletion)
    } catch (error) {
      console.error('Error fetching GTM progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMilestone = async (phaseId: string, milestoneId: string, updates: Partial<Milestone>) => {
    try {
      const response = await fetch(`/api/root-admin/progress/gtm-strategy/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, ...updates })
      })

      if (response.ok) {
        // Refresh data after successful update
        fetchGTMProgress()
      }
    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GTM Strategy Progress</h1>
          <p className="text-muted-foreground">Track go-to-market strategy implementation across all phases</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Overall Progress</span>
              <Badge variant="secondary">{overallCompletion}%</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Overall Progress Overview */}
      <GTMOverview phases={phases} overallCompletion={overallCompletion} />

      <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phase1">Phase 1: Foundation</TabsTrigger>
          <TabsTrigger value="phase2">Phase 2: Soft Launch</TabsTrigger>
          <TabsTrigger value="phase3">Phase 3: Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {phases.map((phase) => {
              const IconComponent = getPhaseIcon(phase.id)
              return (
                <Card key={phase.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <IconComponent className="h-8 w-8 text-primary" />
                      <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                        {phase.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{phase.name}</CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{phase.completion}%</span>
                        </div>
                        <Progress value={phase.completion} className="h-2" />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>{phase.timeline}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            {phase.milestones.filter(m => m.status === 'completed').length}/
                            {phase.milestones.length} milestones
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedPhase(phase.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                  
                  {/* Progress indicator bar */}
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${getStatusColor(phase.status)}`}
                    style={{ width: `${phase.completion}%` }}
                  />
                </Card>
              )
            })}
          </div>

          {/* Timeline Visualization */}
          <TimelineVisualization phases={phases} />
        </TabsContent>

        {phases.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="space-y-6">
            <PhaseTracker 
              phase={phase}
              onMilestoneUpdate={(milestoneId, updates) => 
                updateMilestone(phase.id, milestoneId, updates)
              }
            />
            <MilestoneTracker 
              milestones={phase.milestones}
              onMilestoneUpdate={(milestoneId, updates) => 
                updateMilestone(phase.id, milestoneId, updates)
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}