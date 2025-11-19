import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { InsuranceEmailTemplates, createInsuranceEmailClient } from '@/lib/emails/insurance'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

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

export const GET = withAuth(
	async (request: NextRequest, { user, supabase, tenantId: authTenantId }) => {
		try {
			const tenantId = authTenantId || resolveTenantFromRequest(request)
			const { searchParams } = new URL(request.url)
			const requestedUserId = searchParams.get('user_id')
			
			// If user_id is provided, verify the authenticated user owns it (unless admin)
			const userId = requestedUserId || user.id
			const isAdmin = isAdminRole(user.role)
			
			if (!isAdmin && userId !== user.id) {
				return NextResponse.json(
					{ error: 'You can only view your own insurance policies' },
					{ status: 403 }
				)
			}
			
			const { data, error } = await supabase
				.from('insurance_policies')
				.select('*, insurance_plans(*)')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
			if (error) return NextResponse.json({ error: error.message }, { status: 500 })
			return NextResponse.json({ policies: data || [] })
		} catch (error: any) {
			console.error('[insurance/policies] GET error', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	}
)

export async function POST(request: NextRequest) {
	try {
		const tenantId = resolveTenantFromRequest(request)
		const supabase = createServerSupabase(tenantId || undefined)
		const body = await request.json()
		const { user_id, user_email, user_name, user_phone, plan_code, billing_cycle = 'annual', effective_date } = body || {}
		if (!user_id || !plan_code) {
			return NextResponse.json({ error: 'user_id and plan_code are required' }, { status: 400 })
		}
		// load plan
		const { data: plan, error: planErr } = await supabase
			.from('insurance_plans')
			.select('*')
			.eq('code', plan_code)
			.single()
		if (planErr || !plan) {
			return NextResponse.json({ error: 'Invalid plan_code' }, { status: 400 })
		}
		// create policy draft
		const now = new Date()
		const startDate = effective_date ? new Date(effective_date) : now
		const expiry = new Date(startDate)
		expiry.setFullYear(startDate.getFullYear() + 1)
		const policyNumber = `CG-${now.getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
		const { data: policy, error: polErr } = await supabase
			.from('insurance_policies')
			.insert({
				user_id,
				tenant_id: tenantId || null,
				plan_id: plan.id,
				policy_number: policyNumber,
				status: 'pending_activation',
				effective_date: startDate.toISOString().slice(0, 10),
				expiration_date: expiry.toISOString().slice(0, 10),
				billing_cycle,
			})
			.select('*')
			.single()
		if (polErr) return NextResponse.json({ error: polErr.message }, { status: 500 })

		// create pending payment
		const amount = billing_cycle === 'monthly' ? Number(plan.monthly_price) : Number(plan.annual_price)
		await supabase.from('insurance_payments').insert({
			policy_id: policy.id,
			user_id: user_id,
			cycle: billing_cycle,
			amount,
			status: 'pending',
		})

		// send welcome email (queued)
		if (user_email) {
			const client = createInsuranceEmailClient(async ({ to, subject, html }) => {
				await sendEmailViaApi(request, { to, subject, html })
			})
			await client.sendWelcome({ to: user_email, userName: user_name || 'Member', policyNumber: policyNumber, tenantId: tenantId || undefined })
		}

		// send WhatsApp SMS if phone provided (format: whatsapp:+1234567890 or just phone)
		if (user_phone) {
			const to = user_phone.startsWith('whatsapp:') ? user_phone : `whatsapp:${user_phone}`
			const base = process.env.NEXT_PUBLIC_BASE_URL || ''
			const bodyText =
				`Welcome to CleanGuard Protection, ${user_name || 'Member'}! ` +
				`Policy ${policyNumber} created. View details: ${base}/customer/insurance`
			try {
				await sendWhatsAppMessage({ to, body: bodyText }, { tenantId: tenantId || undefined })
			} catch (e) {
				console.warn('[insurance/policies] WhatsApp send failed', (e as any)?.message)
			}
		}

		return NextResponse.json({ policy })
	} catch (error: any) {
		console.error('[insurance/policies] POST error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


