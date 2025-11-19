import { NextRequest, NextResponse } from 'next/server'

const SESSION_SECRET = process.env.ROOT_ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'change-me-in-production'
const SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const COOKIE_NAME = 'root_admin_session'

interface RootAdminSession {
  email: string
  expiresAt: number
  ip?: string
}

/**
 * Creates a signed session token for root admin
 */
async function createSessionToken(session: RootAdminSession): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(session))
  
  // Use Web Crypto API to create HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, data)
  
  // Encode session and signature as base64
  const sessionB64 = btoa(String.fromCharCode(...new Uint8Array(data)))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  
  return `${sessionB64}.${sigB64}`
}

/**
 * Verifies and decodes a session token
 */
async function verifySessionToken(token: string): Promise<RootAdminSession | null> {
  try {
    const [sessionB64, sigB64] = token.split('.')
    if (!sessionB64 || !sigB64) return null
    
    const encoder = new TextEncoder()
    const sessionData = Uint8Array.from(atob(sessionB64), c => c.charCodeAt(0))
    const signature = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    
    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, sessionData)
    if (!isValid) return null
    
    // Decode session
    const session: RootAdminSession = JSON.parse(new TextDecoder().decode(sessionData))
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      return null
    }
    
    return session
  } catch {
    return null
  }
}

/**
 * Creates a root admin session cookie
 */
export async function createRootAdminSession(
  email: string,
  request?: NextRequest
): Promise<string> {
  const session: RootAdminSession = {
    email,
    expiresAt: Date.now() + SESSION_DURATION,
    ip: request ? getClientIp(request) : undefined,
  }
  
  return createSessionToken(session)
}

/**
 * Verifies root admin session from request
 */
export async function verifyRootAdminSession(
  request: NextRequest
): Promise<{ isValid: boolean; email?: string; error?: string }> {
  // Check cookie first
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  
  if (cookieToken) {
    const session = await verifySessionToken(cookieToken)
    if (session) {
      // Optional: Verify IP hasn't changed (can be disabled for mobile users)
      const currentIp = getClientIp(request)
      if (session.ip && currentIp && session.ip !== currentIp) {
        // Log but don't block - IP can change with mobile networks
        console.warn('[root-admin] IP mismatch:', { sessionIp: session.ip, currentIp })
      }
      
      return { isValid: true, email: session.email }
    }
  }
  
  // Fallback: Check legacy cookie for backward compatibility
  const legacyCookie = request.cookies.get('root_admin')?.value
  if (legacyCookie === '1') {
    // Migrate to new session
    const allowEmail = process.env.ROOT_ADMIN_EMAIL ?? 'admin@tsmartcleaning.com'
    return { isValid: true, email: allowEmail }
  }
  
  return { isValid: false, error: 'No valid session found' }
}

/**
 * Sets root admin session cookie in response
 */
export async function setRootAdminSessionCookie(
  response: NextResponse,
  email: string,
  request?: NextRequest
): Promise<void> {
  const token = await createRootAdminSession(email, request)
  
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
  })
  
  // Clear legacy cookie if it exists
  response.cookies.delete('root_admin')
}

/**
 * Clears root admin session cookie
 */
export function clearRootAdminSession(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME)
  response.cookies.delete('root_admin')
}

/**
 * Gets client IP from request
 */
function getClientIp(request: NextRequest): string | undefined {
  // Check various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  return undefined
}

