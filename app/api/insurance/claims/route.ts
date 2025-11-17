import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { createInsuranceEmailClient, InsuranceEmailTemplates } from '@/lib/emails/insurance'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

async function sendEmailViaApi(request: NextRequest, payload: { to: string; subject: string; html: string }) {
	const tenantId = resolveTenantFromRequest(request) || ''
	await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-email`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-tenant-id': tenantId,
		},
		body: JSON.stringify(payload),
	})
}

export async function GET(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('user_id')
		if (!userId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
		const { data, error } = await supabase
			.from('insurance_claims')
			.select('*, insurance_policies(policy_number), insurance_claim_documents(*)')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ claims: data || [] })
	} catch (error: any) {
		console.error('[insurance/claims] GET error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const body = await request.json()
		const {
			user_id,
			policy_id,
			user_email,
			user_name,
			user_phone,
			incident_type,
			incident_date,
			incident_time,
			description,
			amount_claimed,
		} = body || {}
		if (!user_id || !policy_id || !incident_type || !incident_date || !description) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
		}
		const code = `CLM-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
		const { data: claim, error: clErr } = await supabase
			.from('insurance_claims')
			.insert({
				policy_id,
				user_id,
				tenant_id: tenantId || null,
				claim_code: code,
				incident_type,
				incident_date,
				incident_time: incident_time || null,
				description,
				amount_claimed: amount_claimed ? Number(amount_claimed) : null,
				status: 'filed',
			})
			.select('*')
			.single()
		if (clErr) return NextResponse.json({ error: clErr.message }, { status: 500 })

		// email notify
		if (user_email) {
			const client = createInsuranceEmailClient(async ({ to, subject, html }) => {
				await sendEmailViaApi(request, { to, subject, html })
			})
			await client.sendClaimFiled({
				to: user_email,
				userName: user_name || 'Member',
				claimId: code,
				tenantId: tenantId || undefined,
			})
		}

		// WhatsApp notify
		if (user_phone) {
			const to = user_phone.startsWith('whatsapp:') ? user_phone : `whatsapp:${user_phone}`
			const base = process.env.NEXT_PUBLIC_BASE_URL || ''
			const bodyText =
				`We received your claim ${code}. ` +
				`Track status: ${base}/insurance/claims/${encodeURIComponent(code)}`
			try {
				await sendWhatsAppMessage({ to, body: bodyText }, { tenantId: tenantId || undefined })
			} catch (e) {
				console.warn('[insurance/claims] WhatsApp send failed', (e as any)?.message)
			}
		}

		return NextResponse.json({ claim })
	} catch (error: any) {
		console.error('[insurance/claims] POST error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


