import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { ApiErrors, logError } from '@/lib/api/errors'
import { validateQueryParams } from '@/lib/api/validation'
import { z } from 'zod'

const getProvidersQuerySchema = z.object({
  serviceId: z.string().uuid().optional(),
  zipCode: z.string().optional(),
})

// Get all providers
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const tenantId = resolveTenantFromRequest(request)
    if (!tenantId) {
      return ApiErrors.badRequest('Tenant context is required')
    }

    const queryValidation = validateQueryParams(request, getProvidersQuerySchema)
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { serviceId, zipCode } = queryValidation.data

    const supabase = createServerSupabase(tenantId)
    let query = supabase
      .from('provider_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_verified', true)

    // Optional: filter by service if provided via junction table
    if (serviceId) {
      // Filter providers who offer the serviceId
      const { data: providerServices, error: psError } = await supabase
        .from('provider_services')
        .select('provider_id')
        .eq('tenant_id', tenantId)
        .eq('service_id', serviceId)
      if (psError) {
        logError('providers', psError, { operation: 'fetch_provider_services' })
        return ApiErrors.internalError('Failed to load providers')
      }
      const allowedIds = (providerServices ?? []).map((r) => r.provider_id)
      if (allowedIds.length > 0) {
        // @ts-ignore: in() types
        query = query.in('id', allowedIds)
      } else {
        return NextResponse.json({ providers: [] })
      }
    }

    // zipCode filtering would require geo/addresses; skipping pending schema
    void zipCode

    const { data, error } = await query
    if (error) {
      logError('providers', error, { operation: 'fetch_providers' })
      return ApiErrors.internalError('Failed to load providers')
    }

    return NextResponse.json({ providers: data ?? [] })
  } catch (error) {
    logError('providers', error)
    return ApiErrors.internalError('An unexpected error occurred')
  }
}, RateLimitPresets.moderate)
