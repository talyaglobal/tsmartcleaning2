import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { getVerificationFqdn, getExpectedCnameTarget, normalizeHostname } from '@/lib/domains'
import { requireTenantId } from '@/lib/tenant'
import { promises as dns } from 'dns'

export async function POST(request: NextRequest) {
	try {
		const tenantId = requireTenantId(request)
		const { hostname } = (await request.json().catch(() => ({}))) as { hostname?: string }
		if (!hostname) {
			return NextResponse.json({ error: 'hostname is required' }, { status: 400 })
		}
		const host = normalizeHostname(hostname)
		const supabase = createServerSupabase(tenantId)

		const { data: rows, error: loadErr } = await supabase
			.from('domains')
			.select('id, hostname, cname_token, status, verified_at')
			.eq('tenant_id', tenantId)
			.eq('hostname', host)
			.limit(1)
		if (loadErr || !rows?.[0]) {
			return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
		}
		const row = rows[0]
		const verifyFqdn = getVerificationFqdn(row.hostname)
		const expectedTarget = getExpectedCnameTarget(row.cname_token)

		// Resolve CNAME of verification record. We accept direct match or match after following one hop.
		let resolvedTargets: string[] = []
		try {
			const ans = await dns.resolveCname(verifyFqdn)
			resolvedTargets = ans.map((a) => a.toLowerCase().replace(/\.$/, ''))
		} catch (e) {
			// If no CNAME, consider try resolveAny?
			resolvedTargets = []
		}

		const matched = resolvedTargets.includes(expectedTarget)
		if (!matched) {
			return NextResponse.json(
				{
					status: 'pending',
					message: 'Verification record not found or not propagated yet',
					lookedUp: verifyFqdn,
					resolvedTargets
				},
				{ status: 200 }
			)
		}

		const { error: updErr, data: updated } = await supabase
			.from('domains')
			.update({ status: 'verified', verified_at: new Date().toISOString() })
			.eq('id', row.id)
			.select('id,hostname,status,verified_at')
			.limit(1)
		if (updErr) {
			console.error('[domains:verify] update error', updErr)
			return NextResponse.json({ error: 'Failed to mark verified' }, { status: 500 })
		}

		return NextResponse.json({ ...updated?.[0], expectedTarget })
	} catch (err) {
		console.error('[domains:verify] error', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


