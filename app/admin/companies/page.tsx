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
import { Search, Star, MapPin, ShieldCheck, BarChart3, Mail, FileText, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type CompanySearchItem = {
  id: string
  name: string
  slug?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  averageRating?: number | null
  totalReviews?: number
  verified: boolean
  priceRange?: string | null
  description?: string | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  featured: boolean
  distanceMiles?: number | null
}

export default function AdminCompaniesPage() {
  const [q, setQ] = useState('')
  const [minRating, setMinRating] = useState<number>(0)
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false)
  const [sort, setSort] = useState<'distance' | 'rating' | 'featured'>('rating')
  const [results, setResults] = useState<CompanySearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Dialog states
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchItem | null>(null)
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)
  
  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  
  // Message state
  const [messageChannel, setMessageChannel] = useState<'email' | 'whatsapp'>('email')
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [sending, setSending] = useState(false)
  
  // Reports state
  const [reports, setReports] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (minRating > 0) sp.set('minRating', String(minRating))
    if (verifiedOnly) sp.set('verifiedOnly', 'true')
    sp.set('sort', sort)
    sp.set('limit', String(limit))
    sp.set('offset', String(offset))
    return sp.toString()
  }, [q, minRating, verifiedOnly, sort, offset])

  useEffect(() => {
    let canceled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/companies/search?${params}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to load companies: ${res.status}`)
        }
        const json = await res.json()
        if (!canceled) {
          setResults(json.results || [])
          setTotal(json.total || 0)
        }
      } catch (err: any) {
        if (!canceled) {
          console.error('Error loading companies:', err)
          setError(err?.message || 'Failed to load companies. Please try again.')
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

  // Handle verification
  const handleVerify = async (company: CompanySearchItem, verified: boolean) => {
    setVerifying(true)
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      })
      const data = await res.json()
      if (res.ok) {
        // Update local state
        setResults(results.map(c => c.id === company.id ? { ...c, verified } : c))
        alert(data.message || (verified ? 'Company verified' : 'Verification removed'))
      } else {
        alert(data.error || 'Failed to update verification')
      }
    } catch (error) {
      alert('Error updating verification status')
    } finally {
      setVerifying(false)
    }
  }

  // Load analytics
  const loadAnalytics = async (companyId: string) => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/analytics`)
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Open analytics dialog
  const openAnalytics = (company: CompanySearchItem) => {
    setSelectedCompany(company)
    setAnalyticsDialogOpen(true)
    loadAnalytics(company.id)
  }

  // Send message
  const sendMessage = async () => {
    if (!selectedCompany || !messageBody.trim()) {
      alert('Please enter a message')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/admin/companies/${selectedCompany.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: messageChannel,
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

  // Load reports
  const loadReports = async (companyId: string) => {
    setReportsLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/reports`)
      const data = await res.json()
      setReports(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading reports:', error)
      setReports([])
    } finally {
      setReportsLoading(false)
    }
  }

  // Open reports dialog
  const openReports = (company: CompanySearchItem) => {
    setSelectedCompany(company)
    setReportsDialogOpen(true)
    loadReports(company.id)
  }

  // Generate report
  const generateReport = async () => {
    if (!selectedCompany) return
    setGeneratingReport(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          period: 'last_30_days',
        }),
      })
      const data = await res.json()
      if (res.ok && data.reportUrl) {
        window.open(data.reportUrl, '_blank')
        loadReports(selectedCompany.id) // Refresh list
      } else {
        alert(data.error || 'Failed to generate report')
      }
    } catch (error) {
      alert('Error generating report')
    } finally {
      setGeneratingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">Companies</h1>
            <p className="text-muted-foreground">Search and manage registered companies</p>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, domain..."
                className="pl-9"
                value={q}
                onChange={(e) => {
                  setOffset(0)
                  setQ(e.target.value)
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Min rating</label>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={5}
                value={minRating}
                onChange={(e) => {
                  setOffset(0)
                  setMinRating(Number(e.target.value))
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => {
                    setOffset(0)
                    setVerifiedOnly(e.target.checked)
                  }}
                />
                Verified only
              </label>
              <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top rated</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="distance">Nearest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mt-4" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logoUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No logo</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{c.name}</h3>
                        {c.verified && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                        {c.featured && <Badge>Featured</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        {(c.city || c.state || c.country) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[c.city, c.state, c.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {typeof c.distanceMiles === 'number' && (
                          <span>{c.distanceMiles.toFixed(1)} mi</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          {(c.averageRating ?? 0).toFixed(1)}{' '}
                          <span className="text-muted-foreground">({c.totalReviews ?? 0})</span>
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 justify-end">
                    <Button
                      variant={c.verified ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleVerify(c, !c.verified)}
                      disabled={verifying}
                    >
                      {c.verified ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverify
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAnalytics(c)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCompany(c)
                        setMessageDialogOpen(true)
                      }}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReports(c)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Reports
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <a href={`/companies/${c.slug || c.id}`} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {results.length} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!canPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!canNext}
                  onClick={() => setOffset((o) => o + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Analytics - {selectedCompany?.name}</DialogTitle>
            <DialogDescription>Performance metrics and insights</DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : analytics ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Jobs This Month</div>
                    <div className="text-2xl font-bold">{analytics.thisMonthJobs || 0}</div>
                    {analytics.jobGrowth !== undefined && (
                      <div className={`text-xs mt-1 ${analytics.jobGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.jobGrowth >= 0 ? '+' : ''}{analytics.jobGrowth}% vs last month
                      </div>
                    )}
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Monthly Spend</div>
                    <div className="text-2xl font-bold">${(analytics.thisMonthSpend || 0).toLocaleString()}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                    <div className="text-2xl font-bold">{(analytics.averageRating || 0).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {analytics.totalReviews || 0} reviews
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                    <div className="text-2xl font-bold">
                      {analytics.performance?.completionRate || 0}%
                    </div>
                  </Card>
                </div>
                {analytics.activityChart && analytics.activityChart.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Activity (Last 30 Days)</h3>
                    <div className="space-y-2">
                      {analytics.activityChart.slice(-7).map((day: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="text-sm w-20">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          <div className="flex-1 bg-muted rounded-full h-4 relative">
                            <div
                              className="bg-primary h-4 rounded-full"
                              style={{ width: `${Math.min((day.jobs / Math.max(...analytics.activityChart.map((d: any) => d.jobs))) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-sm w-12 text-right">{day.jobs}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="revenue" className="space-y-4 mt-4">
                {analytics.revenueAnalytics && analytics.revenueAnalytics.length > 0 ? (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Revenue (12 Months)</h3>
                    <div className="space-y-2">
                      {analytics.revenueAnalytics.map((month: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="text-sm w-24">{month.month}</div>
                          <div className="flex-1 bg-muted rounded-full h-6 relative">
                            <div
                              className="bg-green-500 h-6 rounded-full"
                              style={{ width: `${Math.min((month.revenue / Math.max(...analytics.revenueAnalytics.map((m: any) => m.revenue))) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-sm w-24 text-right">${month.revenue.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No revenue data available</div>
                )}
                {analytics.customerLifetimeValue !== undefined && (
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Customer Lifetime Value (6 months)</div>
                    <div className="text-2xl font-bold">${analytics.customerLifetimeValue.toLocaleString()}</div>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="performance" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate (30d)</span>
                      <span className="font-semibold">{analytics.performance?.completionRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Jobs Per Day (30d)</span>
                      <span className="font-semibold">{analytics.performance?.avgJobsPerDay30d || 0}</span>
                    </div>
                    {analytics.churnPrediction && analytics.churnPrediction.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Churn Risk Customers</span>
                        <span className="font-semibold text-orange-600">{analytics.churnPrediction.length}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message - {selectedCompany?.name}</DialogTitle>
            <DialogDescription>Send an email or WhatsApp message to the company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Channel</Label>
              <Select value={messageChannel} onValueChange={(v: any) => setMessageChannel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {messageChannel === 'email' && (
              <div>
                <Label>Subject</Label>
                <Input
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Message subject"
                />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Enter your message..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendMessage} disabled={sending || !messageBody.trim()}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Reports - {selectedCompany?.name}</DialogTitle>
            <DialogDescription>View and generate reports for this company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={generateReport} disabled={generatingReport}>
                {generatingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate New Report
                  </>
                )}
              </Button>
            </div>
            {reportsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((report: any) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {report.period || 'Report'} - {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        {report.type && (
                          <div className="text-sm text-muted-foreground">{report.type}</div>
                        )}
                      </div>
                      {report.report_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.report_url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No reports available. Generate a new report to get started.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


