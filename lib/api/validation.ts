import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { ApiErrors } from './errors'

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Date validation (YYYY-MM-DD)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  // Time validation (HH:MM)
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  
  // Email validation
  email: z.string().email('Invalid email address'),
  
  // Phone number (basic validation)
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  
  // Positive integer
  positiveInt: z.number().int().positive('Must be a positive integer'),
  
  // Non-negative number
  nonNegativeNumber: z.number().nonnegative('Must be a non-negative number'),
  
  // Rating (1-5)
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
}

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))
      
      return {
        success: false,
        response: ApiErrors.validationError('Validation failed', { errors }),
      }
    }
    
    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: ApiErrors.badRequest('Invalid JSON in request body'),
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string | string[]> = {}
    
    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      if (params[key]) {
        // Handle multiple values for the same key
        const existing = params[key]
        params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
      } else {
        params[key] = value
      }
    }
    
    const result = schema.safeParse(params)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))
      
      return {
        success: false,
        response: ApiErrors.validationError('Invalid query parameters', { errors }),
      }
    }
    
    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: ApiErrors.badRequest('Invalid query parameters'),
    }
  }
}

/**
 * Validates route parameters against a Zod schema
 */
export function validateRouteParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const result = schema.safeParse(params)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))
      
      return {
        success: false,
        response: ApiErrors.validationError('Invalid route parameters', { errors }),
      }
    }
    
    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: ApiErrors.badRequest('Invalid route parameters'),
    }
  }
}

/**
 * Common request validation schemas
 */
export const RequestSchemas = {
  // Booking creation
  createBooking: z.object({
    customerId: ValidationSchemas.uuid.optional(),
    serviceId: ValidationSchemas.uuid,
    date: ValidationSchemas.date,
    time: ValidationSchemas.time,
    addressId: ValidationSchemas.uuid,
    notes: z.string().optional(),
    durationHours: ValidationSchemas.positiveInt.optional(),
  }),
  
  // Review creation
  createReview: z.object({
    bookingId: ValidationSchemas.uuid,
    providerId: ValidationSchemas.uuid,
    rating: ValidationSchemas.rating,
    comment: z.string().optional(),
  }),
  
  // Availability query
  availabilityQuery: z.object({
    date: ValidationSchemas.date.optional(),
    dates: z.string().optional(), // Comma-separated dates
    providerId: ValidationSchemas.uuid.optional(),
    durationHours: z.coerce.number().int().min(1).max(8).optional(),
  }),
  
  // Provider availability update
  updateAvailability: z.object({
    providerId: ValidationSchemas.uuid,
    availability: z.array(
      z.object({
        date: ValidationSchemas.date,
        time_slots: z.array(z.string()),
      })
    ),
  }),
  
  // Contact form
  contactForm: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: ValidationSchemas.email,
    phone: ValidationSchemas.phone.optional(),
    serviceType: z.string().min(1, 'Service type is required'),
    message: z.string().min(1, 'Message is required'),
  }),
}
