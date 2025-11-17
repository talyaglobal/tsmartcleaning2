import { NextRequest } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from './supabase'

export type AuditEventInput = {
	tenantId?: string | null
	userId?: string | null
	action: string
	resource: string
	resourceId?: string | null
	metadata?: Record<string, unknown>
}

export async function logAuditEventFromRequest(
	request: NextRequest,
	event: AuditEventInput
): Promise<void> {
	try {
		const tenantId =
			event.tenantId ?? resolveTenantFromRequest(request) ?? null

		const userIdHeader =
			request.headers.get('x-user-id') ||
			request.headers.get('x-userid') ||
			null

		const userId = event.userId ?? userIdHeader ?? null
		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			request.ip ||
			null
		const userAgent = request.headers.get('user-agent') || null

		const supabase = createServerSupabase(tenantId || undefined)
		await supabase.from('audit_logs').insert({
			tenant_id: tenantId,
			user_id: userId,
			action: event.action,
			resource: event.resource,
			resource_id: event.resourceId ?? null,
			metadata: event.metadata ?? {},
			ip: ip,
			user_agent: userAgent,
		} as any)
	} catch (err) {
		// Do not throw; audit logging must never break the main flow.
		console.error('[audit] failed to record event:', err)
	}
}

export async function logAuditEvent(
	context:
		| { request?: NextRequest | null; tenantId?: string | null; userId?: string | null }
		| null,
	event: AuditEventInput
): Promise<void> {
	try {
		const tenantId = event.tenantId ?? context?.tenantId ?? null
		const supabase = createServerSupabase(tenantId || undefined)
		await supabase.from('audit_logs').insert({
			tenant_id: tenantId,
			user_id: event.userId ?? context?.userId ?? null,
			action: event.action,
			resource: event.resource,
			resource_id: event.resourceId ?? null,
			metadata: event.metadata ?? {},
		} as any)
	} catch (err) {
		console.error('[audit] failed to record event:', err)
	}
}


