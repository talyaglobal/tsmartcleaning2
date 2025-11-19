# Create Missing Tables Migration Script

## Overview
This document describes the `14_create_missing_tables.sql` script which creates tables that are referenced in the codebase but were missing from the database schema.

## Tables Created

### 1. `companies`
- **Purpose**: Stores company/organization information
- **References**: Used in `/api/companies/*` routes, admin stats
- **Key Fields**: name, status, contact info, tenant_id

### 2. `jobs`
- **Purpose**: Job records (may be related to bookings but separate for analytics)
- **References**: Used in `/api/companies/[id]/analytics` route
- **Key Fields**: company_id, booking_id, customer_id, provider_id, status, scheduled_date

### 3. `properties`
- **Purpose**: Properties managed by companies
- **References**: Used in `/api/companies/[id]/properties` route
- **Key Fields**: company_id, address, property_type, square_feet

### 4. `reports`
- **Purpose**: Generated reports for companies
- **References**: Used in `/api/companies/[id]/reports` route
- **Key Fields**: company_id, report_type, data (JSONB), generated_at

### 5. `user_profiles`
- **Purpose**: Extended user profile information
- **References**: Used in `/api/customers/[id]/analytics` route
- **Key Fields**: user_id, membership_fee, membership_tier, preferences

### 6. `campaign_progress`
- **Purpose**: Tracks progress of marketing campaigns
- **References**: Used in `/api/campaigns/[id]/progress` route
- **Key Fields**: campaign_id, status, sent_count, delivered_count, opened_count

### 7. `ngo_applications`
- **Purpose**: NGO/Non-profit organization applications
- **References**: Used in `/api/ngo/register` route
- **Key Fields**: organization_name, contact info, mission_statement, status

### 8. `booking_add_ons`
- **Purpose**: Junction table linking bookings to add-ons
- **References**: Referenced in booking-related code
- **Key Fields**: booking_id, add_on_id, quantity, price

### 9. `providers`
- **Purpose**: Alias/separate table for provider references (used by revenue_share_rules)
- **References**: Referenced in `10_revenue_share.sql` as foreign key
- **Key Fields**: id (references provider_profiles), tenant_id
- **Note**: This table is populated from existing provider_profiles records

## Features

- **Idempotent**: Safe to run multiple times (uses `IF NOT EXISTS`)
- **Multi-tenant**: All tables include `tenant_id` column with proper foreign keys
- **RLS Enabled**: Row Level Security is enabled on all tables
- **Indexes**: Appropriate indexes created for common queries
- **Triggers**: `updated_at` triggers added where applicable
- **Policies**: Basic RLS policies created (admins can view, service role can manage)

## Running the Script

### Method 1: Supabase Dashboard SQL Editor (Recommended - Easiest)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste SQL**
   - Open `scripts/14_create_missing_tables.sql` in your editor
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Execute**
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - The script will execute and show results

### Method 2: Using psql (Command Line)

1. **Get Connection String**
   - Go to Supabase Dashboard → Settings → Database
   - Find "Connection string" section
   - Copy the "URI" connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

2. **Run the Script**
   ```bash
   # Replace [CONNECTION-STRING] with your actual connection string
   psql "[CONNECTION-STRING]" -f scripts/14_create_missing_tables.sql
   ```

   Or if you prefer separate parameters:
   ```bash
   # Get these values from your Supabase Dashboard → Settings → Database
   psql \
     -h db.[YOUR-PROJECT-REF].supabase.co \
     -p 5432 \
     -U postgres \
     -d postgres \
     -f scripts/14_create_missing_tables.sql
   ```
   (You'll be prompted for the password)

### Method 3: Using Environment Variables with psql

If you have your Supabase credentials in environment variables:

```bash
# Set these from your .env.local file
export PGHOST=db.[YOUR-PROJECT-REF].supabase.co
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=[YOUR-PASSWORD]
export PGDATABASE=postgres

# Then run
psql -f scripts/14_create_missing_tables.sql
```

### Method 4: Using Environment Variables (Recommended for CLI)

This is the easiest command-line method if you have your Supabase credentials in environment variables.

1. **Add Database Password to `.env.local`**
   
   Add this line to your `.env.local` file:
   ```env
   SUPABASE_DB_PASSWORD=your-database-password-here
   ```
   
   You can find your database password in:
   - Supabase Dashboard → Settings → Database → Database password
   - Or reset it if you don't have it

2. **Run the Script**
   
   Using npm script:
   ```bash
   npm run db:run-sql scripts/14_create_missing_tables.sql
   ```
   
   Or directly with tsx:
   ```bash
   tsx scripts/run-sql-with-env.ts scripts/14_create_missing_tables.sql
   ```

   The script will:
   - ✅ Read `SUPABASE_URL` from your `.env.local` (already set)
   - ✅ Extract the database host automatically
   - ✅ Use `SUPABASE_DB_PASSWORD` for authentication
   - ✅ Execute the SQL script via `psql`

**Note:** This method requires `psql` (PostgreSQL client) to be installed. If you don't have it:
- macOS: `brew install postgresql`
- Ubuntu/Debian: `sudo apt-get install postgresql-client`
- Or use Method 1 (Supabase Dashboard) instead

## Dependencies

This script depends on:
- `public.tenants` table (from `09_multi_tenant.sql`)
- `public.provider_profiles` table (from `01_create_tables.sql`)
- `public.bookings` table (from `01_create_tables.sql`)
- `public.add_ons` table (from `06_add_add_ons_table.sql`)
- `public.campaigns` table (from `05_alter_and_missing_tables.sql`)
- `update_updated_at_column()` function (from `04_create_functions.sql`)

## Notes

- The `providers` table is created as a separate table that references `provider_profiles`. This is needed for the `revenue_share_rules` foreign key constraint.
- All tables are backfilled with the default tenant if `tenant_id` is missing.
- RLS policies are basic and may need adjustment based on your specific access control requirements.

