import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const PATCH = withAuth(
  async (
    request: NextRequest,
    auth: { supabase: any, tenantId: string | null },
    context?: { params: { id: string } }
  ) => {
    try {
      if (!context?.params?.id) {
        return NextResponse.json({ error: 'Verification ID is required' }, { status: 400 })
      }

      const { id } = context.params
      const { status, notes } = await request.json()

      if (!status || !['passed', 'failed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be "passed" or "failed"' },
          { status: 400 }
        )
      }

      const supabase = auth.supabase || createServerSupabase()

      // Update verification status
      const { data: verification, error: updateError } = await supabase
        .from('verifications')
        .update({
          status,
          updated_at: new Date().toISOString(),
          flags: notes ? { admin_notes: notes } : undefined
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('[admin:verifications:update] error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update verification' },
          { status: 500 }
        )
      }

      // If verification is passed, check if all required verifications are complete
      // and update provider profile accordingly
      if (status === 'passed' && verification) {
        const { data: allVerifications } = await supabase
          .from('verifications')
          .select('type, status')
          .eq('user_id', verification.user_id)
          .in('type', ['government_id', 'face', 'background', 'insurance'])

        const allRequiredPassed = allVerifications?.every(
          v => v.status === 'passed'
        )

        if (allRequiredPassed) {
          // Update provider profile to verified
          await supabase
            .from('provider_profiles')
            .update({ is_verified: true })
            .eq('user_id', verification.user_id)
        }
      }

      return NextResponse.json({ verification })
    } catch (error) {
      console.error('[admin:verifications:update] error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAdmin: true }
)

