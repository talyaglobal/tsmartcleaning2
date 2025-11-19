import { NextRequest, NextResponse } from 'next/server'
import { globalCache } from '@/lib/cache'

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  identifier?: string // Optional custom identifier (defaults to IP)
}

interface RateLimitEntry {
  requests: number
  resetAt: number
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
 * Gets identifier for rate limiting (IP address or custom identifier)
 */
function getIdentifier(request: NextRequest, customIdentifier?: string): string {
  if (customIdentifier) {
    return customIdentifier
  }
  return getClientIp(request) || 'unknown'
}

/**
 * Checks rate limiting for a request
 * Returns null if allowed, or a NextResponse with 429 if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const identifier = getIdentifier(request, config.identifier)
  const rateLimitKey = `rate_limit:${identifier}`
  const now = Date.now()
  const resetAt = now + config.windowSeconds * 1000

  const cached = globalCache.get<RateLimitEntry>(rateLimitKey)

  // If no entry or window expired, create new entry
  if (!cached || now >= cached.resetAt) {
    const newEntry: RateLimitEntry = {
      requests: 1,
      resetAt,
    }
    globalCache.set(rateLimitKey, newEntry, config.windowSeconds)
    return null // Allowed
  }

  // Check if limit exceeded
  if (cached.requests >= config.maxRequests) {
    const retryAfter = Math.ceil((cached.resetAt - now) / 1000)
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(cached.resetAt / 1000).toString(),
        },
      }
    )
  }

  // Increment request count
  cached.requests++
  globalCache.set(rateLimitKey, cached, config.windowSeconds)

  const remaining = config.maxRequests - cached.requests
  const retryAfter = Math.ceil((cached.resetAt - now) / 1000)

  // Return null (allowed) but set rate limit headers
  // Note: We can't set headers here since we're not returning a response
  // Headers should be set in the actual route handler
  return null
}

/**
 * Rate limit middleware factory
 * Returns a middleware function that checks rate limits before executing the handler
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const rateLimitResult = checkRateLimit(request, config)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const response = await handler(request, context)
    
    // Add rate limit headers to response
    const identifier = getIdentifier(request, config.identifier)
    const rateLimitKey = `rate_limit:${identifier}`
    const cached = globalCache.get<RateLimitEntry>(rateLimitKey)
    
    if (cached) {
      const remaining = Math.max(0, config.maxRequests - cached.requests)
      const resetAt = Math.ceil(cached.resetAt / 1000)
      
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', resetAt.toString())
    }

    return response
  }
}

/**
 * Default rate limit configurations for common use cases
 */
export const RateLimitPresets = {
  // Strict rate limiting for sensitive endpoints (contact forms, newsletter)
  strict: {
    maxRequests: 5,
    windowSeconds: 60, // 5 requests per minute
  },
  // Moderate rate limiting for public APIs
  moderate: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
  },
  // Lenient rate limiting for read-heavy endpoints
  lenient: {
    maxRequests: 1000,
    windowSeconds: 60, // 1000 requests per minute
  },
  // Analytics tracking - allow more requests
  analytics: {
    maxRequests: 1000,
    windowSeconds: 60, // 1000 requests per minute
  },
} as const

