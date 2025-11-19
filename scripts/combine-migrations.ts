#!/usr/bin/env tsx
/**
 * Combine all migration SQL files into a single file
 * This makes it easy to paste into Supabase Dashboard SQL Editor
 * 
 * Usage: tsx scripts/combine-migrations.ts
 * Output: scripts/all-migrations-combined.sql
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

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

function main() {
  console.log('📦 Combining all migration files...\n')

  const scriptsDir = resolve(process.cwd(), 'scripts')
  const outputFile = resolve(scriptsDir, 'all-migrations-combined.sql')
  
  if (!existsSync(scriptsDir)) {
    console.error(`❌ Scripts directory not found: ${scriptsDir}`)
    process.exit(1)
  }

  let combinedSQL = `-- ============================================================================
-- COMBINED MIGRATION SCRIPT
-- ============================================================================
-- This file contains all database migrations combined in the correct order.
-- 
-- USAGE:
--   1. Copy this entire file
--   2. Go to https://app.supabase.com → Your Project → SQL Editor
--   3. Click "New query"
--   4. Paste this entire file
--   5. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
--
-- All migrations use "IF NOT EXISTS" clauses, so it's safe to run multiple times.
-- ============================================================================

`

  let successCount = 0
  let skipCount = 0
  const errors: string[] = []

  for (const migration of MIGRATIONS) {
    const sqlPath = resolve(scriptsDir, migration)
    
    if (!existsSync(sqlPath)) {
      console.log(`⏭️  Skipping ${migration} (file not found)`)
      skipCount++
      continue
    }

    try {
      const sql = readFileSync(sqlPath, 'utf-8')
      const fileSize = (sql.length / 1024).toFixed(1)
      
      combinedSQL += `\n-- ============================================================================\n`
      combinedSQL += `-- ${migration}\n`
      combinedSQL += `-- ============================================================================\n\n`
      combinedSQL += sql
      combinedSQL += `\n\n`
      
      console.log(`✅ Added ${migration} (${fileSize} KB)`)
      successCount++
    } catch (error: any) {
      const errorMsg = `❌ Error reading ${migration}: ${error.message}`
      console.error(errorMsg)
      errors.push(errorMsg)
    }
  }

  // Write combined file
  try {
    writeFileSync(outputFile, combinedSQL, 'utf-8')
    const totalSize = (combinedSQL.length / 1024).toFixed(1)
    
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Summary:')
    console.log(`   ✅ Combined: ${successCount} migration files`)
    console.log(`   ⏭️  Skipped: ${skipCount} files`)
    console.log(`   ❌ Errors: ${errors.length}`)
    console.log(`   📄 Output: ${outputFile}`)
    console.log(`   📦 Total size: ${totalSize} KB`)
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      errors.forEach(err => console.log(`   ${err}`))
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('\n📋 Next Steps:')
    console.log('\n1. Open the combined file:')
    console.log(`   open ${outputFile}`)
    console.log('\n   Or manually:')
    console.log(`   cat ${outputFile}`)
    console.log('\n2. Copy the entire contents')
    console.log('\n3. Go to Supabase Dashboard:')
    console.log('   https://app.supabase.com → Your Project → SQL Editor → New query')
    console.log('\n4. Paste and click "Run" (Cmd+Enter / Ctrl+Enter)')
    console.log('\n✅ That\'s it! All migrations will run in one go.\n')
    
  } catch (error: any) {
    console.error(`\n❌ Error writing combined file: ${error.message}`)
    process.exit(1)
  }
}

try {
  main()
} catch (error: any) {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
}

