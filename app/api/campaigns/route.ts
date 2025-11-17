import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const campaign = await request.json()

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        created_by: campaign?.created_by ?? null
      })
      .select()
      .single()

    if (error) throw error

    if (campaign.scheduledAt === null || new Date(campaign.scheduledAt) <= new Date()) {
      await triggerCampaignSend(data.id)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}

async function triggerCampaignSend(campaignId: string) {
  try {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/campaigns/${campaignId}/send`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
      }
    })
  } catch {
    // swallow for now; sending is best-effort in this MVP route
  }
}

export async function GET(_request: NextRequest) {
  const supabase = createServerSupabase()

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(campaigns)
}


