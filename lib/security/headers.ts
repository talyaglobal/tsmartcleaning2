/**
 * Security headers configuration
 * Provides utilities for setting security headers in middleware and API routes
 */

import { NextResponse } from 'next/server'

/**
 * Gets allowed origins from environment variable
 */
export function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
  return origins.filter(Boolean)
}

/**
 * Checks if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  const isProduction = process.env.NODE_ENV === 'production'
  const allowedOrigins = getAllowedOrigins()
  
  // In development, allow all origins
  if (!isProduction) return true
  
  // In production, only allow configured origins
  return allowedOrigins.includes(origin)
}

/**
 * Adds security headers to a response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  // Allow self, Supabase, Google Fonts, and Webflow scripts
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ajax.googleapis.com https://cdn.jsdelivr.net https://d3e54v103j8qbb.cloudfront.net https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.sentry.io",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspDirectives)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

/**
 * Adds CORS headers to a response for API routes
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id, x-user-role')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
  }
  
  return response
}

/**
 * Creates a preflight response for OPTIONS requests
 */
export function createPreflightResponse(origin: string | null): NextResponse | null {
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 })
  }
  
  const response = new NextResponse(null, { status: 204 })
  addCorsHeaders(response, origin)
  return response
}

