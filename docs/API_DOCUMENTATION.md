# API Documentation

**Last Updated:** 2025-01-27  
**Base URL:** `/api`  
**Authentication:** Most endpoints require authentication via Supabase session tokens

---

## Table of Contents

1. [Authentication](#authentication)
2. [Bookings](#bookings)
3. [Services](#services)
4. [Users](#users)
5. [Companies](#companies)
6. [Insurance](#insurance)
7. [Admin](#admin)
8. [Root Admin](#root-admin)
9. [Loyalty & Rewards](#loyalty--rewards)
10. [Integrations](#integrations)
11. [Error Handling](#error-handling)

---

## Authentication

### POST `/api/auth/login`

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Internal server error

---

### POST `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "customer"
}
```

**Response:**
```json
{
  "user": { ... },
  "message": "User created successfully"
}
```

---

### GET `/api/auth/me`

Get the current authenticated user's profile.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer"
  }
}
```

---

### POST `/api/auth/logout`

Log out the current user.

---

### POST `/api/auth/reset-password`

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### POST `/api/auth/verify-email`

Verify an email address with a token.

**Request Body:**
```json
{
  "token": "verification-token"
}
```

---

## Bookings

### GET `/api/bookings`

Get all bookings for a user.

**Query Parameters:**
- `userId` (required) - User ID
- `role` (required) - User role (`customer` or `provider`)

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "service_id": "uuid",
      "booking_date": "2025-01-27",
      "booking_time": "14:00",
      "status": "confirmed",
      "total_amount": 150.00,
      ...
    }
  ]
}
```

---

### POST `/api/bookings`

Create a new booking.

**Request Body:**
```json
{
  "customerId": "uuid",
  "serviceId": "uuid",
  "date": "2025-01-27",
  "time": "14:00",
  "addressId": "uuid",
  "notes": "Optional special instructions"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "customer_id": "uuid",
    "service_id": "uuid",
    "booking_date": "2025-01-27",
    "booking_time": "14:00",
    "total_amount": 150.00,
    ...
  },
  "message": "Booking created successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing required fields or invalid date/time format
- `409` - Requested time is in the past
- `500` - Internal server error

---

### GET `/api/bookings/[id]`

Get a single booking by ID.

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "customer_id": "uuid",
    "service_id": "uuid",
    "services": { ... },
    "addresses": { ... },
    "provider_profiles": { ... },
    ...
  }
}
```

---

### PATCH `/api/bookings/[id]`

Update a booking.

**Request Body:**
```json
{
  "status": "cancelled",
  "notes": "Updated notes"
}
```

---

### POST `/api/bookings/[id]/reschedule`

Reschedule a booking.

**Request Body:**
```json
{
  "date": "2025-01-28",
  "time": "15:00"
}
```

---

### GET `/api/bookings/[id]/ics`

Generate an ICS calendar file for a booking.

**Response:** ICS file download

---

### POST `/api/bookings/instant`

Create an instant booking (immediate service).

**Request Body:**
```json
{
  "customerId": "uuid",
  "serviceId": "uuid",
  "addressId": "uuid"
}
```

---

### GET `/api/bookings/recurring`

Get all recurring bookings.

**Query Parameters:**
- `userId` (required)
- `role` (required)

---

### POST `/api/bookings/recurring`

Create a recurring booking.

**Request Body:**
```json
{
  "customerId": "uuid",
  "serviceId": "uuid",
  "addressId": "uuid",
  "frequency": "weekly",
  "startDate": "2025-01-27",
  "time": "14:00",
  "occurrences": 4
}
```

---

### POST `/api/bookings/reminders/send`

Send booking reminder notifications (admin/cron endpoint).

---

## Services

### GET `/api/services`

Get all active services.

**Query Parameters:**
- `category` (optional) - Filter by category (`residential` or `commercial`)

**Response:**
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Standard Cleaning",
      "category": "residential",
      "base_price": 100.00,
      "is_active": true,
      ...
    }
  ]
}
```

---

## Users

### GET `/api/users`

Get all users (admin only).

**Query Parameters:**
- `role` (optional) - Filter by role
- `tenantId` (optional) - Filter by tenant

---

### POST `/api/users`

Create a new user (admin only).

---

### GET `/api/users/[id]`

Get a user profile by ID.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer",
    "phone": "+1234567890",
    "avatar_url": "https://...",
    ...
  }
}
```

---

## Companies

### GET `/api/companies`

Get all companies.

**Query Parameters:**
- `search` (optional) - Search term
- `verified` (optional) - Filter by verification status

---

### GET `/api/companies/[id]`

Get a company by ID.

**Response:**
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "slug": "company-name",
    "description": "...",
    "is_verified": true,
    ...
  }
}
```

---

### GET `/api/companies/[id]/properties`

Get all properties for a company.

---

### POST `/api/companies/[id]/properties`

Create a new property for a company.

**Request Body:**
```json
{
  "name": "Property Name",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "zip": "12345",
  "property_type": "residential"
}
```

---

### GET `/api/companies/[id]/users`

Get all users for a company.

---

### POST `/api/companies/[id]/users`

Add a user to a company.

---

### GET `/api/companies/[id]/analytics`

Get analytics for a company.

---

### GET `/api/companies/[id]/billing`

Get billing information for a company.

---

### GET `/api/companies/[id]/invoices`

Get all invoices for a company.

---

### GET `/api/companies/search`

Search for companies.

**Query Parameters:**
- `q` (required) - Search query
- `location` (optional) - Location filter

---

## Insurance

### GET `/api/insurance/plans`

Get all insurance plans.

---

### GET `/api/insurance/policies`

Get all insurance policies.

**Query Parameters:**
- `userId` (optional) - Filter by user

---

### POST `/api/insurance/policies`

Create a new insurance policy.

---

### GET `/api/insurance/claims`

Get all insurance claims.

**Query Parameters:**
- `userId` (optional) - Filter by user
- `status` (optional) - Filter by status

---

### POST `/api/insurance/claims`

File a new insurance claim.

**Request Body:**
```json
{
  "policyId": "uuid",
  "incidentDate": "2025-01-27",
  "description": "Claim description",
  "amount": 500.00
}
```

---

### GET `/api/insurance/claims/[claimId]`

Get a claim by ID.

---

### PATCH `/api/insurance/claims/[claimId]`

Update a claim.

---

### POST `/api/insurance/claims/[claimId]/documents`

Upload a document for a claim.

**Request:** Multipart form data with file

---

### GET `/api/insurance/certificate`

Generate an insurance certificate.

**Query Parameters:**
- `policyId` (required)

---

## Admin

### GET `/api/admin/users`

Get all users (admin only).

---

### GET `/api/admin/users/[userId]`

Get a user by ID (admin only).

---

### PATCH `/api/admin/users/[userId]`

Update a user (admin only).

---

### GET `/api/admin/companies`

Get all companies (admin only).

---

### GET `/api/admin/companies/[id]`

Get a company by ID (admin only).

---

### PATCH `/api/admin/companies/[id]`

Update a company (admin only).

---

### POST `/api/admin/companies/[id]/verify`

Verify a company (admin only).

---

### GET `/api/admin/bookings/analytics`

Get booking analytics (admin only).

---

### GET `/api/admin/insurance/plans`

Get all insurance plans (admin only).

---

### POST `/api/admin/insurance/plans`

Create an insurance plan (admin only).

---

### GET `/api/admin/insurance/claims`

Get all insurance claims (admin only).

---

### GET `/api/admin/reports/generate`

Generate a report (admin only).

**Request Body:**
```json
{
  "type": "bookings",
  "startDate": "2025-01-01",
  "endDate": "2025-01-27"
}
```

---

## Root Admin

### POST `/api/root-admin/login`

Login as root admin.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password",
  "otp": "123456"
}
```

---

### POST `/api/root-admin/verify-otp`

Verify OTP for root admin access.

---

### GET `/api/root-admin/tenants`

Get all tenants (root admin only).

---

### GET `/api/root-admin/companies`

Get all companies across all tenants (root admin only).

---

### GET `/api/root-admin/audit-logs`

Get audit logs (root admin only).

**Query Parameters:**
- `actor` (optional) - Filter by actor
- `entity` (optional) - Filter by entity type
- `action` (optional) - Filter by action
- `startDate` (optional)
- `endDate` (optional)

---

## Loyalty & Rewards

### GET `/api/loyalty/balance`

Get loyalty points balance for a user.

**Query Parameters:**
- `userId` (required)

**Response:**
```json
{
  "balance": 1500,
  "tier": "gold"
}
```

---

### POST `/api/loyalty/earn`

Earn loyalty points.

**Request Body:**
```json
{
  "userId": "uuid",
  "points": 100,
  "reason": "booking_completed"
}
```

---

### POST `/api/loyalty/redeem`

Redeem loyalty points.

**Request Body:**
```json
{
  "userId": "uuid",
  "points": 500,
  "rewardId": "uuid"
}
```

---

### GET `/api/loyalty/transactions`

Get loyalty transaction history.

**Query Parameters:**
- `userId` (required)

---

## Integrations

### POST `/api/integrations/alexa`

Handle Alexa integration requests.

---

### POST `/api/integrations/google`

Handle Google Home integration requests.

---

### POST `/api/integrations/homekit`

Handle HomeKit integration requests.

---

### POST `/api/integrations/ring`

Handle Ring camera integration requests.

---

### POST `/api/integrations/smartlocks`

Handle smart lock integration requests.

---

### POST `/api/integrations/cameras`

Handle camera integration requests.

---

### POST `/api/integrations/thermostat`

Handle thermostat integration requests.

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate resource)
- `500` - Internal Server Error

**Error Response Example:**
```json
{
  "error": "Missing required fields"
}
```

---

## Authentication & Authorization

Most endpoints require authentication via Supabase session tokens. Include the session token in the request:

**Headers:**
```
Authorization: Bearer <session-token>
```

Or use cookies if using browser-based authentication.

**Role-Based Access:**
- `customer` - Can access customer-specific endpoints
- `provider` - Can access provider-specific endpoints
- `admin` - Can access admin endpoints
- `root-admin` - Can access root admin endpoints

---

## Rate Limiting

API endpoints may be rate-limited to prevent abuse. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Multi-Tenant Support

The API supports multi-tenant architecture. Tenant context is resolved from:
1. `x-tenant-id` header (highest priority)
2. `tenantId` query parameter
3. Subdomain from `Host` header (e.g., `acme.example.com` → tenant `acme`)

Most endpoints automatically scope data to the resolved tenant.

---

## Webhooks

### POST `/api/stripe/webhook`

Stripe webhook endpoint for payment events.

**Headers:**
- `stripe-signature` - Stripe signature for verification

---

### POST `/api/webhooks/[vendor]`

Generic webhook endpoint for third-party integrations.

**Supported Vendors:**
- `stripe`
- `twilio`
- `sendgrid`

---

## Testing

API endpoints can be tested using:
- Postman/Insomnia
- cURL
- The built-in test suite (`tests/api-routes-accessible.test.ts`)

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/services?category=residential" \
  -H "Authorization: Bearer <token>"
```

---

## Support

For API support or questions:
- Check the error message in the response
- Review the request format and required parameters
- Verify authentication credentials
- Contact support if issues persist

