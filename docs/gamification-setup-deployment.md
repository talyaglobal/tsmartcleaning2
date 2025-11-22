# Gamification System Setup & Deployment Guide

## Overview

This guide covers setting up and deploying the gamification system for TSmartCleaning. Follow these steps carefully to ensure a smooth deployment.

---

## Prerequisites

- PostgreSQL 14+ database
- Node.js 18+ runtime
- Access to Supabase project (or PostgreSQL database)
- Admin access to the application
- Backup of production database (for production deployments)

---

## Development Setup

### 1. Database Migration

Run the gamification system migration script:

```bash
# Using Supabase CLI
supabase db execute --file scripts/35_gamification_system.sql

# Or using psql directly
psql -U postgres -d your_database -f scripts/35_gamification_system.sql
```

**Verify Migration:**
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'gamification%' OR table_name LIKE 'user_badges' OR table_name LIKE 'challenge_participants';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'gamification%';
```

### 2. Initialize Badges

Run the badge initialization script:

```bash
npm run ts-node scripts/initialize-gamification-badges.ts
```

This creates default badges for companies and cleaners.

### 3. Initialize Levels

Levels are created automatically by the migration script. Verify they exist:

```sql
SELECT * FROM gamification_levels ORDER BY user_type, level_number;
```

### 4. Environment Variables

Ensure these environment variables are set:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=https://your-app.com
NODE_ENV=production
```

### 5. Test the Setup

```bash
# Run tests
npm test -- gamification

# Or manually test API endpoints
curl -X GET http://localhost:3000/api/gamification/points \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Staging Deployment

### 1. Pre-Deployment Checklist

- [ ] Database backup created
- [ ] Migration script tested on staging
- [ ] Badge initialization script tested
- [ ] API endpoints tested
- [ ] RLS policies verified
- [ ] Environment variables configured
- [ ] Monitoring alerts configured

### 2. Database Migration

```bash
# 1. Create backup
pg_dump -U postgres -d staging_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration
psql -U postgres -d staging_db -f scripts/35_gamification_system.sql

# 3. Initialize badges
npm run ts-node scripts/initialize-gamification-badges.ts

# 4. Verify
psql -U postgres -d staging_db -c "SELECT COUNT(*) FROM gamification_badges;"
```

### 3. Deploy Application

```bash
# Build application
npm run build

# Deploy to staging
# (Follow your deployment process - Vercel, AWS, etc.)
```

### 4. Post-Deployment Verification

1. **Test API Endpoints:**
   ```bash
   # Test points endpoint
   curl -X GET https://staging.yourapp.com/api/gamification/points \
     -H "Authorization: Bearer STAGING_TOKEN"
   
   # Test badges endpoint
   curl -X GET https://staging.yourapp.com/api/gamification/badges?user_type=company
   ```

2. **Test Admin Dashboard:**
   - Log in to admin dashboard
   - Navigate to Gamification section
   - Verify all features are accessible

3. **Test User Features:**
   - Create a test user
   - Award points manually
   - Verify points appear in user dashboard

### 5. Monitor for Errors

- Check application logs
- Monitor database performance
- Check for RLS policy violations
- Monitor API response times

---

## Production Deployment

### 1. Pre-Deployment Checklist

- [ ] Staging deployment successful
- [ ] All tests passing
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] Monitoring dashboards ready

### 2. Database Migration

**IMPORTANT**: Run during low-traffic period if possible.

```bash
# 1. Create full database backup
pg_dump -U postgres -d production_db > production_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup
pg_restore --list production_backup_*.sql | head -20

# 3. Run migration (with transaction)
psql -U postgres -d production_db << EOF
BEGIN;
\i scripts/35_gamification_system.sql
COMMIT;
EOF

# 4. Initialize badges
npm run ts-node scripts/initialize-gamification-badges.ts

# 5. Verify migration
psql -U postgres -d production_db -c "
SELECT 
  (SELECT COUNT(*) FROM gamification_points) as points_count,
  (SELECT COUNT(*) FROM gamification_badges) as badges_count,
  (SELECT COUNT(*) FROM gamification_levels) as levels_count;
"
```

### 3. Deploy Application

```bash
# Build for production
npm run build

# Deploy (follow your CI/CD process)
# Example for Vercel:
vercel --prod

# Or for manual deployment:
# Upload build files to your server
```

### 4. Post-Deployment Verification

1. **Health Checks:**
   ```bash
   # API health
   curl https://yourapp.com/api/health
   
   # Gamification endpoints
   curl https://yourapp.com/api/gamification/points \
     -H "Authorization: Bearer PROD_TOKEN"
   ```

2. **Functional Tests:**
   - Test point awarding
   - Test badge earning
   - Test leaderboard generation
   - Test challenge creation

3. **Performance Tests:**
   - Monitor API response times
   - Check database query performance
   - Monitor cache hit rates

### 5. Monitor Closely

For the first 24 hours, monitor:
- Error rates
- API response times
- Database query performance
- User-reported issues
- System resource usage

---

## Rollback Procedure

### If Migration Fails

```bash
# 1. Stop application (if needed)
# 2. Restore database from backup
pg_restore -U postgres -d production_db production_backup_*.sql

# 3. Revert application code
git revert <commit-hash>
npm run build
# Deploy reverted version
```

### If Application Issues Occur

1. **Immediate Actions:**
   - Check application logs
   - Check database logs
   - Verify environment variables
   - Check API endpoint status

2. **Disable Gamification (if needed):**
   ```sql
   -- Disable gamification features (if you have a feature flag)
   UPDATE feature_flags SET enabled = false WHERE name = 'gamification';
   ```

3. **Rollback Application:**
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

---

## Post-Deployment Tasks

### 1. Initialize Data

After deployment, you may need to:

1. **Backfill Points for Existing Users:**
   ```sql
   -- This would be a custom script based on your business logic
   -- Example: Award points for existing completed bookings
   ```

2. **Calculate Initial Levels:**
   ```sql
   -- Update levels for all existing users
   SELECT calculate_user_level(user_id, user_type, tenant_id)
   FROM gamification_points;
   ```

3. **Generate Initial Leaderboards:**
   ```sql
   -- Generate all-time leaderboards
   SELECT update_leaderboard('all_time', 'company', 'all_time', 100, NULL);
   SELECT update_leaderboard('all_time', 'cleaner', 'all_time', 100, NULL);
   ```

### 2. Configure Scheduled Jobs

Set up cron jobs or scheduled tasks for:

- **Leaderboard Refresh:**
  ```bash
  # Run every hour
  0 * * * * node scripts/refresh-leaderboards.js
  ```

- **Challenge Status Updates:**
  ```bash
  # Run every 15 minutes
  */15 * * * * node scripts/update-challenge-status.js
  ```

- **Level Recalculation:**
  ```bash
  # Run daily at 2 AM
  0 2 * * * node scripts/recalculate-levels.js
  ```

### 3. Set Up Monitoring

Configure monitoring for:

- **API Endpoints:**
  - Response times
  - Error rates
  - Request volumes

- **Database:**
  - Query performance
  - Table sizes
  - Index usage

- **Business Metrics:**
  - Points awarded per day
  - Badges earned per day
  - Challenge participation rates

### 4. Documentation

- Update internal documentation
- Notify team of new features
- Create user-facing documentation
- Update API documentation

---

## Troubleshooting

### Migration Fails

**Error: "relation already exists"**
- Tables may already exist from a previous migration attempt
- Check if tables exist: `\dt gamification*`
- Drop and recreate if needed (with caution)

**Error: "permission denied"**
- Ensure database user has CREATE TABLE permissions
- Check RLS policies are being created correctly

**Error: "function already exists"**
- Functions may already exist
- Use `CREATE OR REPLACE FUNCTION` in migration script

### API Endpoints Not Working

**401 Unauthorized:**
- Check authentication token
- Verify JWT secret is configured
- Check middleware authentication

**403 Forbidden:**
- Verify user has admin role
- Check RLS policies
- Verify tenant context

**500 Internal Server Error:**
- Check application logs
- Verify database connection
- Check environment variables

### Performance Issues

**Slow Leaderboard Queries:**
- Check indexes exist
- Consider adding caching
- Review query execution plans

**High Database Load:**
- Enable query logging
- Review slow queries
- Consider read replicas for analytics

---

## Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Review error logs
   - Check leaderboard refresh status
   - Monitor point distribution

2. **Monthly:**
   - Review and optimize slow queries
   - Clean up old challenge data
   - Review badge criteria effectiveness

3. **Quarterly:**
   - Review and update point values
   - Analyze user engagement metrics
   - Update badge and level configurations

### Database Maintenance

```sql
-- Analyze tables for query optimization
ANALYZE gamification_points;
ANALYZE gamification_points_transactions;
ANALYZE gamification_leaderboards;

-- Vacuum to reclaim space (during low-traffic periods)
VACUUM ANALYZE gamification_points_transactions;
```

---

## Support

For deployment issues:
- Check application logs
- Review database logs
- Contact development team
- Check monitoring dashboards

---

**Last Updated**: January 2025

