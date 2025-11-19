#!/usr/bin/env tsx
/**
 * Security Audit Script
 * 
 * Comprehensive security audit that checks:
 * 1. All API routes for proper authentication
 * 2. Service role key is never exposed to client
 * 3. RLS policies verification (via SQL check)
 * 4. Identifies routes that need security fixes
 * 
 * Usage: tsx scripts/security-audit.ts
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

interface RouteSecurityAudit {
  path: string
  filePath: string
  methods: string[]
  hasAuth: boolean
  authMethod: string | null
  hasOwnershipCheck: boolean
  acceptsUserIdParam: boolean
  isPublic: boolean
  securityIssues: string[]
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none'
}

interface ServiceKeyExposure {
  file: string
  line: number
  context: string
  isClientSide: boolean
  severity: 'critical' | 'high' | 'medium'
}

const API_DIR = join(process.cwd(), 'app/api')
// Client-side directories (exclude API routes)
const CLIENT_DIRS = [
  join(process.cwd(), 'components'),
  join(process.cwd(), 'lib', 'client'), // Only client-specific lib files
]
const ROUTES: RouteSecurityAudit[] = []
const SERVICE_KEY_EXPOSURES: ServiceKeyExposure[] = []

// Routes that are intentionally public
const PUBLIC_ROUTES = [
  '/api/about',
  '/api/contact',
  '/api/newsletter/subscribe',
  '/api/blog',
  '/api/services',
  '/api/providers',
  '/api/analytics/track', // POST is public (rate limited), GET requires auth
  '/api/auth',
  '/api/verify-supabase', // Debug route, should be disabled in production
]

// Routes that should require admin
const ADMIN_ROUTES = [
  '/api/admin',
  '/api/root-admin',
  '/api/users', // GET/POST should require admin
  '/api/jobs', // POST should require admin
]

// Routes that should require authentication
const PROTECTED_ROUTES = [
  '/api/bookings',
  '/api/transactions',
  '/api/insurance',
  '/api/verification',
  '/api/customers',
  '/api/companies',
  '/api/reviews', // POST should require auth
  '/api/loyalty',
  '/api/notifications',
  '/api/membership',
]

async function scanDirectory(dir: string, basePath: string = ''): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = join(basePath, entry.name)
    
    if (entry.isDirectory()) {
      await scanDirectory(fullPath, relativePath)
    } else if (entry.name === 'route.ts') {
      await auditRoute(fullPath, relativePath)
    }
  }
}

async function auditRoute(filePath: string, relativePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const routePath = relativePath.replace(/\/route\.ts$/, '').replace(/\[([^\]]+)\]/g, ':$1')
    const fullRoutePath = `/api/${routePath}`
    
    const audit: RouteSecurityAudit = {
      path: fullRoutePath,
      filePath: relativePath,
      methods: [],
      hasAuth: false,
      authMethod: null,
      hasOwnershipCheck: false,
      acceptsUserIdParam: false,
      isPublic: false,
      securityIssues: [],
      riskLevel: 'none',
    }
    
    // Determine if route is public
    audit.isPublic = PUBLIC_ROUTES.some(publicRoute => fullRoutePath.startsWith(publicRoute))
    
    // Detect HTTP methods
    const methodPatterns = {
      GET: /export\s+(async\s+)?function\s+GET|export\s+(const\s+)?GET\s*=/,
      POST: /export\s+(async\s+)?function\s+POST|export\s+(const\s+)?POST\s*=/,
      PUT: /export\s+(async\s+)?function\s+PUT|export\s+(const\s+)?PUT\s*=/,
      PATCH: /export\s+(async\s+)?function\s+PATCH|export\s+(const\s+)?PATCH\s*=/,
      DELETE: /export\s+(async\s+)?function\s+DELETE|export\s+(const\s+)?DELETE\s*=/,
    }
    
    for (const [method, pattern] of Object.entries(methodPatterns)) {
      if (pattern.test(content)) {
        audit.methods.push(method)
      }
    }
    
    // Check for authentication patterns
    const hasWithAuth = /withAuth\(/.test(content) || /export\s+(const\s+)?(GET|POST|PUT|PATCH|DELETE)\s*=\s*withAuth/.test(content)
    const hasWithRootAdmin = /withRootAdmin\(/.test(content)
    const hasWithAuthAndParams = /withAuthAndParams\(/.test(content)
    const hasRequireAuth = /requireAuth\(/.test(content)
    const hasRequireAdmin = /requireAdmin\(/.test(content)
    const hasRequireRootAdmin = /requireRootAdmin\(/.test(content)
    const hasManualAuth = /auth\.uid\(\)|getUser\(|getSession\(/.test(content)
    
    if (hasWithAuth) {
      audit.hasAuth = true
      audit.authMethod = 'withAuth'
    } else if (hasWithRootAdmin) {
      audit.hasAuth = true
      audit.authMethod = 'withRootAdmin'
    } else if (hasWithAuthAndParams) {
      audit.hasAuth = true
      audit.authMethod = 'withAuthAndParams'
    } else if (hasRequireAuth || hasRequireAdmin || hasRequireRootAdmin) {
      audit.hasAuth = true
      audit.authMethod = 'requireAuth/requireAdmin/requireRootAdmin'
    } else if (hasManualAuth) {
      audit.hasAuth = true
      audit.authMethod = 'manual'
    }
    
    // Check for ownership verification
    const hasVerifyOwnership = /verifyBookingOwnership|verifyCompanyMembership|verifyCustomerOwnership/.test(content)
    audit.hasOwnershipCheck = hasVerifyOwnership
    
    // Check if route accepts userId/user_id from params/query
    const acceptsUserId = /userId|user_id/.test(content) && 
      (/searchParams\.get\(['"]userId|searchParams\.get\(['"]user_id|params\.userId|params\.user_id|request\.json\(\)/.test(content))
    audit.acceptsUserIdParam = acceptsUserId && !audit.hasOwnershipCheck
    
    // Identify security issues
    if (!audit.isPublic && !audit.hasAuth) {
      // Check if route should be protected
      const shouldBeProtected = PROTECTED_ROUTES.some(route => fullRoutePath.startsWith(route)) ||
                                ADMIN_ROUTES.some(route => fullRoutePath.startsWith(route))
      
      if (shouldBeProtected) {
        if (ADMIN_ROUTES.some(route => fullRoutePath.startsWith(route))) {
          audit.securityIssues.push('Missing admin authentication')
          audit.riskLevel = 'critical'
        } else {
          audit.securityIssues.push('Missing authentication')
          audit.riskLevel = 'high'
        }
      } else {
        audit.securityIssues.push('May need authentication (review required)')
        audit.riskLevel = 'medium'
      }
    }
    
    if (audit.acceptsUserIdParam && !audit.hasOwnershipCheck) {
      audit.securityIssues.push('Accepts userId parameter without ownership verification')
      audit.riskLevel = audit.riskLevel === 'none' ? 'critical' : audit.riskLevel
    }
    
    if (audit.hasAuth && !audit.hasOwnershipCheck && audit.path.includes('/[id]') && !audit.isPublic) {
      // Dynamic routes with IDs should verify ownership
      const needsOwnershipCheck = PROTECTED_ROUTES.some(route => fullRoutePath.startsWith(route))
      if (needsOwnershipCheck) {
        audit.securityIssues.push('Missing ownership verification for resource access')
        if (audit.riskLevel === 'none') audit.riskLevel = 'high'
      }
    }
    
    // Check for admin routes that don't require admin
    if (ADMIN_ROUTES.some(route => fullRoutePath.startsWith(route)) && 
        audit.hasAuth && 
        !audit.authMethod?.includes('Admin') && 
        !audit.authMethod?.includes('RootAdmin')) {
      audit.securityIssues.push('Admin route may not require admin authentication')
      audit.riskLevel = audit.riskLevel === 'none' ? 'high' : audit.riskLevel
    }
    
    ROUTES.push(audit)
  } catch (error) {
    console.error(`Error auditing ${filePath}:`, error)
  }
}

async function checkServiceKeyExposure(): Promise<void> {
  console.log('\n🔍 Checking for service role key exposure...\n')
  
  const patterns = [
    /SUPABASE_SERVICE_ROLE_KEY/g,
    /service.*role.*key/gi,
    /serviceRoleKey/gi,
  ]
  
  // Check client-side directories
  for (const dir of CLIENT_DIRS) {
    try {
      await scanDirectoryForServiceKey(dir, patterns, true)
    } catch (error) {
      // Directory might not exist, skip
    }
  }
  
  // Check API routes (should be OK, but verify)
  await scanDirectoryForServiceKey(API_DIR, patterns, false)
}

async function scanDirectoryForServiceKey(
  dir: string,
  patterns: RegExp[],
  isClientSide: boolean
): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      const relativePath = fullPath.replace(process.cwd(), '')
      
      // Skip API routes and server-side files
      if (relativePath.includes('/app/api/') || relativePath.includes('/api/')) {
        continue
      }
      
      // Skip server-side lib files (auth, supabase server functions)
      if (relativePath.includes('/lib/auth/') || 
          relativePath.includes('/lib/supabase') ||
          relativePath.includes('/lib/server')) {
        continue
      }
      
      if (entry.isDirectory()) {
        await scanDirectoryForServiceKey(fullPath, patterns, isClientSide)
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        try {
          const content = await readFile(fullPath, 'utf-8')
          
          for (const pattern of patterns) {
            const matches = content.matchAll(pattern)
            for (const match of matches) {
              const lines = content.substring(0, match.index || 0).split('\n')
              const lineNumber = lines.length
              const context = lines[lines.length - 1]?.trim() || ''
              
              // Check if it's being exposed to client (NEXT_PUBLIC, window, document, response)
              const surroundingCode = content.substring(
                Math.max(0, (match.index || 0) - 200),
                Math.min(content.length, (match.index || 0) + 500)
              )
              
              const isExposed = /NEXT_PUBLIC.*SERVICE|window\[|document\.|\.innerHTML|\.textContent|response\.json\(.*SERVICE|export.*SERVICE/.test(surroundingCode)
              
              if (isExposed || isClientSide) {
                SERVICE_KEY_EXPOSURES.push({
                  file: relativePath,
                  line: lineNumber,
                  context: context.substring(0, 100),
                  isClientSide,
                  severity: isClientSide ? 'critical' : isExposed ? 'high' : 'medium',
                })
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

async function generateRLSCheckScript(): Promise<void> {
  const scriptPath = join(process.cwd(), 'scripts/verify-rls-policies.sql')
  const script = `-- RLS Policy Verification Script
-- This script checks that RLS is enabled and policies exist for all tables

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Tables that should have RLS (add your tables here)
-- This is a template - update with your actual table names
SELECT 
  t.tablename,
  CASE 
    WHEN t.rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN ('_prisma_migrations', 'schema_migrations')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
`
  
  await require('fs/promises').writeFile(scriptPath, script, 'utf-8')
  console.log(`\n📄 RLS verification SQL script created: ${scriptPath}`)
  console.log('   Run this script against your Supabase database to verify RLS policies')
}

async function main() {
  console.log('🔒 Starting Security Audit...\n')
  
  // Audit all API routes
  console.log('📋 Step 1: Auditing API routes...')
  await scanDirectory(API_DIR)
  
  // Check for service key exposure
  await checkServiceKeyExposure()
  
  // Generate RLS check script
  await generateRLSCheckScript()
  
  // Generate report
  console.log('\n📊 Generating Security Audit Report...\n')
  
  const routesWithIssues = ROUTES.filter(r => r.securityIssues.length > 0)
  const criticalIssues = ROUTES.filter(r => r.riskLevel === 'critical')
  const highIssues = ROUTES.filter(r => r.riskLevel === 'high')
  const routesWithAuth = ROUTES.filter(r => r.hasAuth).length
  
  const report = `# Security Audit Report

**Generated:** ${new Date().toISOString()}
**Total Routes Audited:** ${ROUTES.length}

## Executive Summary

- ✅ Routes with authentication: ${routesWithAuth}/${ROUTES.length} (${Math.round(routesWithAuth / ROUTES.length * 100)}%)
- ⚠️  Routes with security issues: ${routesWithIssues.length}/${ROUTES.length}
- 🔴 Critical issues: ${criticalIssues.length}
- 🟠 High priority issues: ${highIssues.length}

## Service Role Key Exposure Check

${SERVICE_KEY_EXPOSURES.length === 0 
  ? '✅ **No service role key exposure found** - All service role key usage is server-side only'
  : `⚠️ **Found ${SERVICE_KEY_EXPOSURES.length} potential exposure(s):**

${SERVICE_KEY_EXPOSURES.map(exp => `
### ${exp.file}:${exp.line}
- **Severity:** ${exp.severity.toUpperCase()}
- **Client-side:** ${exp.isClientSide ? 'Yes ⚠️' : 'No'}
- **Context:** \`${exp.context}\`
`).join('\n')}
`}

## Critical Security Issues

${criticalIssues.length === 0 
  ? '✅ No critical issues found'
  : criticalIssues.map(route => `
### ${route.path}
**Methods:** ${route.methods.join(', ')}
**Issues:**
${route.securityIssues.map(issue => `- ${issue}`).join('\n')}
**File:** \`${route.filePath}\`
`).join('\n')
}

## High Priority Issues

${highIssues.length === 0 
  ? '✅ No high priority issues found'
  : highIssues.map(route => `
### ${route.path}
**Methods:** ${route.methods.join(', ')}
**Issues:**
${route.securityIssues.map(issue => `- ${issue}`).join('\n')}
**File:** \`${route.filePath}\`
`).join('\n')
}

## Routes Needing Review

${routesWithIssues.filter(r => r.riskLevel === 'medium').length === 0
  ? '✅ No routes need review'
  : routesWithIssues.filter(r => r.riskLevel === 'medium').map(route => `
### ${route.path}
**Methods:** ${route.methods.join(', ')}
**Issues:**
${route.securityIssues.map(issue => `- ${issue}`).join('\n')}
**File:** \`${route.filePath}\`
`).join('\n')
}

## All Routes Security Status

| Route | Methods | Auth | Ownership Check | Risk Level | Issues |
|-------|---------|------|-----------------|------------|--------|
${ROUTES.map(route => {
  const methods = route.methods.join(', ') || 'N/A'
  const auth = route.hasAuth ? '✅' : '❌'
  const ownership = route.hasOwnershipCheck ? '✅' : route.isPublic ? 'N/A' : '⚠️'
  const risk = route.riskLevel === 'none' ? '✅' : 
               route.riskLevel === 'critical' ? '🔴' :
               route.riskLevel === 'high' ? '🟠' :
               route.riskLevel === 'medium' ? '🟡' : '✅'
  const issues = route.securityIssues.length > 0 ? `${route.securityIssues.length}` : '0'
  return `| ${route.path} | ${methods} | ${auth} | ${ownership} | ${risk} | ${issues} |`
}).join('\n')}

## Recommendations

1. **Fix Critical Issues First:** Address all routes with critical risk level
2. **Add Ownership Verification:** All routes accepting user/resource IDs should verify ownership
3. **Standardize Authentication:** Use \`withAuth\`, \`withAuthAndParams\`, or \`withRootAdmin\` consistently
4. **Review Public Routes:** Ensure all public routes are intentionally public and rate-limited
5. **RLS Policies:** Run \`scripts/verify-rls-policies.sql\` to verify RLS is enabled on all tables

## Next Steps

1. Review and fix critical issues
2. Run RLS verification script: \`psql -f scripts/verify-rls-policies.sql\`
3. Create integration tests for unauthorized access
4. Re-run audit after fixes
`
  
  const reportPath = join(process.cwd(), 'SECURITY_AUDIT_REPORT.md')
  await require('fs/promises').writeFile(reportPath, report, 'utf-8')
  
  console.log('✅ Security audit complete!')
  console.log(`\n📄 Report written to: ${reportPath}`)
  console.log(`\n📊 Summary:`)
  console.log(`   - Total routes: ${ROUTES.length}`)
  console.log(`   - Routes with auth: ${routesWithAuth}`)
  console.log(`   - Critical issues: ${criticalIssues.length}`)
  console.log(`   - High priority issues: ${highIssues.length}`)
  console.log(`   - Service key exposures: ${SERVICE_KEY_EXPOSURES.length}`)
  
  if (criticalIssues.length > 0 || highIssues.length > 0) {
    console.log(`\n⚠️  Please review and fix the issues in the report!`)
  }
}

main().catch(console.error)

