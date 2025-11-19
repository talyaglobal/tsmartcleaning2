#!/usr/bin/env tsx
/**
 * Run all database migrations in the correct order
 * 
 * This script runs all SQL migration files in the scripts/ directory
 * in the correct order to ensure all database tables are created.
 * 
 * Usage: tsx scripts/run-all-migrations.ts
 * 
 * Required environment variables:
 * - SUPABASE_URL (e.g., https://xxxxx.supabase.co)
 * - SUPABASE_DB_PASSWORD (database password from Supabase Dashboard)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// Define migration order (must match dependency order)
const MIGRATIONS = [
  '01_create_tables.sql',
  '02_create_rls_policies.sql',
  '03_seed_services.sql',
  '04_create_functions.sql',
  '05_alter_and_missing_tables.sql',
  '06_add_add_ons_table.sql',
  '06_loyalty.sql',
  '07_seed_add_ons.sql',
  '08_customer_personalization.sql',
  '09_multi_tenant.sql',
  '09_multitenancy.sql',
  '09_multitenancy_rls.sql',
  '10_custom_domains.sql',
  '10_revenue_share.sql',
  '11_audit_logs.sql',
  '11_usage_and_billing.sql',
  '12_insurance.sql',
  '14_create_missing_tables.sql',
  '15_blog_and_newsletter.sql',
  '16_support_tickets.sql',
  '17_membership_cards.sql',
  '18_company_invoices.sql',
  '19_messages.sql',
]

function extractHostFromUrl(url: string): { host: string; port: string } | null {
  try {
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match && match[1]) {
      const projectRef = match[1]
      
      // Try different connection methods:
      // 1. Direct connection (preferred)
      // 2. Connection pooler (if direct fails)
      
      return {
        host: `db.${projectRef}.supabase.co`,
        port: '5432'
      }
    }
    return null
  } catch {
    return null
  }
}

function getConnectionOptions() {
  const supabaseUrl = process.env.SUPABASE_URL
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required')
  }
  
  if (!dbPassword) {
    throw new Error('SUPABASE_DB_PASSWORD environment variable is required')
  }

  // If host is manually specified, use it
  if (process.env.SUPABASE_DB_HOST) {
    return {
      host: process.env.SUPABASE_DB_HOST,
      port: process.env.SUPABASE_DB_PORT || '5432',
      user: process.env.SUPABASE_DB_USER || 'postgres',
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      password: dbPassword,
    }
  }

  // Try to extract from URL
  const hostInfo = extractHostFromUrl(supabaseUrl)
  if (!hostInfo) {
    throw new Error('Could not extract database host from SUPABASE_URL. Please set SUPABASE_DB_HOST manually.')
  }

  return {
    host: hostInfo.host,
    port: process.env.SUPABASE_DB_PORT || hostInfo.port,
    user: process.env.SUPABASE_DB_USER || 'postgres',
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    password: dbPassword,
  }
}

function executeSqlFile(sqlPath: string, connOptions: any): boolean {
  try {
    execSync(
      `psql -h "${connOptions.host}" -p "${connOptions.port}" -U "${connOptions.user}" -d "${connOptions.database}" -f "${sqlPath}"`,
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          PGPASSWORD: connOptions.password,
        }
      }
    )
    return true
  } catch (error: any) {
    if (error.message.includes('psql: command not found') || error.status === 127) {
      throw new Error('psql is not installed. Install PostgreSQL client tools first.')
    }
    throw error
  }
}

async function main() {
  console.log('🚀 Running all database migrations...\n')

  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const dbPassword = process.env.SUPABASE_DB_PASSWORD

    if (!supabaseUrl) {
      console.error('❌ Missing SUPABASE_URL environment variable')
      console.error('   Set it in .env.local or .env file')
      process.exit(1)
    }

    if (!dbPassword) {
      console.error('❌ Missing SUPABASE_DB_PASSWORD environment variable')
      console.error('   Set it in .env.local or .env file')
      process.exit(1)
    }

    console.log('✅ Environment variables found')
    console.log(`   SUPABASE_URL: ${supabaseUrl}`)
    console.log(`   SUPABASE_DB_PASSWORD: ${'*'.repeat(dbPassword.length)}\n`)

    // Get connection options
    const connOptions = getConnectionOptions()
    console.log(`🔌 Connecting to: ${connOptions.host}:${connOptions.port}`)
    console.log(`   Database: ${connOptions.database}`)
    console.log(`   User: ${connOptions.user}\n`)

    // Check if scripts directory exists
    const scriptsDir = resolve(process.cwd(), 'scripts')
    if (!existsSync(scriptsDir)) {
      throw new Error(`Scripts directory not found: ${scriptsDir}`)
    }

    // Run migrations in order
    console.log(`📋 Found ${MIGRATIONS.length} migration files to run\n`)
    console.log('=' .repeat(80))
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const migration of MIGRATIONS) {
      const sqlPath = resolve(scriptsDir, migration)
      
      if (!existsSync(sqlPath)) {
        console.log(`⏭️  Skipping ${migration} (file not found)`)
        skipCount++
        continue
      }

      console.log(`\n📄 Running: ${migration}`)
      console.log('-'.repeat(80))

      try {
        executeSqlFile(sqlPath, connOptions)
        console.log(`✅ Successfully executed: ${migration}`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Error executing ${migration}:`)
        console.error(`   ${error.message}`)
        
        // Provide helpful error messages
        if (error.message.includes('could not translate host name') || error.message.includes('nodename nor servname')) {
          console.error(`\n💡 Connection Error - Hostname cannot be resolved`)
          console.error(`   Your SUPABASE_URL: ${supabaseUrl}`)
          console.error(`   Attempted hostname: ${connOptions.host}`)
          console.error(`\n   To fix this:`)
          console.error(`   1. Go to Supabase Dashboard → Settings → Database`)
          console.error(`   2. Scroll to "Connection string" section`)
          console.error(`   3. Copy the "URI" connection string`)
          console.error(`   4. Extract the hostname and add to .env.local:`)
          console.error(`      SUPABASE_DB_HOST=your-actual-hostname.supabase.co`)
          console.error(`      SUPABASE_DB_PORT=5432`)
          console.error(`\n   Or use connection pooling:`)
          console.error(`      SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com`)
          console.error(`      SUPABASE_DB_PORT=6543`)
        } else if (error.message.includes('authentication failed') || error.message.includes('password')) {
          console.error(`\n💡 Authentication Error`)
          console.error(`   Verify your SUPABASE_DB_PASSWORD in .env.local`)
          console.error(`   Get/reset it from: Supabase Dashboard → Settings → Database`)
        }
        
        errorCount++
        console.log('\n⚠️  Continuing with next migration...')
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ⏭️  Skipped: ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 All migrations completed successfully!')
    } else {
      console.log(`\n⚠️  ${errorCount} migration(s) had errors. Please review the output above.`)
      console.log(`\n💡 Alternative Methods:`)
      console.log(`   1. Supabase Dashboard (Easiest):`)
      console.log(`      → Go to https://app.supabase.com → SQL Editor`)
      console.log(`      → Copy/paste each SQL file and run manually`)
      console.log(`\n   2. Fix connection settings:`)
      console.log(`      → Add SUPABASE_DB_HOST to .env.local (see instructions above)`)
      console.log(`      → Then run: npm run db:migrate`)
      console.log(`\n   3. Use Supabase CLI:`)
      console.log(`      → npm install -g supabase`)
      console.log(`      → supabase link --project-ref YOUR_PROJECT_REF`)
      console.log(`      → supabase db push`)
      process.exit(1)
    }

  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`)
    
    if (error.message.includes('psql: command not found')) {
      console.error('\n💡 Install PostgreSQL client tools:')
      console.error('   - macOS: brew install postgresql')
      console.error('   - Ubuntu/Debian: sudo apt-get install postgresql-client')
      console.error('   - Windows: Download from https://www.postgresql.org/download/')
      console.error('\n   Or run migrations manually via Supabase Dashboard SQL Editor')
    }
    
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

