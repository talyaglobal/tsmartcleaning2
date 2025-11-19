# Security Configuration

This document describes the security measures implemented in the application.

## Security Headers

All responses include the following security headers (configured in `middleware.ts`):

- **Content-Security-Policy**: Restricts resource loading to trusted sources
- **X-Frame-Options**: Prevents clickjacking attacks (set to `SAMEORIGIN`)
- **X-Content-Type-Options**: Prevents MIME type sniffing (set to `nosniff`)
- **Referrer-Policy**: Controls referrer information (set to `strict-origin-when-cross-origin`)
- **Permissions-Policy**: Restricts browser features (camera, microphone, geolocation disabled)
- **X-XSS-Protection**: Enables browser XSS filtering (set to `1; mode=block`)

## CORS Configuration

CORS is configured for API routes with the following rules:

- **Production**: Only allows origins specified in `ALLOWED_ORIGINS` environment variable
- **Development**: Allows localhost origins for easier development
- **Headers**: Allows `Content-Type`, `Authorization`, `x-tenant-id`, `x-user-role`
- **Methods**: Allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- **Credentials**: Enabled for authenticated requests

### Environment Variables

Set `ALLOWED_ORIGINS` in production:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Rate Limiting

Rate limiting is implemented for API routes to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per minute
- **Public read endpoints**: 200 requests per minute
- **Sensitive operations**: 3 requests per 15 minutes

Rate limiting is IP-based and can be customized per endpoint using the `checkRateLimit` utility from `lib/security/rate-limit.ts`.

## SQL Injection Protection

All database queries use parameterized queries through Supabase:

- Supabase client automatically parameterizes all queries
- No raw SQL strings are constructed with user input
- Query builders (`.eq()`, `.select()`, etc.) handle escaping

Example:
```typescript
// Safe - Supabase handles parameterization
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId) // userId is automatically escaped
```

## XSS Protection

XSS protection is provided by:

1. **React's automatic escaping**: All user input rendered in JSX is automatically escaped
2. **Content Security Policy**: Restricts inline scripts and external resources
3. **X-XSS-Protection header**: Enables browser-level XSS filtering

When rendering user content, use React's built-in escaping:
```tsx
// Safe - React escapes automatically
<div>{userContent}</div>

// For HTML content, use dangerouslySetInnerHTML with sanitization
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

## CSRF Protection

CSRF protection is provided by Next.js:

- Next.js includes built-in CSRF protection
- SameSite cookies are used for session management
- API routes validate request origins

## Row Level Security (RLS)

All Supabase tables have Row Level Security enabled:

- RLS policies restrict data access based on user context
- Service role key bypasses RLS (server-side only)
- Client-side queries are restricted by RLS policies

To verify RLS is enabled, run:
```bash
# Using Supabase Dashboard SQL Editor
# Run scripts/verify-rls-policies.sql
```

## Service Role Key Security

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is:

- ✅ Only used in server-side code (API routes, server components)
- ✅ Never exposed to client-side code
- ✅ Stored in environment variables (never in code)
- ✅ Not included in `NEXT_PUBLIC_*` environment variables

**Verification**: The security audit script checks for service role key exposure:
```bash
npm run security-audit
```

## API Keys and Secrets

All sensitive credentials are stored in environment variables:

- **Server-side only**: `SUPABASE_SERVICE_ROLE_KEY`, `ROOT_ADMIN_PASSWORD`, etc.
- **Client-side safe**: Only `NEXT_PUBLIC_*` variables are exposed to the browser
- **Never in code**: No hardcoded secrets in source code

### Environment Variables Checklist

**Server-side only (never expose to client):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `ROOT_ADMIN_PASSWORD`
- `ROOT_ADMIN_OTP_SECRET`
- `ROOT_ADMIN_SESSION_SECRET`
- Any API keys or secrets

**Client-side safe (can be exposed):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

## Security Audit

Run the security audit to verify all security measures:

```bash
npm run security-audit
```

This checks:
- Service role key exposure
- Authentication on API routes
- Parameter validation
- Security headers
- RLS policies

## Related Files

- `middleware.ts` - Security headers and CORS configuration
- `lib/security/headers.ts` - Security header utilities
- `lib/security/rate-limit.ts` - Rate limiting utilities
- `scripts/security-audit.ts` - Security audit script
- `scripts/verify-rls-policies.sql` - RLS verification script

