'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetric {
  id: string
  metric_name: string
  metric_type: string
  value_ms: number
  endpoint_path?: string
  status: 'ok' | 'warning' | 'critical'
  created_at: string
  metadata?: Record<string, any>
}

interface PerformanceSummary {
  period_days: number
  total_metrics: number
  health_score: number
  summary: Record<string, {
    count: number
    avg: number
    min: number
    max: number
    p50: number
    p75: number
    p95: number
    p99: number
    status_counts: {
      ok: number
      warning: number
      critical: number
    }
    threshold_met: Record<string, boolean | null>
  }>
  thresholds: Record<string, { target: number; warning: number; critical: number }>
}

interface PerformanceDashboardProps {
  initialMetrics?: PerformanceMetric[]
  initialSummary?: PerformanceSummary
}

export function PerformanceDashboard({ initialMetrics = [], initialSummary }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>(initialMetrics)
  const [summary, setSummary] = useState<PerformanceSummary | null>(initialSummary || null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadSummary()
  }, [days])

  async function loadSummary() {
    setLoading(true)
    try {
      const response = await fetch(`/api/performance/summary?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Failed to load performance summary:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatValue(metricName: string, value: number): string {
    if (metricName === 'CLS') {
      return value.toFixed(3)
    }
    return Math.round(value).toLocaleString()
  }

  function formatUnit(metricName: string): string {
    if (metricName === 'CLS') {
      return ''
    }
    return 'ms'
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      ok: 'default',
      warning: 'secondary',
      critical: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  function getHealthScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading performance metrics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Health Score</CardTitle>
          <CardDescription>Performance health based on all metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getHealthScoreColor(summary.health_score)}`}>
              {summary.health_score}
            </div>
            <div>
              <p className="text-sm text-gray-600">Out of 100</p>
              <p className="text-sm text-gray-500">
                Based on {summary.total_metrics} metrics over {summary.period_days} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>Google Core Web Vitals metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['LCP', 'INP', 'CLS'].map((metricName) => {
              const metric = summary.summary[metricName]
              if (!metric) return null

              const threshold = summary.thresholds[metricName.toLowerCase()]
              const isHealthy = metric.threshold_met[metricName.toLowerCase()] !== false

              return (
                <div key={metricName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{metricName}</h3>
                    {getStatusBadge(isHealthy ? 'ok' : 'warning')}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {formatValue(metricName, metric.avg)}
                      <span className="text-sm text-gray-500 ml-1">{formatUnit(metricName)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Target: {formatValue(metricName, threshold?.target || 0)}{formatUnit(metricName)}
                    </div>
                    <div className="text-xs text-gray-500">
                      P95: {formatValue(metricName, metric.p95)}{formatUnit(metricName)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle>API Response Times</CardTitle>
          <CardDescription>Backend API endpoint performance</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.summary['api_response_time'] ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-xl font-semibold">
                    {Math.round(summary.summary['api_response_time'].avg)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">P95</div>
                  <div className="text-xl font-semibold">
                    {Math.round(summary.summary['api_response_time'].p95)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">P99</div>
                  <div className="text-xl font-semibold">
                    {Math.round(summary.summary['api_response_time'].p99)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Target</div>
                  <div className="text-xl font-semibold">
                    {summary.thresholds.api_response_time?.target}ms
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {getStatusBadge('ok')}
                <span className="text-sm text-gray-600">
                  {summary.summary['api_response_time'].status_counts.ok} OK
                </span>
                {getStatusBadge('warning')}
                <span className="text-sm text-gray-600">
                  {summary.summary['api_response_time'].status_counts.warning} Warning
                </span>
                {getStatusBadge('critical')}
                <span className="text-sm text-gray-600">
                  {summary.summary['api_response_time'].status_counts.critical} Critical
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No API response time data available</p>
          )}
        </CardContent>
      </Card>

      {/* Page Load Times */}
      <Card>
        <CardHeader>
          <CardTitle>Page Load Times</CardTitle>
          <CardDescription>Frontend page load performance</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.summary['page_load_time'] ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-xl font-semibold">
                    {Math.round(summary.summary['page_load_time'].avg)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">P95</div>
                  <div className="text-xl font-semibold">
                    {Math.round(summary.summary['page_load_time'].p95)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Target</div>
                  <div className="text-xl font-semibold">
                    {summary.thresholds.page_load_time?.target}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  {getStatusBadge(
                    summary.summary['page_load_time'].status_counts.critical === 0 ? 'ok' : 'warning'
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No page load time data available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Metrics</CardTitle>
          <CardDescription>Latest performance measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Metric</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Endpoint</th>
                  <th className="text-left p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 20).map((metric) => (
                  <tr key={metric.id} className="border-b">
                    <td className="p-2 font-medium">{metric.metric_name}</td>
                    <td className="p-2 text-gray-600">{metric.metric_type}</td>
                    <td className="p-2 text-right">
                      {formatValue(metric.metric_name, metric.value_ms)}
                      {formatUnit(metric.metric_name)}
                    </td>
                    <td className="p-2">{getStatusBadge(metric.status)}</td>
                    <td className="p-2 text-gray-600 text-xs">
                      {metric.endpoint_path || '-'}
                    </td>
                    <td className="p-2 text-gray-500 text-xs">
                      {new Date(metric.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

