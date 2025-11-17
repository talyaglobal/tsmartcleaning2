import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

interface VerificationResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export async function GET(request: NextRequest) {
  const results: VerificationResult[] = []

  function logResult(
    step: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    details?: any
  ) {
    results.push({ step, status, message, details })
  }

  // Step 1: Check environment variables
  const requiredVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const optionalVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  let allRequiredPresent = true

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      logResult('Environment Variables', 'error', `Missing required variable: ${key}`)
      allRequiredPresent = false
    } else {
      const masked = key.includes('KEY')
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value
      logResult('Environment Variables', 'success', `${key} is set`, { value: masked })
    }
  }

  for (const [key, value] of Object.entries(optionalVars)) {
    if (!value) {
      logResult('Environment Variables', 'warning', `Optional variable not set: ${key}`)
    } else {
      const masked = key.includes('KEY')
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value
      logResult('Environment Variables', 'success', `${key} is set`, { value: masked })
    }
  }

  if (!allRequiredPresent) {
    return NextResponse.json(
      {
        success: false,
        message: 'Environment variables check failed',
        results,
      },
      { status: 400 }
    )
  }

  // Step 2: Test Supabase connection
  try {
    const supabase = createServerSupabase()
    logResult('Client Creation', 'success', 'Supabase client created successfully')

    // Test 1: Try to query services table
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .limit(1)

    if (servicesError) {
      // Try users table as fallback
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (usersError) {
        logResult('Database Query', 'error', 'Failed to query database tables', {
          servicesError: servicesError.message,
          usersError: usersError.message,
        })
      } else {
        logResult('Database Query', 'success', 'Successfully queried users table', {
          rowCount: usersData?.length || 0,
        })
      }
    } else {
      logResult('Database Query', 'success', 'Successfully queried services table', {
        rowCount: servicesData?.length || 0,
      })
    }

    // Test 2: Try a more complex query
    try {
      const { data: complexData, error: complexError } = await supabase
        .from('services')
        .select('id, name, description')
        .limit(5)

      if (complexError) {
        logResult('Complex Query', 'warning', 'Complex query test skipped', {
          error: complexError.message,
        })
      } else {
        logResult('Complex Query', 'success', 'Complex query executed successfully', {
          rowsReturned: complexData?.length || 0,
        })
      }
    } catch (err: any) {
      logResult('Complex Query', 'warning', 'Complex query test failed', {
        error: err.message,
      })
    }

    // Step 3: Verify table access
    const tablesToCheck = ['services', 'users', 'bookings', 'provider_profiles', 'addresses', 'reviews']
    const accessibleTables: string[] = []
    const inaccessibleTables: { table: string; error: string }[] = []

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('*').limit(0)

        if (error) {
          inaccessibleTables.push({ table, error: error.message })
          logResult('Table Access', 'warning', `Cannot access table: ${table}`, {
            error: error.message,
          })
        } else {
          accessibleTables.push(table)
          logResult('Table Access', 'success', `Can access table: ${table}`)
        }
      } catch (err: any) {
        inaccessibleTables.push({ table, error: err.message })
        logResult('Table Access', 'error', `Error checking table: ${table}`, {
          error: err.message,
        })
      }
    }

    if (accessibleTables.length > 0) {
      logResult('Table Access Summary', 'success', 
        `Successfully accessed ${accessibleTables.length}/${tablesToCheck.length} tables`,
        { accessibleTables }
      )
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const errorCount = results.filter((r) => r.status === 'error').length
    const warningCount = results.filter((r) => r.status === 'warning').length

    return NextResponse.json({
      success: errorCount === 0,
      summary: {
        success: successCount,
        warnings: warningCount,
        errors: errorCount,
      },
      results,
    })
  } catch (error: any) {
    logResult('Connection Test', 'error', 'Failed to create Supabase client or execute queries', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        results,
      },
      { status: 500 }
    )
  }
}

