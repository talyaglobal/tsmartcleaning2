# Email Delivery Testing Guide

This guide covers how to test and verify email delivery functionality in the tSmartCleaning application.

## Overview

The application uses **GoDaddy Workspace SMTP** for sending emails. Email functionality includes:
- Booking confirmation emails
- Password reset emails (via Supabase Auth)
- Insurance policy emails
- Notification emails
- Payout notification emails

## Testing Endpoints

### 1. Test Email Sending

**Endpoint:** `POST /api/emails/test`

**Authentication:** Admin role required

**Request Body:**
```json
{
  "email": "test@example.com",
  "testType": "basic" // Options: "basic", "booking", "insurance", "smtp", "all"
}
```

**Test Types:**
- `basic` - Sends a simple test email
- `booking` - Tests booking confirmation email template
- `insurance` - Tests insurance welcome email template
- `smtp` - Tests SMTP connection only (doesn't send email)
- `all` - Runs all email tests

**Example Response:**
```json
{
  "success": true,
  "testType": "basic",
  "result": {
    "success": true,
    "messageId": "test-1234567890",
    "timestamp": "2025-01-27T12:00:00.000Z"
  },
  "message": "Test email sent successfully"
}
```

### 2. Preview Email Templates

**Endpoint:** `GET /api/emails/preview?template=booking-confirmation`

**Authentication:** Admin role required

**Available Templates:**
- `booking-confirmation`
- `booking-confirmed`
- `booking-reminder`
- `booking-completed`
- `booking-cancelled`
- `booking-refunded`
- `insurance-welcome`
- `insurance-coverage-reminder`

**Example Response:**
```json
{
  "success": true,
  "template": "booking-confirmation",
  "subject": "Booking Confirmation - Standard Cleaning",
  "html": "<html>...</html>",
  "text": "Plain text version..."
}
```

### 3. View Email Statistics

**Endpoint:** `GET /api/emails/stats?period=month&type=all`

**Authentication:** Admin role required

**Query Parameters:**
- `period`: `today`, `week`, `month`, or `all` (default: `month`)
- `type`: `usage`, `delivery`, or `all` (default: `all`)

**Example Response:**
```json
{
  "success": true,
  "period": "month",
  "usage": {
    "thisMonth": 1250,
    "quotaLimit": 10000,
    "quotaRemaining": 8750,
    "quotaPercentage": 12.5
  },
  "delivery": {
    "sent": 1250,
    "delivered": 1200,
    "bounced": 10,
    "failed": 40,
    "deliveryRate": 96.0,
    "bounceRate": 0.8
  },
  "quota": {
    "exceeded": false,
    "remaining": 8750,
    "limit": 10000
  },
  "bounceRate": {
    "high": false,
    "rate": 0.8,
    "threshold": 5.0
  }
}
```

## Manual Testing Checklist

### 1. Test Basic Email Sending

1. Use the test endpoint to send a test email to your own email address
2. Check your inbox (and spam folder) for the test email
3. Verify the email content renders correctly
4. Check email headers for proper sender information

**Command:**
```bash
curl -X POST https://yourdomain.com/api/emails/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"email": "your-email@example.com", "testType": "basic"}'
```

### 2. Test Booking Confirmation Emails

1. Create a test booking through the application
2. Verify the booking confirmation email is sent
3. Check that all booking details are correct in the email
4. Verify links in the email work correctly
5. Test on different email providers (Gmail, Outlook, Yahoo, etc.)

**What to Check:**
- Email arrives within 1-2 minutes of booking creation
- All booking details are accurate
- Links point to correct URLs
- Email template renders correctly on mobile and desktop
- Branding (logo, colors) displays correctly

### 3. Test Password Reset Emails

1. Go to the password reset page
2. Enter a valid email address
3. Check inbox for password reset email
4. Verify the reset link works
5. Complete the password reset flow

**What to Check:**
- Email arrives within 1-2 minutes
- Reset link is valid and not expired
- Link redirects to correct reset password page
- Password reset completes successfully

**Note:** Password reset emails are sent via Supabase Auth, not directly through our SMTP.

### 4. Test Notification Emails

Test various notification emails:
- Insurance policy welcome emails
- Payout notification emails
- Report generation emails
- Other system notifications

**What to Check:**
- Emails are sent at the correct times
- Content is accurate and personalized
- Links work correctly
- Templates render properly

### 5. Test Email Templates

1. Use the preview endpoint to view all email templates
2. Check that templates render correctly in different email clients
3. Verify branding is consistent across all templates
4. Test responsive design on mobile email clients

**Email Clients to Test:**
- Gmail (web, iOS, Android)
- Outlook (web, desktop, mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Other common email providers

## Monitoring Email Delivery

### Email Quota Monitoring

The system tracks email usage and enforces quotas if configured:

**Environment Variable:**
```bash
EMAIL_QUOTA_LIMIT=10000  # Monthly email limit
```

**Quota Checks:**
- Automatically checked before sending emails
- Returns 429 status if quota exceeded
- Statistics available via `/api/emails/stats`

### Bounce Rate Monitoring

**Bounce Rate Threshold:** 5% (configurable)

If bounce rate exceeds threshold:
- System logs warning
- Review bounced email addresses
- Consider removing invalid addresses
- Check email list quality

**Hard Bounces:**
- Automatically disables email notifications for that user
- User email marked as invalid
- Prevents future email delivery attempts

### Delivery Statistics

Monitor delivery statistics regularly:
- **Delivery Rate:** Should be > 95%
- **Bounce Rate:** Should be < 5%
- **Open Rate:** Track engagement (if webhooks enabled)
- **Click Rate:** Track link engagement (if webhooks enabled)

## Spam Folder Issues

### Common Causes

1. **SPF/DKIM/DMARC Not Configured**
   - GoDaddy Workspace should handle this automatically
   - Verify domain authentication in GoDaddy settings

2. **High Bounce Rate**
   - Keep bounce rate below 5%
   - Remove invalid email addresses promptly

3. **Spam Trigger Words**
   - Avoid words like "free", "urgent", "act now" in subject lines
   - Use professional, clear language

4. **Low Engagement**
   - Users not opening/clicking emails
   - Consider improving email content

5. **Sending Volume**
   - Sudden spikes in email volume can trigger spam filters
   - Gradually increase sending volume

### How to Check for Spam Issues

1. **Send Test Emails to Multiple Providers**
   - Gmail
   - Outlook
   - Yahoo
   - Apple Mail
   - Check spam folders manually

2. **Use Email Testing Tools**
   - [Mail-Tester.com](https://www.mail-tester.com/)
   - [MXToolbox](https://mxtoolbox.com/)
   - [MailGenius](https://www.mailgenius.com/)

3. **Monitor Bounce/Spam Reports**
   - Check webhook events for spam reports
   - Review bounce reasons
   - Take action on hard bounces

4. **Check Sender Reputation**
   - Monitor sender score
   - Use tools like [Sender Score](https://www.senderscore.org/)

### Best Practices to Avoid Spam

1. **Use Clear, Professional Subject Lines**
   - Avoid all caps
   - Avoid excessive punctuation
   - Be specific and relevant

2. **Include Unsubscribe Links**
   - Required by law (CAN-SPAM Act)
   - Makes emails more trustworthy

3. **Maintain Clean Email Lists**
   - Remove invalid addresses
   - Honor unsubscribe requests immediately
   - Don't send to purchased lists

4. **Warm Up New Domains**
   - Start with low volume
   - Gradually increase over weeks
   - Build sender reputation

5. **Monitor Engagement**
   - Track open rates
   - Track click rates
   - Remove inactive subscribers

## Email Service Configuration

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password

# Email Quota (optional)
EMAIL_QUOTA_LIMIT=10000

# Email Webhook Secret (if using webhook-enabled provider)
EMAIL_WEBHOOK_SECRET=your-webhook-secret
```

### GoDaddy Workspace SMTP Limits

- **Daily sending limit:** Varies by plan (typically 250-1000 emails/day)
- **Rate limiting:** May throttle if sending too quickly
- **Webhooks:** Not supported (use alternative provider if needed)

### Switching Email Providers

If you need webhook support or higher limits, consider:
- **SendGrid** - Webhooks, analytics, high limits
- **Mailgun** - Webhooks, detailed analytics
- **AWS SES** - Cost-effective, webhooks via SNS
- **Resend** - Modern API, webhooks, great developer experience

**Migration Steps:**
1. Set up new provider account
2. Update SMTP configuration
3. Configure webhooks (if supported)
4. Test thoroughly
5. Update environment variables
6. Monitor delivery rates

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**
   - Verify credentials are correct
   - Test SMTP connection: `POST /api/emails/test` with `testType: "smtp"`

2. **Check Email Quota**
   - View stats: `GET /api/emails/stats`
   - Verify quota not exceeded

3. **Check Server Logs**
   - Look for SMTP errors
   - Check for authentication failures
   - Review rate limiting messages

4. **Test SMTP Connection**
   ```bash
   curl -X POST https://yourdomain.com/api/emails/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"email": "test@example.com", "testType": "smtp"}'
   ```

### Emails Going to Spam

1. **Check Domain Authentication**
   - SPF records
   - DKIM signatures
   - DMARC policy

2. **Review Email Content**
   - Avoid spam trigger words
   - Use professional language
   - Include unsubscribe links

3. **Monitor Bounce Rate**
   - Keep below 5%
   - Remove invalid addresses

4. **Check Sender Reputation**
   - Use reputation checking tools
   - Warm up new domains gradually

### High Bounce Rate

1. **Identify Bounce Types**
   - Hard bounces: Invalid addresses (remove immediately)
   - Soft bounces: Temporary issues (retry later)

2. **Clean Email List**
   - Remove hard bounces
   - Verify email addresses before sending
   - Use double opt-in for subscriptions

3. **Review Bounce Reasons**
   - Check webhook events
   - Address common issues
   - Update email validation

## Production Checklist

Before going to production, verify:

- [ ] Test emails sent successfully to multiple providers
- [ ] Booking confirmation emails delivered and render correctly
- [ ] Password reset emails delivered and links work
- [ ] Notification emails delivered
- [ ] Email templates render correctly in major email clients
- [ ] Email service quota/limits configured and monitored
- [ ] Email bounce handling configured and tested
- [ ] Spam folder issues checked (test with Mail-Tester)
- [ ] Domain authentication (SPF/DKIM/DMARC) configured
- [ ] Unsubscribe links included in all emails
- [ ] Email monitoring dashboard accessible
- [ ] Alerting configured for high bounce rates
- [ ] Alerting configured for quota limits

## Additional Resources

- [GoDaddy Workspace Email Help](https://www.godaddy.com/help)
- [CAN-SPAM Act Compliance](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)
- [Email Deliverability Best Practices](https://www.mailgun.com/blog/email-deliverability-best-practices/)
- [Mail-Tester](https://www.mail-tester.com/) - Test email deliverability

