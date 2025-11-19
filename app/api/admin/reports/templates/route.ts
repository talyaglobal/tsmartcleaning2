import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  reportType: string
  defaultPeriod: string
  defaultFilters: Record<string, any>
  isSystem: boolean
}

// System templates
const SYSTEM_TEMPLATES: ReportTemplate[] = [
  {
    id: 'revenue-monthly',
    name: 'Monthly Revenue Report',
    description: 'Comprehensive revenue analysis for the past month',
    reportType: 'revenue',
    defaultPeriod: 'last_30_days',
    defaultFilters: {},
    isSystem: true,
  },
  {
    id: 'bookings-weekly',
    name: 'Weekly Bookings Summary',
    description: 'Weekly overview of all bookings and their status',
    reportType: 'bookings',
    defaultPeriod: 'last_7_days',
    defaultFilters: {},
    isSystem: true,
  },
  {
    id: 'user-growth',
    name: 'User Growth Report',
    description: 'Track new user registrations and growth metrics',
    reportType: 'users',
    defaultPeriod: 'last_30_days',
    defaultFilters: {},
    isSystem: true,
  },
  {
    id: 'performance-quarterly',
    name: 'Quarterly Performance Review',
    description: 'Comprehensive performance metrics including ratings and reviews',
    reportType: 'performance',
    defaultPeriod: 'last_90_days',
    defaultFilters: {},
    isSystem: true,
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview combining revenue, bookings, and user metrics',
    reportType: 'custom',
    defaultPeriod: 'last_30_days',
    defaultFilters: {},
    isSystem: true,
  },
]

export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {

    // Get custom templates from database (if table exists)
    let customTemplates: ReportTemplate[] = []
    try {
      const { data } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
      
      if (data) {
        customTemplates = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          reportType: t.report_type,
          defaultPeriod: t.default_period,
          defaultFilters: t.default_filters || {},
          isSystem: false,
        }))
      }
    } catch (error) {
      // Table might not exist, that's okay
      console.log('[v0] Report templates table not found, using system templates only')
    }

      return NextResponse.json({
        templates: [...SYSTEM_TEMPLATES, ...customTemplates],
      })
    } catch (error) {
      console.error('[v0] Get templates error:', error)
      return NextResponse.json(
        { error: 'Failed to load templates' },
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
      const { name, description, reportType, defaultPeriod, defaultFilters } = body

      if (!name || !reportType) {
        return NextResponse.json(
          { error: 'Name and reportType are required' },
          { status: 400 }
        )
      }

    // Try to insert custom template
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name,
          description: description || '',
          report_type: reportType,
          default_period: defaultPeriod || 'last_30_days',
          default_filters: defaultFilters || {},
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        template: {
          id: data.id,
          name: data.name,
          description: data.description,
          reportType: data.report_type,
          defaultPeriod: data.default_period,
          defaultFilters: data.default_filters || {},
          isSystem: false,
        },
      })
    } catch (error: any) {
      // If table doesn't exist, return success but note it's not persisted
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          template: {
            id: `temp_${Date.now()}`,
            name,
            description,
            reportType,
            defaultPeriod: defaultPeriod || 'last_30_days',
            defaultFilters: defaultFilters || {},
            isSystem: false,
          },
          message: 'Template created but not persisted (table not found)',
        })
      }
      throw error
    }
    } catch (error) {
      console.error('[v0] Create template error:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

