'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, Users, Mail, Phone, MapPin, Calendar, Award, TrendingUp, CheckCircle2, XCircle, Loader2, UserCog, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'

type Ambassador = {
  id: string
  email: string
  full_name?: string | null
  name?: string | null
  phone?: string | null
  role: string
  is_active?: boolean
  created_at?: string
  team_size?: number
  jobs_managed?: number
  completion_rate?: number
  average_rating?: number
  city?: string | null
  state?: string | null
  company_id?: string | null
}

export default function AmbassadorAdminPage() {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [results, setResults] = useState<Ambassador[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Dialog states
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // Message state
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [sending, setSending] = useState(false)

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('search', q.trim())
    if (statusFilter !== 'all') sp.set('status', statusFilter)
    sp.set('role', 'ambassador')
    sp.set('sort', sort)
    sp.set('limit', String(limit))
    sp.set('offset', String(offset))
    return sp.toString()
  }, [q, statusFilter, sort, offset])

  useEffect(() => {
    let canceled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' })
        const json = await res.json()
        if (!canceled) {
          // Fetch additional ambassador stats
          const ambassadorsWithStats = await Promise.all(
            (json.users || []).map(async (ambassador: Ambassador) => {
              try {
                // Fetch team size and job stats
                const statsRes = await fetch(`/api/ambassador/stats?ambassadorId=${ambassador.id}`)
                const stats = await statsRes.json()
                return {
                  ...ambassador,
                  team_size: stats.teamSize || 0,
                  jobs_managed: stats.jobsManaged || 0,
                  completion_rate: stats.completionRate || 0,
                  average_rating: stats.averageRating || 0,
                }
              } catch {
                return ambassador
              }
            })
          )
          setResults(ambassadorsWithStats)
          setTotal(json.total || ambassadorsWithStats.length)
        }
      } catch {
        if (!canceled) {
          setResults([])
          setTotal(0)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    run()
    return () => {
      canceled = true
    }
  }, [params])

  const canPrev = offset > 0
  const canNext = offset + limit < total

  // Handle status update
  const handleStatusUpdate = async (ambassador: Ambassador, isActive: boolean) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/users/${ambassador.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })
      const data = await res.json()
      if (res.ok) {
        // Update local state
        setResults(results.map(a => a.id === ambassador.id ? { ...a, is_active: isActive } : a))
        alert(data.message || (isActive ? 'Ambassador activated' : 'Ambassador deactivated'))
      } else {
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      alert('Error updating status')
    } finally {
      setUpdating(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!selectedAmbassador || !messageBody.trim()) {
      alert('Please enter a message')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedAmbassador.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: messageSubject,
          message: messageBody,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Message sent successfully')
        setMessageDialogOpen(false)
        setMessageBody('')
        setMessageSubject('')
      } else {
        alert(data.error || 'Failed to send message')
      }
    } catch (error) {
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const displayName = (ambassador: Ambassador) => {
    return ambassador.full_name || ambassador.name || ambassador.email.split('@')[0] || 'Unknown'
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />

      <div className="container mx-auto px-4 py-8">
        <PageHeader
          eyebrow="Administration"
          title="Ambassador Admin"
          subtitle="Manage and monitor platform ambassadors"
          withBorder
        />

        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email..."
                className="pl-9"
                value={q}
                onChange={(e) => {
                  setOffset(0)
                  setQ(e.target.value)
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => {
              setOffset(0)
              setStatusFilter(v)
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading && results.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="p-12 text-center">
            <UserCog className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No ambassadors found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 mb-6">
              {results.map((ambassador) => (
                <Card key={ambassador.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{displayName(ambassador)}</h3>
                        <Badge variant={ambassador.is_active ? 'default' : 'secondary'}>
                          {ambassador.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{ambassador.email}</span>
                        </div>
                        {ambassador.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{ambassador.phone}</span>
                          </div>
                        )}
                        {(ambassador.city || ambassador.state) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{[ambassador.city, ambassador.state].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        {ambassador.created_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {new Date(ambassador.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Team Size</div>
                            <div className="font-semibold">{ambassador.team_size || 0}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Jobs Managed</div>
                            <div className="font-semibold">{ambassador.jobs_managed || 0}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-xs text-muted-foreground">Completion Rate</div>
                            <div className="font-semibold">{ambassador.completion_rate?.toFixed(0) || 0}%</div>
                          </div>
                        </div>
                        {ambassador.average_rating && ambassador.average_rating > 0 && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <div>
                              <div className="text-xs text-muted-foreground">Avg Rating</div>
                              <div className="font-semibold">{ambassador.average_rating.toFixed(1)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAmbassador(ambassador)
                          setDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAmbassador(ambassador)
                          setMessageDialogOpen(true)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        variant={ambassador.is_active ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleStatusUpdate(ambassador, !ambassador.is_active)}
                        disabled={updating}
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : ambassador.is_active ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} ambassadors
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={!canPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={!canNext}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ambassador Details</DialogTitle>
              <DialogDescription>
                Complete information about {selectedAmbassador ? displayName(selectedAmbassador) : 'this ambassador'}
              </DialogDescription>
            </DialogHeader>
            {selectedAmbassador && (
              <div className="space-y-4">
                <Tabs defaultValue="info">
                  <TabsList>
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <div className="text-sm font-medium">{displayName(selectedAmbassador)}</div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="text-sm font-medium">{selectedAmbassador.email}</div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <div className="text-sm font-medium">{selectedAmbassador.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div>
                          <Badge variant={selectedAmbassador.is_active ? 'default' : 'secondary'}>
                            {selectedAmbassador.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Location</Label>
                        <div className="text-sm font-medium">
                          {[selectedAmbassador.city, selectedAmbassador.state].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label>Joined Date</Label>
                        <div className="text-sm font-medium">
                          {selectedAmbassador.created_at
                            ? new Date(selectedAmbassador.created_at).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="stats" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">Team Size</div>
                        <div className="text-2xl font-bold">{selectedAmbassador.team_size || 0}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">Jobs Managed</div>
                        <div className="text-2xl font-bold">{selectedAmbassador.jobs_managed || 0}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                        <div className="text-2xl font-bold">{selectedAmbassador.completion_rate?.toFixed(1) || 0}%</div>
                      </Card>
                      {selectedAmbassador.average_rating && selectedAmbassador.average_rating > 0 && (
                        <Card className="p-4">
                          <div className="text-sm text-muted-foreground mb-1">Average Rating</div>
                          <div className="text-2xl font-bold">{selectedAmbassador.average_rating.toFixed(1)}</div>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedAmbassador ? displayName(selectedAmbassador) : 'this ambassador'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Message subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage} disabled={!messageBody.trim() || sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

