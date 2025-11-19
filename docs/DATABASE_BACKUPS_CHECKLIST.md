# Database & Backups Checklist - Quick Reference

This is a quick reference guide for completing the Database & Backups checklist items from `FINAL_MISSING_TODO.md`.

## Quick Start

### 1. Verify Database Connections ✅ (Already Complete)

```bash
# Run verification script
npm run verify:supabase

# Or check via API
curl http://localhost:3000/api/verify-supabase
```

**Status**: ✅ Already configured and verified

---

### 2. Verify Database Backups

#### Step 1: Run Backup Verification Script

```bash
npm run verify:backups
```

This verifies:
- ✅ Environment variables are set
- ✅ Database connection works
- ✅ Critical tables are accessible

#### Step 2: Manual Verification in Supabase Dashboard

1. Go to: https://app.supabase.com/project/_/settings/database/backups
2. Verify:
   - [ ] Backups are enabled
   - [ ] Recent backups exist (within last 24 hours)
   - [ ] Backup retention is configured (recommended: 30 days for production)
   - [ ] No backup failures in history

**Documentation**: See `docs/DATABASE_BACKUPS_GUIDE.md` for detailed instructions

#### Step 3: Test Backup Restoration (Staging Only!)

⚠️ **IMPORTANT**: Only test on staging environment

1. Follow restoration procedure in `docs/DATABASE_BACKUPS_GUIDE.md`
2. Verify data integrity after restoration
3. Document restoration time and any issues

---

### 3. Verify Database Performance ✅ (Already Configured)

```bash
# Check performance metrics via API (admin only)
curl http://localhost:3000/api/monitoring/database \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Or visit performance dashboard
# http://localhost:3000/admin/performance
```

**Status**: ✅ Monitoring infrastructure already configured

**Documentation**: 
- `docs/DATABASE_MONITORING.md` - Full monitoring guide
- `docs/MONITORING_CHECKLIST.md` section 6 - Performance metrics verification

---

### 4. Verify Connection Pooling ✅ (Already Configured)

```bash
# Check connection pool status
npm run monitor:supabase

# Or via API (admin only)
curl http://localhost:3000/api/monitoring/database \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Status**: ✅ Supabase manages connection pooling automatically

**Documentation**:
- `docs/DATABASE_MONITORING.md` - Connection pool configuration
- `docs/MONITORING_CHECKLIST.md` section 7 - Connection pool verification

---

### 5. Configure Database Monitoring Alerts

#### Step 1: Configure Supabase Dashboard Alerts

1. Go to: https://app.supabase.com/project/_/settings/monitoring
2. Set up alerts for:
   - [ ] High error rate (> 5%)
   - [ ] Connection pool exhaustion (> 80%)
   - [ ] Slow queries (> 10 in 5 minutes)
   - [ ] Database downtime

#### Step 2: Configure Sentry Alerts

1. Go to: https://talyaglobal.sentry.io/alerts/rules/
2. Create alerts for:
   - [ ] Database errors (category:database, level:error)
   - [ ] Slow queries (category:database, type:slow_query)
   - [ ] High error rate (> 5% in 5 minutes)

#### Step 3: Configure Notification Channels

- [ ] Email notifications configured
- [ ] Slack integration configured (optional)
- [ ] Webhook notifications configured (optional)

**Documentation**: See `docs/DATABASE_MONITORING_ALERTS.md` for complete setup guide

---

## Checklist Summary

### ✅ Already Complete

- [x] Database connections stable
- [x] Database performance monitoring configured
- [x] Connection pooling working correctly

### ⏳ Manual Verification Required

- [ ] Automated backups enabled in Supabase (check dashboard)
- [ ] Backup retention policy configured (verify in dashboard)
- [ ] Backup restoration tested (test on staging)
- [ ] Database monitoring alerts configured (set up in Supabase + Sentry)

---

## Quick Commands Reference

```bash
# Verify database connection
npm run verify:supabase

# Verify backups (checks database accessibility)
npm run verify:backups

# Monitor database health
npm run monitor:supabase

# Check monitoring configuration
npm run verify:monitoring
```

---

## Documentation Links

- **Backup Guide**: `docs/DATABASE_BACKUPS_GUIDE.md`
- **Monitoring Guide**: `docs/DATABASE_MONITORING.md`
- **Monitoring Alerts**: `docs/DATABASE_MONITORING_ALERTS.md`
- **Monitoring Checklist**: `docs/MONITORING_CHECKLIST.md`
- **Supabase Verification**: `SUPABASE_VERIFICATION.md`

---

## Next Steps

1. ✅ Run `npm run verify:backups` to verify database accessibility
2. ✅ Check Supabase dashboard for backup configuration
3. ✅ Configure monitoring alerts in Supabase and Sentry
4. ✅ Test backup restoration on staging environment
5. ✅ Document backup restoration procedures for your team

---

**Last Updated**: 2025-01-27

