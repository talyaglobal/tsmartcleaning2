'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  BarChart3,
  TrendingUp,
  Target,
  Users
} from 'lucide-react'
import { TaskTracker } from '@/components/admin/progress/TaskTracker'
import { TaskManagement } from '@/components/admin/progress/TaskManagement'
import { TeamAnalytics } from '@/components/admin/progress/TeamAnalytics'
import { CreateTaskDialog } from '@/components/admin/progress/CreateTaskDialog'

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: 'volkan' | 'ozgun'
  dueDate: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  category: string
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
}

export interface TeamStats {
  volkan: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
  }
  ozgun: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
  }
  overall: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
  }
}

export default function TeamTodoPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('dueDate')

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/root-admin/progress/team-todo')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/root-admin/progress/team-todo/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/root-admin/progress/team-todo/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        fetchTasks()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskCreate = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/root-admin/progress/team-todo/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        fetchTasks()
        fetchStats()
        setCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/root-admin/progress/team-todo/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTasks()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  }).sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'status':
        const statusOrder = { 'todo': 1, 'in-progress': 2, 'completed': 3 }
        return statusOrder[a.status] - statusOrder[b.status]
      case 'assignee':
        return a.assignee.localeCompare(b.assignee)
      default:
        return 0
    }
  })

  const volkanTasks = filteredTasks.filter(task => task.assignee === 'volkan')
  const ozgunTasks = filteredTasks.filter(task => task.assignee === 'ozgun')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team TODO Progress</h1>
          <p className="text-muted-foreground">Track and manage tasks for Volkan and Özgün</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          {stats && (
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Overall Completion</span>
                <Badge variant="secondary">{stats.overall.completionRate}%</Badge>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.overall.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.overall.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.overall.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overall.overdue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team</SelectItem>
                  <SelectItem value="volkan">Volkan</SelectItem>
                  <SelectItem value="ozgun">Özgün</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="assignee">Assignee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="volkan">Volkan's Tasks</TabsTrigger>
          <TabsTrigger value="ozgun">Özgün's Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Volkan's Overview */}
            <TaskTracker
              name="Volkan"
              tasks={volkanTasks}
              stats={stats?.volkan}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
            />

            {/* Özgün's Overview */}
            <TaskTracker
              name="Özgün"
              tasks={ozgunTasks}
              stats={stats?.ozgun}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
            />
          </div>
        </TabsContent>

        <TabsContent value="volkan" className="space-y-6">
          <TaskManagement
            title="Volkan's Tasks"
            tasks={volkanTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        </TabsContent>

        <TabsContent value="ozgun" className="space-y-6">
          <TaskManagement
            title="Özgün's Tasks"
            tasks={ozgunTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TeamAnalytics
            tasks={tasks}
            stats={stats}
          />
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreate={handleTaskCreate}
      />
    </div>
  )
}