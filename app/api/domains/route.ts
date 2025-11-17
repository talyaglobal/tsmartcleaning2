import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { generateToken, getVerificationFqdn, getExpectedCnameTarget, normalizeHostname } from '@/lib/domains'
import { requireTenantId } from '@/lib/tenant'

export async function POST(request: NextRequest) {
	try {
		const tenantId = requireTenantId(request)
		const { hostname } = (await request.json().catch(() => ({}))) as { hostname?: string }
		if (!hostname) {
			return NextResponse.json({ error: 'hostname is required' }, { status: 400 })
		}
		const host = normalizeHostname(hostname)
		// Basic hostname validation
		if (!/^[a-z0-9.-]+$/.test(host) || host.split('.').length < 2) {
			return NextResponse.json({ error: 'Invalid hostname' }, { status: 400 })
		}

		const supabase = createServerSupabase(tenantId)
		const cnameToken = generateToken(12)
		// Upsert by hostname to prevent dupes across tenants
		const { data, error } = await supabase
			.from('domains')
			.upsert(
				{
					tenant_id: tenantId,
					hostname: host,
					cname_token: cnameToken,
					status: 'pending',
					verified_at: null
				},
				{ onConflict: 'hostname' }
			)
			.select()
			.eq('hostname', host)
			.limit(1)

		if (error) {
			console.error('[domains:create] upsert error', error)
			return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 })
		}

		const row = data?.[0]
		const verifyFqdn = getVerificationFqdn(host)
		const expectedTarget = getExpectedCnameTarget(row.cname_token)

		return NextResponse.json({
			id: row.id,
			hostname: row.hostname,
			status: row.status,
			verifyRecord: {
				type: 'CNAME',
				name: verifyFqdn,
				value: expectedTarget,
				ttl: 300
			}
		})
	} catch (err) {
		console.error('[domains:create] error', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function GET(request: NextRequest) {
	try {
		const tenantId = requireTenantId(request)
		const supabase = createServerSupabase(tenantId)
		const { data, error } = await supabase
			.from('domains')
			.select('id,hostname,status,verified_at,created_at,updated_at')
			.eq('tenant_id', tenantId)
			.order('created_at', { ascending: false })
		if (error) {
			console.error('[domains:list] error', error)
			return NextResponse.json({ error: 'Failed to load domains' }, { status: 500 })
		}
		return NextResponse.json(data ?? [])
	} catch (err) {
		console.error('[domains:list] error', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


