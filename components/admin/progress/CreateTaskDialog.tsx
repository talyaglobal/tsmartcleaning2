'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  User,
  Flag,
  Clock,
  Tag,
  Plus,
  X
} from 'lucide-react'
import type { Task } from '@/app/root-admin/progress/team-todo/page'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreate: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  onTaskCreate 
}: CreateTaskDialogProps) {
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: 'todo' as const,
      priority: formData.get('priority') as Task['priority'],
      assignee: formData.get('assignee') as Task['assignee'],
      dueDate: new Date(formData.get('dueDate') as string).toISOString(),
      category: formData.get('category') as string,
      estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : undefined,
      tags: tags.length > 0 ? tags : undefined
    }

    onTaskCreate(taskData)
    
    // Reset form
    ;(event.target as HTMLFormElement).reset()
    setTags([])
    setCurrentTag('')
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Task
            </DialogTitle>
            <DialogDescription>
              Add a new task for team members to complete
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Implement user authentication"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of what needs to be done..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Assignment & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select name="assignee" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volkan">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Volkan
                      </div>
                    </SelectItem>
                    <SelectItem value="ozgun">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Özgün
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timing & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  required
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
                  placeholder="e.g. 4"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Development">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Development
                    </div>
                  </SelectItem>
                  <SelectItem value="Design">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Design
                    </div>
                  </SelectItem>
                  <SelectItem value="Testing">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Testing
                    </div>
                  </SelectItem>
                  <SelectItem value="Documentation">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Documentation
                    </div>
                  </SelectItem>
                  <SelectItem value="Research">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Research
                    </div>
                  </SelectItem>
                  <SelectItem value="Marketing">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Marketing
                    </div>
                  </SelectItem>
                  <SelectItem value="Operations">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Operations
                    </div>
                  </SelectItem>
                  <SelectItem value="Other">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <Label>Tags (Optional)</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add tag..."
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={addTag}
                  disabled={!currentTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}