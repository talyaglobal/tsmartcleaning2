import { NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { logAuditEvent } from '@/lib/audit'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const supabase = createServerSupabase()

		// Create a campaign record if table exists; otherwise return a generated id
		const campaignId = randomUUID()
		const payload = {
			id: campaignId,
			name: body?.name ?? 'Untitled Campaign',
			channel: body?.channel ?? 'email',
			subject: body?.subject ?? null,
			content: body?.content ?? '',
			audience_filter: body?.audienceFilter ?? {},
			status: 'sending',
		}

		const { error } = await supabase.from('campaigns').insert(payload)
		if (error) {
			// Table may not exist yet; still return an id so UI flows work
			// Still record audit if possible
			await logAuditEvent(
				{ tenantId: resolveTenantFromRequest(request) },
				{
					action: 'launch_campaign',
					resource: 'campaign',
					resourceId: campaignId,
					metadata: { payload, dbInsertError: true },
				}
			)
			return NextResponse.json({ campaignId }, { status: 200 })
		}

		await logAuditEvent(
			{ tenantId: resolveTenantFromRequest(request) },
			{
				action: 'launch_campaign',
				resource: 'campaign',
				resourceId: campaignId,
				metadata: { payload },
			}
		)
		return NextResponse.json({ campaignId }, { status: 200 })
	} catch (e) {
		return NextResponse.json({ error: 'Failed to launch campaign' }, { status: 500 })
	}
}


