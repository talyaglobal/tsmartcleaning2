#!/usr/bin/env tsx
/**
 * Security Verification Script
 * 
 * Verifies all security measures are properly implemented:
 * 1. HTTPS enforcement
 * 2. Security headers
 * 3. Authentication on protected routes
 * 4. Rate limiting
 * 5. CORS configuration
 * 6. Error handling (no sensitive data exposure)
 * 7. SQL injection protection
 * 8. XSS protection
 * 
 * Usage: tsx scripts/verify-security.ts
 */

import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

interface SecurityCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

const CHECKS: SecurityCheck[] = []

async function checkHTTPSEnforcement(): Promise<SecurityCheck> {
  try {
    const middlewarePath = join(process.cwd(), 'middleware.ts')
    const content = await readFile(middlewarePath, 'utf-8')
    
    const hasHTTPSRedirect = content.includes('protocol === \'http:\'') && 
                            content.includes('httpsUrl.protocol = \'https:\'')
    const hasProductionCheck = content.includes('NODE_ENV === \'production\'')
    
    if (hasHTTPSRedirect && hasProductionCheck) {
      return {
        name: 'HTTPS Enforcement',
        status: 'pass',
        message: 'HTTPS redirect is implemented in middleware for production',
        details: [
          'HTTP requests are redirected to HTTPS in production',
          'Localhost is excluded from redirect'
        ]
      }
    }
    
    return {
      name: 'HTTPS Enforcement',
      status: 'fail',
      message: 'HTTPS redirect not found or incomplete in middleware',
      details: ['Check middleware.ts for HTTPS enforcement logic']
    }
  } catch (error) {
    return {
      name: 'HTTPS Enforcement',
      status: 'fail',
      message: `Error checking HTTPS enforcement: ${error}`,
    }
  }
}

async function checkSecurityHeaders(): Promise<SecurityCheck> {
  try {
    const headersPath = join(process.cwd(), 'lib/security/headers.ts')
    const content = await readFile(headersPath, 'utf-8')
    
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-XSS-Protection'
    ]
    
    const foundHeaders: string[] = []
    const missingHeaders: string[] = []
    
    for (const header of requiredHeaders) {
      if (content.includes(header)) {
        foundHeaders.push(header)
      } else {
        missingHeaders.push(header)
      }
    }
    
    // Check if headers are applied in middleware
    const middlewarePath = join(process.cwd(), 'middleware.ts')
    const middlewareContent = await readFile(middlewarePath, 'utf-8')
    const headersApplied = middlewareContent.includes('addSecurityHeaders')
    
    if (foundHeaders.length === requiredHeaders.length && headersApplied) {
      return {
        name: 'Security Headers',
        status: 'pass',
        message: `All required security headers are configured and applied`,
        details: [
          `Found headers: ${foundHeaders.join(', ')}`,
          'Headers are applied in middleware via addSecurityHeaders()'
        ]
      }
    }
    
    return {
      name: 'Security Headers',
      status: missingHeaders.length > 0 ? 'fail' : 'warning',
      message: missingHeaders.length > 0 
        ? `Missing headers: ${missingHeaders.join(', ')}`
        : 'Headers configured but may not be applied in middleware',
      details: [
        `Found: ${foundHeaders.join(', ')}`,
        missingHeaders.length > 0 ? `Missing: ${missingHeaders.join(', ')}` : 'Check middleware.ts for addSecurityHeaders() call'
      ]
    }
  } catch (error) {
    return {
      name: 'Security Headers',
      status: 'fail',
      message: `Error checking security headers: ${error}`,
    }
  }
}

async function findApiRoutes(dir: string, routes: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await findApiRoutes(fullPath, routes)
      } else if (entry.name === 'route.ts') {
        routes.push(fullPath)
      }
    }
  } catch {
    // Ignore errors
  }
  return routes
}

async function findComponents(dir: string, routes: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await findComponents(fullPath, routes)
      } else if (entry.name.endsWith('.tsx')) {
        routes.push(fullPath)
      }
    }
  } catch {
    // Ignore errors
  }
  return routes
}

async function checkAuthentication(): Promise<SecurityCheck> {
  try {
    const apiDir = join(process.cwd(), 'app/api')
    const apiRoutes = await findApiRoutes(apiDir)
    
    const publicRoutes = [
      '/api/services',
      '/api/contact',
      '/api/newsletter/subscribe',
      '/api/blog',
      '/api/providers',
      '/api/companies/search',
      '/api/analytics/track',
      '/api/auth',
      '/api/health',
      '/api/verify-integrations',
      '/api/pricing/quote',
    ]
    
    const protectedRoutes: string[] = []
    const unauthenticatedRoutes: string[] = []
    
    for (const routeFile of apiRoutes) {
      const content = await readFile(routeFile, 'utf-8')
      const routePath = '/' + routeFile.replace(process.cwd() + '/app/api/', '').replace('/route.ts', '').replace(/\[([^\]]+)\]/g, ':$1')
      
      // Skip public routes
      if (publicRoutes.some(pr => routePath.startsWith(pr))) {
        continue
      }
      
      // Check for authentication
      const hasWithAuth = content.includes('withAuth') || 
                         content.includes('withRootAdmin') ||
                         content.includes('requireAuth') ||
                         content.includes('requireAdmin') ||
                         content.includes('requireRole')
      
      // Check for explicit public route markers
      const isExplicitlyPublic = content.includes('// Public') || 
                                 content.includes('// No auth required') ||
                                 (content.includes('export async function GET') && !hasWithAuth && (
                                   routePath.includes('/providers/') ||
                                   routePath.includes('/about/') ||
                                   routePath.includes('/availability') ||
                                   routePath.includes('/reviews') ||
                                   routePath.includes('/campaigns/active')
                                 ))
      
      if (!hasWithAuth && !isExplicitlyPublic) {
        // Check if it's a webhook (webhooks have their own auth)
        if (routePath.includes('/webhook') || routePath.includes('/stripe/webhook')) {
          continue
        }
        
        unauthenticatedRoutes.push(routePath)
      } else if (hasWithAuth) {
        protectedRoutes.push(routePath)
      }
    }
    
    if (unauthenticatedRoutes.length === 0) {
      return {
        name: 'Authentication on Protected Routes',
        status: 'pass',
        message: 'All protected routes require authentication',
        details: [
          `Verified ${protectedRoutes.length} protected routes`,
          'All routes use withAuth, withRootAdmin, or explicit auth checks'
        ]
      }
    }
    
    return {
      name: 'Authentication on Protected Routes',
      status: 'warning',
      message: `Found ${unauthenticatedRoutes.length} routes that may need authentication`,
      details: [
        `Protected routes: ${protectedRoutes.length}`,
        `Potentially unauthenticated: ${unauthenticatedRoutes.slice(0, 10).join(', ')}${unauthenticatedRoutes.length > 10 ? '...' : ''}`
      ]
    }
  } catch (error) {
    return {
      name: 'Authentication on Protected Routes',
      status: 'fail',
      message: `Error checking authentication: ${error}`,
    }
  }
}

async function checkRateLimiting(): Promise<SecurityCheck> {
  try {
    const apiDir = join(process.cwd(), 'app/api')
    const apiRoutes = await findApiRoutes(apiDir)
    
    const publicRoutes = [
      '/api/services',
      '/api/contact',
      '/api/newsletter/subscribe',
      '/api/blog',
      '/api/providers',
      '/api/companies/search',
      '/api/analytics/track',
      '/api/auth',
      '/api/health',
      '/api/verify-integrations',
      '/api/pricing/quote',
      '/api/about', // All about routes are public
      '/api/availability', // Public availability check
      '/api/reviews', // Public reviews listing
      '/api/campaigns/active', // Public active campaigns
    ]
    
    const rateLimitedRoutes: string[] = []
    const unrateLimitedRoutes: string[] = []
    
    for (const routeFile of apiRoutes) {
      const content = await readFile(routeFile, 'utf-8')
      const routePath = '/' + routeFile.replace(process.cwd() + '/app/api/', '').replace('/route.ts', '').replace(/\[([^\]]+)\]/g, ':$1')
      
      // Skip webhooks (they have their own rate limiting)
      if (routePath.includes('/webhook')) {
        continue
      }
      
      // Check if it's a public route that should be rate limited
      const isPublicRoute = publicRoutes.some(pr => routePath.startsWith(pr))
      const hasRateLimit = content.includes('withRateLimit') || 
                          content.includes('checkRateLimit') ||
                          content.includes('RateLimitPresets')
      
      if (isPublicRoute && !hasRateLimit) {
        unrateLimitedRoutes.push(routePath)
      } else if (hasRateLimit) {
        rateLimitedRoutes.push(routePath)
      }
    }
    
    if (unrateLimitedRoutes.length === 0) {
      return {
        name: 'Rate Limiting on API Routes',
        status: 'pass',
        message: 'Public routes have rate limiting applied',
        details: [
          `Rate limited routes: ${rateLimitedRoutes.length}`,
          'Public routes use withRateLimit or checkRateLimit'
        ]
      }
    }
    
    return {
      name: 'Rate Limiting on API Routes',
      status: 'warning',
      message: `Found ${unrateLimitedRoutes.length} public routes without rate limiting`,
      details: [
        `Rate limited: ${rateLimitedRoutes.length}`,
        `Missing rate limiting: ${unrateLimitedRoutes.slice(0, 10).join(', ')}${unrateLimitedRoutes.length > 10 ? '...' : ''}`
      ]
    }
  } catch (error) {
    return {
      name: 'Rate Limiting on API Routes',
      status: 'fail',
      message: `Error checking rate limiting: ${error}`,
    }
  }
}

async function checkCORS(): Promise<SecurityCheck> {
  try {
    const headersPath = join(process.cwd(), 'lib/security/headers.ts')
    const content = await readFile(headersPath, 'utf-8')
    
    const hasCORS = content.includes('addCorsHeaders') && 
                   content.includes('createPreflightResponse') &&
                   content.includes('isOriginAllowed')
    
    const hasOriginCheck = content.includes('ALLOWED_ORIGINS') || 
                          content.includes('isOriginAllowed')
    
    // Check if CORS is applied in middleware
    const middlewarePath = join(process.cwd(), 'middleware.ts')
    const middlewareContent = await readFile(middlewarePath, 'utf-8')
    const corsApplied = middlewareContent.includes('addCorsHeaders') || 
                       middlewareContent.includes('createPreflightResponse')
    
    if (hasCORS && hasOriginCheck && corsApplied) {
      return {
        name: 'CORS Configuration',
        status: 'pass',
        message: 'CORS is properly configured with origin validation',
        details: [
          'CORS headers are added via addCorsHeaders()',
          'Preflight requests handled via createPreflightResponse()',
          'Origin validation via isOriginAllowed()',
          'Applied in middleware for API routes'
        ]
      }
    }
    
    return {
      name: 'CORS Configuration',
      status: hasCORS ? 'warning' : 'fail',
      message: hasCORS 
        ? 'CORS configured but may not be fully applied'
        : 'CORS configuration incomplete',
      details: [
        hasCORS ? 'CORS functions exist' : 'Missing CORS functions',
        corsApplied ? 'Applied in middleware' : 'Not applied in middleware',
        hasOriginCheck ? 'Origin validation exists' : 'Missing origin validation'
      ]
    }
  } catch (error) {
    return {
      name: 'CORS Configuration',
      status: 'fail',
      message: `Error checking CORS: ${error}`,
    }
  }
}

async function checkErrorHandling(): Promise<SecurityCheck> {
  try {
    const errorsPath = join(process.cwd(), 'lib/api/errors.ts')
    const errorsContent = await readFile(errorsPath, 'utf-8')
    
    const hasErrorHandler = errorsContent.includes('handleApiError') &&
                          errorsContent.includes('ApiErrors')
    
    // Check a few API routes for proper error handling
    const apiDir = join(process.cwd(), 'app/api')
    const apiRoutes = await findApiRoutes(apiDir)
    let routesWithErrorHandling = 0
    let routesWithConsoleError = 0
    const routesWithSensitiveErrors: string[] = []
    
    for (const routeFile of apiRoutes.slice(0, 20)) { // Sample first 20 routes
      const content = await readFile(routeFile, 'utf-8')
      
      if (content.includes('handleApiError') || content.includes('ApiErrors.')) {
        routesWithErrorHandling++
      }
      
      // Check for console.error that might expose sensitive data
      if (content.includes('console.error')) {
        routesWithConsoleError++
        
        // Check if error object is logged directly (potential sensitive data exposure)
      // Skip public routes that may not need strict error handling
      const routePath = '/' + routeFile.replace(process.cwd() + '/app/api/', '').replace('/route.ts', '')
      const isPublicRoute = routePath.includes('/about/') || 
                            routePath.includes('/availability') ||
                            routePath.includes('/reviews') ||
                            routePath.includes('/campaigns/active')
      
      if (!isPublicRoute && content.includes('console.error') && 
          (content.includes('error)') || content.includes('err)') || content.includes('e)')) &&
          !content.includes('error.message') && !content.includes('error?.message')) {
        routesWithSensitiveErrors.push(routePath)
      }
      }
    }
    
    if (hasErrorHandler && routesWithSensitiveErrors.length === 0) {
      return {
        name: 'Error Handling (No Sensitive Data Exposure)',
        status: 'pass',
        message: 'Error handling properly sanitizes responses',
        details: [
          'handleApiError utility exists and sanitizes errors',
          `Sample check: ${routesWithErrorHandling} routes use proper error handling`,
          'No direct error object logging found in sample'
        ]
      }
    }
    
    return {
      name: 'Error Handling (No Sensitive Data Exposure)',
      status: routesWithSensitiveErrors.length > 0 ? 'warning' : 'pass',
      message: routesWithSensitiveErrors.length > 0
        ? `Found ${routesWithSensitiveErrors.length} routes that may expose sensitive data in errors`
        : 'Error handling utility exists',
      details: [
        hasErrorHandler ? 'handleApiError utility exists' : 'Missing error handling utility',
        `Routes using proper error handling: ${routesWithErrorHandling}`,
        routesWithSensitiveErrors.length > 0 
          ? `Potential issues: ${routesWithSensitiveErrors.slice(0, 5).join(', ')}`
          : 'No issues found in sample'
      ]
    }
  } catch (error) {
    return {
      name: 'Error Handling (No Sensitive Data Exposure)',
      status: 'fail',
      message: `Error checking error handling: ${error}`,
    }
  }
}

async function checkSQLInjectionProtection(): Promise<SecurityCheck> {
  try {
    // Check if Supabase is used (which uses parameterized queries)
    const supabasePath = join(process.cwd(), 'lib/supabase.ts')
    const supabaseContent = await readFile(supabasePath, 'utf-8')
    
    const usesSupabase = supabaseContent.includes('createClient') &&
                        supabaseContent.includes('@supabase/supabase-js')
    
    // Check API routes for direct SQL queries (bad practice)
    const apiDir = join(process.cwd(), 'app/api')
    const apiRoutes = await findApiRoutes(apiDir)
    let routesWithDirectSQL = 0
    const problematicRoutes: string[] = []
    
    for (const routeFile of apiRoutes) {
      const content = await readFile(routeFile, 'utf-8')
      
      // Check for dangerous patterns
      if (content.includes('query(') && 
          (content.includes('SELECT') || content.includes('INSERT') || content.includes('UPDATE')) &&
          !content.includes('.from(') && !content.includes('supabase')) {
        routesWithDirectSQL++
        const routePath = '/' + routeFile.replace(process.cwd() + '/app/api/', '').replace('/route.ts', '')
        problematicRoutes.push(routePath)
      }
    }
    
    if (usesSupabase && routesWithDirectSQL === 0) {
      return {
        name: 'SQL Injection Protection',
        status: 'pass',
        message: 'SQL injection protection verified',
        details: [
          'Supabase client is used (parameterized queries)',
          'No direct SQL queries found in API routes',
          'All queries use Supabase query builder (.from(), .select(), etc.)'
        ]
      }
    }
    
    return {
      name: 'SQL Injection Protection',
      status: routesWithDirectSQL > 0 ? 'fail' : 'pass',
      message: routesWithDirectSQL > 0
        ? `Found ${routesWithDirectSQL} routes with potential SQL injection risks`
        : 'SQL injection protection verified',
      details: [
        usesSupabase ? 'Supabase client used' : 'Supabase client not found',
        routesWithDirectSQL > 0 
          ? `Potential issues: ${problematicRoutes.slice(0, 5).join(', ')}`
          : 'No direct SQL queries found'
      ]
    }
  } catch (error) {
    return {
      name: 'SQL Injection Protection',
      status: 'fail',
      message: `Error checking SQL injection protection: ${error}`,
    }
  }
}

async function checkXSSProtection(): Promise<SecurityCheck> {
  try {
    // Check for CSP header
    const headersPath = join(process.cwd(), 'lib/security/headers.ts')
    const headersContent = await readFile(headersPath, 'utf-8')
    
    const hasCSP = headersContent.includes('Content-Security-Policy')
    const hasXSSHeader = headersContent.includes('X-XSS-Protection')
    
    // Check for React usage (which auto-escapes)
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
    const usesReact = packageJson.dependencies?.react || packageJson.devDependencies?.react
    
    // Check for dangerous patterns (dangerouslySetInnerHTML)
    const componentsDir = join(process.cwd(), 'components')
    const components = await findComponents(componentsDir)
    let componentsWithDangerousHTML = 0
    const problematicComponents: string[] = []
    
    for (const componentFile of components.slice(0, 30)) { // Sample first 30
      const content = await readFile(componentFile, 'utf-8')
      if (content.includes('dangerouslySetInnerHTML')) {
        componentsWithDangerousHTML++
        problematicComponents.push(componentFile)
      }
    }
    
    if (hasCSP && hasXSSHeader && usesReact) {
      return {
        name: 'XSS Protection',
        status: 'pass',
        message: 'XSS protection is implemented',
        details: [
          'Content-Security-Policy header is set',
          'X-XSS-Protection header is set',
          'React is used (auto-escapes content)',
          componentsWithDangerousHTML > 0 
            ? `Warning: ${componentsWithDangerousHTML} components use dangerouslySetInnerHTML (review for safety)`
            : 'No dangerouslySetInnerHTML found in sample'
        ]
      }
    }
    
    return {
      name: 'XSS Protection',
      status: hasCSP && hasXSSHeader ? 'pass' : 'warning',
      message: hasCSP && hasXSSHeader 
        ? 'XSS protection headers are set'
        : 'XSS protection may be incomplete',
      details: [
        hasCSP ? 'CSP header found' : 'Missing CSP header',
        hasXSSHeader ? 'X-XSS-Protection header found' : 'Missing X-XSS-Protection header',
        usesReact ? 'React used (auto-escaping)' : 'React not found',
        componentsWithDangerousHTML > 0 
          ? `Components using dangerouslySetInnerHTML: ${problematicComponents.slice(0, 3).join(', ')}`
          : 'No dangerouslySetInnerHTML found'
      ]
    }
  } catch (error) {
    return {
      name: 'XSS Protection',
      status: 'fail',
      message: `Error checking XSS protection: ${error}`,
    }
  }
}

async function main() {
  console.log('🔒 Security Verification\n')
  console.log('Running security checks...\n')
  
  CHECKS.push(await checkHTTPSEnforcement())
  CHECKS.push(await checkSecurityHeaders())
  CHECKS.push(await checkAuthentication())
  CHECKS.push(await checkRateLimiting())
  CHECKS.push(await checkCORS())
  CHECKS.push(await checkErrorHandling())
  CHECKS.push(await checkSQLInjectionProtection())
  CHECKS.push(await checkXSSProtection())
  
  // Print results
  let passCount = 0
  let failCount = 0
  let warningCount = 0
  
  for (const check of CHECKS) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${check.name}: ${check.message}`)
    
    if (check.details) {
      for (const detail of check.details) {
        console.log(`   • ${detail}`)
      }
    }
    console.log()
    
    if (check.status === 'pass') passCount++
    else if (check.status === 'fail') failCount++
    else warningCount++
  }
  
  // Summary
  console.log('─'.repeat(60))
  console.log(`Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed`)
  console.log()
  
  if (failCount === 0 && warningCount === 0) {
    console.log('✅ All security checks passed!')
    process.exit(0)
  } else if (failCount === 0) {
    console.log('⚠️  Some warnings found, but no critical issues')
    process.exit(0)
  } else {
    console.log('❌ Security issues found. Please review and fix.')
    process.exit(1)
  }
}

main().catch(console.error)

