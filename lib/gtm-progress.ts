// GTM Progress Management Utilities

export interface Milestone {
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

export interface GTMPhase {
  id: string
  name: string
  description: string
  duration: string
  timeline: string
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed'
  completion: number
  milestones: Milestone[]
}

export interface GTMProgressData {
  phases: GTMPhase[]
  overallCompletion: number
  summary: {
    totalPhases: number
    completedPhases: number
    totalMilestones: number
    completedMilestones: number
    overdueMilestones: number
  }
}

/**
 * Calculate phase completion percentage based on milestones
 */
export function calculatePhaseCompletion(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0
  
  const completedCount = milestones.filter(m => m.status === 'completed').length
  return Math.round((completedCount / milestones.length) * 100)
}

/**
 * Calculate overall GTM strategy completion
 */
export function calculateOverallCompletion(phases: GTMPhase[]): number {
  if (phases.length === 0) return 0
  
  const totalMilestones = phases.reduce((sum, phase) => sum + phase.milestones.length, 0)
  const completedMilestones = phases.reduce((sum, phase) => 
    sum + phase.milestones.filter(m => m.status === 'completed').length, 0
  )
  
  return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
}

/**
 * Determine phase status based on milestones and dates
 */
export function determinePhaseStatus(milestones: Milestone[], phaseEndDate: Date): GTMPhase['status'] {
  const completedCount = milestones.filter(m => m.status === 'completed').length
  const inProgressCount = milestones.filter(m => m.status === 'in-progress').length
  const overdueCount = milestones.filter(m => 
    m.status !== 'completed' && new Date(m.dueDate) < new Date()
  ).length
  
  // Phase is completed if all milestones are completed
  if (completedCount === milestones.length && milestones.length > 0) {
    return 'completed'
  }
  
  // Phase is delayed if it has overdue milestones or phase end date has passed
  if (overdueCount > 0 || (new Date() > phaseEndDate && completedCount < milestones.length)) {
    return 'delayed'
  }
  
  // Phase is in progress if any milestone is in progress or some are completed
  if (inProgressCount > 0 || completedCount > 0) {
    return 'in-progress'
  }
  
  return 'not-started'
}

/**
 * Get overdue milestones across all phases
 */
export function getOverdueMilestones(phases: GTMPhase[]): Milestone[] {
  const currentDate = new Date()
  const overdueMilestones: Milestone[] = []
  
  phases.forEach(phase => {
    phase.milestones.forEach(milestone => {
      if (milestone.status !== 'completed' && new Date(milestone.dueDate) < currentDate) {
        overdueMilestones.push(milestone)
      }
    })
  })
  
  return overdueMilestones
}

/**
 * Get critical milestones that need attention
 */
export function getCriticalMilestones(phases: GTMPhase[]): Milestone[] {
  const criticalMilestones: Milestone[] = []
  
  phases.forEach(phase => {
    phase.milestones.forEach(milestone => {
      if (milestone.priority === 'critical' && milestone.status !== 'completed') {
        criticalMilestones.push(milestone)
      }
    })
  })
  
  return criticalMilestones
}

/**
 * Get upcoming milestones in the next N days
 */
export function getUpcomingMilestones(phases: GTMPhase[], days: number = 7): Milestone[] {
  const currentDate = new Date()
  const targetDate = new Date(currentDate.getTime() + (days * 24 * 60 * 60 * 1000))
  const upcomingMilestones: Milestone[] = []
  
  phases.forEach(phase => {
    phase.milestones.forEach(milestone => {
      const dueDate = new Date(milestone.dueDate)
      if (milestone.status !== 'completed' && dueDate >= currentDate && dueDate <= targetDate) {
        upcomingMilestones.push(milestone)
      }
    })
  })
  
  // Sort by due date
  return upcomingMilestones.sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )
}

/**
 * Calculate team velocity (milestones completed per week)
 */
export function calculateTeamVelocity(phases: GTMPhase[], weeks: number = 4): number {
  const weeksAgo = new Date(Date.now() - (weeks * 7 * 24 * 60 * 60 * 1000))
  let completedInPeriod = 0
  
  phases.forEach(phase => {
    phase.milestones.forEach(milestone => {
      if (milestone.completionDate && new Date(milestone.completionDate) >= weeksAgo) {
        completedInPeriod++
      }
    })
  })
  
  return weeks > 0 ? Math.round((completedInPeriod / weeks) * 10) / 10 : 0
}

/**
 * Get milestone status color for UI
 */
export function getMilestoneStatusColor(milestone: Milestone): string {
  switch (milestone.status) {
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'in-progress':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'not-started':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500 text-white'
    case 'high':
      return 'bg-orange-500 text-white'
    case 'medium':
      return 'bg-yellow-500 text-white'
    case 'low':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

/**
 * Update milestone status and handle completion dates
 */
export function updateMilestoneStatus(
  milestone: Milestone, 
  newStatus: Milestone['status']
): Partial<Milestone> {
  const updates: Partial<Milestone> = { status: newStatus }
  
  if (newStatus === 'completed') {
    updates.completionDate = new Date().toISOString()
  } else {
    updates.completionDate = undefined
  }
  
  return updates
}

/**
 * Validate milestone data
 */
export function validateMilestone(milestone: Partial<Milestone>): string[] {
  const errors: string[] = []
  
  if (!milestone.name || milestone.name.trim().length === 0) {
    errors.push('Milestone name is required')
  }
  
  if (!milestone.description || milestone.description.trim().length === 0) {
    errors.push('Milestone description is required')
  }
  
  if (!milestone.dueDate) {
    errors.push('Due date is required')
  } else if (new Date(milestone.dueDate) < new Date()) {
    errors.push('Due date cannot be in the past')
  }
  
  if (!milestone.priority || !['low', 'medium', 'high', 'critical'].includes(milestone.priority)) {
    errors.push('Valid priority level is required')
  }
  
  if (!milestone.category || milestone.category.trim().length === 0) {
    errors.push('Category is required')
  }
  
  return errors
}