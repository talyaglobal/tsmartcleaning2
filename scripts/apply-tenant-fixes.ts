#!/usr/bin/env tsx
/**
 * Apply Tenant Isolation Security Fixes
 * 
 * This script applies the tenant isolation fixes to the database:
 * 1. Fix services table RLS policies
 * 2. Fix loyalty_accounts table tenant isolation  
 * 3. Update about page tables to be tenant-aware
 * 
 * Usage: tsx scripts/apply-tenant-fixes.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFile } from 'fs/promises'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createServerSupabase } from '../lib/supabase'

async function runSQLScript(filePath: string, description: string): Promise<boolean> {
  try {
    console.log(`\n🔄 ${description}...`)
    
    const supabase = createServerSupabase()
    const sqlContent = await readFile(filePath, 'utf-8')
    
    // Split SQL content by statements (basic split on semicolons outside of function bodies)
    const statements = sqlContent
      .split(/;[\s\n]*(?=(?:[^']*'[^']*')*[^']*$)/) // Split on semicolons not inside quotes
      .filter(statement => statement.trim().length > 0)
      .filter(statement => !statement.trim().startsWith('--')) // Remove comment-only lines
    
    console.log(`   📝 Executing ${statements.length} SQL statements...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      const trimmed = statement.trim()
      if (!trimmed) continue
      
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql_statement: trimmed 
        })
        
        if (error) {
          // Try direct query execution instead
          const { error: queryError } = await (supabase as any).sql`${trimmed}`
          
          if (queryError) {
            console.error(`   ❌ SQL Error:`, queryError.message)
            console.error(`   💡 Statement: ${trimmed.substring(0, 100)}...`)
            errorCount++
          } else {
            successCount++
          }
        } else {
          successCount++
        }
      } catch (err: any) {
        console.error(`   ⚠️  Statement execution error: ${err.message}`)
        console.error(`   💡 Statement: ${trimmed.substring(0, 100)}...`)
        errorCount++
      }
    }
    
    if (errorCount === 0) {
      console.log(`   ✅ ${description} completed successfully (${successCount} statements)`)
      return true
    } else {
      console.log(`   ⚠️  ${description} completed with warnings (${successCount} success, ${errorCount} errors)`)
      return false
    }
  } catch (error: any) {
    console.error(`   ❌ Failed to apply ${description}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🛡️  Applying Tenant Isolation Security Fixes\n')
  console.log('============================================================\n')

  const fixes = [
    {
      file: 'scripts/32_fix_services_tenant_isolation.sql',
      description: 'Services table tenant isolation fix'
    },
    {
      file: 'scripts/33_fix_loyalty_accounts_tenant_isolation.sql', 
      description: 'Loyalty accounts tenant isolation fix'
    },
    {
      file: 'scripts/34_fix_about_routes_tenant_context.sql',
      description: 'About page tables tenant context fix'
    }
  ]

  let allSucceeded = true
  
  for (const fix of fixes) {
    const success = await runSQLScript(fix.file, fix.description)
    if (!success) {
      allSucceeded = false
    }
  }
  
  console.log('\n============================================================\n')
  
  if (allSucceeded) {
    console.log('✅ All tenant isolation fixes applied successfully!')
    console.log('📋 Next steps:')
    console.log('   1. Run tenant isolation verification to confirm fixes')
    console.log('   2. Test API endpoints with tenant context')
    console.log('   3. Review any remaining security warnings')
  } else {
    console.log('⚠️  Some fixes encountered issues. Please review the output above.')
    console.log('💡 You may need to apply some changes manually via database console.')
  }
  
  console.log('\n🔍 To verify the fixes, run:')
  console.log('   npm run verify:tenant-isolation')
}

main().catch(console.error)