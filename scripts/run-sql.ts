#!/usr/bin/env tsx
/**
 * Execute SQL script against Supabase database
 * 
 * Usage: tsx scripts/run-sql.ts <sql-file>
 * Example: tsx scripts/run-sql.ts scripts/14_create_missing_tables.sql
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { createServerSupabase } from '../lib/supabase'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function executeSQL(sql: string) {
  const supabase = createServerSupabase()
  
  // Split SQL into individual statements
  // Remove comments and empty lines, then split by semicolons
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .filter(s => !s.match(/^\s*$/))

  console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`)
  
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ statement: string; error: string }> = []

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    // Skip DO blocks and complex statements that can't be executed via RPC
    if (statement.match(/^\s*DO\s+\$\$/i) || statement.length > 10000) {
      console.log(`⏭️  Skipping complex statement ${i + 1}/${statements.length} (DO block or too large)`)
      continue
    }

    try {
      // Use RPC to execute SQL (requires a function in Supabase)
      // For now, we'll use a workaround: try to execute via REST API
      // Note: This requires the SQL to be wrapped in a function or executed via dashboard
      
      // Since Supabase JS client doesn't support raw SQL execution,
      // we'll provide instructions instead
      console.log(`⚠️  Statement ${i + 1}/${statements.length} cannot be executed via JS client`)
      console.log(`   Use Supabase Dashboard SQL Editor or psql instead\n`)
      
    } catch (error: any) {
      errorCount++
      errors.push({ statement: statement.substring(0, 100), error: error.message })
      console.log(`❌ Error in statement ${i + 1}: ${error.message}`)
    }
  }

  return { successCount, errorCount, errors }
}

async function main() {
  const sqlFile = process.argv[2]

  if (!sqlFile) {
    console.error('❌ Error: Please provide a SQL file path')
    console.error('Usage: tsx scripts/run-sql.ts <sql-file>')
    console.error('Example: tsx scripts/run-sql.ts scripts/14_create_missing_tables.sql')
    process.exit(1)
  }

  try {
    console.log(`📖 Reading SQL file: ${sqlFile}\n`)
    const sql = readFileSync(resolve(process.cwd(), sqlFile), 'utf-8')
    
    console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.')
    console.log('📋 Please use one of these methods:\n')
    console.log('Method 1: Supabase Dashboard (Recommended)')
    console.log('  1. Go to https://app.supabase.com/project/_/sql/new')
    console.log(`  2. Copy and paste the contents of ${sqlFile}`)
    console.log('  3. Click "Run" to execute\n')
    
    console.log('Method 2: Using psql')
    console.log('  1. Get your connection string from Supabase Dashboard:')
    console.log('     Settings > Database > Connection string > URI')
    console.log('  2. Run: psql "<connection-string>" -f scripts/14_create_missing_tables.sql\n')
    
    console.log('Method 3: Using Supabase CLI (if you have it set up)')
    console.log('  supabase db push (if using migrations)\n')
    
    // Still try to validate the SQL file
    const result = await executeSQL(sql)
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary')
    console.log('='.repeat(60))
    console.log(`✅ Processed: ${result.successCount} statements`)
    console.log(`❌ Errors: ${result.errorCount}`)
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      result.errors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.error}`)
        console.log(`   Statement: ${err.statement}...`)
      })
    }
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`)
    if (error.code === 'ENOENT') {
      console.error(`   File not found: ${sqlFile}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

