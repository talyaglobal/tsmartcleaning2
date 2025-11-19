#!/usr/bin/env tsx
/**
 * Monitoring and Logging Verification Script
 * 
 * This script verifies that all monitoring and logging systems are properly configured:
 * - Sentry error tracking
 * - Application logs
 * - Error alerts
 * - Uptime monitoring
 * - Performance metrics
 * - Database connection pool health
 * 
 * Usage: npm run verify:monitoring
 */

import { config } from 'dotenv'
import { createServerSupabase } from '../lib/supabase'
import { checkDatabaseHealth, getConnectionPoolMetrics } from '../lib/db-monitoring'

config({ path: '.env.local' })
config()

interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

const results: VerificationResult[] = []

function logResult(
  name: string,
  status: 'pass' | 'fail' | 'warning',
  message: string,
  details?: any
) {
  results.push({ name, status, message, details })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${name}: ${message}`)
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function verifySentryConfiguration() {
  console.log('\n📊 Verifying Sentry Configuration\n')
  
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (sentryDsn) {
    logResult(
      'Sentry DSN',
      'pass',
      'Sentry DSN is configured',
      { dsn: sentryDsn.substring(0, 30) + '...' }
    )
  } else {
    logResult(
      'Sentry DSN',
      'fail',
      'Sentry DSN is not configured. Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN environment variable.'
    )
  }

  // Check if Sentry config files exist
  const fs = await import('fs')
  const path = await import('path')
  
  const configFiles = [
    'sentry.client.config.ts',
    'sentry.server.config.ts',
    'sentry.edge.config.ts',
    'instrumentation.ts',
  ]
  
  for (const file of configFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      logResult(`Sentry Config: ${file}`, 'pass', 'File exists')
    } else {
      logResult(`Sentry Config: ${file}`, 'fail', 'File missing')
    }
  }
}

async function verifyApplicationLogs() {
  console.log('\n📝 Verifying Application Logs\n')
  
  // Check if logging library exists
  const fs = await import('fs')
  const path = await import('path')
  
  const loggingLibPath = path.join(process.cwd(), 'lib', 'logging.ts')
  if (fs.existsSync(loggingLibPath)) {
    logResult('Logging Library', 'pass', 'lib/logging.ts exists')
  } else {
    logResult('Logging Library', 'warning', 'lib/logging.ts not found (may use console.log)')
  }

  // Check Sentry log integration
  const sentryServerConfig = path.join(process.cwd(), 'sentry.server.config.ts')
  if (fs.existsSync(sentryServerConfig)) {
    const content = fs.readFileSync(sentryServerConfig, 'utf-8')
    if (content.includes('enableLogs: true')) {
      logResult('Sentry Log Integration', 'pass', 'Logs are enabled in Sentry')
    } else {
      logResult('Sentry Log Integration', 'warning', 'enableLogs may not be set to true')
    }
  }
}

async function verifyErrorAlerts() {
  console.log('\n🚨 Verifying Error Alerts\n')
  
  logResult(
    'Sentry Alert Configuration',
    'warning',
    'Manual verification required: Check Sentry dashboard for alert rules',
    {
      instructions: [
        '1. Go to https://talyaglobal.sentry.io/alerts/rules/',
        '2. Verify alert rules are configured for:',
        '   - Critical errors (logLevel:critical)',
        '   - Payment failures (category:payment)',
        '   - Authentication failures (category:authentication)',
        '   - Database errors (category:database)',
        '   - Security events (category:security)',
        '3. Ensure notification channels (email/Slack) are configured',
      ],
    }
  )
}

async function verifyUptimeMonitoring() {
  console.log('\n⏱️  Verifying Uptime Monitoring\n')
  
  try {
    // Check if health endpoint exists
    const fs = await import('fs')
    const path = await import('path')
    
    const healthEndpointPath = path.join(
      process.cwd(),
      'app',
      'api',
      'health',
      'route.ts'
    )
    
    if (fs.existsSync(healthEndpointPath)) {
      logResult('Health Check Endpoint', 'pass', '/api/health endpoint exists')
      
      // Try to call the health endpoint (if server is running)
      logResult(
        'Health Check Access',
        'warning',
        'Manual verification required: Test /api/health endpoint',
        {
          instructions: [
            '1. Start your development server: npm run dev',
            '2. Visit: http://localhost:3000/api/health',
            '3. Verify response includes status: "healthy"',
            '4. Set up uptime monitoring service (UptimeRobot, Pingdom, etc.)',
            '5. Configure to check: https://your-domain.com/api/health',
          ],
        }
      )
    } else {
      logResult('Health Check Endpoint', 'fail', '/api/health endpoint not found')
    }
  } catch (error: any) {
    logResult('Uptime Monitoring', 'error', `Error checking: ${error.message}`)
  }
}

async function verifyPerformanceMetrics() {
  console.log('\n⚡ Verifying Performance Metrics\n')
  
  // Check if performance monitoring tables exist
  try {
    const supabase = createServerSupabase()
    
    const tables = [
      'performance_metrics',
      'performance_baselines',
      'slow_queries',
      'api_metrics',
    ]
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (error && error.code === '42P01') {
        logResult(`Performance Table: ${table}`, 'fail', 'Table does not exist')
      } else if (error) {
        logResult(`Performance Table: ${table}`, 'warning', `Access issue: ${error.message}`)
      } else {
        logResult(`Performance Table: ${table}`, 'pass', 'Table exists and accessible')
      }
    }
  } catch (error: any) {
    logResult('Performance Metrics', 'error', `Error checking: ${error.message}`)
  }

  // Check if performance monitoring library exists
  const fs = await import('fs')
  const path = await import('path')
  
  const perfLibPath = path.join(process.cwd(), 'lib', 'performance.ts')
  if (fs.existsSync(perfLibPath)) {
    logResult('Performance Library', 'pass', 'lib/performance.ts exists')
  } else {
    logResult('Performance Library', 'warning', 'lib/performance.ts not found')
  }
}

async function verifyDatabaseConnectionPool() {
  console.log('\n🔌 Verifying Database Connection Pool\n')
  
  try {
    const health = await checkDatabaseHealth()
    
    logResult(
      'Database Health',
      health.status === 'healthy' ? 'pass' : 'warning',
      `Database status: ${health.status}`,
      {
        responseTime: `${health.responseTime.toFixed(2)}ms`,
        errorRate: `${health.errorRate.toFixed(2)}%`,
        slowQueries: health.slowQueries,
        connectionPoolStatus: health.connectionPoolStatus,
      }
    )

    const poolMetrics = getConnectionPoolMetrics()
    
    // Calculate active utilization (not total connections)
    const activeUtilization = poolMetrics.activeConnections / poolMetrics.maxConnections
    const isHealthy = activeUtilization < 0.8 && poolMetrics.waitingQueries === 0
    
    logResult(
      'Connection Pool Metrics',
      isHealthy ? 'pass' : 'warning',
      `Active connections: ${poolMetrics.activeConnections}/${poolMetrics.maxConnections} (${(activeUtilization * 100).toFixed(1)}% active)`,
      {
        activeConnections: poolMetrics.activeConnections,
        idleConnections: poolMetrics.idleConnections,
        totalConnections: poolMetrics.totalConnections,
        maxConnections: poolMetrics.maxConnections,
        waitingQueries: poolMetrics.waitingQueries,
        note: poolMetrics.idleConnections > 0 ? 'Pool has available connections' : 'Pool may be near capacity',
      }
    )

    // Test actual connection
    const supabase = createServerSupabase()
    const connectionStart = Date.now()
    const { error } = await supabase.from('services').select('id').limit(1)
    const connectionDuration = Date.now() - connectionStart
    
    if (!error) {
      logResult(
        'Database Connection Test',
        'pass',
        `Connection successful (${connectionDuration}ms)`
      )
    } else {
      logResult(
        'Database Connection Test',
        'fail',
        `Connection failed: ${error.message}`
      )
    }
  } catch (error: any) {
    logResult('Database Connection Pool', 'error', `Error checking: ${error.message}`)
  }
}

async function verifySentryDashboard() {
  console.log('\n📊 Verifying Sentry Dashboard Access\n')
  
  logResult(
    'Sentry Dashboard',
    'warning',
    'Manual verification required',
    {
      instructions: [
        '1. Go to: https://talyaglobal.sentry.io/issues/?project=4510388988018768',
        '2. Verify you can access the dashboard',
        '3. Check for recent errors in production',
        '4. Review error trends and patterns',
        '5. Verify no critical errors are present',
        '6. Check log aggregation is working (Discover tab)',
      ],
      dashboardUrl: 'https://talyaglobal.sentry.io/issues/?project=4510388988018768',
    }
  )
}

async function main() {
  console.log('🔍 Monitoring and Logging Verification')
  console.log('='.repeat(60))

  await verifySentryConfiguration()
  await verifyApplicationLogs()
  await verifyErrorAlerts()
  await verifyUptimeMonitoring()
  await verifyPerformanceMetrics()
  await verifyDatabaseConnectionPool()
  await verifySentryDashboard()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Verification Summary\n')

  const passCount = results.filter((r) => r.status === 'pass').length
  const failCount = results.filter((r) => r.status === 'fail').length
  const warningCount = results.filter((r) => r.status === 'warning').length

  console.log(`✅ Passed: ${passCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Failed: ${failCount}`)

  if (failCount === 0) {
    console.log('\n🎉 All critical checks passed!')
    console.log('\n⚠️  Note: Some items require manual verification (Sentry dashboard, alerts, uptime monitoring)')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Verification script failed:', error)
  process.exit(1)
})

