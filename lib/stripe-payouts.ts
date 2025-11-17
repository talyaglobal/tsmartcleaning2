import Stripe from 'stripe'
import { computeRevenueShare } from './revenue-share'
import { createServerSupabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2023-10-16'
})

export interface PayoutConfig {
  platformFeePercentage: number
  providerPercentage: number
  processingFeeFixed: number
  minimumPayout: number
}

export const payoutConfig: PayoutConfig = {
  platformFeePercentage: 15,
  providerPercentage: 85,
  processingFeeFixed: 30,
  minimumPayout: 2000
}

export async function createStripeConnectAccount(providerId: string, email: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  
  const supabase = createServerSupabase(null)
  
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual'
    })

    const { error } = await supabase
      .from('providers')
      .update({
        payout_details: {
          stripe_account_id: account.id,
          created_at: new Date().toISOString()
        }
      })
      .eq('id', providerId)

    if (error) throw error

    return account
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    throw error
  }
}

export async function createOnboardingLink(stripeAccountId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  
  try {
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/provider/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/provider/stripe/success`,
      type: 'account_onboarding'
    })

    return accountLink.url
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    throw error
  }
}

export async function getStripeAccountStatus(stripeAccountId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    
    return {
      hasAccount: true,
      isVerified: account.details_submitted && account.charges_enabled,
      canReceivePayouts: account.payouts_enabled,
      requiresAction: (account.requirements?.currently_due?.length || 0) > 0,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements?.currently_due || []
    }
  } catch (error) {
    console.error('Error getting Stripe account status:', error)
    return {
      hasAccount: false,
      isVerified: false,
      canReceivePayouts: false,
      requiresAction: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirements: []
    }
  }
}

export async function processJobPayout(jobId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  
  const supabase = createServerSupabase(null)
  
  try {
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        providers (
          payout_details,
          profiles (full_name, email)
        )
      `)
      .eq('id', jobId)
      .eq('status', 'completed')
      .single()

    if (jobError || !job) {
      throw new Error('Job not found or not completed')
    }

    const provider = job.providers
    if (!provider?.payout_details?.stripe_account_id) {
      throw new Error('Provider does not have Stripe account setup')
    }

    const totalAmount = Math.round((job.total_amount || 0) * 100)

    // Compute revenue share using rules engine (with graceful fallbacks)
    const split = await computeRevenueShare({
      tenantId: (job as any)?.tenant_id ?? undefined,
      providerId: provider?.id ?? undefined,
      serviceId: (job as any)?.service_id ?? undefined,
      territoryId: (job as any)?.territory_id ?? undefined,
      totalAmountCents: totalAmount,
      asOf: job.end_datetime || new Date().toISOString()
    })

    const platformFee = split.platformFeeCents
    const providerAmount = split.providerAmountCents

    if (providerAmount < split.minimumPayoutCents) {
      throw new Error(`Payout amount below minimum (${split.minimumPayoutCents / 100})`)
    }

    const transfer = await stripe.transfers.create({
      amount: providerAmount,
      currency: 'usd',
      destination: provider.payout_details.stripe_account_id,
      description: `Payout for job #${job.id}`,
      metadata: {
        job_id: jobId,
        provider_id: provider.id,
        platform_fee: platformFee.toString(),
        processing_fee: split.processingFeeFixedCents.toString(),
        revenue_share_rule_id: split.ruleId || ''
      }
    })

    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        job_id: jobId,
        provider_id: provider.id,
        stripe_transfer_id: transfer.id,
        amount: providerAmount,
        platform_fee: platformFee,
        processing_fee: split.processingFeeFixedCents,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (payoutError) throw payoutError

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        payout_processed: true,
        payout_amount: providerAmount,
        payout_date: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) throw updateError

    return {
      success: true,
      transferId: transfer.id,
      amount: providerAmount,
      platformFee: platformFee
    }
  } catch (error) {
    console.error('Error processing payout:', error)
    throw error
  }
}

export async function processBatchPayouts() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  
  const supabase = createServerSupabase(null)
  
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        providers (
          id,
          payout_details,
          profiles (full_name, email)
        )
      `)
      .eq('status', 'completed')
      .eq('payout_processed', false)
      .gte('end_datetime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error || !jobs) {
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

    for (const job of jobs) {
      try {
        await processJobPayout(job.id)
        processed++
        await sendPayoutNotification(job.providers.profiles.email, {
          amount: (job.total_amount || 0) * payoutConfig.providerPercentage / 100,
          jobDate: job.start_datetime,
          transferId: job.id
        })
      } catch (error) {
        console.error(`Failed to process payout for job ${job.id}:`, error)
        failed++
      }
    }

    return { processed, failed }
  } catch (error) {
    console.error('Error in batch payout processing:', error)
    throw error
  }
}

async function sendPayoutNotification(email: string, payoutDetails: any) {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Payment Processed - KolayCleaning',
        html: `
          <h2>Payment Processed Successfully</h2>
          <p>Your payment of ${(payoutDetails.amount).toFixed(2)} has been processed and will arrive in your bank account within 1-2 business days.</p>
          <p><strong>Job Date:</strong> ${new Date(payoutDetails.jobDate).toLocaleDateString()}</p>
          <p><strong>Reference:</strong> ${payoutDetails.transferId}</p>
        `
      })
    })
  } catch (error) {
    console.error('Error sending payout notification:', error)
  }
}


