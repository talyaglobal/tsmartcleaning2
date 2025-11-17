import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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


