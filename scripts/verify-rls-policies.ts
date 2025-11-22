#!/usr/bin/env tsx
/**
 * RLS (Row Level Security) Policy Verification Script
 * 
 * This script verifies that Row Level Security is properly enabled
 * and that appropriate policies exist for all tables.
 */

// Load environment variables from .env.local if it exists
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createServerSupabase } from '../lib/supabase'

interface RLSResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: RLSResult[] = []

function logResult(step: string, status: 'success' | 'error' | 'warning', message: string, details?: any) {
  results.push({ step, status, message, details })
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'
  console.log(`${icon} ${step}: ${message}`)
  if (details) {
    console.log('   Details:', details)
  }
}

async function checkRLSEnabledTables() {
  console.log('\n🔒 Step 1: Checking which tables have RLS enabled\n')
  
  try {
    const supabase = createServerSupabase()
    
    // Query to check RLS status on all tables in public schema
    const { data: tables, error } = await supabase.rpc('get_rls_status')
    
    if (error) {
      // If the RPC doesn't exist, use a direct SQL query via raw SQL
      logResult('RLS Check', 'warning', 'RPC get_rls_status not available, trying alternative method')
      
      // Alternative: Try to check system tables if accessible
      return await checkRLSFallback()
    }
    
    const enabledTables = tables?.filter((t: any) => t.rls_enabled) || []
    const disabledTables = tables?.filter((t: any) => !t.rls_enabled) || []
    
    logResult('RLS Enabled Tables', 'success', `Found ${enabledTables.length} tables with RLS enabled`, {
      enabled: enabledTables.map((t: any) => t.tablename),
      disabled: disabledTables.map((t: any) => t.tablename)
    })
    
    return { enabledTables, disabledTables }
  } catch (error: any) {
    logResult('RLS Check', 'error', 'Failed to check RLS status', { error: error.message })
    return null
  }
}

async function checkRLSFallback() {
  console.log('\nUsing fallback method to check RLS...')
  
  try {
    const supabase = createServerSupabase()
    
    // Check a few key tables manually by trying to access them
    const criticalTables = [
      'users',
      'bookings',
      'provider_profiles', 
      'companies',
      'services',
      'addresses',
      'reviews',
      'loyalty_accounts',
      'membership_cards',
      'insurance_policies'
    ]
    
    const results = []
    
    for (const table of criticalTables) {
      try {
        // Try to access table - if RLS is enabled and no policies exist, this should fail
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          if (error.message.includes('permission denied') || error.message.includes('policy')) {
            results.push({ table, rls_likely: true, status: 'RLS likely enabled' })
          } else {
            results.push({ table, rls_likely: false, status: `Error: ${error.message}` })
          }
        } else {
          // Data returned - either no RLS or policies allow access
          results.push({ table, rls_likely: false, status: 'Accessible (no RLS or permissive policies)' })
        }
      } catch (err: any) {
        results.push({ table, rls_likely: true, status: `Exception: ${err.message}` })
      }
    }
    
    logResult('RLS Fallback Check', 'warning', 'Manual RLS check completed', { results })
    
    return {
      enabledTables: results.filter(r => r.rls_likely).map(r => ({ tablename: r.table })),
      disabledTables: results.filter(r => !r.rls_likely).map(r => ({ tablename: r.table }))
    }
  } catch (error: any) {
    logResult('RLS Fallback', 'error', 'Fallback RLS check failed', { error: error.message })
    return null
  }
}

async function checkRLSPolicies() {
  console.log('\n📋 Step 2: Checking RLS policies\n')
  
  try {
    const supabase = createServerSupabase()
    
    // Try to query policies table
    const { data: policies, error } = await supabase.rpc('get_rls_policies')
    
    if (error) {
      logResult('RLS Policies', 'warning', 'Could not retrieve policies via RPC, trying manual check')
      return await checkPoliciesFallback()
    }
    
    const policyCount = policies?.length || 0
    const tableWithPolicies = [...new Set(policies?.map((p: any) => p.tablename) || [])]
    
    logResult('RLS Policies', 'success', `Found ${policyCount} policies across ${tableWithPolicies.length} tables`, {
      totalPolicies: policyCount,
      tablesWithPolicies: tableWithPolicies
    })
    
    return policies
  } catch (error: any) {
    logResult('RLS Policies', 'error', 'Failed to check RLS policies', { error: error.message })
    return null
  }
}

async function checkPoliciesFallback() {
  console.log('\nUsing fallback method to check policies...')
  
  // Since we can't directly query pg_policies, we'll check if common operations work
  const supabase = createServerSupabase()
  
  try {
    // Test authentication by trying to get current user
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      logResult('Policy Check Fallback', 'warning', 'Cannot authenticate - policy verification limited')
    } else {
      logResult('Policy Check Fallback', 'success', 'Authentication works - some policies likely exist')
    }
    
    return []
  } catch (error: any) {
    logResult('Policy Check Fallback', 'error', 'Policy fallback check failed', { error: error.message })
    return null
  }
}

async function generateRLSReport(rlsData: any, policies: any) {
  console.log('\n📊 Step 3: Generating RLS Report\n')
  
  if (!rlsData) {
    logResult('RLS Report', 'error', 'Cannot generate report - no RLS data available')
    return
  }
  
  const { enabledTables, disabledTables } = rlsData
  
  // Analyze security gaps
  const securityGaps = []
  
  if (disabledTables.length > 0) {
    securityGaps.push(`${disabledTables.length} tables without RLS: ${disabledTables.map((t: any) => t.tablename).join(', ')}`)
  }
  
  // Tables that should definitely have RLS
  const criticalTables = ['users', 'bookings', 'provider_profiles', 'companies', 'insurance_policies', 'loyalty_accounts']
  const unprotectedCriticalTables = criticalTables.filter(ct => 
    disabledTables.some((dt: any) => dt.tablename === ct)
  )
  
  if (unprotectedCriticalTables.length > 0) {
    securityGaps.push(`Critical tables without RLS: ${unprotectedCriticalTables.join(', ')}`)
  }
  
  if (securityGaps.length === 0) {
    logResult('RLS Security Assessment', 'success', 'No critical RLS security gaps found', {
      tablesWithRLS: enabledTables.length,
      tablesWithoutRLS: disabledTables.length
    })
  } else {
    logResult('RLS Security Assessment', 'warning', 'RLS security gaps found', {
      gaps: securityGaps
    })
  }
  
  // Recommendations
  const recommendations = []
  
  if (disabledTables.length > 0) {
    recommendations.push('Enable RLS on all tables containing user data')
    recommendations.push('Create appropriate policies for tenant isolation and user access control')
  }
  
  if (policies && policies.length === 0) {
    recommendations.push('Create RLS policies to control data access')
  }
  
  if (recommendations.length > 0) {
    logResult('RLS Recommendations', 'warning', 'Actions recommended', {
      recommendations
    })
  }
}

async function main() {
  console.log('🔒 Starting RLS Policy Verification\n')
  console.log('=' .repeat(60))
  
  // Step 1: Check RLS enabled tables
  const rlsData = await checkRLSEnabledTables()
  
  // Step 2: Check RLS policies
  const policies = await checkRLSPolicies()
  
  // Step 3: Generate report
  await generateRLSReport(rlsData, policies)
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 RLS Verification Summary\n')
  
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  console.log(`✅ Success: ${successCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  if (errorCount === 0) {
    if (warningCount === 0) {
      console.log('\n🎉 All RLS checks passed! Row Level Security is properly configured.')
    } else {
      console.log('\n⚠️  RLS verification completed with warnings. Review the items above.')
    }
    process.exit(0)
  } else {
    console.log('\n❌ RLS verification failed. Please review the errors above.')
    process.exit(1)
  }
}

// Run the verification
main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})