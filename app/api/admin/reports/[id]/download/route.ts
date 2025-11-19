import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/reports/[id]/download
 * Downloads a report file from Supabase Storage with access controls
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { supabase: authSupabase, tenantId: authTenantId, user },
    { params }: { params: { id: string } }
  ) => {
    try {
      const { searchParams } = new URL(request.url)
      const format = searchParams.get('format') || 'json'

      const tenantId = resolveTenantFromRequest(request) || authTenantId
      const supabase = authSupabase || createServerSupabase(tenantId || undefined)

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

      // Check access controls (admin can access any report, or user owns company)
      const isAdmin = user.role === 'admin' || user.role === 'root_admin'
      const isCompanyOwner = report.company_id
        ? await checkCompanyAccess(supabase, user.id, report.company_id)
        : false

      if (!isAdmin && !isCompanyOwner) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

    // Handle CSV format
    if (format === 'csv') {
      const csv = convertReportToCSV(report)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report.title || 'report'}-${params.id}.csv"`,
        },
      })
    }

    // Handle PDF/HTML format - download from storage
    if (format === 'pdf' || format === 'html') {
      const pdfUrl = report.pdf_url || report.storage_path

      if (!pdfUrl) {
        return NextResponse.json(
          { error: 'Report file not found' },
          { status: 404 }
        )
      }

      // Check if it's a Supabase Storage URL or path
      const isStoragePath = pdfUrl.startsWith('reports/') || !pdfUrl.startsWith('http')
      
      if (isStoragePath) {
        // Extract storage path (handle both full paths and relative paths)
        const storagePath = pdfUrl.startsWith('reports/') 
          ? pdfUrl 
          : `reports/${pdfUrl}`

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

        // Determine content type
        const contentType = storagePath.endsWith('.html')
          ? 'text/html'
          : storagePath.endsWith('.pdf')
          ? 'application/pdf'
          : 'application/octet-stream'

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${report.title || 'report'}-${params.id}.${format === 'pdf' ? 'pdf' : 'html'}"`,
            'Cache-Control': 'private, max-age=3600',
          },
        })
      } else {
        // External URL - redirect or proxy
        return NextResponse.redirect(pdfUrl)
      }
    }

    // Default: return JSON
    return NextResponse.json(report)
  } catch (error) {
    console.error('[reports/download] Error:', error)
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    )
  }
  },
  {
    requireAdmin: true,
  }
)

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

function convertReportToCSV(report: any): string {
  const rows: string[] = []
  rows.push('Report Information')
  rows.push(`Title,${report.title || ''}`)
  rows.push(`Type,${report.report_type || ''}`)
  rows.push(`Generated At,${report.generated_at || ''}`)
  rows.push('')

  if (report.data) {
    if (report.data.summary) {
      rows.push('Summary')
      for (const [key, value] of Object.entries(report.data.summary)) {
        rows.push(`${key},${value}`)
      }
      rows.push('')
    }
  }

  return rows.join('\n')
}

