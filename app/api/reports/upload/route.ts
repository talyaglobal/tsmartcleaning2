import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { resolveTenantFromRequest } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types for reports
const ALLOWED_MIME_TYPES = [
	'text/html',
	'application/pdf',
	'text/plain',
]

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.html', '.pdf', '.txt']

/**
 * POST /api/reports/upload
 * Uploads a report file to Supabase Storage with validation and access controls
 */
export async function POST(request: NextRequest) {
	try {
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

		// Parse form data
		const formData = await request.formData()
		const file = formData.get('file') as File | null
		const companyId = formData.get('companyId') as string | null
		const reportId = formData.get('reportId') as string | null

		if (!file) {
			return NextResponse.json(
				{ error: 'No file provided' },
				{ status: 400 }
			)
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
				},
				{ status: 400 }
			)
		}

		// Validate file type
		const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
		if (
			!ALLOWED_MIME_TYPES.includes(file.type) &&
			!ALLOWED_EXTENSIONS.includes(fileExtension)
		) {
			return NextResponse.json(
				{
					error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
				},
				{ status: 400 }
			)
		}

		// Verify user has access to the company (if companyId provided)
		if (companyId) {
			const { data: company, error: companyError } = await supabase
				.from('companies')
				.select('id, owner_id')
				.eq('id', companyId)
				.single()

			if (companyError || !company) {
				return NextResponse.json(
					{ error: 'Company not found' },
					{ status: 404 }
				)
			}

			// Check if user is owner or has admin access
			const { data: profile } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single()

			const isOwner = company.owner_id === user.id
			const isAdmin = profile?.role === 'admin' || profile?.role === 'root_admin'

			if (!isOwner && !isAdmin) {
				return NextResponse.json(
					{ error: 'Access denied' },
					{ status: 403 }
				)
			}
		}

		// Generate unique file path
		const timestamp = Date.now()
		const randomSuffix = Math.random().toString(36).slice(2, 9)
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
		const storagePath = reportId
			? `reports/${reportId}/${sanitizedFileName}`
			: `reports/${timestamp}_${randomSuffix}_${sanitizedFileName}`

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Upload to Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from('reports')
			.upload(storagePath, buffer, {
				contentType: file.type || 'application/octet-stream',
				upsert: false,
			})

		if (uploadError) {
			console.error('[reports/upload] Upload error:', uploadError)
			return NextResponse.json(
				{ error: `Failed to upload file: ${uploadError.message}` },
				{ status: 500 }
			)
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from('reports')
			.getPublicUrl(storagePath)

		return NextResponse.json({
			success: true,
			path: storagePath,
			url: urlData.publicUrl,
			fileName: file.name,
			fileSize: file.size,
			contentType: file.type,
		})
	} catch (error) {
		console.error('[reports/upload] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

