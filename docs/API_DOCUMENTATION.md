# API Documentation

**Last Updated:** 2025-11-22  
**Base URL:** `/api`  
**Total Endpoints:** 250  
**Authentication:** Most endpoints require authentication via Supabase session tokens

---

## Table of Contents

1. [About](#about)
2. [Admin](#admin)
3. [Agency](#agency)
4. [Ambassador](#ambassador)
5. [Analytics](#analytics)
6. [Auth](#auth)
7. [Availability](#availability)
8. [Blog](#blog)
9. [Bookings](#bookings)
10. [Campaigns](#campaigns)
11. [Careers](#careers)
12. [Cleaners](#cleaners)
13. [Companies](#companies)
14. [Contact](#contact)
15. [Cron](#cron)
16. [Customers](#customers)
17. [Domains](#domains)
18. [Emails](#emails)
19. [Health](#health)
20. [Insurance](#insurance)
21. [Integrations](#integrations)
22. [Job-applications](#job-applications)
23. [Jobs](#jobs)
24. [Loyalty](#loyalty)
25. [Membership](#membership)
26. [Monitoring](#monitoring)
27. [Newsletter](#newsletter)
28. [Ngo](#ngo)
29. [Notifications](#notifications)
30. [Operations](#operations)
31. [Partner](#partner)
32. [Payments](#payments)
33. [Payouts](#payouts)
34. [Performance](#performance)
35. [Pricing](#pricing)
36. [Provider](#provider)
37. [Providers](#providers)
38. [Referral](#referral)
39. [Reports](#reports)
40. [Reviews](#reviews)
41. [Root-admin](#root-admin)
42. [Send-email](#send-email)
43. [Services](#services)
44. [Stripe](#stripe)
45. [Suggestions](#suggestions)
46. [Team](#team)
47. [Tenants](#tenants)
48. [Transactions](#transactions)
49. [Users](#users)
50. [Verification](#verification)
51. [Verify-integrations](#verify-integrations)
52. [Verify-supabase](#verify-supabase)
53. [Webhooks](#webhooks)

---

## About

### GET `/api/about/locations`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/about/press`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/about/stats`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/about/team`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/about/timeline`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Admin

### GET, PATCH `/api/admin/bookings`

**Authentication:** Admin Required

**Parameters:**
- `bookingIds`
- `status`
- `notes`
- `status (query)`
- `startDate (query)`
- `endDate (query)`
- `customerId (query)`
- `providerId (query)`
- `serviceId (query)`
- `search (query)`
- `page (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/bookings/analytics`

**Authentication:** Admin Required

**Parameters:**
- `startDate (query)`
- `endDate (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/admin/companies/:id/message`

**Authentication:** Admin Required

**Parameters:**
- `channel`
- `subject`
- `message`
- `recipientEmail`
- `recipientPhone`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/admin/companies/:id/verify`

**Authentication:** Admin Required

**Parameters:**
- `verified`
- `notes`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/insurance/analytics`

**Authentication:** Admin Required

**Parameters:**
- `period (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/insurance/claims`

**Authentication:** Admin Required

**Parameters:**
- `status (query)`
- `search (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/admin/insurance/claims/:id`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/admin/insurance/claims/:id/activities`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/insurance/plans`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/admin/insurance/policies`

**Authentication:** Admin Required

**Parameters:**
- `status (query)`
- `search (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/admin/insurance/policies/:id`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/admin/message-templates`

**Authentication:** Admin Required

**Parameters:**
- `name`
- `type`
- `subject`
- `content`
- `variables`
- `type (query)`
- `search (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/admin/message-templates/:templateId`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/admin/messages`

**Authentication:** Admin Required

**Parameters:**
- `participant_1_id`
- `participant_2_id`
- `content`
- `search (query)`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, PATCH `/api/admin/messages/:conversationId`

**Authentication:** Admin Required

**Parameters:**
- `sender_id`
- `recipient_id`
- `content`
- `user_id`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/reports/:id/download`

GET /api/admin/reports/[id]/download

**Authentication:** Admin Required

**Parameters:**
- `format (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/reports/analytics`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/admin/reports/generate`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, DELETE `/api/admin/reports/schedules`

**Authentication:** Admin Required

**Parameters:**
- `id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/admin/reports/templates`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/stats`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/admin/users`

**Authentication:** Admin Required

**Parameters:**
- `role (query)`
- `search (query)`
- `status (query)`
- `page (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/admin/users/:userId`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/users/:userId/activity`

**Authentication:** Admin Required

**Parameters:**
- `page (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/admin/users/:userId/message`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/admin/verifications`

**Authentication:** Admin Required

**Parameters:**
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/admin/verifications/:id`

**Authentication:** Admin Required

**Parameters:**
- `status`
- `notes`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Agency

### GET, POST `/api/agency/candidates`

**Authentication:** None (Public endpoint)

**Parameters:**
- `agencyId (query)`
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/agency/messages`

**Authentication:** None (Public endpoint)

**Parameters:**
- `agencyId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/agency/placements`

**Authentication:** None (Public endpoint)

**Parameters:**
- `agencyId (query)`
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/agency/placements/:id`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/agency/reports`

**Authentication:** None (Public endpoint)

**Parameters:**
- `agencyId (query)`
- `type (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Ambassador

### GET `/api/ambassador/jobs`

**Authentication:** None (Public endpoint)

**Parameters:**
- `ambassadorId (query)`
- `date (query)`
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/ambassador/jobs/:id/assign`

**Authentication:** None (Public endpoint)

**Parameters:**
- `providerId`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/ambassador/performance`

**Authentication:** None (Public endpoint)

**Parameters:**
- `ambassadorId (query)`
- `period (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, DELETE `/api/ambassador/team`

**Authentication:** None (Public endpoint)

**Parameters:**
- `ambassadorId`
- `email`
- `name`
- `phone`
- `ambassadorId (query)`
- `memberId (query)`
- `ambassadorId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Analytics

### GET `/api/analytics/dashboard`

Analytics dashboard API endpoint

**Authentication:** None (Public endpoint)

**Parameters:**
- `startDate (query)`
- `endDate (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST, GET `/api/analytics/track`

API endpoint for tracking analytics events

**Authentication:** User Required

**Parameters:**
- `eventName`
- `eventCategory`
- `eventLabel`
- `value`
- `metadata`
- `sessionId`
- ``
- `startDate (query)`
- `endDate (query)`
- `eventName (query)`
- `eventCategory (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Auth

### POST `/api/auth/complete-social-signup`

**Authentication:** User Required

**Parameters:**
- `email`
- `fullName`
- `role`
- `referralCode`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/auth/login`

**Authentication:** None (Public endpoint)

**Parameters:**
- `email`
- `password`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/auth/logout`

**Authentication:** None (Public endpoint)

**Parameters:**
- `refresh_token: refreshToken`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/auth/me`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/auth/provider-signup`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/auth/reset-password`

POST /api/auth/reset-password

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/auth/signup`

**Authentication:** None (Public endpoint)

**Parameters:**
- `email`
- `password`
- `name`
- `role`
- `referralCode`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/auth/verify-email`

POST /api/auth/verify-email

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Availability

### GET, POST `/api/availability`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Blog

### POST, GET `/api/blog`

**Authentication:** Admin Required

**Parameters:**
- `category (query)`
- `tag (query)`
- `search (query)`
- `status (query)`
- `page (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/blog/:slug`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/blog/categories`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/blog/tags`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Bookings

### GET, POST `/api/bookings`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH, DELETE `/api/bookings/:id`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/bookings/:id/ics`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/bookings/:id/messages`

**Authentication:** None (Public endpoint)

**Parameters:**
- `message`
- `recipientPhone`
- `recipientEmail`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/bookings/:id/notes`

**Authentication:** None (Public endpoint)

**Parameters:**
- `notes`
- `specialInstructions`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/bookings/:id/reschedule`

Reschedule a booking to a new date and/or time

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/bookings/instant`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/bookings/recurring`

**Authentication:** User Required

**Parameters:**
- `userId (query)`
- `role (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH, DELETE `/api/bookings/recurring/:id`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/bookings/recurring/generate`

Generate upcoming booking instances for active recurring bookings

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/bookings/reminders/send`

API endpoint to send booking reminder emails.

**Authentication:** None (Public endpoint)

**Parameters:**
- `type (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Campaigns

### POST, GET `/api/campaigns`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/campaigns/:id/progress`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/campaigns/active`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/campaigns/audience-preview`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/campaigns/launch`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Careers

### POST `/api/careers/apply`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/careers/jobs`

**Authentication:** None (Public endpoint)

**Parameters:**
- `category (query)`
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Cleaners

### GET `/api/cleaners/me/dashboard`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/cleaners/me/earnings`

**Authentication:** None (Public endpoint)

**Parameters:**
- `period (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/cleaners/me/jobs`

**Authentication:** None (Public endpoint)

**Parameters:**
- `status (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/cleaners/me/timesheet`

**Authentication:** None (Public endpoint)

**Parameters:**
- `startDate (query)`
- `endDate (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Companies

### GET `/api/companies/:id`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/:id/analytics`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PUT `/api/companies/:id/billing`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/companies/:id/invoices`

**Authentication:** User Required

**Parameters:**
- `status (query)`
- `payment_status (query)`
- `start_date (query)`
- `end_date (query)`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/:id/invoices/:invoiceId/download`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/companies/:id/jobs`

**Authentication:** User Required

**Parameters:**
- `status (query)`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/companies/:id/jobs/:jobId`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/companies/:id/payment-methods`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/companies/:id/payment-methods/:methodId`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/:id/performance`

**Authentication:** User Required

**Parameters:**
- `period (query)`
- `details (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/companies/:id/properties`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH, DELETE `/api/companies/:id/properties/:propertyId`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/companies/:id/reports`

**Authentication:** User Required

**Parameters:**
- `type (query)`
- `timeframe (query)`
- `propertyId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/companies/:id/reports/export`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, PATCH, DELETE `/api/companies/:id/reports/schedules`

**Authentication:** User Required

**Parameters:**
- `scheduleId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/:id/teams`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/:id/usage-metrics`

**Authentication:** User Required

**Parameters:**
- `period (query)`
- `granularity (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/companies/:id/users`

**Authentication:** User Required

**Parameters:**
- `status (query)`
- `role (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/companies/:id/users/:userId`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/me`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/search`

**Authentication:** None (Public endpoint)

**Parameters:**
- `q (query)`
- `lat (query)`
- `lng (query)`
- `radiusMi (query)`
- `minRating (query)`
- `verifiedOnly (query)`
- `limit (query)`
- `offset (query)`
- `sort (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/companies/slug/:slug`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Contact

### POST `/api/contact`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Cron

### GET `/api/cron/aggregate-metrics`

Cron job endpoint to aggregate API metrics hourly

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Customers

### GET, POST `/api/customers/:id/addresses`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/customers/:id/addresses/:addressId`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/customers/:id/analytics`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST, DELETE `/api/customers/:id/avatar`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, PATCH, DELETE `/api/customers/:id/checklists`

**Authentication:** User Required

**Parameters:**
- `id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, DELETE `/api/customers/:id/favorites`

**Authentication:** User Required

**Parameters:**
- `provider_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, DELETE `/api/customers/:id/payment-methods`

**Authentication:** User Required

**Parameters:**
- `paymentMethodId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/customers/:id/preferences`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/customers/:id/profile`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/customers/:id/referrals`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Domains

### POST, GET `/api/domains`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/domains/verify`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Emails

### GET `/api/emails/preview`

GET /api/emails/preview

**Authentication:** User Required

**Parameters:**
- `template (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/emails/stats`

GET /api/emails/stats

**Authentication:** User Required

**Parameters:**
- `period (query)`
- `type (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/emails/test`

POST /api/emails/test

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Health

### GET `/api/health`

GET /api/health

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Insurance

### GET `/api/insurance/certificate`

**Authentication:** None (Public endpoint)

**Parameters:**
- `policy_id (query)`
- `policy_number (query)`
- `user_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/insurance/claims`

**Authentication:** User Required

**Parameters:**
- `user_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/insurance/claims/:claimId`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, DELETE `/api/insurance/claims/:claimId/documents`

**Authentication:** None (Public endpoint)

**Parameters:**
- `documentId (query)`
- `path (query)`
- `documentId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/insurance/claims/:claimId/documents/:documentId`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/insurance/plans`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/insurance/policies`

**Authentication:** User Required

**Parameters:**
- `user_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Integrations

### POST `/api/integrations/alexa`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/integrations/cameras`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/integrations/google`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/integrations/homekit`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/integrations/ring`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/integrations/smartlocks`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/integrations/thermostat`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Job-applications

### GET, POST `/api/job-applications`

**Authentication:** None (Public endpoint)

**Parameters:**
- `jobListingId (query)`
- `applicantEmail (query)`
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/job-applications/:id`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Jobs

### POST, GET `/api/jobs`

**Authentication:** Admin Required

**Parameters:**
- `category (query)`
- `department (query)`
- `employmentType (query)`
- `locationType (query)`
- `search (query)`
- `includeInactive (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH, DELETE `/api/jobs/:id`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/jobs/:id/assign`

**Authentication:** Admin Required

**Parameters:**
- `providerId`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/jobs/:id/status`

**Authentication:** Admin Required

**Parameters:**
- `status`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/jobs/:id/status-history`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Loyalty

### GET `/api/loyalty/achievements`

**Authentication:** User Required

**Parameters:**
- `user_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/loyalty/achievements/award`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/loyalty/balance`

**Authentication:** User Required

**Parameters:**
- `user_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/loyalty/earn`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/loyalty/milestone/ten-booking`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/loyalty/redeem`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/loyalty/referral/complete`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/loyalty/referrals`

**Authentication:** User Required

**Parameters:**
- `user_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/loyalty/transactions`

**Authentication:** User Required

**Parameters:**
- `user_id (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Membership

### POST `/api/membership/activate`

**Authentication:** User Required

**Parameters:**
- `activationCode`
- `cardId`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST, GET `/api/membership/auto-renew`

POST /api/membership/auto-renew

**Authentication:** User Required

**Parameters:**
- `cardId`
- `autoRenew`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/membership/benefits`

GET /api/membership/benefits

**Authentication:** User Required

**Parameters:**
- `bookingId`
- `benefitType`
- `amount`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/membership/me`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/membership/purchase`

**Authentication:** User Required

**Parameters:**
- `tier`
- `paymentIntentId`
- `designType`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST, GET `/api/membership/renew`

POST /api/membership/renew

**Authentication:** User Required

**Parameters:**
- `cardId`
- `paymentIntentId`
- `autoRenew`
- `cardId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/membership/upgrade`

**Authentication:** User Required

**Parameters:**
- `newTier`
- `cardId`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/membership/usage`

**Authentication:** User Required

**Parameters:**
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Monitoring

### GET `/api/monitoring/database`

GET /api/monitoring/database

**Authentication:** User Required

**Parameters:**
- `timeWindow (query)`
- `includeSlowQueries (query)`
- `includeFailedQueries (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/monitoring/performance`

GET /api/monitoring/performance

**Authentication:** User Required

**Parameters:**
- `timeRange (query)`
- `type (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Newsletter

### POST, PUT, DELETE `/api/newsletter/subscribe`

**Authentication:** None (Public endpoint)

**Parameters:**
- `token (query)`
- `token (query)`
- `email (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Ngo

### POST `/api/ngo/register`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Notifications

### GET, PATCH `/api/notifications`

**Authentication:** User Required

**Parameters:**
- `notificationId`
- `userId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Operations

### GET `/api/operations/activity`

**Authentication:** Admin Required

**Parameters:**
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/operations/auto-assign`

**Authentication:** None (Public endpoint)

**Parameters:**
- `jobIds`
- `strategy`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/operations/live-jobs`

**Authentication:** None (Public endpoint)

**Parameters:**
- `date (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/operations/schedule`

**Authentication:** None (Public endpoint)

**Parameters:**
- `startDate (query)`
- `endDate (query)`
- `providerId (query)`
- `teamId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/operations/stats`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/operations/teams`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST, DELETE `/api/operations/teams/:id/members`

**Authentication:** None (Public endpoint)

**Parameters:**
- `userId`
- `role`
- `userId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Partner

### GET `/api/partner/commissions`

**Authentication:** None (Public endpoint)

**Parameters:**
- `partnerId (query)`
- `period (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/partner/metrics`

**Authentication:** None (Public endpoint)

**Parameters:**
- `partnerId (query)`
- `period (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/partner/referrals`

**Authentication:** None (Public endpoint)

**Parameters:**
- `partnerId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Payments

### POST `/api/payments/create-intent`

Create a Stripe Payment Intent

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Payouts

### POST `/api/payouts/process`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/payouts/scheduler/run`

Cron job endpoint to process batch payouts

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/payouts/statements`

**Authentication:** None (Public endpoint)

**Parameters:**
- `providerId (query)`
- `companyId (query)`
- `start (query)`
- `end (query)`
- `format (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Performance

### GET, POST `/api/performance/metrics`

POST /api/performance/metrics

**Authentication:** User Required

**Parameters:**
- `metric_name (query)`
- `metric_type (query)`
- `endpoint_path (query)`
- `status (query)`
- `start_date (query)`
- `end_date (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/performance/summary`

GET /api/performance/summary

**Authentication:** User Required

**Parameters:**
- `days (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Pricing

### POST `/api/pricing/quote`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Provider

### GET, POST, PUT, DELETE `/api/provider/portfolio`

**Authentication:** None (Public endpoint)

**Parameters:**
- `providerId`
- `itemId`
- `title`
- `description`
- `file`
- `providerId (query)`
- `providerId (query)`
- `itemId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST, DELETE `/api/provider/profile/photo`

**Authentication:** None (Public endpoint)

**Parameters:**
- `providerId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, PUT, DELETE `/api/provider/services`

**Authentication:** None (Public endpoint)

**Parameters:**
- `providerId`
- `service`
- `serviceId`
- `service`
- `providerId (query)`
- `serviceId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/provider/tax-documents`

**Authentication:** None (Public endpoint)

**Parameters:**
- `providerId (query)`
- `year (query)`
- `format (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Providers

### GET `/api/providers`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, GET `/api/providers/:id`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/providers/:id/analytics`

**Authentication:** None (Public endpoint)

**Parameters:**
- `dateRange (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/providers/:id/stripe-onboard`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/providers/:id/stripe-refresh`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/providers/:id/stripe-status`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/providers/available`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Referral

### POST `/api/referral/validate`

**Authentication:** None (Public endpoint)

**Parameters:**
- `referralCode`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Reports

### GET `/api/reports/:id/download`

GET /api/reports/[id]/download

**Authentication:** User Required

**Parameters:**
- `format (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/reports/analytics`

GET /api/reports/analytics

**Authentication:** None (Public endpoint)

**Parameters:**
- `companyId (query)`
- `startDate (query)`
- `endDate (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/reports/generate`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/reports/process-scheduled`

Cron job endpoint to process scheduled reports

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/reports/upload`

POST /api/reports/upload

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Reviews

### POST, GET `/api/reviews`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, PUT, DELETE `/api/reviews/:id/response`

**Authentication:** None (Public endpoint)

**Parameters:**
- `response`
- `response`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Root-admin

### GET `/api/root-admin/audit-logs`

**Authentication:** Root Admin Required

**Parameters:**
- `resource (query)`
- `resourceId (query)`
- `action (query)`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/root-admin/booking-requests`

**Authentication:** Root Admin Required

**Parameters:**
- `status (query)`
- `slaFilter (query)`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/root-admin/booking-requests/:id/escalate`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, PATCH `/api/root-admin/branding`

**Authentication:** Root Admin Required

**Parameters:**
- `tenantId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/root-admin/companies`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/root-admin/companies/:id`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/root-admin/companies/:id/credentials`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/root-admin/companies/:id/status`

**Authentication:** Root Admin Required

**Parameters:**
- `status`
- `reason`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/root-admin/companies/:id/verify`

**Authentication:** Root Admin Required

**Parameters:**
- `verified`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/root-admin/insurance/analytics`

**Authentication:** Root Admin Required

**Parameters:**
- `period (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/insurance/plans`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/root-admin/insurance/plans/:id`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/insurance/policies`

**Authentication:** Root Admin Required

**Parameters:**
- `status (query)`
- `tenant_id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/root-admin/insurance/policies/:id`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/root-admin/login`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/root-admin/metrics`

**Authentication:** Admin Required

**Parameters:**
- `timeRange (query)`
- `endpoint (query)`
- `tenantId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST, DELETE `/api/root-admin/metrics/thresholds`

**Authentication:** Admin Required

**Parameters:**
- `tenantId (query)`
- `id (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/notifications`

**Authentication:** Root Admin Required

**Parameters:**
- `status (query)`
- `type (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/notifications/templates`

**Authentication:** Root Admin Required

**Parameters:**
- `type (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/revenue-share-rules`

Validate revenue share rule input

**Authentication:** Root Admin Required

**Parameters:**
- `tenant_id (query)`
- `provider_id (query)`
- `service_id (query)`
- `territory_id (query)`
- `active (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH, DELETE `/api/root-admin/revenue-share-rules/:id`

GET /api/root-admin/revenue-share-rules/[id]

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/root-admin/reviews`

**Authentication:** Root Admin Required

**Parameters:**
- `status (query)`
- `rating (query)`
- `limit (query)`
- `offset (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH `/api/root-admin/reviews/:id`

**Authentication:** Root Admin Required

**Parameters:**
- `action`
- `reason`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/root-admin/settings`

**Authentication:** Root Admin Required

**Parameters:**
- `category (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/tenant-pricing`

**Authentication:** Root Admin Required

**Parameters:**
- `tenantId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/tenants`

**Authentication:** Root Admin Required

**Parameters:**
- `q (query)`
- `status (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/root-admin/tenants/:id`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/root-admin/territories`

**Authentication:** Root Admin Required

**Parameters:**
- `tenantId (query)`
- `active (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### PATCH, DELETE `/api/root-admin/territories/:id`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/root-admin/verify-otp`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Send-email

### POST `/api/send-email`

**Authentication:** None (Public endpoint)

**Parameters:**
- `to`
- `subject`
- `html`
- `text`
- `from`
- `replyTo`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Services

### GET `/api/services`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Stripe

### POST `/api/stripe/webhook`

Helper function to log webhook events to webhook_events table

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Suggestions

### GET `/api/suggestions`

**Authentication:** User Required

**Parameters:**
- `userId (query)`
- `role (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Team

### GET `/api/team/stats`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, POST `/api/team/support-tickets`

**Authentication:** None (Public endpoint)

**Parameters:**
- `status (query)`
- `priority (query)`
- `category (query)`
- `assigned_to (query)`
- `page (query)`
- `limit (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH, POST `/api/team/support-tickets/:id`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Tenants

### GET `/api/tenants/:id/analytics`

**Authentication:** Root Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Transactions

### GET, POST `/api/transactions`

**Authentication:** User Required

**Parameters:**
- `bookingId`
- `amount`
- `paymentMethodId`
- `paymentIntentId`
- `role (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/transactions/:id/refund`

Process a refund for a transaction

**Authentication:** None (Public endpoint)

**Parameters:**
- `amount`
- `reason = 'requested_by_customer'`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/transactions/:id/retry`

Retry a failed payment

**Authentication:** None (Public endpoint)

**Parameters:**
- `paymentMethodId`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Users

### GET, POST `/api/users`

**Authentication:** Admin Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### GET, PATCH `/api/users/:id`

**Authentication:** User Required

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Verification

### GET `/api/verification/badge`

**Authentication:** User Required

**Parameters:**
- `userId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/verification/consent`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/verification/refresh`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/verification/start`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### GET `/api/verification/status`

**Authentication:** User Required

**Parameters:**
- `userId (query)`

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Verify-integrations

### GET `/api/verify-integrations`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Verify-supabase

### GET `/api/verify-supabase`

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Webhooks

### POST `/api/webhooks/:vendor`

Helper function to log webhook events to webhook_events table

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/webhooks/email`

POST /api/webhooks/email

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

### POST `/api/webhooks/whatsapp`

WhatsApp Webhook Endpoint

**Authentication:** None (Public endpoint)

**Response Format:** JSON

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication & Authorization

Most endpoints require authentication via Supabase session tokens. Include the session token in the request:

**Headers:**
```
Authorization: Bearer <session-token>
```

**Authentication Levels:**
- **Public:** No authentication required
- **User:** Requires valid user session
- **Admin:** Requires admin privileges (roles: PARTNER_ADMIN, TSMART_TEAM, CLEANING_COMPANY)
- **Root Admin:** Requires root admin access with OTP verification

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

**Common Error Codes:**
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

Public endpoints are rate-limited to prevent abuse. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Multi-Tenant Support

The API supports multi-tenant architecture. Tenant context is resolved from:
1. `x-tenant-id` header (highest priority)
2. `tenantId` query parameter
3. Subdomain from `Host` header (e.g., `acme.example.com` → tenant `acme`)

Most endpoints automatically scope data to the resolved tenant.

---

## Security

- All authenticated endpoints use Row Level Security (RLS) policies
- Ownership verification is enforced for user-specific resources
- Admin routes require proper role verification
- Input validation and sanitization is applied
- CORS policies are enforced
- Rate limiting prevents abuse

---

## Testing

API endpoints can be tested using:
- The built-in test suite (`npm run test:api`)
- Postman/Insomnia collections
- cURL commands
- The verification scripts in `/scripts`

**Example cURL:**
```bash
curl -X GET "https://yourdomain.com/api/services" \
  -H "Authorization: Bearer <token>"
```

---

## Support

For API support:
1. Check the error message in the response
2. Verify request format and required parameters
3. Confirm authentication credentials
4. Review the endpoint documentation above
5. Check the security audit reports for known issues

**Documentation Generated:** 2025-11-22
**Total Endpoints Documented:** 250
