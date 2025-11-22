# TSmartCleaning Gamification Root Admin Dashboard
## Design Specification & Left Menu Structure

**Version:** 1.0  
**Last Updated:** November 2025  
**Purpose:** Root admin dashboard for managing gamification system, tracking progress, and monitoring platform health

---

## Dashboard Overview

The **Gamification Root Admin Dashboard** serves as the central command center for TSmartCleaning administrators to monitor, manage, and optimize the gamification system across both cleaning companies and cleaners. The dashboard provides real-time insights, progress tracking, and administrative controls.

---

## Left Menu Navigation Structure

### 🏠 **Dashboard Home**
- Overview metrics and KPIs
- Real-time activity feed
- Quick actions panel
- System health status

### 📊 **Analytics & Insights**
- **Platform Metrics**
  - Total users (companies + cleaners)
  - Active users (daily/weekly/monthly)
  - Engagement rates
  - Retention metrics
  
- **Gamification Performance**
  - Points distribution analytics
  - Badge achievement rates
  - Level progression tracking
  - Leaderboard statistics
  
- **Revenue Insights**
  - MRR (Monthly Recurring Revenue)
  - Customer lifetime value
  - Churn rate
  - Revenue per user

### 🎮 **Gamification Management**

#### **Points System**
- Configure point values for actions
- View points distribution
- Adjust point multipliers
- Points history and logs

#### **Badges & Achievements**
- Create/edit/delete badges
- Set badge criteria and requirements
- View badge distribution
- Badge analytics

#### **Levels & Progression**
- Define level thresholds
- Configure level rewards
- View level distribution
- Progression analytics

#### **Leaderboards**
- Configure leaderboard types
- Set ranking criteria
- View current rankings
- Leaderboard history

#### **Challenges & Quests**
- Create time-based challenges
- Set challenge rewards
- Monitor challenge participation
- Challenge performance metrics

### 👥 **User Management**

#### **Cleaning Companies**
- Company list and profiles
- Company activity tracking
- Subscription management
- Company analytics
- Manual actions (suspend, activate, delete)

#### **Cleaners**
- Cleaner list and profiles
- Cleaner performance metrics
- Certification tracking
- Cleaner analytics
- Manual actions (verify, suspend, activate)

#### **Admins & Roles**
- Admin user management
- Role and permission configuration
- Activity logs
- Access control

### 📈 **Progress Tracking**

#### **GTM Strategy Progress**
- Phase 1: Foundation (Months 1-2)
- Phase 2: Soft Launch (Months 3-4)
- Phase 3: Growth (Months 5-6)
- Overall completion percentage
- Milestone tracking

#### **Team TODO Progress**
- Volkan's tasks (CEO/Founder)
- Özgün's tasks (CTO/Co-founder)
- Task completion rates
- Overdue tasks alerts
- Priority task highlights

#### **KPI Dashboard**
- Target vs. Actual metrics
- 5 Companies goal progress
- 25 Cleaners goal progress
- $1,850/month revenue tracking
- Visual progress bars and charts

### 💼 **Business Operations**

#### **Job Management**
- Active jobs overview
- Job completion rates
- Job matching analytics
- Job history

#### **Payments & Billing**
- Transaction history
- Payment processing status
- Refunds and disputes
- Revenue reports

#### **Support & Tickets**
- Support ticket queue
- Response time metrics
- Customer satisfaction scores
- Common issues tracking

### 🔔 **Notifications & Alerts**
- System notifications
- User activity alerts
- Performance warnings
- Custom notification rules

### 🛠️ **System Configuration**

#### **Platform Settings**
- General settings
- Email templates
- SMS notifications
- API configuration

#### **Gamification Rules**
- Global gamification settings
- Feature toggles
- A/B testing configuration
- Seasonal events

#### **Integrations**
- Third-party integrations
- API keys management
- Webhook configuration
- Integration logs

### 📚 **Reports & Exports**

#### **Standard Reports**
- Daily activity report
- Weekly performance report
- Monthly business review
- Custom date range reports

#### **Data Exports**
- User data export
- Transaction export
- Analytics export
- Compliance reports

### ⚙️ **Admin Tools**

#### **Database Management**
- Database health monitoring
- Backup status
- Data cleanup tools
- Query tools (read-only)

#### **System Logs**
- Application logs
- Error logs
- Security logs
- Audit trails

#### **Developer Tools**
- API documentation
- Webhook testing
- Feature flags
- Debug mode

### 📖 **Documentation**
- User guides
- API documentation
- Admin handbook
- Video tutorials

### 👤 **Profile & Settings**
- Admin profile
- Notification preferences
- Security settings
- Activity history

---

## Dashboard Home - Detailed Layout

### Top Section: Key Metrics (4 Cards)

**Card 1: Total Users**
- Total companies: X
- Total cleaners: Y
- Growth rate: +Z%
- Icon: 👥

**Card 2: Active Jobs**
- Active jobs: X
- Completed today: Y
- Completion rate: Z%
- Icon: 💼

**Card 3: Monthly Revenue**
- MRR: $X,XXX
- Target: $1,850
- Progress: Z%
- Icon: 💰

**Card 4: Engagement Score**
- Overall engagement: X%
- Company engagement: Y%
- Cleaner engagement: Z%
- Icon: 📊

### Middle Section: Progress Tracking

**GTM Strategy Progress Bar**
- Visual progress bar showing overall completion
- Current phase indicator
- Next milestone
- Days remaining in current phase

**Team TODO Completion**
- Volkan's task completion: X%
- Özgün's task completion: Y%
- Overall completion: Z%
- Overdue tasks: N

### Bottom Section: Activity Feed & Quick Actions

**Recent Activity Feed**
- New company signup
- Cleaner certification completed
- Badge earned
- Job completed
- Support ticket created

**Quick Actions Panel**
- Create new challenge
- Send platform notification
- Export daily report
- View system health
- Add new admin user

---

## Gamification Features Detail

### Points System Configuration

**Actions & Point Values:**

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

### Badge System

**Company Badges:**
- 🌟 **First Timer**: Post your first job
- 🚀 **Quick Starter**: Complete first job within 24 hours
- 💎 **Premium Partner**: Subscribe to Professional tier
- 🏆 **Top Employer**: Maintain 4.8+ rating
- 🎯 **Consistent Poster**: Post jobs for 4 consecutive weeks
- 👑 **Elite Partner**: Complete 100+ jobs
- 🤝 **Referral Champion**: Refer 3+ companies
- ⭐ **5-Star Partner**: Receive 50+ 5-star ratings

**Cleaner Badges:**
- 🌟 **New Star**: Complete your first job
- 🚀 **Fast Responder**: Accept jobs within 1 hour
- 💎 **Certified Pro**: Complete all certifications
- 🏆 **Top Performer**: Maintain 4.9+ rating
- 🎯 **Reliable Worker**: 95%+ job completion rate
- 👑 **Elite Cleaner**: Complete 100+ jobs
- 🤝 **Community Builder**: Refer 5+ cleaners
- ⭐ **Perfect Record**: 100 consecutive 5-star ratings

### Level System

**Company Levels:**
1. **Bronze Partner** (0-499 points)
2. **Silver Partner** (500-1,499 points)
3. **Gold Partner** (1,500-3,999 points)
4. **Platinum Partner** (4,000-9,999 points)
5. **Diamond Partner** (10,000+ points)

**Cleaner Levels:**
1. **Beginner** (0-299 points)
2. **Intermediate** (300-999 points)
3. **Advanced** (1,000-2,999 points)
4. **Expert** (3,000-7,499 points)
5. **Master** (7,500+ points)

**Level Rewards:**
- Unlock premium features
- Priority support access
- Exclusive badges
- Profile highlights
- Leaderboard recognition

### Leaderboard Types

**Company Leaderboards:**
- Top employers (by rating)
- Most active (by jobs posted)
- Highest points earners
- Best referrers

**Cleaner Leaderboards:**
- Top performers (by rating)
- Most jobs completed
- Highest points earners
- Best referrers

**Timeframes:**
- Daily
- Weekly
- Monthly
- All-time

---

## Technical Requirements

### Technology Stack Recommendations

**Frontend:**
- React.js with TypeScript
- Tailwind CSS for styling
- Chart.js or Recharts for visualizations
- React Router for navigation
- Redux or Zustand for state management

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- Redis for caching
- RESTful API architecture

**UI Components:**
- Shadcn UI or Material-UI
- React Icons
- Framer Motion for animations

### Key Features

**Real-time Updates:**
- WebSocket connections for live data
- Auto-refresh dashboards
- Push notifications

**Data Visualization:**
- Interactive charts and graphs
- Progress bars and gauges
- Heatmaps and timelines

**Responsive Design:**
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interfaces

**Security:**
- Role-based access control (RBAC)
- JWT authentication
- Encrypted data transmission
- Audit logging

**Performance:**
- Lazy loading for components
- Data pagination
- Caching strategies
- Optimized queries

---

## User Roles & Permissions

### Super Admin (Root Access)
- Full access to all features
- System configuration
- User management
- Database access
- Financial data access

### Admin
- Dashboard access
- User management (limited)
- Content management
- Support tools
- Reports access

### Support Agent
- Support ticket management
- User profile viewing
- Limited user actions
- Basic reports

### Analyst
- Read-only dashboard access
- Analytics and reports
- Data exports
- No user management

---

## Implementation Priority

### Phase 1: Core Dashboard (Weeks 1-2)
- Dashboard home with key metrics
- Left menu navigation
- User management (companies & cleaners)
- Basic analytics

### Phase 2: Gamification Features (Weeks 3-4)
- Points system configuration
- Badge management
- Level system
- Leaderboards

### Phase 3: Progress Tracking (Week 5)
- GTM strategy progress tracker
- Team TODO integration
- KPI dashboard

### Phase 4: Advanced Features (Week 6+)
- Reports and exports
- System configuration
- Admin tools
- Documentation

---

## Success Metrics

**Dashboard Usage:**
- Daily active admin users
- Average session duration
- Feature utilization rates

**Gamification Impact:**
- User engagement increase
- Feature adoption rates
- Retention improvement

**Business Impact:**
- Faster decision-making
- Reduced support tickets
- Improved operational efficiency

---

## Design Principles

1. **Clarity**: Information should be easy to understand at a glance
2. **Efficiency**: Common tasks should require minimal clicks
3. **Consistency**: UI patterns should be predictable
4. **Responsiveness**: Real-time data updates
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Scalability**: Design for future growth

---

## Next Steps

1. Review and approve dashboard design
2. Create detailed wireframes and mockups
3. Develop component library
4. Implement core features
5. Conduct user testing
6. Iterate based on feedback
7. Deploy to production

---

**Document prepared for:** Volkan (CEO) & Özgün (CTO)  
**Prepared by:** TSmartCleaning Development Team  
**Date:** November 2025
