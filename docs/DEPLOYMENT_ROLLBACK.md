# Deployment Rollback Strategy

**Last Updated:** 2025-01-15  
**Purpose:** Procedures for rolling back deployments in case of issues

## Overview

Our deployment strategy uses Vercel for hosting, which provides built-in rollback capabilities. This guide covers both automated and manual rollback procedures.

## Rollback Methods

### 1. Vercel Dashboard Rollback (Recommended)

**When to use:** Immediate rollback needed for production issues

**Steps:**
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to the **Deployments** tab
4. Find the previous working deployment
5. Click the **"..."** menu next to the deployment
6. Select **"Promote to Production"**
7. Confirm the rollback

**Time to rollback:** ~30 seconds

### 2. Git-Based Rollback

**When to use:** Need to revert code changes and redeploy

**Steps:**
1. Identify the last known good commit:
   ```bash
   git log --oneline -10
   ```
2. Create a revert commit or reset to the good commit:
   ```bash
   git revert <bad-commit-hash>
   # OR
   git reset --hard <good-commit-hash>
   git push --force-with-lease origin main
   ```
3. Vercel will automatically deploy the reverted version

**Time to rollback:** ~2-5 minutes (depending on build time)

### 3. Environment Variable Rollback

**When to use:** Issue is caused by incorrect environment variables

**Steps:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Review recent changes
3. Revert to previous values or remove problematic variables
4. Redeploy the current version:
   ```bash
   vercel --prod
   ```

**Time to rollback:** ~1-2 minutes

### 4. Security Incident Rollback

**When to use:** Security vulnerability discovered in production, RLS policies disabled, or authentication bypass detected

**Steps:**
1. **Immediate containment:**
   ```bash
   # If authentication is compromised, immediately redeploy last known secure version
   vercel --prod --yes
   ```

2. **Database security rollback:**
   ```sql
   -- Re-enable RLS if disabled
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
   
   -- Verify critical policies exist
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('users', 'bookings', 'provider_profiles');
   ```

3. **Verify authentication middleware:**
   ```bash
   # Check that admin routes are protected
   grep -r "withAuth\|requireAdmin" app/api/admin/
   ```

4. **Invalidate compromised sessions:**
   ```sql
   -- Force logout all users if needed (extreme measure)
   DELETE FROM auth.sessions WHERE updated_at < NOW() - INTERVAL '5 minutes';
   ```

**Time to rollback:** ~1-3 minutes (critical for security)

### 5. Multi-Tenant Data Isolation Rollback

**When to use:** Cross-tenant data leakage detected or tenant isolation failure

**Steps:**
1. **Verify tenant isolation:**
   ```bash
   npm run verify:tenant-isolation
   ```

2. **Check tenant context resolution:**
   ```typescript
   // Ensure all API routes properly resolve tenant
   // Check lib/supabase.ts resolveTenantFromRequest function
   ```

3. **Validate RLS policies for multi-tenancy:**
   ```sql
   -- Ensure all policies include tenant checks
   SELECT schemaname, tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE qual LIKE '%tenant%' OR qual LIKE '%company%';
   ```

4. **Emergency tenant data audit:**
   ```bash
   npm run audit:tenant-data-access
   ```

**Time to rollback:** ~2-5 minutes (includes data verification)

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass (`npm run test:all`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Environment variables are set correctly
- [ ] Database migrations are tested
- [ ] Feature flags are configured appropriately

## Post-Deployment Verification

After deployment, verify:

1. **Health Check:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Critical Pages:**
   - Homepage loads
   - Login/Signup works
   - Key API endpoints respond

3. **Monitoring:**
   - Check Sentry for errors
   - Monitor Vercel Analytics
   - Review application logs

## Rollback Decision Matrix

| Issue Type | Severity | Rollback Method | Time |
|------------|----------|----------------|------|
| Site down | Critical | Vercel Dashboard | 30s |
| Security vulnerability | Critical | Security rollback + containment | 1-3min |
| Data corruption | Critical | Git revert + redeploy | 5min |
| Cross-tenant data leakage | Critical | Multi-tenant rollback | 2-5min |
| Authentication bypass | Critical | Security rollback | 1-3min |
| Performance degradation | High | Vercel Dashboard | 30s |
| RLS policies disabled | High | Database security rollback | 2min |
| Feature broken | Medium | Git revert | 5min |
| Minor UI issue | Low | Hotfix PR | 15min |

## Automated Rollback Triggers

Consider setting up automated rollbacks for:

1. **Error Rate Threshold:** If error rate exceeds 5% for 5 minutes
2. **Response Time:** If p95 response time exceeds 2 seconds
3. **Health Check Failures:** If health check fails 3 times in a row

### Setting Up Automated Rollbacks

1. Configure Vercel Monitoring
2. Set up alerts in Sentry
3. Use Vercel's deployment protection rules

## Database Rollback

If database migrations are involved:

1. **Identify the migration:**
   ```bash
   # Check migration history
   npm run db:migrate -- --status
   ```

2. **Rollback migration:**
   ```sql
   -- Manually reverse the migration SQL
   -- Or use migration tool if available
   ```

3. **Verify data integrity:**
   ```bash
   npm run verify:supabase
   ```

## Communication Plan

When rolling back:

1. **Notify team immediately** via Slack/email
2. **Document the issue** in incident log
3. **Create a post-mortem** if critical
4. **Update stakeholders** if customer-facing

## Prevention Strategies

1. **Staging Environment:** Always test in staging first
2. **Feature Flags:** Use feature flags for risky changes
3. **Gradual Rollouts:** Use Vercel's gradual rollout feature
4. **Database Backups:** Regular backups before migrations
5. **Monitoring:** Set up comprehensive monitoring

## Emergency Contacts

- **DevOps Lead:** [Contact Info]
- **On-Call Engineer:** [Contact Info]
- **Project Manager:** [Contact Info]

## Rollback Log Template

When performing a rollback, document:

```
Date: [Date/Time]
Rolled back from: [Deployment ID/Commit]
Rolled back to: [Deployment ID/Commit]
Reason: [Brief description]
Impact: [Users affected, downtime, etc.]
Resolution: [How issue was resolved]
Follow-up: [Actions needed]
```

## Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Vercel Rollback Guide](https://vercel.com/docs/deployments/rollback)
- [Git Revert Guide](https://git-scm.com/docs/git-revert)

