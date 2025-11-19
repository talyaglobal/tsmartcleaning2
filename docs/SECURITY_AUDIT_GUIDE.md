# Security Audit Guide

This guide explains how to run security audits and verify the security of the application.

## Quick Start

### Run Security Audit

```bash
npx tsx scripts/security-audit.ts
```

This will:
1. Audit all 225 API routes for authentication
2. Check for service role key exposure
3. Generate `SECURITY_AUDIT_REPORT.md`
4. Create `scripts/verify-rls-policies.sql`

### Verify RLS Policies

```bash
# Connect to your Supabase database and run:
psql -h <your-db-host> -U postgres -d postgres -f scripts/verify-rls-policies.sql
```

Or use the Supabase SQL editor to run the script.

## Understanding the Audit Report

### Security Status Levels

- ✅ **Secure** - Route has proper authentication and authorization
- 🔴 **Critical** - Missing authentication on sensitive routes (admin, user data)
- 🟠 **High** - Missing authentication or ownership verification
- 🟡 **Medium** - May need authentication (review required)
- ⚠️ **Warning** - Potential security issue

### Common Issues

1. **Missing Authentication**
   - Route should use `withAuth()` wrapper
   - Admin routes should use `withAuth({ requireAdmin: true })`
   - Root admin routes should use `withRootAdmin()`

2. **Missing Ownership Verification**
   - Routes accepting `userId` or resource IDs should verify ownership
   - Use `verifyBookingOwnership()`, `verifyCompanyMembership()`, or `verifyCustomerOwnership()`

3. **Admin Routes Not Requiring Admin**
   - All `/api/admin/*` routes should require admin authentication
   - Check that `withAuth({ requireAdmin: true })` is used

## Service Role Key Security

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) should:
- ✅ Only be used in server-side code (API routes, server utilities)
- ✅ Never be exposed to client-side code
- ✅ Never be in `NEXT_PUBLIC_*` environment variables
- ✅ Never be logged or returned in API responses

The audit automatically checks for these issues.

## RLS Policy Verification

Row Level Security (RLS) policies ensure that users can only access their own data at the database level. The verification script checks:

1. **RLS Enabled** - Tables should have RLS enabled
2. **Policies Exist** - Tables should have appropriate policies
3. **Policy Coverage** - All sensitive tables should have policies

### Common RLS Patterns

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all data
CREATE POLICY "Admins can view all"
  ON table_name FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'root_admin')
    )
  );
```

## Testing Unauthorized Access

Existing tests are in `tests/integration/api-auth-security.test.ts`. To run:

```bash
npm run test:integration
```

### Adding New Tests

```typescript
it('should reject unauthorized access', async () => {
  const req = createMockRequest('/api/protected-route', {
    method: 'GET',
    // No auth headers
  })
  
  const res = await GET(req)
  expect(res.status).toBe(401)
})
```

## Fixing Security Issues

### 1. Add Authentication

```typescript
// Before
export async function GET(request: NextRequest) {
  // Route logic
}

// After
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(async (request: NextRequest, auth) => {
  // Route logic - auth.user is available
})
```

### 2. Add Ownership Verification

```typescript
import { verifyBookingOwnership } from '@/lib/auth/rbac'

export const GET = withAuth(async (request: NextRequest, auth, { params }) => {
  const { id } = params
  
  const hasAccess = await verifyBookingOwnership(
    id,
    auth.user.id,
    auth.user.role,
    auth.supabase
  )
  
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }
  
  // Route logic
})
```

### 3. Require Admin

```typescript
export const GET = withAuth(
  async (request: NextRequest, auth) => {
    // Route logic - only admins can access
  },
  { requireAdmin: true }
)
```

## Regular Security Checks

1. **Before Each Release**
   - Run security audit
   - Review critical and high priority issues
   - Verify RLS policies are up to date
   - Run integration tests

2. **After Adding New Routes**
   - Ensure new routes have proper authentication
   - Add ownership verification if needed
   - Update audit report

3. **Quarterly**
   - Full security audit
   - Review all public routes
   - Verify RLS policies
   - Check for new security vulnerabilities

## Resources

- **Security Audit Report:** `SECURITY_AUDIT_REPORT.md`
- **Security Audit Summary:** `SECURITY_AUDIT_SUMMARY.md`
- **API Auth Audit:** `API_AUTH_AUDIT_REPORT.md`
- **RLS Verification Script:** `scripts/verify-rls-policies.sql`
- **Security Tests:** `tests/integration/api-auth-security.test.ts`

## Getting Help

If you find security issues:
1. Document them in the security audit report
2. Fix critical issues immediately
3. Create tests to prevent regression
4. Update this guide with new patterns

