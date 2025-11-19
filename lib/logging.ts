/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with Sentry integration for log aggregation.
 * All logs are sent to Sentry for centralized monitoring and retention.
 * 
 * Log Retention Policy:
 * - Critical logs (errors, security events): 90 days
 * - Warning logs: 30 days
 * - Info logs: 7 days
 * - Debug logs: 1 day
 * 
 * Critical Logs Identified:
 * - Authentication failures
 * - Authorization violations
 * - Payment processing errors
 * - Database connection failures
 * - API rate limit violations
 * - Security-related events
 * - Data integrity issues
 * - Third-party service failures
 */

import * as Sentry from '@sentry/nextjs'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogContext {
  tenantId?: string
  userId?: string
  requestId?: string
  [key: string]: unknown
}

/**
 * Sensitive fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'apikey',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'auth',
  'credential',
  'credentials',
  'privateKey',
  'private_key',
  'secretKey',
  'secret_key',
  'sessionId',
  'session_id',
  'cookie',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'socialSecurity',
  'social_security',
  'email', // May want to redact in some contexts
] as const

/**
 * Sanitizes sensitive data from an object before logging
 * Replaces sensitive field values with '[REDACTED]'
 */
function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item))
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeLogData(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  return data
}

/**
 * Critical log categories that require immediate monitoring
 */
export const CRITICAL_LOG_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  PAYMENT: 'payment',
  DATABASE: 'database',
  SECURITY: 'security',
  DATA_INTEGRITY: 'data_integrity',
  THIRD_PARTY: 'third_party',
  RATE_LIMIT: 'rate_limit',
} as const

/**
 * Structured logger that sends logs to Sentry for aggregation
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, skip debug logs unless explicitly enabled
    if (level === LogLevel.DEBUG && process.env.NODE_ENV === 'production') {
      return process.env.ENABLE_DEBUG_LOGS === 'true'
    }
    return true
  }

  /**
   * Logs a message with structured context
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return
    }

    // Sanitize context to remove sensitive data
    const sanitizedContext = sanitizeLogData(context) as LogContext | undefined
    
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...sanitizedContext,
    }

    // Send to Sentry for log aggregation
    if (error) {
      Sentry.captureException(error, {
        level: level === LogLevel.CRITICAL ? 'fatal' : level,
        tags: {
          logLevel: level,
          category: context?.category as string,
        },
        extra: logData,
      })
    } else {
      Sentry.captureMessage(message, {
        level: level === LogLevel.CRITICAL ? 'fatal' : level,
        tags: {
          logLevel: level,
          category: context?.category as string,
        },
        extra: logData,
      })
    }

    // Also log to console for local development
    const consoleMethod = this.getConsoleMethod(level)
    if (error) {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, error, logData)
    } else {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, logData)
    }
  }

  private getConsoleMethod(level: LogLevel): typeof console.error {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARNING:
        return console.warn
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error
      default:
        return console.log
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log warnings that may need attention
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARNING, message, context, error)
  }

  /**
   * Log errors that need investigation
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Log critical errors that require immediate attention
   */
  critical(
    message: string,
    category: keyof typeof CRITICAL_LOG_CATEGORIES,
    context?: LogContext,
    error?: Error
  ): void {
    this.log(
      LogLevel.CRITICAL,
      message,
      {
        ...context,
        category: CRITICAL_LOG_CATEGORIES[category],
        isCritical: true,
      },
      error
    )
  }

  /**
   * Log authentication events (critical for security)
   */
  auth(message: string, context?: LogContext, error?: Error): void {
    this.critical(
      `[AUTH] ${message}`,
      'AUTHENTICATION',
      context,
      error
    )
  }

  /**
   * Log authorization violations (critical for security)
   */
  authorization(message: string, context?: LogContext, error?: Error): void {
    this.critical(
      `[AUTHORIZATION] ${message}`,
      'AUTHORIZATION',
      context,
      error
    )
  }

  /**
   * Log payment processing events (critical for business)
   */
  payment(message: string, context?: LogContext, error?: Error): void {
    this.critical(
      `[PAYMENT] ${message}`,
      'PAYMENT',
      context,
      error
    )
  }

  /**
   * Log database errors (critical for reliability)
   */
  database(message: string, context?: LogContext, error?: Error): void {
    this.critical(
      `[DATABASE] ${message}`,
      'DATABASE',
      context,
      error
    )
  }

  /**
   * Log security events (critical for security)
   */
  security(message: string, context?: LogContext, error?: Error): void {
    this.critical(
      `[SECURITY] ${message}`,
      'SECURITY',
      context,
      error
    )
  }

  /**
   * Log rate limit violations
   */
  rateLimit(message: string, context?: LogContext): void {
    this.critical(
      `[RATE_LIMIT] ${message}`,
      'RATE_LIMIT',
      context
    )
  }

  /**
   * Log third-party service failures
   */
  thirdParty(service: string, message: string, context?: LogContext, error?: Error): void {
    this.critical(
      `[THIRD_PARTY:${service}] ${message}`,
      'THIRD_PARTY',
      { ...context, service },
      error
    )
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Helper function for backward compatibility with existing logError
 * @deprecated Use logger.error() or logger.critical() instead
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  logger.error(
    errorMessage,
    {
      context,
      ...metadata,
    },
    error instanceof Error ? error : new Error(errorMessage)
  )
}

