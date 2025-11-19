import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/[id]/download
 * Downloads a report file from Supabase Storage with access controls
 * This is a general endpoint for company users to download their reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'html'

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*, company_id, property_id')
      .eq('id', params.id)
      .single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Check access controls - user must be company owner or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'root_admin'
    const isCompanyOwner = report.company_id
      ? await checkCompanyAccess(supabase, user.id, report.company_id)
      : false

    if (!isAdmin && !isCompanyOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get file URL/path
    const fileUrl = report.pdf_url || report.storage_path

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Report file not found' },
        { status: 404 }
      )
    }

    // Check if it's a Supabase Storage URL or path
    const isStoragePath = fileUrl.startsWith('reports/') || !fileUrl.startsWith('http')
    
    if (isStoragePath) {
      // Extract storage path
      const storagePath = fileUrl.startsWith('reports/') 
        ? fileUrl 
        : `reports/${fileUrl}`

      // Download from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('reports')
        .download(storagePath)

      if (downloadError || !fileData) {
        console.error('[reports/download] Storage download error:', downloadError)
        return NextResponse.json(
          { error: 'Failed to download report file' },
          { status: 500 }
        )
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Determine content type and file extension
      const isHTML = storagePath.endsWith('.html') || format === 'html'
      const isPDF = storagePath.endsWith('.pdf') || format === 'pdf'
      
      const contentType = isHTML
        ? 'text/html'
        : isPDF
        ? 'application/pdf'
        : 'application/octet-stream'
      
      const fileExt = isHTML ? 'html' : isPDF ? 'pdf' : 'txt'

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${report.title || 'report'}-${params.id}.${fileExt}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } else {
      // External URL - redirect
      return NextResponse.redirect(fileUrl)
    }
  } catch (error) {
    console.error('[reports/download] Error:', error)
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to check if user has access to a company
 */
async function checkCompanyAccess(
  supabase: any,
  userId: string,
  companyId: string
): Promise<boolean> {
  const { data: company } = await supabase
    .from('companies')
    .select('owner_id')
    .eq('id', companyId)
    .single()

  return company?.owner_id === userId
}

