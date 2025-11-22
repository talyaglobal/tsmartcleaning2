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
    
    // Resolve tenant from request (optional - services can be public)
    // Service role bypasses RLS, so we can show all active services
    // If tenant is provided, we can optionally filter by it
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)
    
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
    
    // Optional: Filter by tenant_id if provided and you want tenant-scoped services
    // For now, we show all active services regardless of tenant (public endpoint)
    // Uncomment below to enable tenant filtering:
    // if (tenantId) {
    //   query = query.eq('tenant_id', tenantId)
    // }
    
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
      // Enhanced error logging with full context
      logError('services', error, { 
        operation: 'list_services', 
        category: category || 'all',
        tenantId: tenantId || 'none',
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      })
      
      // Return detailed error for debugging
      const errorDetails: Record<string, unknown> = {
        error: error.message,
        code: error.code
      }
      
      if (error.hint) {
        errorDetails.hint = error.hint
      }
      
      if (error.details) {
        errorDetails.details = error.details
      }
      
      return ApiErrors.databaseError(
        process.env.NODE_ENV === 'development' 
          ? `Failed to load services: ${error.message}` 
          : 'Failed to load services',
        errorDetails
      )
    }

    return NextResponse.json({ services: data ?? [] })
  } catch (error) {
    return handleApiError('services', error, { 
      operation: 'list_services',
      category: request.nextUrl.searchParams.get('category') || 'none'
    })
  }
}
