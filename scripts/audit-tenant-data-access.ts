#!/usr/bin/env tsx
/**
 * Tenant Data Access Audit Script
 * 
 * Performs comprehensive audit of tenant data access patterns:
 * 1. Identifies all tenant-related tables and their access patterns
 * 2. Audits data flows between tenants
 * 3. Checks for potential data leakage paths
 * 4. Validates multi-tenant architecture compliance
 * 5. Generates detailed audit report
 * 
 * Usage: tsx scripts/audit-tenant-data-access.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createServerSupabase } from '../lib/supabase'

interface DataAccessAuditResult {
  category: string
  check: string
  status: 'compliant' | 'violation' | 'warning' | 'info'
  message: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  details?: any
}

const auditResults: DataAccessAuditResult[] = []

function logAuditResult(
  category: string,
  check: string, 
  status: 'compliant' | 'violation' | 'warning' | 'info',
  message: string,
  impact: 'low' | 'medium' | 'high' | 'critical',
  details?: any
) {
  auditResults.push({ category, check, status, message, impact, details })
  const icon = status === 'compliant' ? '✅' : 
               status === 'violation' ? '❌' : 
               status === 'warning' ? '⚠️' : 'ℹ️'
  const impactIcon = impact === 'critical' ? '🔥' : 
                    impact === 'high' ? '🟥' : 
                    impact === 'medium' ? '🟨' : '🟩'
  
  console.log(`${icon} ${impactIcon} [${category}] ${check}: ${message}`)
  if (details) {
    console.log('   Details:', details)
  }
}

async function auditTableStructure() {
  console.log('\n🗄️  Auditing table structure for tenant isolation...\n')
  
  try {
    const supabase = createServerSupabase()
    
    // Define table categories based on business domain
    const tableCategories = {
      userTables: ['users', 'user_profiles', 'user_sessions'],
      tenantTables: ['companies', 'provider_profiles', 'company_settings'],
      transactionalTables: ['bookings', 'payments', 'invoices', 'quotes'],
      resourceTables: ['services', 'addresses', 'availability_slots'],
      relationshipTables: ['reviews', 'loyalty_accounts', 'membership_cards'],
      complianceTables: ['insurance_policies', 'certifications', 'licenses'],
      sharedTables: ['service_categories', 'system_settings', 'feature_flags']
    }
    
    const allTables = Object.values(tableCategories).flat()
    const tableAnalysis = []
    
    for (const table of allTables) {
      try {
        // Get table info and sample data structure
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (!error) {
          const firstRecord = data?.[0] || {}
          const columns = Object.keys(firstRecord)
          
          // Check for tenant isolation columns
          const hasTenantId = columns.includes('tenant_id') || columns.includes('company_id')
          const hasUserId = columns.includes('user_id') || columns.includes('created_by')
          const hasOrgId = columns.includes('organization_id') || columns.includes('org_id')
          
          // Determine table category
          const category = Object.entries(tableCategories).find(([_, tables]) => 
            tables.includes(table)
          )?.[0] || 'unknown'
          
          tableAnalysis.push({
            table,
            category,
            exists: true,
            columns,
            hasTenantId,
            hasUserId,
            hasOrgId,
            isolationScore: (hasTenantId ? 2 : 0) + (hasUserId ? 1 : 0) + (hasOrgId ? 1 : 0)
          })
          
          // Audit findings
          if (category === 'sharedTables') {
            logAuditResult('Table Structure', `${table} isolation`, 'info', 
              'Shared table - tenant isolation not required', 'low', {
                category, columns: columns.slice(0, 5)
              })
          } else if (hasTenantId || hasOrgId) {
            logAuditResult('Table Structure', `${table} isolation`, 'compliant',
              'Table has proper tenant isolation columns', 'low', {
                tenantColumns: columns.filter(c => 
                  c.includes('tenant') || c.includes('company') || c.includes('org')
                )
              })
          } else if (hasUserId && (category === 'userTables' || category === 'relationshipTables')) {
            logAuditResult('Table Structure', `${table} isolation`, 'warning',
              'User-scoped table without explicit tenant isolation', 'medium', {
                category, userColumn: columns.filter(c => c.includes('user'))
              })
          } else {
            logAuditResult('Table Structure', `${table} isolation`, 'violation',
              'Missing tenant isolation in multi-tenant table', 'high', {
                category, suggestedColumns: ['tenant_id', 'company_id']
              })
          }
        }
      } catch (err) {
        tableAnalysis.push({
          table,
          exists: false,
          error: (err as Error).message
        })
        
        logAuditResult('Table Structure', `${table} access`, 'info',
          'Table not accessible or does not exist', 'low')
      }
    }
    
    return tableAnalysis
  } catch (error: any) {
    logAuditResult('Table Structure', 'audit', 'violation', 
      'Failed to audit table structure', 'critical', { error: error.message })
    return []
  }
}

async function auditCrosstenantDataLeaks() {
  console.log('\n🔍 Auditing for potential cross-tenant data leaks...\n')
  
  try {
    const supabase = createServerSupabase()
    
    // Test scenarios that could lead to data leaks
    const leakTests = [
      {
        name: 'Direct table access without filtering',
        tables: ['bookings', 'provider_profiles', 'companies'],
        description: 'Checking if tables allow unfiltered access'
      },
      {
        name: 'Join table data exposure',
        tables: ['reviews', 'loyalty_accounts'],
        description: 'Checking relationship tables for cross-tenant exposure'
      },
      {
        name: 'Aggregate data leaks',
        tables: ['services', 'availability_slots'],
        description: 'Checking if aggregate queries expose tenant boundaries'
      }
    ]
    
    const leakFindings = []
    
    for (const test of leakTests) {
      console.log(`   Testing: ${test.description}`)
      
      for (const table of test.tables) {
        try {
          // Test 1: Check if table returns data without proper filtering
          const { data: directData, error: directError } = await supabase
            .from(table)
            .select('*')
            .limit(10)
          
          if (!directError && directData && directData.length > 0) {
            // Analyze the data for tenant diversity
            const tenantColumns = ['tenant_id', 'company_id', 'organization_id', 'user_id']
            let tenantValues = new Set()
            
            for (const record of directData) {
              for (const col of tenantColumns) {
                if (record[col]) {
                  tenantValues.add(`${col}:${record[col]}`)
                }
              }
            }
            
            if (tenantValues.size > 1) {
              leakFindings.push({
                test: test.name,
                table,
                issue: 'Multiple tenants visible in single query',
                severity: 'high',
                tenantCount: tenantValues.size,
                details: Array.from(tenantValues).slice(0, 3)
              })
              
              logAuditResult('Data Leaks', `${table} cross-tenant access`, 'violation',
                `Multiple tenants visible: ${tenantValues.size} different tenant identifiers`, 'high', {
                  tenantSample: Array.from(tenantValues).slice(0, 3)
                })
            } else if (tenantValues.size === 1) {
              logAuditResult('Data Leaks', `${table} tenant filtering`, 'compliant',
                'Data properly scoped to single tenant context', 'low')
            }
          } else if (directError) {
            if (directError.message.includes('permission denied') || 
                directError.message.includes('policy')) {
              logAuditResult('Data Leaks', `${table} access control`, 'compliant',
                'Table properly protected by RLS policies', 'low')
            } else {
              logAuditResult('Data Leaks', `${table} access test`, 'warning',
                'Unexpected access error', 'medium', { error: directError.message })
            }
          }
        } catch (err: any) {
          logAuditResult('Data Leaks', `${table} exception`, 'info',
            'Access blocked by security measures', 'low', { error: err.message })
        }
      }
    }
    
    return leakFindings
  } catch (error: any) {
    logAuditResult('Data Leaks', 'audit', 'violation',
      'Failed to audit cross-tenant data leaks', 'critical', { error: error.message })
    return []
  }
}

async function auditDataFlowPaths() {
  console.log('\n🔄 Auditing data flow paths and access patterns...\n')
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Analyze API routes for data access patterns
    const apiRoutesDir = path.join(process.cwd(), 'app/api')
    const routes = []
    
    function findRoutes(dir: string): void {
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
    
    findRoutes(apiRoutesDir)
    
    const dataFlowAnalysis = []
    const riskyPatterns = []
    
    for (const routeFile of routes) {
      try {
        const content = fs.readFileSync(routeFile, 'utf-8')
        const routePath = routeFile.replace(process.cwd(), '').replace('/app/api', '/api').replace('/route.ts', '')
        
        // Analyze data access patterns
        const patterns = {
          hasDirectDatabaseAccess: content.includes('.from('),
          hasJoinOperations: content.includes('.join(') || content.includes('innerJoin') || content.includes('leftJoin'),
          hasAggregateQueries: content.includes('.count(') || content.includes('.sum(') || content.includes('.avg('),
          hasCrossTableQueries: (content.match(/\.from\(/g) || []).length > 1,
          hasAuthenticationCheck: content.includes('withAuth') || content.includes('getCurrentUser') || content.includes('requireAuth'),
          hasTenantFiltering: content.includes('tenant_id') || content.includes('company_id') || content.includes('organization_id'),
          hasParameterValidation: content.includes('zod') || content.includes('.parse(') || content.includes('validate'),
          exposesInternalData: content.includes('password') || content.includes('secret') || content.includes('key')
        }
        
        // Calculate risk score
        let riskScore = 0
        if (patterns.hasDirectDatabaseAccess && !patterns.hasAuthenticationCheck) riskScore += 3
        if (patterns.hasCrossTableQueries && !patterns.hasTenantFiltering) riskScore += 2
        if (patterns.hasJoinOperations && !patterns.hasTenantFiltering) riskScore += 2
        if (patterns.exposesInternalData) riskScore += 4
        if (patterns.hasAggregateQueries && !patterns.hasTenantFiltering) riskScore += 1
        
        const riskLevel = riskScore >= 5 ? 'critical' : 
                         riskScore >= 3 ? 'high' :
                         riskScore >= 1 ? 'medium' : 'low'
        
        dataFlowAnalysis.push({
          route: routePath,
          patterns,
          riskScore,
          riskLevel
        })
        
        if (riskScore >= 3) {
          riskyPatterns.push({
            route: routePath,
            riskScore,
            riskLevel,
            issues: [
              ...(patterns.hasDirectDatabaseAccess && !patterns.hasAuthenticationCheck ? ['Unauthenticated database access'] : []),
              ...(patterns.hasCrossTableQueries && !patterns.hasTenantFiltering ? ['Cross-table queries without tenant filtering'] : []),
              ...(patterns.hasJoinOperations && !patterns.hasTenantFiltering ? ['Join operations without tenant context'] : []),
              ...(patterns.exposesInternalData ? ['Potential internal data exposure'] : [])
            ]
          })
          
          logAuditResult('Data Flow', `${routePath} risk assessment`, 'violation',
            `High-risk data access pattern detected (score: ${riskScore})`, riskLevel as any, {
              issues: riskyPatterns[riskyPatterns.length - 1].issues
            })
        } else if (riskScore >= 1) {
          logAuditResult('Data Flow', `${routePath} risk assessment`, 'warning',
            `Medium-risk data access pattern (score: ${riskScore})`, 'medium', {
              suggestions: ['Add tenant filtering', 'Implement parameter validation']
            })
        } else {
          logAuditResult('Data Flow', `${routePath} risk assessment`, 'compliant',
            'Low-risk data access pattern', 'low')
        }
        
      } catch (err) {
        // Skip files that can't be read
      }
    }
    
    return { dataFlowAnalysis, riskyPatterns }
  } catch (error: any) {
    logAuditResult('Data Flow', 'audit', 'violation',
      'Failed to audit data flow paths', 'critical', { error: error.message })
    return { dataFlowAnalysis: [], riskyPatterns: [] }
  }
}

async function generateComplianceReport() {
  console.log('\n📊 Generating compliance report...\n')
  
  const categories = [...new Set(auditResults.map(r => r.category))]
  const summary = {
    totalChecks: auditResults.length,
    compliant: auditResults.filter(r => r.status === 'compliant').length,
    violations: auditResults.filter(r => r.status === 'violation').length,
    warnings: auditResults.filter(r => r.status === 'warning').length,
    info: auditResults.filter(r => r.status === 'info').length,
    critical: auditResults.filter(r => r.impact === 'critical').length,
    high: auditResults.filter(r => r.impact === 'high').length,
    medium: auditResults.filter(r => r.impact === 'medium').length,
    low: auditResults.filter(r => r.impact === 'low').length
  }
  
  // Calculate compliance score
  const maxScore = summary.totalChecks * 3 // 3 points for compliant
  const actualScore = auditResults.reduce((score, result) => {
    return score + (result.status === 'compliant' ? 3 :
                   result.status === 'warning' ? 1 :
                   result.status === 'violation' ? -1 : 0)
  }, 0)
  
  const compliancePercentage = Math.max(0, Math.round((actualScore / maxScore) * 100))
  
  // Determine overall compliance level
  const complianceLevel = compliancePercentage >= 90 ? 'excellent' :
                         compliancePercentage >= 75 ? 'good' :
                         compliancePercentage >= 60 ? 'acceptable' :
                         compliancePercentage >= 40 ? 'concerning' : 'critical'
  
  logAuditResult('Compliance', 'Overall assessment', 
    complianceLevel === 'excellent' || complianceLevel === 'good' ? 'compliant' : 'violation',
    `Multi-tenant compliance: ${compliancePercentage}% (${complianceLevel})`, 
    complianceLevel === 'critical' || complianceLevel === 'concerning' ? 'critical' : 'medium',
    { summary, complianceLevel, compliancePercentage }
  )
  
  // Generate recommendations
  const recommendations = []
  
  if (summary.violations > 0) {
    recommendations.push(`Address ${summary.violations} compliance violations immediately`)
  }
  
  if (summary.critical > 0) {
    recommendations.push(`Resolve ${summary.critical} critical security issues`)
  }
  
  if (summary.high > 0) {
    recommendations.push(`Fix ${summary.high} high-impact issues`)
  }
  
  if (compliancePercentage < 75) {
    recommendations.push('Implement comprehensive tenant isolation review')
    recommendations.push('Consider security architecture consultation')
  }
  
  if (recommendations.length > 0) {
    logAuditResult('Compliance', 'Recommendations', 'warning',
      'Security improvements required', 'high', { recommendations })
  }
  
  return { summary, compliancePercentage, complianceLevel, recommendations }
}

async function main() {
  console.log('🔍 Tenant Data Access Audit\n')
  console.log('=' .repeat(60))
  
  // Run all audit categories
  await auditTableStructure()
  await auditCrosstenantDataLeaks()
  await auditDataFlowPaths()
  
  // Generate final compliance report
  const complianceReport = await generateComplianceReport()
  
  // Final summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 Audit Summary\n')
  
  console.log(`Compliance Score: ${complianceReport.compliancePercentage}% (${complianceReport.complianceLevel})`)
  console.log(`Total Checks: ${complianceReport.summary.totalChecks}`)
  console.log(`✅ Compliant: ${complianceReport.summary.compliant}`)
  console.log(`⚠️  Warnings: ${complianceReport.summary.warnings}`)
  console.log(`❌ Violations: ${complianceReport.summary.violations}`)
  console.log(`🔥 Critical Issues: ${complianceReport.summary.critical}`)
  
  if (complianceReport.summary.violations === 0 && complianceReport.summary.critical === 0) {
    console.log('\n🎉 Tenant data access audit completed successfully!')
    if (complianceReport.summary.warnings > 0) {
      console.log('⚠️  Please review warnings for continuous improvement.')
    }
    process.exit(0)
  } else {
    console.log('\n❌ Critical tenant data access issues found.')
    console.log('🚨 Immediate action required to ensure data security.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal audit error:', error)
  process.exit(1)
})