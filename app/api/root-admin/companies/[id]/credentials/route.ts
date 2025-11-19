import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

// Get company credentials/verifications
export const GET = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = createServerSupabase(null)
    
    // Get company and its owner/user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, user_id')
      .eq('id', params.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get verifications for company owner/user
    let verifications: any[] = []
    if (company.user_id) {
      const { data: userVerifications } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', company.user_id)
        .order('created_at', { ascending: false })
      
      verifications = userVerifications || []
    }

    // Get company-specific badges/credentials (if we add a company_credentials table later)
    // For now, we'll derive badges from verifications and company status
    const badges = {
      verified: company.verified || false,
      identityVerified: verifications.some(
        (v) => v.type === 'government_id' && v.status === 'passed'
      ) && verifications.some(
        (v) => v.type === 'face' && v.status === 'passed'
      ),
      backgroundChecked: verifications.some(
        (v) => v.type === 'background' && v.status === 'passed'
      ),
      insured: verifications.some(
        (v) => v.type === 'insurance' && v.status === 'passed' &&
        (!v.expires_at || new Date(v.expires_at) > new Date())
      ),
    }

    return NextResponse.json({
      companyId: params.id,
      verifications,
      badges,
    })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Get company credentials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

// Update company credentials/badges
export const PATCH = withRootAdmin(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    const { badge, value, verificationId, verificationStatus } = body

    const supabase = createServerSupabase(null)

    // Update company verified badge
    if (badge === 'verified' && typeof value === 'boolean') {
      const { data, error } = await supabase
        .from('companies')
        .update({ verified: value, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single()

      if (error) {
        console.error('[root-admin] Update company verified badge error:', error)
        return NextResponse.json(
          { error: 'Failed to update verified badge' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        company: data,
        message: 'Verified badge updated successfully',
      })
    }

    // Update verification status
    if (verificationId && verificationStatus) {
      const { data, error } = await supabase
        .from('verifications')
        .update({
          status: verificationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', verificationId)
        .select()
        .single()

      if (error) {
        console.error('[root-admin] Update verification error:', error)
        return NextResponse.json(
          { error: 'Failed to update verification' },
          { status: 500 }
        )
      }

      // Log verification event
      await supabase.from('verification_events').insert({
        verification_id: verificationId,
        event_type: `admin_${verificationStatus}`,
        payload: { admin_action: true, company_id: params.id },
      })

      return NextResponse.json({
        verification: data,
        message: 'Verification updated successfully',
      })
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide badge/value or verificationId/verificationStatus' },
      { status: 400 }
    )
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Update company credentials error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

