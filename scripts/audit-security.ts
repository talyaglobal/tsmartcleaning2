#!/usr/bin/env tsx
/**
 * Comprehensive Security Audit Script
 * 
 * Performs a comprehensive security audit covering:
 * 1. Authentication and authorization
 * 2. Data encryption and protection
 * 3. API security and rate limiting
 * 4. Input validation and sanitization
 * 5. Infrastructure security
 * 6. Compliance with security standards
 * 7. Vulnerability assessment
 * 
 * Usage: tsx scripts/audit-security.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

interface SecurityAuditResult {
  domain: string
  control: string
  status: 'secure' | 'vulnerable' | 'warning' | 'info'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  recommendation?: string
  details?: any
}

const auditResults: SecurityAuditResult[] = []

function logAuditResult(
  domain: string,
  control: string,
  status: 'secure' | 'vulnerable' | 'warning' | 'info',
  severity: 'critical' | 'high' | 'medium' | 'low',
  message: string,
  recommendation?: string,
  details?: any
) {
  auditResults.push({ domain, control, status, severity, message, recommendation, details })
  
  const statusIcon = status === 'secure' ? '✅' : 
                    status === 'vulnerable' ? '❌' : 
                    status === 'warning' ? '⚠️' : 'ℹ️'
  
  const severityIcon = severity === 'critical' ? '🔥' :
                      severity === 'high' ? '🔴' :
                      severity === 'medium' ? '🟡' : '🟢'
  
  console.log(`${statusIcon} ${severityIcon} [${domain}] ${control}: ${message}`)
  if (recommendation) {
    console.log(`   💡 Recommendation: ${recommendation}`)
  }
  if (details) {
    console.log(`   📋 Details:`, details)
  }
}

async function auditAuthenticationSecurity() {
  console.log('\n🔐 Auditing Authentication & Authorization...\n')
  
  try {
    // Check for proper authentication implementation
    const authFiles = [
      'lib/auth/auth-helpers.ts',
      'lib/auth/server.ts', 
      'lib/supabase.ts',
      'middleware.ts'
    ]
    
    const authAnalysis = {
      hasServerAuth: false,
      hasMiddleware: false,
      hasSessionManagement: false,
      hasRoleBasedAccess: false,
      hasPasswordPolicy: false,
      hasMFA: false
    }
    
    for (const file of authFiles) {
      try {
        const filePath = join(process.cwd(), file)
        const content = await readFile(filePath, 'utf-8')
        
        if (content.includes('createServerSupabase') || content.includes('createServerClient')) {
          authAnalysis.hasServerAuth = true
        }
        
        if (content.includes('middleware') && content.includes('auth')) {
          authAnalysis.hasMiddleware = true
        }
        
        if (content.includes('session') || content.includes('getUser')) {
          authAnalysis.hasSessionManagement = true
        }
        
        if (content.includes('role') || content.includes('permissions') || content.includes('withAuth')) {
          authAnalysis.hasRoleBasedAccess = true
        }
        
        if (content.includes('password') && (content.includes('policy') || content.includes('strength'))) {
          authAnalysis.hasPasswordPolicy = true
        }
        
        if (content.includes('mfa') || content.includes('totp') || content.includes('factor')) {
          authAnalysis.hasMFA = true
        }
      } catch (err) {
        // File doesn't exist or can't be read
      }
    }
    
    // Audit findings
    if (authAnalysis.hasServerAuth && authAnalysis.hasSessionManagement) {
      logAuditResult('Authentication', 'Server-side auth', 'secure', 'medium',
        'Server-side authentication properly implemented')
    } else {
      logAuditResult('Authentication', 'Server-side auth', 'vulnerable', 'high',
        'Missing or incomplete server-side authentication',
        'Implement proper server-side authentication with Supabase')
    }
    
    if (authAnalysis.hasRoleBasedAccess) {
      logAuditResult('Authentication', 'Role-based access', 'secure', 'medium',
        'Role-based access control detected')
    } else {
      logAuditResult('Authentication', 'Role-based access', 'warning', 'medium',
        'No clear role-based access control found',
        'Implement proper RBAC system')
    }
    
    if (authAnalysis.hasMFA) {
      logAuditResult('Authentication', 'Multi-factor auth', 'secure', 'low',
        'MFA implementation detected')
    } else {
      logAuditResult('Authentication', 'Multi-factor auth', 'warning', 'medium',
        'No MFA implementation found',
        'Consider implementing MFA for enhanced security')
    }
    
    return authAnalysis
  } catch (error: any) {
    logAuditResult('Authentication', 'Audit', 'vulnerable', 'critical',
      'Failed to audit authentication security', 
      'Review authentication implementation', 
      { error: error.message })
    return null
  }
}

async function auditDataProtection() {
  console.log('\n🔒 Auditing Data Protection & Encryption...\n')
  
  try {
    const encryptionChecks = {
      hasHTTPS: false,
      hasEncryptedStorage: false,
      hasSecretManagement: false,
      hasDataValidation: false,
      hasSanitization: false,
      hasSecureHeaders: false
    }
    
    // Check middleware for HTTPS enforcement
    try {
      const middlewarePath = join(process.cwd(), 'middleware.ts')
      const middlewareContent = await readFile(middlewarePath, 'utf-8')
      
      if (middlewareContent.includes('https') && middlewareContent.includes('redirect')) {
        encryptionChecks.hasHTTPS = true
      }
      
      if (middlewareContent.includes('Security-Policy') || middlewareContent.includes('X-Frame-Options')) {
        encryptionChecks.hasSecureHeaders = true
      }
    } catch (err) {
      // Middleware file doesn't exist
    }
    
    // Check for environment variable handling
    try {
      const envPath = join(process.cwd(), '.env.local')
      const envContent = await readFile(envPath, 'utf-8')
      
      if (envContent.includes('SECRET') || envContent.includes('KEY')) {
        encryptionChecks.hasSecretManagement = true
      }
    } catch (err) {
      // .env.local doesn't exist
    }
    
    // Check for validation libraries
    const packagePath = join(process.cwd(), 'package.json')
    const packageContent = await readFile(packagePath, 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    if (packageJson.dependencies?.zod || packageJson.dependencies?.joi || packageJson.dependencies?.yup) {
      encryptionChecks.hasDataValidation = true
    }
    
    if (packageJson.dependencies?.['dompurify'] || packageJson.dependencies?.['sanitize-html']) {
      encryptionChecks.hasSanitization = true
    }
    
    // Check Supabase configuration for encryption
    try {
      const supabasePath = join(process.cwd(), 'lib/supabase.ts')
      const supabaseContent = await readFile(supabasePath, 'utf-8')
      
      if (supabaseContent.includes('database') && supabaseContent.includes('ssl')) {
        encryptionChecks.hasEncryptedStorage = true
      }
    } catch (err) {
      // Supabase file doesn't exist
    }
    
    // Audit findings
    if (encryptionChecks.hasHTTPS) {
      logAuditResult('Data Protection', 'HTTPS enforcement', 'secure', 'medium',
        'HTTPS redirection implemented')
    } else {
      logAuditResult('Data Protection', 'HTTPS enforcement', 'vulnerable', 'high',
        'Missing HTTPS enforcement',
        'Implement HTTPS redirection in middleware')
    }
    
    if (encryptionChecks.hasSecureHeaders) {
      logAuditResult('Data Protection', 'Security headers', 'secure', 'medium',
        'Security headers implemented')
    } else {
      logAuditResult('Data Protection', 'Security headers', 'vulnerable', 'high',
        'Missing security headers',
        'Implement CSP, X-Frame-Options, and other security headers')
    }
    
    if (encryptionChecks.hasDataValidation) {
      logAuditResult('Data Protection', 'Input validation', 'secure', 'low',
        'Input validation library detected')
    } else {
      logAuditResult('Data Protection', 'Input validation', 'vulnerable', 'high',
        'No input validation library found',
        'Implement Zod or similar for input validation')
    }
    
    if (encryptionChecks.hasSecretManagement) {
      logAuditResult('Data Protection', 'Secret management', 'secure', 'low',
        'Environment variables for secrets detected')
    } else {
      logAuditResult('Data Protection', 'Secret management', 'warning', 'medium',
        'Secret management not clearly implemented',
        'Use environment variables for all secrets')
    }
    
    return encryptionChecks
  } catch (error: any) {
    logAuditResult('Data Protection', 'Audit', 'vulnerable', 'critical',
      'Failed to audit data protection',
      'Review data protection implementation',
      { error: error.message })
    return null
  }
}

async function auditAPISecurityAndRateLimit() {
  console.log('\n🌐 Auditing API Security & Rate Limiting...\n')
  
  try {
    const apiDir = join(process.cwd(), 'app/api')
    const routes: string[] = []
    
    async function findApiRoutes(dir: string): Promise<void> {
      try {
        const entries = await readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            await findApiRoutes(fullPath)
          } else if (entry.name === 'route.ts') {
            routes.push(fullPath)
          }
        }
      } catch (err) {
        // Directory doesn't exist or can't be read
      }
    }
    
    await findApiRoutes(apiDir)
    
    const apiSecurityAnalysis = {
      totalRoutes: routes.length,
      authenticatedRoutes: 0,
      rateLimitedRoutes: 0,
      validatedRoutes: 0,
      corsConfiguredRoutes: 0,
      errorHandlingRoutes: 0,
      vulnerableRoutes: []
    }
    
    for (const routeFile of routes.slice(0, 30)) { // Sample first 30 routes
      try {
        const content = await readFile(routeFile, 'utf-8')
        const routePath = routeFile.replace(process.cwd(), '').replace('/app/api', '/api').replace('/route.ts', '')
        
        const routeAnalysis = {
          path: routePath,
          hasAuth: content.includes('withAuth') || content.includes('requireAuth') || content.includes('getCurrentUser'),
          hasRateLimit: content.includes('rateLimit') || content.includes('throttle'),
          hasValidation: content.includes('zod') || content.includes('.parse(') || content.includes('validate'),
          hasCORS: content.includes('cors') || content.includes('Origin'),
          hasErrorHandling: content.includes('try') && content.includes('catch') && content.includes('handleApiError'),
          hasDirectDBAccess: content.includes('.from(') && !content.includes('withAuth'),
          exposesErrors: content.includes('console.error') && !content.includes('error.message')
        }
        
        // Count secure implementations
        if (routeAnalysis.hasAuth) apiSecurityAnalysis.authenticatedRoutes++
        if (routeAnalysis.hasRateLimit) apiSecurityAnalysis.rateLimitedRoutes++
        if (routeAnalysis.hasValidation) apiSecurityAnalysis.validatedRoutes++
        if (routeAnalysis.hasCORS) apiSecurityAnalysis.corsConfiguredRoutes++
        if (routeAnalysis.hasErrorHandling) apiSecurityAnalysis.errorHandlingRoutes++
        
        // Identify vulnerable patterns
        const vulnerabilities = []
        if (routeAnalysis.hasDirectDBAccess) vulnerabilities.push('Direct DB access without auth')
        if (routeAnalysis.exposesErrors) vulnerabilities.push('Error details exposed')
        if (!routeAnalysis.hasValidation && content.includes('request.json()')) vulnerabilities.push('No input validation')
        
        if (vulnerabilities.length > 0) {
          apiSecurityAnalysis.vulnerableRoutes.push({
            path: routePath,
            vulnerabilities
          })
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
    
    // Audit findings
    const authPercentage = Math.round((apiSecurityAnalysis.authenticatedRoutes / apiSecurityAnalysis.totalRoutes) * 100)
    const rateLimitPercentage = Math.round((apiSecurityAnalysis.rateLimitedRoutes / apiSecurityAnalysis.totalRoutes) * 100)
    const validationPercentage = Math.round((apiSecurityAnalysis.validatedRoutes / apiSecurityAnalysis.totalRoutes) * 100)
    
    if (authPercentage >= 80) {
      logAuditResult('API Security', 'Authentication coverage', 'secure', 'low',
        `${authPercentage}% of routes have authentication`)
    } else if (authPercentage >= 60) {
      logAuditResult('API Security', 'Authentication coverage', 'warning', 'medium',
        `Only ${authPercentage}% of routes have authentication`,
        'Increase authentication coverage for protected endpoints')
    } else {
      logAuditResult('API Security', 'Authentication coverage', 'vulnerable', 'high',
        `Low authentication coverage: ${authPercentage}%`,
        'Implement authentication on all protected endpoints')
    }
    
    if (rateLimitPercentage >= 50) {
      logAuditResult('API Security', 'Rate limiting coverage', 'secure', 'low',
        `${rateLimitPercentage}% of routes have rate limiting`)
    } else {
      logAuditResult('API Security', 'Rate limiting coverage', 'warning', 'medium',
        `Low rate limiting coverage: ${rateLimitPercentage}%`,
        'Implement rate limiting on public endpoints')
    }
    
    if (apiSecurityAnalysis.vulnerableRoutes.length === 0) {
      logAuditResult('API Security', 'Vulnerability scan', 'secure', 'low',
        'No obvious vulnerabilities detected in sample')
    } else {
      logAuditResult('API Security', 'Vulnerability scan', 'vulnerable', 'high',
        `${apiSecurityAnalysis.vulnerableRoutes.length} routes with potential vulnerabilities`,
        'Review and fix vulnerable API patterns',
        { vulnerableRoutes: apiSecurityAnalysis.vulnerableRoutes.slice(0, 5) })
    }
    
    return apiSecurityAnalysis
  } catch (error: any) {
    logAuditResult('API Security', 'Audit', 'vulnerable', 'critical',
      'Failed to audit API security',
      'Review API security implementation',
      { error: error.message })
    return null
  }
}

async function auditInfrastructureSecurity() {
  console.log('\n🏗️  Auditing Infrastructure Security...\n')
  
  try {
    const infraChecks = {
      hasProperDependencies: false,
      hasSecurityUpdates: false,
      hasEnvironmentSeparation: false,
      hasLoggingAndMonitoring: false,
      hasBackupStrategy: false,
      hasDisasterRecovery: false
    }
    
    // Check package.json for security-related packages and outdated dependencies
    const packagePath = join(process.cwd(), 'package.json')
    const packageContent = await readFile(packagePath, 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    const securityPackages = [
      '@sentry/nextjs',
      'helmet',
      'cors', 
      'express-rate-limit',
      'bcrypt',
      'jsonwebtoken'
    ]
    
    const hasSecurityDeps = securityPackages.some(pkg => 
      packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
    )
    
    if (hasSecurityDeps) {
      infraChecks.hasProperDependencies = true
    }
    
    // Check for monitoring and logging
    if (packageJson.dependencies?.['@sentry/nextjs'] || packageJson.dependencies?.['@vercel/analytics']) {
      infraChecks.hasLoggingAndMonitoring = true
    }
    
    // Check environment files
    const envFiles = ['.env.local', '.env', '.env.example']
    let envCount = 0
    
    for (const envFile of envFiles) {
      try {
        await stat(join(process.cwd(), envFile))
        envCount++
      } catch (err) {
        // File doesn't exist
      }
    }
    
    if (envCount >= 2) {
      infraChecks.hasEnvironmentSeparation = true
    }
    
    // Check for backup and recovery scripts
    try {
      const scriptsDir = join(process.cwd(), 'scripts')
      const scripts = await readdir(scriptsDir)
      
      if (scripts.some(s => s.includes('backup') || s.includes('restore'))) {
        infraChecks.hasBackupStrategy = true
      }
      
      if (scripts.some(s => s.includes('disaster') || s.includes('recovery'))) {
        infraChecks.hasDisasterRecovery = true
      }
    } catch (err) {
      // Scripts directory doesn't exist
    }
    
    // Audit findings
    if (infraChecks.hasProperDependencies) {
      logAuditResult('Infrastructure', 'Security dependencies', 'secure', 'low',
        'Security-related dependencies detected')
    } else {
      logAuditResult('Infrastructure', 'Security dependencies', 'warning', 'medium',
        'Limited security dependencies found',
        'Consider adding security-focused packages')
    }
    
    if (infraChecks.hasLoggingAndMonitoring) {
      logAuditResult('Infrastructure', 'Logging & monitoring', 'secure', 'low',
        'Monitoring and logging tools detected')
    } else {
      logAuditResult('Infrastructure', 'Logging & monitoring', 'vulnerable', 'high',
        'No logging or monitoring detected',
        'Implement comprehensive logging and monitoring')
    }
    
    if (infraChecks.hasEnvironmentSeparation) {
      logAuditResult('Infrastructure', 'Environment separation', 'secure', 'low',
        'Multiple environment configurations found')
    } else {
      logAuditResult('Infrastructure', 'Environment separation', 'warning', 'medium',
        'Limited environment separation',
        'Implement proper dev/staging/prod separation')
    }
    
    if (infraChecks.hasBackupStrategy) {
      logAuditResult('Infrastructure', 'Backup strategy', 'secure', 'low',
        'Backup scripts detected')
    } else {
      logAuditResult('Infrastructure', 'Backup strategy', 'vulnerable', 'high',
        'No backup strategy detected',
        'Implement automated backup procedures')
    }
    
    return infraChecks
  } catch (error: any) {
    logAuditResult('Infrastructure', 'Audit', 'vulnerable', 'critical',
      'Failed to audit infrastructure security',
      'Review infrastructure setup',
      { error: error.message })
    return null
  }
}

async function generateSecurityReport() {
  console.log('\n📊 Generating Security Report...\n')
  
  const domains = [...new Set(auditResults.map(r => r.domain))]
  const summary = {
    totalControls: auditResults.length,
    secure: auditResults.filter(r => r.status === 'secure').length,
    vulnerable: auditResults.filter(r => r.status === 'vulnerable').length,
    warnings: auditResults.filter(r => r.status === 'warning').length,
    info: auditResults.filter(r => r.status === 'info').length,
    critical: auditResults.filter(r => r.severity === 'critical').length,
    high: auditResults.filter(r => r.severity === 'high').length,
    medium: auditResults.filter(r => r.severity === 'medium').length,
    low: auditResults.filter(r => r.severity === 'low').length
  }
  
  // Calculate security score
  const maxScore = summary.totalControls * 3
  const actualScore = auditResults.reduce((score, result) => {
    return score + (result.status === 'secure' ? 3 :
                   result.status === 'warning' ? 1 :
                   result.status === 'vulnerable' ? -1 : 0)
  }, 0)
  
  const securityScore = Math.max(0, Math.round((actualScore / maxScore) * 100))
  
  // Determine security posture
  const securityPosture = securityScore >= 90 ? 'excellent' :
                         securityScore >= 75 ? 'good' :
                         securityScore >= 60 ? 'acceptable' :
                         securityScore >= 40 ? 'concerning' : 'critical'
  
  logAuditResult('Security Assessment', 'Overall posture',
    securityPosture === 'excellent' || securityPosture === 'good' ? 'secure' : 'vulnerable',
    securityPosture === 'critical' ? 'critical' : securityPosture === 'concerning' ? 'high' : 'medium',
    `Security posture: ${securityScore}% (${securityPosture})`,
    undefined,
    { summary, securityScore, securityPosture, domains }
  )
  
  // Generate prioritized recommendations
  const criticalIssues = auditResults.filter(r => r.severity === 'critical' && r.status === 'vulnerable')
  const highIssues = auditResults.filter(r => r.severity === 'high' && r.status === 'vulnerable')
  
  const prioritizedRecommendations = []
  
  if (criticalIssues.length > 0) {
    prioritizedRecommendations.push(`URGENT: Address ${criticalIssues.length} critical security vulnerabilities`)
    criticalIssues.forEach(issue => {
      if (issue.recommendation) {
        prioritizedRecommendations.push(`- ${issue.recommendation}`)
      }
    })
  }
  
  if (highIssues.length > 0) {
    prioritizedRecommendations.push(`HIGH PRIORITY: Fix ${highIssues.length} high-severity issues`)
  }
  
  if (securityScore < 75) {
    prioritizedRecommendations.push('Consider comprehensive security review and penetration testing')
  }
  
  if (prioritizedRecommendations.length > 0) {
    logAuditResult('Security Assessment', 'Action plan', 'warning', 'high',
      'Security improvements required',
      'Follow prioritized action plan',
      { prioritizedRecommendations: prioritizedRecommendations.slice(0, 10) })
  }
  
  return {
    summary,
    securityScore,
    securityPosture,
    prioritizedRecommendations,
    domains
  }
}

async function main() {
  console.log('🔒 Comprehensive Security Audit\n')
  console.log('=' .repeat(60))
  
  // Run all security audits
  await auditAuthenticationSecurity()
  await auditDataProtection() 
  await auditAPISecurityAndRateLimit()
  await auditInfrastructureSecurity()
  
  // Generate comprehensive security report
  const securityReport = await generateSecurityReport()
  
  // Final summary
  console.log('\n' + '='.repeat(60))
  console.log('\n🔒 Security Audit Summary\n')
  
  console.log(`Security Score: ${securityReport.securityScore}% (${securityReport.securityPosture})`)
  console.log(`Total Controls: ${securityReport.summary.totalControls}`)
  console.log(`✅ Secure: ${securityReport.summary.secure}`)
  console.log(`⚠️  Warnings: ${securityReport.summary.warnings}`)
  console.log(`❌ Vulnerable: ${securityReport.summary.vulnerable}`)
  console.log(`🔥 Critical: ${securityReport.summary.critical}`)
  console.log(`🔴 High: ${securityReport.summary.high}`)
  
  if (securityReport.summary.critical === 0 && securityReport.summary.vulnerable <= 2) {
    console.log('\n🎉 Security audit completed with acceptable results!')
    if (securityReport.summary.warnings > 0) {
      console.log('⚠️  Please address warnings for improved security posture.')
    }
    process.exit(0)
  } else {
    console.log('\n❌ Critical security issues detected!')
    console.log('🚨 IMMEDIATE ACTION REQUIRED')
    
    if (securityReport.prioritizedRecommendations.length > 0) {
      console.log('\n📋 Priority Actions:')
      securityReport.prioritizedRecommendations.slice(0, 5).forEach(rec => {
        console.log(`   • ${rec}`)
      })
    }
    
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal security audit error:', error)
  process.exit(1)
})