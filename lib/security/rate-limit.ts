/**
 * Global rate limiting utility for API routes
 * Provides IP-based and identifier-based rate limiting
 */

import { NextRequest } from 'next/server'
import { globalCache } from '@/lib/cache'

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  identifier?: string // Optional custom identifier (e.g., userId, email)
}

interface RateLimitEntry {
  count: number
  resetAt: number
  blockedUntil?: number
}

/**
 * Gets client IP from request
 */
function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  return null
}

/**
 * Checks rate limit for a request
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with allowed status, remaining requests, and retryAfter if blocked
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): {
  allowed: boolean
  remaining: number
  retryAfter?: number
} {
  const { maxRequests, windowSeconds, identifier } = config
  
  // Use custom identifier if provided, otherwise use IP
  const ip = getClientIp(request)
  const keyIdentifier = identifier || (ip ? `ip:${ip}` : 'unknown')
  const rateLimitKey = `rate_limit:${keyIdentifier}`
  
  const now = Date.now()
  const cached = globalCache.get<RateLimitEntry>(rateLimitKey)
  
  // If blocked, check if block period has expired
  if (cached?.blockedUntil && cached.blockedUntil > now) {
    const retryAfter = Math.ceil((cached.blockedUntil - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    }
  }
  
  // Reset if window has expired or no entry exists
  if (!cached || now >= cached.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + (windowSeconds * 1000),
    }
    globalCache.set(rateLimitKey, newEntry, windowSeconds)
    return {
      allowed: true,
      remaining: maxRequests - 1,
    }
  }
  
  // Check if limit exceeded
  if (cached.count >= maxRequests) {
    // Block for the remainder of the window
    const blockedUntil = cached.resetAt
    const updatedEntry: RateLimitEntry = {
      ...cached,
      blockedUntil,
    }
    globalCache.set(rateLimitKey, updatedEntry, windowSeconds)
    
    const retryAfter = Math.ceil((blockedUntil - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    }
  }
  
  // Increment count
  cached.count += 1
  globalCache.set(rateLimitKey, cached, windowSeconds)
  
  return {
    allowed: true,
    remaining: maxRequests - cached.count,
  }
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    maxRequests: 5,
    windowSeconds: 15 * 60, // 15 minutes
  },
  // Moderate rate limiting for general API endpoints
  api: {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
  },
  // Lenient rate limiting for public read endpoints
  public: {
    maxRequests: 200,
    windowSeconds: 60, // 1 minute
  },
  // Very strict rate limiting for sensitive operations
  sensitive: {
    maxRequests: 3,
    windowSeconds: 15 * 60, // 15 minutes
  },
} as const

/**
 * Rate limit middleware helper
 * Returns a response with 429 status if rate limit exceeded
 */
export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(request, config)
  
  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + (result.retryAfter || 60) * 1000).toISOString(),
        },
      }
    )
  }
  
  return null
}

