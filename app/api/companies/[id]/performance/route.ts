import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { verifyCompanyMembership } from '@/lib/auth/rbac'

export const GET = withAuth(
	async (
		request: NextRequest,
		auth: { user: any, supabase: any, tenantId: string | null },
		context?: { params: { id: string } }
	) => {
		try {
			if (!context?.params?.id) {
				return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
			}

			const { id } = context.params
			const url = new URL(request.url)
			const period = url.searchParams.get('period') || '30'
			const includeDetails = url.searchParams.get('details') === 'true'

			// Verify user is a member of this company or is an admin
			const hasAccess = await verifyCompanyMembership(
				id,
				auth.user.id,
				auth.supabase,
				auth.user.role
			)

			if (!hasAccess) {
				return NextResponse.json(
					{ error: 'You do not have access to this company' },
					{ status: 403 }
				)
			}

			const now = new Date()
			const periodDays = parseInt(period)
			const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

			// Core performance metrics
			const performanceMetrics = await calculatePerformanceMetrics(auth.supabase, id, startDate, now)
			
			// Service quality metrics
			const qualityMetrics = await calculateQualityMetrics(auth.supabase, id, startDate, now)

			// Operational efficiency metrics
			const efficiencyMetrics = await calculateEfficiencyMetrics(auth.supabase, id, startDate, now)

			// Customer satisfaction tracking
			const satisfactionMetrics = await calculateSatisfactionMetrics(auth.supabase, id, startDate, now)

			// Team performance metrics
			const teamMetrics = await calculateTeamPerformance(auth.supabase, id, startDate, now)

			// Performance trends over time
			const trendData = await calculatePerformanceTrends(auth.supabase, id, startDate, now)

			const result = {
				period: {
					start: startDate.toISOString(),
					end: now.toISOString(),
					days: periodDays
				},
				overview: performanceMetrics,
				quality: qualityMetrics,
				efficiency: efficiencyMetrics,
				satisfaction: satisfactionMetrics,
				team: teamMetrics,
				trends: trendData,
				generatedAt: now.toISOString()
			}

			// Include detailed breakdowns if requested
			if (includeDetails) {
				const detailedMetrics = await calculateDetailedMetrics(auth.supabase, id, startDate, now)
				result.details = detailedMetrics
			}

			return NextResponse.json(result)

		} catch (error) {
			console.error('[v0] Performance tracking GET error:', error)
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			)
		}
	}
)

async function calculatePerformanceMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	const [jobsResult, completedJobsResult, onTimeJobsResult, cancelledJobsResult] = await Promise.all([
		supabase
			.from('jobs')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString()),
		
		supabase
			.from('jobs')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
			.eq('status', 'completed')
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString()),
		
		supabase
			.from('jobs')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
			.eq('status', 'completed')
			.is('delay_minutes', null)
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString()),
		
		supabase
			.from('jobs')
			.select('id', { count: 'exact', head: true })
			.eq('company_id', companyId)
			.eq('status', 'cancelled')
			.gte('start_datetime', startDate.toISOString())
			.lte('start_datetime', endDate.toISOString())
	])

	const totalJobs = jobsResult.count || 0
	const completedJobs = completedJobsResult.count || 0
	const onTimeJobs = onTimeJobsResult.count || 0
	const cancelledJobs = cancelledJobsResult.count || 0

	return {
		totalJobs,
		completedJobs,
		completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
		onTimeRate: completedJobs > 0 ? Math.round((onTimeJobs / completedJobs) * 100) : 0,
		cancellationRate: totalJobs > 0 ? Math.round((cancelledJobs / totalJobs) * 100) : 0,
		successRate: totalJobs > 0 ? Math.round(((totalJobs - cancelledJobs) / totalJobs) * 100) : 0
	}
}

async function calculateQualityMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Reviews and ratings
	const { data: reviews } = await supabase
		.from('reviews')
		.select('rating, comment')
		.eq('company_id', companyId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString())

	// Complaints and issues
	const { count: complaintsCount } = await supabase
		.from('complaints')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString())

	// Rework requests
	const { count: reworkCount } = await supabase
		.from('jobs')
		.select('id', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('requires_rework', true)
		.gte('start_datetime', startDate.toISOString())
		.lte('start_datetime', endDate.toISOString())

	const ratings = (reviews || []).map(r => r.rating).filter(r => r != null)
	const averageRating = ratings.length > 0 ? 
		Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 100) / 100 : 0

	// Rating distribution
	const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
		star,
		count: ratings.filter(r => r === star).length,
		percentage: ratings.length > 0 ? Math.round((ratings.filter(r => r === star).length / ratings.length) * 100) : 0
	}))

	return {
		averageRating,
		totalReviews: reviews?.length || 0,
		ratingDistribution,
		complaintsCount: complaintsCount || 0,
		reworkRate: (reviews?.length || 0) > 0 ? Math.round(((reworkCount || 0) / (reviews?.length || 1)) * 100) : 0,
		qualityScore: Math.round(((averageRating / 5) * 0.6 + (1 - (complaintsCount || 0) / Math.max(reviews?.length || 1, 1)) * 0.4) * 100)
	}
}

async function calculateEfficiencyMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Job duration and efficiency
	const { data: jobTimes } = await supabase
		.from('jobs')
		.select('start_datetime, end_datetime, estimated_duration, actual_duration, status')
		.eq('company_id', companyId)
		.eq('status', 'completed')
		.gte('start_datetime', startDate.toISOString())
		.lte('start_datetime', endDate.toISOString())

	// Resource utilization
	const { data: teamUtilization } = await supabase
		.from('cleaner_jobs')
		.select(`
			cleaner_id,
			jobs!inner(start_datetime, end_datetime, company_id)
		`)
		.eq('jobs.company_id', companyId)
		.gte('jobs.start_datetime', startDate.toISOString())
		.lte('jobs.start_datetime', endDate.toISOString())

	const jobsWithTimes = (jobTimes || []).filter(job => job.actual_duration != null)
	const avgJobDuration = jobsWithTimes.length > 0 ? 
		Math.round((jobsWithTimes.reduce((sum, job) => sum + (job.actual_duration || 0), 0) / jobsWithTimes.length) * 100) / 100 : 0

	// Efficiency compared to estimates
	const jobsWithEstimates = jobsWithTimes.filter(job => job.estimated_duration != null)
	const timeEfficiency = jobsWithEstimates.length > 0 ? 
		Math.round((jobsWithEstimates.reduce((sum, job) => {
			const efficiency = (job.estimated_duration || 0) / (job.actual_duration || 1)
			return sum + Math.min(efficiency, 2) // Cap at 200% efficiency
		}, 0) / jobsWithEstimates.length) * 100) : 100

	// Team utilization
	const teamUtilizationRate = calculateTeamUtilization(teamUtilization, startDate, endDate)

	return {
		avgJobDuration,
		timeEfficiency,
		utilizationRate: teamUtilizationRate,
		jobsPerDay: Math.round(((jobTimes?.length || 0) / Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 1)) * 100) / 100,
		efficiencyScore: Math.round((timeEfficiency + teamUtilizationRate) / 2)
	}
}

async function calculateSatisfactionMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Customer satisfaction survey results
	const { data: satisfactionData } = await supabase
		.from('customer_satisfaction')
		.select('overall_rating, likelihood_recommend, service_quality, timeliness')
		.eq('company_id', companyId)
		.gte('created_at', startDate.toISOString())
		.lte('created_at', endDate.toISOString())

	// Net Promoter Score calculation
	const npsData = (satisfactionData || [])
		.map(s => s.likelihood_recommend)
		.filter(rating => rating != null)

	const npsScore = calculateNPS(npsData)

	// Overall satisfaction
	const overallRatings = (satisfactionData || [])
		.map(s => s.overall_rating)
		.filter(rating => rating != null)

	const avgSatisfaction = overallRatings.length > 0 ? 
		Math.round((overallRatings.reduce((sum, rating) => sum + rating, 0) / overallRatings.length) * 100) / 100 : 0

	return {
		avgSatisfaction,
		npsScore,
		responseCount: satisfactionData?.length || 0,
		satisfactionTrend: 0, // Would calculate vs previous period
		customerRetention: 0, // Would calculate from customer data
		loyaltyScore: Math.round(((avgSatisfaction / 10) * 0.7 + (Math.max(npsScore + 100, 0) / 200) * 0.3) * 100)
	}
}

async function calculateTeamPerformance(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Individual cleaner performance
	const { data: cleanerPerformance } = await supabase
		.from('cleaner_jobs')
		.select(`
			cleaner_id,
			cleaners(name, email),
			jobs!inner(
				status,
				total_amount,
				start_datetime,
				end_datetime,
				company_id,
				reviews(rating)
			)
		`)
		.eq('jobs.company_id', companyId)
		.gte('jobs.start_datetime', startDate.toISOString())
		.lte('jobs.start_datetime', endDate.toISOString())

	// Aggregate by cleaner
	const cleanerStats = (cleanerPerformance || []).reduce((acc, item) => {
		const cleanerId = item.cleaner_id
		if (!acc[cleanerId]) {
			acc[cleanerId] = {
				cleanerId,
				name: item.cleaners?.name || 'Unknown',
				email: item.cleaners?.email,
				jobsCompleted: 0,
				totalRevenue: 0,
				avgRating: 0,
				ratings: []
			}
		}

		if (item.jobs.status === 'completed') {
			acc[cleanerId].jobsCompleted += 1
			acc[cleanerId].totalRevenue += item.jobs.total_amount || 0
		}

		if (item.jobs.reviews && item.jobs.reviews.length > 0) {
			item.jobs.reviews.forEach(review => {
				if (review.rating) {
					acc[cleanerId].ratings.push(review.rating)
				}
			})
		}

		return acc
	}, {} as Record<string, any>)

	// Calculate averages and rankings
	const teamPerformanceData = Object.values(cleanerStats).map((cleaner: any) => {
		const avgRating = cleaner.ratings.length > 0 ? 
			cleaner.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / cleaner.ratings.length : 0

		return {
			...cleaner,
			avgRating: Math.round(avgRating * 100) / 100,
			avgRevenuePerJob: cleaner.jobsCompleted > 0 ? 
				Math.round((cleaner.totalRevenue / cleaner.jobsCompleted) * 100) / 100 : 0
		}
	}).sort((a, b) => b.jobsCompleted - a.jobsCompleted)

	return {
		totalCleaners: teamPerformanceData.length,
		topPerformers: teamPerformanceData.slice(0, 5),
		teamStats: {
			avgJobsPerCleaner: teamPerformanceData.length > 0 ? 
				Math.round((teamPerformanceData.reduce((sum, cleaner) => sum + cleaner.jobsCompleted, 0) / teamPerformanceData.length) * 100) / 100 : 0,
			avgTeamRating: teamPerformanceData.length > 0 ? 
				Math.round((teamPerformanceData.reduce((sum, cleaner) => sum + cleaner.avgRating, 0) / teamPerformanceData.length) * 100) / 100 : 0,
			totalTeamRevenue: Math.round(teamPerformanceData.reduce((sum, cleaner) => sum + cleaner.totalRevenue, 0) * 100) / 100
		}
	}
}

async function calculatePerformanceTrends(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Weekly performance trends
	const { data: weeklyJobs } = await supabase
		.from('jobs')
		.select('start_datetime, status, total_amount')
		.eq('company_id', companyId)
		.gte('start_datetime', startDate.toISOString())
		.lte('start_datetime', endDate.toISOString())

	// Group by week
	const weeklyData = (weeklyJobs || []).reduce((acc, job) => {
		const week = getWeekNumber(new Date(job.start_datetime))
		const year = new Date(job.start_datetime).getFullYear()
		const weekKey = `${year}-W${week}`

		if (!acc[weekKey]) {
			acc[weekKey] = {
				week: weekKey,
				totalJobs: 0,
				completedJobs: 0,
				revenue: 0
			}
		}

		acc[weekKey].totalJobs += 1
		if (job.status === 'completed') {
			acc[weekKey].completedJobs += 1
			acc[weekKey].revenue += job.total_amount || 0
		}

		return acc
	}, {} as Record<string, any>)

	const trendData = Object.values(weeklyData)
		.sort((a: any, b: any) => a.week.localeCompare(b.week))
		.map((week: any) => ({
			...week,
			completionRate: week.totalJobs > 0 ? Math.round((week.completedJobs / week.totalJobs) * 100) : 0,
			avgRevenuePerJob: week.completedJobs > 0 ? Math.round((week.revenue / week.completedJobs) * 100) / 100 : 0
		}))

	return {
		weekly: trendData,
		summary: {
			totalWeeks: trendData.length,
			avgJobsPerWeek: trendData.length > 0 ? 
				Math.round((trendData.reduce((sum, week) => sum + week.totalJobs, 0) / trendData.length) * 100) / 100 : 0,
			avgCompletionRate: trendData.length > 0 ? 
				Math.round((trendData.reduce((sum, week) => sum + week.completionRate, 0) / trendData.length) * 100) / 100 : 0
		}
	}
}

async function calculateDetailedMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
	// Property-specific performance
	const { data: propertyPerformance } = await supabase
		.from('jobs')
		.select(`
			property_id,
			status,
			total_amount,
			properties(name)
		`)
		.eq('company_id', companyId)
		.gte('start_datetime', startDate.toISOString())
		.lte('start_datetime', endDate.toISOString())

	const propertyStats = (propertyPerformance || []).reduce((acc, job) => {
		const propertyName = job.properties?.name || 'Unknown Property'
		if (!acc[propertyName]) {
			acc[propertyName] = {
				property: propertyName,
				totalJobs: 0,
				completedJobs: 0,
				revenue: 0
			}
		}

		acc[propertyName].totalJobs += 1
		if (job.status === 'completed') {
			acc[propertyName].completedJobs += 1
			acc[propertyName].revenue += job.total_amount || 0
		}

		return acc
	}, {} as Record<string, any>)

	return {
		propertyBreakdown: Object.values(propertyStats)
			.sort((a: any, b: any) => b.revenue - a.revenue)
			.slice(0, 10)
	}
}

function calculateTeamUtilization(teamData: any[], startDate: Date, endDate: Date): number {
	// Simplified utilization calculation
	// In a real implementation, this would consider working hours, availability, etc.
	const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
	const totalCleaners = [...new Set((teamData || []).map(item => item.cleaner_id))].length
	const totalJobsHandled = (teamData || []).length

	if (totalCleaners === 0) return 0

	// Assume each cleaner can handle 2 jobs per day on average
	const maxCapacity = totalCleaners * totalDays * 2
	return maxCapacity > 0 ? Math.min(Math.round((totalJobsHandled / maxCapacity) * 100), 100) : 0
}

function calculateNPS(ratings: number[]): number {
	if (ratings.length === 0) return 0

	const promoters = ratings.filter(r => r >= 9).length
	const detractors = ratings.filter(r => r <= 6).length
	
	return Math.round(((promoters - detractors) / ratings.length) * 100)
}

function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}