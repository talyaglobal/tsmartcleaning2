# Quick Fix: Connection Error "could not translate host name"

If you're seeing this error when running `npm run db:migrate`:

```
psql: error: could not translate host name "db.xxxxx.supabase.co" to address: 
nodename nor servname provided, or not known
```

## Quick Fix (2 minutes)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Get Connection String**
   - Click **Settings** → **Database**
   - Scroll to **"Connection string"** section
   - Copy the **"URI"** connection string

3. **Extract Hostname**
   - The connection string looks like:
     ```
     postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - The hostname is between `@` and `:5432`
   - Copy that part (e.g., `db.xxxxx.supabase.co`)

4. **Add to `.env.local`**
   ```env
   SUPABASE_DB_HOST=db.xxxxx.supabase.co
   SUPABASE_DB_PORT=5432
   ```
   (Replace `xxxxx` with your actual project reference)

5. **Run migrations again**
   ```bash
   npm run db:migrate
   ```

## Alternative: Use Supabase Dashboard (No Setup Required)

If you don't want to fix the connection, you can run migrations manually:

1. Go to https://app.supabase.com → Your Project → **SQL Editor**
2. Click **"New query"**
3. Open each SQL file from `scripts/` folder in order (01, 02, 03, ...)
4. Copy/paste the SQL content into the editor
5. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)
6. Repeat for all 23 migration files

This method works 100% and requires no configuration!

