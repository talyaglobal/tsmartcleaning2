# Operations Runbook

**Last Updated:** 2025-01-27  
**Purpose:** Common issues and their resolution procedures

---

## Table of Contents

1. [Application Issues](#application-issues)
2. [Database Issues](#database-issues)
3. [Payment Processing Issues](#payment-processing-issues)
4. [Email Delivery Issues](#email-delivery-issues)
5. [Authentication Issues](#authentication-issues)
6. [Performance Issues](#performance-issues)
7. [Deployment Issues](#deployment-issues)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## Application Issues

### Issue: Application Returns 500 Error

**Symptoms:**
- Users see "500 Internal Server Error"
- Error appears in Sentry dashboard
- Application logs show exceptions

**Diagnosis:**
1. Check Sentry dashboard for error details: https://talyaglobal.sentry.io/issues/
2. Review Vercel deployment logs
3. Check application logs in Sentry Discover

**Resolution:**
1. **Identify the error:**
   ```bash
   # Check Sentry for recent errors
   # Filter by: level:error AND time:>1h
   ```

2. **Common causes:**
   - Missing environment variables
   - Database connection failures
   - Third-party API failures
   - Code errors in recent deployment

3. **Quick fixes:**
   - **Missing env vars**: Add to Vercel Dashboard → Settings → Environment Variables
   - **Database issues**: Check Supabase dashboard for connection status
   - **Code errors**: Rollback to previous deployment (see `DEPLOYMENT_ROLLBACK.md`)

4. **Verify fix:**
   ```bash
   curl https://your-domain.com/api/health
   ```

**Prevention:**
- Run tests before deployment: `npm run test:all`
- Test in staging environment first
- Monitor Sentry alerts

---

### Issue: Application Not Loading / Blank Page

**Symptoms:**
- Browser shows blank page
- Console shows JavaScript errors
- Network tab shows failed requests

**Diagnosis:**
1. Open browser DevTools → Console
2. Check for JavaScript errors
3. Check Network tab for failed requests
4. Verify CDN/static assets are loading

**Resolution:**
1. **Check build status:**
   - Go to Vercel Dashboard → Deployments
   - Verify latest deployment succeeded

2. **Clear CDN cache:**
   - Vercel: Automatic cache invalidation on deploy
   - Cloudflare: Purge cache if using Cloudflare

3. **Check static assets:**
   ```bash
   # Verify static files are accessible
   curl https://your-domain.com/_next/static/chunks/main.js
   ```

4. **Common fixes:**
   - **Build failed**: Check build logs, fix errors, redeploy
   - **CDN issue**: Wait for cache propagation or purge cache
   - **Environment variables**: Verify `NEXT_PUBLIC_*` vars are set

**Prevention:**
- Test builds locally: `npm run build`
- Monitor build success rate
- Set up build failure alerts

---

### Issue: API Endpoints Returning 404

**Symptoms:**
- API routes return 404 Not Found
- Frontend cannot fetch data
- Error: "Route not found"

**Diagnosis:**
1. Verify route exists in `app/api/` directory
2. Check route file naming (must be `route.ts` or `route.js`)
3. Verify HTTP method matches (GET, POST, etc.)

**Resolution:**
1. **Check route structure:**
   ```bash
   # Verify route file exists
   ls -la app/api/your-route/route.ts
   ```

2. **Verify route export:**
   ```typescript
   // Must export named functions: GET, POST, PUT, DELETE
   export async function GET(request: Request) { ... }
   ```

3. **Check middleware:**
   - Verify route is not blocked by `middleware.ts`
   - Check route matcher configuration

4. **Redeploy:**
   ```bash
   # If route was recently added, redeploy
   vercel --prod
   ```

**Prevention:**
- Test API routes locally: `npm run dev`
- Use TypeScript for route type safety
- Document all API routes

---

## Database Issues

### Issue: Database Connection Failed

**Symptoms:**
- Error: "Failed to connect to database"
- Error: "Connection pool exhausted"
- API endpoints timing out

**Diagnosis:**
1. Check Supabase dashboard → Project Settings → Database
2. Verify connection pool status
3. Check for connection errors in logs

**Resolution:**
1. **Verify credentials:**
   ```bash
   # Test connection
   npm run verify:supabase
   ```

2. **Check Supabase status:**
   - Visit https://status.supabase.com
   - Check project status in Supabase dashboard

3. **Connection pool issues:**
   - **Increase pool size** in Supabase dashboard
   - **Close idle connections** (restart application)
   - **Check for connection leaks** (unclosed connections)

4. **Environment variables:**
   ```bash
   # Verify these are set correctly
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

5. **Restart application:**
   - Vercel: Redeploy to restart
   - Self-hosted: Restart service

**Prevention:**
- Monitor connection pool usage
- Use connection pooling
- Set up alerts for connection failures

---

### Issue: Slow Database Queries

**Symptoms:**
- API responses are slow (> 1 second)
- Database queries timing out
- High database CPU usage

**Diagnosis:**
1. Check Supabase dashboard → Database → Query Performance
2. Identify slow queries
3. Check for missing indexes

**Resolution:**
1. **Identify slow queries:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Add indexes:**
   ```sql
   -- Example: Add index on frequently queried column
   CREATE INDEX idx_users_email ON users(email);
   ```

3. **Optimize queries:**
   - Use `.select()` to limit columns
   - Add `.limit()` to paginate results
   - Use `.eq()` instead of `.filter()` when possible

4. **Check RLS policies:**
   - Complex RLS policies can slow queries
   - Review and optimize policies

**Prevention:**
- Add indexes on foreign keys and frequently queried columns
- Monitor query performance regularly
- Use database query monitoring

---

### Issue: Data Not Appearing / Missing Data

**Symptoms:**
- Users report missing data
- Queries return empty results
- Data exists in database but not in UI

**Diagnosis:**
1. Verify data exists in Supabase dashboard
2. Check RLS policies (may be blocking access)
3. Verify user permissions

**Resolution:**
1. **Check RLS policies:**
   ```sql
   -- Verify RLS is enabled and policies exist
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Test with service role:**
   ```typescript
   // Use service role to bypass RLS for testing
   const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
   ```

3. **Check user context:**
   - Verify user is authenticated
   - Check user role/permissions
   - Verify tenant context (for multi-tenant)

4. **Review recent migrations:**
   - Check if migration changed table structure
   - Verify migration didn't delete data

**Prevention:**
- Test RLS policies after migrations
- Monitor data access patterns
- Set up alerts for data integrity issues

---

## Payment Processing Issues

### Issue: Payments Not Processing

**Symptoms:**
- Payment form submits but no charge
- Stripe webhook not received
- Payment status stuck in "pending"

**Diagnosis:**
1. Check Stripe dashboard → Payments
2. Check webhook logs in Stripe
3. Review application logs for payment errors

**Resolution:**
1. **Verify Stripe keys:**
   ```bash
   # Check environment variables
   echo $STRIPE_SECRET_KEY
   echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   ```

2. **Check webhook configuration:**
   - Stripe Dashboard → Webhooks
   - Verify endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Check webhook secret matches `STRIPE_WEBHOOK_SECRET`

3. **Test webhook:**
   ```bash
   # Use Stripe CLI to test webhook locally
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Check payment logs:**
   - Review Sentry for payment errors
   - Check Stripe dashboard for failed payments
   - Verify payment intent creation

5. **Common fixes:**
   - **Wrong Stripe keys**: Use production keys in production
   - **Webhook not configured**: Set up webhook in Stripe dashboard
   - **Webhook secret mismatch**: Update `STRIPE_WEBHOOK_SECRET`

**Prevention:**
- Test payments in test mode before production
- Monitor Stripe webhook delivery
- Set up alerts for payment failures

---

### Issue: Refunds Not Processing

**Symptoms:**
- Refund request submitted but not processed
- Refund status stuck
- Customer not receiving refund

**Diagnosis:**
1. Check Stripe dashboard → Refunds
2. Review refund API logs
3. Check for refund errors in Sentry

**Resolution:**
1. **Check refund status in Stripe:**
   - Stripe Dashboard → Payments → [Payment] → Refunds
   - Verify refund was created

2. **Review refund code:**
   ```typescript
   // Verify refund API endpoint is working
   // Check app/api/payments/refund/route.ts
   ```

3. **Manual refund (if needed):**
   - Stripe Dashboard → Create refund manually
   - Update database to reflect refund status

4. **Verify webhook:**
   - Check if `charge.refunded` webhook is received
   - Verify webhook handler updates database

**Prevention:**
- Test refund flow before production
- Monitor refund processing
- Set up alerts for refund failures

---

## Email Delivery Issues

### Issue: Emails Not Sending

**Symptoms:**
- Users not receiving emails
- Email service errors in logs
- Email queue stuck

**Diagnosis:**
1. Check email service dashboard (SendGrid/Resend)
2. Review email service logs
3. Check application logs for email errors

**Resolution:**
1. **Verify email service credentials:**
   ```bash
   # Check environment variables
   echo $EMAIL_SERVICE_API_KEY
   echo $EMAIL_FROM
   ```

2. **Check email service status:**
   - SendGrid: https://status.sendgrid.com
   - Resend: https://status.resend.com

3. **Test email sending:**
   ```bash
   # Use email service API to send test email
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer $EMAIL_SERVICE_API_KEY" \
     -d '{"from":"noreply@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

4. **Check email service quota:**
   - Verify not exceeding daily/monthly limits
   - Check account status (not suspended)

5. **Common fixes:**
   - **API key invalid**: Regenerate API key
   - **Domain not verified**: Verify sending domain
   - **Quota exceeded**: Upgrade plan or wait for reset

**Prevention:**
- Monitor email delivery rates
- Set up alerts for email failures
- Verify domain before production

---

### Issue: Emails Going to Spam

**Symptoms:**
- Emails delivered but in spam folder
- Low email deliverability rate
- SPF/DKIM failures

**Diagnosis:**
1. Check email service → Domain Authentication
2. Verify SPF, DKIM, DMARC records
3. Check email content (avoid spam triggers)

**Resolution:**
1. **Verify domain authentication:**
   - Email service dashboard → Domain Settings
   - Verify SPF, DKIM, DMARC records are set

2. **Check DNS records:**
   ```bash
   # Check SPF record
   dig TXT yourdomain.com | grep spf
   
   # Check DKIM record
   dig TXT default._domainkey.yourdomain.com
   ```

3. **Improve email content:**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper HTML structure

4. **Warm up domain:**
   - Start with low volume
   - Gradually increase sending volume
   - Monitor deliverability rates

**Prevention:**
- Set up domain authentication before production
- Monitor email deliverability
- Follow email best practices

---

## Authentication Issues

### Issue: Users Cannot Login

**Symptoms:**
- Login form not working
- "Invalid credentials" error
- Session not created

**Diagnosis:**
1. Check authentication logs in Sentry
2. Verify Supabase Auth is working
3. Check user exists in database

**Resolution:**
1. **Verify Supabase Auth:**
   ```bash
   # Test Supabase connection
   npm run verify:supabase
   ```

2. **Check user in database:**
   ```sql
   -- Verify user exists
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

3. **Check authentication flow:**
   - Verify login API endpoint: `/api/auth/login`
   - Check session creation
   - Verify cookie settings

4. **Common fixes:**
   - **Supabase Auth disabled**: Enable in Supabase dashboard
   - **Email not verified**: Check email verification status
   - **Account disabled**: Check `is_active` flag

**Prevention:**
- Test authentication flow regularly
- Monitor authentication errors
- Set up alerts for auth failures

---

### Issue: Sessions Expiring Too Quickly

**Symptoms:**
- Users logged out unexpectedly
- Session expires after short time
- "Session expired" errors

**Diagnosis:**
1. Check session configuration
2. Review cookie expiration settings
3. Check Supabase session settings

**Resolution:**
1. **Check session configuration:**
   ```typescript
   // Verify session cookie maxAge
   // Check middleware.ts or auth configuration
   ```

2. **Supabase session settings:**
   - Supabase Dashboard → Authentication → Settings
   - Check JWT expiration time
   - Verify refresh token settings

3. **Cookie settings:**
   - Verify `maxAge` is appropriate
   - Check `sameSite` and `secure` flags
   - Ensure cookies are not being cleared

**Prevention:**
- Set appropriate session duration
- Use refresh tokens for long sessions
- Monitor session expiration patterns

---

## Performance Issues

### Issue: Slow Page Loads

**Symptoms:**
- Pages take > 3 seconds to load
- Poor Lighthouse scores
- High Time to First Byte (TTFB)

**Diagnosis:**
1. Run Lighthouse audit: `npm run perf:lighthouse`
2. Check Core Web Vitals
3. Review Vercel Analytics

**Resolution:**
1. **Optimize images:**
   - Use Next.js Image component
   - Enable image optimization
   - Use WebP/AVIF formats

2. **Enable caching:**
   - Configure CDN caching
   - Set appropriate cache headers
   - Use static generation where possible

3. **Optimize bundle size:**
   ```bash
   # Analyze bundle
   npm run perf:bundle-size
   ```

4. **Database optimization:**
   - Add indexes
   - Optimize queries
   - Use connection pooling

5. **Code splitting:**
   - Use dynamic imports
   - Lazy load components
   - Split vendor bundles

**Prevention:**
- Monitor Core Web Vitals
- Regular performance audits
- Optimize before deployment

---

### Issue: High Memory Usage

**Symptoms:**
- Application crashes
- "Out of memory" errors
- Slow response times

**Diagnosis:**
1. Check Vercel Analytics → Memory usage
2. Review application logs for memory warnings
3. Check for memory leaks

**Resolution:**
1. **Identify memory leaks:**
   - Review recent code changes
   - Check for unclosed connections
   - Look for event listener leaks

2. **Optimize memory usage:**
   - Remove unused dependencies
   - Optimize data structures
   - Use streaming for large data

3. **Increase resources:**
   - Upgrade Vercel plan
   - Increase server memory
   - Use multiple instances

**Prevention:**
- Monitor memory usage
- Regular code reviews
- Use memory profiling tools

---

## Deployment Issues

### Issue: Deployment Fails

**Symptoms:**
- Build fails in Vercel
- TypeScript errors
- Missing dependencies

**Diagnosis:**
1. Check Vercel deployment logs
2. Review build errors
3. Check for missing environment variables

**Resolution:**
1. **Check build logs:**
   - Vercel Dashboard → Deployments → [Failed Deployment] → Build Logs
   - Identify first error

2. **Common fixes:**
   - **TypeScript errors**: Fix type errors, run `npx tsc --noEmit`
   - **Missing dependencies**: Run `npm install`, check `package.json`
   - **Environment variables**: Add missing vars in Vercel dashboard
   - **Build timeout**: Optimize build, increase timeout

3. **Test locally:**
   ```bash
   # Test build locally
   npm run build
   ```

**Prevention:**
- Test builds before pushing
- Use CI/CD for automated testing
- Monitor build success rate

---

### Issue: Deployment Succeeds But App Not Working

**Symptoms:**
- Deployment shows "Ready"
- Application returns errors
- Features not working

**Diagnosis:**
1. Check runtime logs in Vercel
2. Verify environment variables are set
3. Check for runtime errors

**Resolution:**
1. **Check runtime logs:**
   - Vercel Dashboard → Deployments → [Deployment] → Runtime Logs
   - Look for errors or warnings

2. **Verify environment variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure all required vars are set for production

3. **Check application health:**
   ```bash
   curl https://your-domain.com/api/health
   ```

4. **Rollback if needed:**
   - See `DEPLOYMENT_ROLLBACK.md` for rollback procedure

**Prevention:**
- Test in staging first
- Verify environment variables
- Monitor post-deployment

---

## Monitoring & Alerts

### Setting Up Alerts

**Sentry Alerts:**
1. Go to Sentry → Alerts → Create Alert Rule
2. Set conditions (error rate, specific errors, etc.)
3. Configure notification channels (email, Slack, PagerDuty)

**Recommended Alerts:**
- Critical errors (> 0)
- Payment failures
- Authentication failures (> 5/min)
- Database connection failures
- High error rate (> 5% for 5 minutes)

**Vercel Alerts:**
1. Vercel Dashboard → Settings → Notifications
2. Configure alerts for:
   - Deployment failures
   - Build failures
   - Function errors

**Uptime Monitoring:**
- Set up UptimeRobot/Pingdom
- Monitor critical endpoints
- Alert on downtime

---

## Emergency Contacts

See `ON_CALL_CONTACTS.md` for emergency contact information.

---

## Related Documentation

- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `DEPLOYMENT_ROLLBACK.md` - Rollback procedures
- `INCIDENT_RESPONSE.md` - Incident response procedures
- `LOGGING_AND_MONITORING.md` - Logging and monitoring setup

