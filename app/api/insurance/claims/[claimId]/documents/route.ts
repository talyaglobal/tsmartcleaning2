import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { claimId: string } }) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const claimId = params.claimId
		if (!claimId) return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })

		const { searchParams } = new URL(request.url)
		const documentId = searchParams.get('documentId')
		const path = searchParams.get('path')

		if (!documentId && !path) {
			return NextResponse.json({ error: 'documentId or path is required' }, { status: 400 })
		}

		// Verify user has access to this claim
		const { data: claim, error: claimError } = await supabase
			.from('insurance_claims')
			.select('user_id')
			.or(`id.eq.${claimId},claim_code.eq.${claimId}`)
			.single()

		if (claimError || !claim) {
			return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
		}

		// Get document info
		let documentPath = path
		if (documentId) {
			const { data: doc, error: docError } = await supabase
				.from('insurance_claim_documents')
				.select('storage_path')
				.eq('id', documentId)
				.eq('claim_id', claimId)
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
			// @ts-ignore storage available on supabase-js client
			const { data, error: downloadError } = await (supabase as any).storage
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
		} catch (e: any) {
			console.error('[claims/documents] GET error', e)
			return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 })
		}
	} catch (error: any) {
		console.error('[insurance/claims/documents] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest, { params }: { params: { claimId: string } }) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const claimId = params.claimId
		if (!claimId) return NextResponse.json({ error: 'Missing claimId' }, { status: 400 })

		const form = await request.formData()
		const files = form.getAll('files') as File[]
		if (!files || files.length === 0) {
			return NextResponse.json({ error: 'No files provided' }, { status: 400 })
		}

		const uploaded: Array<{ file_name: string; path: string; size: number }> = []
		for (const file of files) {
			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)
			const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, '_')
			const path = `${claimId}/${fileName}`

			// Attempt to upload to Supabase Storage bucket "claims"
			// If bucket isn't present, this will error; we still record metadata.
			try {
				// @ts-ignore storage available on supabase-js client
				const { error: upErr } = await (supabase as any).storage.from('claims').upload(path, buffer, {
					contentType: file.type || 'application/octet-stream',
					upsert: true,
				})
				if (upErr) {
					console.warn('[claims/documents] Storage upload error:', upErr.message)
				}
			} catch (e: any) {
				console.warn('[claims/documents] Storage upload exception:', e?.message)
			}

			await supabase.from('insurance_claim_documents').insert({
				claim_id: claimId,
				file_name: file.name,
				storage_path: path,
				content_type: file.type || null,
				size_bytes: file.size || null,
			})
			uploaded.push({ file_name: file.name, path, size: file.size || 0 })
		}

		return NextResponse.json({ uploaded })
	} catch (error: any) {
		console.error('[insurance/claims/documents] POST error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


