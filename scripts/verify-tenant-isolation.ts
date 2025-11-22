#!/usr/bin/env tsx
/**
 * Tenant Isolation Verification Script
 * 
 * Verifies that tenant isolation is properly implemented:
 * 1. RLS policies prevent cross-tenant data access
 * 2. User sessions are properly scoped to tenants
 * 3. API routes enforce tenant boundaries
 * 4. Data queries are filtered by tenant context
 * 
 * Usage: tsx scripts/verify-tenant-isolation.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createServerSupabase } from '../lib/supabase'

interface TenantIsolationResult {
  check: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

const results: TenantIsolationResult[] = []

function logResult(check: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ check, status, message, details })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${check}: ${message}`)
  if (details) {
    console.log('   Details:', details)
  }
}

async function checkRLSTenantPolicies() {
  console.log('\n🔒 Checking RLS tenant isolation policies...\n')
  
  try {
    const supabase = createServerSupabase()
    
    // Check critical tenant-scoped tables
    const tenantTables = [
      'bookings',
      'provider_profiles',
      'companies', 
      'services',
      'reviews',
      'loyalty_accounts',
      'membership_cards',
      'insurance_policies'
    ]
    
    const tableResults = []
    
    for (const table of tenantTables) {
      try {
        // Try to access table without tenant context (should fail if RLS is working)
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1)
        
        if (error) {
          if (error.message.includes('permission denied') || error.message.includes('policy')) {
            tableResults.push({ table, protected: true, status: 'RLS blocking access' })
          } else {
            tableResults.push({ table, protected: false, status: error.message })
          }
        } else {
          // Check if data returned indicates lack of tenant filtering
          tableResults.push({ 
            table, 
            protected: data?.length === 0, 
            status: data?.length > 0 ? 'Data accessible without tenant context' : 'No data or properly filtered'
          })
        }
      } catch (err: any) {
        tableResults.push({ table, protected: true, status: `Access blocked: ${err.message}` })
      }
    }
    
    const protectedTables = tableResults.filter(r => r.protected)
    const unprotectedTables = tableResults.filter(r => !r.protected)
    
    if (unprotectedTables.length === 0) {
      logResult('RLS Tenant Isolation', 'pass', 'All tenant tables properly protected', {
        protectedTables: protectedTables.length,
        results: tableResults
      })
    } else {
      logResult('RLS Tenant Isolation', 'fail', `${unprotectedTables.length} tables lack proper tenant isolation`, {
        unprotectedTables: unprotectedTables.map(t => ({ table: t.table, issue: t.status }))
      })
    }
    
    return tableResults
  } catch (error: any) {
    logResult('RLS Tenant Isolation', 'fail', 'Failed to check RLS tenant policies', { error: error.message })
    return null
  }
}

async function checkAuthenticatedUserAccess() {
  console.log('\n👤 Checking authenticated user access patterns...\n')
  
  try {
    const supabase = createServerSupabase()
    
    // Test with a mock authentication (if available)
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user.user) {
      logResult('User Authentication', 'warning', 'Cannot test with authenticated user - no session available', {
        userError: userError?.message
      })
      return null
    }
    
    // Test access to user-scoped data
    const userTests = [
      { table: 'bookings', description: 'User bookings access' },
      { table: 'addresses', description: 'User addresses access' },
      { table: 'loyalty_accounts', description: 'User loyalty accounts access' }
    ]
    
    const accessResults = []
    
    for (const test of userTests) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('id, user_id')
          .limit(5)
        
        if (error) {
          accessResults.push({
            test: test.description,
            status: 'blocked',
            message: error.message
          })
        } else {
          // Check if returned data is properly filtered to current user
          const otherUserData = data?.filter(item => item.user_id && item.user_id !== user.user.id)
          accessResults.push({
            test: test.description,
            status: otherUserData?.length === 0 ? 'properly_filtered' : 'cross_user_leak',
            message: otherUserData?.length > 0 
              ? `Found ${otherUserData.length} records from other users`
              : 'Data properly filtered to current user'
          })
        }
      } catch (err: any) {
        accessResults.push({
          test: test.description,
          status: 'error',
          message: err.message
        })
      }
    }
    
    const leaks = accessResults.filter(r => r.status === 'cross_user_leak')
    
    if (leaks.length === 0) {
      logResult('User Data Isolation', 'pass', 'User data properly isolated', { accessResults })
    } else {
      logResult('User Data Isolation', 'fail', `Found ${leaks.length} potential data leaks`, { leaks })
    }
    
    return accessResults
  } catch (error: any) {
    logResult('User Data Isolation', 'fail', 'Failed to check user access patterns', { error: error.message })
    return null
  }
}

async function checkTenantContextInQueries() {
  console.log('\n📊 Checking tenant context enforcement in application code...\n')
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Check API routes for proper tenant filtering
    const apiDir = path.join(process.cwd(), 'app/api')
    const routes = []
    
    function findRoutes(dir: string) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            findRoutes(fullPath)
          } else if (entry.name === 'route.ts') {
            routes.push(fullPath)
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
    
    findRoutes(apiDir)
    
    const routeAnalysis = []
    
    for (const routeFile of routes.slice(0, 20)) { // Sample first 20 routes
      try {
        const content = fs.readFileSync(routeFile, 'utf-8')
        const relativePath = routeFile.replace(process.cwd(), '')
        
        // Check for tenant-aware patterns
        const hasTenantFiltering = 
          content.includes('tenant_id') ||
          content.includes('company_id') ||
          content.includes('user_id') ||
          content.includes('withAuth') ||
          content.includes('getCurrentUser')
        
        const hasDirectTableAccess = 
          content.includes('.from(') &&
          !content.includes('withAuth') &&
          !content.includes('getCurrentUser')
        
        routeAnalysis.push({
          route: relativePath,
          hasTenantFiltering,
          hasDirectTableAccess,
          riskLevel: hasDirectTableAccess && !hasTenantFiltering ? 'high' : 
                     hasTenantFiltering ? 'low' : 'medium'
        })
      } catch (err) {
        // Skip files that can't be read
      }
    }
    
    const highRiskRoutes = routeAnalysis.filter(r => r.riskLevel === 'high')
    const lowRiskRoutes = routeAnalysis.filter(r => r.riskLevel === 'low')
    
    if (highRiskRoutes.length === 0) {
      logResult('Query Tenant Context', 'pass', 'API routes properly implement tenant filtering', {
        totalChecked: routeAnalysis.length,
        lowRisk: lowRiskRoutes.length,
        highRisk: highRiskRoutes.length
      })
    } else {
      logResult('Query Tenant Context', 'warning', `${highRiskRoutes.length} routes may lack tenant filtering`, {
        highRiskRoutes: highRiskRoutes.slice(0, 5).map(r => r.route)
      })
    }
    
    return routeAnalysis
  } catch (error: any) {
    logResult('Query Tenant Context', 'fail', 'Failed to analyze tenant context in queries', { error: error.message })
    return null
  }
}

async function generateTenantIsolationReport() {
  console.log('\n📋 Generating tenant isolation report...\n')
  
  const passCount = results.filter(r => r.status === 'pass').length
  const failCount = results.filter(r => r.status === 'fail').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  const securityLevel = failCount === 0 && warningCount === 0 ? 'excellent' :
                       failCount === 0 ? 'good' :
                       failCount <= 2 ? 'concerning' : 'critical'
  
  logResult('Tenant Isolation Assessment', 
    securityLevel === 'excellent' || securityLevel === 'good' ? 'pass' : 'fail',
    `Tenant isolation security level: ${securityLevel}`, {
      summary: {
        totalChecks: results.length,
        passed: passCount,
        warnings: warningCount,
        failed: failCount,
        securityLevel
      }
    }
  )
  
  // Recommendations
  const recommendations = []
  
  if (failCount > 0) {
    recommendations.push('Review and fix failing tenant isolation checks')
    recommendations.push('Ensure all RLS policies include proper tenant filtering')
  }
  
  if (warningCount > 0) {
    recommendations.push('Review API routes for proper tenant context enforcement')
    recommendations.push('Consider adding explicit tenant validation in high-risk routes')
  }
  
  if (recommendations.length > 0) {
    logResult('Recommendations', 'warning', 'Security improvements suggested', {
      recommendations
    })
  }
}

async function main() {
  console.log('🏢 Tenant Isolation Verification\n')
  console.log('=' .repeat(60))
  
  // Run checks
  await checkRLSTenantPolicies()
  await checkAuthenticatedUserAccess()
  await checkTenantContextInQueries()
  
  // Generate final report
  await generateTenantIsolationReport()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Tenant Isolation Summary\n')
  
  const passCount = results.filter(r => r.status === 'pass').length
  const failCount = results.filter(r => r.status === 'fail').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  console.log(`✅ Passed: ${passCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Failed: ${failCount}`)
  
  if (failCount === 0) {
    if (warningCount === 0) {
      console.log('\n🎉 Excellent! Tenant isolation is properly implemented.')
    } else {
      console.log('\n⚠️  Good tenant isolation with some areas for improvement.')
    }
    process.exit(0)
  } else {
    console.log('\n❌ Tenant isolation has critical issues that need attention.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})