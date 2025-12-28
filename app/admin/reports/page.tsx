'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  FileText,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'

type ReportType = 'revenue' | 'bookings' | 'users' | 'performance' | 'custom'
type ReportPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_12_months' | 'custom'
type ReportFormat = 'json' | 'csv' | 'pdf'

interface ReportTemplate {
  id: string
  name: string
  description: string
  reportType: string
  defaultPeriod: string
  defaultFilters: Record<string, any>
  isSystem: boolean
}

interface ReportSchedule {
  id: string
  report_type?: string
  frequency: string
  recipients: string[]
  next_run_at: string
  is_active: boolean
  created_at?: string
}

interface ReportAnalytics {
  totalReports: number
  reportsByType: Record<string, number>
  reportsByPeriod: {
    last7Days: number
    last30Days: number
    last90Days: number
    allTime: number
  }
  recentReports: Array<{
    id: string
    type: string
    title: string
    generatedAt: string
  }>
  scheduledReports: number
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('generate')
  const [reportType, setReportType] = useState<ReportType>('revenue')
  const [period, setPeriod] = useState<ReportPeriod>('last_30_days')
  const [format, setFormat] = useState<ReportFormat>('json')
  const [generating, setGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    loadTemplates()
    loadSchedules()
    loadAnalytics()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/reports/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadSchedules = async () => {
    try {
      const res = await fetch('/api/admin/reports/schedules')
      const data = await res.json()
      setSchedules(data.schedules || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load schedules:', error)
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/reports/analytics')
      const data = await res.json()
      setAnalytics(data.analytics || null)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    setGeneratedReport(null)
    try {
      const res = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          period,
          format,
        }),
      })

      if (format === 'csv') {
        // Handle CSV download
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setGenerating(false)
        return
      }

      const data = await res.json()
      setGeneratedReport(data)
      loadAnalytics() // Refresh analytics
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportReport = async (reportId: string, exportFormat: 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/download?format=${exportFormat}`)
      if (exportFormat === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await res.json()
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('Failed to export report:', error)
      alert('Failed to export report. Please try again.')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const res = await fetch(`/api/admin/reports/schedules?id=${scheduleId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        loadSchedules()
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      alert('Failed to delete schedule. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate, schedule, and export platform reports</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="schedules">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="analytics">Report Analytics</TabsTrigger>
          </TabsList>

          {/* Generate Report Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Generate New Report</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Report</SelectItem>
                      <SelectItem value="bookings">Bookings Report</SelectItem>
                      <SelectItem value="users">Users Report</SelectItem>
                      <SelectItem value="performance">Performance Report</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="period">Time Period</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateReport} 
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>

              {generatedReport && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-900">Report Generated Successfully</h3>
                      <p className="text-sm text-green-700">Report ID: {generatedReport.reportId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportReport(generatedReport.reportId, 'csv')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportReport(generatedReport.reportId, 'pdf')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                  {generatedReport.data && (
                    <div className="mt-4 text-sm">
                      <pre className="bg-white p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(generatedReport.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Report Templates</h2>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.isSystem && (
                          <Badge variant="secondary" className="mt-1">System</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReportType(template.reportType as ReportType)
                          setPeriod(template.defaultPeriod as ReportPeriod)
                          setActiveTab('generate')
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Scheduled Reports Tab */}
          <TabsContent value="schedules" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Scheduled Reports</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule New Report</DialogTitle>
                      <DialogDescription>
                        Set up automatic report generation and delivery
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Report Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue">Revenue Report</SelectItem>
                            <SelectItem value="bookings">Bookings Report</SelectItem>
                            <SelectItem value="users">Users Report</SelectItem>
                            <SelectItem value="performance">Performance Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Recipients (comma-separated emails)</Label>
                        <Input placeholder="email1@example.com, email2@example.com" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button>Create Schedule</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading schedules...</p>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No scheduled reports yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <Card key={schedule.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {schedule.report_type || 'Report'} - {schedule.frequency}
                            </h3>
                            {schedule.is_active ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Next run: {new Date(schedule.next_run_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Recipients: {schedule.recipients?.join(', ') || 'None'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics ? (
              <>
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Reports</div>
                    <div className="text-2xl font-bold">{analytics.totalReports}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Last 7 Days</div>
                    <div className="text-2xl font-bold">{analytics.reportsByPeriod.last7Days}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Last 30 Days</div>
                    <div className="text-2xl font-bold">{analytics.reportsByPeriod.last30Days}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Scheduled</div>
                    <div className="text-2xl font-bold">{analytics.scheduledReports}</div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Reports by Type</h2>
                  <div className="space-y-2">
                    {Object.entries(analytics.reportsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
                  <div className="space-y-2">
                    {analytics.recentReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(report.generatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportReport(report.id, 'csv')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Loading analytics...</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
