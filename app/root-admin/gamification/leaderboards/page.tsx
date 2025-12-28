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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  Award,
  Building2,
  UserCheck,
  Star,
  Target,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type LeaderboardType = 'points' | 'jobs' | 'ratings' | 'referrals'
type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all_time'
type UserType = 'company' | 'cleaner'

type LeaderboardEntry = {
  rank: number
  user_id: string
  user_name: string
  user_type: UserType
  score: number
  metadata?: Record<string, unknown>
}

type Leaderboard = {
  type: LeaderboardType
  timeframe: LeaderboardTimeframe
  user_type: UserType
  entries: LeaderboardEntry[]
  generated_at: string
  total_participants: number
}

type LeaderboardConfig = {
  id: string
  leaderboard_type: LeaderboardType
  user_type: UserType
  timeframe: string
  rankings: LeaderboardEntry[]
  updated_at: string
  tenant_id?: string | null
}

type HistoryEntry = {
  id: string
  date: string
  timeframe: string
  topRankings: LeaderboardEntry[]
  totalParticipants: number
}

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'create'>('current')
  
  // Current rankings state
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<LeaderboardType>('points')
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>('all_time')
  const [selectedUserType, setSelectedUserType] = useState<UserType>('company')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  
  // History state
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<Date | undefined>(undefined)
  const [selectedHistoryLeaderboard, setSelectedHistoryLeaderboard] = useState<string | null>(null)
  
  // Create leaderboard dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newLeaderboardType, setNewLeaderboardType] = useState<LeaderboardType>('points')
  const [newLeaderboardTimeframe, setNewLeaderboardTimeframe] = useState<LeaderboardTimeframe>('all_time')
  const [newLeaderboardUserType, setNewLeaderboardUserType] = useState<UserType>('company')
  const [newLeaderboardName, setNewLeaderboardName] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Saved leaderboards
  const [savedLeaderboards, setSavedLeaderboards] = useState<LeaderboardConfig[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

  // Load current leaderboard
  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: selectedType,
        timeframe: selectedTimeframe,
        userType: selectedUserType,
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      })
      
      const response = await fetch(`/api/root-admin/gamification/leaderboards?${params}`)
      if (!response.ok) throw new Error('Failed to load leaderboard')
      
      const data = await response.json()
      setLeaderboard(data.leaderboard)
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load saved leaderboards
  const loadSavedLeaderboards = async () => {
    setSavedLoading(true)
    try {
      // In a real implementation, you'd have an endpoint to list all saved leaderboards
      // For now, we'll just load the current one
      setSavedLeaderboards([])
    } catch (error) {
      console.error('Error loading saved leaderboards:', error)
    } finally {
      setSavedLoading(false)
    }
  }

  // Load history
  const loadHistory = async (leaderboardId: string) => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedHistoryDate) {
        params.set('startDate', format(selectedHistoryDate, 'yyyy-MM-dd'))
      }
      
      const response = await fetch(`/api/root-admin/gamification/leaderboards/${leaderboardId}/history?${params}`)
      if (!response.ok) throw new Error('Failed to load history')
      
      const data = await response.json()
      setHistoryEntries(data.history || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Refresh leaderboard
  const refreshLeaderboard = async (leaderboardId: string) => {
    try {
      const response = await fetch(`/api/root-admin/gamification/leaderboards/${leaderboardId}/refresh`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to refresh leaderboard')
      
      await loadLeaderboard()
    } catch (error) {
      console.error('Error refreshing leaderboard:', error)
    }
  }

  // Create new leaderboard
  const createLeaderboard = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/root-admin/gamification/leaderboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newLeaderboardType,
          timeframe: newLeaderboardTimeframe,
          userType: newLeaderboardUserType,
          name: newLeaderboardName,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to create leaderboard')
      
      setCreateDialogOpen(false)
      setNewLeaderboardName('')
      await loadSavedLeaderboards()
    } catch (error) {
      console.error('Error creating leaderboard:', error)
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [selectedType, selectedTimeframe, selectedUserType, currentPage, pageSize])

  useEffect(() => {
    if (activeTab === 'history' && selectedHistoryLeaderboard) {
      loadHistory(selectedHistoryLeaderboard)
    }
  }, [activeTab, selectedHistoryLeaderboard, selectedHistoryDate])

  const leaderboardColumns: Column<LeaderboardEntry>[] = [
    {
      key: 'rank',
      header: 'Rank',
      render: (entry) => (
        <div className="flex items-center gap-2">
          {entry.rank <= 3 && (
            <Trophy className={cn(
              "w-4 h-4",
              entry.rank === 1 && "text-yellow-500",
              entry.rank === 2 && "text-gray-400",
              entry.rank === 3 && "text-amber-600"
            )} />
          )}
          <span className="font-semibold">#{entry.rank}</span>
        </div>
      ),
    },
    {
      key: 'user_name',
      header: 'User',
      render: (entry) => (
        <div className="flex items-center gap-2">
          {entry.user_type === 'company' ? (
            <Building2 className="w-4 h-4 text-slate-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-slate-400" />
          )}
          <span>{entry.user_name}</span>
        </div>
      ),
    },
    {
      key: 'score',
      header: getScoreLabel(selectedType),
      render: (entry) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatScore(entry.score, selectedType)}</span>
          {entry.metadata && (
            <Badge variant="outline" className="text-xs">
              {getMetadataBadge(entry.metadata, selectedType)}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'user_type',
      header: 'Type',
      render: (entry) => (
        <Badge variant={entry.user_type === 'company' ? 'default' : 'secondary'}>
          {entry.user_type === 'company' ? 'Company' : 'Cleaner'}
        </Badge>
      ),
    },
  ]

  const getScoreLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'points': return 'Points'
      case 'jobs': return 'Jobs Completed'
      case 'ratings': return 'Average Rating'
      case 'referrals': return 'Referrals'
      default: return 'Score'
    }
  }

  const formatScore = (score: number, type: LeaderboardType): string => {
    if (type === 'ratings') {
      return score.toFixed(2)
    }
    return score.toLocaleString()
  }

  const getMetadataBadge = (metadata: Record<string, unknown>, type: LeaderboardType): string => {
    if (type === 'ratings' && metadata.review_count) {
      return `${metadata.review_count} reviews`
    }
    if (type === 'jobs' && metadata.jobs_completed) {
      return `${metadata.jobs_completed} jobs`
    }
    if (type === 'referrals' && metadata.referrals_count) {
      return `${metadata.referrals_count} referrals`
    }
    return ''
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboards Management"
        subtitle="Configure and manage leaderboards for companies and cleaners"
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Leaderboard
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="current">Current Rankings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="create">Saved Leaderboards</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg border">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="leaderboard-type">Leaderboard Type</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as LeaderboardType)}>
                <SelectTrigger id="leaderboard-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>Highest Points Earners</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="jobs">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>Most Active (Jobs)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ratings">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span>Top Employers/Performers (Rating)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="referrals">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Best Referrers</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="user-type">User Type</Label>
              <Select value={selectedUserType} onValueChange={(v) => setSelectedUserType(v as UserType)}>
                <SelectTrigger id="user-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="cleaner">Cleaners</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as LeaderboardTimeframe)}>
                <SelectTrigger id="timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadLeaderboard} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Leaderboard Table */}
          {leaderboard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} participants
                </div>
                <div className="flex items-center gap-2">
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DataTable
                columns={leaderboardColumns}
                data={leaderboard.entries}
                loading={loading}
                emptyState={
                  <EmptyState
                    title="No rankings found"
                    subtitle="No participants found for this leaderboard configuration."
                    icon={Trophy}
                  />
                }
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <div className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>Select Leaderboard</Label>
                <Select value={selectedHistoryLeaderboard || ''} onValueChange={setSelectedHistoryLeaderboard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a leaderboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* In a real implementation, load saved leaderboards here */}
                    <SelectItem value="placeholder">No saved leaderboards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedHistoryDate ? format(selectedHistoryDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedHistoryDate}
                      onSelect={setSelectedHistoryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="text-center py-8">Loading history...</div>
          ) : historyEntries.length > 0 ? (
            <div className="space-y-4">
              {historyEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{format(new Date(entry.date), 'PPP')}</div>
                      <div className="text-sm text-slate-500">{entry.totalParticipants} participants</div>
                    </div>
                    <Badge>{entry.timeframe}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Top 10 Rankings:</div>
                    <div className="space-y-1">
                      {entry.topRankings.slice(0, 10).map((ranking) => (
                        <div key={ranking.user_id} className="flex items-center justify-between text-sm">
                          <span>#{ranking.rank} {ranking.user_name}</span>
                          <span className="font-semibold">{formatScore(ranking.score, selectedType)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No history found"
              subtitle="No historical data available for the selected leaderboard."
              icon={History}
            />
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <h3 className="font-semibold mb-4">Saved Leaderboard Configurations</h3>
            {savedLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : savedLeaderboards.length > 0 ? (
              <div className="space-y-2">
                {savedLeaderboards.map((lb) => (
                  <div key={lb.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium">{lb.leaderboard_type} - {lb.user_type}</div>
                      <div className="text-sm text-slate-500">{lb.timeframe} • Updated {format(new Date(lb.updated_at), 'PPP')}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => refreshLeaderboard(lb.id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No saved leaderboards"
                subtitle="Create a new leaderboard configuration to get started."
                icon={Trophy}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Leaderboard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Custom Leaderboard</DialogTitle>
            <DialogDescription>
              Configure a new leaderboard with custom criteria and timeframe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-type">Leaderboard Type</Label>
              <Select value={newLeaderboardType} onValueChange={(v) => setNewLeaderboardType(v as LeaderboardType)}>
                <SelectTrigger id="new-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Highest Points Earners</SelectItem>
                  <SelectItem value="jobs">Most Active (Jobs)</SelectItem>
                  <SelectItem value="ratings">Top Employers/Performers (Rating)</SelectItem>
                  <SelectItem value="referrals">Best Referrers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-user-type">User Type</Label>
              <Select value={newLeaderboardUserType} onValueChange={(v) => setNewLeaderboardUserType(v as UserType)}>
                <SelectTrigger id="new-user-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="cleaner">Cleaners</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-timeframe">Timeframe</Label>
              <Select value={newLeaderboardTimeframe} onValueChange={(v) => setNewLeaderboardTimeframe(v as LeaderboardTimeframe)}>
                <SelectTrigger id="new-timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-name">Name (Optional)</Label>
              <Input
                id="new-name"
                value={newLeaderboardName}
                onChange={(e) => setNewLeaderboardName(e.target.value)}
                placeholder="e.g., Monthly Top Companies"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createLeaderboard} disabled={creating}>
              {creating ? 'Creating...' : 'Create Leaderboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

