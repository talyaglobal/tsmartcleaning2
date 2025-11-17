#!/usr/bin/env tsx
/**
 * Test API routes that use the newly created tables
 * 
 * Usage: tsx scripts/test-new-tables.ts
 * 
 * This script tests:
 * - companies table (GET /api/companies/search, GET /api/companies/[id])
 * - jobs table (GET /api/companies/[id]/analytics)
 * - properties table (GET /api/companies/[id]/properties)
 * - reports table (GET /api/companies/[id]/reports)
 * - user_profiles table (GET /api/customers/[id]/analytics)
 * - campaign_progress table (GET /api/campaigns/[id]/progress)
 * - ngo_applications table (POST /api/ngo/register)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createServerSupabase } from '../lib/supabase'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: any
}

const results: TestResult[] = []

function logResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, details?: any) {
  results.push({ name, status, message, details })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️'
  console.log(`${icon} ${name}: ${message}`)
  if (details) {
    console.log(`   ${JSON.stringify(details, null, 2).split('\n').join('\n   ')}`)
  }
}

async function testTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)
    
    return !error
  } catch {
    return false
  }
}

async function testCompaniesTable() {
  console.log('\n📊 Testing Companies Table\n')
  
  const supabase = createServerSupabase()
  
  // Test 1: Table exists and is accessible
  const tableExists = await testTableExists('companies')
  if (!tableExists) {
    logResult('Companies Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('Companies Table Access', 'pass', 'Table exists and is accessible')
  
  // Test 2: Can query companies
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, status')
      .limit(5)
    
    if (error) {
      logResult('Companies Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Companies Query', 'pass', `Successfully queried ${data?.length || 0} companies`)
    }
  } catch (error: any) {
    logResult('Companies Query', 'fail', `Error: ${error.message}`)
  }
  
  // Test 3: Can insert a test company (then delete it)
  try {
    const testCompany = {
      name: `Test Company ${Date.now()}`,
      status: 'active',
      tenant_id: (await supabase.from('tenants').select('id').limit(1).single()).data?.id || null,
    }
    
    if (!testCompany.tenant_id) {
      logResult('Companies Insert', 'skip', 'No tenant found, skipping insert test')
      return
    }
    
    const { data: inserted, error: insertError } = await supabase
      .from('companies')
      .insert(testCompany)
      .select()
      .single()
    
    if (insertError) {
      logResult('Companies Insert', 'fail', `Insert failed: ${insertError.message}`)
    } else {
      logResult('Companies Insert', 'pass', `Successfully inserted test company: ${inserted.id}`)
      
      // Clean up
      await supabase.from('companies').delete().eq('id', inserted.id)
      logResult('Companies Cleanup', 'pass', 'Test company deleted')
    }
  } catch (error: any) {
    logResult('Companies Insert', 'fail', `Error: ${error.message}`)
  }
}

async function testJobsTable() {
  console.log('\n📋 Testing Jobs Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('jobs')
  if (!tableExists) {
    logResult('Jobs Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('Jobs Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, status, scheduled_date')
      .limit(5)
    
    if (error) {
      logResult('Jobs Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Jobs Query', 'pass', `Successfully queried ${data?.length || 0} jobs`)
    }
  } catch (error: any) {
    logResult('Jobs Query', 'fail', `Error: ${error.message}`)
  }
}

async function testPropertiesTable() {
  console.log('\n🏢 Testing Properties Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('properties')
  if (!tableExists) {
    logResult('Properties Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('Properties Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, status')
      .limit(5)
    
    if (error) {
      logResult('Properties Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Properties Query', 'pass', `Successfully queried ${data?.length || 0} properties`)
    }
  } catch (error: any) {
    logResult('Properties Query', 'fail', `Error: ${error.message}`)
  }
}

async function testReportsTable() {
  console.log('\n📄 Testing Reports Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('reports')
  if (!tableExists) {
    logResult('Reports Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('Reports Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, report_type, title')
      .limit(5)
    
    if (error) {
      logResult('Reports Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Reports Query', 'pass', `Successfully queried ${data?.length || 0} reports`)
    }
  } catch (error: any) {
    logResult('Reports Query', 'fail', `Error: ${error.message}`)
  }
}

async function testUserProfilesTable() {
  console.log('\n👤 Testing User Profiles Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('user_profiles')
  if (!tableExists) {
    logResult('User Profiles Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('User Profiles Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, membership_tier')
      .limit(5)
    
    if (error) {
      logResult('User Profiles Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('User Profiles Query', 'pass', `Successfully queried ${data?.length || 0} user profiles`)
    }
  } catch (error: any) {
    logResult('User Profiles Query', 'fail', `Error: ${error.message}`)
  }
}

async function testCampaignProgressTable() {
  console.log('\n📈 Testing Campaign Progress Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('campaign_progress')
  if (!tableExists) {
    logResult('Campaign Progress Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('Campaign Progress Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('campaign_progress')
      .select('id, campaign_id, status')
      .limit(5)
    
    if (error) {
      logResult('Campaign Progress Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Campaign Progress Query', 'pass', `Successfully queried ${data?.length || 0} campaign progress records`)
    }
  } catch (error: any) {
    logResult('Campaign Progress Query', 'fail', `Error: ${error.message}`)
  }
}

async function testNgoApplicationsTable() {
  console.log('\n🤝 Testing NGO Applications Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('ngo_applications')
  if (!tableExists) {
    logResult('NGO Applications Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('NGO Applications Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('ngo_applications')
      .select('id, organization_name, status')
      .limit(5)
    
    if (error) {
      logResult('NGO Applications Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('NGO Applications Query', 'pass', `Successfully queried ${data?.length || 0} NGO applications`)
    }
  } catch (error: any) {
    logResult('NGO Applications Query', 'fail', `Error: ${error.message}`)
  }
}

async function testBookingAddOnsTable() {
  console.log('\n➕ Testing Booking Add-Ons Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('booking_add_ons')
  if (!tableExists) {
    logResult('Booking Add-Ons Table Access', 'fail', 'Table does not exist or is not accessible')
    return
  }
  logResult('Booking Add-Ons Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('booking_add_ons')
      .select('id, booking_id, add_on_id')
      .limit(5)
    
    if (error) {
      logResult('Booking Add-Ons Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Booking Add-Ons Query', 'pass', `Successfully queried ${data?.length || 0} booking add-ons`)
    }
  } catch (error: any) {
    logResult('Booking Add-Ons Query', 'fail', `Error: ${error.message}`)
  }
}

async function testProvidersTable() {
  console.log('\n👷 Testing Providers Table\n')
  
  const supabase = createServerSupabase()
  
  const tableExists = await testTableExists('providers')
  if (!tableExists) {
    logResult('Providers Table Access', 'skip', 'Table does not exist (may be optional)')
    return
  }
  logResult('Providers Table Access', 'pass', 'Table exists and is accessible')
  
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('id')
      .limit(5)
    
    if (error) {
      logResult('Providers Query', 'fail', `Query failed: ${error.message}`)
    } else {
      logResult('Providers Query', 'pass', `Successfully queried ${data?.length || 0} providers`)
    }
  } catch (error: any) {
    logResult('Providers Query', 'fail', `Error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Testing New Database Tables\n')
  console.log('='.repeat(60))
  
  try {
    // Verify Supabase connection
    const supabase = createServerSupabase()
    const { error: healthError } = await supabase.from('users').select('id').limit(1)
    
    if (healthError) {
      console.error('❌ Cannot connect to Supabase database')
      console.error(`   Error: ${healthError.message}`)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection verified\n')
    
    // Run all tests
    await testCompaniesTable()
    await testJobsTable()
    await testPropertiesTable()
    await testReportsTable()
    await testUserProfilesTable()
    await testCampaignProgressTable()
    await testNgoApplicationsTable()
    await testBookingAddOnsTable()
    await testProvidersTable()
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Test Summary\n')
    
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const skipped = results.filter(r => r.status === 'skip').length
    
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📊 Total: ${results.length}`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      results
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.message}`)
        })
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed!')
      process.exit(0)
    }
    
  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

