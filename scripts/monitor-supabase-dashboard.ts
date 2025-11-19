/**
 * Script to review and verify Supabase monitoring dashboard access
 * This script checks if you can access Supabase monitoring features
 */

import * as dotenv from 'dotenv'
import { createServerSupabase } from '../lib/supabase'
import { checkDatabaseHealth, getQueryStats, getConnectionPoolMetrics } from '../lib/db-monitoring'

dotenv.config({ path: '.env.local' })

interface DashboardCheckResult {
	name: string
	status: 'success' | 'warning' | 'error'
	message: string
	details?: any
}

const results: DashboardCheckResult[] = []

function logResult(
	name: string,
	status: 'success' | 'warning' | 'error',
	message: string,
	details?: any
) {
	results.push({ name, status, message, details })
	const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌'
	console.log(`${icon} ${name}: ${message}`)
	if (details) {
		console.log(`   Details:`, JSON.stringify(details, null, 2))
	}
}

async function checkEnvironmentVariables() {
	console.log('\n📋 Step 1: Checking Environment Variables\n')

	const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
	const optionalVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

	let allPresent = true

	for (const varName of requiredVars) {
		const value = process.env[varName]
		if (value) {
			const masked = value.length > 10 ? `${value.substring(0, 10)}...` : '***'
			logResult(
				`Environment: ${varName}`,
				'success',
				`Set (${masked})`,
				{ length: value.length }
			)
		} else {
			logResult(`Environment: ${varName}`, 'error', 'Missing')
			allPresent = false
		}
	}

	for (const varName of optionalVars) {
		const value = process.env[varName]
		if (value) {
			const masked = value.length > 10 ? `${value.substring(0, 10)}...` : '***'
			logResult(
				`Environment: ${varName}`,
				'success',
				`Set (${masked})`,
				{ length: value.length }
			)
		} else {
			logResult(`Environment: ${varName}`, 'warning', 'Not set (optional)')
		}
	}

	return allPresent
}

async function checkDatabaseConnection() {
	console.log('\n🔌 Step 2: Testing Database Connection\n')

	try {
		const supabase = createServerSupabase()
		logResult('Connection', 'success', 'Supabase client created')

		// Test basic query
		const { data, error } = await supabase.from('services').select('id').limit(1)

		if (error) {
			logResult('Database Query', 'error', 'Failed to query database', {
				error: error.message,
			})
			return false
		}

		logResult('Database Query', 'success', 'Successfully queried database', {
			rowsReturned: data?.length || 0,
		})
		return true
	} catch (error: any) {
		logResult('Database Connection', 'error', 'Connection failed', {
			error: error.message,
		})
		return false
	}
}

async function checkDatabaseHealth() {
	console.log('\n🏥 Step 3: Checking Database Health\n')

	try {
		const health = await checkDatabaseHealth()
		const statusIcon =
			health.status === 'healthy'
				? '✅'
				: health.status === 'degraded'
					? '⚠️'
					: '❌'

		logResult(
			'Database Health',
			health.status === 'healthy' ? 'success' : health.status === 'degraded' ? 'warning' : 'error',
			`Status: ${health.status.toUpperCase()}`,
			{
				responseTime: `${health.responseTime}ms`,
				errorRate: `${health.errorRate}%`,
				slowQueries: health.slowQueries,
				connectionPoolStatus: health.connectionPoolStatus,
			}
		)

		return health.status !== 'unhealthy'
	} catch (error: any) {
		logResult('Database Health Check', 'error', 'Health check failed', {
			error: error.message,
		})
		return false
	}
}

async function checkQueryPerformance() {
	console.log('\n⚡ Step 4: Checking Query Performance\n')

	try {
		const stats = getQueryStats(60) // Last hour

		if (stats.totalQueries === 0) {
			logResult(
				'Query Performance',
				'warning',
				'No queries recorded yet (run some queries first)',
				stats
			)
			return true
		}

		const status =
			stats.errorRate > 10 || stats.averageDuration > 2000
				? 'error'
				: stats.errorRate > 5 || stats.averageDuration > 1000
					? 'warning'
					: 'success'

		logResult('Query Performance', status, 'Performance metrics retrieved', {
			totalQueries: stats.totalQueries,
			successRate: `${100 - stats.errorRate}%`,
			averageDuration: `${stats.averageDuration}ms`,
			slowQueries: stats.slowQueries,
			topTables: Object.entries(stats.queriesByTable)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([table, count]) => ({ table, count })),
		})

		return true
	} catch (error: any) {
		logResult('Query Performance', 'error', 'Failed to get performance metrics', {
			error: error.message,
		})
		return false
	}
}

async function checkConnectionPool() {
	console.log('\n🔗 Step 5: Checking Connection Pool\n')

	try {
		const poolMetrics = getConnectionPoolMetrics()

		const poolStatus =
			poolMetrics.waitingQueries > 10 || poolMetrics.activeConnections > 80
				? 'warning'
				: 'success'

		logResult('Connection Pool', poolStatus, 'Connection pool metrics retrieved', {
			activeConnections: poolMetrics.activeConnections,
			idleConnections: poolMetrics.idleConnections,
			totalConnections: poolMetrics.totalConnections,
			maxConnections: poolMetrics.maxConnections,
			waitingQueries: poolMetrics.waitingQueries,
			utilization: `${Math.round((poolMetrics.totalConnections / poolMetrics.maxConnections) * 100)}%`,
		})

		return true
	} catch (error: any) {
		logResult('Connection Pool', 'error', 'Failed to get pool metrics', {
			error: error.message,
		})
		return false
	}
}

function printDashboardInstructions() {
	console.log('\n📊 Step 6: Supabase Dashboard Access Instructions\n')
	console.log('=' .repeat(70))
	console.log('\nTo access Supabase monitoring dashboard:')
	console.log('\n1. Go to: https://app.supabase.com')
	console.log('2. Select your project')
	console.log('3. Navigate to: Project Settings > Database')
	console.log('4. Check the following sections:')
	console.log('   - Database Health')
	console.log('   - Connection Pooling')
	console.log('   - Query Performance')
	console.log('   - Database Size')
	console.log('   - Active Connections')
	console.log('\n5. Navigate to: Project Settings > API')
	console.log('   - Review API usage metrics')
	console.log('   - Check rate limits')
	console.log('\n6. Navigate to: Logs & Monitoring')
	console.log('   - Review database logs')
	console.log('   - Check error rates')
	console.log('   - Monitor slow queries')
	console.log('\n7. Set up alerts (if available):')
	console.log('   - High error rate alerts')
	console.log('   - Connection pool exhaustion alerts')
	console.log('   - Slow query alerts')
	console.log('\n' + '='.repeat(70))
}

async function main() {
	console.log('🚀 Starting Supabase Monitoring Dashboard Review\n')
	console.log('='.repeat(70))

	// Step 1: Environment variables
	const envOk = await checkEnvironmentVariables()
	if (!envOk) {
		console.log('\n❌ Environment variables check failed.')
		process.exit(1)
	}

	// Step 2: Database connection
	const connectionOk = await checkDatabaseConnection()
	if (!connectionOk) {
		console.log('\n❌ Database connection failed.')
		process.exit(1)
	}

	// Step 3: Database health
	await checkDatabaseHealth()

	// Step 4: Query performance
	await checkQueryPerformance()

	// Step 5: Connection pool
	await checkConnectionPool()

	// Step 6: Dashboard instructions
	printDashboardInstructions()

	// Summary
	console.log('\n' + '='.repeat(70))
	console.log('\n📊 Monitoring Review Summary\n')

	const successCount = results.filter((r) => r.status === 'success').length
	const warningCount = results.filter((r) => r.status === 'warning').length
	const errorCount = results.filter((r) => r.status === 'error').length

	console.log(`✅ Success: ${successCount}`)
	console.log(`⚠️  Warnings: ${warningCount}`)
	console.log(`❌ Errors: ${errorCount}`)

	if (errorCount === 0) {
		console.log('\n🎉 All critical checks passed!')
		console.log('\n📝 Next Steps:')
		console.log('   1. Access Supabase dashboard at https://app.supabase.com')
		console.log('   2. Review monitoring metrics in Project Settings')
		console.log('   3. Set up alerts for critical metrics')
		console.log('   4. Monitor query performance regularly')
		console.log('   5. Review connection pool utilization')
		process.exit(0)
	} else {
		console.log('\n⚠️  Some checks failed. Please review the errors above.')
		process.exit(1)
	}
}

// Run the review
main().catch((error) => {
	console.error('\n❌ Fatal error:', error)
	process.exit(1)
})

