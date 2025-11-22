'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { LoadingSpinner } from '@/components/admin/LoadingSpinner'
import { EmptyState } from '@/components/admin/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Award,
  Search,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Building2,
  User,
  TrendingUp,
} from 'lucide-react'
import { BadgeForm } from './components/BadgeForm'
import { BadgeDistribution } from './components/BadgeDistribution'
import { toast } from 'sonner'

type BadgeData = {
  id: string
  code: string
  name: string
  description: string
  icon?: string
  user_type: 'company' | 'cleaner'
  criteria: {
    type: string
    threshold: number
    metadata?: Record<string, unknown>
  }
  points_reward?: number
  totalEarned: number
  created_at: string
  updated_at: string
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null)
  const [distributionData, setDistributionData] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBadges()
    if (activeTab === 'distribution') {
      loadDistribution()
    }
  }, [activeTab])

  const loadBadges = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (userTypeFilter !== 'all') {
        params.append('userType', userTypeFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/root-admin/gamification/badges?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to load badges')
      }
      const data = await res.json()
      setBadges(data.badges || [])
    } catch (error: any) {
      console.error('Error loading badges:', error)
      toast.error(error.message || 'Failed to load badges')
    } finally {
      setLoading(false)
    }
  }

  const loadDistribution = async () => {
    try {
      const res = await fetch('/api/root-admin/gamification/badges/distribution')
      if (res.ok) {
        const data = await res.json()
        setDistributionData(data)
      }
    } catch (error) {
      console.error('Error loading distribution:', error)
    }
  }

  const filteredBadges = useMemo(() => {
    let filtered = badges

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (badge) =>
          badge.name.toLowerCase().includes(query) ||
          badge.description.toLowerCase().includes(query) ||
          badge.code.toLowerCase().includes(query)
      )
    }

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter((badge) => badge.user_type === userTypeFilter)
    }

    return filtered
  }, [badges, searchQuery, userTypeFilter])

  const handleSave = async (formData: any) => {
    setSaving(true)
    try {
      if (editingBadge) {
        // Update existing badge
        const res = await fetch(`/api/root-admin/gamification/badges/${editingBadge.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to update badge')
        }
        toast.success('Badge updated successfully')
      } else {
        // Create new badge
        const res = await fetch('/api/root-admin/gamification/badges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create badge')
        }
        toast.success('Badge created successfully')
      }

      setShowForm(false)
      setEditingBadge(null)
      await loadBadges()
      if (activeTab === 'distribution') {
        await loadDistribution()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save badge')
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/root-admin/gamification/badges/${badgeId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete badge')
      }

      toast.success('Badge deleted successfully')
      await loadBadges()
      if (activeTab === 'distribution') {
        await loadDistribution()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete badge')
    }
  }

  const handleEdit = (badge: BadgeData) => {
    setEditingBadge(badge)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingBadge(null)
    setShowForm(true)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'distribution' && !distributionData) {
      loadDistribution()
    }
  }

  const companyBadges = filteredBadges.filter((b) => b.user_type === 'company')
  const cleanerBadges = filteredBadges.filter((b) => b.user_type === 'cleaner')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Badges & Achievements"
        subtitle="Manage badges, view distribution, and track achievements"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Badge
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <Award className="h-4 w-4 mr-2" />
            Badge List
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="h-4 w-4 mr-2" />
            Distribution & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search badges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="cleaner">Cleaner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Badges</p>
                    <p className="text-2xl font-bold">{badges.length}</p>
                  </div>
                  <Award className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Company Badges</p>
                    <p className="text-2xl font-bold">{companyBadges.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Cleaner Badges</p>
                    <p className="text-2xl font-bold">{cleanerBadges.length}</p>
                  </div>
                  <User className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Earned</p>
                    <p className="text-2xl font-bold">
                      {badges.reduce((sum, b) => sum + (b.totalEarned || 0), 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Badge List */}
          {loading ? (
            <LoadingSpinner label="Loading badges..." />
          ) : filteredBadges.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No badges found"
              description={
                searchQuery || userTypeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first badge to get started'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBadges.map((badge) => (
                <Card key={badge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{badge.icon || '🏆'}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{badge.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {badge.user_type === 'company' ? (
                              <>
                                <Building2 className="h-3 w-3 mr-1" />
                                Company
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Cleaner
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{badge.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate-500">Earned:</span>
                        <span className="font-semibold ml-2">{badge.totalEarned || 0}</span>
                      </div>
                      {badge.points_reward && badge.points_reward > 0 && (
                        <Badge variant="secondary">+{badge.points_reward} pts</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(badge)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(badge.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          {distributionData ? (
            <BadgeDistribution data={distributionData} />
          ) : (
            <LoadingSpinner label="Loading distribution data..." />
          )}
        </TabsContent>
      </Tabs>

      {/* Badge Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
          </DialogHeader>
          <BadgeForm
            badge={editingBadge ? {
              id: editingBadge.id,
              code: editingBadge.code,
              name: editingBadge.name,
              description: editingBadge.description,
              icon: editingBadge.icon,
              user_type: editingBadge.user_type,
              criteria: editingBadge.criteria,
              points_reward: editingBadge.points_reward,
            } : undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingBadge(null)
            }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

