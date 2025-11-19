-- RLS Policy Verification Script
-- This script checks that RLS is enabled and policies exist for all tables

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Tables that should have RLS (add your tables here)
-- This is a template - update with your actual table names
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
