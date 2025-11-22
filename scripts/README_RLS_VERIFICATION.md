# RLS Policy Verification Guide

This guide explains how to run the RLS verification script to check that Row Level Security is properly configured on all database tables.

## The Error You're Seeing

If you see an error like:
```
ERROR: 42601: syntax error at or near "{" LINE 1: { ^
```

This means you're trying to run SQL through a method that expects JSON format. The SQL script should be run directly against PostgreSQL, not through a JSON API.

## Method 1: Using Supabase Dashboard (Easiest) ✅

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the contents of `scripts/verify-rls-policies.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This is the easiest and most reliable method.

## Method 2: Using psql Command Line

If you have `psql` installed:

```bash
# Using the run-sql script (recommended)
npx tsx scripts/run-sql-with-env.ts scripts/verify-rls-policies.sql
```

**Requirements:**
- `SUPABASE_URL` in `.env.local`
- `SUPABASE_DB_PASSWORD` in `.env.local`
- `psql` installed on your system

**Install psql:**
- macOS: `brew install postgresql`
- Ubuntu/Debian: `sudo apt-get install postgresql-client`
- Windows: Download from https://www.postgresql.org/download/

## Method 3: Direct psql Connection

If you have the connection details:

```bash
psql -h <your-db-host> -U postgres -d postgres -f scripts/verify-rls-policies.sql
```

You'll be prompted for the password, or set `PGPASSWORD` environment variable.

## Method 4: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db execute -f scripts/verify-rls-policies.sql
```

## What NOT to Do ❌

**Don't try to run SQL through:**
- REST API endpoints that expect JSON
- Tools that wrap SQL in JSON format
- HTTP requests with JSON body containing SQL

The SQL script is plain SQL and should be executed directly against PostgreSQL.

## Understanding the Results

The script will show:

1. **RLS Status for All Tables**
   - Lists all tables in the `public` schema
   - Shows whether RLS is enabled (`true`) or disabled (`false`)

2. **Existing RLS Policies**
   - Lists all RLS policies
   - Shows policy names, commands (SELECT, INSERT, etc.), and conditions

3. **Summary with Policy Counts**
   - Shows each table with its RLS status
   - Counts how many policies exist for each table
   - Helps identify tables that need RLS or more policies

## Expected Output

```
 schemaname | tablename | rls_enabled 
------------+-----------+-------------
 public     | users     | t
 public     | bookings  | t
 public     | reviews   | t
 ...

 tablename | rls_status    | policy_count 
-----------+---------------+--------------
 users     | RLS Enabled   | 3
 bookings  | RLS Enabled   | 4
 reviews   | RLS Enabled   | 2
 ...
```

## Troubleshooting

### "psql: command not found"
- Install PostgreSQL client tools (see Method 2 above)

### "could not translate host name"
- Check your `SUPABASE_DB_HOST` environment variable
- Get the correct hostname from Supabase Dashboard → Settings → Database
- For connection pooling, use port 6543 instead of 5432

### "password authentication failed"
- Verify your `SUPABASE_DB_PASSWORD` is correct
- Get it from Supabase Dashboard → Settings → Database

### "syntax error at or near '{'"
- You're trying to run SQL through a JSON API
- Use one of the methods above instead (Method 1 is easiest)

## Next Steps

After running the verification:

1. **Review the results** - Check which tables have RLS enabled
2. **Identify gaps** - Tables with `RLS Disabled` or `policy_count = 0` need attention
3. **Add RLS policies** - Use scripts like `02_create_rls_policies.sql` as reference
4. **Re-run verification** - Confirm all tables are properly secured

## Related Files

- `scripts/verify-rls-policies.sql` - The verification script
- `scripts/02_create_rls_policies.sql` - Example RLS policies
- `scripts/run-sql-with-env.ts` - Helper script to run SQL files
- `SECURITY_AUDIT_SUMMARY.md` - Security audit overview


