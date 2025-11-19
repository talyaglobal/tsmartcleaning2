# Security Audit Report

**Generated:** 2025-11-19T04:11:25.901Z
**Total Routes Audited:** 225

## Executive Summary

- ✅ Routes with authentication: 112/225 (50%)
- ⚠️  Routes with security issues: 143/225
- 🔴 Critical issues: 41
- 🟠 High priority issues: 46

## Service Role Key Exposure Check

✅ **No service role key exposure found** - All service role key usage is server-side only

## Critical Security Issues


### /api/admin/bookings
**Methods:** GET, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/bookings/route.ts`


### /api/admin/companies/:id/message
**Methods:** POST
**Issues:**
- Missing admin authentication
**File:** `admin/companies/[id]/message/route.ts`


### /api/admin/insurance/policies
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/insurance/policies/route.ts`


### /api/admin/messages/:conversationId
**Methods:** GET, POST, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/messages/[conversationId]/route.ts`


### /api/admin/users/:userId/activity
**Methods:** GET
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/users/[userId]/activity/route.ts`


### /api/admin/users/:userId/message
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/users/[userId]/message/route.ts`


### /api/admin/users/:userId
**Methods:** PATCH
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/users/[userId]/route.ts`


### /api/admin/users
**Methods:** GET, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/users/route.ts`


### /api/admin/verifications/:id
**Methods:** PATCH
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `admin/verifications/[id]/route.ts`


### /api/analytics/track
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `analytics/track/route.ts`


### /api/auth/complete-social-signup
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `auth/complete-social-signup/route.ts`


### /api/auth/signup
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `auth/signup/route.ts`


### /api/bookings/recurring
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `bookings/recurring/route.ts`


### /api/cleaners/me/timesheet
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `cleaners/me/timesheet/route.ts`


### /api/companies/:id/users
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `companies/[id]/users/route.ts`


### /api/insurance/claims
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `insurance/claims/route.ts`


### /api/insurance/policies
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `insurance/policies/route.ts`


### /api/jobs/:id/assign
**Methods:** POST
**Issues:**
- Missing admin authentication
- Accepts userId parameter without ownership verification
**File:** `jobs/[id]/assign/route.ts`


### /api/jobs/:id
**Methods:** GET, PATCH, DELETE
**Issues:**
- Missing admin authentication
**File:** `jobs/[id]/route.ts`


### /api/jobs/:id/status
**Methods:** PATCH
**Issues:**
- Missing admin authentication
- Accepts userId parameter without ownership verification
**File:** `jobs/[id]/status/route.ts`


### /api/loyalty/balance
**Methods:** GET
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `loyalty/balance/route.ts`


### /api/loyalty/earn
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `loyalty/earn/route.ts`


### /api/loyalty/redeem
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `loyalty/redeem/route.ts`


### /api/loyalty/transactions
**Methods:** GET
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `loyalty/transactions/route.ts`


### /api/membership/activate
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `membership/activate/route.ts`


### /api/membership/auto-renew
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `membership/auto-renew/route.ts`


### /api/membership/benefits
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `membership/benefits/route.ts`


### /api/membership/purchase
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `membership/purchase/route.ts`


### /api/membership/renew
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `membership/renew/route.ts`


### /api/membership/upgrade
**Methods:** POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `membership/upgrade/route.ts`


### /api/notifications
**Methods:** GET, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `notifications/route.ts`


### /api/providers/:id
**Methods:** GET, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `providers/[id]/route.ts`


### /api/root-admin/companies/:id/credentials
**Methods:** GET, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `root-admin/companies/[id]/credentials/route.ts`


### /api/root-admin/login
**Methods:** POST
**Issues:**
- Missing admin authentication
**File:** `root-admin/login/route.ts`


### /api/root-admin/reviews/:id
**Methods:** PATCH
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `root-admin/reviews/[id]/route.ts`


### /api/root-admin/verify-otp
**Methods:** POST
**Issues:**
- Missing admin authentication
**File:** `root-admin/verify-otp/route.ts`


### /api/suggestions
**Methods:** GET
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `suggestions/route.ts`


### /api/transactions
**Methods:** GET, POST
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `transactions/route.ts`


### /api/users/:id
**Methods:** GET, PATCH
**Issues:**
- Accepts userId parameter without ownership verification
- Admin route may not require admin authentication
**File:** `users/[id]/route.ts`


### /api/verification/badge
**Methods:** GET
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `verification/badge/route.ts`


### /api/verification/status
**Methods:** GET
**Issues:**
- Accepts userId parameter without ownership verification
**File:** `verification/status/route.ts`


## High Priority Issues


### /api/admin/bookings/analytics
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/bookings/analytics/route.ts`


### /api/admin/companies/:id/verify
**Methods:** PATCH
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/companies/[id]/verify/route.ts`


### /api/admin/insurance/analytics
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/insurance/analytics/route.ts`


### /api/admin/insurance/claims/:id/activities
**Methods:** GET, POST
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/insurance/claims/[id]/activities/route.ts`


### /api/admin/insurance/claims/:id
**Methods:** GET, PATCH
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/insurance/claims/[id]/route.ts`


### /api/admin/insurance/claims
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/insurance/claims/route.ts`


### /api/admin/insurance/plans
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/insurance/plans/route.ts`


### /api/admin/insurance/policies/:id
**Methods:** PATCH, DELETE
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/insurance/policies/[id]/route.ts`


### /api/admin/message-templates/:templateId
**Methods:** PATCH, DELETE
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/message-templates/[templateId]/route.ts`


### /api/admin/message-templates
**Methods:** GET, POST
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/message-templates/route.ts`


### /api/admin/messages
**Methods:** GET, POST
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/messages/route.ts`


### /api/admin/reports/:id/download
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/reports/[id]/download/route.ts`


### /api/admin/reports/analytics
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/reports/analytics/route.ts`


### /api/admin/reports/generate
**Methods:** POST
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/reports/generate/route.ts`


### /api/admin/reports/schedules
**Methods:** GET, POST, DELETE
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/reports/schedules/route.ts`


### /api/admin/reports/templates
**Methods:** GET, POST
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/reports/templates/route.ts`


### /api/admin/stats
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/stats/route.ts`


### /api/admin/verifications
**Methods:** GET
**Issues:**
- Admin route may not require admin authentication
**File:** `admin/verifications/route.ts`


### /api/bookings/:id/ics
**Methods:** GET
**Issues:**
- Missing authentication
**File:** `bookings/[id]/ics/route.ts`


### /api/bookings/:id/messages
**Methods:** GET, POST
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `bookings/[id]/messages/route.ts`


### /api/bookings/:id/notes
**Methods:** GET, PATCH
**Issues:**
- Missing authentication
**File:** `bookings/[id]/notes/route.ts`


### /api/bookings/:id/reschedule
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `bookings/[id]/reschedule/route.ts`


### /api/bookings/instant
**Methods:** POST
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `bookings/instant/route.ts`


### /api/bookings/recurring/:id
**Methods:** GET, PATCH, DELETE
**Issues:**
- Missing authentication
**File:** `bookings/recurring/[id]/route.ts`


### /api/bookings/recurring/generate
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `bookings/recurring/generate/route.ts`


### /api/bookings/reminders/send
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `bookings/reminders/send/route.ts`


### /api/companies/:id/invoices/:invoiceId/download
**Methods:** GET
**Issues:**
- Missing authentication
**File:** `companies/[id]/invoices/[invoiceId]/download/route.ts`


### /api/companies/:id/payment-methods/:methodId
**Methods:** PATCH, DELETE
**Issues:**
- Missing authentication
**File:** `companies/[id]/payment-methods/[methodId]/route.ts`


### /api/companies/search
**Methods:** GET
**Issues:**
- Missing authentication
**File:** `companies/search/route.ts`


### /api/companies/slug/:slug
**Methods:** GET
**Issues:**
- Missing authentication
**File:** `companies/slug/[slug]/route.ts`


### /api/insurance/certificate
**Methods:** GET
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `insurance/certificate/route.ts`


### /api/insurance/claims/:claimId/documents/:documentId
**Methods:** PATCH
**Issues:**
- Missing authentication
**File:** `insurance/claims/[claimId]/documents/[documentId]/route.ts`


### /api/insurance/claims/:claimId/documents
**Methods:** GET, POST, DELETE
**Issues:**
- Missing authentication
**File:** `insurance/claims/[claimId]/documents/route.ts`


### /api/insurance/claims/:claimId
**Methods:** GET, PATCH
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `insurance/claims/[claimId]/route.ts`


### /api/insurance/plans
**Methods:** GET
**Issues:**
- Missing authentication
**File:** `insurance/plans/route.ts`


### /api/jobs
**Methods:** GET, POST
**Issues:**
- Admin route may not require admin authentication
**File:** `jobs/route.ts`


### /api/loyalty/achievements/award
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `loyalty/achievements/award/route.ts`


### /api/loyalty/milestone/ten-booking
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `loyalty/milestone/ten-booking/route.ts`


### /api/loyalty/referral/complete
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `loyalty/referral/complete/route.ts`


### /api/reviews/:id/response
**Methods:** PUT, PATCH, DELETE
**Issues:**
- Missing authentication
**File:** `reviews/[id]/response/route.ts`


### /api/transactions/:id/refund
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `transactions/[id]/refund/route.ts`


### /api/transactions/:id/retry
**Methods:** POST
**Issues:**
- Missing authentication
**File:** `transactions/[id]/retry/route.ts`


### /api/users
**Methods:** GET, POST
**Issues:**
- Admin route may not require admin authentication
**File:** `users/route.ts`


### /api/verification/consent
**Methods:** POST
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `verification/consent/route.ts`


### /api/verification/refresh
**Methods:** POST
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `verification/refresh/route.ts`


### /api/verification/start
**Methods:** POST
**Issues:**
- Missing authentication
- Accepts userId parameter without ownership verification
**File:** `verification/start/route.ts`


## Routes Needing Review


### /api/agency/candidates
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `agency/candidates/route.ts`


### /api/agency/messages
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `agency/messages/route.ts`


### /api/agency/placements/:id
**Methods:** PATCH
**Issues:**
- May need authentication (review required)
**File:** `agency/placements/[id]/route.ts`


### /api/agency/placements
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `agency/placements/route.ts`


### /api/agency/reports
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `agency/reports/route.ts`


### /api/ambassador/jobs/:id/assign
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `ambassador/jobs/[id]/assign/route.ts`


### /api/ambassador/jobs
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `ambassador/jobs/route.ts`


### /api/ambassador/performance
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `ambassador/performance/route.ts`


### /api/ambassador/team
**Methods:** GET, POST, DELETE
**Issues:**
- May need authentication (review required)
**File:** `ambassador/team/route.ts`


### /api/analytics/dashboard
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `analytics/dashboard/route.ts`


### /api/availability
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `availability/route.ts`


### /api/campaigns/:id/progress
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `campaigns/[id]/progress/route.ts`


### /api/campaigns/active
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `campaigns/active/route.ts`


### /api/campaigns/audience-preview
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `campaigns/audience-preview/route.ts`


### /api/campaigns/launch
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `campaigns/launch/route.ts`


### /api/campaigns
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `campaigns/route.ts`


### /api/careers/apply
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `careers/apply/route.ts`


### /api/careers/jobs
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `careers/jobs/route.ts`


### /api/domains
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `domains/route.ts`


### /api/domains/verify
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `domains/verify/route.ts`


### /api/integrations/alexa
**Methods:** POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `integrations/alexa/route.ts`


### /api/integrations/cameras
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `integrations/cameras/route.ts`


### /api/integrations/google
**Methods:** POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `integrations/google/route.ts`


### /api/integrations/homekit
**Methods:** POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `integrations/homekit/route.ts`


### /api/integrations/ring
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `integrations/ring/route.ts`


### /api/integrations/smartlocks
**Methods:** POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `integrations/smartlocks/route.ts`


### /api/integrations/thermostat
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `integrations/thermostat/route.ts`


### /api/job-applications/:id
**Methods:** GET, PATCH
**Issues:**
- May need authentication (review required)
**File:** `job-applications/[id]/route.ts`


### /api/job-applications
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `job-applications/route.ts`


### /api/ngo/register
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `ngo/register/route.ts`


### /api/operations/live-jobs
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `operations/live-jobs/route.ts`


### /api/operations/schedule
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `operations/schedule/route.ts`


### /api/operations/teams
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `operations/teams/route.ts`


### /api/partner/commissions
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `partner/commissions/route.ts`


### /api/partner/metrics
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `partner/metrics/route.ts`


### /api/partner/referrals
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `partner/referrals/route.ts`


### /api/payments/create-intent
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `payments/create-intent/route.ts`


### /api/payouts/process
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `payouts/process/route.ts`


### /api/payouts/scheduler/run
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `payouts/scheduler/run/route.ts`


### /api/payouts/statements
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `payouts/statements/route.ts`


### /api/pricing/quote
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `pricing/quote/route.ts`


### /api/provider/portfolio
**Methods:** GET, POST, PUT, DELETE
**Issues:**
- May need authentication (review required)
**File:** `provider/portfolio/route.ts`


### /api/provider/profile/photo
**Methods:** POST, DELETE
**Issues:**
- May need authentication (review required)
**File:** `provider/profile/photo/route.ts`


### /api/provider/services
**Methods:** GET, POST, PUT, DELETE
**Issues:**
- May need authentication (review required)
**File:** `provider/services/route.ts`


### /api/provider/tax-documents
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `provider/tax-documents/route.ts`


### /api/referral/validate
**Methods:** POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `referral/validate/route.ts`


### /api/reports/analytics
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `reports/analytics/route.ts`


### /api/reports/generate
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `reports/generate/route.ts`


### /api/reports/process-scheduled
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
**File:** `reports/process-scheduled/route.ts`


### /api/send-email
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `send-email/route.ts`


### /api/sentry-example-api
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `sentry-example-api/route.ts`


### /api/stripe/webhook
**Methods:** POST
**Issues:**
- May need authentication (review required)
**File:** `stripe/webhook/route.ts`


### /api/team/stats
**Methods:** GET
**Issues:**
- May need authentication (review required)
**File:** `team/stats/route.ts`


### /api/team/support-tickets/:id
**Methods:** GET, POST, PATCH
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `team/support-tickets/[id]/route.ts`


### /api/team/support-tickets
**Methods:** GET, POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `team/support-tickets/route.ts`


### /api/webhooks/:vendor
**Methods:** POST
**Issues:**
- May need authentication (review required)
- Accepts userId parameter without ownership verification
**File:** `webhooks/[vendor]/route.ts`


## All Routes Security Status

| Route | Methods | Auth | Ownership Check | Risk Level | Issues |
|-------|---------|------|-----------------|------------|--------|
| /api/about/locations | GET | ❌ | N/A | ✅ | 0 |
| /api/about/press | GET | ❌ | N/A | ✅ | 0 |
| /api/about/stats | GET | ❌ | N/A | ✅ | 0 |
| /api/about/team | GET | ❌ | N/A | ✅ | 0 |
| /api/about/timeline | GET | ❌ | N/A | ✅ | 0 |
| /api/admin/bookings/analytics | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/bookings | GET, PATCH | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/companies/:id/message | POST | ❌ | ⚠️ | 🔴 | 1 |
| /api/admin/companies/:id/verify | PATCH | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/analytics | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/claims/:id/activities | GET, POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/claims/:id | GET, PATCH | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/claims | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/plans | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/policies/:id | PATCH, DELETE | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/insurance/policies | GET, POST | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/message-templates/:templateId | PATCH, DELETE | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/message-templates | GET, POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/messages/:conversationId | GET, POST, PATCH | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/messages | GET, POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/reports/:id/download | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/reports/analytics | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/reports/generate | POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/reports/schedules | GET, POST, DELETE | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/reports/templates | GET, POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/stats | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/admin/users/:userId/activity | GET | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/users/:userId/message | POST | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/users/:userId | PATCH | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/users | GET, PATCH | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/verifications/:id | PATCH | ✅ | ⚠️ | 🔴 | 2 |
| /api/admin/verifications | GET | ✅ | ⚠️ | 🟠 | 1 |
| /api/agency/candidates | GET, POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/agency/messages | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/agency/placements/:id | PATCH | ❌ | ⚠️ | 🟡 | 1 |
| /api/agency/placements | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/agency/reports | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/ambassador/jobs/:id/assign | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/ambassador/jobs | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/ambassador/performance | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/ambassador/team | GET, POST, DELETE | ❌ | ⚠️ | 🟡 | 1 |
| /api/analytics/dashboard | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/analytics/track | GET, POST | ✅ | N/A | 🔴 | 1 |
| /api/auth/complete-social-signup | POST | ❌ | N/A | 🔴 | 1 |
| /api/auth/login | POST | ❌ | N/A | ✅ | 0 |
| /api/auth/logout | POST | ❌ | N/A | ✅ | 0 |
| /api/auth/me | GET | ✅ | N/A | ✅ | 0 |
| /api/auth/provider-signup | POST | ❌ | N/A | ✅ | 0 |
| /api/auth/reset-password | POST | ❌ | N/A | ✅ | 0 |
| /api/auth/signup | POST | ❌ | N/A | 🔴 | 1 |
| /api/auth/verify-email | POST | ❌ | N/A | ✅ | 0 |
| /api/availability | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/blog/:slug | GET | ❌ | N/A | ✅ | 0 |
| /api/blog/categories | GET | ❌ | N/A | ✅ | 0 |
| /api/blog | GET, POST | ✅ | N/A | ✅ | 0 |
| /api/blog/tags | GET | ❌ | N/A | ✅ | 0 |
| /api/bookings/:id/ics | GET | ❌ | ⚠️ | 🟠 | 1 |
| /api/bookings/:id/messages | GET, POST | ❌ | ⚠️ | 🟠 | 2 |
| /api/bookings/:id/notes | GET, PATCH | ❌ | ⚠️ | 🟠 | 1 |
| /api/bookings/:id/reschedule | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/bookings/:id | GET, PATCH, DELETE | ✅ | ⚠️ | ✅ | 0 |
| /api/bookings/instant | POST | ❌ | ⚠️ | 🟠 | 2 |
| /api/bookings/recurring/:id | GET, PATCH, DELETE | ❌ | ⚠️ | 🟠 | 1 |
| /api/bookings/recurring/generate | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/bookings/recurring | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/bookings/reminders/send | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/bookings | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/campaigns/:id/progress | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/campaigns/active | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/campaigns/audience-preview | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/campaigns/launch | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/campaigns | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/careers/apply | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/careers/jobs | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/cleaners/me/dashboard | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/cleaners/me/earnings | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/cleaners/me/jobs | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/cleaners/me/timesheet | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/companies/:id/analytics | GET | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/billing | GET, PUT | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/invoices/:invoiceId/download | GET | ❌ | ⚠️ | 🟠 | 1 |
| /api/companies/:id/invoices | GET, POST | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/jobs/:jobId | PATCH | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/jobs | GET, POST | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/payment-methods/:methodId | PATCH, DELETE | ❌ | ⚠️ | 🟠 | 1 |
| /api/companies/:id/payment-methods | GET, POST | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/properties/:propertyId | GET, PATCH, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/properties | GET, POST | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/reports | GET | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/companies/:id/teams | GET | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/users/:userId | PATCH, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/companies/:id/users | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/companies/me | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/companies/search | GET | ❌ | ⚠️ | 🟠 | 1 |
| /api/companies/slug/:slug | GET | ❌ | ⚠️ | 🟠 | 1 |
| /api/contact | POST | ❌ | N/A | ✅ | 0 |
| /api/customers/:id/addresses/:addressId | PATCH, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/addresses | GET, POST | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/analytics | GET | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/avatar | POST, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/checklists | GET, POST, PATCH, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/favorites | GET, POST, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/payment-methods | GET, POST, DELETE | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/preferences | GET, PATCH | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/profile | GET, PATCH | ✅ | ✅ | ✅ | 0 |
| /api/customers/:id/referrals | GET | ✅ | ✅ | ✅ | 0 |
| /api/domains | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/domains/verify | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/insurance/certificate | GET | ❌ | ⚠️ | 🟠 | 2 |
| /api/insurance/claims/:claimId/documents/:documentId | PATCH | ❌ | ⚠️ | 🟠 | 1 |
| /api/insurance/claims/:claimId/documents | GET, POST, DELETE | ❌ | ⚠️ | 🟠 | 1 |
| /api/insurance/claims/:claimId | GET, PATCH | ❌ | ⚠️ | 🟠 | 2 |
| /api/insurance/claims | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/insurance/plans | GET | ❌ | ⚠️ | 🟠 | 1 |
| /api/insurance/policies | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/integrations/alexa | POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/integrations/cameras | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/integrations/google | POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/integrations/homekit | POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/integrations/ring | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/integrations/smartlocks | POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/integrations/thermostat | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/job-applications/:id | GET, PATCH | ❌ | ⚠️ | 🟡 | 1 |
| /api/job-applications | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/jobs/:id/assign | POST | ❌ | ⚠️ | 🔴 | 2 |
| /api/jobs/:id | GET, PATCH, DELETE | ❌ | ⚠️ | 🔴 | 1 |
| /api/jobs/:id/status | PATCH | ❌ | ⚠️ | 🔴 | 2 |
| /api/jobs | GET, POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/loyalty/achievements/award | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/loyalty/balance | GET | ✅ | ⚠️ | 🔴 | 1 |
| /api/loyalty/earn | POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/loyalty/milestone/ten-booking | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/loyalty/redeem | POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/loyalty/referral/complete | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/loyalty/transactions | GET | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/activate | POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/auto-renew | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/benefits | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/me | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/membership/purchase | POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/renew | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/upgrade | POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/membership/usage | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/newsletter/subscribe | POST, PUT, DELETE | ❌ | N/A | ✅ | 0 |
| /api/ngo/register | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/notifications | GET, PATCH | ✅ | ⚠️ | 🔴 | 1 |
| /api/operations/live-jobs | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/operations/schedule | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/operations/teams | GET, POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/partner/commissions | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/partner/metrics | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/partner/referrals | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/payments/create-intent | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/payouts/process | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/payouts/scheduler/run | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/payouts/statements | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/pricing/quote | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/provider/portfolio | GET, POST, PUT, DELETE | ❌ | ⚠️ | 🟡 | 1 |
| /api/provider/profile/photo | POST, DELETE | ❌ | ⚠️ | 🟡 | 1 |
| /api/provider/services | GET, POST, PUT, DELETE | ❌ | ⚠️ | 🟡 | 1 |
| /api/provider/tax-documents | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/providers/:id/analytics | GET | ❌ | N/A | ✅ | 0 |
| /api/providers/:id | GET, PATCH | ✅ | N/A | 🔴 | 1 |
| /api/providers/:id/stripe-onboard | POST | ❌ | N/A | ✅ | 0 |
| /api/providers/:id/stripe-refresh | POST | ❌ | N/A | ✅ | 0 |
| /api/providers/:id/stripe-status | GET | ❌ | N/A | ✅ | 0 |
| /api/providers/available | GET | ❌ | N/A | ✅ | 0 |
| /api/providers | GET | ❌ | N/A | ✅ | 0 |
| /api/referral/validate | POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/reports/:id/download | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/reports/analytics | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/reports/generate | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/reports/process-scheduled | GET, POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/reports/upload | POST | ✅ | ⚠️ | ✅ | 0 |
| /api/reviews/:id/response | PUT, PATCH, DELETE | ❌ | ⚠️ | 🟠 | 1 |
| /api/reviews | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/audit-logs | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/booking-requests/:id/escalate | POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/booking-requests | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/branding | GET, POST, PATCH | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/companies/:id/credentials | GET, PATCH | ✅ | ⚠️ | 🔴 | 1 |
| /api/root-admin/companies/:id | GET, PATCH | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/companies/:id/status | PATCH | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/companies/:id/verify | PATCH | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/companies | POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/insurance/analytics | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/insurance/plans/:id | PATCH, DELETE | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/insurance/plans | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/insurance/policies/:id | PATCH, DELETE | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/insurance/policies | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/login | POST | ❌ | ⚠️ | 🔴 | 1 |
| /api/root-admin/notifications | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/notifications/templates | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/revenue-share-rules/:id | GET, PATCH, DELETE | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/revenue-share-rules | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/reviews/:id | PATCH | ✅ | ⚠️ | 🔴 | 1 |
| /api/root-admin/reviews | GET | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/settings | GET, PATCH | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/tenant-pricing | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/tenants/:id | PATCH, DELETE | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/tenants | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/territories/:id | PATCH, DELETE | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/territories | GET, POST | ✅ | ⚠️ | ✅ | 0 |
| /api/root-admin/verify-otp | POST | ❌ | ⚠️ | 🔴 | 1 |
| /api/send-email | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/sentry-example-api | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/services | GET | ❌ | N/A | ✅ | 0 |
| /api/stripe/webhook | POST | ❌ | ⚠️ | 🟡 | 1 |
| /api/suggestions | GET | ✅ | ⚠️ | 🔴 | 1 |
| /api/team/stats | GET | ❌ | ⚠️ | 🟡 | 1 |
| /api/team/support-tickets/:id | GET, POST, PATCH | ❌ | ⚠️ | 🟡 | 2 |
| /api/team/support-tickets | GET, POST | ❌ | ⚠️ | 🟡 | 2 |
| /api/transactions/:id/refund | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/transactions/:id/retry | POST | ❌ | ⚠️ | 🟠 | 1 |
| /api/transactions | GET, POST | ✅ | ⚠️ | 🔴 | 1 |
| /api/users/:id | GET, PATCH | ✅ | ⚠️ | 🔴 | 2 |
| /api/users | GET, POST | ✅ | ⚠️ | 🟠 | 1 |
| /api/verification/badge | GET | ✅ | ⚠️ | 🔴 | 1 |
| /api/verification/consent | POST | ❌ | ⚠️ | 🟠 | 2 |
| /api/verification/refresh | POST | ❌ | ⚠️ | 🟠 | 2 |
| /api/verification/start | POST | ❌ | ⚠️ | 🟠 | 2 |
| /api/verification/status | GET | ✅ | ⚠️ | 🔴 | 1 |
| /api/verify-supabase | GET | ❌ | N/A | ✅ | 0 |
| /api/webhooks/:vendor | POST | ❌ | ⚠️ | 🟡 | 2 |

## Recommendations

1. **Fix Critical Issues First:** Address all routes with critical risk level
2. **Add Ownership Verification:** All routes accepting user/resource IDs should verify ownership
3. **Standardize Authentication:** Use `withAuth`, `withAuthAndParams`, or `withRootAdmin` consistently
4. **Review Public Routes:** Ensure all public routes are intentionally public and rate-limited
5. **RLS Policies:** Run `scripts/verify-rls-policies.sql` to verify RLS is enabled on all tables

## Next Steps

1. Review and fix critical issues
2. Run RLS verification script: `psql -f scripts/verify-rls-policies.sql`
3. Create integration tests for unauthorized access
4. Re-run audit after fixes
