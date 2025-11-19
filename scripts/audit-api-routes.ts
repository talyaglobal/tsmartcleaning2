#!/usr/bin/env tsx
/**
 * API Routes Audit Script
 * 
 * Scans all API routes and checks for:
 * 1. Standardized error handling (using ApiErrors, handleApiError, logError)
 * 2. Request validation (using validateRequestBody, validateQueryParams, validateRouteParams)
 * 3. Authentication patterns (using withAuth, withRootAdmin)
 * 
 * Usage: tsx scripts/audit-api-routes.ts
 */

import { readdir, readFile, stat } from 'fs/promises'
import { join, relative } from 'path'

interface RouteAudit {
  path: string
  hasStandardizedErrors: boolean
  hasValidation: boolean
  hasAuth: boolean
  usesConsoleError: boolean
  usesManualErrorResponse: boolean
  issues: string[]
}

const API_DIR = join(process.cwd(), 'app/api')
const RESULTS: RouteAudit[] = []

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
    
    const audit: RouteAudit = {
      path: `/api/${routePath}`,
      hasStandardizedErrors: false,
      hasValidation: false,
      hasAuth: false,
      usesConsoleError: false,
      usesManualErrorResponse: false,
      issues: [],
    }
    
    // Check for standardized error handling
    const hasApiErrors = /ApiErrors\.(badRequest|unauthorized|forbidden|notFound|conflict|validationError|internalError|databaseError|serviceUnavailable)/.test(content)
    const hasHandleApiError = /handleApiError\(/.test(content)
    const hasLogError = /logError\(/.test(content)
    audit.hasStandardizedErrors = hasApiErrors || hasHandleApiError || hasLogError
    
    // Check for validation
    const hasValidateRequestBody = /validateRequestBody\(/.test(content)
    const hasValidateQueryParams = /validateQueryParams\(/.test(content)
    const hasValidateRouteParams = /validateRouteParams\(/.test(content)
    audit.hasValidation = hasValidateRequestBody || hasValidateQueryParams || hasValidateRouteParams
    
    // Check for authentication
    const hasWithAuth = /withAuth\(/.test(content) || /export\s+(const\s+)?(GET|POST|PUT|PATCH|DELETE)\s*=\s*withAuth/.test(content)
    const hasWithRootAdmin = /withRootAdmin\(/.test(content)
    audit.hasAuth = hasWithAuth || hasWithRootAdmin
    
    // Check for non-standard patterns
    audit.usesConsoleError = /console\.error\(/.test(content)
    audit.usesManualErrorResponse = /NextResponse\.json\(\s*\{\s*error:/.test(content)
    
    // Identify issues
    if (!audit.hasStandardizedErrors && (audit.usesConsoleError || audit.usesManualErrorResponse)) {
      audit.issues.push('Missing standardized error handling')
    }
    
    if (!audit.hasValidation) {
      // Check if route accepts input
      const hasRequestBody = /await\s+request\.json\(\)/.test(content)
      const hasQueryParams = /searchParams\.get\(/.test(content) || /new URL\(request\.url\)/.test(content)
      const hasRouteParams = /params\s*[:=]/.test(content)
      
      if (hasRequestBody || hasQueryParams || hasRouteParams) {
        audit.issues.push('Missing request validation')
      }
    }
    
    // Check for routes that should have auth but don't
    const isPublicRoute = /\/api\/(about|contact|blog|services|providers|analytics\/track|newsletter)/.test(audit.path)
    if (!audit.hasAuth && !isPublicRoute && !audit.path.includes('/auth/')) {
      audit.issues.push('May need authentication')
    }
    
    RESULTS.push(audit)
  } catch (error) {
    console.error(`Error auditing ${filePath}:`, error)
  }
}

async function main() {
  console.log('🔍 Auditing API routes...\n')
  
  await scanDirectory(API_DIR)
  
  // Sort results by path
  RESULTS.sort((a, b) => a.path.localeCompare(b.path))
  
  // Generate report
  console.log('# API Routes Audit Report\n')
  console.log(`**Generated:** ${new Date().toISOString()}\n`)
  console.log(`**Total Routes:** ${RESULTS.length}\n`)
  
  const routesWithIssues = RESULTS.filter(r => r.issues.length > 0)
  const routesWithStandardErrors = RESULTS.filter(r => r.hasStandardizedErrors).length
  const routesWithValidation = RESULTS.filter(r => r.hasValidation).length
  const routesWithAuth = RESULTS.filter(r => r.hasAuth).length
  
  console.log('## Summary\n')
  console.log(`- ✅ Routes with standardized error handling: ${routesWithStandardErrors}/${RESULTS.length}`)
  console.log(`- ✅ Routes with request validation: ${routesWithValidation}/${RESULTS.length}`)
  console.log(`- ✅ Routes with authentication: ${routesWithAuth}/${RESULTS.length}`)
  console.log(`- ⚠️  Routes with issues: ${routesWithIssues.length}/${RESULTS.length}\n`)
  
  if (routesWithIssues.length > 0) {
    console.log('## Routes Needing Attention\n')
    
    for (const route of routesWithIssues) {
      console.log(`### ${route.path}\n`)
      console.log(`**Issues:**`)
      for (const issue of route.issues) {
        console.log(`- ${issue}`)
      }
      console.log(`\n**Status:**`)
      console.log(`- Standardized Errors: ${route.hasStandardizedErrors ? '✅' : '❌'}`)
      console.log(`- Validation: ${route.hasValidation ? '✅' : '❌'}`)
      console.log(`- Authentication: ${route.hasAuth ? '✅' : '❌'}`)
      console.log(`- Uses console.error: ${route.usesConsoleError ? '⚠️' : '✅'}`)
      console.log(`- Uses manual error responses: ${route.usesManualErrorResponse ? '⚠️' : '✅'}`)
      console.log('')
    }
  }
  
  console.log('## All Routes\n')
  console.log('| Route | Standardized Errors | Validation | Auth | Issues |')
  console.log('|-------|---------------------|------------|------|--------|')
  
  for (const route of RESULTS) {
    const errors = route.hasStandardizedErrors ? '✅' : '❌'
    const validation = route.hasValidation ? '✅' : '❌'
    const auth = route.hasAuth ? '✅' : '❌'
    const issues = route.issues.length > 0 ? `⚠️ ${route.issues.length}` : '✅'
    console.log(`| ${route.path} | ${errors} | ${validation} | ${auth} | ${issues} |`)
  }
  
  // Write detailed report to file
  const reportPath = join(process.cwd(), 'API_ROUTES_AUDIT_DETAILED.md')
  const reportContent = `# API Routes Detailed Audit Report

**Generated:** ${new Date().toISOString()}
**Total Routes:** ${RESULTS.length}

## Summary

- Routes with standardized error handling: ${routesWithStandardErrors}/${RESULTS.length}
- Routes with request validation: ${routesWithValidation}/${RESULTS.length}
- Routes with authentication: ${routesWithAuth}/${RESULTS.length}
- Routes with issues: ${routesWithIssues.length}/${RESULTS.length}

## Routes Needing Attention

${routesWithIssues.map(route => `
### ${route.path}

**Issues:**
${route.issues.map(issue => `- ${issue}`).join('\n')}

**Status:**
- Standardized Errors: ${route.hasStandardizedErrors ? '✅' : '❌'}
- Validation: ${route.hasValidation ? '✅' : '❌'}
- Authentication: ${route.hasAuth ? '✅' : '❌'}
- Uses console.error: ${route.usesConsoleError ? '⚠️' : '✅'}
- Uses manual error responses: ${route.usesManualErrorResponse ? '⚠️' : '✅'}
`).join('\n')}

## All Routes

| Route | Standardized Errors | Validation | Auth | Issues |
|-------|---------------------|------------|------|--------|
${RESULTS.map(route => {
  const errors = route.hasStandardizedErrors ? '✅' : '❌'
  const validation = route.hasValidation ? '✅' : '❌'
  const auth = route.hasAuth ? '✅' : '❌'
  const issues = route.issues.length > 0 ? `⚠️ ${route.issues.length}` : '✅'
  return `| ${route.path} | ${errors} | ${validation} | ${auth} | ${issues} |`
}).join('\n')}
`
  
  await require('fs/promises').writeFile(reportPath, reportContent, 'utf-8')
  console.log(`\n📄 Detailed report written to: ${reportPath}`)
}

main().catch(console.error)

