# Gamification API Documentation

## Overview

The Gamification API provides endpoints for managing points, badges, levels, leaderboards, and challenges in the TSmartCleaning platform. All endpoints require authentication and respect tenant isolation.

**Base URL:** `/api/gamification`

**Authentication:** All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

**Tenant Isolation:** All endpoints automatically filter data by tenant context from the request headers or cookies.

---

## Points API

### Get Points Balance

Get the current points balance and level information for a user.

**Endpoint:** `GET /api/gamification/points`

**Query Parameters:**
- `user_id` (optional, UUID): User ID to query. Defaults to authenticated user. Admins can query any user.

**Response:**
```json
{
  "points": 1250,
  "level": 3,
  "levelName": "Gold Partner",
  "progress": 0.65,
  "pointsToNext": 500
}
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User trying to access another user's data without admin privileges
- `404 Not Found`: Gamification account not found

---

### Award Points

Award points to a user for completing an action. **Admin only.**

**Endpoint:** `POST /api/gamification/points`

**Request Body:**
```json
{
  "userId": "uuid",
  "userType": "company" | "cleaner",
  "action": "booking_completed" | "review_received" | "badge_earned" | "referral_completed" | "profile_completed" | "custom",
  "sourceId": "uuid (optional)",
  "metadata": { "key": "value" },
  "customPoints": 100
}
```

**Response:**
```json
{
  "success": true,
  "points": 50,
  "newTotal": 1300
}
```

**Status Codes:**
- `200 OK`: Points awarded successfully
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user
- `500 Internal Server Error`: Failed to award points

---

### Get Points History

Get transaction history for a user's points.

**Endpoint:** `GET /api/gamification/points/history`

**Query Parameters:**
- `user_id` (optional, UUID): User ID to query. Defaults to authenticated user.
- `limit` (optional, number): Number of records to return. Default: 50, Max: 100
- `offset` (optional, number): Number of records to skip. Default: 0
- `action` (optional, string): Filter by action type

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_type": "company",
      "points": 50,
      "action": "booking_completed",
      "source_id": "uuid",
      "metadata": {},
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User trying to access another user's data without admin privileges

---

## Badges API

### Get Badges

Get available badges or user's earned badges.

**Endpoint:** `GET /api/gamification/badges`

**Query Parameters:**
- `user_id` (optional, UUID): If provided, returns badges earned by this user
- `user_type` (required if `user_id` not provided): `"company"` or `"cleaner"`

**Response (All Badges):**
```json
{
  "badges": [
    {
      "id": "uuid",
      "code": "first_booking",
      "name": "First Timer",
      "description": "Complete your first booking",
      "icon": "🌟",
      "badge_type": "company",
      "criteria": {
        "type": "jobs",
        "threshold": 1
      },
      "bonus_points": 100
    }
  ]
}
```

**Response (User Badges):**
```json
{
  "badges": [
    {
      "badge_id": "uuid",
      "code": "first_booking",
      "name": "First Timer",
      "earned_at": "2024-01-15T10:30:00Z",
      "metadata": {}
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Missing required parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User trying to access another user's data without admin privileges

---

### Create Badge

Create a new badge. **Admin only.**

**Endpoint:** `POST /api/gamification/badges`

**Request Body:**
```json
{
  "code": "unique_badge_code",
  "name": "Badge Name",
  "description": "Badge description",
  "icon": "🌟",
  "userType": "company" | "cleaner",
  "criteria": {
    "type": "points" | "jobs" | "ratings" | "streak" | "referrals" | "custom",
    "threshold": 10,
    "metadata": {}
  },
  "pointsReward": 50
}
```

**Response:**
```json
{
  "success": true,
  "badge": {
    "id": "uuid",
    "code": "unique_badge_code",
    "name": "Badge Name",
    ...
  }
}
```

**Status Codes:**
- `200 OK`: Badge created successfully
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user
- `409 Conflict`: Badge code already exists

---

### Award Badge

Manually award a badge to a user. **Admin only.**

**Endpoint:** `POST /api/gamification/badges/award`

**Request Body:**
```json
{
  "userId": "uuid",
  "userType": "company" | "cleaner",
  "badgeCode": "badge_code"
}
```

**Response:**
```json
{
  "success": true,
  "badge": { ... }
}
```

**Status Codes:**
- `200 OK`: Badge awarded successfully
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Badge not found or user not found

---

## Levels API

### Get Levels

Get user's current level or all available levels.

**Endpoint:** `GET /api/gamification/levels`

**Query Parameters:**
- `user_id` (optional, UUID): If provided, returns this user's level
- `user_type` (required if `user_id` not provided): `"company"` or `"cleaner"`

**Response (User Level):**
```json
{
  "level": 3,
  "levelName": "Gold Partner",
  "points": 1250,
  "pointsToNext": 500,
  "progress": 0.65
}
```

**Response (All Levels):**
```json
{
  "levels": [
    {
      "level_number": 1,
      "level_name": "Bronze Partner",
      "points_threshold": 0,
      "rewards": {}
    },
    {
      "level_number": 2,
      "level_name": "Silver Partner",
      "points_threshold": 500,
      "rewards": {}
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Missing required parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User trying to access another user's data without admin privileges
- `404 Not Found`: User level not found

---

## Leaderboards API

### Get Leaderboard

Get leaderboard rankings for a specific type and timeframe.

**Endpoint:** `GET /api/gamification/leaderboards`

**Query Parameters:**
- `type` (required): `"points"` | `"jobs"` | `"ratings"` | `"referrals"`
- `timeframe` (required): `"daily"` | `"weekly"` | `"monthly"` | `"all_time"`
- `userType` (required): `"company"` | `"cleaner"`
- `limit` (optional, number): Number of entries to return. Default: 100, Max: 100
- `offset` (optional, number): Number of entries to skip. Default: 0
- `userId` (optional, UUID): If provided, returns only this user's rank

**Response (Full Leaderboard):**
```json
{
  "type": "points",
  "timeframe": "monthly",
  "user_type": "company",
  "entries": [
    {
      "rank": 1,
      "user_id": "uuid",
      "user_name": "Company Name",
      "user_type": "company",
      "score": 5000,
      "metadata": {
        "points": 5000,
        "level": 5
      }
    }
  ],
  "generated_at": "2024-01-15T10:30:00Z",
  "total_participants": 150
}
```

**Response (User Rank):**
```json
{
  "rank": 15,
  "user_id": "uuid",
  "user_name": "Company Name",
  "score": 1250,
  "metadata": {}
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Missing or invalid query parameters
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: User not found in leaderboard (when querying specific user)

---

### Refresh Leaderboard

Manually refresh a leaderboard cache. **Admin only.**

**Endpoint:** `POST /api/gamification/leaderboards/refresh`

**Request Body:**
```json
{
  "type": "points",
  "timeframe": "monthly",
  "userType": "company"
}
```

**Response:**
```json
{
  "success": true,
  "leaderboard_id": "uuid",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200 OK`: Leaderboard refreshed successfully
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user

---

## Challenges API

### Get Challenges

Get active challenges or user's challenges.

**Endpoint:** `GET /api/gamification/challenges`

**Query Parameters:**
- `user_id` (optional, UUID): If provided, returns challenges for this user
- `user_type` (required if `user_id` not provided): `"company"` | `"cleaner"`

**Response:**
```json
{
  "challenges": [
    {
      "id": "uuid",
      "name": "January Challenge",
      "description": "Complete 10 jobs this month",
      "challenge_type": "jobs",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "criteria": {
        "type": "jobs",
        "target": 10
      },
      "rewards": [
        {
          "type": "points",
          "value": 500
        }
      ],
      "status": "active",
      "progress": {
        "current": 7,
        "target": 10
      }
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Missing required parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User trying to access another user's data without admin privileges

---

### Create Challenge

Create a new challenge. **Admin only.**

**Endpoint:** `POST /api/gamification/challenges`

**Request Body:**
```json
{
  "action": "create",
  "name": "January Challenge",
  "description": "Complete 10 jobs this month",
  "userType": "company",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "criteria": {
    "type": "jobs",
    "target": 10,
    "metadata": {}
  },
  "rewards": [
    {
      "type": "points",
      "value": 500
    },
    {
      "type": "badge",
      "value": "challenge_winner"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "challenge": { ... }
}
```

**Status Codes:**
- `200 OK`: Challenge created successfully
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not an admin user

---

### Join Challenge

Join an active challenge.

**Endpoint:** `POST /api/gamification/challenges`

**Request Body:**
```json
{
  "action": "join",
  "challengeId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK`: Successfully joined challenge
- `400 Bad Request`: Invalid request body or challenge not active
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Challenge not found

---

### Get Challenge Progress

Get a user's progress in a specific challenge.

**Endpoint:** `GET /api/gamification/challenges/[id]/progress`

**Path Parameters:**
- `id` (UUID): Challenge ID

**Query Parameters:**
- `user_id` (optional, UUID): User ID. Defaults to authenticated user.

**Response:**
```json
{
  "challenge_id": "uuid",
  "user_id": "uuid",
  "progress": {
    "current": 7,
    "target": 10,
    "percentage": 70
  },
  "completed_at": null,
  "status": "in_progress"
}
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User trying to access another user's data without admin privileges
- `404 Not Found`: Challenge or participation not found

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Detailed error message (in development only)"
}
```

---

## Rate Limiting

- **Standard endpoints:** 100 requests per minute per user
- **Admin endpoints:** 200 requests per minute per admin user
- **Leaderboard refresh:** 10 requests per minute per admin user

---

## Pagination

Endpoints that support pagination use `limit` and `offset` query parameters:

- `limit`: Number of items to return (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

**Example:**
```
GET /api/gamification/points/history?limit=20&offset=40
```

---

## Tenant Isolation

All endpoints automatically filter data by tenant context. The tenant ID is resolved from:
1. `x-tenant-id` header
2. `tenant_id` cookie
3. Host-based tenant mapping

Users can only access data within their tenant unless they have admin privileges.

---

## Webhooks

Gamification events can trigger webhooks for:
- Badge earned
- Level up
- Challenge completed
- Leaderboard position change

Configure webhooks in the admin dashboard.

---

## Support

For API support, contact: api-support@tsmartcleaning.com

