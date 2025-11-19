import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const PATCH = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { action, reason } = await request.json()

      if (!action || !['approve', 'reject', 'flag'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be approve, reject, or flag' },
          { status: 400 }
        )
      }

      if (action === 'flag' && !reason) {
        return NextResponse.json(
          { error: 'Reason is required when flagging a review' },
          { status: 400 }
        )
      }

      const supabase = createServerSupabase(null)

      // Map actions to status values
      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        flag: 'flagged',
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        status: statusMap[action],
        moderated_at: new Date().toISOString(),
      }

      if (action === 'flag' && reason) {
        updateData.flagged_reason = reason
      } else if (action === 'approve' || action === 'reject') {
        // Clear flagged_reason when approving or rejecting
        updateData.flagged_reason = null
      }

      const { data, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) {
        console.error('[root-admin] Update review error:', error)
        return NextResponse.json(
          { error: 'Failed to update review' },
          { status: 500 }
        )
      }

      // Log audit trail
      try {
        const { logAuditEvent } = await import('@/lib/audit')
        await logAuditEvent(
          { request, tenantId: null, userId: null },
          {
            action: `review_${action}`,
            resource: 'review',
            resourceId: params.id,
            metadata: { reason: reason || null, previousStatus: data.status },
          }
        )
      } catch (auditError) {
        console.error('[root-admin] Failed to log audit event:', auditError)
        // Don't fail the request if audit logging fails
      }

      return NextResponse.json({
        review: data,
        message: `Review ${action}d successfully`,
      })
    } catch (error: any) {
      if (error instanceof NextResponse) {
        return error
      }
      console.error('[root-admin] Update review error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
});

