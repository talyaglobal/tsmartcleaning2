import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

// Helper functions for report calculations
function getPlacementsByMonth(placements: any[]) {
  const byMonth: Record<string, number> = {}
  placements.forEach((p: any) => {
    if (p.created_at) {
      const month = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      byMonth[month] = (byMonth[month] || 0) + 1
    }
  })
  return byMonth
}

function getWorkersByMonth(workers: any[]) {
  const byMonth: Record<string, number> = {}
  workers.forEach((w: any) => {
    if (w.created_at) {
      const month = new Date(w.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      byMonth[month] = (byMonth[month] || 0) + 1
    }
  })
  return byMonth
}

function getRevenueByMonth(placements: any[]) {
  const byMonth: Record<string, number> = {}
  placements.forEach((p: any) => {
    if (p.created_at) {
      const month = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      byMonth[month] = (byMonth[month] || 0) + Number(p.placement_fee || 0)
    }
  })
  return byMonth
}

function calculateAverageTimeToPlace(placements: any[]) {
  const placedPlacements = placements.filter((p: any) => 
    p.status === 'active' && p.start_date && p.created_at
  )
  
  if (placedPlacements.length === 0) return 0
  
  const totalDays = placedPlacements.reduce((sum: number, p: any) => {
    const created = new Date(p.created_at)
    const started = new Date(p.start_date)
    const diffTime = Math.abs(started.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return sum + diffDays
  }, 0)
  
  return (totalDays / placedPlacements.length).toFixed(1)
}

function calculateRetentionRate(placements: any[]) {
  const completed = placements.filter((p: any) => p.status === 'completed').length
  const terminated = placements.filter((p: any) => p.status === 'terminated').length
  const totalEnded = completed + terminated
  
  if (totalEnded === 0) return '0'
  
  return ((completed / totalEnded) * 100).toFixed(1)
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    const type = searchParams.get('type') // 'placements' | 'candidates' | 'revenue' | 'performance'

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    // Get placements for the agency
    const { data: placements } = await supabase
      .from('placements')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('agency_id', agencyId)

    // Get workers for the agency
    const { data: workers } = await supabase
      .from('agency_workers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('agency_id', agencyId)

    let reportData: any = {}

    switch (type) {
      case 'placements':
        const placementsList = placements || []
        reportData = {
          total: placementsList.length,
          pending: placementsList.filter((p: any) => p.status === 'pending').length,
          interviewScheduled: placementsList.filter((p: any) => p.status === 'interview_scheduled').length,
          offerExtended: placementsList.filter((p: any) => p.status === 'offer_extended').length,
          accepted: placementsList.filter((p: any) => p.status === 'accepted').length,
          active: placementsList.filter((p: any) => p.status === 'active').length,
          completed: placementsList.filter((p: any) => p.status === 'completed').length,
          terminated: placementsList.filter((p: any) => p.status === 'terminated').length,
          withdrawn: placementsList.filter((p: any) => p.status === 'withdrawn').length,
          byMonth: getPlacementsByMonth(placementsList),
        }
        break

      case 'candidates':
        const workersList = workers || []
        const activePlacements = placements?.filter((p: any) => p.status === 'active' || p.status === 'completed') || []
        reportData = {
          total: workersList.length,
          active: workersList.filter((w: any) => w.status === 'active').length,
          placed: workersList.filter((w: any) => w.status === 'placed').length,
          training: workersList.filter((w: any) => w.status === 'training').length,
          inactive: workersList.filter((w: any) => w.status === 'inactive').length,
          onHold: workersList.filter((w: any) => w.status === 'on_hold').length,
          placedCount: activePlacements.length,
          placementRate: workersList.length > 0 ? (activePlacements.length / workersList.length * 100).toFixed(1) : '0',
          byMonth: getWorkersByMonth(workersList),
        }
        break

      case 'revenue':
        const placementsForRevenue = placements || []
        const totalRevenue = placementsForRevenue.reduce((sum: number, p: any) => sum + Number(p.placement_fee || 0), 0)
        const activeRevenue = placementsForRevenue
          .filter((p: any) => p.status === 'active')
          .reduce((sum: number, p: any) => sum + Number(p.placement_fee || 0), 0)
        const completedRevenue = placementsForRevenue
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + Number(p.placement_fee || 0), 0)

        reportData = {
          total: totalRevenue,
          active: activeRevenue,
          completed: completedRevenue,
          average: placementsForRevenue.length > 0 ? totalRevenue / placementsForRevenue.length : 0,
          byMonth: getRevenueByMonth(placementsForRevenue),
        }
        break

      case 'performance':
        const placementsForPerf = placements || []
        const successfulPlacements = placementsForPerf.filter((p: any) => 
          p.status === 'active' || p.status === 'completed'
        ).length
        const totalPlacements = placementsForPerf.length
        
        reportData = {
          successRate: totalPlacements > 0 ? (successfulPlacements / totalPlacements * 100).toFixed(1) : '0',
          averagePlacementFee: totalPlacements > 0
            ? placementsForPerf.reduce((sum: number, p: any) => sum + Number(p.placement_fee || 0), 0) / totalPlacements
            : 0,
          averageTimeToPlace: calculateAverageTimeToPlace(placementsForPerf),
          retentionRate: calculateRetentionRate(placementsForPerf),
        }
        break

      case 'impact':
        const activePlacementsForImpact = placements?.filter((p: any) => p.status === 'active') || []
        const totalHoursPerWeek = activePlacementsForImpact.reduce((sum: number, p: any) => 
          sum + (Number(p.hours_per_week) || 0), 0
        )
        const averageHourlyRate = activePlacementsForImpact.length > 0
          ? activePlacementsForImpact.reduce((sum: number, p: any) => 
              sum + (Number(p.hourly_rate) || 0), 0
            ) / activePlacementsForImpact.length
          : 0
        const estimatedMonthlyIncome = totalHoursPerWeek * averageHourlyRate * 4

        reportData = {
          peoplePlaced: activePlacementsForImpact.length,
          totalHoursPerWeek,
          averageHourlyRate: averageHourlyRate.toFixed(2),
          estimatedMonthlyIncome: estimatedMonthlyIncome.toFixed(2),
          estimatedAnnualIncome: (estimatedMonthlyIncome * 12).toFixed(2),
        }
        break

      default:
        reportData = {
          placements: placements?.length || 0,
          workers: workers?.length || 0,
          revenue: placements
            ? placements.reduce((sum: number, p: any) => sum + Number(p.placement_fee || 0), 0)
            : 0,
        }
    }

    return NextResponse.json({ report: reportData })
  } catch (error) {
    console.error('[v0] Get agency report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

