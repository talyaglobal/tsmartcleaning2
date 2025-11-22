'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User,
  Calendar,
  Flag,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Trash2,
  Edit
} from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import type { Task } from '@/app/root-admin/progress/team-todo/page'

interface TaskTrackerProps {
  name: string
  tasks: Task[]
  stats?: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
  }
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
}

export function TaskTracker({ 
  name, 
  tasks, 
  stats, 
  onTaskUpdate, 
  onTaskDelete 
}: TaskTrackerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'todo': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2
      case 'in-progress': return PlayCircle
      case 'todo': return Clock
      default: return Clock
    }
  }

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && isAfter(new Date(), parseISO(task.dueDate))
  }

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    const updates: Partial<Task> = { status: newStatus }
    
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString()
    } else {
      updates.completedAt = undefined
    }
    
    onTaskUpdate(task.id, updates)
  }

  // Sort tasks: overdue first, then by priority, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a)
    const bOverdue = isOverdue(b)
    
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{name}'s Tasks</CardTitle>
              <CardDescription>Task progress and status overview</CardDescription>
            </div>
          </div>
          {stats && (
            <Badge variant="outline" className="text-lg px-3 py-1">
              {stats.completionRate}% Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        {stats && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-bold">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-lg font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <div className="text-lg font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <div className="text-lg font-bold text-red-600">{stats.overdue}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center justify-between">
            Recent Tasks
            <Badge variant="outline">{sortedTasks.length} tasks</Badge>
          </h4>
          
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sortedTasks.slice(0, 5).map((task) => {
                const StatusIcon = getStatusIcon(task.status)
                const taskOverdue = isOverdue(task)
                
                return (
                  <div 
                    key={task.id} 
                    className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                      taskOverdue ? 'border-red-200 bg-red-50/30' : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Task Header */}
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full border ${getStatusColor(task.status)}`}>
                            <StatusIcon className="h-3 w-3" />
                          </div>
                          <h5 className="font-medium text-sm truncate">{task.title}</h5>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Task Details */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(parseISO(task.dueDate), 'MMM d')}</span>
                            {taskOverdue && (
                              <Badge variant="destructive" className="text-xs h-4">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          {task.category && (
                            <div className="flex items-center gap-1">
                              <Flag className="h-3 w-3" />
                              <span>{task.category}</span>
                            </div>
                          )}
                        </div>

                        {/* Task Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(task, 'completed')}
                            className="h-6 px-2"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {task.status === 'todo' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(task, 'in-progress')}
                            className="h-6 px-2"
                          >
                            <PlayCircle className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {task.status === 'in-progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(task, 'todo')}
                            className="h-6 px-2"
                          >
                            <PauseCircle className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {task.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(task, 'in-progress')}
                            className="h-6 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTaskDelete(task.id)}
                          className="h-6 px-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {sortedTasks.length > 5 && (
                <div className="text-center text-xs text-muted-foreground pt-2">
                  +{sortedTasks.length - 5} more tasks
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}