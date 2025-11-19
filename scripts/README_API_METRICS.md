# API Metrics Table Setup

The `api_metrics` table is used to track API performance metrics (response time, error rate, throughput).

## Quick Setup

### Method 1: Supabase Dashboard (Easiest) ✅

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Open `scripts/28_api_metrics.sql` in your editor
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify**
   - Run: `npm run verify:monitoring`
   - Should show: ✅ Performance Table: api_metrics: Table exists and accessible

### Method 2: Using run-sql Script

**Prerequisites:**
- `SUPABASE_DB_PASSWORD` must be set in `.env.local`
- Get it from: Supabase Dashboard → Settings → Database → Database password

**Run:**
```bash
npm run db:run-sql scripts/28_api_metrics.sql
```

### Method 3: Direct psql (if you have connection string)

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f scripts/28_api_metrics.sql
```

## What This Creates

- **`api_metrics`** - Raw metrics for each API request
- **`api_metrics_hourly`** - Aggregated metrics by hour (for faster queries)
- **`api_alert_thresholds`** - Configuration for alert thresholds
- **`aggregate_api_metrics_hourly()`** - Function to aggregate metrics hourly

## Verification

After running the migration, verify it worked:

```bash
npm run verify:monitoring
```

You should see:
- ✅ Performance Table: api_metrics: Table exists and accessible

## Troubleshooting

### Error: "Could not find the table 'public.api_metrics'"

This means the migration hasn't been run yet. Use Method 1 (Supabase Dashboard) to run it.

### Error: "psql: command not found"

Install PostgreSQL client tools:
- **macOS:** `brew install postgresql`
- **Ubuntu/Debian:** `sudo apt-get install postgresql-client`
- **Windows:** Download from https://www.postgresql.org/download/

Or use Method 1 (Supabase Dashboard) instead.

### Error: Connection refused / Cannot resolve hostname

1. Get the correct hostname from Supabase Dashboard → Settings → Database
2. Set `SUPABASE_DB_HOST` in `.env.local`:
   ```
   SUPABASE_DB_HOST=db.your-project-ref.supabase.co
   SUPABASE_DB_PORT=5432
   ```
3. Or use Method 1 (Supabase Dashboard) instead

## Next Steps

After creating the tables:

1. ✅ Verify with `npm run verify:monitoring`
2. Set up hourly aggregation cron job (see `docs/METRICS_DASHBOARD.md`)
3. Configure alert thresholds via `/api/root-admin/metrics/thresholds`

