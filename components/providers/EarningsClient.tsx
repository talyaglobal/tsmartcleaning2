'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface EarningsData {
  totalEarnings: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  transactions: any[]
  breakdown: {
    byService: { service: string; amount: number; count: number }[]
    byMonth: { month: string; amount: number; count: number }[]
  }
}

interface PayoutHistoryItem {
  jobId: string
  date: string
  totalCents: number
  providerCents: number
  platformFeeCents: number
  processingFeeCents: number
  stripeTransferId?: string
}

interface PayoutStatement {
  scope: { providerId?: string; companyId?: string }
  period: { start: string; end: string }
  items: PayoutHistoryItem[]
  summary: {
    count: number
    totalGrossCents: number
    totalProviderCents: number
    totalPlatformFeeCents: number
    totalProcessingFeeCents: number
  }
}

interface TaxDocument {
  year: number
  totalEarnings: number
  requiresForm1099: boolean
  available: boolean
}

interface EarningsClientProps {
  providerId: string
  userId: string
  initialData: EarningsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function EarningsClient({ providerId, userId, initialData }: EarningsClientProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [payoutHistory, setPayoutHistory] = useState<PayoutStatement | null>(null)
  const [taxDocuments, setTaxDocuments] = useState<TaxDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  })

  useEffect(() => {
    loadPayoutHistory()
    loadTaxDocuments()
  }, [providerId, dateRange])

  async function loadPayoutHistory() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        providerId,
        start: dateRange.start,
        end: dateRange.end
      })
      const res = await fetch(`/api/payouts/statements?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPayoutHistory(data)
      }
    } catch (error) {
      console.error('Failed to load payout history:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTaxDocuments() {
    try {
      const currentYear = new Date().getFullYear()
      const years = [currentYear, currentYear - 1, currentYear - 2]
      
      const documents = await Promise.all(
        years.map(async (year) => {
          try {
            const res = await fetch(`/api/provider/tax-documents?providerId=${providerId}&year=${year}`)
            if (res.ok) {
              const data = await res.json()
              return {
                year,
                totalEarnings: data.totalEarnings || 0,
                requiresForm1099: data.requiresForm1099 || false,
                available: true
              }
            }
          } catch (error) {
            console.error(`Failed to load tax document for ${year}:`, error)
          }
          return {
            year,
            totalEarnings: 0,
            requiresForm1099: false,
            available: false
          }
        })
      )
      setTaxDocuments(documents.filter(d => d.available))
    } catch (error) {
      console.error('Failed to load tax documents:', error)
    }
  }

  function handleExport(format: 'csv' | 'pdf') {
    if (!payoutHistory) return
    
    const params = new URLSearchParams({
      providerId,
      start: dateRange.start,
      end: dateRange.end,
      format
    })
    window.open(`/api/payouts/statements?${params.toString()}`, '_blank')
  }

  function handleExportTaxDocument(year: number) {
    window.open(`/api/provider/tax-documents?providerId=${providerId}&year=${year}&format=pdf`, '_blank')
  }

  const earningsChange = initialData.lastMonthEarnings > 0
    ? ((initialData.thisMonthEarnings - initialData.lastMonthEarnings) / initialData.lastMonthEarnings) * 100
    : 0

  const monthlyChartData = initialData.breakdown.byMonth.map(m => ({
    month: new Date(m.month).toLocaleDateString('en-US', { month: 'short' }),
    earnings: m.amount,
    jobs: m.count
  }))

  const serviceChartData = initialData.breakdown.byService.map(s => ({
    name: s.service || 'Other',
    value: s.amount,
    count: s.count
  }))

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="taxes">Tax Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">${initialData.totalEarnings.toFixed(2)}</div>
                <div className={`text-sm flex items-center gap-1 ${earningsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {earningsChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{Math.abs(earningsChange).toFixed(1)}% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${initialData.thisMonthEarnings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {initialData.transactions.filter(t => {
                    const date = new Date(t.date)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).length} transactions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">$0.00</div>
                <Button size="sm">Withdraw</Button>
              </CardContent>
            </Card>
          </div>

          {/* Earnings Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Over Time</CardTitle>
              <CardDescription>Monthly earnings trend</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      name="Earnings ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No earnings data available for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings by Service Type</CardTitle>
              <CardDescription>Breakdown of earnings by service category</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceChartData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={serviceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {serviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                <div className="space-y-4">
                  {initialData.breakdown.byService.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{service.service || 'Other'}</div>
                        <div className="text-sm text-muted-foreground">{service.count} jobs</div>
                      </div>
                      <div className="text-lg font-semibold">${service.amount.toFixed(2)}</div>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No service breakdown data available.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Earnings and job count by month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="earnings" fill="#0088FE" name="Earnings ($)" />
                    <Bar yAxisId="right" dataKey="jobs" fill="#00C49F" name="Jobs" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No monthly breakdown data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>View and export your payout statements</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={!payoutHistory}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    disabled={!payoutHistory}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading payout history...</div>
              ) : payoutHistory ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Jobs</div>
                      <div className="text-2xl font-bold">{payoutHistory.summary.count}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Earnings</div>
                      <div className="text-2xl font-bold">
                        ${(payoutHistory.summary.totalProviderCents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Platform Fees</div>
                      <div className="text-2xl font-bold">
                        ${(payoutHistory.summary.totalPlatformFeeCents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Processing Fees</div>
                      <div className="text-2xl font-bold">
                        ${(payoutHistory.summary.totalProcessingFeeCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Job ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Your Earnings</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Fees</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Transfer ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payoutHistory.items.map((item, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">
                              {new Date(item.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-xs">
                              {item.jobId.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-3 text-sm">
                              ${(item.totalCents / 100).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">
                              ${(item.providerCents / 100).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              ${((item.platformFeeCents + item.processingFeeCents) / 100).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-xs">
                              {item.stripeTransferId ? (
                                <span className="text-green-600">{item.stripeTransferId.slice(0, 12)}...</span>
                              ) : (
                                <span className="text-muted-foreground">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payout history available for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Download your tax forms and earnings summaries</CardDescription>
            </CardHeader>
            <CardContent>
              {taxDocuments.length > 0 ? (
                <div className="space-y-4">
                  {taxDocuments.map((doc) => (
                    <div 
                      key={doc.year} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold">Tax Year {doc.year}</div>
                          <div className="text-sm text-muted-foreground">
                            Total Earnings: ${doc.totalEarnings.toFixed(2)}
                          </div>
                          {doc.requiresForm1099 && (
                            <Badge variant="outline" className="mt-1">
                              1099 Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportTaxDocument(doc.year)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download 1099
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tax documents available yet. Tax documents are generated at the end of each tax year.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

