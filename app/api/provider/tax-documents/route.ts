import { NextRequest, NextResponse } from 'next/server'
import { generateForm1099Data } from '@/lib/usa-compliance'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const year = searchParams.get('year')
    const format = searchParams.get('format') || 'json'

    if (!providerId || !year) {
      return NextResponse.json(
        { error: 'providerId and year are required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    // Verify provider exists
    const { data: profile, error: profileError } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('id', providerId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Generate 1099 data (providerId here is the provider profile id)
    const taxData = await generateForm1099Data(providerId, parseInt(year))

    if (format === 'pdf') {
      // For now, return JSON. In production, generate actual PDF
      // This would integrate with a PDF generation service
      return NextResponse.json({
        message: 'PDF generation not yet implemented',
        data: taxData
      })
    }

    return NextResponse.json(taxData)
  } catch (error) {
    console.error('[v0] tax-documents GET error:', error)
    return NextResponse.json(
      { error: 'Failed to generate tax document' },
      { status: 500 }
    )
  }
}

