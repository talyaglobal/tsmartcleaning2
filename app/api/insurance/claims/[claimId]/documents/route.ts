import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { createInsuranceEmailClient } from '@/lib/emails/insurance'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Document validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/pdf',
] as const
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'] as const

interface FileValidationResult {
	valid: boolean
	error?: string
}

interface UploadedFile {
	file_name: string
	path: string
	size: number
}

interface UploadError {
	file_name: string
	error: string
}

// Type guard for Supabase client with storage
interface SupabaseClientWithStorage extends SupabaseClient {
	storage: {
		from(bucket: string): {
			upload(path: string, file: Buffer, options?: { contentType?: string; upsert?: boolean }): Promise<{ error: Error | null }>
			download(path: string): Promise<{ data: Blob | null; error: Error | null }>
			remove(paths: string[]): Promise<{ error: Error | null }>
		}
	}
}

function validateFile(file: File): FileValidationResult {
	// Check file type by MIME type
	if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
		// Fallback: check by extension
		const extension = '.' + file.name.split('.').pop()?.toLowerCase()
		if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
			return {
				valid: false,
				error: `Invalid file type: ${file.name}. Allowed types: JPG, PNG, GIF, WEBP, PDF`,
			}
		}
	}

	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File too large: ${file.name}. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
		}
	}

	// Check if file is empty
	if (file.size === 0) {
		return {
			valid: false,
			error: `File is empty: ${file.name}`,
		}
	}

	return { valid: true }
}

async function sendEmailViaApi(request: NextRequest, payload: { to: string; subject: string; html: string }) {
	const tenantId = resolveTenantFromRequest(request) || ''
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
	try {
		await fetch(`${baseUrl}/api/send-email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-tenant-id': tenantId,
			},
			body: JSON.stringify(payload),
		})
	} catch (error) {
		console.error('[claims/documents] Email send failed:', error)
		// Non-fatal: continue even if email fails
	}
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
	try {
		const { claimId } = await params
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		if (!claimId) return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })

		const { searchParams } = new URL(request.url)
		const documentId = searchParams.get('documentId')
		const path = searchParams.get('path')

		if (!documentId && !path) {
			return NextResponse.json({ error: 'documentId or path is required' }, { status: 400 })
		}

		// Verify user has access to this claim and get the actual claim UUID
		const { data: claim, error: claimError } = await supabase
			.from('insurance_claims')
			.select('id, user_id')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		if (claimError || !claim) {
			return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
		}

		const actualClaimId = claim.id

		// Get document info
		let documentPath = path
		if (documentId) {
			const { data: doc, error: docError } = await supabase
				.from('insurance_claim_documents')
				.select('storage_path')
				.eq('id', documentId)
				.eq('claim_id', actualClaimId)
				.single()

			if (docError || !doc) {
				return NextResponse.json({ error: 'Document not found' }, { status: 404 })
			}
			documentPath = doc.storage_path
		}

		if (!documentPath) {
			return NextResponse.json({ error: 'Document path not found' }, { status: 404 })
		}

		// Download file from storage
		try {
			const supabaseWithStorage = supabase as unknown as SupabaseClientWithStorage
			const { data, error: downloadError } = await supabaseWithStorage.storage
				.from('claims')
				.download(documentPath)

			if (downloadError || !data) {
				return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
			}

			const arrayBuffer = await data.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)

			// Get content type from document record if available
			const { data: docInfo } = await supabase
				.from('insurance_claim_documents')
				.select('content_type, file_name')
				.eq('storage_path', documentPath)
				.single()

			const contentType = docInfo?.content_type || 'application/octet-stream'
			const fileName = docInfo?.file_name || 'document'

			return new NextResponse(buffer, {
				headers: {
					'Content-Type': contentType,
					'Content-Disposition': `inline; filename="${fileName}"`,
				},
			})
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e))
			console.error('[claims/documents] GET error', error)
			return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 })
		}
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		console.error('[insurance/claims/documents] GET error', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
	try {
		const { claimId } = await params
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		if (!claimId) return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })

		// Verify claim exists and get the actual claim UUID
		const { data: claim, error: claimError } = await supabase
			.from('insurance_claims')
			.select('id')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		if (claimError || !claim) {
			return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
		}

		const actualClaimId = claim.id

		// Get claim details for email notification
		const { data: claimDetails } = await supabase
			.from('insurance_claims')
			.select('claim_code, user_id, status')
			.eq('id', actualClaimId)
			.single()

		// Get user email for notification
		let userEmail: string | null = null
		let userName: string | null = null
		if (claimDetails?.user_id) {
			const { data: userData } = await supabase
				.from('users')
				.select('email, name, full_name')
				.eq('id', claimDetails.user_id)
				.single()
			userEmail = userData?.email || null
			userName = userData?.name || userData?.full_name || 'Member'
		}

		const form = await request.formData()
		const files = form.getAll('files') as File[]
		if (!files || files.length === 0) {
			return NextResponse.json({ error: 'No files provided' }, { status: 400 })
		}

		// Validate all files before processing
		const validationErrors: string[] = []
		for (const file of files) {
			const validation = validateFile(file)
			if (!validation.valid) {
				validationErrors.push(validation.error || 'Invalid file')
			}
		}

		if (validationErrors.length > 0) {
			return NextResponse.json(
				{ error: 'File validation failed', details: validationErrors },
				{ status: 400 }
			)
		}

		const uploaded: UploadedFile[] = []
		const uploadErrors: UploadError[] = []

		for (const file of files) {
			try {
				const arrayBuffer = await file.arrayBuffer()
				const buffer = Buffer.from(arrayBuffer)
				const timestamp = Date.now()
				const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
				const fileName = `${timestamp}-${sanitizedName}`
				const path = `${actualClaimId}/${fileName}`

				// Attempt to upload to Supabase Storage bucket "claims"
				try {
					const supabaseWithStorage = supabase as unknown as SupabaseClientWithStorage
					const { error: upErr } = await supabaseWithStorage.storage.from('claims').upload(path, buffer, {
						contentType: file.type || 'application/octet-stream',
						upsert: false,
					})
					if (upErr) {
						const errorMessage = upErr instanceof Error ? upErr.message : String(upErr)
						console.error('[claims/documents] Storage upload error:', errorMessage)
						uploadErrors.push({ file_name: file.name, error: errorMessage })
						continue
					}
				} catch (e) {
					const error = e instanceof Error ? e : new Error(String(e))
					console.error('[claims/documents] Storage upload exception:', error.message)
					uploadErrors.push({ file_name: file.name, error: error.message || 'Upload failed' })
					continue
				}

				// Insert document record
				const { error: insertError } = await supabase.from('insurance_claim_documents').insert({
					claim_id: actualClaimId,
					file_name: file.name,
					storage_path: path,
					content_type: file.type || null,
					size_bytes: file.size || null,
					review_status: 'pending', // Default to pending review
				})

				if (insertError) {
					console.error('[claims/documents] Database insert error:', insertError.message)
					// Try to clean up uploaded file
					try {
						const supabaseWithStorage = supabase as unknown as SupabaseClientWithStorage
						await supabaseWithStorage.storage.from('claims').remove([path])
					} catch (cleanupErr) {
						const cleanupError = cleanupErr instanceof Error ? cleanupErr : new Error(String(cleanupErr))
						console.error('[claims/documents] Cleanup error:', cleanupError)
					}
					uploadErrors.push({ file_name: file.name, error: insertError.message })
					continue
				}

				uploaded.push({ file_name: file.name, path, size: file.size || 0 })
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error))
				console.error('[claims/documents] File processing error:', err)
				uploadErrors.push({ file_name: file.name, error: err.message || 'Processing failed' })
			}
		}

		// Send email notification if documents were successfully uploaded
		if (uploaded.length > 0 && userEmail && claimDetails?.claim_code) {
			try {
				const client = createInsuranceEmailClient(async ({ to, subject, html }) => {
					await sendEmailViaApi(request, { to, subject, html })
				})
				await client.sendClaimStatusUpdate({
					to: userEmail,
					userName: userName || 'Member',
					claimId: claimDetails.claim_code,
					tenantId: resolveTenantFromRequest(request) || undefined,
				})
			} catch (emailError) {
				console.error('[claims/documents] Email notification failed:', emailError)
				// Non-fatal: continue
			}
		}

		if (uploadErrors.length > 0 && uploaded.length === 0) {
			return NextResponse.json(
				{ error: 'All uploads failed', details: uploadErrors },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			uploaded,
			errors: uploadErrors.length > 0 ? uploadErrors : undefined,
		})
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		console.error('[insurance/claims/documents] POST error', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
	try {
		const { claimId } = await params
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		if (!claimId) return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })

		const { searchParams } = new URL(request.url)
		const documentId = searchParams.get('documentId')
		if (!documentId) {
			return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
		}

		// Verify user has access to this claim and get the actual claim UUID
		const { data: claim, error: claimError } = await supabase
			.from('insurance_claims')
			.select('id, user_id')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		if (claimError || !claim) {
			return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
		}

		const actualClaimId = claim.id

		// Get document info before deletion
		const { data: doc, error: docError } = await supabase
			.from('insurance_claim_documents')
			.select('storage_path')
			.eq('id', documentId)
			.eq('claim_id', actualClaimId)
			.single()

		if (docError || !doc) {
			return NextResponse.json({ error: 'Document not found' }, { status: 404 })
		}

		// Delete from storage
		if (doc.storage_path) {
			try {
				const supabaseWithStorage = supabase as unknown as SupabaseClientWithStorage
				await supabaseWithStorage.storage.from('claims').remove([doc.storage_path])
			} catch (e) {
				const error = e instanceof Error ? e : new Error(String(e))
				console.warn('[claims/documents] Storage delete error:', error.message)
				// Continue with database deletion even if storage deletion fails
			}
		}

		// Delete from database
		const { error: deleteError } = await supabase
			.from('insurance_claim_documents')
			.delete()
			.eq('id', documentId)
			.eq('claim_id', actualClaimId)

		if (deleteError) {
			return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		console.error('[insurance/claims/documents] DELETE error', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


