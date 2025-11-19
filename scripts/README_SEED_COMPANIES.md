# Seed Companies Directory Data

This script adds missing columns to the `companies` table and inserts seed data for the find-cleaners directory page.

## What it does

1. **Adds missing columns** to the `companies` table:
   - `company_name`, `legal_name`, `slug`
   - `country`, `latitude`, `longitude`
   - `average_rating`, `total_reviews`
   - `verified`, `featured`, `price_range`
   - `tagline`, `logo_url`, `cover_image_url`, `domain`

2. **Inserts 21 sample cleaning companies** across US and Canadian cities:
   - Various ratings (4.3 - 4.9)
   - Different price ranges ($, $$, $$$, $$$$)
   - Mix of verified/non-verified companies
   - Mix of featured/non-featured companies
   - Coverage across major cities: NYC, LA, Chicago, Toronto, Miami, Seattle, Dallas, Vancouver, Denver, Phoenix, Houston, Boston, San Francisco, Montreal, Atlanta, Portland, Las Vegas, Washington DC, Calgary, Austin, Philadelphia

## How to run

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor: https://app.supabase.com/project/_/sql/new
3. Open the file `scripts/27_seed_companies_directory.sql`
4. Copy and paste the entire contents
5. Click "Run" to execute

### Method 2: Using TypeScript script

```bash
tsx scripts/run-sql-with-env.ts scripts/27_seed_companies_directory.sql
```

**Required environment variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_DB_PASSWORD` - Your database password (from Supabase Dashboard → Settings → Database)

**Note:** This method requires `psql` (PostgreSQL client) to be installed.

### Method 3: Using psql directly

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f scripts/27_seed_companies_directory.sql
```

Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual values.

## Verification

After running the script, you can verify the data was inserted by:

1. **In Supabase Dashboard:**
   - Go to Table Editor
   - Select the `companies` table
   - You should see 21+ companies with various attributes

2. **On the website:**
   - Visit https://www.tsmartcleaning.com/find-cleaners
   - You should now see companies listed instead of "0 companies found"

3. **Via SQL:**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(*) FILTER (WHERE verified = true) as verified,
     COUNT(*) FILTER (WHERE featured = true) as featured,
     COUNT(*) FILTER (WHERE country = 'US') as us_companies,
     COUNT(*) FILTER (WHERE country = 'CA') as canada_companies
   FROM public.companies
   WHERE status = 'active';
   ```

## Safe to re-run

The script is safe to run multiple times:
- Uses `IF NOT EXISTS` for column additions
- Deletes existing seed data before inserting new records
- Uses unique constraints on `slug` to prevent duplicates

## Customization

To add more companies or modify existing ones:
1. Edit the `INSERT INTO public.companies` statements in the SQL file
2. Add new company records following the same pattern
3. Make sure each company has a unique `slug`
4. Ensure `latitude` and `longitude` are valid coordinates for the city

## Troubleshooting

**Issue: "column already exists"**
- This is normal if columns were already added
- The script uses `IF NOT EXISTS` so it won't fail

**Issue: "duplicate key value violates unique constraint"**
- The script deletes existing seed data first
- If you still see this, manually delete conflicting records first

**Issue: "relation companies does not exist"**
- Run the table creation migrations first (e.g., `scripts/14_create_missing_tables.sql`)

