import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { scheduleReport, ReportSchedule } from '@/lib/report-scheduler'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {

    // Try to get schedules from report_schedules table
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({
        schedules: data || [],
      })
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          schedules: [],
          message: 'Schedules table not found',
        })
      }
      throw error
    }
    } catch (error) {
      console.error('[v0] Get schedules error:', error)
      return NextResponse.json(
        { error: 'Failed to load schedules' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

export const POST = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {
      const body = await request.json()
    const {
      reportType,
      frequency,
      recipients,
      companyId,
      propertyId,
      period,
      templateId,
    } = body

    if (!reportType || !frequency || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'reportType, frequency, and recipients array are required' },
        { status: 400 }
      )
    }

    // Use the report scheduler if companyId is provided
    if (companyId) {
      const schedule = await scheduleReport({
        companyId,
        propertyId,
        frequency: frequency as 'daily' | 'weekly' | 'monthly',
        recipients,
      })

      return NextResponse.json({
        schedule,
        message: 'Report schedule created successfully',
      })
    }

    // For admin-level reports, create a schedule record
    try {
      const nextRunAt = calculateNextRun(frequency)
      
      const { data, error } = await supabase
        .from('report_schedules')
        .insert({
          report_type: reportType,
          frequency,
          recipients,
          period: period || 'last_30_days',
          template_id: templateId || null,
          is_active: true,
          next_run_at: nextRunAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        schedule: data,
        message: 'Report schedule created successfully',
      })
    } catch (error: any) {
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Schedules table not found. Please create the report_schedules table.' },
          { status: 500 }
        )
      }
      throw error
    }
    } catch (error) {
      console.error('[v0] Create schedule error:', error)
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

export const DELETE = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {
      const { searchParams } = new URL(request.url)
      const scheduleId = searchParams.get('id')

      if (!scheduleId) {
        return NextResponse.json(
          { error: 'Schedule ID is required' },
          { status: 400 }
        )
      }

    try {
      const { error } = await supabase
        .from('report_schedules')
        .update({ is_active: false })
        .eq('id', scheduleId)

      if (error) throw error

      return NextResponse.json({
        message: 'Schedule deactivated successfully',
      })
    } catch (error: any) {
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Schedules table not found' },
          { status: 500 }
        )
      }
      throw error
    }
    } catch (error) {
      console.error('[v0] Delete schedule error:', error)
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

function calculateNextRun(frequency: string): Date {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly': {
      const nextWeek = new Date(now)
      nextWeek.setDate(now.getDate() + 7)
      return nextWeek
    }
    case 'monthly': {
      const nextMonth = new Date(now)
      nextMonth.setMonth(now.getMonth() + 1)
      return nextMonth
    }
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}

