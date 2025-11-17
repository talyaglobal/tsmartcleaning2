# Supabase Connection Verification

This document describes how to verify that your Supabase connection is working correctly.

## Setup

1. **Create a `.env.local` file** in the project root with the following variables:

```env
# Required
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional (for client-side operations)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Get your Supabase credentials** from:
   - Project URL: https://app.supabase.com/project/_/settings/api
   - Service Role Key: https://app.supabase.com/project/_/settings/api (under "service_role" key)
   - Anonymous Key: https://app.supabase.com/project/_/settings/api (under "anon" key)

## Verification Methods

### Method 1: Standalone Script (Recommended)

Run the verification script directly:

```bash
npm run verify:supabase
```

This script will:
- ✅ Check that all required environment variables are set
- ✅ Verify Supabase client can be created
- ✅ Test database queries (services, users tables)
- ✅ Check access to common tables (services, users, bookings, provider_profiles, addresses, reviews)
- ✅ Provide a detailed report of all checks

### Method 2: API Route

Start your Next.js development server:

```bash
npm run dev
```

Then visit or make a GET request to:
```
http://localhost:3000/api/verify-supabase
```

This returns a JSON response with verification results.

## Expected Output

When everything is working correctly, you should see:

```
✅ Environment Variables: SUPABASE_URL is set
✅ Environment Variables: SUPABASE_SERVICE_ROLE_KEY is set
✅ Client Creation: Supabase client created successfully
✅ Database Query: Successfully queried services table
✅ Complex Query: Complex query executed successfully
✅ Table Access: Can access table: services
✅ Table Access: Can access table: users
...
```

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:
1. Ensure `.env.local` exists in the project root
2. Check that variable names match exactly (case-sensitive)
3. Restart your terminal/IDE after creating `.env.local`

### Connection Errors

If you see connection errors:
1. Verify your `SUPABASE_URL` is correct (should end with `.supabase.co`)
2. Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct (starts with `eyJ...`)
3. Check that your Supabase project is active and not paused
4. Verify your network connection

### Table Access Errors

If you see table access errors:
1. Ensure you've run the database migration scripts in the `scripts/` directory
2. Check that Row Level Security (RLS) policies allow service role access
3. Verify table names match your schema

## Files Created

- `scripts/verify-supabase.ts` - Standalone verification script
- `app/api/verify-supabase/route.ts` - API route for verification
- `package.json` - Added `verify:supabase` script and `tsx` dependency

## Next Steps

After verification passes:
1. Ensure all database migrations are applied
2. Test your application's database operations
3. Set up Row Level Security (RLS) policies if needed
4. Configure authentication if using Supabase Auth

