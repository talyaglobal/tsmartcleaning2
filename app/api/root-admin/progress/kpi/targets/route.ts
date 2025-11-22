import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

// Update KPI targets
export const PATCH = withRootAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { companies, cleaners, revenue } = body

    // Validate input
    if (companies !== undefined && (typeof companies !== 'number' || companies < 0)) {
      return NextResponse.json(
        { error: 'Companies target must be a positive number' },
        { status: 400 }
      )
    }

    if (cleaners !== undefined && (typeof cleaners !== 'number' || cleaners < 0)) {
      return NextResponse.json(
        { error: 'Cleaners target must be a positive number' },
        { status: 400 }
      )
    }

    if (revenue !== undefined && (typeof revenue !== 'number' || revenue < 0)) {
      return NextResponse.json(
        { error: 'Revenue target must be a positive number' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(null)

    // For now, we'll store targets in a simple settings table
    // In a production app, you might want a dedicated kpi_targets table
    const updates = []
    
    if (companies !== undefined) {
      updates.push({
        key: 'kpi_target_companies',
        value: companies.toString(),
        updated_at: new Date().toISOString()
      })
    }

    if (cleaners !== undefined) {
      updates.push({
        key: 'kpi_target_cleaners', 
        value: cleaners.toString(),
        updated_at: new Date().toISOString()
      })
    }

    if (revenue !== undefined) {
      updates.push({
        key: 'kpi_target_revenue',
        value: revenue.toString(),
        updated_at: new Date().toISOString()
      })
    }

    // Update or insert settings
    for (const update of updates) {
      const { error } = await supabase
        .from('settings')
        .upsert(update, { onConflict: 'key' })

      if (error) {
        throw error
      }
    }

    return NextResponse.json({
      message: 'KPI targets updated successfully',
      updated: {
        ...(companies !== undefined && { companies }),
        ...(cleaners !== undefined && { cleaners }),
        ...(revenue !== undefined && { revenue })
      }
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] KPI targets update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Get current KPI targets
export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const supabase = createServerSupabase(null)

    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['kpi_target_companies', 'kpi_target_cleaners', 'kpi_target_revenue'])

    // Default targets
    const defaults = {
      companies: 5,
      cleaners: 25,
      revenue: 1850
    }

    const targets = { ...defaults }

    settings?.forEach(setting => {
      switch (setting.key) {
        case 'kpi_target_companies':
          targets.companies = parseInt(setting.value) || defaults.companies
          break
        case 'kpi_target_cleaners':
          targets.cleaners = parseInt(setting.value) || defaults.cleaners
          break
        case 'kpi_target_revenue':
          targets.revenue = parseInt(setting.value) || defaults.revenue
          break
      }
    })

    return NextResponse.json({ targets })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] KPI targets fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})