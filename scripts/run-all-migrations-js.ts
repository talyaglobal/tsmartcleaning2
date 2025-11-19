#!/usr/bin/env tsx
/**
 * Run all database migrations using Supabase JavaScript client
 * 
 * This script runs all SQL migration files using the Supabase REST API,
 * avoiding the need for psql and hostname resolution issues.
 * 
 * Usage: tsx scripts/run-all-migrations-js.ts
 * 
 * Required environment variables:
 * - SUPABASE_URL (e.g., https://xxxxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY (service role key from Supabase Dashboard)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'
import { createServerSupabase } from '../lib/supabase'

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

/**
 * Execute SQL using Supabase REST API
 * Note: Supabase REST API doesn't directly support arbitrary SQL execution,
 * but we can use the PostgREST API or execute via a custom RPC function.
 * 
 * For now, this uses the Management API approach which requires creating
 * a temporary function. However, the simplest approach is to guide users
 * to use the Supabase Dashboard SQL Editor.
 */
async function executeSqlViaSupabase(sql: string, supabase: ReturnType<typeof createServerSupabase>): Promise<{ success: boolean; error?: string }> {
  try {
    // Split SQL into individual statements
    // Remove comments and split by semicolons
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    for (const statement of statements) {
      if (statement.length === 0) continue

      // Try to execute via RPC (requires a function to execute dynamic SQL)
      // For now, we'll return an error suggesting manual execution
      // In production, you might want to create a helper RPC function
      console.warn(`⚠️  Direct SQL execution via JS client is limited.`)
      console.warn(`   Statement: ${statement.substring(0, 100)}...`)
      return { success: false, error: 'Direct SQL execution not supported. Use Supabase Dashboard or psql.' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Running all database migrations via Supabase API...\n')

  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('❌ Missing SUPABASE_URL environment variable')
      console.error('   Set it in .env.local or .env file')
      process.exit(1)
    }

    if (!serviceRoleKey) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      console.error('   Set it in .env.local or .env file')
      console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key')
      process.exit(1)
    }

    console.log('✅ Environment variables found')
    console.log(`   SUPABASE_URL: ${supabaseUrl}`)
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${'*'.repeat(serviceRoleKey.length)}\n`)

    // Create Supabase client
    const supabase = createServerSupabase()
    console.log('✅ Supabase client created\n')

    // Check if scripts directory exists
    const scriptsDir = resolve(process.cwd(), 'scripts')
    if (!existsSync(scriptsDir)) {
      throw new Error(`Scripts directory not found: ${scriptsDir}`)
    }

    console.log('⚠️  NOTE: The Supabase JavaScript client cannot execute arbitrary SQL directly.')
    console.log('    For full SQL migration support, please use one of these methods:\n')
    console.log('    1. Supabase Dashboard SQL Editor (Recommended - Easiest)')
    console.log('       → Go to https://app.supabase.com')
    console.log('       → Select your project → SQL Editor → New query')
    console.log('       → Copy/paste each SQL file and run\n')
    console.log('    2. Fix psql connection (see troubleshooting below)')
    console.log('       → Get connection string from Supabase Dashboard')
    console.log('       → Set SUPABASE_DB_HOST in .env.local\n')
    console.log('    Alternatively, you can use the Supabase CLI:\n')
    console.log('    3. Supabase CLI')
    console.log('       → Install: npm install -g supabase')
    console.log('       → Link: supabase link --project-ref YOUR_PROJECT_REF')
    console.log('       → Run: supabase db push\n')

    console.log('📋 Migration files to run manually:')
    console.log('=' .repeat(80))
    
    let successCount = 0
    let skipCount = 0

    for (const migration of MIGRATIONS) {
      const sqlPath = resolve(scriptsDir, migration)
      
      if (!existsSync(sqlPath)) {
        console.log(`⏭️  ${migration} (file not found)`)
        skipCount++
        continue
      }

      const fileSize = (readFileSync(sqlPath, 'utf-8').length / 1024).toFixed(1)
      console.log(`📄 ${migration} (${fileSize} KB)`)
      successCount++
    }

    console.log('='.repeat(80))
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Found: ${successCount} migration files`)
    console.log(`   ⏭️  Missing: ${skipCount} files`)
    
    console.log('\n💡 Next Steps:')
    console.log('   1. Go to https://app.supabase.com → Your Project → SQL Editor')
    console.log('   2. Run each migration file in order (01, 02, 03, ...)')
    console.log('   3. Copy/paste the SQL content and click "Run"')
    console.log(`\n   Or fix the psql connection by setting SUPABASE_DB_HOST in .env.local`)

  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

