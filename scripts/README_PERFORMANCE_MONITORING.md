# Performance Monitoring Migration Guide

This guide explains how to run the performance monitoring database migration (`28_performance_monitoring.sql`).

## Method 1: Supabase Dashboard SQL Editor (Recommended - Easiest)

This is the easiest method and doesn't require any local setup.

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New query**

3. **Copy and Paste the Migration**
   - Open `scripts/28_performance_monitoring.sql` in your editor
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for the success message

5. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see three new tables:
     - `performance_baselines`
     - `slow_queries`
     - `performance_metrics`

## Method 2: Fix Connection and Use Command Line

If you prefer using the command line, you need to fix the database connection.

### Option A: Use Connection Pooling (Recommended)

1. **Get Connection Pooler URL**
   - Go to Supabase Dashboard → Settings → Database
   - Find "Connection string" section
   - Copy the "URI" connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`)

2. **Extract Hostname and Port**
   - The hostname is the part after `@` and before `:`
   - The port is after the hostname (usually `6543` for pooler, `5432` for direct)

3. **Set Environment Variables**
   ```bash
   export SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
   export SUPABASE_DB_PORT=6543
   ```

4. **Run Migration**
   ```bash
   npm run db:run-sql scripts/28_performance_monitoring.sql
   ```

### Option B: Use Direct Connection

1. **Get Direct Connection Hostname**
   - Go to Supabase Dashboard → Settings → Database
   - Find "Connection string" section
   - Look for "Direct connection" or "Session mode"
   - The hostname format is: `db.[PROJECT-REF].supabase.co`

2. **Set Environment Variable**
   ```bash
   export SUPABASE_DB_HOST=db.cpujkcmpkalrppqjsreg.supabase.co
   export SUPABASE_DB_PORT=5432
   ```

3. **Run Migration**
   ```bash
   npm run db:run-sql scripts/28_performance_monitoring.sql
   ```

### Option C: Use Connection String Directly

You can also use `psql` directly with the connection string:

```bash
# Get connection string from Supabase Dashboard → Settings → Database
# Replace [YOUR-PASSWORD] with your actual database password
psql "postgresql://postgres:[YOUR-PASSWORD]@db.cpujkcmpkalrppqjsreg.supabase.co:5432/postgres" -f scripts/28_performance_monitoring.sql
```

## Verification

After running the migration, verify the tables were created:

### Via Supabase Dashboard
1. Go to **Table Editor**
2. Look for:
   - `performance_baselines`
   - `slow_queries`
   - `performance_metrics`

### Via SQL Query
Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('performance_baselines', 'slow_queries', 'performance_metrics');
```

You should see all three tables listed.

## Troubleshooting

### "Could not translate host name" Error

This means the hostname can't be resolved. Solutions:
1. **Use Method 1 (Supabase Dashboard)** - This always works
2. **Check your network connection**
3. **Verify the hostname** in Supabase Dashboard → Settings → Database
4. **Try connection pooling** (port 6543) instead of direct connection

### "Permission denied" Error

Make sure you're using the correct database password from Supabase Dashboard → Settings → Database.

### "Table already exists" Error

This is fine! The migration uses `IF NOT EXISTS`, so it's safe to run multiple times. The tables already exist, so nothing will change.

## Next Steps

After running the migration:

1. **Initialize Default Baselines** (optional):
   ```typescript
   import { initializeDefaultBaselines } from '@/lib/performance'
   await initializeDefaultBaselines(tenantId)
   ```

2. **Start Using Performance Monitoring**:
   - See `docs/APM_SETUP.md` for usage examples
   - The system will automatically start tracking performance metrics

3. **View Performance Data**:
   - Use the API: `GET /api/monitoring/performance`
   - Check Sentry dashboard for performance traces
   - Query the `performance_metrics` table directly

## Related Documentation

- [APM Setup Guide](../docs/APM_SETUP.md)
- [Performance Monitoring Library](../lib/performance.ts)
- [Performance Metrics API](../app/api/monitoring/performance/route.ts)

