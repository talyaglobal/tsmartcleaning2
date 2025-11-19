import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

// Get provider services
export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get provider services with service details
    const { data, error } = await supabase
      .from('provider_services')
      .select(`
        id,
        custom_price,
        service:services (
          id,
          name,
          category,
          description,
          base_price,
          unit
        )
      `)
      .eq('provider_id', providerId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('[provider/services] get error:', error)
      return NextResponse.json({ error: 'Failed to get services' }, { status: 500 })
    }

    // Transform data to match component expectations
    const services = (data || []).map((ps: any) => ({
      id: ps.id,
      name: ps.service?.name || '',
      category: ps.service?.category || '',
      description: ps.service?.description || '',
      price: ps.custom_price || ps.service?.base_price || 0,
      priceUnit: ps.service?.unit || 'flat_rate',
    }))

    return NextResponse.json({ services })
  } catch (error) {
    console.error('[provider/services] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add or update provider service
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { providerId, service } = await request.json()

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    if (!service || !service.name) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Find or create service in services table
    let serviceId: string

    // Check if service exists
    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('name', service.name)
      .eq('category', service.category)
      .eq('tenant_id', tenantId)
      .single()

    if (existingService) {
      serviceId = existingService.id
    } else {
      // Create new service
      const { data: newService, error: createError } = await supabase
        .from('services')
        .insert({
          name: service.name,
          category: service.category || 'residential',
          description: service.description || null,
          base_price: service.price || 0,
          unit: service.priceUnit || 'flat_rate',
          tenant_id: tenantId,
        })
        .select('id')
        .single()

      if (createError || !newService) {
        console.error('[provider/services] create service error:', createError)
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
      }

      serviceId = newService.id
    }

    // Add or update provider service relationship
    const { data: providerService, error: upsertError } = await supabase
      .from('provider_services')
      .upsert(
        {
          provider_id: providerId,
          service_id: serviceId,
          custom_price: service.price || null,
          tenant_id: tenantId,
        },
        {
          onConflict: 'provider_id,service_id',
        }
      )
      .select('id')
      .single()

    if (upsertError) {
      console.error('[provider/services] upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to save service' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Service saved successfully',
      serviceId: providerService?.id,
    })
  } catch (error) {
    console.error('[provider/services] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update provider service
export async function PUT(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { serviceId, service } = await request.json()

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Update provider service
    const { error: updateError } = await supabase
      .from('provider_services')
      .update({
        custom_price: service.price || null,
      })
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('[provider/services] update error:', updateError)
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
    }

    // Also update the base service if needed
    if (service.name || service.description) {
      // Get the service_id from provider_services
      const { data: ps } = await supabase
        .from('provider_services')
        .select('service_id')
        .eq('id', serviceId)
        .single()

      if (ps?.service_id) {
        await supabase
          .from('services')
          .update({
            name: service.name,
            description: service.description,
            base_price: service.price,
            unit: service.priceUnit,
          })
          .eq('id', ps.service_id)
          .eq('tenant_id', tenantId)
      }
    }

    return NextResponse.json({ message: 'Service updated successfully' })
  } catch (error) {
    console.error('[provider/services] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete provider service
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error: deleteError } = await supabase
      .from('provider_services')
      .delete()
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('[provider/services] delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Service removed successfully' })
  } catch (error) {
    console.error('[provider/services] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

