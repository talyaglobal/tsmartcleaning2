import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import {
	checkDatabaseHealth,
	getQueryStats,
	getConnectionPoolMetrics,
	getSlowQueries,
	getFailedQueries,
} from '@/lib/db-monitoring'

/**
 * GET /api/monitoring/database
 * Returns database monitoring metrics
 * Requires admin authentication
 */
export const GET = withAuth(
	async (request: NextRequest, { user, supabase }) => {
		// Only allow admins and root admins
		if (user.role !== 'admin' && user.role !== 'root_admin') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
		}

		try {
			const timeWindow = parseInt(
				request.nextUrl.searchParams.get('timeWindow') || '60'
			)
			const includeSlowQueries =
				request.nextUrl.searchParams.get('includeSlowQueries') === 'true'
			const includeFailedQueries =
				request.nextUrl.searchParams.get('includeFailedQueries') === 'true'

			// Get database health
			const health = await checkDatabaseHealth()

			// Get query statistics
			const queryStats = getQueryStats(timeWindow)

			// Get connection pool metrics
			const poolMetrics = getConnectionPoolMetrics()

			// Get slow queries if requested
			const slowQueries = includeSlowQueries ? getSlowQueries(1000, 20) : []

			// Get failed queries if requested
			const failedQueries = includeFailedQueries ? getFailedQueries(20) : []

			return NextResponse.json({
				health,
				queryStats,
				connectionPool: poolMetrics,
				slowQueries: slowQueries.map((q) => ({
					query: q.query,
					duration: Math.round(q.duration * 100) / 100,
					timestamp: q.timestamp.toISOString(),
					table: q.table,
					error: q.error,
				})),
				failedQueries: failedQueries.map((q) => ({
					query: q.query,
					duration: Math.round(q.duration * 100) / 100,
					timestamp: q.timestamp.toISOString(),
					table: q.table,
					error: q.error,
				})),
				timestamp: new Date().toISOString(),
			})
		} catch (error: any) {
			console.error('[Monitoring] Error getting database metrics:', error)
			return NextResponse.json(
				{ error: 'Failed to get monitoring metrics', details: error.message },
				{ status: 500 }
			)
		}
	},
	{ requiredRole: ['admin', 'root_admin'] }
)


