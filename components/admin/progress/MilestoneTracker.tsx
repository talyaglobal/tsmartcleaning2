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
  Calendar,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2,
  User,
  Flag,
  MessageSquare,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'

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

interface MilestoneTrackerProps {
  milestones: Milestone[]
  onMilestoneUpdate: (milestoneId: string, updates: Partial<Milestone>) => void
}

export function MilestoneTracker({ milestones, onMilestoneUpdate }: MilestoneTrackerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2
      case 'in-progress': return PlayCircle
      case 'not-started': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'not-started': return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const isOverdue = (milestone: Milestone) => {
    return milestone.status !== 'completed' && new Date(milestone.dueDate) < new Date()
  }

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         milestone.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || milestone.status === filterStatus
    const matchesPriority = filterPriority === 'all' || milestone.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleStatusChange = (milestone: Milestone, newStatus: string) => {
    const updates: Partial<Milestone> = { status: newStatus as Milestone['status'] }
    
    if (newStatus === 'completed') {
      updates.completionDate = new Date().toISOString()
    } else {
      updates.completionDate = undefined
    }
    
    onMilestoneUpdate(milestone.id, updates)
  }

  const openEditDialog = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setEditDialogOpen(true)
  }

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMilestone) return

    const formData = new FormData(event.currentTarget)
    const updates: Partial<Milestone> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      dueDate: formData.get('dueDate') as string,
      priority: formData.get('priority') as Milestone['priority'],
      assignee: formData.get('assignee') as string,
      notes: formData.get('notes') as string,
    }

    onMilestoneUpdate(selectedMilestone.id, updates)
    setEditDialogOpen(false)
    setSelectedMilestone(null)
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestone Tracking</CardTitle>
              <CardDescription>
                Track and manage individual milestones for this phase
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {milestones.filter(m => m.status === 'completed').length} / {milestones.length} Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone List */}
      <div className="grid gap-4">
        {filteredMilestones.map((milestone) => {
          const StatusIcon = getStatusIcon(milestone.status)
          const isOverdueItem = isOverdue(milestone)
          
          return (
            <Card key={milestone.id} className={`transition-all hover:shadow-md ${isOverdueItem ? 'border-red-200 bg-red-50/30' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-full border ${getStatusColor(milestone.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{milestone.name}</h4>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(milestone.priority)} variant="secondary">
                          {milestone.priority}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(milestone)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}</span>
                        {isOverdueItem && (
                          <Badge variant="destructive" className="ml-1 text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      {milestone.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{milestone.assignee}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Flag className="h-4 w-4" />
                        <span>{milestone.category}</span>
                      </div>
                      
                      {milestone.completionDate && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completed: {format(new Date(milestone.completionDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {milestone.notes && (
                      <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm">{milestone.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {milestone.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'completed')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                    
                    {milestone.status === 'not-started' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'in-progress')}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {milestone.status === 'in-progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'not-started')}
                      >
                        <PauseCircle className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    
                    {milestone.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'in-progress')}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                  
                  <Badge variant="outline">
                    {milestone.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredMilestones.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No milestones found matching your filters.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Milestone Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Milestone</DialogTitle>
              <DialogDescription>
                Update milestone details and track progress
              </DialogDescription>
            </DialogHeader>
            
            {selectedMilestone && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedMilestone.name}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedMilestone.description}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      defaultValue={selectedMilestone.dueDate.split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue={selectedMilestone.priority}>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    name="assignee"
                    defaultValue={selectedMilestone.assignee || ''}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={selectedMilestone.notes || ''}
                    placeholder="Add any notes or updates..."
                  />
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