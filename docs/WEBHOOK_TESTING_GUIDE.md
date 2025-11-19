# Webhook Testing and Verification Guide

This guide provides comprehensive instructions for testing and verifying webhook endpoints in the application.

## Webhook Endpoints

### Stripe Webhook
- **Endpoint**: `/api/stripe/webhook`
- **Method**: POST
- **Authentication**: Signature verification using `STRIPE_WEBHOOK_SECRET`
- **Purpose**: Handles payment events from Stripe (payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, etc.)

### Vendor Webhooks
- **Endpoint**: `/api/webhooks/[vendor]`
- **Method**: POST
- **Vendors**: persona, veriff, checkr, etc.
- **Purpose**: Handles verification events from third-party identity verification services

### Email Webhooks
- **Endpoint**: `/api/webhooks/email`
- **Method**: POST
- **Purpose**: Handles email delivery status events (delivered, bounced, opened, etc.)

## Prerequisites

1. **Environment Variables**:
   - `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret (starts with `whsec_`)
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

2. **Database Tables**:
   - `webhook_events`: Logs all webhook events
   - `billing_events`: Logs Stripe billing events
   - `transactions`: Stores payment transactions
   - `bookings`: Stores booking records

3. **Stripe Account**:
   - Access to Stripe Dashboard
   - Webhook endpoint configured in Stripe Dashboard

## Testing Stripe Webhooks

### 1. Verify Webhook Endpoint is Accessible

```bash
# Test endpoint accessibility (should return 501 if secret not configured, or 401 if signature invalid)
curl -X POST https://yourdomain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Expected responses:
- `501`: Webhook secret not configured
- `401`: Invalid signature (expected for test requests)
- `400`: Malformed payload

### 2. Test with Stripe CLI (Recommended)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or
npm install -g stripe-cli
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to local endpoint:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Or forward to production:
```bash
stripe listen --forward-to https://yourdomain.com/api/stripe/webhook
```

Trigger test events:
```bash
# Test payment_intent.succeeded
stripe trigger payment_intent.succeeded

# Test payment_intent.payment_failed
stripe trigger payment_intent.payment_failed

# Test charge.refunded
stripe trigger charge.refunded
```

### 3. Test Signature Verification

The webhook handler verifies signatures using Stripe's `constructEvent()` method. Invalid signatures will:
- Return HTTP 401 (Unauthorized)
- Log to `webhook_events` table with status `failed`
- Not trigger retries (Stripe won't retry 401 responses)

To test signature verification:
1. Send a request with invalid signature
2. Verify response is 401
3. Check `webhook_events` table for failed entry

### 4. Test Error Handling

#### Processing Errors (HTTP 500 - Triggers Retry)
Processing errors return 500, which tells Stripe to retry:
- Database connection errors
- Missing booking records
- Transaction creation failures

Test by:
1. Temporarily breaking database connection
2. Sending webhook with invalid booking_id
3. Verify 500 response and retry behavior

#### Signature Errors (HTTP 401 - No Retry)
Signature errors return 401, which prevents retries:
- Invalid webhook secret
- Missing signature header
- Tampered payload

Test by:
1. Sending request without signature header
2. Sending request with wrong secret
3. Verify 401 response and no retries

### 5. Test Idempotency

Webhooks should be idempotent - processing the same event multiple times should have the same result.

Test by:
1. Send the same webhook event twice
2. Verify:
   - Only one transaction is created
   - No duplicate records
   - Second request is logged but skipped

### 6. Verify Webhook Logging

All webhook events are logged to the `webhook_events` table:

```sql
-- View recent webhook events
SELECT 
  provider,
  event_type,
  status,
  http_status,
  error_message,
  created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 50;

-- View failed webhooks
SELECT 
  provider,
  event_type,
  status,
  http_status,
  error_message,
  created_at
FROM webhook_events
WHERE status = 'failed'
ORDER BY created_at DESC;

-- View webhook processing times
SELECT 
  provider,
  event_type,
  status,
  created_at,
  processed_at,
  EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_seconds
FROM webhook_events
WHERE processed_at IS NOT NULL
ORDER BY created_at DESC;
```

### 7. Test Event Processing

#### payment_intent.succeeded
1. Create a test payment in Stripe
2. Verify:
   - Transaction created in `transactions` table
   - Booking `payment_status` updated to `paid`
   - Payment confirmation email sent (check logs)
   - Event logged in `webhook_events` with status `processed`

#### payment_intent.payment_failed
1. Trigger a failed payment
2. Verify:
   - Transaction status updated to `failed`
   - Booking `payment_status` updated to `failed`
   - Event logged in `webhook_events`

#### charge.refunded
1. Process a refund in Stripe
2. Verify:
   - Refund transaction created
   - Original transaction status updated to `refunded`
   - Booking status updated to `refunded`
   - Event logged in `webhook_events`

## Testing Vendor Webhooks

### 1. Test Endpoint Accessibility

```bash
# Test vendor webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/persona \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "type": "government_id",
    "status": "passed"
  }'
```

### 2. Test Validation

Send requests with missing required fields:
```bash
# Missing userId
curl -X POST https://yourdomain.com/api/webhooks/persona \
  -H "Content-Type: application/json" \
  -d '{"type": "government_id", "status": "passed"}'
```

Expected: HTTP 400 with error message

### 3. Test Processing

Send valid webhook:
```bash
curl -X POST https://yourdomain.com/api/webhooks/persona \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "valid-user-uuid",
    "type": "government_id",
    "status": "passed",
    "vendor_ref": "persona-123",
    "score": 0.95
  }'
```

Verify:
- Verification record created/updated in `verifications` table
- Event logged in `verification_events` table
- Policy result computed (if applicable)
- Webhook logged in `webhook_events` table

## Monitoring Webhooks

### 1. Check Webhook Logs

```sql
-- Recent webhook activity
SELECT 
  provider,
  event_type,
  status,
  COUNT(*) as count
FROM webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY provider, event_type, status
ORDER BY count DESC;

-- Failed webhooks in last hour
SELECT 
  provider,
  event_type,
  error_message,
  COUNT(*) as failure_count
FROM webhook_events
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY provider, event_type, error_message
ORDER BY failure_count DESC;
```

### 2. Monitor Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Select your webhook endpoint
3. Review:
   - Recent events
   - Success/failure rates
   - Response times
   - Error messages

### 3. Set Up Alerts

Create alerts for:
- High failure rate (>5% in last hour)
- Processing errors (HTTP 500)
- Signature verification failures (HTTP 401)

## Troubleshooting

### Webhook Not Received

1. **Check endpoint URL**: Verify URL in Stripe Dashboard matches production URL
2. **Check firewall**: Ensure Stripe IPs are whitelisted (if applicable)
3. **Check logs**: Review application logs for incoming requests
4. **Test locally**: Use Stripe CLI to forward events locally

### Signature Verification Fails

1. **Check secret**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. **Check header**: Ensure `stripe-signature` header is present
3. **Check body**: Ensure raw body is used (not parsed JSON)

### Processing Errors

1. **Check database**: Verify database connection and tables exist
2. **Check logs**: Review error messages in `webhook_events` table
3. **Check data**: Verify booking/transaction data exists
4. **Check idempotency**: Ensure duplicate events are handled correctly

### High Retry Rate

1. **Check processing time**: Long processing times may cause timeouts
2. **Check error handling**: Ensure proper error messages and status codes
3. **Check database**: Verify database performance and connection pool
4. **Review logs**: Check for common error patterns

## Production Checklist

- [ ] `STRIPE_WEBHOOK_SECRET` configured in production environment
- [ ] Webhook endpoint URL configured in Stripe Dashboard
- [ ] Webhook events table created and accessible
- [ ] Database indexes created for webhook_events table
- [ ] Monitoring alerts configured
- [ ] Error logging configured
- [ ] Idempotency verified
- [ ] Retry logic tested
- [ ] Signature verification tested
- [ ] All event types tested
- [ ] Webhook logs reviewed for issues

## Security Considerations

1. **Signature Verification**: Always verify webhook signatures
2. **HTTPS Only**: Webhooks should only be sent over HTTPS
3. **Secret Management**: Store webhook secrets securely (environment variables)
4. **Rate Limiting**: Consider rate limiting for webhook endpoints
5. **IP Whitelisting**: Optionally whitelist Stripe IP ranges
6. **Payload Validation**: Validate webhook payload structure
7. **Error Messages**: Don't expose sensitive information in error messages

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)

