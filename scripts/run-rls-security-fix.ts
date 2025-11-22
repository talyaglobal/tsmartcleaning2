#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
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

async function runRLSSecurityFix(): Promise<void> {
  console.log('🔒 Running Critical RLS Security Fix...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '30_critical_rls_security_fix.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')
      .filter(stmt => !stmt.match(/^(SELECT|COMMENT ON)/i)); // Skip verification queries

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      if (!statement.trim()) continue;

      try {
        console.log(`⚡ Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });

        if (error) {
          console.log(`⚠️  Warning: ${error.message}`);
          errors++;
        } else {
          executed++;
        }
      } catch (err) {
        console.log(`❌ Error: ${err}`);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Executed: ${executed}`);
    console.log(`⚠️  Warnings/Errors: ${errors}`);

    // Run verification
    console.log('\n🔍 Running verification checks...');
    
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          tablename,
          rowsecurity as rls_enabled,
          (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') as policy_count
        FROM pg_tables t
        WHERE schemaname = 'public'
          AND tablename IN ('users', 'bookings', 'provider_profiles', 'addresses', 'transactions')
        ORDER BY tablename;
      `
    });

    if (rlsError) {
      console.error('❌ Verification error:', rlsError);
      process.exit(1);
    }

    console.log('\n🎯 Critical Tables RLS Status:');
    console.log('Table'.padEnd(20) + 'RLS Enabled'.padEnd(15) + 'Policies');
    console.log('─'.repeat(50));

    let allSecured = true;
    for (const table of rlsCheck || []) {
      const status = table.rls_enabled ? '✅ Yes' : '❌ No';
      const policyStatus = table.policy_count > 0 ? `✅ ${table.policy_count}` : '❌ 0';
      
      console.log(table.tablename.padEnd(20) + status.padEnd(15) + policyStatus);
      
      if (!table.rls_enabled || table.policy_count === 0) {
        allSecured = false;
      }
    }

    if (allSecured) {
      console.log('\n🎉 SUCCESS: All critical tables are now secured with RLS!');
      console.log('\n🔍 Next steps:');
      console.log('1. Run: npm run test:rls');
      console.log('2. Test your application to ensure everything works correctly');
      console.log('3. Monitor for any access issues in your application logs');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tables still need attention. Please review the output above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error running RLS security fix:', error);
    process.exit(1);
  }
}

// Main execution
if (import.meta.main) {
  runRLSSecurityFix();
}