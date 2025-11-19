# On-Call Contacts & Schedule

**Last Updated:** 2025-01-27  
**Purpose:** Emergency contacts and on-call schedule for incident response

---

## ⚠️ Emergency Contacts

### Primary On-Call Engineer
**Current Rotation:** [To be updated weekly]

**Contact Methods:**
- **Phone:** [Primary phone number]
- **Slack:** @on-call-engineer
- **Email:** oncall@yourdomain.com

**Responsibilities:**
- First responder to incidents
- Initial triage and classification
- Escalation to technical lead if needed

---

### Technical Lead
**Name:** [Name]  
**Role:** Senior Engineer / Tech Lead

**Contact Methods:**
- **Phone:** [Phone number]
- **Slack:** @tech-lead
- **Email:** tech-lead@yourdomain.com

**Responsibilities:**
- Complex incident investigation
- Code fixes and deployments
- Technical decision making

---

### Incident Commander
**Name:** [Name]  
**Role:** Engineering Manager / CTO

**Contact Methods:**
- **Phone:** [Phone number]
- **Slack:** @incident-commander
- **Email:** incident-commander@yourdomain.com

**Responsibilities:**
- Coordinate incident response
- Make critical decisions
- Stakeholder communication

---

### DevOps / Infrastructure
**Name:** [Name]  
**Role:** DevOps Engineer

**Contact Methods:**
- **Phone:** [Phone number]
- **Slack:** @devops
- **Email:** devops@yourdomain.com

**Responsibilities:**
- Infrastructure issues
- Deployment problems
- Database/cloud service issues

---

### Security Team
**Name:** [Name]  
**Role:** Security Engineer

**Contact Methods:**
- **Phone:** [Phone number]
- **Slack:** @security
- **Email:** security@yourdomain.com

**Responsibilities:**
- Security incidents
- Data breaches
- Authentication/authorization issues

---

## 📅 On-Call Schedule

### Current Schedule (Week of [Date])

| Day | Primary On-Call | Backup | Time Zone |
|-----|----------------|--------|-----------|
| Monday | [Name] | [Name] | [TZ] |
| Tuesday | [Name] | [Name] | [TZ] |
| Wednesday | [Name] | [Name] | [TZ] |
| Thursday | [Name] | [Name] | [TZ] |
| Friday | [Name] | [Name] | [TZ] |
| Saturday | [Name] | [Name] | [TZ] |
| Sunday | [Name] | [Name] | [TZ] |

**Note:** Update this schedule weekly. Use PagerDuty, Opsgenie, or similar tool for automated scheduling.

---

## 🔄 On-Call Rotation

### Rotation Pattern
- **Duration:** 1 week per engineer
- **Rotation:** Monday to Sunday
- **Handoff:** Sunday 5 PM (or Monday 9 AM)

### On-Call Responsibilities

**During On-Call:**
1. Monitor alerts and notifications
2. Respond to incidents within SLA
3. Escalate to technical lead if needed
4. Document incidents
5. Update incident status

**Off-Hours:**
- Available via phone/Slack
- Respond within 15 minutes for P0/P1
- Respond within 2 hours for P2/P3

---

## 📞 Escalation Path

### Level 1: On-Call Engineer
**Response Time:** Immediate  
**Contact:** Primary on-call engineer

**Escalate to Level 2 if:**
- Issue requires code changes
- Root cause unclear after 30 minutes
- Multiple systems affected
- Security concern

### Level 2: Technical Lead
**Response Time:** < 30 minutes  
**Contact:** Technical lead

**Escalate to Level 3 if:**
- Business-critical decision needed
- Resource allocation required
- External communication needed
- P0 incident > 1 hour unresolved

### Level 3: Incident Commander
**Response Time:** < 15 minutes  
**Contact:** Incident commander

**Escalate to Level 4 if:**
- Business impact significant
- Executive decision needed
- Legal/compliance issue
- Public relations needed

### Level 4: Executive Team
**Response Time:** Immediate  
**Contact:** CTO / CEO

---

## 🚨 Emergency Procedures

### P0 Incident (Critical)
1. **Immediately notify:**
   - On-call engineer (primary)
   - Technical lead
   - Incident commander

2. **Create incident channel:**
   - Slack: #incidents
   - Post initial status

3. **Begin investigation:**
   - Check monitoring dashboards
   - Review error logs
   - Identify root cause

4. **Update every 15 minutes:**
   - Status update in #incidents
   - Progress and next steps

### P1 Incident (High)
1. **Notify:**
   - On-call engineer
   - Technical lead (if needed)

2. **Investigate:**
   - Review logs and metrics
   - Identify issue

3. **Update every 30 minutes:**
   - Status in #incidents

### P2/P3 Incident (Medium/Low)
1. **Log issue:**
   - Create ticket
   - Assign to appropriate team

2. **Update as needed:**
   - Daily status updates

---

## 📧 Contact Methods

### Slack
- **Incident Channel:** #incidents
- **Engineering Channel:** #engineering
- **Alerts Channel:** #alerts

### Email
- **On-Call:** oncall@yourdomain.com
- **Incidents:** incidents@yourdomain.com
- **Engineering:** engineering@yourdomain.com

### Phone
- **Emergency Hotline:** [Phone number]
- **On-Call Phone:** [Phone number]

### PagerDuty / Opsgenie
- **Service:** [Service name]
- **Integration:** Configured with Slack/Email/SMS

---

## 🔧 Service-Specific Contacts

### Supabase
- **Support:** https://supabase.com/support
- **Status:** https://status.supabase.com
- **Dashboard:** [Supabase Dashboard URL]

### Vercel
- **Support:** https://vercel.com/support
- **Status:** https://www.vercel-status.com
- **Dashboard:** [Vercel Dashboard URL]

### Stripe
- **Support:** https://support.stripe.com
- **Status:** https://status.stripe.com
- **Dashboard:** [Stripe Dashboard URL]

### Sentry
- **Support:** https://sentry.io/support
- **Status:** https://status.sentry.io
- **Dashboard:** https://talyaglobal.sentry.io

### Email Service (SendGrid/Resend)
- **Support:** [Support URL]
- **Status:** [Status page URL]
- **Dashboard:** [Dashboard URL]

---

## 📋 On-Call Checklist

### Before Starting On-Call
- [ ] Review current incidents
- [ ] Check monitoring dashboards
- [ ] Verify contact information
- [ ] Test alert notifications
- [ ] Review recent deployments
- [ ] Check known issues

### During On-Call
- [ ] Monitor alerts
- [ ] Respond to incidents within SLA
- [ ] Document all incidents
- [ ] Update status regularly
- [ ] Escalate when needed

### After On-Call
- [ ] Hand off to next engineer
- [ ] Document any ongoing issues
- [ ] Update runbook if needed
- [ ] Complete incident reports

---

## 🔄 Handoff Procedure

### Weekly Handoff (Sunday 5 PM)

**Outgoing Engineer:**
1. Document ongoing incidents
2. List any known issues
3. Share context for next week
4. Update on-call schedule

**Incoming Engineer:**
1. Review incident log
2. Check monitoring dashboards
3. Review recent deployments
4. Confirm contact information

**Handoff Template:**
```markdown
# On-Call Handoff - [Date]

## Ongoing Incidents
- [Incident 1]: [Status] - [Next steps]
- [Incident 2]: [Status] - [Next steps]

## Known Issues
- [Issue 1]: [Description] - [Workaround]
- [Issue 2]: [Description] - [Workaround]

## Recent Deployments
- [Deployment 1]: [Date] - [Status]
- [Deployment 2]: [Date] - [Status]

## Notes
[Any relevant notes for next engineer]
```

---

## 📱 Alert Configuration

### Sentry Alerts
- **Critical Errors:** → Slack #alerts + Email
- **Payment Failures:** → Slack #alerts + PagerDuty
- **Auth Failures:** → Slack #alerts
- **Database Errors:** → Slack #alerts + Email

### Vercel Alerts
- **Deployment Failures:** → Slack #alerts + Email
- **Function Errors:** → Slack #alerts
- **Build Failures:** → Slack #alerts

### Uptime Monitoring
- **Downtime:** → PagerDuty + Slack #alerts
- **Slow Response:** → Slack #alerts

---

## 📝 Incident Log

### Recent Incidents

| Date | Severity | Title | Status | Duration | Engineer |
|------|----------|-------|--------|----------|----------|
| [Date] | P1 | [Title] | Resolved | 2h | [Name] |
| [Date] | P2 | [Title] | Resolved | 4h | [Name] |

**Full incident reports:** See `INCIDENT_RESPONSE.md` for detailed reports.

---

## 🔐 Access Information

### Critical Systems Access
- **Vercel Dashboard:** [URL] - [Access method]
- **Supabase Dashboard:** [URL] - [Access method]
- **Sentry Dashboard:** [URL] - [Access method]
- **Stripe Dashboard:** [URL] - [Access method]

**Note:** Access credentials stored in secure password manager. Contact DevOps for access.

---

## 📚 Related Documentation

- `INCIDENT_RESPONSE.md` - Incident response procedures
- `RUNBOOK.md` - Common issues and resolutions
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `DEPLOYMENT_ROLLBACK.md` - Rollback procedures

---

## 🔄 Update Schedule

- **On-Call Schedule:** Updated weekly (every Monday)
- **Contact Information:** Updated monthly or when changes occur
- **Escalation Path:** Reviewed quarterly
- **Documentation:** Reviewed monthly

**Last Review:** [Date]  
**Next Review:** [Date]

