# Integration Verification Guide

This document describes how to verify that all integrations are working correctly in the application.

## Overview

The application integrates with multiple third-party services:
- **Supabase**: Database and authentication
- **Stripe**: Payment processing
- **Email Service**: SMTP email delivery (GoDaddy Workspace)
- **WhatsApp**: Messaging service (optional)
- **Analytics**: Vercel Analytics and Sentry (optional)
- **Third-Party APIs**: Google Home, Alexa, HomeKit, Smart Locks, etc. (optional)

## Verification Methods

### Method 1: Command Line Script (Recommended)

Run the comprehensive integration verification script:

```bash
npm run verify:integrations
```

This script will:
- ✅ Check all required environment variables
- ✅ Test Supabase connection and queries
- ✅ Verify Stripe API connectivity
- ✅ Test SMTP email connection
- ✅ Check WhatsApp configuration (if enabled)
- ✅ Verify analytics services (if enabled)
- ✅ Check third-party API integrations (if enabled)
- ✅ Verify error handling patterns

**Expected Output:**
```
🚀 Starting Integration Verification

📊 Step 1: Verifying Supabase Integration
✅ Supabase Config: Environment variables set
✅ Supabase Client: Supabase client created successfully
✅ Supabase Query: Database query executed successfully

💳 Step 2: Verifying Stripe Integration
✅ Stripe Config: Stripe environment variables set
✅ Stripe Client: Stripe client created successfully
✅ Stripe API: Stripe API connection verified

📧 Step 3: Verifying Email Service Integration
✅ Email Config: SMTP environment variables set
✅ Email Connection: SMTP connection verified successfully

💬 Step 4: Verifying WhatsApp Integration
✅ WhatsApp Config: WhatsApp environment variables set

📈 Step 5: Verifying Analytics Integration
✅ Vercel Analytics: Vercel Analytics configured
✅ Sentry: Sentry configured

🔌 Step 6: Verifying Third-Party API Integrations
⚠️  Google Home: Google Home not configured (optional)
⚠️  Alexa: Alexa not configured (optional)

🛡️  Step 7: Verifying Integration Error Handling
✅ Error Handling: Integration error handling patterns verified

📊 Verification Summary
✅ Success: 15
⚠️  Warnings: 5
❌ Errors: 0

🎉 All critical integrations are working!
```

### Method 2: API Endpoint

Start your Next.js development server:

```bash
npm run dev
```

Then make a GET request to:

```
http://localhost:3000/api/verify-integrations
```

Or use curl:

```bash
curl http://localhost:3000/api/verify-integrations
```

**Response Format:**
```json
{
  "summary": {
    "success": 15,
    "errors": 0,
    "warnings": 5,
    "total": 20
  },
  "results": [
    {
      "step": "Supabase Config",
      "status": "success",
      "message": "Environment variables set"
    },
    {
      "step": "Stripe Config",
      "status": "success",
      "message": "Stripe environment variables set"
    }
    // ... more results
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Method 3: Individual Integration Checks

#### Supabase

```bash
npm run verify:supabase
```

Or visit: `http://localhost:3000/api/verify-supabase`

#### Stripe

Check configuration:
```typescript
import { isStripeConfigured } from '@/lib/stripe'
if (isStripeConfigured()) {
  // Stripe is configured
}
```

#### Email

Test SMTP connection:
```typescript
import { verifySMTPConnection } from '@/lib/emails/smtp'
const isConnected = await verifySMTPConnection()
```

## Required Environment Variables

### Critical Integrations

**Supabase:**
- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `NEXT_PUBLIC_SUPABASE_URL` (optional, for client-side)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional, for client-side)

**Email (SMTP):**
- `SMTP_HOST` (optional, defaults to `smtpout.secureserver.net` - GoDaddy Workspace)
- `SMTP_PORT` (optional, defaults to `465` with SSL/TLS)
- `SMTP_USER` (optional, defaults to `whatsmartapp@tsmartsupport.com`)
- `SMTP_PASSWORD` or `SMTP_PASS` (optional, has default but **should be set via env var for security**)

**GoDaddy Workspace SMTP Settings:**
- **SMTP Host:** `smtpout.secureserver.net`
- **SMTP Port:** `465` (SSL/TLS)
- **SMTP Username:** Your full email address (e.g., `whatsmartapp@tsmartsupport.com`)
- **SMTP Password:** Your email account password

**⚠️ Security Note:** While the code has default values, it's **strongly recommended** to set these as environment variables in production to avoid hardcoding credentials.

**Stripe:**
- `STRIPE_SECRET_KEY` (required for payments)
- `STRIPE_CONNECT_CLIENT_ID` (required for Connect)
- `STRIPE_WEBHOOK_SECRET` (required for webhooks)

### Optional Integrations

**WhatsApp:**
- `WHATSMARTAPP_INSTANCE_ID`
- `WHATSMARTAPP_API_KEY`
- `WHATSMARTAPP_BASE_URL`

**Analytics:**
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` (for Vercel Analytics)
- `NEXT_PUBLIC_VERCEL_URL` (for Vercel Analytics)
- `NEXT_PUBLIC_SENTRY_DSN` or `SENTRY_DSN` (for Sentry)

**Third-Party APIs:**
- `GOOGLE_HOME_CLIENT_ID`, `GOOGLE_HOME_CLIENT_SECRET`
- `ALEXA_SKILL_ID`, `ALEXA_CLIENT_ID`
- `HOMEKIT_ACCESSORY_ID`
- `SMART_LOCK_API_KEY`
- `THERMOSTAT_API_KEY`
- `CAMERA_API_KEY`

## Troubleshooting

### Supabase Connection Issues

1. **Missing Environment Variables**
   - Ensure `.env.local` contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Verify the values are correct (no extra spaces)

2. **Connection Timeout**
   - Check your network connection
   - Verify Supabase project is active
   - Check Supabase dashboard for service status

3. **Query Errors**
   - Verify tables exist in your Supabase database
   - Check RLS (Row Level Security) policies
   - Ensure service role key has proper permissions

### Stripe Integration Issues

1. **Configuration Check Fails**
   - Verify `STRIPE_SECRET_KEY` is set
   - Verify `STRIPE_CONNECT_CLIENT_ID` is set (for Connect features)
   - Check that keys are from the same environment (test vs. live)

2. **API Connection Fails**
   - Verify Stripe API key is valid
   - Check Stripe service status
   - Ensure network can reach `api.stripe.com`

### Email Integration Issues

1. **SMTP Configuration**
   - The code has default values for GoDaddy Workspace SMTP, but environment variables are recommended
   - Set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASSWORD` in `.env.local` for production
   - Default values (from `lib/emails/smtp.ts`):
     - Host: `smtpout.secureserver.net`
     - Port: `465` (SSL/TLS)
     - User: `whatsmartapp@tsmartsupport.com`
     - Password: Check codebase (should be moved to env var)

2. **Connection Verification Fails**
   - Check firewall settings
   - Verify SMTP server is accessible (`smtpout.secureserver.net:465`)
   - Test credentials with email client
   - Check for rate limiting
   - Verify GoDaddy Workspace email account is active
   - Ensure SSL/TLS is enabled (port 465)

### WhatsApp Integration Issues

1. **Not Configured (Warning)**
   - This is expected if WhatsApp is not enabled
   - Set `WHATSMARTAPP_INSTANCE_ID` and `WHATSMARTAPP_API_KEY` to enable

2. **API Errors**
   - Verify API credentials are correct
   - Check `WHATSMARTAPP_BASE_URL` is set correctly
   - Verify API endpoint is accessible

## Integration Status Codes

- **✅ Success**: Integration is configured and working
- **⚠️ Warning**: Integration is optional and not configured, or has minor issues
- **❌ Error**: Critical integration failed or is misconfigured

## Continuous Monitoring

For production environments, consider:

1. **Scheduled Checks**: Run `npm run verify:integrations` as a cron job
2. **Health Check Endpoint**: Use `/api/verify-integrations` in monitoring tools
3. **Alerting**: Set up alerts for critical integration failures
4. **Logging**: Monitor integration errors in application logs

## Related Documentation

- [Supabase Verification Guide](../SUPABASE_VERIFICATION.md)
- [Payment Processing Test Guide](PAYMENT_PROCESSING_TEST_GUIDE.md)
- [Email Delivery Testing Guide](EMAIL_DELIVERY_TESTING_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

