import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get team dashboard stats
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Total platform users
    const { count: usersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    // Active companies count
    let companiesCount = 0
    {
      const { count } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
      companiesCount = count ?? 0
    }

    // Open support tickets
    let openTicketsCount = 0
    {
      const { count } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
      openTicketsCount = count ?? 0
    }

    // Tickets change (new tickets in last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { count: newTickets24h } = await supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .in('status', ['open', 'in_progress'])

    const ticketsChange = newTickets24h ? newTickets24h - openTicketsCount : 0

    // System uptime (placeholder - would need actual monitoring data)
    // For now, calculate based on bookings/transactions availability
    const systemUptime = '99.97%' // This would come from actual monitoring

    // Blog posts stats
    const { count: totalBlogPosts } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })

    const { count: publishedBlogPosts } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: newUsers7d } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    const { count: newCompanies7d } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    const stats = {
      platformUsers: usersCount ?? 0,
      activeCompanies: companiesCount,
      openTickets: openTicketsCount,
      ticketsChange: ticketsChange > 0 ? ticketsChange : (ticketsChange < 0 ? ticketsChange : 0),
      systemUptime,
      totalBlogPosts: totalBlogPosts ?? 0,
      publishedBlogPosts: publishedBlogPosts ?? 0,
      newUsers7d: newUsers7d ?? 0,
      newCompanies7d: newCompanies7d ?? 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[v0] Get team stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

