'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Users, 
  Award,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Download,
  RefreshCw,
  Building2,
  UserCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled'
type ChallengeType = 'booking_count' | 'rating_target' | 'streak' | 'points' | 'jobs' | 'ratings' | 'custom'
type UserType = 'company' | 'cleaner'

type Challenge = {
  id: string
  name: string
  description: string | null
  challenge_type: ChallengeType
  start_date: string
  end_date: string
  criteria: Record<string, unknown>
  rewards: Record<string, unknown>
  status: ChallengeStatus
  tenant_id: string | null
  created_at: string
}

type ChallengeParticipant = {
  id: string
  user_id: string
  user_name: string
  user_type: UserType
  progress: number
  target: number
  progressPercentage: number
  completed: boolean
  completed_at: string | null
  started_at: string
}

type ChallengeAnalytics = {
  challenge: {
    id: string
    name: string
    status: ChallengeStatus
    start_date: string
    end_date: string
  }
  metrics: {
    totalParticipants: number
    completedParticipants: number
    completionRate: number
    averageProgress: number
    averageProgressPercentage: number
    target: number
  }
  topParticipants: Array<{
    user_id: string
    user_name: string
    user_type: UserType
    progress: number
    completed: boolean
  }>
  rewards: {
    type: string
    value: number | string
    totalDistributed: number
  }
  participationByDate: Record<string, number>
  completionByDate: Record<string, number>
}

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'analytics'>('list')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ChallengeStatus | 'all'>('all')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  
  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    challenge_type: 'points' as ChallengeType,
    start_date: '',
    end_date: '',
    criteria: { type: 'points', target: 0, user_type: 'company' as UserType },
    rewards: { type: 'points', value: 0 },
    status: 'draft' as ChallengeStatus,
  })
  const [saving, setSaving] = useState(false)
  
  // Analytics
  const [analytics, setAnalytics] = useState<ChallengeAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  // Load challenges
  const loadChallenges = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      
      const response = await fetch(`/api/root-admin/gamification/challenges?${params}`)
      if (!response.ok) throw new Error('Failed to load challenges')
      
      const data = await response.json()
      setChallenges(data.challenges || [])
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load analytics
  const loadAnalytics = async (challengeId: string) => {
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`/api/root-admin/gamification/challenges/${challengeId}/analytics`)
      if (!response.ok) throw new Error('Failed to load analytics')
      
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Load participants
  const loadParticipants = async (challengeId: string) => {
    setParticipantsLoading(true)
    try {
      const response = await fetch(`/api/root-admin/gamification/challenges/${challengeId}/participants`)
      if (!response.ok) throw new Error('Failed to load participants')
      
      const data = await response.json()
      setParticipants(data.participants || [])
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setParticipantsLoading(false)
    }
  }

  // Save challenge
  const saveChallenge = async () => {
    setSaving(true)
    try {
      const url = editingChallenge
        ? `/api/root-admin/gamification/challenges/${editingChallenge.id}`
        : '/api/root-admin/gamification/challenges'
      
      const method = editingChallenge ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          challenge_type: formData.challenge_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          criteria: formData.criteria,
          rewards: formData.rewards,
          status: formData.status,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save challenge')
      }
      
      setDialogOpen(false)
      resetForm()
      await loadChallenges()
    } catch (error: any) {
      console.error('Error saving challenge:', error)
      alert(error.message || 'Failed to save challenge')
    } finally {
      setSaving(false)
    }
  }

  // Delete challenge
  const deleteChallenge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return
    
    try {
      const response = await fetch(`/api/root-admin/gamification/challenges/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete challenge')
      
      await loadChallenges()
    } catch (error) {
      console.error('Error deleting challenge:', error)
      alert('Failed to delete challenge')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      challenge_type: 'points',
      start_date: '',
      end_date: '',
      criteria: { type: 'points', target: 0, user_type: 'company' },
      rewards: { type: 'points', value: 0 },
      status: 'draft',
    })
    setEditingChallenge(null)
  }

  // Open create dialog
  const openCreateDialog = () => {
    resetForm()
    setEditingChallenge(null)
    setDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (challenge: Challenge) => {
    setEditingChallenge(challenge)
    setFormData({
      name: challenge.name,
      description: challenge.description || '',
      challenge_type: challenge.challenge_type,
      start_date: format(new Date(challenge.start_date), 'yyyy-MM-dd\'T\'HH:mm'),
      end_date: format(new Date(challenge.end_date), 'yyyy-MM-dd\'T\'HH:mm'),
      criteria: challenge.criteria as any,
      rewards: challenge.rewards as any,
      status: challenge.status,
    })
    setDialogOpen(true)
  }

  // View analytics
  const viewAnalytics = async (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setActiveTab('analytics')
    await loadAnalytics(challenge.id)
    await loadParticipants(challenge.id)
  }

  useEffect(() => {
    loadChallenges()
  }, [statusFilter])

  // Categorize challenges
  const categorizedChallenges = useMemo(() => {
    const now = new Date()
    return {
      active: challenges.filter(c => {
        const start = new Date(c.start_date)
        const end = new Date(c.end_date)
        return c.status === 'active' && start <= now && end >= now
      }),
      upcoming: challenges.filter(c => {
        const start = new Date(c.start_date)
        return c.status === 'draft' || (c.status === 'active' && start > now)
      }),
      completed: challenges.filter(c => {
        const end = new Date(c.end_date)
        return c.status === 'completed' || (c.status === 'active' && end < now)
      }),
      cancelled: challenges.filter(c => c.status === 'cancelled'),
    }
  }, [challenges])

  const getStatusBadge = (status: ChallengeStatus) => {
    const variants: Record<ChallengeStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      draft: { variant: 'outline', icon: Clock },
      active: { variant: 'default', icon: CheckCircle },
      completed: { variant: 'secondary', icon: Award },
      cancelled: { variant: 'destructive', icon: XCircle },
    }
    const { variant, icon: Icon } = variants[status]
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const challengeColumns: Column<Challenge>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (challenge) => (
        <div>
          <div className="font-medium">{challenge.name}</div>
          {challenge.description && (
            <div className="text-sm text-slate-500 truncate max-w-md">{challenge.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'challenge_type',
      header: 'Type',
      render: (challenge) => (
        <Badge variant="outline">
          {challenge.challenge_type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (challenge) => (
        <div className="text-sm">
          <div>Start: {format(new Date(challenge.start_date), 'MMM d, yyyy')}</div>
          <div>End: {format(new Date(challenge.end_date), 'MMM d, yyyy')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (challenge) => getStatusBadge(challenge.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (challenge) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewAnalytics(challenge)}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(challenge)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteChallenge(challenge.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const participantColumns: Column<ChallengeParticipant>[] = [
    {
      key: 'user_name',
      header: 'Participant',
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.user_type === 'company' ? (
            <Building2 className="w-4 h-4 text-slate-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-slate-400" />
          )}
          <span>{p.user_name}</span>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (p) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{p.progress} / {p.target}</span>
            <Badge variant={p.completed ? 'default' : 'outline'}>
              {p.progressPercentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min(100, p.progressPercentage)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge variant={p.completed ? 'default' : 'secondary'}>
          {p.completed ? 'Completed' : 'In Progress'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenges & Quests Management"
        subtitle="Create and manage time-limited challenges for companies and cleaners"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list">Challenge List</TabsTrigger>
          <TabsTrigger value="create">Quick Create</TabsTrigger>
          <TabsTrigger value="analytics" disabled={!selectedChallenge}>
            Analytics {selectedChallenge && `(${selectedChallenge.name})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border">
            <div className="flex-1">
              <Label>Filter by Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Challenges</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={loadChallenges}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Challenge Categories */}
          {statusFilter === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Active Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{categorizedChallenges.active.length}</div>
                  <p className="text-sm text-slate-500 mt-1">Currently running</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Upcoming Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{categorizedChallenges.upcoming.length}</div>
                  <p className="text-sm text-slate-500 mt-1">Scheduled to start</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Completed Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{categorizedChallenges.completed.length}</div>
                  <p className="text-sm text-slate-500 mt-1">Finished</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Challenges Table */}
          <DataTable
            columns={challengeColumns}
            data={challenges}
            loading={loading}
            emptyState={
              <EmptyState
                title="No challenges found"
                description="Create your first challenge to get started."
                icon={Target}
                action={
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                }
              />
            }
          />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Create Challenge</CardTitle>
              <CardDescription>Fill out the form below to create a new challenge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quick-name">Challenge Name</Label>
                  <Input
                    id="quick-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Cleaning Marathon"
                  />
                </div>
                <div>
                  <Label htmlFor="quick-description">Description</Label>
                  <Textarea
                    id="quick-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the challenge..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quick-type">Challenge Type</Label>
                    <Select
                      value={formData.challenge_type}
                      onValueChange={(v) => setFormData({ ...formData, challenge_type: v as ChallengeType })}
                    >
                      <SelectTrigger id="quick-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Points</SelectItem>
                        <SelectItem value="jobs">Jobs Completed</SelectItem>
                        <SelectItem value="ratings">Rating Target</SelectItem>
                        <SelectItem value="booking_count">Booking Count</SelectItem>
                        <SelectItem value="streak">Streak</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quick-user-type">User Type</Label>
                    <Select
                      value={(formData.criteria as any).user_type}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, user_type: v as UserType }
                      })}
                    >
                      <SelectTrigger id="quick-user-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Companies</SelectItem>
                        <SelectItem value="cleaner">Cleaners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quick-start">Start Date</Label>
                    <Input
                      id="quick-start"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-end">End Date</Label>
                    <Input
                      id="quick-end"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quick-target">Target</Label>
                    <Input
                      id="quick-target"
                      type="number"
                      value={(formData.criteria as any).target || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, target: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-reward">Reward Points</Label>
                    <Input
                      id="quick-reward"
                      type="number"
                      value={(formData.rewards as any).value || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rewards: { ...formData.rewards, value: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
                <Button onClick={saveChallenge} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Create Challenge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : analytics ? (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.metrics.totalParticipants}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.metrics.completedParticipants}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {analytics.metrics.completionRate.toFixed(1)}% completion rate
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.metrics.averageProgress.toFixed(1)}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {analytics.metrics.averageProgressPercentage.toFixed(1)}% of target
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Rewards Distributed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.rewards.totalDistributed}</div>
                    <p className="text-xs text-slate-500 mt-1">
                      {analytics.rewards.type} rewards
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Participants */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.topParticipants.map((p, idx) => (
                      <div key={p.user_id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">#{idx + 1}</span>
                          <span>{p.user_name}</span>
                          <Badge variant="outline">{p.user_type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.progress}</span>
                          {p.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Participants Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Participants</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowParticipants(!showParticipants)}
                    >
                      {showParticipants ? 'Hide' : 'Show'} Participants
                    </Button>
                  </div>
                </CardHeader>
                {showParticipants && (
                  <CardContent>
                    <DataTable
                      columns={participantColumns}
                      data={participants}
                      loading={participantsLoading}
                      emptyState={
                        <EmptyState
                          title="No participants"
                          description="No users have joined this challenge yet."
                          icon={Users}
                        />
                      }
                    />
                  </CardContent>
                )}
              </Card>
            </>
          ) : (
            <EmptyState
              title="No analytics available"
              description="Select a challenge to view its analytics."
              icon={BarChart3}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}</DialogTitle>
            <DialogDescription>
              {editingChallenge ? 'Update challenge details' : 'Configure a new time-limited challenge'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Challenge Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Cleaning Marathon"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the challenge..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="challenge_type">Challenge Type *</Label>
                <Select
                  value={formData.challenge_type}
                  onValueChange={(v) => setFormData({ ...formData, challenge_type: v as ChallengeType })}
                >
                  <SelectTrigger id="challenge_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="jobs">Jobs Completed</SelectItem>
                    <SelectItem value="ratings">Rating Target</SelectItem>
                    <SelectItem value="booking_count">Booking Count</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as ChallengeStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="user_type">User Type</Label>
              <Select
                value={(formData.criteria as any).user_type}
                onValueChange={(v) => setFormData({
                  ...formData,
                  criteria: { ...formData.criteria, user_type: v as UserType }
                })}
              >
                <SelectTrigger id="user_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="cleaner">Cleaners</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target">Target *</Label>
              <Input
                id="target"
                type="number"
                value={(formData.criteria as any).target || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  criteria: { ...formData.criteria, target: parseInt(e.target.value) || 0 }
                })}
                placeholder="e.g., 100 points, 10 jobs, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reward_type">Reward Type</Label>
                <Select
                  value={(formData.rewards as any).type || 'points'}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards, type: v }
                  })}
                >
                  <SelectTrigger id="reward_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reward_value">Reward Value</Label>
                <Input
                  id="reward_value"
                  type="number"
                  value={(formData.rewards as any).value || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards, value: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveChallenge} disabled={saving}>
              {saving ? 'Saving...' : editingChallenge ? 'Update' : 'Create'} Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

