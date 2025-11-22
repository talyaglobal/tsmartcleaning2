'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { 
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Flag,
  User,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import type { Task } from '@/app/root-admin/progress/team-todo/page'

interface TaskManagementProps {
  title: string
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
}

export function TaskManagement({ 
  title, 
  tasks, 
  onTaskUpdate, 
  onTaskDelete 
}: TaskManagementProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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

  const openEditDialog = (task: Task) => {
    setSelectedTask(task)
    setEditDialogOpen(true)
  }

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTask) return

    const formData = new FormData(event.currentTarget)
    const updates: Partial<Task> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as Task['priority'],
      dueDate: formData.get('dueDate') as string,
      category: formData.get('category') as string,
      estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : undefined,
    }

    onTaskUpdate(selectedTask.id, updates)
    setEditDialogOpen(false)
    setSelectedTask(null)
  }

  // Sort tasks by priority and due date
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

  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>Manage and track individual tasks</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {completedTasks} / {totalTasks} Complete ({completionRate}%)
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks assigned yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status)
            const taskOverdue = isOverdue(task)
            
            return (
              <Card key={task.id} className={`transition-all hover:shadow-md ${taskOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Task Header */}
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full border ${getStatusColor(task.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onTaskDelete(task.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Task Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {format(parseISO(task.dueDate), 'MMM d, yyyy')}</span>
                          {taskOverdue && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        {task.category && (
                          <div className="flex items-center gap-1">
                            <Flag className="h-4 w-4" />
                            <span>{task.category}</span>
                          </div>
                        )}
                        
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{task.estimatedHours}h estimated</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="capitalize">{task.assignee}</span>
                        </div>
                        
                        {task.completedAt && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed: {format(parseISO(task.completedAt), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-2">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {task.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(task, 'completed')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                      
                      {task.status === 'todo' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(task, 'in-progress')}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {task.status === 'in-progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(task, 'todo')}
                        >
                          <PauseCircle className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      
                      {task.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(task, 'in-progress')}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reopen
                        </Button>
                      )}
                    </div>
                    
                    <Badge variant="outline">
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details and settings
              </DialogDescription>
            </DialogHeader>
            
            {selectedTask && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedTask.title}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedTask.description}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue={selectedTask.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      defaultValue={selectedTask.dueDate.split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={selectedTask.category}
                      placeholder="e.g. Development, Design"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      name="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      defaultValue={selectedTask.estimatedHours || ''}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}