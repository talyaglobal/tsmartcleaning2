import { NextRequest, NextResponse } from 'next/server'
import { logAuditEventFromRequest } from '@/lib/audit'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const jobId = params.id
		const { status } = await request.json()

		if (!status) {
			return NextResponse.json({ error: 'status is required' }, { status: 400 })
		}

		// Here you would update the job status in DB
		// For MVP, return success echo
		await logAuditEventFromRequest(request, {
			action: 'update_status',
			resource: 'job',
			resourceId: jobId,
			metadata: { status },
		})
		return NextResponse.json({ success: true, jobId, status })
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Status update failed' }, { status: 500 })
	}
}


