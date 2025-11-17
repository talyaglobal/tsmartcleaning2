import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('verifications')
      .select('type,status,expires_at')
      .eq('user_id', userId)

    if (error) {
      console.error('[verification:badge] supabase error:', error)
      return NextResponse.json({ error: 'Failed to load badge' }, { status: 500 })
    }

    const byType = Object.fromEntries((data ?? []).map((r: any) => [r.type, r]))
    const identityOk =
      byType['government_id']?.status === 'passed' &&
      byType['face']?.status === 'passed'
    const insuranceOk =
      byType['insurance']?.status === 'passed' &&
      new Date(byType['insurance']?.expires_at ?? 0).getTime() > Date.now()

    return NextResponse.json({
      identityVerified: !!identityOk,
      insuranceValid: !!insuranceOk,
      verifications: data ?? [],
    })
  } catch (err) {
    console.error('[verification:badge] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


