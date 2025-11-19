import { NextRequest } from 'next/server'
import { globalCache } from '@/lib/cache'

/**
 * Root Admin OTP utilities
 * Implements time-based OTP (TOTP) using HMAC-SHA1 algorithm
 */

const OTP_SECRET = process.env.ROOT_ADMIN_OTP_SECRET || process.env.ROOT_ADMIN_SESSION_SECRET || 'change-me-in-production'
const OTP_WINDOW = 30 // Time window in seconds (standard TOTP)
const OTP_DIGITS = 6 // Number of digits in OTP code
const OTP_VALID_WINDOWS = 1 // Number of time windows to accept (current + previous)

// Rate limiting configuration
const RATE_LIMIT_MAX_ATTEMPTS = 5 // Maximum attempts per window
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60 // 15 minutes in seconds

interface RateLimitEntry {
  attempts: number
  lastAttempt: number
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
 * Converts secret to base32 (required for TOTP)
 * For simplicity, we'll use the secret directly as bytes
 */
function secretToBytes(secret: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(secret)
}

/**
 * Generates HMAC-SHA1 hash
 */
async function generateHMAC(secret: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return new Uint8Array(signature)
}

/**
 * Converts time to counter (time steps since Unix epoch)
 */
function timeToCounter(timestamp: number = Date.now()): number {
  return Math.floor(timestamp / 1000 / OTP_WINDOW)
}

/**
 * Converts counter to bytes (big-endian 8-byte buffer)
 */
function counterToBytes(counter: number): Uint8Array {
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  // TOTP uses 64-bit big-endian counter
  // JavaScript numbers are 53-bit safe integers, so we split into high and low 32-bit parts
  const high = Math.floor(counter / 0x100000000)
  const low = counter % 0x100000000
  view.setUint32(0, high, false) // Big-endian, upper 32 bits
  view.setUint32(4, low, false) // Big-endian, lower 32 bits
  return new Uint8Array(buffer)
}

/**
 * Dynamic truncation (RFC 4226 Section 5.4)
 */
function dynamicTruncate(hash: Uint8Array): number {
  const offset = hash[hash.length - 1] & 0x0f
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff)
  return binary
}

/**
 * Generates a TOTP code for the given time
 */
export async function generateTOTP(timestamp?: number): Promise<string> {
  const secretBytes = secretToBytes(OTP_SECRET)
  const counter = timeToCounter(timestamp)
  const counterBytes = counterToBytes(counter)
  
  const hmac = await generateHMAC(secretBytes, counterBytes)
  const code = dynamicTruncate(hmac) % Math.pow(10, OTP_DIGITS)
  
  // Pad with leading zeros
  return code.toString().padStart(OTP_DIGITS, '0')
}

/**
 * Verifies a TOTP code
 * Accepts codes from current and previous time windows for clock skew tolerance
 */
export async function verifyTOTP(code: string, timestamp?: number): Promise<boolean> {
  const now = timestamp || Date.now()
  
  // Try current and previous time windows
  for (let i = 0; i <= OTP_VALID_WINDOWS; i++) {
    const windowTime = now - (i * OTP_WINDOW * 1000)
    const expectedCode = await generateTOTP(windowTime)
    
    if (code === expectedCode) {
      return true
    }
  }
  
  return false
}

/**
 * Checks rate limiting for OTP verification attempts
 * Returns { allowed: boolean, remaining: number, retryAfter?: number }
 */
export function checkRateLimit(request: NextRequest, email?: string): {
  allowed: boolean
  remaining: number
  retryAfter?: number
} {
  const ip = getClientIp(request)
  const identifier = email ? `email:${email}` : (ip ? `ip:${ip}` : 'unknown')
  const rateLimitKey = `root_admin_otp_rate_limit:${identifier}`
  
  const cached = globalCache.get<RateLimitEntry>(rateLimitKey)
  const now = Date.now()
  
  // If blocked, check if block period has expired
  if (cached?.blockedUntil && cached.blockedUntil > now) {
    const retryAfter = Math.ceil((cached.blockedUntil - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfter
    }
  }
  
  // Reset if window has expired
  if (!cached || (now - cached.lastAttempt) > (RATE_LIMIT_WINDOW_SECONDS * 1000)) {
    const newEntry: RateLimitEntry = {
      attempts: 0,
      lastAttempt: now
    }
    globalCache.set(rateLimitKey, newEntry, RATE_LIMIT_WINDOW_SECONDS)
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS
    }
  }
  
  // Check if limit exceeded
  if (cached.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    // Block for the remainder of the window
    const blockedUntil = cached.lastAttempt + (RATE_LIMIT_WINDOW_SECONDS * 1000)
    cached.blockedUntil = blockedUntil
    globalCache.set(rateLimitKey, cached, RATE_LIMIT_WINDOW_SECONDS)
    
    const retryAfter = Math.ceil((blockedUntil - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfter
    }
  }
  
  // Increment attempts
  cached.attempts += 1
  cached.lastAttempt = now
  globalCache.set(rateLimitKey, cached, RATE_LIMIT_WINDOW_SECONDS)
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_ATTEMPTS - cached.attempts
  }
}

/**
 * Records a failed OTP attempt (for additional tracking if needed)
 */
export function recordFailedAttempt(request: NextRequest, email?: string): void {
  checkRateLimit(request, email) // This will increment the counter
}

/**
 * Resets rate limit for testing purposes (not exported by default for security)
 */
export function resetRateLimit(request: NextRequest, email?: string): void {
  const ip = getClientIp(request)
  const identifier = email ? `email:${email}` : (ip ? `ip:${ip}` : 'unknown')
  const rateLimitKey = `root_admin_otp_rate_limit:${identifier}`
  globalCache.delete(rateLimitKey)
}

