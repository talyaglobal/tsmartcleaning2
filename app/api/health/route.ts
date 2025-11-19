import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { checkDatabaseHealth } from '@/lib/db-monitoring'

/**
 * GET /api/health
 * Health check endpoint for uptime monitoring
 * Returns system health status including database, API, and overall status
 * 
 * This endpoint is designed to be called by uptime monitoring services
 * (e.g., UptimeRobot, Pingdom, Vercel Health Checks)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; message: string; duration?: number }> = {}
  
  try {
    // 1. Database Health Check
    try {
      const dbHealthStart = Date.now()
      const dbHealth = await checkDatabaseHealth()
      const dbHealthDuration = Date.now() - dbHealthStart
      
      checks.database = {
        status: dbHealth.status === 'healthy' ? 'ok' : 'error',
        message: `Database ${dbHealth.status} (${dbHealth.responseTime.toFixed(2)}ms)`,
        duration: dbHealthDuration,
      }
    } catch (error: any) {
      checks.database = {
        status: 'error',
        message: `Database check failed: ${error.message}`,
      }
    }

    // 2. API Response Time Check
    const apiResponseTime = Date.now() - startTime
    checks.api = {
      status: apiResponseTime < 1000 ? 'ok' : 'error',
      message: `API responding (${apiResponseTime}ms)`,
      duration: apiResponseTime,
    }

    // 3. Environment Variables Check
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]
    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )
    
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'ok' : 'error',
      message: missingEnvVars.length === 0 
        ? 'All required environment variables set'
        : `Missing: ${missingEnvVars.join(', ')}`,
    }

    // 4. Database Connection Test
    try {
      const connectionStart = Date.now()
      const supabase = createServerSupabase()
      const { error } = await supabase.from('services').select('id').limit(1)
      const connectionDuration = Date.now() - connectionStart
      
      checks.connection = {
        status: !error ? 'ok' : 'error',
        message: error ? `Connection failed: ${error.message}` : 'Database connection active',
        duration: connectionDuration,
      }
    } catch (error: any) {
      checks.connection = {
        status: 'error',
        message: `Connection test failed: ${error.message}`,
      }
    }

    // Determine overall status
    const allChecksPassed = Object.values(checks).every(
      (check) => check.status === 'ok'
    )
    const overallStatus = allChecksPassed ? 'healthy' : 'unhealthy'

    const totalDuration = Date.now() - startTime

    // Return appropriate HTTP status
    const httpStatus = allChecksPassed ? 200 : 503

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        uptime: process.uptime(),
        duration: totalDuration,
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      },
      { status: httpStatus }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks,
      },
      { status: 503 }
    )
  }
}

