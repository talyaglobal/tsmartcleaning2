# Gamification Admin User Guide

## Overview

This guide helps administrators manage the gamification system in TSmartCleaning. The gamification system rewards users (cleaning companies and cleaners) for engagement and achievements through points, badges, levels, leaderboards, and challenges.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Points System](#points-system)
3. [Badges Management](#badges-management)
4. [Levels Configuration](#levels-configuration)
5. [Leaderboards](#leaderboards)
6. [Challenges](#challenges)
7. [Analytics & Reporting](#analytics--reporting)
8. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Gamification Dashboard

1. Log in to the admin dashboard
2. Navigate to **Gamification** in the left menu
3. You'll see the main dashboard with:
   - System overview metrics
   - Recent activity
   - Quick actions

### Permissions Required

- **Admin Role**: Full access to all gamification features
- **Support Role**: Read-only access to user data
- **Analyst Role**: Read-only access to analytics

---

## Points System

### Understanding Points

Points are the core currency of the gamification system. Users earn points for various actions:

**For Cleaning Companies:**
- Post a job: 10 points
- Complete a job: 50 points
- Rate a cleaner: 5 points
- Refer another company: 500 points
- Complete profile: 25 points
- Upload company logo: 15 points
- First job posted: 100 points (bonus)
- 10 jobs completed: 250 points (milestone)

**For Cleaners:**
- Complete profile: 25 points
- Upload profile photo: 15 points
- Complete certification: 100 points
- Accept a job: 5 points
- Complete a job: 50 points
- Receive 5-star rating: 25 points
- Refer another cleaner: 200 points
- First job completed: 100 points (bonus)
- 10 jobs completed: 250 points (milestone)
- 50 jobs completed: 1,000 points (milestone)

### Manual Point Awards

To manually award points to a user:

1. Navigate to **Gamification > Points > Award Points**
2. Select the user (company or cleaner)
3. Choose the action type or enter custom points
4. Add optional metadata
5. Click **Award Points**

**Note**: Manual point awards are logged and can be audited.

### Viewing Point History

1. Navigate to **Gamification > Points > History**
2. Filter by:
   - User ID
   - Action type
   - Date range
3. Export data if needed

### Adjusting Point Values

To change point values for actions:

1. Navigate to **Gamification > Points > Configuration**
2. Edit point values for each action
3. Changes apply to future awards only
4. Historical transactions remain unchanged

---

## Badges Management

### Understanding Badges

Badges are achievements that users can earn. They provide visual recognition and often include bonus points.

### Creating a Badge

1. Navigate to **Gamification > Badges > Create Badge**
2. Fill in the form:
   - **Code**: Unique identifier (e.g., `first_booking`)
   - **Name**: Display name (e.g., "First Timer")
   - **Description**: What the badge represents
   - **Icon**: Emoji or icon URL
   - **User Type**: Company, Cleaner, or Both
   - **Criteria**: What users need to do to earn it
     - Type: Points, Jobs, Ratings, Streak, Referrals, or Custom
     - Threshold: The target number
   - **Bonus Points**: Points awarded when badge is earned
3. Click **Create Badge**

### Badge Criteria Types

- **Points**: User reaches a certain point total
- **Jobs**: User completes a number of jobs
- **Ratings**: User receives a number of ratings
- **Streak**: User has activity for consecutive days
- **Referrals**: User refers a number of new users
- **Custom**: Custom logic (requires development)

### Awarding Badges Manually

1. Navigate to **Gamification > Badges > Award Badge**
2. Select the user
3. Choose the badge
4. Click **Award Badge**

**Note**: Users cannot earn the same badge twice.

### Viewing Badge Distribution

1. Navigate to **Gamification > Badges > Analytics**
2. View:
   - Total badges created
   - Badges earned count
   - Most popular badges
   - Badge distribution by user type

---

## Levels Configuration

### Understanding Levels

Levels represent user progression based on total points. Each level has:
- A name (e.g., "Bronze Partner", "Gold Partner")
- A point threshold
- Optional rewards

### Default Levels

**Company Levels:**
1. Bronze Partner (0-499 points)
2. Silver Partner (500-1,499 points)
3. Gold Partner (1,500-3,999 points)
4. Platinum Partner (4,000-9,999 points)
5. Diamond Partner (10,000+ points)

**Cleaner Levels:**
1. Beginner (0-299 points)
2. Intermediate (300-999 points)
3. Advanced (1,000-2,999 points)
4. Expert (3,000-7,499 points)
5. Master (7,500+ points)

### Creating Custom Levels

1. Navigate to **Gamification > Levels > Create Level**
2. Fill in:
   - **Level Number**: Sequential number (1, 2, 3, etc.)
   - **Level Name**: Display name
   - **Points Threshold**: Minimum points required
   - **User Type**: Company, Cleaner, or Both
   - **Rewards**: JSON object with rewards (optional)
3. Click **Create Level**

**Important**: Level numbers must be sequential and thresholds must increase.

### Viewing Level Distribution

1. Navigate to **Gamification > Levels > Analytics**
2. View:
   - Users per level
   - Level progression trends
   - Average points per level

---

## Leaderboards

### Understanding Leaderboards

Leaderboards rank users by various metrics:
- **Points**: Total points earned
- **Jobs**: Number of jobs completed
- **Ratings**: Average rating received
- **Referrals**: Number of successful referrals

### Leaderboard Timeframes

- **Daily**: Rankings for today
- **Weekly**: Rankings for this week
- **Monthly**: Rankings for this month
- **All-Time**: All-time rankings

### Viewing Leaderboards

1. Navigate to **Gamification > Leaderboards**
2. Select:
   - Type (points, jobs, ratings, referrals)
   - Timeframe (daily, weekly, monthly, all-time)
   - User Type (company, cleaner)
3. View the rankings

### Refreshing Leaderboards

Leaderboards are cached for performance. To manually refresh:

1. Navigate to **Gamification > Leaderboards > Refresh**
2. Select the leaderboard type
3. Click **Refresh Now**

**Note**: Leaderboards auto-refresh every hour.

### Leaderboard Analytics

1. Navigate to **Gamification > Leaderboards > Analytics**
2. View:
   - Top performers
   - Leaderboard participation rates
   - Ranking changes over time

---

## Challenges

### Understanding Challenges

Challenges are time-limited events that encourage specific behaviors. Users can join challenges and earn rewards upon completion.

### Creating a Challenge

1. Navigate to **Gamification > Challenges > Create Challenge**
2. Fill in:
   - **Name**: Challenge name
   - **Description**: What users need to do
   - **User Type**: Company or Cleaner
   - **Start Date**: When the challenge begins
   - **End Date**: When the challenge ends
   - **Criteria**: What users need to achieve
     - Type: Points, Jobs, Ratings, Streak, or Custom
     - Target: The goal number
   - **Rewards**: What users get for completing
     - Points
     - Badges
     - Discounts (requires integration)
     - Features (requires integration)
3. Set status to **Active** when ready
4. Click **Create Challenge**

### Managing Challenges

**Activating a Challenge:**
1. Find the challenge in **Gamification > Challenges**
2. Click **Activate**
3. Challenge becomes visible to users

**Completing a Challenge:**
1. Challenges automatically complete when the end date passes
2. Or manually set status to **Completed**

**Cancelling a Challenge:**
1. Find the challenge
2. Click **Cancel**
3. Users will be notified

### Viewing Challenge Progress

1. Navigate to **Gamification > Challenges**
2. Click on a challenge
3. View:
   - Total participants
   - Completion rate
   - Top performers
   - Individual user progress

---

## Analytics & Reporting

### Dashboard Overview

The main dashboard shows:
- Total points awarded (today, week, month)
- Badges earned count
- Active challenges
- Leaderboard activity
- User engagement metrics

### Generating Reports

1. Navigate to **Gamification > Reports**
2. Select report type:
   - **Points Report**: Point distribution and trends
   - **Badge Report**: Badge earning statistics
   - **Level Report**: Level distribution and progression
   - **Challenge Report**: Challenge participation and completion
   - **Engagement Report**: Overall user engagement
3. Select date range
4. Click **Generate Report**
5. Export as CSV or PDF

### Key Metrics to Monitor

- **Points Distribution**: Ensure fair distribution across users
- **Badge Earning Rate**: Track badge popularity
- **Level Progression**: Monitor how users progress through levels
- **Challenge Participation**: Track challenge engagement
- **Leaderboard Activity**: Monitor leaderboard views and engagement

---

## Best Practices

### Points System

1. **Balance Point Values**: Ensure point values reflect the effort required
2. **Regular Audits**: Review point awards for anomalies
3. **Clear Communication**: Make point values transparent to users
4. **Avoid Inflation**: Don't award too many points too easily

### Badges

1. **Meaningful Badges**: Create badges that represent real achievements
2. **Variety**: Offer badges for different types of activities
3. **Visual Appeal**: Use clear, recognizable icons
4. **Progressive Difficulty**: Make some badges harder to earn than others

### Levels

1. **Clear Progression**: Make level thresholds logical and achievable
2. **Rewards**: Consider offering tangible rewards for leveling up
3. **Communication**: Clearly communicate level benefits to users

### Leaderboards

1. **Fair Competition**: Ensure leaderboards are fair and transparent
2. **Regular Updates**: Keep leaderboards fresh and engaging
3. **Multiple Categories**: Offer different leaderboard types to engage different users

### Challenges

1. **Time-Limited**: Keep challenges time-bound to create urgency
2. **Achievable Goals**: Set realistic targets that users can achieve
3. **Rewarding**: Offer meaningful rewards for completion
4. **Variety**: Mix different types of challenges to keep users engaged

### General

1. **Monitor Engagement**: Regularly review analytics to understand what works
2. **User Feedback**: Listen to user feedback and adjust accordingly
3. **Testing**: Test new features before rolling out to all users
4. **Documentation**: Keep internal documentation up to date
5. **Security**: Always verify user permissions before making changes

---

## Troubleshooting

### Points Not Awarding

1. Check if the user has a gamification account
2. Verify the action type is configured correctly
3. Check system logs for errors
4. Ensure tenant context is correct

### Badges Not Earning

1. Verify badge criteria are correct
2. Check if user already has the badge
3. Verify user meets all criteria
4. Check system logs for errors

### Leaderboards Not Updating

1. Manually refresh the leaderboard
2. Check if caching is working correctly
3. Verify data exists for the timeframe
4. Check system logs for errors

### Challenges Not Showing

1. Verify challenge status is "Active"
2. Check start and end dates
3. Verify user type matches
4. Check if challenge is tenant-specific

---

## Support

For technical issues or questions:
- Check system logs in **Admin > System Logs**
- Contact the development team
- Review API documentation

For user-facing issues:
- Check user's gamification account
- Verify permissions and tenant context
- Review recent changes to the system

---

**Last Updated**: January 2025

