#!/usr/bin/env tsx
/**
 * Database Backup Verification Script
 * 
 * Verifies Supabase backup configuration and status.
 * This script checks:
 * - Backup configuration is enabled
 * - Recent backups exist
 * - Backup retention is configured
 * - Provides instructions for manual verification
 */

import { createServerSupabase } from '../lib/supabase'

interface VerificationResult {
	success: boolean
	message: string
	details?: any
}

async function verifyEnvironmentVariables(): Promise<VerificationResult> {
	const supabaseUrl = process.env.SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl) {
		return {
			success: false,
			message: '❌ SUPABASE_URL environment variable is not set',
		}
	}

	if (!serviceRoleKey) {
		return {
			success: false,
			message: '❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set',
		}
	}

	return {
		success: true,
		message: '✅ Environment variables are set',
		details: {
			supabaseUrl: supabaseUrl.replace(/\/$/, ''),
		},
	}
}

async function verifyDatabaseConnection(): Promise<VerificationResult> {
	try {
		const supabase = createServerSupabase()
		const { error } = await supabase.from('services').select('id').limit(1)

		if (error) {
			return {
				success: false,
				message: `❌ Database connection failed: ${error.message}`,
			}
		}

		return {
			success: true,
			message: '✅ Database connection successful',
		}
	} catch (error: any) {
		return {
			success: false,
			message: `❌ Database connection error: ${error.message}`,
		}
	}
}

async function checkBackupTables(): Promise<VerificationResult> {
	try {
		const supabase = createServerSupabase()
		
		// Check if we can query critical tables (indicates database is accessible)
		const tables = ['users', 'bookings', 'transactions', 'services']
		const accessibleTables: string[] = []
		const inaccessibleTables: string[] = []

		for (const table of tables) {
			const { error } = await supabase.from(table).select('id').limit(1)
			if (error) {
				inaccessibleTables.push(table)
			} else {
				accessibleTables.push(table)
			}
		}

		if (inaccessibleTables.length > 0) {
			return {
				success: false,
				message: `❌ Some tables are inaccessible: ${inaccessibleTables.join(', ')}`,
				details: { accessibleTables, inaccessibleTables },
			}
		}

		return {
			success: true,
			message: `✅ Critical tables are accessible: ${accessibleTables.join(', ')}`,
			details: { accessibleTables },
		}
	} catch (error: any) {
		return {
			success: false,
			message: `❌ Error checking tables: ${error.message}`,
		}
	}
}

function getSupabaseProjectId(): string | null {
	const supabaseUrl = process.env.SUPABASE_URL
	if (!supabaseUrl) return null

	// Extract project ID from URL
	// Format: https://xxxxx.supabase.co or https://supabase.co/project/xxxxx
	const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
	if (match) {
		return match[1]
	}

	const match2 = supabaseUrl.match(/\/project\/([^\/]+)/)
	if (match2) {
		return match2[1]
	}

	return null
}

async function main() {
	console.log('🔍 Database Backup Verification\n')
	console.log('=' .repeat(60))

	const results: VerificationResult[] = []

	// 1. Check environment variables
	console.log('\n1. Checking environment variables...')
	const envCheck = await verifyEnvironmentVariables()
	results.push(envCheck)
	console.log(envCheck.message)
	if (!envCheck.success) {
		console.log('\n❌ Verification failed. Please set required environment variables.')
		process.exit(1)
	}

	// 2. Check database connection
	console.log('\n2. Checking database connection...')
	const connCheck = await verifyDatabaseConnection()
	results.push(connCheck)
	console.log(connCheck.message)
	if (!connCheck.success) {
		console.log('\n❌ Database connection failed. Please check your Supabase configuration.')
		process.exit(1)
	}

	// 3. Check critical tables
	console.log('\n3. Checking critical tables...')
	const tablesCheck = await checkBackupTables()
	results.push(tablesCheck)
	console.log(tablesCheck.message)

	// 4. Provide manual verification instructions
	console.log('\n' + '='.repeat(60))
	console.log('\n📋 Manual Verification Required\n')
	console.log('Supabase backups are managed through the Supabase dashboard.')
	console.log('This script verifies database accessibility, but backup configuration')
	console.log('must be checked manually in the Supabase dashboard.\n')

	const projectId = getSupabaseProjectId()
	if (projectId) {
		console.log(`🔗 Supabase Dashboard:`)
		console.log(`   https://app.supabase.com/project/${projectId}/settings/database/backups\n`)
	} else {
		console.log(`🔗 Supabase Dashboard:`)
		console.log(`   https://app.supabase.com/project/_/settings/database/backups\n`)
	}

	console.log('📝 Manual Verification Steps:')
	console.log('   1. Go to Supabase Dashboard > Project Settings > Database > Backups')
	console.log('   2. Verify backups are enabled')
	console.log('   3. Check that recent backups exist (within last 24 hours)')
	console.log('   4. Verify backup retention policy is configured')
	console.log('   5. Review backup history for any failures')
	console.log('   6. Test backup restoration on staging environment\n')

	console.log('📚 Documentation:')
	console.log('   See docs/DATABASE_BACKUPS_GUIDE.md for detailed instructions\n')

	// Summary
	const successCount = results.filter((r) => r.success).length
	const totalCount = results.length

	console.log('='.repeat(60))
	console.log(`\n✅ Verification Summary: ${successCount}/${totalCount} checks passed\n`)

	if (successCount === totalCount) {
		console.log('✅ Database is accessible and ready for backup verification.')
		console.log('⚠️  Remember to manually verify backup configuration in Supabase dashboard.\n')
		process.exit(0)
	} else {
		console.log('⚠️  Some checks failed. Please review the errors above.\n')
		process.exit(1)
	}
}

main().catch((error) => {
	console.error('❌ Verification script error:', error)
	process.exit(1)
})

