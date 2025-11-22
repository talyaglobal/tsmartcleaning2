'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import { format, subDays, isAfter, parseISO, differenceInDays } from 'date-fns'
import type { Task, TeamStats } from '@/app/root-admin/progress/team-todo/page'

interface TeamAnalyticsProps {
  tasks: Task[]
  stats: TeamStats | null
}

export function TeamAnalytics({ tasks, stats }: TeamAnalyticsProps) {
  // Calculate analytics
  const volkanTasks = tasks.filter(task => task.assignee === 'volkan')
  const ozgunTasks = tasks.filter(task => task.assignee === 'ozgun')
  
  // Completion rate comparison
  const volkanCompletionRate = stats?.volkan.completionRate || 0
  const ozgunCompletionRate = stats?.ozgun.completionRate || 0
  
  // Recent activity (last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7)
  const recentCompletedTasks = tasks.filter(task => 
    task.completedAt && isAfter(parseISO(task.completedAt), sevenDaysAgo)
  )
  
  // Task completion velocity (tasks per week)
  const volkanRecentCompleted = recentCompletedTasks.filter(task => task.assignee === 'volkan').length
  const ozgunRecentCompleted = recentCompletedTasks.filter(task => task.assignee === 'ozgun').length
  
  // Overdue analysis
  const currentDate = new Date()
  const overdueTasks = tasks.filter(task => 
    task.status !== 'completed' && isAfter(currentDate, parseISO(task.dueDate))
  )
  
  // Priority distribution
  const priorityDistribution = {
    critical: tasks.filter(task => task.priority === 'critical').length,
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  }
  
  // Average completion time
  const completedTasksWithTime = tasks.filter(task => 
    task.completedAt && task.status === 'completed'
  )
  
  const averageCompletionDays = completedTasksWithTime.length > 0
    ? Math.round(
        completedTasksWithTime.reduce((sum, task) => {
          const created = parseISO(task.createdAt)
          const completed = parseISO(task.completedAt!)
          return sum + differenceInDays(completed, created)
        }, 0) / completedTasksWithTime.length
      )
    : 0
  
  // Category analysis
  const categoryStats = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0
      }
    }
    acc[task.category].total++
    acc[task.category][task.status === 'in-progress' ? 'inProgress' : task.status]++
    return acc
  }, {} as Record<string, { total: number; completed: number; inProgress: number; todo: number }>)

  return (
    <div className="space-y-6">
      {/* Performance Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Performance Comparison
            </CardTitle>
            <CardDescription>Individual completion rates and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Volkan's Performance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Volkan</span>
                <Badge variant="outline">{volkanCompletionRate}%</Badge>
              </div>
              <Progress value={volkanCompletionRate} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-green-600">{stats?.volkan.completed || 0}</div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{stats?.volkan.inProgress || 0}</div>
                  <div className="text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">{stats?.volkan.overdue || 0}</div>
                  <div className="text-muted-foreground">Overdue</div>
                </div>
              </div>
            </div>

            {/* Özgün's Performance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Özgün</span>
                <Badge variant="outline">{ozgunCompletionRate}%</Badge>
              </div>
              <Progress value={ozgunCompletionRate} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-green-600">{stats?.ozgun.completed || 0}</div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{stats?.ozgun.inProgress || 0}</div>
                  <div className="text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">{stats?.ozgun.overdue || 0}</div>
                  <div className="text-muted-foreground">Overdue</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Velocity & Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Velocity & Trends
            </CardTitle>
            <CardDescription>Weekly completion rates and momentum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">This Week</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{recentCompletedTasks.length} tasks completed</div>
                  <div className="text-sm text-muted-foreground">
                    Volkan: {volkanRecentCompleted}, Özgün: {ozgunRecentCompleted}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">Avg Completion Time</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{averageCompletionDays} days</div>
                  <div className="text-sm text-muted-foreground">
                    From creation to completion
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Attention Needed</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{overdueTasks.length} overdue tasks</div>
                  <div className="text-sm text-red-600">
                    Requires immediate action
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>Task breakdown by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
              <div>
                <div className="text-lg font-bold text-red-600">{priorityDistribution.critical}</div>
                <div className="text-sm text-red-800">Critical</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50">
              <div>
                <div className="text-lg font-bold text-orange-600">{priorityDistribution.high}</div>
                <div className="text-sm text-orange-800">High</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-200 bg-yellow-50">
              <div>
                <div className="text-lg font-bold text-yellow-600">{priorityDistribution.medium}</div>
                <div className="text-sm text-yellow-800">Medium</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50">
              <div>
                <div className="text-lg font-bold text-green-600">{priorityDistribution.low}</div>
                <div className="text-sm text-green-800">Low</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Task completion by category</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(categoryStats).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2" />
              <p>No categories available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([category, stats]) => {
                const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {stats.completed}/{stats.total}
                        </Badge>
                        <span className="text-sm font-medium">{completionRate}%</span>
                      </div>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Completed: {stats.completed}</span>
                      <span>In Progress: {stats.inProgress}</span>
                      <span>To Do: {stats.todo}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Tasks completed in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCompletedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>No tasks completed this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompletedTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.category} • {task.assignee}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {task.completedAt && format(parseISO(task.completedAt), 'MMM d')}
                    </div>
                    <Badge className={
                      task.priority === 'critical' ? 'bg-red-500' :
                      task.priority === 'high' ? 'bg-orange-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    } variant="secondary">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {recentCompletedTasks.length > 5 && (
                <div className="text-center text-sm text-muted-foreground pt-2">
                  +{recentCompletedTasks.length - 5} more completed this week
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}