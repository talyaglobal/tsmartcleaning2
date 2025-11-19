# Run All Database Migrations

This document describes how to run all database migrations to create missing tables in Supabase.

## Quick Start

The easiest way to create all missing database tables is to run the automated migration script:

```bash
npm run db:migrate
```

This will execute all SQL migration files in the correct order.

## Prerequisites

1. **Install PostgreSQL client tools** (required for running SQL scripts):
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql-client`
   - **Windows**: Download from https://www.postgresql.org/download/

2. **Set up environment variables** in `.env.local`:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_DB_PASSWORD=your-database-password-here
   ```

   You can find these values in:
   - **Supabase URL**: Supabase Dashboard → Settings → API → Project URL
   - **Database Password**: Supabase Dashboard → Settings → Database → Database password
     (If you don't have it, you can reset it in the same location)

## Migration Script

The `run-all-migrations.ts` script automatically runs all SQL migration files in the correct dependency order:

### Migration Order

The script runs migrations in this order to respect dependencies:

1. `01_create_tables.sql` - Core tables (users, bookings, services, etc.)
2. `02_create_rls_policies.sql` - Row Level Security policies
3. `03_seed_services.sql` - Seed service data
4. `04_create_functions.sql` - Database functions
5. `05_alter_and_missing_tables.sql` - Additional tables and alterations
6. `06_add_add_ons_table.sql` - Add-ons table
7. `06_loyalty.sql` - Loyalty program tables
8. `07_seed_add_ons.sql` - Seed add-ons data
9. `08_customer_personalization.sql` - Customer preferences tables
10. `09_multi_tenant.sql` - Multi-tenancy tables
11. `09_multitenancy.sql` - Additional multi-tenancy setup
12. `09_multitenancy_rls.sql` - Multi-tenancy RLS policies
13. `10_custom_domains.sql` - Custom domains tables
14. `10_revenue_share.sql` - Revenue share tables
15. `11_audit_logs.sql` - Audit logging tables
16. `11_usage_and_billing.sql` - Usage and billing tables
17. `12_insurance.sql` - Insurance tables
18. `14_create_missing_tables.sql` - Additional missing tables (companies, jobs, properties, etc.)
19. `15_blog_and_newsletter.sql` - Blog and newsletter tables
20. `16_support_tickets.sql` - Support ticket system tables
21. `17_membership_cards.sql` - Membership card tables (tSmartCard)
22. `18_company_invoices.sql` - Company invoice tables
23. `19_messages.sql` - Messaging/conversation tables

## Usage

### Method 1: Using npm script (Recommended)

```bash
npm run db:migrate
```

### Method 2: Direct execution

```bash
tsx scripts/run-all-migrations.ts
```

### Method 3: Manual execution via Supabase Dashboard

If you prefer not to use the command line, you can run each SQL file manually:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New query**
4. Copy and paste the contents of each migration file (in order)
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

## Output

The script provides detailed output:

```
🚀 Running all database migrations...

✅ Environment variables found
   SUPABASE_URL: https://xxxxx.supabase.co
   SUPABASE_DB_PASSWORD: ****************

🔌 Connecting to: db.xxxxx.supabase.co:5432
   Database: postgres
   User: postgres

📋 Found 23 migration files to run

================================================================================

📄 Running: 01_create_tables.sql
--------------------------------------------------------------------------------
✅ Successfully executed: 01_create_tables.sql

📄 Running: 02_create_rls_policies.sql
--------------------------------------------------------------------------------
✅ Successfully executed: 02_create_rls_policies.sql

...

================================================================================

📊 Migration Summary:
   ✅ Successful: 23
   ⏭️  Skipped: 0
   ❌ Errors: 0

🎉 All migrations completed successfully!
```

## Troubleshooting

### Error: `psql: command not found`

**Solution**: Install PostgreSQL client tools:
- macOS: `brew install postgresql`
- Ubuntu/Debian: `sudo apt-get install postgresql-client`
- Windows: Download from https://www.postgresql.org/download/

### Error: `Could not extract database host from SUPABASE_URL`

**Solution**: Set the database host manually in `.env.local`:
```env
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
```

Or if using connection pooling:
```env
SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
```

You can find your connection details in:
Supabase Dashboard → Settings → Database → Connection string

### Error: `connection refused` or `could not translate host name` or `nodename nor servname provided`

**This is the most common connection error.** It means the script cannot resolve the database hostname.

**Possible causes:**
1. The extracted hostname format is incorrect
2. Your project uses connection pooling with a different hostname
3. Network/DNS issues

**Solution (Step-by-Step):**

1. **Get the correct connection string:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **Settings** → **Database**
   - Scroll to **"Connection string"** section
   - Copy the **"URI"** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

2. **Extract the hostname from the connection string:**
   - The hostname is between `@` and `:5432` (or the port number)
   - Example: `db.cpujkcmpkalrppqjsreg.supabase.co`

3. **Add to `.env.local`:**
   ```env
   SUPABASE_DB_HOST=db.cpujkcmpkalrppqjsreg.supabase.co
   SUPABASE_DB_PORT=5432
   ```
   (Replace with your actual hostname)

4. **If direct connection doesn't work, try connection pooling:**
   - In Supabase Dashboard → Settings → Database
   - Look for **"Connection pooling"** section
   - Copy the pooler connection string (different hostname)
   - Example format: `aws-0-us-east-1.pooler.supabase.com`
   - Port for pooler is usually `6543`
   ```env
   SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
   SUPABASE_DB_PORT=6543
   ```

5. **Run migrations again:**
   ```bash
   npm run db:migrate
   ```

**Quick Reference:** See `scripts/QUICK_FIX_CONNECTION.md` for a visual guide.

**Alternative:** If connection issues persist, use the Supabase Dashboard SQL Editor method (see Method 3 above) - it's the easiest option and doesn't require psql or hostname configuration.

### Error: `authentication failed`

**Solution**: Verify your `SUPABASE_DB_PASSWORD` in `.env.local`:
1. Go to Supabase Dashboard → Settings → Database
2. Check or reset the database password
3. Update `.env.local` with the correct password

### Migration errors but script continues

The script will continue running even if one migration fails, so you can see all errors at once. Review the error messages and:
1. Check if dependencies are met (earlier migrations completed)
2. Verify the SQL syntax is correct
3. Check Supabase logs for detailed error information

## Safety Features

All migration scripts use `IF NOT EXISTS` clauses, making them **idempotent**:
- ✅ Safe to run multiple times
- ✅ Won't recreate existing tables
- ✅ Won't duplicate data
- ✅ Can be run incrementally

## Next Steps

After running migrations:

1. **Verify tables were created**:
   ```bash
   npm run verify:supabase
   ```

2. **Test your application** to ensure all tables are accessible

3. **Review RLS policies** if needed (see `scripts/02_create_rls_policies.sql`)

4. **Seed initial data** if needed (some seed scripts are already included)

## Notes

- The script skips migration files that don't exist (no error)
- Each migration runs independently, so partial failures are handled gracefully
- All migrations use PostgreSQL-compatible syntax
- The script requires `psql` to be installed and in your PATH

