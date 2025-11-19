# Deployment Guide

**Last Updated:** 2025-01-27  
**Framework:** Next.js 16.0.3  
**Platform:** Vercel (recommended) or self-hosted

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Deployment to Vercel](#deployment-to-vercel)
5. [Self-Hosted Deployment](#self-hosted-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Stripe account (for payments)
- Email service account (SendGrid, Resend, etc.)
- Domain name (optional but recommended)

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Required Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Optional Variables

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
EMAIL_SERVICE_API_KEY=your-email-api-key
EMAIL_FROM=noreply@your-domain.com

# Root Admin
ROOT_ADMIN_OTP_SECRET=your-secret-otp-key

# WhatsApp Integration
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_PHONE_NUMBER=+1234567890

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Multi-tenant
ENABLE_MULTI_TENANT=true
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Database Setup

### 1. Run Database Migrations

All database migrations are in the `scripts/` directory. Run them in order:

```bash
# Run all migrations
npm run db:migrate

# Or run individual migration files
npm run db:run-sql scripts/01_create_tables.sql
npm run db:run-sql scripts/02_create_rls_policies.sql
# ... continue for all migration files
```

### 2. Verify Database Connection

```bash
npm run verify:supabase
```

This will verify:
- Environment variables are set
- Database connection works
- Required tables exist
- RLS policies are configured

### 3. Seed Initial Data (Optional)

```bash
# Seed services, default users, etc.
npm run db:run-sql scripts/seed_data.sql
```

---

## Deployment to Vercel

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Project

```bash
vercel link
```

### Step 4: Configure Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Navigate to **Settings** → **Environment Variables**
3. Add all required environment variables
4. Set them for **Production**, **Preview**, and **Development** environments

Or use CLI:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... add all other variables
```

### Step 5: Deploy

```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### Step 6: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

---

## Self-Hosted Deployment

### Option 1: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t tsmartcleaning .
docker run -p 3000:3000 --env-file .env.local tsmartcleaning
```

### Option 2: PM2 Deployment

1. Build the application:

```bash
npm run build
```

2. Install PM2:

```bash
npm install -g pm2
```

3. Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'tsmartcleaning',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

4. Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Systemd Service

Create `/etc/systemd/system/tsmartcleaning.service`:

```ini
[Unit]
Description=TSmartCleaning Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/tsmartcleaning
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable tsmartcleaning
sudo systemctl start tsmartcleaning
```

---

## Post-Deployment

### 1. Verify Deployment

Check that the application is running:

```bash
curl https://your-domain.com/api/verify-supabase
```

### 2. Configure Webhooks

#### Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### Other Webhooks

Configure webhooks for:
- Email service (delivery status)
- WhatsApp (message status)
- Third-party integrations

### 3. Set Up Cron Jobs

For scheduled tasks, set up cron jobs or use Vercel Cron:

**Vercel Cron (recommended):**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/bookings/reminders/send",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/payouts/scheduler/run",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/reports/process-scheduled",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Self-Hosted Cron:**

```bash
# Add to crontab
0 9 * * * curl https://your-domain.com/api/bookings/reminders/send
0 0 * * 1 curl https://your-domain.com/api/payouts/scheduler/run
0 0 * * * curl https://your-domain.com/api/reports/process-scheduled
```

### 4. Configure CDN (Optional)

For better performance:

1. Set up Cloudflare or similar CDN
2. Configure caching rules
3. Enable image optimization
4. Set up edge caching for static assets

### 5. Set Up Monitoring

#### Error Tracking

1. Set up [Sentry](https://sentry.io)
2. Add `SENTRY_DSN` to environment variables
3. Configure error alerts

#### Analytics

1. Set up Google Analytics or similar
2. Add tracking ID to `NEXT_PUBLIC_ANALYTICS_ID`
3. Verify tracking is working

#### Uptime Monitoring

Set up uptime monitoring with:
- UptimeRobot
- Pingdom
- StatusCake

### 6. SSL Certificate

Vercel automatically provisions SSL certificates. For self-hosted:

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com
```

---

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error: Environment variables missing**
- Verify all required variables are set in deployment platform
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding variables

### Runtime Errors

**Error: Database connection failed**
- Verify Supabase credentials are correct
- Check Supabase project is active (not paused)
- Verify network connectivity

**Error: 500 Internal Server Error**
- Check application logs
- Verify all environment variables are set
- Check database migrations are applied
- Review error tracking (Sentry)

### Performance Issues

**Slow page loads**
- Enable Next.js image optimization
- Configure CDN caching
- Optimize database queries
- Enable compression

**High memory usage**
- Increase server resources
- Optimize bundle size
- Enable code splitting
- Review memory leaks

### Common Issues

**Issue: Webhooks not working**
- Verify webhook URL is accessible
- Check webhook secret matches
- Review webhook logs in provider dashboard

**Issue: Emails not sending**
- Verify email service API key
- Check email service quota
- Review email service logs
- Verify `EMAIL_FROM` address is authorized

**Issue: Payments failing**
- Verify Stripe keys are correct
- Check Stripe account status
- Review Stripe webhook logs
- Verify webhook endpoint is accessible

---

## Security Checklist

Before going to production:

- [ ] All environment variables are set and secure
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- [ ] Stripe keys are production keys (not test keys)
- [ ] SSL certificate is configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (React escapes by default)
- [ ] CSRF protection (Next.js built-in)
- [ ] Authentication is required for protected routes
- [ ] Row Level Security (RLS) is enabled in Supabase
- [ ] Regular security updates are scheduled
- [ ] Error messages don't expose sensitive information
- [ ] Logs don't contain sensitive data

---

## Backup Strategy

### Database Backups

Supabase provides automatic backups. For additional safety:

1. Set up daily automated backups
2. Store backups in multiple locations
3. Test backup restoration regularly

### Application Backups

1. Version control (Git) for code
2. Environment variable backups (encrypted)
3. Configuration file backups

---

## Scaling

### Horizontal Scaling

- Use load balancer for multiple instances
- Configure session storage (Redis)
- Use database connection pooling

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis, Memcached)

### Database Scaling

- Enable Supabase connection pooling
- Use read replicas for read-heavy workloads
- Optimize queries and indexes

---

## Maintenance

### Regular Tasks

- **Weekly:** Review error logs and fix issues
- **Monthly:** Update dependencies
- **Quarterly:** Security audit
- **Annually:** Review and update infrastructure

### Updates

```bash
# Update dependencies
npm update

# Update Next.js
npm install next@latest

# Test updates in staging first
npm run test
npm run build
```

---

## Support

For deployment issues:

1. Check application logs
2. Review error tracking (Sentry)
3. Check deployment platform status
4. Review this documentation
5. Contact support team

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

