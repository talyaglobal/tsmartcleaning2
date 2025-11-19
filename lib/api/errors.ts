import { NextResponse } from 'next/server'
import { logger } from '@/lib/logging'

/**
 * Standard API error response structure
 */
export interface ApiError {
  error: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Error codes for consistent error handling
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  code?: ErrorCode,
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  const response: ApiError = { error }
  if (code) {
    response.code = code
  }
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Helper functions for common error responses
 */
export const ApiErrors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse(message, 400, ErrorCode.BAD_REQUEST, details),
  
  unauthorized: (message = 'Unauthorized') =>
    createErrorResponse(message, 401, ErrorCode.UNAUTHORIZED),
  
  forbidden: (message = 'Forbidden') =>
    createErrorResponse(message, 403, ErrorCode.FORBIDDEN),
  
  notFound: (message = 'Resource not found') =>
    createErrorResponse(message, 404, ErrorCode.NOT_FOUND),
  
  conflict: (message: string) =>
    createErrorResponse(message, 409, ErrorCode.CONFLICT),
  
  validationError: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse(message, 400, ErrorCode.VALIDATION_ERROR, details),
  
  internalError: (message = 'Internal server error', details?: Record<string, unknown>) =>
    createErrorResponse(message, 500, ErrorCode.INTERNAL_ERROR, details),
  
  databaseError: (message = 'Database operation failed', details?: Record<string, unknown>) =>
    createErrorResponse(message, 500, ErrorCode.DATABASE_ERROR, details),
  
  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    createErrorResponse(message, 503, ErrorCode.SERVICE_UNAVAILABLE),
}

/**
 * Logs an error with context information
 * @deprecated Use logger.error() or logger.critical() from '@/lib/logging' instead
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorObj = error instanceof Error ? error : new Error(errorMessage)
  
  logger.error(
    errorMessage,
    {
      context,
      ...metadata,
    },
    errorObj
  )
}

/**
 * Handles errors in API routes with consistent logging and response
 */
export function handleApiError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): NextResponse<ApiError> {
  logError(context, error, metadata)
  
  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error messages that indicate client errors
    if (error.message.includes('Missing') || error.message.includes('required')) {
      return ApiErrors.badRequest(error.message)
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('authentication')) {
      return ApiErrors.unauthorized(error.message)
    }
    
    if (error.message.includes('Forbidden') || error.message.includes('permission')) {
      return ApiErrors.forbidden(error.message)
    }
    
    if (error.message.includes('not found')) {
      return ApiErrors.notFound(error.message)
    }
    
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return ApiErrors.conflict(error.message)
    }
  }
  
  // Default to internal server error
  return ApiErrors.internalError()
}
