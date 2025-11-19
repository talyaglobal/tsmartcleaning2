import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

// Get referral information for a customer
export const GET = withAuthAndParams(
  async (
    _request: NextRequest,
    auth,
    { params }: { params: { id: string } }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const userId = params.id
      
      // Get referral code from membership card
      const { data: membershipCard } = await auth.supabase
        .from('membership_cards')
        .select('referral_code, referral_count, referral_credits')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      
      // Get referral history
      const { data: referrals } = await auth.supabase
        .from('referrals')
        .select('id, referee_id, status, rewarded_at, created_at, referee:referee_id(email, full_name)')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
      
      // Get user info for generating referral link
      const { data: user } = await auth.supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single()
      
		return NextResponse.json({
			referralCode: membershipCard?.referral_code || null,
			referralCount: membershipCard?.referral_count || 0,
			referralCredits: membershipCard?.referral_credits || 0,
			referrals: referrals || [],
			referralLink: membershipCard?.referral_code
				? `${process.env.NEXT_PUBLIC_APP_URL || 'https://tsmartcleaning.com'}/signup?ref=${membershipCard.referral_code}`
				: null,
		})
		} catch (error) {
			console.error('[v0] Customer referrals GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)
