import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
	try {
		const contentType = req.headers.get('content-type') || ''
		if (!contentType.includes('multipart/form-data')) {
			return NextResponse.json({ message: 'Expected multipart/form-data' }, { status: 400 })
		}

		const form = await req.formData()
		const payloadRaw = form.get('payload')
		if (!payloadRaw || typeof payloadRaw !== 'string') {
			return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
		}

		const payload = JSON.parse(payloadRaw)
		const applicationId = `ngo_${crypto.randomUUID()}`
		const nowIso = new Date().toISOString()

		const supabase = createServerSupabase()

		// Upload helper
		const uploadFile = async (key: string, fileField: string | null) => {
			if (!fileField) return null
			const f = form.get(fileField)
			if (!(f instanceof File)) return null
			const buf = Buffer.from(await f.arrayBuffer())
			const path = `${applicationId}/${key}-${Date.now()}.${(f.name.split('.').pop() || 'bin')}`
			const { error } = await supabase.storage.from('ngo-docs').upload(path, buf, {
				contentType: f.type || 'application/octet-stream',
				upsert: false,
			})
			if (error) {
				// Non-fatal: continue without file
				return null
			}
			const { data: publicUrl } = supabase.storage.from('ngo-docs').getPublicUrl(path)
			return { path, url: publicUrl.publicUrl }
		}

		const files = {
			nonProfitDoc: await uploadFile('nonProfitDoc', 'nonProfitDoc'),
			businessLicense: await uploadFile('businessLicense', 'businessLicense'),
			insuranceProof: await uploadFile('insuranceProof', 'insuranceProof'),
			boardList: await uploadFile('boardList', 'boardList'),
			annualReport: await uploadFile('annualReport', 'annualReport'),
		}

		const record = {
			application_id: applicationId,
			status: 'submitted',
			created_at: nowIso,
			updated_at: nowIso,
			section1: payload.section1,
			section2: payload.section2,
			section3: { ...payload.section3, files },
			section4: payload.section4,
		}

		const { error: insertError } = await supabase.from('ngo_applications').insert(record as never)
		if (insertError) {
			return NextResponse.json({ message: 'Failed to save application' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, applicationId })
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
	}
}


