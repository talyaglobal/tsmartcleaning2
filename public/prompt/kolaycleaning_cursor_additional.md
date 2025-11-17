---

**Continue with remaining phases in next response...**

---

### PHASE 5: LANDLORD/COMPANY REPORTING SYSTEM 📊

#### Step 5.1: PDF Report Generation
Create `lib/pdf-generator.ts`:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface ReportData {
  company: {
    name: string
    id: string
  }
  property?: {
    name: string
    address: string
  }
  period: {
    start: Date
    end: Date
  }
  jobs: Array<{
    id: string
    date: Date
    customer: string
    provider: string
    services: string[]
    duration: number
    cost: number
    photos: string[]
    notes: string
    rating?: number
  }>
  summary: {
    totalJobs: number
    totalHours: number
    totalCost: number
    averageRating: number
    topServices: string[]
  }
}

export async function generatePropertyReport(
  companyId: string, 
  propertyId?: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<string> {
  const supabase = createServerComponentClient({ cookies })
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  const end = endDate || new Date()

  // Fetch company info
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  // Fetch property info if specified
  let property = null
  if (propertyId) {
    const { data: propertyData } = await supabase
      .from('properties')
      .select('*, addresses(*)')
      .eq('id', propertyId)
      .single()
    property = propertyData
  }

  // Fetch jobs for the period
  let jobsQuery = supabase
    .from('jobs')
    .select(`
      *,
      profiles!jobs_customer_id_fkey(full_name),
      providers(profiles(full_name)),
      reviews(rating, comment)
    `)
    .eq('company_id', companyId)
    .gte('start_datetime', start.toISOString())
    .lte('start_datetime', end.toISOString())
    .eq('status', 'completed')

  if (propertyId) {
    jobsQuery = jobsQuery.eq('property_id', propertyId)
  }

  const { data: jobs } = await jobsQuery

  // Process job data
  const processedJobs = jobs?.map(job => ({
    id: job.id,
    date: new Date(job.start_datetime),
    customer: job.profiles?.full_name || 'Unknown',
    provider: job.providers?.profiles?.full_name || 'Unassigned',
    services: job.service_ids || [],
    duration: job.timesheets?.total_minutes || 0,
    cost: job.total_amount,
    photos: job.photos || [],
    notes: job.notes || '',
    rating: job.reviews?.[0]?.rating
  })) || []

  // Calculate summary
  const summary = {
    totalJobs: processedJobs.length,
    totalHours: processedJobs.reduce((sum, job) => sum + (job.duration / 60), 0),
    totalCost: processedJobs.reduce((sum, job) => sum + job.cost, 0),
    averageRating: processedJobs.filter(j => j.rating).reduce((sum, job) => sum + job.rating!, 0) / processedJobs.filter(j => j.rating).length || 0,
    topServices: [] // Calculate most used services
  }

  const reportData: ReportData = {
    company: { name: company.name, id: company.id },
    property: property ? {
      name: property.name,
      address: `${property.addresses.line1}, ${property.addresses.city}, ${property.addresses.state}`
    } : undefined,
    period: { start, end },
    jobs: processedJobs,
    summary
  }

  // Generate PDF (using a simple HTML to PDF approach)
  const pdfUrl = await createPDFReport(reportData)
  
  // Save report record
  const { data: report } = await supabase
    .from('reports')
    .insert({
      company_id: companyId,
      property_id: propertyId,
      pdf_url: pdfUrl,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      summary: summary
    })
    .select()
    .single()

  return pdfUrl
}

async function createPDFReport(data: ReportData): Promise<string> {
  // For MVP, we'll use a simple HTML template and convert to PDF
  // In production, use puppeteer or a PDF service like PDFShift
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Property Report - ${data.company.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .job { border-bottom: 1px solid #eee; padding: 15px 0; }
            .job:last-child { border-bottom: none; }
            .photos { display: flex; gap: 10px; margin-top: 10px; }
            .photo { width: 100px; height: 75px; object-fit: cover; border-radius: 3px; }
            .rating { color: #f59e0b; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Property Cleaning Report</h1>
            <p><strong>Company:</strong> ${data.company.name}</p>
            ${data.property ? `<p><strong>Property:</strong> ${data.property.name} - ${data.property.address}</p>` : ''}
            <p><strong>Period:</strong> ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <h2>Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div>
                    <p><strong>Total Cleanings:</strong> ${data.summary.totalJobs}</p>
                    <p><strong>Total Hours:</strong> ${data.summary.totalHours.toFixed(1)}</p>
                </div>
                <div>
                    <p><strong>Total Cost:</strong> ${data.summary.totalCost.toFixed(2)}</p>
                    <p><strong>Average Rating:</strong> ${data.summary.averageRating.toFixed(1)}/5 ⭐</p>
                </div>
            </div>
        </div>

        <h2>Detailed Job History</h2>
        ${data.jobs.map(job => `
            <div class="job">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3>${job.date.toLocaleDateString()} - ${job.date.toLocaleTimeString()}</h3>
                        <p><strong>Provider:</strong> ${job.provider}</p>
                        <p><strong>Services:</strong> ${job.services.join(', ')}</p>
                        <p><strong>Duration:</strong> ${(job.duration / 60).toFixed(1)} hours</p>
                        ${job.rating ? `<p class="rating">Rating: ${job.rating}/5 ⭐</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <p><strong>${job.cost.toFixed(2)}</strong></p>
                    </div>
                </div>
                ${job.notes ? `<p><strong>Notes:</strong> ${job.notes}</p>` : ''}
                ${job.photos.length > 0 ? `
                    <div class="photos">
                        ${job.photos.slice(0, 4).map(photo => `
                            <img src="${photo}" alt="Job photo" class="photo">
                        `).join('')}
                        ${job.photos.length > 4 ? `<p>+${job.photos.length - 4} more photos</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('')}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666;">
            <p>Generated by KolayCleaning - Professional Cleaning Services</p>
            <p>For questions about this report, contact your property manager.</p>
        </div>
    </body>
    </html>
  `

  // For MVP: Save HTML and return URL
  // In production: Use puppeteer to generate PDF
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const htmlUrl = await uploadReportHTML(htmlTemplate, reportId)
  
  return htmlUrl // Return HTML URL for now, PDF URL in production
}

async function uploadReportHTML(html: string, reportId: string): Promise<string> {
  // Upload to Supabase storage or your preferred file storage
  // For MVP, we'll simulate this
  return `https://your-storage.supabase.co/reports/${reportId}.html`
}
```

#### Step 5.2: Automated Report Scheduling
Create `lib/report-scheduler.ts`:

```typescript
export interface ReportSchedule {
  id: string
  companyId: string
  propertyId?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[] // Email addresses
  isActive: boolean
  nextRunAt: Date
}

export async function scheduleReport(schedule: Omit<ReportSchedule, 'id' | 'nextRunAt'>) {
  const supabase = createServerComponentClient({ cookies })
  
  const nextRunAt = calculateNextRun(schedule.frequency)
  
  const { data, error } = await supabase
    .from('report_schedules')
    .insert({
      ...schedule,
      next_run_at: nextRunAt.toISOString()
    })
    .select()
    .single()

  if (error) throw error
  
  return data
}

function calculateNextRun(frequency: string): Date {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly':
      const nextWeek = new Date(now)
      nextWeek.setDate(now.getDate() + 7)
      return nextWeek
    case 'monthly':
      const nextMonth = new Date(now)
      nextMonth.setMonth(now.getMonth() + 1)
      return nextMonth
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}

export async function processScheduledReports() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get all due reports
  const { data: schedules } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_at', new Date().toISOString())

  for (const schedule of schedules || []) {
    try {
      // Generate report
      const pdfUrl = await generatePropertyReport(
        schedule.company_id,
        schedule.property_id
      )
      
      // Send to recipients
      await sendReportEmail(schedule.recipients, pdfUrl, schedule)
      
      // Update next run time
      const nextRunAt = calculateNextRun(schedule.frequency)
      await supabase
        .from('report_schedules')
        .update({ next_run_at: nextRunAt.toISOString() })
        .eq('id', schedule.id)
        
    } catch (error) {
      console.error(`Failed to process scheduled report ${schedule.id}:`, error)
    }
  }
}

async function sendReportEmail(recipients: string[], pdfUrl: string, schedule: any) {
  // Send email with report attachment
  const emailContent = {
    to: recipients,
    subject: `Property Cleaning Report - ${new Date().toLocaleDateString()}`,
    html: `
      <h2>Your Property Cleaning Report is Ready</h2>
      <p>Please find your ${schedule.frequency} cleaning report attached.</p>
      <p><a href="${pdfUrl}">Download Report</a></p>
      <p>This report was automatically generated by KolayCleaning.</p>
    `
  }
  
  // Use your email service (SendGrid, etc.)
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailContent)
  })
}
```

#### Step 5.3: Company Dashboard with Reports
Create `components/company/CompanyDashboard.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Download, Mail, Settings, TrendingUp, Building, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export function CompanyDashboard({ companyId }: { companyId: string }) {
  const [company, setCompany] = useState(null)
  const [properties, setProperties] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanyData()
  }, [companyId])

  const fetchCompanyData = async () => {
    try {
      const [companyRes, propertiesRes, analyticsRes, reportsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/companies/${companyId}/properties`),
        fetch(`/api/companies/${companyId}/analytics`),
        fetch(`/api/companies/${companyId}/reports`)
      ])

      const [companyData, propertiesData, analyticsData, reportsData] = await Promise.all([
        companyRes.json(),
        propertiesRes.json(),
        analyticsRes.json(),
        reportsRes.json()
      ])

      setCompany(companyData)
      setProperties(propertiesData)
      setAnalytics(analyticsData)
      setReports(reportsData)
    } catch (error) {
      console.error('Error fetching company data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (propertyId?: string) => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          propertyId,
          period: 'last_30_days'
        })
      })
      
      const { reportUrl } = await response.json()
      window.open(reportUrl, '_blank')
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{company?.name}</h1>
          <p className="text-gray-600">{properties.length} properties managed</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => generateReport()}>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.propertyGrowth > 0 ? '+' : ''}{analytics?.propertyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Cleanings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.thisMonthJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.jobGrowth > 0 ? '+' : ''}{analytics?.jobGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.thisMonthSpend?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.spendGrowth > 0 ? '+' : ''}{analytics?.spendGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageRating?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">
              ⭐ From {analytics?.totalReviews || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cleaning Activity (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.activityChart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="jobs" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property, index) => (
                    <div key={property.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-gray-600">{property.address?.city}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{property.monthlyJobs || 0} cleanings</p>
                        <p className="text-sm text-gray-600">${property.monthlySpend || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Properties</h3>
            <Button>Add Property</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(property => (
              <Card key={property.id}>
                <CardHeader>
                  <CardTitle className="text-base">{property.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {property.address?.line1}, {property.address?.city}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>This month:</span>
                      <span className="font-semibold">{property.monthlyJobs || 0} cleanings</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Spend:</span>
                      <span className="font-semibold">${property.monthlySpend || 0}</span>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => generateReport(property.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reports & Documentation</h3>
            <div className="flex space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>Schedule Report</Button>
            </div>
          </div>

          <div className="space-y-4">
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-semibold">
                        {report.property_name || 'All Properties'} Report
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                        <span>{report.summary?.totalJobs || 0} cleanings</span>
                        <span>${report.summary?.totalCost?.toFixed(2) || 0} total</span>
                        <span>⭐ {report.summary?.averageRating?.toFixed(1) || 0}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {new Date(report.created_at).toLocaleDateString()}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.spendingChart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Most Requested Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topServices?.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">#{index + 1}</span>
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{service.count} bookings</p>
                        <p className="text-sm text-gray-600">{service.percentage}%</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No service data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

### PHASE 6: BULK MESSAGING & WHATSAPP SYSTEM 📱

#### Step 6.1: WhatsApp Integration Setup
Create `lib/whatsapp.ts`:

```typescript
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER! // Format: whatsapp:+1234567890

const client = twilio(accountSid, authToken)

export interface WhatsAppMessage {
  to: string // Format: whatsapp:+1234567890
  body: string
  mediaUrl?: string[]
}

export interface WhatsAppTemplate {
  name: string
  language: string
  components: Array<{
    type: string
    parameters: Array<{
      type: string
      text: string
    }>
  }>
}

export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<string> {
  try {
    const result = await client.messages.create({
      from: whatsappNumber,
      to: message.to,
      body: message.body,
      mediaUrl: message.mediaUrl
    })
    
    return result.sid
  } catch (error) {
    console.error('WhatsApp send error:', error)
    throw error
  }
}

export async function sendWhatsAppTemplate(
  to: string, 
  template: WhatsAppTemplate
): Promise<string> {
  try {
    const result = await client.messages.create({
      from: whatsappNumber,
      to: to,
      contentSid: template.name, // Pre-approved template SID
      contentVariables: JSON.stringify(template.components[0]?.parameters || {})
    })
    
    return result.sid
  } catch (error) {
    console.error('WhatsApp template send error:', error)
    throw error
  }
}

export async function sendBulkWhatsApp(
  messages: WhatsAppMessage[], 
  delayMs: number = 1000
): Promise<Array<{ success: boolean; messageId?: string; error?: string; recipient: string }>> {
  const results = []
  
  for (const message of messages) {
    try {
      const messageId = await sendWhatsAppMessage(message)
      results.push({ 
        success: true, 
        messageId, 
        recipient: message.to 
      })
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message, 
        recipient: message.to 
      })
    }
    
    // Rate limiting delay
    if (delayMs > 0 && messages.indexOf(message) < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

// WhatsApp webhook handler for incoming messages
export function handleWhatsAppWebhook(webhookData: any) {
  const { From, To, Body, MessageSid, MediaUrl0 } = webhookData
  
  // Process incoming WhatsApp message
  return {
    from: From,
    to: To,
    body: Body,
    messageId: MessageSid,
    mediaUrl: MediaUrl0,
    timestamp: new Date()
  }
}

// Pre-approved WhatsApp message templates
export const whatsappTemplates = {
  booking_confirmation: {
    name: 'booking_confirmation',
    language: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{customer_name}}' },
          { type: 'text', text: '{{service_date}}' },
          { type: 'text', text: '{{service_time}}' },
          { type: 'text', text: '{{provider_name}}' }
        ]
      }
    ]
  },
  payment_reminder: {
    name: 'payment_reminder',
    language: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{customer_name}}' },
          { type: 'text', text: '{{amount_due}}' },
          { type: 'text', text: '{{due_date}}' }
        ]
      }
    ]
  },
  service_reminder: {
    name: 'service_reminder',
    language: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{customer_name}}' },
          { type: 'text', text: '{{service_time}}' },
          { type: 'text', text: '{{provider_name}}' }
        ]
      }
    ]
  }
}
```

#### Step 6.2: Bulk Messaging Campaign Engine
Create `components/messaging/CampaignLauncher.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Mail, MessageSquare, Phone, Users, Send, Clock, CheckCircle, XCircle } from 'lucide-react'

interface CampaignProgress {
  sent: number
  delivered: number
  failed: number
  total: number
  status: 'preparing' | 'sending' | 'completed' | 'failed'
}

export function CampaignLauncher() {
  const [selectedChannel, setSelectedChannel] = useState('email')
  const [audienceSize, setAudienceSize] = useState(0)
  const [campaign, setCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    audienceFilter: {},
    scheduledAt: null
  })
  const [activeCampaigns, setActiveCampaigns] = useState([])
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null)

  const channels = [
    { id: 'email', name: 'Email', icon: Mail, limit: 10000 },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, limit: 1000 },
    { id: 'sms', name: 'SMS', icon: Phone, limit: 500 }
  ]

  const templates = {
    email: [
      {
        name: 'Welcome Series',
        subject: 'Welcome to KolayCleaning!',
        content: 'Hi {{name}}, welcome to our cleaning service...'
      },
      {
        name: 'Win-back Campaign',
        subject: 'We miss you! Special offer inside',
        content: 'Hi {{name}}, it\'s been a while since your last cleaning...'
      },
      {
        name: 'Seasonal Promotion',
        subject: '🍂 Fall Cleaning Special - 20% Off',
        content: 'Get your home ready for the season...'
      }
    ],
    whatsapp: [
      {
        name: 'Booking Reminder',
        content: 'Hi {{name}}! Your cleaning is scheduled for {{date}} at {{time}}. Your cleaner {{provider}} will arrive shortly. Reply STOP to opt out.'
      },
      {
        name: 'Payment Due',
        content: 'Hi {{name}}, your payment of ${{amount}} is due. Pay now: {{payment_link}}'
      }
    ],
    sms: [
      {
        name: 'Appointment Reminder',
        content: 'Reminder: Cleaning tomorrow at {{time}}. Provider: {{provider}}. Reply STOP to opt out.'
      }
    ]
  }

  useEffect(() => {
    fetchActiveCampaigns()
  }, [])

  const fetchActiveCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/active')
      if (response.ok) {
        const data = await response.json()
        setActiveCampaigns(data)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const previewAudience = async (filters: any) => {
    try {
      const response = await fetch('/api/campaigns/audience-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      const { count } = await response.json()
      setAudienceSize(count)
    } catch (error) {
      console.error('Error previewing audience:', error)
    }
  }

  const launchCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaign,
          channel: selectedChannel
        })
      })
      
      if (response.ok) {
        const { campaignId } = await response.json()
        
        // Start monitoring progress
        monitorCampaignProgress(campaignId)
        
        alert('Campaign launched successfully!')
      }
    } catch (error) {
      console.error('Error launching campaign:', error)
      alert('Failed to launch campaign. Please try again.')
    }
  }

  const monitorCampaignProgress = async (campaignId: string) => {
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/progress`)
        if (response.ok) {
          const progress = await response.json()
          setCampaignProgress(progress)
          
          if (progress.status === 'sending' && progress.sent < progress.total) {
            setTimeout(pollProgress, 2000) // Poll every 2 seconds
          }
        }
      } catch (error) {
        console.error('Error monitoring progress:', error)
      }
    }
    
    pollProgress()
  }

  const ChannelIcon = channels.find(c => c.id === selectedChannel)?.icon || Mail

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Campaign Manager</h1>
        <p className="text-gray-600">Create and manage bulk messaging campaigns</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="active">Active Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select Channel</label>
                <div className="grid grid-cols-3 gap-4">
                  {channels.map(channel => {
                    const Icon = channel.icon
                    return (
                      <div
                        key={channel.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedChannel === channel.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedChannel(channel.id)}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Icon className="w-8 h-8" />
                          <span className="font-medium">{channel.name}</span>
                          <span className="text-xs text-gray-500">
                            Up to {channel.limit.toLocaleString()} recipients
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name</label>
                  <Input
                    placeholder="Holiday Special Campaign"
                    value={campaign.name}
                    onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Template</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates[selectedChannel]?.map(template => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subject Line (Email only) */}
              {selectedChannel === 'email' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <Input
                    placeholder="🏠 Special Cleaning Offer Just for You!"
                    value={campaign.subject}
                    onChange={(e) => setCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium mb-2">Message Content</label>
                <Textarea
                  rows={8}
                  placeholder={
                    selectedChannel === 'whatsapp'
                      ? 'Hi {{name}}! We have a special offer for you...'
                      : selectedChannel === 'sms'
                      ? 'Hi {{name}}! Get 20% off your next cleaning. Book now: {{link}}'
                      : 'Hi {{name}}, We hope you\'re doing well...'
                  }
                  value={campaign.content}
                  onChange={(e) => setCampaign(prev => ({ ...prev, content: e.target.value }))}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Available variables: {{name}}, {{email}}, {{loyalty_tier}}, {{last_booking_date}}
                  {selectedChannel !== 'email' && ` (${campaign.content.length}/160 characters)`}
                </p>
              </div>

              {/* Audience Targeting */}
              <div>
                <label className="block text-sm font-medium mb-3">Target Audience</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="User Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="customers">Customers Only</SelectItem>
                      <SelectItem value="providers">Providers Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Loyalty Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input placeholder="ZIP Codes (comma separated)" />
                  <Input placeholder="Last booking (days ago)" type="number" />
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estimated audience size:</span>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      <Users className="w-4 h-4 mr-1" />
                      {audienceSize.toLocaleString()} recipients
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <label className="block text-sm font-medium mb-3">Schedule</label>
                <div className="flex space-x-4">
                  <Button variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </Button>
                  <Button variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule for Later
                  </Button>
                </div>
              </div>

              {/* Launch Campaign */}
              <div className="pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      Ready to send to {audienceSize.toLocaleString()} recipients via {selectedChannel}
                    </p>
                    <p className="text-xs text-gray-500">
                      Estimated cost: ${(audienceSize * (selectedChannel === 'sms' ? 0.0075 : selectedChannel === 'whatsapp' ? 0.005 : 0)).toFixed(2)}
                    </p>
                  </div>
                  <Button 
                    onClick={launchCampaign}
                    disabled={!campaign.name || !campaign.content || audienceSize === 0}
                    className="px-8"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Launch Campaign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Progress */}
          {campaignProgress && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Sending Progress</span>
                    <Badge variant={
                      campaignProgress.status === 'completed' ? 'default' :
                      campaignProgress.status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {campaignProgress.status}
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={(campaignProgress.sent / campaignProgress.total) * 100} 
                    className="w-full"
                  />
                  
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{campaignProgress.sent}</div>
                      <div className="text-sm text-gray-600">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{campaignProgress.delivered}</div>
                      <div className="text-sm text-gray-600">Delivered</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{campaignProgress.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{campaignProgress.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="space-y-4">
            {activeCampaigns.map(campaign => (
              <Card key={campaign.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      campaign.status === 'completed' ? 'bg-green-100 text-green-600' :
                      campaign.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {campaign.status === 'completed' ? <CheckCircle className="w-6 h-6" /> :
                       campaign.status === 'failed' ? <XCircle className="w-6 h-6" /> :
                       <Send className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">
                        {campaign.channel.toUpperCase()} • {campaign.recipient_count} recipients
                      </p>
                      <p className="text-xs text-gray-500">
                        Started {new Date(campaign.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      campaign.status === 'completed' ? 'default' :
                      campaign.status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {campaign.status}
                    </Badge>
                    <div className="mt-2 text-sm text-gray-600">
                      {campaign.results?.delivered || 0} delivered
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(templates).map(([channel, channelTemplates]) => (
              <Card key={channel}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChannelIcon className="w-5 h-5" />
                    <span>{channel.toUpperCase()} Templates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {channelTemplates.map(template => (
                      <div key={template.name} className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-1">{template.name}</h4>
                        {template.subject && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Subject:</strong> {template.subject}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {template.content.substring(0, 100)}...
                        </p>
                        <Button size="sm" variant="outline" className="mt-2 w-full">
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

### PHASE 7: REAL-TIME OPERATIONS DASHBOARD 🗺️

#### Step 7.1: Live Job Tracking Component
Create `components/operations/LiveDashboard.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Clock, User, Phone, Navigation, AlertCircle, CheckCircle } from 'lucide-react'

interface LiveJob {
  id: string
  customer: {
    name: string
    phone: string
    address: string
  }
  provider: {
    id: string
    name: string
    phone: string
    location?: { lat: number; lng: number }
    eta?: number
  } | null
  service: {
    name: string
    duration: number
    price: number
  }
  startTime: Date
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
  location: { lat: number; lng: number }
  notes?: string
  urgency: 'low' | 'medium' | 'high'
}

export function LiveDashboard() {
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([])
  const [providers, setProviders] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }) // NYC
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  useEffect(() => {
    fetchLiveJobs()
    fetchAvailableProviders()
    
    // Set up real-time updates
    const interval = setInterval(fetchLiveJobs, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [selectedDate])

  const fetchLiveJobs = async () => {
    try {
      const response = await fetch(`/api/operations/live-jobs?date=${selectedDate}`)
      if (response.ok) {
        const jobs = await response.json()
        setLiveJobs(jobs)
      }
    } catch (error) {
      console.error('Error fetching live jobs:', error)
    }
  }

  const fetchAvailableProviders = async () => {
    try {
      const response = await fetch('/api/providers/available')
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const assignProvider = async (jobId: string, providerId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      })
      
      if (response.ok) {
        fetchLiveJobs() // Refresh data
        alert('Provider assigned successfully!')
      }
    } catch (error) {
      console.error('Error assigning provider:', error)
      alert('Failed to assign provider')
    }
  }

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        fetchLiveJobs()
      }
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500'
      case 'en_route': return 'bg-yellow-500'
      case 'in_progress': return 'bg-green-500'
      case 'completed': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const unassignedJobs = liveJobs.filter(job => !job.provider)
  const inProgressJobs = liveJobs.filter(job => job.status === 'in_progress')
  const completedToday = liveJobs.filter(job => job.status === 'completed').length

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Operations Dashboard</h1>
            <p className="text-gray-600">Real-time job tracking and provider management</p>
          </div>
          <div className="flex space-x-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button variant="outline">
              <Navigation className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{liveJobs.length}</div>
            <p className="text-sm text-gray-600">Total Jobs Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{unassignedJobs.length}</div>
            <p className="text-sm text-gray-600">Unassigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{inProgressJobs.length}</div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{completedToday}</div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{providers.filter(p => p.isAvailable).length}</div>
            <p className="text-sm text-gray-600">Available Providers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned ({unassignedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* Google Maps Integration */}
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Google Maps integration would go here</p>
                  <p className="text-sm text-gray-500">
                    Showing {liveJobs.length} jobs and {providers.length} providers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {liveJobs.filter(job => ['scheduled', 'en_route', 'in_progress'].includes(job.status)).map(job => (
                    <div key={job.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{job.customer.name}</p>
                        <p className="text-xs text-gray-600">{job.startTime.toLocaleTimeString()}</p>
                      </div>
                      <Badge variant={getUrgencyColor(job.urgency)} className="text-xs">
                        {job.urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {providers.filter(provider => provider.isActive).map(provider => (
                    <div key={provider.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{provider.name}</p>
                        <p className="text-xs text-gray-600">
                          {provider.currentJob ? 'On job' : 'Available'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${provider.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {provider.eta && (
                          <span className="text-xs text-gray-600">{provider.eta}m</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    Auto-Assign Open Jobs
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Send Provider Updates
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Export Daily Report
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Emergency Dispatch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-4">
            {liveJobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(job.status)}`}></div>
                        <h3 className="font-semibold">{job.customer.name}</h3>
                        <Badge variant={getUrgencyColor(job.urgency)}>
                          {job.urgency} priority
                        </Badge>
                        <Badge variant="outline">
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Customer Info</p>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center space-x-1 mb-1">
                              <MapPin className="w-3 h-3" />
                              <span>{job.customer.address}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{job.customer.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Service Details</p>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center space-x-1 mb-1">
                              <Clock className="w-3 h-3" />
                              <span>{job.startTime.toLocaleTimeString()} ({job.service.duration}h)</span>
                            </div>
                            <div>${job.service.price} - {job.service.name}</div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Provider</p>
                          <div className="text-sm text-gray-600">
                            {job.provider ? (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <User className="w-3 h-3" />
                                  <span>{job.provider.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{job.provider.phone}</span>
                                </div>
                                {job.provider.eta && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    ETA: {job.provider.eta} minutes
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-red-600">Not assigned</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {job.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                          <p className="text-sm text-yellow-800">{job.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {!job.provider && (
                        <Select onValueChange={(providerId) => assignProvider(job.id, providerId)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Assign Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.filter(p => p.isAvailable).map(provider => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <div className="flex space-x-1">
                        {job.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateJobStatus(job.id, 'en_route')}
                          >
                            Start
                          </Button>
                        )}
                        {job.status === 'en_route' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateJobStatus(job.id, 'in_progress')}
                          >
                            Begin Service
                          </Button>
                        )}
                        {job.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateJobStatus(job.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(provider => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${provider.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span className={provider.isAvailable ? 'text-green-600' : 'text-red-600'}>
                        {provider.currentJob ? `On Job #${provider.currentJob}` : 'Available'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Jobs Today:</span>
                      <span>{provider.todayJobs || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rating:</span>
                      <span>⭐ {provider.rating || 0}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Location:</span>
                      <span className="text-gray-600">
                        {provider.location ? `${provider.location.distance}mi away` : 'Unknown'}
                      </span>
                    </div>
                    {provider.nextJob && (
                      <div className="flex justify-between text-sm">
                        <span>Next Job:</span>
                        <span className="text-blue-600">{provider.nextJob}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      Locate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unassigned Jobs ({unassignedJobs.length})</CardTitle>
                <Button onClick={() => {/* Auto-assign logic */}}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Auto-Assign All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unassignedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">All jobs assigned!</p>
                  <p className="text-gray-600">Great work keeping up with the demand.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unassignedJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{job.customer.name}</h3>
                          <Badge variant={getUrgencyColor(job.urgency)}>
                            {job.urgency}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{job.startTime.toLocaleTimeString()} - {job.service.name}</p>
                          <p>{job.customer.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select onValueChange={(providerId) => assignProvider(job.id, providerId)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.filter(p => p.isAvailable).map(provider => (
                              <SelectItem key={provider.id} value={provider.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{provider.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {provider.location?.distance}mi
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

### PHASE 8: STRIPE CONNECT PAYOUT SYSTEM 💳

#### Step 8.1: Provider Stripe Connect Onboarding
Create `components/providers/StripeOnboarding.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, CreditCard, DollarSign } from 'lucide-react'

interface StripeConnectStatus {
  hasAccount: boolean
  isVerified: boolean
  canReceivePayouts: boolean
  requiresAction: boolean
  actionUrl?: string
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirements?: string[]
}

export function StripeOnboarding({ providerId }: { providerId: string }) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const checkStripeStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/providers/${providerId}/stripe-status`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startStripeOnboarding = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/providers/${providerId}/stripe-onboard`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Error starting Stripe onboarding:', error)
      alert('Failed to start onboarding process')
    } finally {
      setLoading(false)
    }
  }

  const refreshStripeAccount = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/providers/${providerId}/stripe-refresh`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Error refreshing Stripe account:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = () => {
    if (!status) return 0
    if (status.payoutsEnabled) return 100
    if (status.detailsSubmitted) return 75
    if (status.hasAccount) return 50
    return 25
  }

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Checking...</Badge>
    if (status.payoutsEnabled) return <Badge variant="default">✓ Active</Badge>
    if (status.requiresAction) return <Badge variant="destructive">Action Required</Badge>
    if (status.hasAccount) return <Badge variant="secondary">In Progress</Badge>
    return <Badge variant="outline">Not Started</Badge>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-6 h-6" />
              <span>Payment Setup</span>
            </CardTitle>
            {getStatusBadge()}
          </div>
          <p className="text-gray-600">
            Set up your payment account to receive earnings from completed jobs.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-gray-600">{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
          </div>

          {/* Status Check */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={checkStripeStatus}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
          </div>

          {status && (
            <>
              {/* Status Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Stripe Account:</span>
                    <span className={status.hasAccount ? 'text-green-600' : 'text-red-600'}>
                      {status.hasAccount ? '✓ Created' : '✗ Not Created'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Details Submitted:</span>
                    <span className={status.detailsSubmitted ? 'text-green-600' : 'text-red-600'}>
                      {status.detailsSubmitted ? '✓ Complete' : '✗ Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Identity Verified:</span>
                    <span className={status.isVerified ? 'text-green-600' : 'text-red-600'}>
                      {status.isVerified ? '✓ Verified' : '✗ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payouts Enabled:</span>
                    <span className={status.payoutsEnabled ? 'text-green-600' : 'text-red-600'}>
                      {status.payoutsEnabled ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Required */}
              {status.requiresAction && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Action Required</h4>
                      <p className="text-yellow-700 mb-3">
                        Your account needs additional information to enable payouts.
                      </p>
                      {status.requirements && status.requirements.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-yellow-800">Missing Information:</p>
                          <ul className="text-sm text-yellow-700 list-disc list-inside">
                            {status.requirements.map((req, index) => (
                              <li key={index}>{req.replace(/_/g, ' ')}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button 
                        onClick={refreshStripeAccount}
                        disabled={loading}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Complete Setup
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {status.payoutsEnabled && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800">Payment Setup Complete!</h4>
                      <p className="text-green-700 mb-3">
                        Your account is ready to receive payments. Earnings will be automatically 
                        transferred to your bank account.
                      </p>
                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm">
                          <DollarSign className="w-4 h-4 mr-2" />
                          View Earnings
                        </Button>
                        <Button variant="outline" size="sm">
                          Payout Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial Setup */}
              {!status.hasAccount && (
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Ready to Get Paid?</h3>
                  <p className="text-gray-600 mb-4">
                    Start the quick setup process to begin receiving payments for your work.
                  </p>
                  <Button 
                    onClick={startStripeOnboarding}
                    disabled={loading}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? 'Starting Setup...' : 'Start Payment Setup'}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Information Panel */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">What You'll Need</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Government-issued ID (Driver's License or Passport)</li>
              <li>• Social Security Number or Tax ID</li>
              <li>• Bank account information for deposits</li>
              <li>• Business information (if applicable)</li>
              <li>• Phone number for verification</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              All information is securely handled by Stripe, our payment processor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Step 8.2: Payout Processing Logic
Create `lib/stripe-payouts.ts`:

```typescript
import Stripe from 'stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export interface PayoutConfig {
  platformFeePercentage: number
  providerPercentage: number
  processingFeeFixed: number // In cents
  minimumPayout: number // In cents
}

export const payoutConfig: PayoutConfig = {
  platformFeePercentage: 15, // 15% platform fee
  providerPercentage: 85,   // 85% to provider
  processingFeeFixed: 30,    // $0.30 processing fee
  minimumPayout: 2000       // $20 minimum payout
}

export async function createStripeConnectAccount(providerId: string, email: string) {
  const supabase = createServerComponentClient({ cookies })
  
  try {
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual'
    })

    // Save account ID to provider record
    const { error } = await supabase
      .from('providers')
      .update({
        payout_details: {
          stripe_account_id: account.id,
          created_at: new Date().toISOString()
        }
      })
      .eq('id', providerId)

    if (error) throw error

    return account
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    throw error
  }
}

export async function createOnboardingLink(stripeAccountId: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/provider/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/provider/stripe/success`,
      type: 'account_onboarding'
    })

    return accountLink.url
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    throw error
  }
}

export async function getStripeAccountStatus(stripeAccountId: string) {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    
    return {
      hasAccount: true,
      isVerified: account.details_submitted && account.charges_enabled,
      canReceivePayouts: account.payouts_enabled,
      requiresAction: account.requirements?.currently_due?.length > 0,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements?.currently_due || []
    }
  } catch (error) {
    console.error('Error getting Stripe account status:', error)
    return {
      hasAccount: false,
      isVerified: false,
      canReceivePayouts: false,
      requiresAction: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirements: []
    }
  }
}

export async function processJobPayout(jobId: string) {
  const supabase = createServerComponentClient({ cookies })
  
  try {
    // Get job details with provider info
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        providers (
          payout_details,
          profiles (full_name, email)
        )
      `)
      .eq('id', jobId)
      .eq('status', 'completed')
      .single()

    if (jobError || !job) {
      throw new Error('Job not found or not completed')
    }

    const provider = job.providers
    if (!provider?.payout_details?.stripe_account_id) {
      throw new Error('Provider does not have Stripe account setup')
    }

    // Calculate payout amounts
    const totalAmount = job.total_amount * 100 // Convert to cents
    const platformFee = Math.round(totalAmount * (payoutConfig.platformFeePercentage / 100))
    const providerAmount = totalAmount - platformFee - payoutConfig.processingFeeFixed

    if (providerAmount < payoutConfig.minimumPayout) {
      throw new Error(`Payout amount below minimum (${payoutConfig.minimumPayout / 100})`)
    }

    // Create transfer to provider
    const transfer = await stripe.transfers.create({
      amount: providerAmount,
      currency: 'usd',
      destination: provider.payout_details.stripe_account_id,
      description: `Payout for job #${job.id}`,
      metadata: {
        job_id: jobId,
        provider_id: provider.id,
        platform_fee: platformFee.toString(),
        processing_fee: payoutConfig.processingFeeFixed.toString()
      }
    })

    // Record payout in database
    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        job_id: jobId,
        provider_id: provider.id,
        stripe_transfer_id: transfer.id,
        amount: providerAmount,
        platform_fee: platformFee,
        processing_fee: payoutConfig.processingFeeFixed,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (payoutError) throw payoutError

    // Update job payout status
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        payout_processed: true,
        payout_amount: providerAmount,
        payout_date: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) throw updateError

    return {
      success: true,
      transferId: transfer.id,
      amount: providerAmount,
      platformFee: platformFee
    }
  } catch (error) {
    console.error('Error processing payout:', error)
    throw error
  }
}

export async function processBatchPayouts() {
  const supabase = createServerComponentClient({ cookies })
  
  try {
    // Get all completed jobs without payouts
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        providers (
          id,
          payout_details,
          profiles (full_name, email)
        )
      `)
      .eq('status', 'completed')
      .eq('payout_processed', false)
      .gte('end_datetime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (error || !jobs) {
      console.log('No jobs found for payout processing')
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

    for (const job of jobs) {
      try {
        await processJobPayout(job.id)
        processed++
        
        // Send payout notification to provider
        await sendPayoutNotification(job.providers.profiles.email, {
          amount: job.total_amount * payoutConfig.providerPercentage / 100,
          jobDate: job.start_datetime,
          transferId: job.id
        })
        
      } catch (error) {
        console.error(`Failed to process payout for job ${job.id}:`, error)
        failed++
      }
    }

    return { processed, failed }
  } catch (error) {
    console.error('Error in batch payout processing:', error)
    throw error
  }
}

async function sendPayoutNotification(email: string, payoutDetails: any) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Payment Processed - KolayCleaning',
        html: `
          <h2>Payment Processed Successfully</h2>
          <p>Your payment of ${(payoutDetails.amount / 100).toFixed(2)} has been processed and will arrive in your bank account within 1-2 business days.</p>
          <p><strong>Job Date:</strong> ${new Date(payoutDetails.jobDate).toLocaleDateString()}</p>
          <p><strong>Transfer ID:</strong> ${payoutDetails.transferId}</p>
          <p>Thank you for providing excellent cleaning services!</p>
        `
      })
    })
  } catch (error) {
    console.error('Error sending payout notification:', error)
  }
}

export async function getProviderEarnings(providerId: string, startDate?: Date, endDate?: Date) {
  const supabase = createServerComponentClient({ cookies })
  
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  const end = endDate || new Date()

  try {
    const { data: payouts, error } = await supabase
      .from('payouts')
      .select(`
        *,
        jobs (
          start_datetime,
          service_ids,
          total_amount
        )
      `)
      .eq('provider_id', providerId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalEarnings = payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0
    const totalJobs = payouts?.length || 0
    const averagePerJob = totalJobs > 0 ? totalEarnings / totalJobs : 0

    return {
      payouts: payouts || [],
      summary: {
        totalEarnings: totalEarnings / 100, // Convert back to dollars
        totalJobs,
        averagePerJob: averagePerJob / 100,
        period: { start, end }
      }
    }
  } catch (error) {
    console.error('Error getting provider earnings:', error)
    throw error
  }
}
```

---

### PHASE 9: USA-SPECIFIC FEATURES & COMPLIANCE 🇺🇸

#### Step 9.1: US Address Validation & Tax Logic
Create `lib/usa-compliance.ts`:

```typescript
export const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
}

// State sales tax rates (approximate - use tax API in production)
export const STATE_TAX_RATES = {
  'NY': 0.08875, // NYC combined rate
  'CA': 0.0725,  // Base rate
  'TX': 0.0625,  // Base rate
  'FL': 0.06,    // Base rate
  'NJ': 0.06625, // Base rate
  'PA': 0.06,    // Base rate
  'IL': 0.0625,  // Base rate
  'OH': 0.0575,  // Base rate
  'GA': 0.04,    // Base rate
  'NC': 0.0475,  // Base rate
  // Add more states as needed
}

export interface USAddress {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  county?: string
}

export function validateUSZipCode(zip: string): boolean {
  // US ZIP code patterns: 12345 or 12345-6789
  const zipRegex = /^(\d{5})(-\d{4})?$/
  return zipRegex.test(zip)
}

export function validateUSPhoneNumber(phone: string): boolean {
  // US phone number patterns
  const phoneRegex = /^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
  return phoneRegex.test(phone)
}

export function formatUSPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

export async function validateUSAddress(address: USAddress): Promise<{
  isValid: boolean
  formatted?: USAddress
  suggestions?: USAddress[]
  error?: string
}> {
  // Basic validation
  if (!address.line1 || !address.city || !address.state || !address.zip) {
    return { isValid: false, error: 'Missing required address fields' }
  }

  if (!US_STATES[address.state.toUpperCase()]) {
    return { isValid: false, error: 'Invalid US state code' }
  }

  if (!validateUSZipCode(address.zip)) {
    return { isValid: false, error: 'Invalid ZIP code format' }
  }

  // In production, use USPS Address Validation API
  // For MVP, we'll do basic formatting
  const formatted: USAddress = {
    line1: address.line1.trim(),
    line2: address.line2?.trim(),
    city: address.city.trim().toUpperCase(),
    state: address.state.toUpperCase(),
    zip: address.zip.trim()
  }

  return { isValid: true, formatted }
}

export function calculateSalesTax(subtotal: number, state: string, city?: string): number {
  const stateCode = state.toUpperCase()
  const baseRate = STATE_TAX_RATES[stateCode] || 0

  // In production, use a tax calculation API like TaxJar or Avalara
  // This handles complex local tax rules
  
  // Simple city-specific adjustments for major cities
  let cityRate = 0
  if (city) {
    const cityName = city.toUpperCase()
    if (stateCode === 'NY' && cityName.includes('NEW YORK')) {
      cityRate = 0.01 // Additional NYC tax
    } else if (stateCode === 'CA' && cityName.includes('LOS ANGELES')) {
      cityRate = 0.015 // Additional LA tax
    }
    // Add more city-specific rates as needed
  }

  const totalRate = baseRate + cityRate
  return Math.round(subtotal * totalRate * 100) / 100
}

// 1099 contractor compliance helpers
export interface ContractorInfo {
  providerId: string
  taxId?: string // SSN or EIN
  businessName?: string
  annualEarnings: number
  requiresForm1099: boolean
}

export function requiresForm1099(annualEarnings: number): boolean {
  // IRS threshold for 1099-NEC forms
  return annualEarnings >= 600
}

export async function generateForm1099Data(providerId: string, year: number) {
  // In production, integrate with tax compliance service
  // This would generate 1099-NEC forms for contractors
  
  const supabase = createServerComponentClient({ cookies })
  
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  const { data: payouts } = await supabase
    .from('payouts')
    .select(`
      amount,
      created_at,
      providers (
        profiles (full_name, email),
        payout_details
      )
    `)
    .eq('provider_id', providerId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const totalEarnings = payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0

  return {
    providerId,
    year,
    totalEarnings: totalEarnings / 100, // Convert to dollars
    requiresForm1099: requiresForm1099(totalEarnings / 100),
    provider: payouts?.[0]?.providers
  }
}

// Time zone handling for multi-state operations
export const US_TIME_ZONES = {
  'ET': ['NY', 'FL', 'GA', 'NC', 'SC', 'VA', 'MD', 'DE', 'NJ', 'PA', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'],
  'CT': ['IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'MN', 'MS', 'MO', 'NE', 'ND', 'OK', 'SD', 'TN', 'TX', 'WI'],
  'MT': ['CO', 'MT', 'NM', 'UT', 'WY', 'AZ', 'ID'],
  'PT': ['CA', 'NV', 'OR', 'WA'],
  'AT': ['AK'],
  'HT': ['HI']
}

export function getStateTimeZone(state: string): string {
  const stateCode = state.toUpperCase()
  for (const [zone, states] of Object.entries(US_TIME_ZONES)) {
    if (states.includes(stateCode)) {
      return zone
    }
  }
  return 'ET' // Default to Eastern Time
}

export function convertToStateTime(utcDate: Date, state: string): Date {
  const timeZone = getStateTimeZone(state)
  const timeZoneMap = {
    'ET': 'America/New_York',
    'CT': 'America/Chicago', 
    'MT': 'America/Denver',
    'PT': 'America/Los_Angeles',
    'AT': 'America/Anchorage',
    'HT': 'Pacific/Honolulu'
  }
  
  return new Date(utcDate.toLocaleString('en-US', { 
    timeZone: timeZoneMap[timeZone] || 'America/New_York' 
  }))
}

// Service area validation
export function validateServiceArea(zipCode: string): boolean {
  // Define service areas by ZIP code ranges or specific codes
  // This is a simplified example - in production use geofencing
  
  const serviceZipCodes = [
    // New York City area
    /^1[0-2]\d{3}$/,
    // Los Angeles area  
    /^9[0-1]\d{3}$/,
    // Chicago area
    /^60[0-6]\d{2}$/,
    // Add more service areas
  ]
  
  return serviceZipCodes.some(pattern => pattern.test(zipCode))
}

// Business license validation (state-specific)
export interface BusinessLicense {
  state: string
  licenseNumber?: string
  businessName?: string
  expirationDate?: Date
  isValid: boolean
  requiresLicense: boolean
}

export function getBusinessLicenseRequirements(state: string): {
  requiresLicense: boolean
  licenseType?: string
  authority?: string
  website?: string
} {
  const stateCode = state.toUpperCase()
  
  // State-specific business license requirements for cleaning services
  const requirements = {
    'CA': {
      requiresLicense: true,
      licenseType: 'Business License',
      authority: 'Local City/County',
      website: 'https://www.calgold.ca.gov/'
    },
    'NY': {
      requiresLicense: true,
      licenseType: 'Business License & DCA License (NYC)',
      authority: 'NYC Department of Consumer Affairs',
      website: 'https://www1.nyc.gov/nycbusiness/'
    },
    'TX': {
      requiresLicense: false, // No state-level requirement
      licenseType: 'Local permits may apply',
      authority: 'Local City/County'
    }
    // Add more states as needed
  }
  
  return requirements[stateCode] || { requiresLicense: false }
}
```

#### Step 9.2: US-Specific UI Components
Create `components/usa/USAddressForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react'
import { US_STATES, validateUSAddress, validateUSZipCode, validateUSPhoneNumber, formatUSPhoneNumber } from '@/lib/usa-compliance'

interface USAddressFormProps {
  onValidAddress: (address: any) => void
  initialAddress?: any
}

export function USAddressForm({ onValidAddress, initialAddress }: USAddressFormProps) {
  const [address, setAddress] = useState({
    line1: initialAddress?.line1 || '',
    line2: initialAddress?.line2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    zip: initialAddress?.zip || '',
    phone: initialAddress?.phone || ''
  })
  
  const [validation, setValidation] = useState({
    isValid: false,
    errors: {},
    suggestions: []
  })
  
  const [validating, setValidating] = useState(false)

  const validateAddress = async () => {
    setValidating(true)
    const errors = {}

    // Basic field validation
    if (!address.line1.trim()) errors.line1 = 'Street address is required'
    if (!address.city.trim()) errors.city = 'City is required'
    if (!address.state) errors.state = 'State is required'
    if (!address.zip.trim()) errors.zip = 'ZIP code is required'
    else if (!validateUSZipCode(address.zip)) errors.zip = 'Invalid ZIP code format'
    
    if (address.phone && !validateUSPhoneNumber(address.phone)) {
      errors.phone = 'Invalid US phone number'
    }

    if (Object.keys(errors).length === 0) {
      try {
        const result = await validateUSAddress({
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          zip: address.zip
        })
        
        if (result.isValid) {
          setValidation({ isValid: true, errors: {}, suggestions: [] })
          const formattedAddress = {
            ...result.formatted,
            phone: address.phone ? formatUSPhoneNumber(address.phone) : ''
          }
          onValidAddress(formattedAddress)
        } else {
          setValidation({ 
            isValid: false, 
            errors: { general: result.error },
            suggestions: result.suggestions || []
          })
        }
      } catch (error) {
        setValidation({ 
          isValid: false, 
          errors: { general: 'Address validation failed' },
          suggestions: []
        })
      }
    } else {
      setValidation({ isValid: false, errors, suggestions: [] })
    }
    
    setValidating(false)
  }

  const handleZipChange = (zip: string) => {
    setAddress(prev => ({ ...prev, zip }))
    
    // Auto-populate city/state for common ZIP codes (simplified)
    if (zip.length === 5) {
      const zipToLocation = {
        '10001': { city: 'New York', state: 'NY' },
        '90210': { city: 'Beverly Hills', state: 'CA' },
        '60601': { city: 'Chicago', state: 'IL' },
        // Add more common ZIP codes
      }
      
      const location = zipToLocation[zip]
      if (location) {
        setAddress(prev => ({ 
          ...prev, 
          city: location.city, 
          state: location.state 
        }))
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Service Address</span>
          {validation.isValid && <Badge variant="default" className="ml-2">✓ Verified</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Street Address *
          </label>
          <Input
            value={address.line1}
            onChange={(e) => setAddress(prev => ({ ...prev, line1: e.target.value }))}
            placeholder="123 Main Street"
            className={validation.errors.line1 ? 'border-red-500' : ''}
          />
          {validation.errors.line1 && (
            <p className="text-sm text-red-600 mt-1">{validation.errors.line1}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Apartment, Suite, etc. (optional)
          </label>
          <Input
            value={address.line2}
            onChange={(e) => setAddress(prev => ({ ...prev, line2: e.target.value }))}
            placeholder="Apt 4B, Suite 100, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">ZIP Code *</label>
            <Input
              value={address.zip}
              onChange={(e) => handleZipChange(e.target.value)}
              placeholder="12345"
              maxLength={10}
              className={validation.errors.zip ? 'border-red-500' : ''}
            />
            {validation.errors.zip && (
              <p className="text-sm text-red-600 mt-1">{validation.errors.zip}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <Input
              value={address.phone}
              onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              className={validation.errors.phone ? 'border-red-500' : ''}
            />
            {validation.errors.phone && (
              <p className="text-sm text-red-600 mt-1">{validation.errors.phone}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">City *</label>
            <Input
              value={address.city}
              onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
              placeholder="New York"
              className={validation.errors.city ? 'border-red-500' : ''}
            />
            {validation.errors.city && (
              <p className="text-sm text-red-600 mt-1">{validation.errors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State *</label>
            <Select 
              value={address.state} 
              onValueChange={(state) => setAddress(prev => ({ ...prev, state }))}
            >
              <SelectTrigger className={validation.errors.state ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(US_STATES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validation.errors.state && (
              <p className="text-sm text-red-600 mt-1">{validation.errors.state}</p>
            )}
          </div>
        </div>

        {/* Address Suggestions */}
        {validation.suggestions.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Did you mean:</p>
                <div className="mt-2 space-y-2">
                  {validation.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <p className="text-sm">
                        {suggestion.line1}, {suggestion.city}, {suggestion.state} {suggestion.zip}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setAddress(prev => ({ ...prev, ...suggestion }))}
                      >
                        Use This Address
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validation.errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{validation.errors.general}</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {validation.isValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">Address verified and ready for service!</p>
            </div>
          </div>
        )}

        <Button 
          onClick={validateAddress}
          disabled={validating}
          className="w-full"
        >
          {validating ? 'Validating Address...' : 'Validate Address'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

**This covers the major missing commercial features. The complete implementation includes Marketing Campaigns, Loyalty Programs, Complete Booking Flow, Job Board, Company Reporting, Bulk Messaging, Real-time Operations Dashboard, Stripe Connect Payouts, and USA-specific compliance features.**

**Ready for final implementation phases or would you like me to continue with the remaining features like PWA setup, Analytics integration, and final API documentation?**# KolayCleaning Missing Features Implementation - Cursor Prompt

You are an expert full-stack developer using Cursor IDE. Implement the missing critical features for KolayCleaning SaaS platform. This prompt builds on the existing Supabase foundation and adds the commercial engine features.

## IMPLEMENTATION SEQUENCE - FOLLOW STEP BY STEP

### PHASE 1: MARKETING & GROWTH SYSTEM 🚀

#### Step 1.1: Campaign Management Database Extensions
Add these tables to your existing Supabase schema:

```sql
-- Campaigns table
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp', 'meta_ads', 'google_ads')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')) DEFAULT 'draft',
  audience_filter JSONB NOT NULL, -- Segmentation rules
  template_id UUID,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  budget DECIMAL(10,2), -- For paid campaigns
  results JSONB DEFAULT '{}', -- Metrics: sent, delivered, opened, clicked, converted
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp')) NOT NULL,
  subject TEXT, -- For email
  content TEXT NOT NULL,
  variables TEXT[], -- Template variables like {{name}}, {{booking_date}}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount', 'free_addon')) NOT NULL,
  value DECIMAL(10,2), -- Percentage or amount
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_services UUID[], -- Service IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  referee_id UUID REFERENCES profiles(id),
  referral_code TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'rewarded')) DEFAULT 'pending',
  reward_amount DECIMAL(10,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Step 1.2: Campaign Management UI Components
Create `components/marketing/CampaignBuilder.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'

interface CampaignBuilderProps {
  onSave: (campaign: CampaignData) => Promise<void>
}

export function CampaignBuilder({ onSave }: CampaignBuilderProps) {
  const [campaign, setCampaign] = useState({
    name: '',
    type: 'email',
    audienceFilter: {},
    template: '',
    scheduledAt: null,
    budget: 0
  })

  const [audiencePreview, setAudiencePreview] = useState(0)

  const audienceFilters = [
    { key: 'role', label: 'User Type', options: ['customer', 'provider'] },
    { key: 'loyaltyTier', label: 'Loyalty Tier', options: ['basic', 'silver', 'gold', 'platinum'] },
    { key: 'lastBookingDays', label: 'Last Booking (days ago)', type: 'number' },
    { key: 'zipCodes', label: 'ZIP Codes', type: 'text' },
    { key: 'totalSpent', label: 'Total Spent ($)', type: 'number' }
  ]

  const generateAudiencePreview = async (filters: any) => {
    // API call to get audience count
    const response = await fetch('/api/campaigns/audience-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    })
    const { count } = await response.json()
    setAudiencePreview(count)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Create Marketing Campaign</h2>
        
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <Input
              value={campaign.name}
              onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Holiday Cleaning Special"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Channel</label>
            <Select value={campaign.type} onValueChange={(value) => setCampaign(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="meta_ads">Meta Ads</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Audience Builder */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Target Audience</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {audienceFilters.map(filter => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium mb-1">{filter.label}</label>
                  {filter.options ? (
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input type={filter.type} placeholder={`Enter ${filter.label}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => generateAudiencePreview(campaign.audienceFilter)}
              >
                Preview Audience
              </Button>
              <span className="text-sm text-gray-600">
                Estimated reach: <strong>{audiencePreview.toLocaleString()}</strong> users
              </span>
            </div>
          </div>
        </div>

        {/* Message Template */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Message Content</h3>
          {campaign.type === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject Line</label>
                <Input placeholder="🏠 Special Offer: 20% Off Your Next Cleaning!" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Content</label>
                <Textarea 
                  rows={8}
                  placeholder="Hi {{name}}, We've got an exclusive offer for you..."
                />
              </div>
            </div>
          )}
          
          {(campaign.type === 'sms' || campaign.type === 'whatsapp') && (
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea 
                rows={4}
                placeholder="Hi {{name}}! Ready for your next cleaning? Book now and save 20%: {{booking_link}}"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available variables: {{name}}, {{booking_link}}, {{loyalty_points}}
              </p>
            </div>
          )}

          {(campaign.type === 'meta_ads' || campaign.type === 'google_ads') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad Headline</label>
                <Input placeholder="Professional House Cleaning Services" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ad Description</label>
                <Textarea 
                  rows={3}
                  placeholder="Book trusted, vetted cleaners in your area. Same-day service available."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Daily Budget ($)</label>
                <Input type="number" min="10" placeholder="50" />
              </div>
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Schedule Campaign</h3>
          <div className="flex space-x-4">
            <Button variant="outline">Send Now</Button>
            <Button variant="outline">Schedule for Later</Button>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={() => onSave(campaign)}>Create Campaign</Button>
        </div>
      </div>
    </div>
  )
}
```

#### Step 1.3: Campaign API Routes
Create `app/api/campaigns/route.ts`:

```tsx
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaign = await request.json()
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // If scheduled for immediate send, trigger send process
    if (campaign.scheduledAt === null || new Date(campaign.scheduledAt) <= new Date()) {
      await triggerCampaignSend(data.id)
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function triggerCampaignSend(campaignId: string) {
  // Queue campaign for sending (implement with background jobs)
  // For now, we'll use a simple approach
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/campaigns/${campaignId}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  })
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(campaigns)
}
```

---

### PHASE 2: LOYALTY PROGRAM IMPLEMENTATION 🏆

#### Step 2.1: Loyalty Logic Implementation
Create `lib/loyalty.ts`:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface LoyaltyConfig {
  pointsPerDollar: number
  tierThresholds: {
    silver: number
    gold: number
    platinum: number
  }
  tierBenefits: {
    [key: string]: {
      discountPercentage: number
      priorityBooking: boolean
      freeAddOns: string[]
    }
  }
}

export const loyaltyConfig: LoyaltyConfig = {
  pointsPerDollar: 1,
  tierThresholds: {
    silver: 500,
    gold: 1500,
    platinum: 3000
  },
  tierBenefits: {
    basic: { discountPercentage: 0, priorityBooking: false, freeAddOns: [] },
    silver: { discountPercentage: 5, priorityBooking: true, freeAddOns: ['inside_oven'] },
    gold: { discountPercentage: 10, priorityBooking: true, freeAddOns: ['inside_oven', 'inside_fridge'] },
    platinum: { discountPercentage: 15, priorityBooking: true, freeAddOns: ['inside_oven', 'inside_fridge', 'organize_closets'] }
  }
}

export async function addLoyaltyPoints(userId: string, amount: number, reason: string) {
  const supabase = createServerComponentClient({ cookies })
  
  // Get current loyalty account
  const { data: account, error: fetchError } = await supabase
    .from('loyalty_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }
  
  const currentPoints = account?.points || 0
  const newPoints = currentPoints + Math.floor(amount * loyaltyConfig.pointsPerDollar)
  const newTier = calculateTier(newPoints)
  
  const earnedEntry = {
    amount: Math.floor(amount * loyaltyConfig.pointsPerDollar),
    reason,
    timestamp: new Date().toISOString()
  }
  
  const newEarnedHistory = [...(account?.earned_history || []), earnedEntry]
  
  if (account) {
    // Update existing account
    const { error: updateError } = await supabase
      .from('loyalty_accounts')
      .update({
        points: newPoints,
        tier: newTier,
        earned_history: newEarnedHistory,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (updateError) throw updateError
  } else {
    // Create new account
    const { error: createError } = await supabase
      .from('loyalty_accounts')
      .insert({
        user_id: userId,
        points: newPoints,
        tier: newTier,
        earned_history: newEarnedHistory
      })
    
    if (createError) throw createError
  }
  
  // Check for tier upgrade and send notification
  if (account && account.tier !== newTier) {
    await sendTierUpgradeNotification(userId, newTier)
  }
  
  return { points: newPoints, tier: newTier, earned: Math.floor(amount * loyaltyConfig.pointsPerDollar) }
}

export function calculateTier(points: number): string {
  if (points >= loyaltyConfig.tierThresholds.platinum) return 'platinum'
  if (points >= loyaltyConfig.tierThresholds.gold) return 'gold'
  if (points >= loyaltyConfig.tierThresholds.silver) return 'silver'
  return 'basic'
}

export async function redeemPoints(userId: string, pointsToRedeem: number, rewardType: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: account } = await supabase
    .from('loyalty_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!account || account.points < pointsToRedeem) {
    throw new Error('Insufficient points')
  }
  
  const newPoints = account.points - pointsToRedeem
  
  const { error } = await supabase
    .from('loyalty_accounts')
    .update({
      points: newPoints,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  if (error) throw error
  
  // Create redemption record (you might want a separate table for this)
  return { success: true, remainingPoints: newPoints }
}

async function sendTierUpgradeNotification(userId: string, newTier: string) {
  // Implement notification logic
  console.log(`User ${userId} upgraded to ${newTier} tier`)
}
```

#### Step 2.2: Loyalty Dashboard Component
Create `components/loyalty/LoyaltyDashboard.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, Gift, Crown } from 'lucide-react'

interface LoyaltyData {
  points: number
  tier: string
  earnedHistory: Array<{
    amount: number
    reason: string
    timestamp: string
  }>
}

export function LoyaltyDashboard({ userId }: { userId: string }) {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLoyaltyData()
  }, [userId])

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/loyalty/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(data)
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tierConfig = {
    basic: { name: 'Basic', color: 'gray', icon: Star, next: 500 },
    silver: { name: 'Silver', color: 'slate', icon: Star, next: 1500 },
    gold: { name: 'Gold', color: 'yellow', icon: Crown, next: 3000 },
    platinum: { name: 'Platinum', color: 'purple', icon: Crown, next: null }
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
  }

  const currentTier = tierConfig[loyaltyData?.tier || 'basic']
  const nextTierPoints = currentTier.next
  const progressPercent = nextTierPoints ? (loyaltyData?.points / nextTierPoints) * 100 : 100

  return (
    <div className="space-y-6">
      {/* Tier Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <currentTier.icon className="w-6 h-6" />
            <span>Loyalty Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge variant={currentTier.color as any} className="mb-2">
                {currentTier.name} Member
              </Badge>
              <p className="text-2xl font-bold">{loyaltyData?.points || 0} Points</p>
            </div>
            <div className="text-right">
              {nextTierPoints && (
                <p className="text-sm text-gray-600">
                  {nextTierPoints - (loyaltyData?.points || 0)} points to next tier
                </p>
              )}
            </div>
          </div>
          
          {nextTierPoints && (
            <div>
              <Progress value={progressPercent} className="mb-2" />
              <p className="text-sm text-gray-600">
                Progress to {tierConfig[Object.keys(tierConfig)[Object.keys(tierConfig).indexOf(loyaltyData?.tier || 'basic') + 1]]?.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {loyaltyData?.tier === 'basic' ? '0' : 
                 loyaltyData?.tier === 'silver' ? '5' :
                 loyaltyData?.tier === 'gold' ? '10' : '15'}%
              </div>
              <p className="text-sm text-gray-600">Discount on all services</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {['silver', 'gold', 'platinum'].includes(loyaltyData?.tier) ? '✓' : '✗'}
              </div>
              <p className="text-sm text-gray-600">Priority booking</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {loyaltyData?.tier === 'platinum' ? '3' :
                 loyaltyData?.tier === 'gold' ? '2' :
                 loyaltyData?.tier === 'silver' ? '1' : '0'}
              </div>
              <p className="text-sm text-gray-600">Free add-ons included</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loyaltyData?.earnedHistory?.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{entry.reason}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  +{entry.amount} points
                </Badge>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Marketplace */}
      <Card>
        <CardHeader>
          <CardTitle>Redeem Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">$5 Service Credit</h3>
                <Badge>500 pts</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">Apply to any cleaning service</p>
              <Button 
                size="sm" 
                disabled={!loyaltyData || loyaltyData.points < 500}
                className="w-full"
              >
                Redeem
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Free Deep Clean Add-on</h3>
                <Badge>1000 pts</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">Inside oven & fridge cleaning</p>
              <Button 
                size="sm" 
                disabled={!loyaltyData || loyaltyData.points < 1000}
                className="w-full"
              >
                Redeem
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### PHASE 3: COMPLETE BOOKING FUNNEL 📅

#### Step 3.1: Multi-Step Booking Component
Create `components/booking/BookingWizard.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Clock, DollarSign, Star } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BookingWizardProps {
  services: Service[]
  onComplete: (booking: BookingData) => void
}

export function BookingWizard({ services, onComplete }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [booking, setBooking] = useState({
    services: [],
    addOns: [],
    address: null,
    date: null,
    time: null,
    notes: '',
    pricing: { subtotal: 0, tax: 0, tip: 0, total: 0 }
  })
  
  const [availableSlots, setAvailableSlots] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)

  const steps = [
    { number: 1, title: 'Select Services', icon: Star },
    { number: 2, title: 'Choose Address', icon: MapPin },
    { number: 3, title: 'Pick Date & Time', icon: Clock },
    { number: 4, title: 'Review & Pay', icon: DollarSign }
  ]

  // Step 1: Service Selection
  const ServiceSelection = () => {
    const addOns = [
      { id: 'inside_oven', name: 'Inside Oven Cleaning', price: 25 },
      { id: 'inside_fridge', name: 'Inside Fridge Cleaning', price: 20 },
      { id: 'garage_organization', name: 'Garage Organization', price: 50 },
      { id: 'window_cleaning', name: 'Window Cleaning (Interior)', price: 30 }
    ]

    const calculatePricing = () => {
      const serviceTotal = booking.services.reduce((sum, serviceId) => {
        const service = services.find(s => s.id === serviceId)
        return sum + (service?.base_price || 0)
      }, 0)
      
      const addOnTotal = booking.addOns.reduce((sum, addOnId) => {
        const addOn = addOns.find(a => a.id === addOnId)
        return sum + (addOn?.price || 0)
      }, 0)
      
      const subtotal = serviceTotal + addOnTotal
      const tax = subtotal * 0.08875 // NYC tax rate
      const total = subtotal + tax + booking.pricing.tip
      
      setBooking(prev => ({
        ...prev,
        pricing: { ...prev.pricing, subtotal, tax, total }
      }))
    }

    useEffect(() => {
      calculatePricing()
    }, [booking.services, booking.addOns, booking.pricing.tip])

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Choose Your Cleaning Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <Card key={service.id} className={`cursor-pointer transition-all ${
                booking.services.includes(service.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{service.title}</CardTitle>
                    <span className="text-lg font-bold">${service.base_price}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{service.duration_minutes} min</span>
                    <Checkbox
                      checked={booking.services.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBooking(prev => ({ ...prev, services: [...prev.services, service.id] }))
                        } else {
                          setBooking(prev => ({ ...prev, services: prev.services.filter(id => id !== service.id) }))
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {booking.services.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Add Extra Services</h3>
            <div className="grid grid-cols-2 gap-3">
              {addOns.map(addOn => (
                <div key={addOn.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={booking.addOns.includes(addOn.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBooking(prev => ({ ...prev, addOns: [...prev.addOns, addOn.id] }))
                      } else {
                        setBooking(prev => ({ ...prev, addOns: prev.addOns.filter(id => id !== addOn.id) }))
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{addOn.name}</p>
                    <p className="text-sm text-gray-600">+${addOn.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {booking.services.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Pricing Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${booking.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${booking.pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-1">
                <span>Total</span>
                <span>${booking.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 2: Address Selection
  const AddressSelection = () => {
    const [newAddress, setNewAddress] = useState({
      label: '',
      line1: '',
      line2: '',
      city: '',
      state: 'NY',
      zip: ''
    })

    useEffect(() => {
      // Fetch user addresses
      fetchUserAddresses()
    }, [])

    const fetchUserAddresses = async () => {
      try {
        const response = await fetch('/api/addresses')
        if (response.ok) {
          const data = await response.json()
          setAddresses(data)
        }
      } catch (error) {
        console.error('Error fetching addresses:', error)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Service Address</h3>
          
          {addresses.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium">Saved Addresses</h4>
              {addresses.map(address => (
                <Card key={address.id} className={`cursor-pointer transition-all ${
                  booking.address?.id === address.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{address.label}</p>
                        <p className="text-sm text-gray-600">
                          {address.line1}, {address.city}, {address.state} {address.zip}
                        </p>
                      </div>
                      <Button
                        variant={booking.address?.id === address.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBooking(prev => ({ ...prev, address }))}
                      >
                        {booking.address?.id === address.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Add New Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Address Label (Home, Office, etc.)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                />
                <div /> {/* Spacer */}
              </div>
              
              <Input
                placeholder="Street Address"
                value={newAddress.line1}
                onChange={(e) => setNewAddress(prev => ({ ...prev, line1: e.target.value }))}
              />
              
              <Input
                placeholder="Apartment, Suite, etc. (optional)"
                value={newAddress.line2}
                onChange={(e) => setNewAddress(prev => ({ ...prev, line2: e.target.value }))}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                />
                <select
                  className="px-3 py-2 border rounded-md"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                >
                  <option value="NY">New York</option>
                  <option value="NJ">New Jersey</option>
                  <option value="CT">Connecticut</option>
                </select>
                <Input
                  placeholder="ZIP Code"
                  value={newAddress.zip}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, zip: e.target.value }))}
                />
              </div>
              
              <Button
                onClick={() => {
                  setBooking(prev => ({ ...prev, address: newAddress }))
                  setAddresses(prev => [...prev, { ...newAddress, id: Date.now() }])
                }}
                disabled={!newAddress.line1 || !newAddress.city || !newAddress.zip}
              >
                Use This Address
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Step 3: Date & Time Selection
  const DateTimeSelection = () => {
    const [selectedDate, setSelectedDate] = useState(null)
    
    useEffect(() => {
      if (selectedDate && booking.address) {
        fetchAvailableSlots(selectedDate, booking.address)
      }
    }, [selectedDate, booking.address])

    const fetchAvailableSlots = async (date, address) => {
      setLoading(true)
      try {
        const response = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: date.toISOString(),
            address,
            services: booking.services,
            duration: booking.services.reduce((total, serviceId) => {
              const service = services.find(s => s.id === serviceId)
              return total + (service?.duration_minutes || 0)
            }, 0)
          })
        })
        
        if (response.ok) {
          const slots = await response.json()
          setAvailableSlots(slots)
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Choose Date</h3>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date.getDay() === 0} // No Sundays
              className="rounded-md border"
            />
          </div>
        </div>

        {selectedDate && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Times</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Finding available slots...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {availableSlots.map(slot => (
                  <Button
                    key={slot.time}
                    variant={booking.time === slot.time ? "default" : "outline"}
                    onClick={() => setBooking(prev => ({ 
                      ...prev, 
                      date: selectedDate, 
                      time: slot.time 
                    }))}
                    className="h-16 flex flex-col"
                  >
                    <span className="font-semibold">{slot.time}</span>
                    <span className="text-xs">
                      {slot.provider ? `With ${slot.provider.name}` : 'Available'}
                    </span>
                  </Button>
                ))}
              </div>
            )}
            
            {!loading && availableSlots.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No available slots for this date.</p>
                <p className="text-sm text-gray-500">Please try another date.</p>
              </div>
            )}
          </div>
        )}

        {booking.date && booking.time && (
          <div>
            <h4 className="font-semibold mb-2">Add Special Notes</h4>
            <Textarea
              placeholder="Any special instructions for the cleaner? (pets, access instructions, focus areas, etc.)"
              value={booking.notes}
              onChange={(e) => setBooking(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        )}
      </div>
    )
  }

  // Step 4: Review & Payment
  const ReviewPayment = () => {
    const [tip, setTip] = useState(0)
    const [paymentProcessing, setPaymentProcessing] = useState(false)

    useEffect(() => {
      setBooking(prev => ({
        ...prev,
        pricing: { 
          ...prev.pricing, 
          tip, 
          total: prev.pricing.subtotal + prev.pricing.tax + tip 
        }
      }))
    }, [tip])

    const handlePayment = async () => {
      setPaymentProcessing(true)
      try {
        const stripe = await stripePromise
        
        // Create payment intent
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        })
        
        const { clientSecret, bookingId } = await response.json()
        
        const result = await stripe.confirmCardPayment(clientSecret)
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        
        // Complete booking
        onComplete({ ...booking, id: bookingId, paymentIntentId: result.paymentIntent.id })
      } catch (error) {
        console.error('Payment error:', error)
        alert('Payment failed. Please try again.')
      } finally {
        setPaymentProcessing(false)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
          
          {/* Service Summary */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Services Selected</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.services.map(serviceId => {
                const service = services.find(s => s.id === serviceId)
                return (
                  <div key={serviceId} className="flex justify-between py-2">
                    <span>{service?.title}</span>
                    <span>${service?.base_price}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Address & Time */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{booking.address?.line1}, {booking.address?.city}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{booking.date?.toLocaleDateString()} at {booking.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tip Selection */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Add Tip (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[0, 10, 15, 20].map(percentage => {
                  const amount = Math.round(booking.pricing.subtotal * (percentage / 100))
                  return (
                    <Button
                      key={percentage}
                      variant={tip === amount ? "default" : "outline"}
                      onClick={() => setTip(amount)}
                      className="text-sm"
                    >
                      {percentage === 0 ? 'No tip' : `${percentage}%`}
                      {percentage > 0 && <span className="block text-xs">${amount}</span>}
                    </Button>
                  )
                })}
              </div>
              <Input
                type="number"
                placeholder="Custom tip amount"
                value={tip || ''}
                onChange={(e) => setTip(Number(e.target.value) || 0)}
              />
            </CardContent>
          </Card>

          {/* Final Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${booking.pricing.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${booking.pricing.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${booking.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handlePayment}
          disabled={paymentProcessing}
          className="w-full h-12 text-lg"
        >
          {paymentProcessing ? 'Processing Payment...' : `Complete Booking - $${booking.pricing.total.toFixed(2)}`}
        </Button>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <ServiceSelection />
      case 2: return <AddressSelection />
      case 3: return <DateTimeSelection />
      case 4: return <ReviewPayment />
      default: return <ServiceSelection />
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return booking.services.length > 0
      case 2: return booking.address !== null
      case 3: return booking.date !== null && booking.time !== null
      case 4: return true
      default: return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.number 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              {currentStep > step.number ? '✓' : step.number}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 w-12 ${
                currentStep > step.number ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
          >
            Continue
          </Button>
        ) : null}
      </div>
    </div>
  )
}
```

---

### PHASE 4: PROVIDER JOB BOARD & APPLICATIONS 💼

#### Step 4.1: Open Jobs Board
Create `app/jobs/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Clock, DollarSign, Users, Filter } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function JobsBoard() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    location: '',
    date: '',
    minPay: '',
    maxDistance: '25'
  })

  useEffect(() => {
    if (profile?.role?.includes('cleaner')) {
      fetchOpenJobs()
    }
  }, [profile])

  useEffect(() => {
    applyFilters()
  }, [jobs, filters])

  const fetchOpenJobs = async () => {
    try {
      const response = await fetch('/api/jobs/open')
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...jobs]
    
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.address?.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        job.address?.zip.includes(filters.location)
      )
    }
    
    if (filters.minPay) {
      filtered = filtered.filter(job => job.estimated_pay >= Number(filters.minPay))
    }
    
    if (filters.date) {
      filtered = filtered.filter(job => 
        new Date(job.start_datetime).toDateString() === new Date(filters.date).toDateString()
      )
    }

    setFilteredJobs(filtered)
  }

  const applyForJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I am interested in this job and available at the requested time.'
        })
      })
      
      if (response.ok) {
        // Update local state to show application submitted
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, hasApplied: true }
            : job
        ))
        alert('Application submitted successfully!')
      }
    } catch (error) {
      console.error('Error applying for job:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  if (!profile?.role?.includes('cleaner')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">This page is only available to service providers.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Available Jobs</h1>
        <p className="text-gray-600">Find and apply for cleaning jobs in your area</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filter Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                placeholder="City or ZIP code"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Pay</label>
              <Input
                type="number"
                placeholder="$50"
                value={filters.minPay}
                onChange={(e) => setFilters(prev => ({ ...prev, minPay: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Distance</label>
              <Select 
                value={filters.maxDistance} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, maxDistance: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-64 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{job.services?.join(', ') || 'House Cleaning'}</CardTitle>
                  <Badge variant={job.urgency === 'high' ? 'destructive' : 'secondary'}>
                    {job.urgency || 'Standard'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Location */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{job.address?.city}, {job.address?.state}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {job.distance || '5.2'} mi
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(job.start_datetime).toLocaleDateString()} at{' '}
                      {new Date(job.start_datetime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>

                  {/* Estimated Pay */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-green-600">
                      ${job.estimated_pay || '75'} estimated
                    </span>
                  </div>

                  {/* Applicants */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{job.application_count || 0} applicants</span>
                  </div>

                  {/* Job Description */}
                  {job.notes && (
                    <p className="text-sm text-gray-700 border-t pt-2">
                      {job.notes.length > 100 
                        ? `${job.notes.substring(0, 100)}...` 
                        : job.notes
                      }
                    </p>
                  )}

                  {/* Requirements */}
                  <div className="flex flex-wrap gap-1">
                    {job.requirements?.map(req => (
                      <Badge key={req} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    )) || [
                      <Badge key="supplies" variant="outline" className="text-xs">
                        Supplies Included
                      </Badge>,
                      <Badge key="transport" variant="outline" className="text-xs">
                        Own Transportation
                      </Badge>
                    ]}
                  </div>

                  {/* Apply Button */}
                  <Button
                    className="w-full"
                    onClick={() => applyForJob(job.id)}
                    disabled={job.hasApplied}
                    variant={job.hasApplied ? "outline" : "default"}
                  >
                    {job.hasApplied ? 'Applied' : 'Apply for Job'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredJobs.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">No jobs match your current filters.</p>
            <Button onClick={() => setFilters({ location: '', date: '', minPay: '', maxDistance: '25' })}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

**Continue with remaining phases in next response...**