#!/usr/bin/env tsx
/**
 * Supabase Connection Verification Script
 * 
 * This script verifies:
 * 1. Environment variables are loaded
 * 2. Supabase connection works
 * 3. Database queries execute successfully
 */

// Load environment variables from .env.local if it exists
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createServerSupabase } from '../lib/supabase'

interface VerificationResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: VerificationResult[] = []

function logResult(step: string, status: 'success' | 'error' | 'warning', message: string, details?: any) {
  results.push({ step, status, message, details })
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'
  console.log(`${icon} ${step}: ${message}`)
  if (details) {
    console.log(`   Details:`, details)
  }
}

async function verifyEnvironmentVariables() {
  console.log('\n📋 Step 1: Checking Environment Variables\n')
  
  const requiredVars = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
  
  const optionalVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
  
  let allRequiredPresent = true
  
  // Check required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      logResult('Environment Variables', 'error', `Missing required variable: ${key}`)
      allRequiredPresent = false
    } else {
      // Mask sensitive values
      const masked = key.includes('KEY') 
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value
      logResult('Environment Variables', 'success', `${key} is set`, { value: masked })
    }
  }
  
  // Check optional variables
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
  
  return allRequiredPresent
}

async function verifySupabaseConnection() {
  console.log('\n🔌 Step 2: Testing Supabase Connection\n')
  
  try {
    const supabase = createServerSupabase()
    logResult('Client Creation', 'success', 'Supabase client created successfully')
    
    // Test 1: Check if we can connect by querying a system table
    const { data: healthCheck, error: healthError } = await supabase
      .from('services')
      .select('id')
      .limit(1)
    
    if (healthError) {
      // If services table doesn't exist, try another common table
      const { data: usersCheck, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (usersError) {
        logResult('Database Query', 'error', 'Failed to query database tables', {
          servicesError: healthError.message,
          usersError: usersError.message
        })
        return false
      } else {
        logResult('Database Query', 'success', 'Successfully queried users table', {
          rowCount: usersCheck?.length || 0
        })
      }
    } else {
      logResult('Database Query', 'success', 'Successfully queried services table', {
        rowCount: healthCheck?.length || 0
      })
    }
    
    // Test 2: Try to get database version or connection info
    const { data: versionData, error: versionError } = await supabase.rpc('version')
    
    if (versionError) {
      // RPC might not exist, that's okay - we'll try a simpler query
      logResult('Database Version', 'warning', 'Could not get database version (RPC may not exist)', {
        error: versionError.message
      })
    } else {
      logResult('Database Version', 'success', 'Database version retrieved', { version: versionData })
    }
    
    // Test 3: Test a more complex query with joins if possible
    try {
      const { data: complexData, error: complexError } = await supabase
        .from('services')
        .select('id, name, description')
        .limit(5)
      
      if (complexError) {
        logResult('Complex Query', 'warning', 'Complex query test skipped', {
          error: complexError.message
        })
      } else {
        logResult('Complex Query', 'success', 'Complex query executed successfully', {
          rowsReturned: complexData?.length || 0
        })
      }
    } catch (err: any) {
      logResult('Complex Query', 'warning', 'Complex query test failed', {
        error: err.message
      })
    }
    
    return true
  } catch (error: any) {
    logResult('Connection Test', 'error', 'Failed to create Supabase client or execute queries', {
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

async function verifyTableAccess() {
  console.log('\n📊 Step 3: Verifying Table Access\n')
  
  try {
    const supabase = createServerSupabase()
    
    // List of common tables to check
    const tablesToCheck = [
      'services',
      'users',
      'bookings',
      'provider_profiles',
      'addresses',
      'reviews'
    ]
    
    const accessibleTables: string[] = []
    const inaccessibleTables: { table: string; error: string }[] = []
    
    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(0) // Just check if we can access the table
        
        if (error) {
          inaccessibleTables.push({ table, error: error.message })
          logResult('Table Access', 'warning', `Cannot access table: ${table}`, {
            error: error.message
          })
        } else {
          accessibleTables.push(table)
          logResult('Table Access', 'success', `Can access table: ${table}`)
        }
      } catch (err: any) {
        inaccessibleTables.push({ table, error: err.message })
        logResult('Table Access', 'error', `Error checking table: ${table}`, {
          error: err.message
        })
      }
    }
    
    if (accessibleTables.length > 0) {
      logResult('Table Access Summary', 'success', 
        `Successfully accessed ${accessibleTables.length}/${tablesToCheck.length} tables`,
        { accessibleTables }
      )
    }
    
    return accessibleTables.length > 0
  } catch (error: any) {
    logResult('Table Access', 'error', 'Failed to verify table access', {
      error: error.message
    })
    return false
  }
}

async function main() {
  console.log('🚀 Starting Supabase Connection Verification\n')
  console.log('=' .repeat(60))
  
  // Step 1: Check environment variables
  const envOk = await verifyEnvironmentVariables()
  
  if (!envOk) {
    console.log('\n❌ Environment variables check failed. Please set required variables.')
    console.log('\nRequired variables:')
    console.log('  - SUPABASE_URL')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  // Step 2: Test connection
  const connectionOk = await verifySupabaseConnection()
  
  if (!connectionOk) {
    console.log('\n❌ Connection test failed. Please check your Supabase credentials.')
    process.exit(1)
  }
  
  // Step 3: Verify table access
  await verifyTableAccess()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Verification Summary\n')
  
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  console.log(`✅ Success: ${successCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  if (errorCount === 0) {
    console.log('\n🎉 All critical checks passed! Supabase connection is working.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.')
    process.exit(1)
  }
}

// Run the verification
main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

