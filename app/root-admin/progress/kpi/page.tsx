'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Calendar,
  Settings,
  Zap
} from 'lucide-react'
import { LineChart } from '@/components/admin/charts/LineChart'
import { RealtimeKPICard } from '@/components/admin/realtime/RealtimeKPICard'
import { AutoRefreshProvider, AutoRefreshConfigPanel, AutoRefreshable, useAutoRefreshContext } from '@/components/admin/realtime/AutoRefreshProvider'

interface KPIMetric {
  current: number
  target: number
  percentage: number
}

interface KPIData {
  companies: KPIMetric
  cleaners: KPIMetric
  revenue: KPIMetric
}

interface KPIAlert {
  type: 'ahead' | 'behind' | 'on_track' | 'target_reached'
  metric: 'companies' | 'cleaners' | 'revenue'
  message: string
  severity: 'success' | 'warning' | 'error' | 'info'
}

interface TrendData {
  month: string
  companies: number
  cleaners: number
  revenue: number
}

function KPIDashboardContent() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [alerts, setAlerts] = useState<KPIAlert[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [targets, setTargets] = useState({ companies: 5, cleaners: 25, revenue: 1850 })
  const [editingTargets, setEditingTargets] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    fetchKPIData()
    fetchTrends()
    fetchTargets()
  }, [])

  const fetchKPIData = async () => {
    try {
      const response = await fetch('/api/root-admin/progress/kpi')
      const data = await response.json()
      
      setKpis(data.kpis)
      setAlerts(data.alerts)
      setLastUpdated(data.lastUpdated)
    } catch (error) {
      console.error('Error fetching KPI data:', error)
    }
  }

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/root-admin/progress/kpi/trends?months=6')
      const data = await response.json()
      setTrends(data.trends)
    } catch (error) {
      console.error('Error fetching trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/root-admin/progress/kpi/targets')
      const data = await response.json()
      setTargets(data.targets)
    } catch (error) {
      console.error('Error fetching targets:', error)
    }
  }

  const updateTargets = async () => {
    try {
      const response = await fetch('/api/root-admin/progress/kpi/targets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets)
      })

      if (response.ok) {
        setEditingTargets(false)
        // Refresh KPI data to reflect new targets
        fetchKPIData()
      }
    } catch (error) {
      console.error('Error updating targets:', error)
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'companies': return Building2
      case 'cleaners': return Users
      case 'revenue': return DollarSign
      default: return Target
    }
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return CheckCircle2
    if (percentage >= 75) return TrendingUp
    if (percentage >= 50) return Target
    return AlertTriangle
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'success': return CheckCircle2
      case 'info': return TrendingUp
      case 'warning': return AlertTriangle
      default: return AlertTriangle
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Dashboard</h1>
          <p className="text-muted-foreground">Track progress against your business goals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated && formatDate(lastUpdated)}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              fetchKPIData()
              fetchTrends()
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const AlertIcon = getAlertIcon(alert.severity)
            return (
              <Card key={index} className={`border-l-4 ${
                alert.severity === 'success' ? 'border-l-green-500' : 
                alert.severity === 'warning' ? 'border-l-yellow-500' : 
                alert.severity === 'error' ? 'border-l-red-500' : 
                'border-l-blue-500'
              }`}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <AlertIcon className="h-5 w-5" />
                    <span>{alert.message}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real-time KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {kpis && Object.entries(kpis).map(([key, metric]) => (
              <AutoRefreshable
                key={key}
                id={`kpi-${key}`}
                refreshFn={() => fetchKPIData()}
              >
                <RealtimeKPICard
                  metric={key as 'companies' | 'cleaners' | 'revenue'}
                  title={key === 'revenue' ? 'Monthly Revenue' : key.charAt(0).toUpperCase() + key.slice(1)}
                  data={metric}
                  onUpdate={(newData) => {
                    setKpis(prev => prev ? { ...prev, [key]: newData } : null)
                  }}
                />
              </AutoRefreshable>
            ))}
          </div>

          {/* Auto-refresh config panel */}
          <AutoRefreshConfigPanel className="lg:col-span-1" />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {/* Companies Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Companies Growth
                </CardTitle>
                <CardDescription>Cumulative companies over time</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={trends}
                  xKey="month"
                  yKey="companies"
                  color="#2563eb"
                  height={200}
                />
              </CardContent>
            </Card>

            {/* Cleaners Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cleaners Growth
                </CardTitle>
                <CardDescription>Cumulative cleaners over time</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={trends}
                  xKey="month"
                  yKey="cleaners"
                  color="#059669"
                  height={200}
                />
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={trends}
                  xKey="month"
                  yKey="revenue"
                  color="#dc2626"
                  height={200}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="targets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                KPI Targets
              </CardTitle>
              <CardDescription>
                Configure your business goals and targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="companies-target">Companies Target</Label>
                  <Input
                    id="companies-target"
                    type="number"
                    value={targets.companies}
                    onChange={(e) => setTargets(prev => ({ ...prev, companies: parseInt(e.target.value) || 0 }))}
                    disabled={!editingTargets}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cleaners-target">Cleaners Target</Label>
                  <Input
                    id="cleaners-target"
                    type="number"
                    value={targets.cleaners}
                    onChange={(e) => setTargets(prev => ({ ...prev, cleaners: parseInt(e.target.value) || 0 }))}
                    disabled={!editingTargets}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-target">Monthly Revenue Target ($)</Label>
                  <Input
                    id="revenue-target"
                    type="number"
                    value={targets.revenue}
                    onChange={(e) => setTargets(prev => ({ ...prev, revenue: parseInt(e.target.value) || 0 }))}
                    disabled={!editingTargets}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {editingTargets ? (
                  <>
                    <Button onClick={updateTargets}>Save Changes</Button>
                    <Button variant="outline" onClick={() => {
                      setEditingTargets(false)
                      fetchTargets() // Reset to original values
                    }}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditingTargets(true)}>
                    Edit Targets
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function KPIDashboardPage() {
  return (
    <AutoRefreshProvider defaultConfig={{ interval: 30000, enabled: true }}>
      <KPIDashboardContent />
    </AutoRefreshProvider>
  )
}