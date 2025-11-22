#!/usr/bin/env tsx

/**
 * Monitoring Dashboard Script
 * 
 * This script provides a comprehensive monitoring dashboard that aggregates
 * data from various monitoring systems and provides real-time insights.
 */

import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import * as dotenv from 'dotenv'
import { execSync } from 'child_process'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface DashboardMetrics {
  timestamp: string
  system: {
    uptime: string
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
  database: {
    connectionCount: number
    queryLatency: number
    errorRate: number
    activeTransactions: number
  }
  application: {
    errorRate: number
    responseTime: number
    throughput: number
    activeUsers: number
  }
  security: {
    authFailures: number
    suspiciousActivity: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  deployment: {
    lastDeployment: string
    deploymentStatus: 'success' | 'failed' | 'pending'
    buildTime: number
  }
}

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  message: string
  lastChecked: string
}

class MonitoringDashboard {
  private supabase
  private dashboardData: DashboardMetrics

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.dashboardData = this.initializeDashboard()
  }

  private initializeDashboard(): DashboardMetrics {
    return {
      timestamp: new Date().toISOString(),
      system: {
        uptime: '0s',
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0
      },
      database: {
        connectionCount: 0,
        queryLatency: 0,
        errorRate: 0,
        activeTransactions: 0
      },
      application: {
        errorRate: 0,
        responseTime: 0,
        throughput: 0,
        activeUsers: 0
      },
      security: {
        authFailures: 0,
        suspiciousActivity: 0,
        threatLevel: 'low'
      },
      deployment: {
        lastDeployment: 'unknown',
        deploymentStatus: 'success',
        buildTime: 0
      }
    }
  }

  async getSystemMetrics(): Promise<void> {
    console.log('📊 Collecting system metrics...')

    try {
      // Get system uptime
      const uptimeResult = execSync('uptime', { encoding: 'utf8' })
      const uptimeMatch = uptimeResult.match(/up\\s+(.+?),/)
      this.dashboardData.system.uptime = uptimeMatch ? uptimeMatch[1] : 'unknown'

      // Get memory usage (macOS/Linux compatible)
      try {
        const memResult = execSync('top -l 1 -s 0 | grep PhysMem', { encoding: 'utf8' })
        const memMatch = memResult.match(/(\\d+)M used/)
        this.dashboardData.system.memoryUsage = memMatch ? parseInt(memMatch[1]) : 0
      } catch {
        // Fallback for Linux
        try {
          const memInfo = execSync('cat /proc/meminfo | grep MemAvailable', { encoding: 'utf8' })
          const memMatch = memInfo.match(/(\\d+)/)
          this.dashboardData.system.memoryUsage = memMatch ? parseInt(memMatch[1]) / 1024 : 0
        } catch {
          this.dashboardData.system.memoryUsage = 0
        }
      }

      // Get CPU usage approximation
      try {
        const cpuResult = execSync('top -l 1 -s 0 | grep "CPU usage"', { encoding: 'utf8' })
        const cpuMatch = cpuResult.match(/(\\d+\\.\\d+)% user/)
        this.dashboardData.system.cpuUsage = cpuMatch ? parseFloat(cpuMatch[1]) : 0
      } catch {
        this.dashboardData.system.cpuUsage = 0
      }

      // Get disk usage
      try {
        const diskResult = execSync('df -h . | tail -1', { encoding: 'utf8' })
        const diskMatch = diskResult.match(/(\\d+)%/)
        this.dashboardData.system.diskUsage = diskMatch ? parseInt(diskMatch[1]) : 0
      } catch {
        this.dashboardData.system.diskUsage = 0
      }

    } catch (error) {
      console.warn('⚠️ Could not collect all system metrics:', error)
    }
  }

  async getDatabaseMetrics(): Promise<void> {
    console.log('🗄️ Collecting database metrics...')

    try {
      // Get database connection info
      const startTime = Date.now()
      const { data, error } = await this.supabase
        .from('information_schema.sessions')
        .select('count')
        .limit(1)

      const queryLatency = Date.now() - startTime
      this.dashboardData.database.queryLatency = queryLatency

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Database metrics collection limited:', error.message)
        this.dashboardData.database.errorRate = 1
      } else {
        this.dashboardData.database.errorRate = 0
      }

      // Get rough connection estimate
      this.dashboardData.database.connectionCount = data ? 1 : 0

      // Check for recent database errors
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: errorLogs } = await this.supabase
        .from('application_logs')
        .select('id')
        .gte('created_at', oneHourAgo)
        .eq('level', 'ERROR')
        .ilike('message', '%database%')

      this.dashboardData.database.errorRate = errorLogs?.length || 0

    } catch (error) {
      console.warn('⚠️ Database metrics collection failed:', error)
      this.dashboardData.database.errorRate = 100
    }
  }

  async getApplicationMetrics(): Promise<void> {
    console.log('🚀 Collecting application metrics...')

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Get error rate from logs
      const { data: errorLogs } = await this.supabase
        .from('application_logs')
        .select('id')
        .gte('created_at', oneHourAgo)
        .eq('level', 'ERROR')

      const { data: totalLogs } = await this.supabase
        .from('application_logs')
        .select('id')
        .gte('created_at', oneHourAgo)

      const totalLogCount = totalLogs?.length || 0
      const errorCount = errorLogs?.length || 0
      
      this.dashboardData.application.errorRate = totalLogCount > 0 ? 
        (errorCount / totalLogCount) * 100 : 0

      // Estimate response time from performance metrics
      const { data: perfLogs } = await this.supabase
        .from('performance_metrics')
        .select('response_time')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(100)

      if (perfLogs && perfLogs.length > 0) {
        const avgResponseTime = perfLogs.reduce((sum, log) => sum + (log.response_time || 0), 0) / perfLogs.length
        this.dashboardData.application.responseTime = Math.round(avgResponseTime)
      }

      // Estimate throughput
      this.dashboardData.application.throughput = totalLogCount

      // Estimate active users (rough approximation)
      const { data: userSessions } = await this.supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_activity', oneHourAgo)

      this.dashboardData.application.activeUsers = userSessions?.length || 0

    } catch (error) {
      console.warn('⚠️ Application metrics collection failed:', error)
    }
  }

  async getSecurityMetrics(): Promise<void> {
    console.log('🛡️ Collecting security metrics...')

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Get security events
      const { data: securityEvents } = await this.supabase
        .from('security_events')
        .select('type, severity')
        .gte('created_at', oneHourAgo)

      if (securityEvents) {
        this.dashboardData.security.authFailures = securityEvents
          .filter(event => event.type === 'auth_failure').length

        this.dashboardData.security.suspiciousActivity = securityEvents
          .filter(event => event.type === 'suspicious_activity').length

        // Determine threat level
        const criticalEvents = securityEvents.filter(event => event.severity === 'critical').length
        const highEvents = securityEvents.filter(event => event.severity === 'high').length
        
        if (criticalEvents > 0) {
          this.dashboardData.security.threatLevel = 'critical'
        } else if (highEvents > 2) {
          this.dashboardData.security.threatLevel = 'high'
        } else if (securityEvents.length > 5) {
          this.dashboardData.security.threatLevel = 'medium'
        } else {
          this.dashboardData.security.threatLevel = 'low'
        }
      }

    } catch (error) {
      console.warn('⚠️ Security metrics collection failed:', error)
    }
  }

  async getDeploymentMetrics(): Promise<void> {
    console.log('🚀 Collecting deployment metrics...')

    try {
      // Get last deployment info
      const { data: deployments } = await this.supabase
        .from('deployment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (deployments && deployments.length > 0) {
        const lastDeployment = deployments[0]
        this.dashboardData.deployment.lastDeployment = lastDeployment.created_at
        this.dashboardData.deployment.deploymentStatus = lastDeployment.status
        this.dashboardData.deployment.buildTime = lastDeployment.build_duration || 0
      }

    } catch (error) {
      console.warn('⚠️ Deployment metrics collection failed:', error)
    }
  }

  async performHealthChecks(): Promise<HealthCheckResult[]> {
    console.log('🏥 Performing health checks...')

    const healthChecks: HealthCheckResult[] = []
    const checks = [
      {
        name: 'Database',
        url: null,
        check: async () => {
          const start = Date.now()
          const { error } = await this.supabase.from('health_check').select('1').limit(1)
          const responseTime = Date.now() - start
          return {
            success: !error || error.code === 'PGRST116',
            responseTime,
            message: error ? error.message : 'Connection successful'
          }
        }
      },
      {
        name: 'Application',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        check: async () => {
          const start = Date.now()
          try {
            const response = await fetch(this.checks[1].url + '/api/health')
            const responseTime = Date.now() - start
            return {
              success: response.ok,
              responseTime,
              message: response.ok ? 'API responding' : `HTTP ${response.status}`
            }
          } catch (error) {
            return {
              success: false,
              responseTime: Date.now() - start,
              message: error instanceof Error ? error.message : 'Connection failed'
            }
          }
        }
      },
      {
        name: 'Sentry',
        url: 'https://sentry.io',
        check: async () => {
          const start = Date.now()
          try {
            // Test Sentry by sending a test event
            Sentry.captureMessage('Health check test', 'info')
            return {
              success: true,
              responseTime: Date.now() - start,
              message: 'Sentry responding'
            }
          } catch (error) {
            return {
              success: false,
              responseTime: Date.now() - start,
              message: 'Sentry connection failed'
            }
          }
        }
      }
    ]

    for (const check of checks) {
      try {
        const result = await check.check()
        healthChecks.push({
          service: check.name,
          status: result.success ? 'healthy' : 'unhealthy',
          responseTime: result.responseTime,
          message: result.message,
          lastChecked: new Date().toISOString()
        })
      } catch (error) {
        healthChecks.push({
          service: check.name,
          status: 'unhealthy',
          responseTime: 0,
          message: error instanceof Error ? error.message : 'Check failed',
          lastChecked: new Date().toISOString()
        })
      }
    }

    return healthChecks
  }

  private checks = [
    {
      name: 'Database',
      url: null
    },
    {
      name: 'Application', 
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    },
    {
      name: 'Sentry',
      url: 'https://sentry.io'
    }
  ]

  displayDashboard(): void {
    console.clear()
    console.log('╔══════════════════════════════════════════════════════════════════╗')
    console.log('║                    🖥️  MONITORING DASHBOARD                     ║')
    console.log('╠══════════════════════════════════════════════════════════════════╣')
    console.log(`║ Last Updated: ${this.dashboardData.timestamp}`)
    console.log('╠══════════════════════════════════════════════════════════════════╣')
    
    // System Metrics
    console.log('║ 🖥️  SYSTEM METRICS')
    console.log(`║   Uptime: ${this.dashboardData.system.uptime}`)
    console.log(`║   Memory: ${this.dashboardData.system.memoryUsage} MB`)
    console.log(`║   CPU: ${this.dashboardData.system.cpuUsage}%`)
    console.log(`║   Disk: ${this.dashboardData.system.diskUsage}%`)
    console.log('║')
    
    // Database Metrics
    console.log('║ 🗄️  DATABASE METRICS')
    console.log(`║   Query Latency: ${this.dashboardData.database.queryLatency}ms`)
    console.log(`║   Error Rate: ${this.dashboardData.database.errorRate}`)
    console.log(`║   Connections: ${this.dashboardData.database.connectionCount}`)
    console.log('║')
    
    // Application Metrics
    console.log('║ 🚀 APPLICATION METRICS')
    console.log(`║   Error Rate: ${this.dashboardData.application.errorRate.toFixed(2)}%`)
    console.log(`║   Response Time: ${this.dashboardData.application.responseTime}ms`)
    console.log(`║   Throughput: ${this.dashboardData.application.throughput} req/hr`)
    console.log(`║   Active Users: ${this.dashboardData.application.activeUsers}`)
    console.log('║')
    
    // Security Metrics
    const threatEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }
    console.log('║ 🛡️  SECURITY METRICS')
    console.log(`║   Threat Level: ${threatEmoji[this.dashboardData.security.threatLevel]} ${this.dashboardData.security.threatLevel.toUpperCase()}`)
    console.log(`║   Auth Failures: ${this.dashboardData.security.authFailures}`)
    console.log(`║   Suspicious Activity: ${this.dashboardData.security.suspiciousActivity}`)
    console.log('║')
    
    // Deployment Metrics
    const statusEmoji = {
      success: '✅',
      failed: '❌',
      pending: '⏳'
    }
    console.log('║ 🚀 DEPLOYMENT METRICS')
    console.log(`║   Last Deployment: ${this.dashboardData.deployment.lastDeployment}`)
    console.log(`║   Status: ${statusEmoji[this.dashboardData.deployment.deploymentStatus]} ${this.dashboardData.deployment.deploymentStatus}`)
    console.log(`║   Build Time: ${this.dashboardData.deployment.buildTime}s`)
    
    console.log('╚══════════════════════════════════════════════════════════════════╝')
  }

  async generateReport(): Promise<string> {
    const report = `
# Monitoring Report - ${new Date().toISOString()}

## System Health
- **Uptime**: ${this.dashboardData.system.uptime}
- **Memory Usage**: ${this.dashboardData.system.memoryUsage} MB
- **CPU Usage**: ${this.dashboardData.system.cpuUsage}%
- **Disk Usage**: ${this.dashboardData.system.diskUsage}%

## Database Performance
- **Query Latency**: ${this.dashboardData.database.queryLatency}ms
- **Error Rate**: ${this.dashboardData.database.errorRate}
- **Active Connections**: ${this.dashboardData.database.connectionCount}

## Application Metrics
- **Error Rate**: ${this.dashboardData.application.errorRate.toFixed(2)}%
- **Response Time**: ${this.dashboardData.application.responseTime}ms
- **Throughput**: ${this.dashboardData.application.throughput} requests/hour
- **Active Users**: ${this.dashboardData.application.activeUsers}

## Security Status
- **Threat Level**: ${this.dashboardData.security.threatLevel.toUpperCase()}
- **Authentication Failures**: ${this.dashboardData.security.authFailures}
- **Suspicious Activities**: ${this.dashboardData.security.suspiciousActivity}

## Deployment Status
- **Last Deployment**: ${this.dashboardData.deployment.lastDeployment}
- **Status**: ${this.dashboardData.deployment.deploymentStatus.toUpperCase()}
- **Build Time**: ${this.dashboardData.deployment.buildTime}s

---
*Generated by TSmartCleaning Monitoring System*
`
    return report
  }

  async collectAllMetrics(): Promise<void> {
    console.log('📊 Collecting comprehensive metrics...')
    
    await Promise.all([
      this.getSystemMetrics(),
      this.getDatabaseMetrics(),
      this.getApplicationMetrics(),
      this.getSecurityMetrics(),
      this.getDeploymentMetrics()
    ])

    this.dashboardData.timestamp = new Date().toISOString()
  }

  async runContinuousMonitoring(intervalSeconds: number = 60): Promise<void> {
    console.log(`🔄 Starting continuous monitoring (${intervalSeconds}s intervals)...`)
    
    while (true) {
      try {
        await this.collectAllMetrics()
        this.displayDashboard()
        
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000))
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error)
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000))
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'dashboard'

  try {
    const dashboard = new MonitoringDashboard()

    switch (command) {
      case 'dashboard':
      case 'show':
        await dashboard.collectAllMetrics()
        dashboard.displayDashboard()
        break

      case 'continuous':
      case 'watch':
        const interval = parseInt(args[1]) || 60
        await dashboard.runContinuousMonitoring(interval)
        break

      case 'health':
      case 'healthcheck':
        const healthChecks = await dashboard.performHealthChecks()
        console.log('🏥 Health Check Results:')
        healthChecks.forEach(check => {
          const statusEmoji = check.status === 'healthy' ? '✅' : 
                              check.status === 'degraded' ? '⚠️' : '❌'
          console.log(`   ${statusEmoji} ${check.service}: ${check.message} (${check.responseTime}ms)`)
        })
        break

      case 'report':
        await dashboard.collectAllMetrics()
        const report = await dashboard.generateReport()
        console.log(report)
        break

      default:
        console.log(`
🖥️  Monitoring Dashboard Commands:

  dashboard, show     - Show current dashboard
  continuous, watch   - Run continuous monitoring (default: 60s intervals)
  health, healthcheck - Perform health checks
  report             - Generate detailed report

Examples:
  npm run monitor:dashboard
  npm run monitor:dashboard continuous 30
  npm run monitor:dashboard health
`)
    }

  } catch (error) {
    console.error('❌ Monitoring dashboard failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export default MonitoringDashboard