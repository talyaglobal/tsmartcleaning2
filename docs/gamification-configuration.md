# Gamification System Configuration

## Overview

This document describes all configuration options for the gamification system, including point values, badge criteria, level thresholds, and system settings.

---

## Point Values Configuration

### Default Point Values

Point values are defined in `lib/gamification/utils.ts`. To modify:

**For Cleaning Companies:**
```typescript
const COMPANY_POINT_VALUES = {
  post_job: 10,
  complete_job: 50,
  rate_cleaner: 5,
  refer_company: 500,
  complete_profile: 25,
  upload_logo: 15,
  first_job_bonus: 100,
  milestone_10_jobs: 250,
}
```

**For Cleaners:**
```typescript
const CLEANER_POINT_VALUES = {
  complete_profile: 25,
  upload_photo: 15,
  complete_certification: 100,
  accept_job: 5,
  complete_job: 50,
  receive_5_star_rating: 25,
  refer_cleaner: 200,
  first_job_bonus: 100,
  milestone_10_jobs: 250,
  milestone_50_jobs: 1000,
}
```

### Custom Point Values

To use custom point values for specific actions:

```typescript
// In API call
await awardPoints(supabase, {
  userId: 'user-id',
  userType: 'company',
  action: 'custom',
  customPoints: 150, // Custom point value
})
```

---

## Badge Configuration

### Default Badges

Badges are initialized via `scripts/initialize-gamification-badges.ts`. Default badges include:

**Company Badges:**
- `first_timer`: Post first job
- `quick_starter`: Complete first job within 24 hours
- `premium_partner`: Subscribe to Professional tier
- `top_employer`: Maintain 4.8+ rating
- `consistent_poster`: Post jobs for 4 consecutive weeks
- `elite_partner`: Complete 100+ jobs
- `referral_champion`: Refer 3+ companies
- `5_star_partner`: Receive 50+ 5-star ratings

**Cleaner Badges:**
- `new_star`: Complete first job
- `fast_responder`: Accept jobs within 1 hour
- `certified_pro`: Complete all certifications
- `top_performer`: Maintain 4.9+ rating
- `reliable_worker`: 95%+ job completion rate
- `elite_cleaner`: Complete 100+ jobs
- `community_builder`: Refer 5+ cleaners
- `perfect_record`: 100 consecutive 5-star ratings

### Creating Custom Badges

Via API:
```bash
POST /api/gamification/badges
{
  "code": "custom_badge",
  "name": "Custom Badge",
  "description": "Earned for custom achievement",
  "icon": "🎯",
  "userType": "company",
  "criteria": {
    "type": "points",
    "threshold": 1000
  },
  "pointsReward": 50
}
```

Via Database:
```sql
INSERT INTO gamification_badges (
  code, name, description, icon, badge_type, criteria, bonus_points
) VALUES (
  'custom_badge',
  'Custom Badge',
  'Description',
  '🎯',
  'company',
  '{"type": "points", "threshold": 1000}'::jsonb,
  50
);
```

---

## Level Configuration

### Default Levels

Levels are defined in the database. Default configuration:

**Company Levels:**
```sql
INSERT INTO gamification_levels (level_name, level_number, user_type, points_threshold) VALUES
  ('Bronze Partner', 1, 'company', 0),
  ('Silver Partner', 2, 'company', 500),
  ('Gold Partner', 3, 'company', 1500),
  ('Platinum Partner', 4, 'company', 4000),
  ('Diamond Partner', 5, 'company', 10000);
```

**Cleaner Levels:**
```sql
INSERT INTO gamification_levels (level_name, level_number, user_type, points_threshold) VALUES
  ('Beginner', 1, 'cleaner', 0),
  ('Intermediate', 2, 'cleaner', 300),
  ('Advanced', 3, 'cleaner', 1000),
  ('Expert', 4, 'cleaner', 3000),
  ('Master', 5, 'cleaner', 7500);
```

### Customizing Levels

To modify level thresholds:

```sql
UPDATE gamification_levels
SET points_threshold = 2000
WHERE level_number = 3 AND user_type = 'company';
```

To add new levels:

```sql
INSERT INTO gamification_levels (
  level_name, level_number, user_type, points_threshold, rewards
) VALUES (
  'Elite Partner', 6, 'company', 20000,
  '{"premium_features": true, "priority_support": true}'::jsonb
);
```

---

## Leaderboard Configuration

### Leaderboard Types

Available leaderboard types:
- `points`: Ranked by total points
- `jobs`: Ranked by jobs completed
- `ratings`: Ranked by average rating
- `referrals`: Ranked by referrals made

### Timeframes

- `daily`: Rankings for today
- `weekly`: Rankings for this week
- `monthly`: Rankings for this month
- `all_time`: All-time rankings

### Cache Configuration

Leaderboards are cached for performance. Configuration:

```typescript
// In lib/gamification/leaderboard-scheduler.ts
const LEADERBOARD_CACHE_TTL = 3600; // 1 hour in seconds
const LEADERBOARD_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
```

To change cache duration:

```typescript
// Update cache TTL
const LEADERBOARD_CACHE_TTL = 1800; // 30 minutes
```

### Refresh Schedule

Configure automatic refresh in `lib/gamification/leaderboard-scheduler.ts`:

```typescript
// Refresh schedule (cron format)
const REFRESH_SCHEDULE = {
  daily: '0 * * * *',      // Every hour
  weekly: '0 0 * * 0',     // Every Sunday at midnight
  monthly: '0 0 1 * *',   // First day of month at midnight
  all_time: '0 0 * * 0',   // Weekly refresh
}
```

---

## Challenge Configuration

### Challenge Types

Available challenge types:
- `booking_count`: Complete a number of bookings
- `rating_target`: Achieve a target rating
- `streak`: Maintain activity for consecutive days
- `custom`: Custom criteria (requires development)

### Challenge Statuses

- `draft`: Challenge created but not active
- `active`: Challenge is live and accepting participants
- `completed`: Challenge has ended
- `cancelled`: Challenge was cancelled

### Default Challenge Settings

```typescript
// In lib/gamification/challenges.ts
const DEFAULT_CHALLENGE_SETTINGS = {
  minDuration: 1,        // Minimum 1 day
  maxDuration: 90,      // Maximum 90 days
  maxActiveChallenges: 5, // Max 5 active challenges per user type
}
```

---

## System Settings

### Feature Flags

Control gamification features via environment variables:

```env
# Enable/disable gamification
GAMIFICATION_ENABLED=true

# Enable/disable specific features
GAMIFICATION_POINTS_ENABLED=true
GAMIFICATION_BADGES_ENABLED=true
GAMIFICATION_LEVELS_ENABLED=true
GAMIFICATION_LEADERBOARDS_ENABLED=true
GAMIFICATION_CHALLENGES_ENABLED=true
```

### Rate Limiting

Configure rate limits in API routes:

```typescript
// In app/api/gamification/*/route.ts
const RATE_LIMITS = {
  standard: 100,    // requests per minute
  admin: 200,       // requests per minute for admins
  leaderboard: 10,  // refresh requests per minute
}
```

### Pagination

Default pagination settings:

```typescript
const PAGINATION_DEFAULTS = {
  limit: 50,
  maxLimit: 100,
  offset: 0,
}
```

---

## Tenant-Specific Configuration

### Per-Tenant Point Values

To set different point values per tenant:

```sql
-- Create tenant-specific point configuration table (if needed)
CREATE TABLE IF NOT EXISTS tenant_point_config (
  tenant_id UUID REFERENCES tenants(id),
  action_type TEXT,
  points INTEGER,
  PRIMARY KEY (tenant_id, action_type)
);

-- Set custom point values for a tenant
INSERT INTO tenant_point_config (tenant_id, action_type, points) VALUES
  ('tenant-uuid', 'complete_job', 75); -- Higher points for this tenant
```

### Per-Tenant Badges

Badges can be tenant-specific:

```sql
-- Create badge with tenant_id
INSERT INTO gamification_badges (
  code, name, description, badge_type, tenant_id
) VALUES (
  'tenant_special', 'Tenant Special Badge', 'Description', 'company', 'tenant-uuid'
);
```

### Per-Tenant Levels

Levels can be tenant-specific:

```sql
-- Create level with tenant_id
INSERT INTO gamification_levels (
  level_name, level_number, user_type, points_threshold, tenant_id
) VALUES (
  'Custom Level', 1, 'company', 0, 'tenant-uuid'
);
```

---

## Integration Configuration

### Webhook Configuration

Configure webhooks for gamification events:

```env
# Webhook URLs
GAMIFICATION_WEBHOOK_URL=https://your-app.com/webhooks/gamification
GAMIFICATION_WEBHOOK_SECRET=your-webhook-secret
```

Events that trigger webhooks:
- `badge.earned`
- `level.up`
- `challenge.completed`
- `leaderboard.position_change`

### Email Notifications

Configure email notifications:

```env
# Email settings
GAMIFICATION_EMAIL_ENABLED=true
GAMIFICATION_EMAIL_FROM=noreply@tsmartcleaning.com
```

Notification types:
- Badge earned
- Level up
- Challenge completed
- Leaderboard position change

### Analytics Integration

Configure analytics tracking:

```env
# Analytics
GAMIFICATION_ANALYTICS_ENABLED=true
ANALYTICS_API_KEY=your-analytics-key
```

Tracked events:
- Points awarded
- Badges earned
- Levels achieved
- Challenge participation
- Leaderboard views

---

## Performance Configuration

### Caching

Configure caching for performance:

```typescript
// Redis cache configuration (if using Redis)
const CACHE_CONFIG = {
  enabled: true,
  ttl: 3600, // 1 hour
  prefix: 'gamification:',
}
```

### Database Connection Pool

Configure database connection pool:

```env
# Database pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
```

### Query Timeouts

Configure query timeouts:

```typescript
const QUERY_TIMEOUTS = {
  leaderboard: 5000,    // 5 seconds
  analytics: 10000,     // 10 seconds
  default: 3000,        // 3 seconds
}
```

---

## Security Configuration

### RBAC Configuration

Role-based access control:

```typescript
// In lib/auth/roles.ts
const GAMIFICATION_PERMISSIONS = {
  admin: ['*'], // Full access
  support: ['read:points', 'read:badges', 'read:leaderboards'],
  analyst: ['read:analytics', 'read:reports'],
}
```

### Data Validation

Configure validation rules:

```typescript
// In lib/api/validation.ts
const VALIDATION_RULES = {
  points: {
    min: 0,
    max: 10000,
  },
  badgeCode: {
    pattern: /^[a-z0-9_]+$/,
    minLength: 3,
    maxLength: 50,
  },
}
```

---

## Monitoring Configuration

### Logging

Configure logging levels:

```env
LOG_LEVEL=info
GAMIFICATION_LOG_LEVEL=debug
```

### Metrics

Configure metrics collection:

```env
METRICS_ENABLED=true
METRICS_ENDPOINT=/metrics
```

Tracked metrics:
- Points awarded per day
- Badges earned per day
- API response times
- Database query times
- Cache hit rates

---

## Environment-Specific Configuration

### Development

```env
GAMIFICATION_ENABLED=true
GAMIFICATION_DEBUG=true
CACHE_ENABLED=false
RATE_LIMITING_ENABLED=false
```

### Staging

```env
GAMIFICATION_ENABLED=true
GAMIFICATION_DEBUG=false
CACHE_ENABLED=true
RATE_LIMITING_ENABLED=true
```

### Production

```env
GAMIFICATION_ENABLED=true
GAMIFICATION_DEBUG=false
CACHE_ENABLED=true
RATE_LIMITING_ENABLED=true
MONITORING_ENABLED=true
```

---

## Configuration Validation

Validate configuration on startup:

```typescript
// In lib/gamification/config.ts
export function validateConfig() {
  const errors: string[] = []
  
  // Validate point values
  Object.values(COMPANY_POINT_VALUES).forEach((points) => {
    if (points < 0) errors.push('Point values cannot be negative')
  })
  
  // Validate level thresholds
  // ... more validation
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`)
  }
}
```

---

## Updating Configuration

### Point Values

1. Update values in `lib/gamification/utils.ts`
2. Deploy application
3. New point values apply to future awards only

### Badges

1. Create/update badges via API or database
2. Changes apply immediately
3. Existing earned badges remain unchanged

### Levels

1. Update level thresholds in database
2. Recalculate user levels:
   ```sql
   SELECT calculate_user_level(user_id, user_type, tenant_id)
   FROM gamification_points;
   ```

### System Settings

1. Update environment variables
2. Restart application
3. Changes apply immediately

---

## Best Practices

1. **Version Control**: Keep configuration in version control
2. **Documentation**: Document all custom configurations
3. **Testing**: Test configuration changes in staging first
4. **Backup**: Backup configuration before major changes
5. **Monitoring**: Monitor system after configuration changes
6. **Gradual Rollout**: Roll out changes gradually when possible

---

**Last Updated**: January 2025

