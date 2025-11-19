# Payment Processing Testing Guide

This guide covers comprehensive testing of the payment processing system, including Stripe integration, webhooks, email confirmations, refunds, and error handling.

## Prerequisites

1. **Stripe Test Mode Setup:**
   - Ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured
   - Use Stripe test mode keys for testing
   - Configure webhook endpoint in Stripe Dashboard: `https://your-domain.com/api/stripe/webhook`

2. **Test Cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires 3D Secure: `4000 0025 0000 3155`
   - Any future expiry date, any 3-digit CVC, any ZIP

3. **Database Access:**
   - Access to `transactions` table
   - Access to `bookings` table
   - Access to `billing_events` table

## Test Checklist

### 1. Test Payment Transaction Successful ✅

**Objective:** Verify that a successful payment creates all necessary records and updates booking status.

**Steps:**
1. Create a test booking via `/api/bookings` POST endpoint
2. Process payment via `/api/transactions` POST endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "bookingId": "BOOKING_ID",
       "amount": 100.00,
       "paymentMethodId": "pm_card_visa"
     }'
   ```
3. **Verify:**
   - Payment intent created in Stripe
   - Transaction record created in `transactions` table
   - Booking `payment_status` updated to `'paid'`
   - Transaction status is `'completed'`
   - Transaction includes correct `platform_fee` and `provider_payout`
   - `stripe_payment_intent_id` is stored

**Expected Results:**
- Payment succeeds
- Transaction record created with status `'completed'`
- Booking payment_status = `'paid'`
- Response includes transaction object and paymentIntentId

**Files to Check:**
- `app/api/transactions/route.ts` (POST handler)
- Database: `transactions` table
- Database: `bookings` table

---

### 2. Payment Confirmation Emails Sent ✅

**Objective:** Verify that payment confirmation emails are sent after successful payment.

**Implementation:**
- Payment confirmation emails are sent in two places:
  1. Direct payment flow: `/api/transactions` POST (line 268-274)
  2. Webhook handler: `/api/stripe/webhook` (line 111-117)

**Steps:**
1. Process a successful payment (see Test 1)
2. **Verify:**
   - Check email inbox for payment confirmation
   - Email subject should indicate payment confirmation
   - Email contains booking details and payment amount
   - Email sent to customer email address

**Test Email Template:**
- Template: `lib/emails/booking/templates.ts` - `paymentConfirmation` function
- Email client: `lib/emails/booking/index.ts` - `sendPaymentConfirmation` method

**Manual Verification:**
```bash
# Check email logs or email service dashboard
# Verify email was sent to customer email
# Check email content matches template
```

**Expected Results:**
- Email sent within 1-2 seconds of payment success
- Email contains:
  - Booking ID
  - Payment amount
  - Booking date/time
  - Service name
  - Confirmation message

**Files to Check:**
- `lib/emails/booking/send.ts` (sendBookingEmail function)
- `lib/emails/booking/templates.ts` (paymentConfirmation template)
- Email service logs/dashboard

---

### 3. Payment Webhooks Received and Processed ✅

**Objective:** Verify that Stripe webhooks are received, verified, and processed correctly.

**Webhook Endpoint:** `/api/stripe/webhook`

**Key Webhook Events Handled:**
- `payment_intent.succeeded` - Creates transaction, updates booking, sends email
- `payment_intent.payment_failed` - Updates transaction and booking status
- `charge.refunded` - Creates refund transaction, updates booking
- `account.updated` - Updates provider Stripe account status

**Steps:**
1. **Configure Webhook in Stripe Dashboard:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `account.updated`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

2. **Test Webhook Reception:**
   ```bash
   # Use Stripe CLI to send test webhook
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger payment_intent.succeeded
   ```

3. **Verify Webhook Processing:**
   - Check `billing_events` table for event record
   - Verify transaction created (if payment_intent.succeeded)
   - Verify booking updated
   - Check webhook logs for errors

**Expected Results:**
- Webhook returns 200 status
- Event stored in `billing_events` table
- Transaction created/updated as appropriate
- Booking status updated
- No errors in logs

**Files to Check:**
- `app/api/stripe/webhook/route.ts`
- Database: `billing_events` table
- Database: `transactions` table
- Application logs

---

### 4. Payment Records Created in Database ✅

**Objective:** Verify that payment transactions are properly recorded in the database.

**Database Tables:**
- `transactions` - Main transaction records
- `billing_events` - Stripe webhook events (audit trail)
- `bookings` - Booking payment status

**Steps:**
1. Process a payment (see Test 1)
2. **Query Database:**
   ```sql
   -- Check transaction record
   SELECT * FROM transactions 
   WHERE booking_id = 'BOOKING_ID' 
   AND transaction_type = 'payment'
   ORDER BY created_at DESC LIMIT 1;

   -- Check billing events
   SELECT * FROM billing_events 
   WHERE event_type = 'payment_intent.succeeded'
   ORDER BY created_at DESC LIMIT 5;

   -- Check booking payment status
   SELECT id, payment_status, total_amount 
   FROM bookings 
   WHERE id = 'BOOKING_ID';
   ```

3. **Verify Transaction Record:**
   - `booking_id` matches
   - `customer_id` matches
   - `provider_id` matches (if provider assigned)
   - `amount` equals payment amount
   - `platform_fee` calculated correctly
   - `provider_payout` calculated correctly
   - `transaction_type` = `'payment'`
   - `payment_method` = `'card'`
   - `stripe_payment_intent_id` present
   - `status` = `'completed'`
   - `created_at` timestamp present

**Expected Results:**
- Transaction record exists with all required fields
- Amounts match payment intent
- Status is `'completed'`
- Timestamps are correct

**Files to Check:**
- Database: `transactions` table
- Database: `billing_events` table
- `app/api/transactions/route.ts` (POST handler)
- `app/api/stripe/webhook/route.ts` (payment_intent.succeeded handler)

---

### 5. Stripe Dashboard Shows Transactions ✅

**Objective:** Verify that transactions appear in Stripe Dashboard.

**Steps:**
1. Process a test payment (see Test 1)
2. **Check Stripe Dashboard:**
   - Go to Stripe Dashboard → Payments
   - Find payment by Payment Intent ID
   - Verify payment details:
     - Amount matches
     - Status is "Succeeded"
     - Customer information
     - Metadata includes booking_id, customer_id, provider_id, tenant_id

3. **Verify Payment Intent Metadata:**
   - `booking_id` - Links to booking
   - `customer_id` - Links to customer
   - `provider_id` - Links to provider (if applicable)
   - `tenant_id` - Multi-tenant identifier
   - `platform_fee` - Platform fee in cents
   - `provider_payout` - Provider payout in cents

**Expected Results:**
- Payment appears in Stripe Dashboard
- Payment status is "Succeeded"
- All metadata fields present
- Amount matches database record

**Manual Verification:**
- Log into Stripe Dashboard
- Navigate to Payments section
- Search for payment intent ID from transaction record

---

### 6. Refund Process Tested ✅

**Objective:** Verify that refunds are processed correctly through both API and webhook.

**Refund Endpoints:**
- API: `POST /api/transactions/[id]/refund`
- Webhook: `charge.refunded` event handler

**Test Scenario A: Full Refund via API**

**Steps:**
1. Create a successful payment (see Test 1)
2. Process refund:
   ```bash
   curl -X POST https://your-domain.com/api/transactions/TRANSACTION_ID/refund \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "reason": "requested_by_customer"
     }'
   ```
3. **Verify:**
   - Refund created in Stripe
   - Refund transaction record created in database
   - Original transaction status updated to `'refunded'`
   - Booking `payment_status` updated to `'refunded'`
   - Booking `status` updated to `'refunded'`

**Test Scenario B: Partial Refund via API**

**Steps:**
1. Create a successful payment
2. Process partial refund:
   ```bash
   curl -X POST https://your-domain.com/api/transactions/TRANSACTION_ID/refund \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "amount": 50.00,
       "reason": "requested_by_customer"
     }'
   ```
3. **Verify:**
   - Partial refund created in Stripe
   - Refund transaction record created
   - Original transaction status remains `'completed'` (not `'refunded'`)
   - Booking status remains `'paid'` (partial refund)

**Test Scenario C: Refund via Webhook**

**Steps:**
1. Create a successful payment
2. Process refund directly in Stripe Dashboard
3. **Verify:**
   - Webhook `charge.refunded` received
   - Refund transaction record created
   - Original transaction updated
   - Booking updated appropriately

**Test Scenario D: Refund via Booking Cancellation**

**Steps:**
1. Create a paid booking
2. Cancel booking with refund:
   ```bash
   curl -X PATCH https://your-domain.com/api/bookings/BOOKING_ID \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "status": "cancelled",
       "process_refund": true
     }'
   ```
3. **Verify:**
   - Refund processed (full if >24h before booking, 50% if <24h)
   - Refund transaction created
   - Booking status updated

**Expected Results:**
- Refund appears in Stripe Dashboard
- Refund transaction record in database
- Original transaction status updated
- Booking status updated appropriately
- Refund amount matches request

**Files to Check:**
- `app/api/transactions/[id]/refund/route.ts`
- `app/api/stripe/webhook/route.ts` (charge.refunded handler)
- `app/api/bookings/[id]/route.ts` (cancellation with refund)
- Database: `transactions` table
- Stripe Dashboard → Refunds

---

### 7. Payment Error Handling Verified ✅

**Objective:** Verify that payment errors are handled gracefully and appropriate error messages are returned.

**Error Scenarios to Test:**

**A. Card Declined**
- Use test card: `4000 0000 0000 0002`
- **Expected:**
  - Error response with clear message
  - Transaction record created with status `'failed'` (if created)
  - Booking payment_status remains `'unpaid'` or set to `'failed'`
  - No email sent

**B. Insufficient Funds**
- Use test card: `4000 0000 0000 9995`
- **Expected:**
  - Error response indicating insufficient funds
  - Transaction status `'failed'`
  - Booking not updated to paid

**C. 3D Secure Required**
- Use test card: `4000 0025 0000 3155`
- **Expected:**
  - Response includes `requiresAction: true`
  - Response includes `clientSecret`
  - Payment intent status is `'requires_action'`
  - User can complete authentication

**D. Invalid Payment Method**
- Use invalid payment method ID
- **Expected:**
  - Error response with validation message
  - No transaction created
  - No booking update

**E. Payment Intent Already Processed**
- Attempt to process same payment twice
- **Expected:**
  - Error or idempotent handling
  - No duplicate transactions
  - Appropriate error message

**F. Webhook Signature Verification Failure**
- Send webhook with invalid signature
- **Expected:**
  - Webhook returns 400 error
  - Event not processed
  - Error logged

**G. Payment Succeeds but Database Update Fails**
- Simulate database error after payment success
- **Expected:**
  - Refund initiated automatically (see `app/api/transactions/route.ts` line 238-251)
  - Error logged
  - User notified of issue

**H. Webhook Processing Error**
- Send malformed webhook event
- **Expected:**
  - Error logged
  - Webhook returns appropriate status
  - System continues to function

**Test Commands:**
```bash
# Test card decline
curl -X POST https://your-domain.com/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID",
    "amount": 100.00,
    "paymentMethodId": "pm_card_chargeDeclined"
  }'

# Test 3D Secure
curl -X POST https://your-domain.com/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_ID",
    "amount": 100.00,
    "paymentMethodId": "pm_card_authenticationRequired"
  }'
```

**Expected Results:**
- All errors return appropriate HTTP status codes
- Error messages are user-friendly
- Failed payments don't create completed transactions
- System remains stable after errors
- Errors are logged for debugging

**Files to Check:**
- `app/api/transactions/route.ts` (error handling)
- `app/api/stripe/webhook/route.ts` (webhook error handling)
- Application logs
- Error monitoring (Sentry, etc.)

---

## Integration Testing

### End-to-End Payment Flow

1. **Create Booking**
   - Customer creates booking
   - Booking status: `'pending'`
   - Payment status: `'unpaid'`

2. **Process Payment**
   - Customer submits payment
   - Payment intent created in Stripe
   - Payment confirmed
   - Transaction record created
   - Booking payment_status: `'paid'`
   - Confirmation email sent

3. **Webhook Confirmation**
   - Stripe sends `payment_intent.succeeded` webhook
   - Webhook verifies signature
   - Event stored in `billing_events`
   - Transaction verified/created (idempotent)
   - Booking status confirmed

4. **Verify in Dashboard**
   - Transaction visible in Stripe Dashboard
   - Transaction visible in application dashboard
   - All records consistent

---

## Monitoring and Logging

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Successful payments / Total payment attempts
   - Target: >95%

2. **Webhook Processing Time**
   - Time from webhook receipt to processing
   - Target: <2 seconds

3. **Email Delivery Rate**
   - Payment confirmation emails delivered
   - Target: >98%

4. **Refund Processing Time**
   - Time from refund request to completion
   - Target: <5 minutes

### Logs to Review

- Payment processing logs: `[transactions]` prefix
- Webhook logs: `[stripe-webhook]` prefix
- Email logs: `[booking-email]` prefix
- Refund logs: `[refund]` prefix

---

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check webhook endpoint URL in Stripe Dashboard
   - Verify `STRIPE_WEBHOOK_SECRET` is set correctly
   - Check server logs for incoming requests
   - Verify webhook endpoint is publicly accessible

2. **Payment Succeeds but Transaction Not Created**
   - Check webhook is processing `payment_intent.succeeded`
   - Verify database connection
   - Check for duplicate transaction prevention logic
   - Review webhook logs for errors

3. **Email Not Sent**
   - Check email service configuration
   - Verify customer email address is valid
   - Check email service logs
   - Verify email sending doesn't block payment processing

4. **Refund Not Processing**
   - Verify refund endpoint is accessible
   - Check transaction has `stripe_payment_intent_id`
   - Verify transaction status allows refund
   - Check Stripe API key permissions

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test transactions
DELETE FROM transactions WHERE booking_id IN (
  SELECT id FROM bookings WHERE created_at > NOW() - INTERVAL '1 day'
);

-- Delete test billing events
DELETE FROM billing_events WHERE created_at > NOW() - INTERVAL '1 day';

-- Delete test bookings (if needed)
-- DELETE FROM bookings WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## Checklist Summary

- [ ] Test payment transaction successful
- [ ] Payment confirmation emails sent
- [ ] Payment webhooks received and processed
- [ ] Payment records created in database
- [ ] Stripe dashboard shows transactions
- [ ] Refund process tested (full, partial, via API, via webhook)
- [ ] Payment error handling verified (declined, insufficient funds, 3D Secure, etc.)

---

## Related Documentation

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Email Delivery Testing Guide](./EMAIL_DELIVERY_TESTING_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

