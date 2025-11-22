#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RLSTestResult {
  table: string;
  rlsEnabled: boolean;
  policyCount: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
}

async function checkRLSStatus(): Promise<void> {
  console.log('🔍 Checking Row Level Security (RLS) Status...\n');

  try {
    // Check which tables have RLS enabled
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('_prisma_migrations', 'schema_migrations')
        ORDER BY tablename;
      `
    });

    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
      return;
    }

    // Check policy counts
    const { data: policyData, error: policyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          t.tablename,
          CASE 
            WHEN t.rowsecurity THEN 'RLS Enabled'
            ELSE 'RLS Disabled'
          END as rls_status,
          COUNT(p.policyname) as policy_count
        FROM pg_tables t
        LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
        WHERE t.schemaname = 'public'
          AND t.tablename NOT IN ('_prisma_migrations', 'schema_migrations')
        GROUP BY t.tablename, t.rowsecurity
        ORDER BY t.tablename;
      `
    });

    if (policyError) {
      console.error('❌ Error checking policies:', policyError);
      return;
    }

    // Critical tables that MUST have RLS enabled
    const criticalTables = [
      'users',
      'bookings', 
      'provider_profiles',
      'companies',
      'payments',
      'transactions',
      'addresses',
      'notifications'
    ];

    const results: RLSTestResult[] = [];
    let totalFailed = 0;
    let totalWarnings = 0;

    // Process results
    for (const table of policyData || []) {
      const isCritical = criticalTables.includes(table.tablename);
      const hasRLS = table.rls_status === 'RLS Enabled';
      const hasPolicies = table.policy_count > 0;
      
      const issues: string[] = [];
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';

      if (isCritical && !hasRLS) {
        issues.push('❌ CRITICAL: RLS not enabled on critical table');
        status = 'FAIL';
      } else if (!hasRLS) {
        issues.push('⚠️  RLS not enabled');
        status = 'WARNING';
      }

      if (hasRLS && !hasPolicies) {
        issues.push('❌ RLS enabled but no policies defined - table will be inaccessible');
        status = 'FAIL';
      } else if (hasRLS && hasPolicies < 1) {
        issues.push('⚠️  Very few policies - consider if access is properly controlled');
        status = 'WARNING';
      }

      if (status === 'FAIL') totalFailed++;
      if (status === 'WARNING') totalWarnings++;

      results.push({
        table: table.tablename,
        rlsEnabled: hasRLS,
        policyCount: table.policy_count,
        status,
        issues
      });
    }

    // Display results
    console.log('📊 RLS Security Audit Results:\n');
    console.log('Table'.padEnd(25) + 'RLS'.padEnd(8) + 'Policies'.padEnd(10) + 'Status'.padEnd(10) + 'Issues');
    console.log('─'.repeat(80));

    for (const result of results) {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      const rlsStatus = result.rlsEnabled ? '✓' : '✗';
      
      console.log(
        result.table.padEnd(25) +
        rlsStatus.padEnd(8) +
        result.policyCount.toString().padEnd(10) +
        (statusIcon + ' ' + result.status).padEnd(10) +
        result.issues.join(', ')
      );
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${results.length - totalFailed - totalWarnings}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);
    console.log(`❌ Failed: ${totalFailed}`);

    // Additional security checks
    await performAdvancedSecurityChecks();

    if (totalFailed > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES DETECTED!');
      console.log('Please run the RLS security fix script immediately:');
      console.log('npm run db:run-sql scripts/30_critical_rls_security_fix.sql');
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log('\n⚠️  Some security warnings detected. Review the issues above.');
      process.exit(0);
    } else {
      console.log('\n🎉 All RLS security checks passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error during RLS verification:', error);
    process.exit(1);
  }
}

async function performAdvancedSecurityChecks(): Promise<void> {
  console.log('\n🔍 Advanced Security Checks:');

  try {
    // Check for tables with RLS enabled but no policies
    const { data: unprotectedTables, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT t.tablename
        FROM pg_tables t
        WHERE t.schemaname = 'public'
          AND t.rowsecurity = true
          AND NOT EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.schemaname = 'public' AND p.tablename = t.tablename
          )
          AND t.tablename NOT IN ('_prisma_migrations', 'schema_migrations');
      `
    });

    if (error) {
      console.log('❌ Error checking unprotected tables:', error.message);
      return;
    }

    if (unprotectedTables && unprotectedTables.length > 0) {
      console.log('❌ CRITICAL: Tables with RLS enabled but NO policies (completely inaccessible):');
      unprotectedTables.forEach((table: any) => {
        console.log(`   - ${table.tablename}`);
      });
    } else {
      console.log('✅ No tables with RLS enabled but missing policies');
    }

    // Check for overly permissive policies
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT tablename, policyname, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
          AND (qual ILIKE '%true%' OR with_check ILIKE '%true%');
      `
    });

    if (policyError) {
      console.log('❌ Error checking permissive policies:', policyError.message);
      return;
    }

    if (policies && policies.length > 0) {
      console.log('⚠️  Potentially overly permissive policies found:');
      policies.forEach((policy: any) => {
        console.log(`   - ${policy.tablename}.${policy.policyname}`);
      });
    } else {
      console.log('✅ No overly permissive policies detected');
    }

  } catch (error) {
    console.log('❌ Error in advanced security checks:', error);
  }
}

// Main execution
if (import.meta.main) {
  checkRLSStatus();
}