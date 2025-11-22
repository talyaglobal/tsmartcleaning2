import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { handleApiError, ApiErrors, logError } from '@/lib/api/errors'
import { validateQueryParams } from '@/lib/api/validation'
import { z } from 'zod'

// Get all services
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const querySchema = z.object({
      category: z.enum(['residential', 'commercial']).optional(),
    })
    
    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }
    
    const { category } = validation.data
    
    // Resolve tenant from request (for RLS policies)
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
    
    // Filter by category if provided
    if (category === 'residential') {
      // Residential services: residential, deep, move, post-construction, window, carpet, eco-friendly
      query = query.in('category', ['residential', 'deep', 'move', 'post-construction', 'window', 'carpet', 'eco-friendly'])
    } else if (category === 'commercial') {
      // Commercial services: commercial and related categories
      query = query.in('category', ['commercial', 'post-construction', 'window', 'carpet', 'eco-friendly'])
    }
    
    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      logError('services', error, { 
        operation: 'list_services', 
        category,
        tenantId: tenantId || 'none',
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details
      })
      return ApiErrors.databaseError('Failed to load services', { 
        error: error.message,
        code: error.code 
      })
    }

    return NextResponse.json({ services: data ?? [] })
  } catch (error) {
    return handleApiError('services', error, { 
      operation: 'list_services',
      category: request.nextUrl.searchParams.get('category') || 'none'
    })
  }
}
