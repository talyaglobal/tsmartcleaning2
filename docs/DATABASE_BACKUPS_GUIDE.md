# Database Backups Guide

This guide covers database backup configuration, verification, and restoration procedures for Supabase.

## Overview

Supabase provides automated database backups for all projects. This guide helps you:
- Verify backup configuration
- Understand backup retention policies
- Test backup restoration
- Monitor backup status

## Supabase Backup Features

### Automatic Backups

Supabase automatically creates backups for all projects:
- **Free Tier**: Daily backups, 7-day retention
- **Pro Tier**: Daily backups, 7-day retention (can be extended)
- **Team/Enterprise**: Custom backup schedules and retention

### Backup Types

1. **Point-in-Time Recovery (PITR)**: Available on Pro tier and above
2. **Daily Backups**: Full database snapshots
3. **Manual Backups**: On-demand backups you can create

## Verifying Backup Configuration

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Project Settings > Database > Backups**

### Step 2: Check Backup Status

In the Backups section, verify:

- ✅ **Backups Enabled**: Should show "Enabled" or "Active"
- ✅ **Last Backup**: Check the timestamp of the most recent backup
- ✅ **Backup Frequency**: Should show daily backups
- ✅ **Retention Period**: Should show retention period (e.g., "7 days")

### Step 3: Review Backup History

Check the backup history table:
- Verify backups are being created regularly
- Check backup sizes (should be reasonable for your database size)
- Verify no failed backups

### Expected Backup Schedule

- **Daily backups**: Created automatically every 24 hours
- **Backup time**: Usually during low-traffic hours (varies by region)
- **Backup retention**: 7 days by default (Pro tier can extend)

## Backup Retention Policy

### Default Retention

- **Free Tier**: 7 days
- **Pro Tier**: 7 days (can be extended to 30 days)
- **Team/Enterprise**: Custom retention (up to 365 days)

### Verifying Retention Policy

1. Go to **Project Settings > Database > Backups**
2. Check the "Retention Period" setting
3. Verify it matches your requirements

### Recommended Retention

- **Development**: 7 days (default)
- **Production**: 30 days minimum
- **Critical Production**: 90-365 days

## Testing Backup Restoration

### Prerequisites

⚠️ **Warning**: Restoring a backup will overwrite your current database. Only test on a development/staging environment.

### Method 1: Restore via Supabase Dashboard

1. Go to **Project Settings > Database > Backups**
2. Find the backup you want to restore
3. Click "Restore" or "Restore to Point in Time"
4. Confirm the restoration
5. Wait for restoration to complete (can take several minutes to hours)

### Method 2: Restore via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# List available backups
supabase db backups list

# Restore from a specific backup
supabase db restore --backup-id backup-id
```

### Method 3: Point-in-Time Recovery (PITR)

For Pro tier and above:

1. Go to **Project Settings > Database > Backups**
2. Click "Point-in-Time Recovery"
3. Select the date and time to restore to
4. Confirm restoration

### Testing Restoration Procedure

**Recommended Testing Schedule**: Test restoration quarterly or before major deployments.

1. **Create Test Environment**:
   - Create a new Supabase project for testing
   - Or use a staging environment

2. **Select Test Backup**:
   - Choose a backup from 1-2 days ago
   - Note the backup ID and timestamp

3. **Perform Restoration**:
   - Follow restoration steps above
   - Monitor restoration progress
   - Verify restoration completes successfully

4. **Verify Data Integrity**:
   ```sql
   -- Check table counts
   SELECT 
     schemaname,
     tablename,
     n_live_tup as row_count
   FROM pg_stat_user_tables
   ORDER BY n_live_tup DESC;
   
   -- Verify critical data
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM bookings;
   SELECT COUNT(*) FROM transactions;
   ```

5. **Test Application**:
   - Verify application connects to restored database
   - Test critical user flows
   - Verify data is accessible

6. **Document Results**:
   - Record restoration time
   - Note any issues encountered
   - Update runbook with lessons learned

## Monitoring Backup Status

### Automated Monitoring

Use the verification script to check backup status:

```bash
npm run verify:backups
```

This script checks:
- ✅ Backup configuration is enabled
- ✅ Recent backups exist
- ✅ Backup retention is configured
- ✅ No backup failures detected

### Manual Monitoring

1. **Weekly Review**:
   - Check Supabase dashboard for backup status
   - Verify backups are being created daily
   - Review backup sizes for anomalies

2. **Monthly Review**:
   - Test backup restoration (on staging)
   - Verify retention policy is appropriate
   - Review backup storage costs

3. **Alert Configuration**:
   - Set up alerts for backup failures (if available)
   - Monitor backup storage usage
   - Alert on backup size anomalies

## Backup Best Practices

### 1. Regular Verification

- ✅ Check backup status weekly
- ✅ Test restoration quarterly
- ✅ Review backup retention annually

### 2. Documentation

- ✅ Document backup schedule
- ✅ Document restoration procedures
- ✅ Keep backup retention policy documented

### 3. Monitoring

- ✅ Monitor backup creation success
- ✅ Track backup sizes
- ✅ Alert on backup failures

### 4. Testing

- ✅ Test restoration procedures regularly
- ✅ Verify data integrity after restoration
- ✅ Test on staging before production

## Troubleshooting

### Backups Not Being Created

1. **Check Project Status**:
   - Verify project is active
   - Check for any service interruptions

2. **Check Backup Settings**:
   - Verify backups are enabled
   - Check backup schedule configuration

3. **Contact Support**:
   - If backups are missing, contact Supabase support
   - Provide project ID and backup dates

### Backup Restoration Fails

1. **Check Backup Integrity**:
   - Verify backup file is not corrupted
   - Check backup size is reasonable

2. **Check Database Status**:
   - Ensure database is not in use
   - Verify sufficient storage space

3. **Retry Restoration**:
   - Try restoring from a different backup
   - Contact Supabase support if issue persists

### Backup Size Anomalies

1. **Investigate Growth**:
   - Check for data growth patterns
   - Review table sizes
   - Identify large tables

2. **Optimize Database**:
   - Archive old data
   - Clean up unused data
   - Optimize table structures

## Backup Verification Checklist

Use this checklist to verify your backup configuration:

- [ ] Backups are enabled in Supabase dashboard
- [ ] Recent backups exist (within last 24 hours)
- [ ] Backup retention policy is configured appropriately
- [ ] Backup restoration has been tested (on staging)
- [ ] Backup monitoring is set up
- [ ] Backup procedures are documented
- [ ] Team knows how to restore from backups
- [ ] Backup storage costs are monitored

## Next Steps

1. ✅ Verify backup configuration in Supabase dashboard
2. ✅ Test backup restoration on staging environment
3. ✅ Document backup procedures for your team
4. ✅ Set up backup monitoring and alerts
5. ✅ Schedule regular backup restoration tests

## Resources

- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Docs**: https://supabase.com/docs/guides/platform/backups
- **Supabase CLI**: https://supabase.com/docs/reference/cli

