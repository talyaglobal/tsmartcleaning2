# System Architecture

**Last Updated:** 2025-01-27  
**Purpose:** High-level system architecture and technical overview

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Data Flow](#data-flow)
5. [Component Architecture](#component-architecture)
6. [Database Architecture](#database-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Integration Architecture](#integration-architecture)

---

## Overview

tSmartCleaning is a comprehensive cleaning business management platform built with Next.js. The system supports multiple user roles, booking management, payment processing, and various business operations.

### Key Features

- Multi-role user system (Root Admin, Company Admin, Cleaners, Customers, etc.)
- Booking and scheduling system
- Payment processing with Stripe
- Directory of cleaning companies
- Job application system
- Insurance add-on system
- WhatsApp integration
- Email notifications
- Analytics and reporting

---

## Tech Stack

### Frontend

- **Framework:** Next.js 16.0.3 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x
- **UI Components:** Radix UI
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context + Server Components
- **Icons:** Lucide React

### Backend

- **Runtime:** Node.js 18+
- **API:** Next.js API Routes (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **ORM:** Supabase Client (no ORM layer)

### Third-Party Services

- **Hosting:** Vercel
- **Error Tracking:** Sentry
- **Payments:** Stripe
- **Email:** SendGrid/Resend
- **Messaging:** WhatsApp Business API
- **Analytics:** Vercel Analytics + Custom Analytics
- **Monitoring:** Sentry + Vercel Analytics

### Development Tools

- **Testing:** Vitest, Playwright
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Build Tool:** Next.js (Turbopack)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Users (Browser)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Application                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │   Frontend   │  │  API Routes  │  │ Middleware │ │   │
│  │  │  (React)     │  │  (Server)    │  │  (Auth)    │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │    Stripe    │  │    Sentry     │
│  (Database)  │  │  (Payments)  │  │  (Errors)     │
└──────────────┘  └──────────────┘  └──────────────┘
         │                │                │
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │  Webhooks    │  │   Alerts     │
│   Storage    │  │  (Stripe)    │  │  (Sentry)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Application Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pages      │  │  Components  │  │   Layouts    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Routes  │  │  Middleware   │  │   Services   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                      Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Supabase   │  │   Storage    │  │   External   │  │
│  │   Client     │  │   (Files)    │  │   APIs       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Request Flow

```
1. User Request
   │
   ▼
2. Vercel Edge Network (CDN)
   │
   ▼
3. Next.js Middleware
   │  ├─ Authentication Check
   │  ├─ Role Verification
   │  └─ Route Protection
   │
   ▼
4. Page/API Route Handler
   │  ├─ Server Component (for pages)
   │  └─ Route Handler (for API)
   │
   ▼
5. Business Logic Layer
   │  ├─ Service Functions
   │  ├─ Data Validation
   │  └─ Business Rules
   │
   ▼
6. Data Access Layer
   │  ├─ Supabase Client
   │  ├─ Database Queries
   │  └─ External API Calls
   │
   ▼
7. Response
   │  ├─ HTML (SSR/SSG)
   │  ├─ JSON (API)
   │  └─ Streaming (RSC)
```

### Authentication Flow

```
1. User Login
   │
   ▼
2. Supabase Auth
   │  ├─ Email/Password
   │  ├─ OAuth (if configured)
   │  └─ Magic Link
   │
   ▼
3. Session Creation
   │  ├─ JWT Token
   │  ├─ Refresh Token
   │  └─ Cookie Set
   │
   ▼
4. Middleware Verification
   │  ├─ Token Validation
   │  ├─ Role Check
   │  └─ Permission Check
   │
   ▼
5. Access Granted/Denied
```

### Payment Flow

```
1. User Initiates Payment
   │
   ▼
2. Create Payment Intent (Stripe)
   │
   ▼
3. Client Confirms Payment
   │
   ▼
4. Stripe Webhook Received
   │
   ▼
5. Update Database
   │  ├─ Payment Status
   │  ├─ Booking Status
   │  └─ User Notifications
   │
   ▼
6. Send Confirmation Email
```

---

## Component Architecture

### Directory Structure

```
app/
├── (routes)/              # Route groups
│   ├── admin/            # Admin dashboard
│   ├── customer/         # Customer dashboard
│   ├── cleaner/          # Cleaner dashboard
│   └── company/          # Company dashboard
├── api/                  # API routes
│   ├── auth/             # Authentication
│   ├── bookings/         # Booking management
│   ├── payments/         # Payment processing
│   └── webhooks/         # Webhook handlers
└── layout.tsx            # Root layout

components/
├── ui/                   # Reusable UI components
├── admin/                # Admin-specific components
├── booking/              # Booking components
└── marketing/            # Marketing components

lib/
├── supabase/             # Supabase utilities
├── stripe/               # Stripe utilities
├── email/                # Email utilities
└── utils/                # General utilities
```

### Component Hierarchy

```
Root Layout
├── Header
│   ├── Navigation
│   └── User Menu
├── Main Content
│   ├── Page Content
│   └── Sidebar (if applicable)
└── Footer
    └── Links & Info
```

---

## Database Architecture

### Database: Supabase (PostgreSQL)

### Key Tables

```
users
├── id (UUID, PK)
├── email
├── role
├── company_id (FK)
└── profile data

bookings
├── id (UUID, PK)
├── customer_id (FK)
├── cleaner_id (FK)
├── company_id (FK)
├── status
├── scheduled_at
└── payment data

companies
├── id (UUID, PK)
├── name
├── address
└── contact info

payments
├── id (UUID, PK)
├── booking_id (FK)
├── stripe_payment_intent_id
├── amount
└── status
```

### Row Level Security (RLS)

- All tables have RLS enabled
- Policies enforce role-based access
- Service role key used for admin operations
- Anon key used for public operations

### Database Features

- **PostgreSQL:** Full SQL support
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** File storage with Supabase Storage
- **Functions:** Database functions for complex operations
- **Triggers:** Automated triggers for data consistency

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────┐
│         Authentication Layer            │
│  ┌───────────────────────────────────┐  │
│  │      Supabase Auth               │  │
│  │  - Email/Password                │  │
│  │  - JWT Tokens                    │  │
│  │  - Session Management            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Authorization Layer                │
│  ┌───────────────────────────────────┐  │
│  │      Middleware                   │  │
│  │  - Role Verification              │  │
│  │  - Permission Checks              │  │
│  │  - Route Protection               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      RLS Policies                 │  │
│  │  - Database-level Security        │  │
│  │  - Row-level Access Control       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Security Measures

1. **Authentication:**
   - Supabase Auth with JWT tokens
   - Secure cookie-based sessions
   - Password hashing (bcrypt via Supabase)
   - Email verification

2. **Authorization:**
   - Role-based access control (RBAC)
   - Middleware route protection
   - Database RLS policies
   - API endpoint authorization

3. **Data Protection:**
   - HTTPS only (enforced by Vercel)
   - Environment variable encryption
   - Secure API keys storage
   - SQL injection prevention (parameterized queries)

4. **API Security:**
   - Rate limiting
   - CORS configuration
   - Webhook signature verification
   - Input validation (Zod schemas)

---

## Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────┐
│         Vercel Platform                 │
│  ┌───────────────────────────────────┐  │
│  │      Edge Network (CDN)           │  │
│  │  - Global distribution            │  │
│  │  - Static asset caching           │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      Serverless Functions         │  │
│  │  - API Routes                     │  │
│  │  - Server Components              │  │
│  │  - Edge Functions                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      Cron Jobs                    │  │
│  │  - Scheduled tasks                │  │
│  │  - Background jobs                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Deployment Flow

```
1. Git Push
   │
   ▼
2. Vercel Build
   │  ├─ Install Dependencies
   │  ├─ TypeScript Compilation
   │  ├─ Next.js Build
   │  └─ Source Map Upload (Sentry)
   │
   ▼
3. Deployment
   │  ├─ Edge Network Update
   │  ├─ Function Deployment
   │  └─ Environment Variables
   │
   ▼
4. Health Check
   │  ├─ Build Verification
   │  └─ Runtime Checks
   │
   ▼
5. Production Live
```

---

## Integration Architecture

### External Services Integration

```
┌─────────────────────────────────────────┐
│         Application                    │
└─────────────────────────────────────────┘
         │
         ├─────────────────┬─────────────────┬──────────────┐
         │                 │                 │              │
         ▼                 ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │    Stripe    │  │    Sentry    │  │    Email     │
│              │  │              │  │              │  │   Service    │
│  - Database  │  │  - Payments  │  │  - Errors    │  │  - SendGrid  │
│  - Auth      │  │  - Webhooks  │  │  - Alerts    │  │  - Resend    │
│  - Storage   │  │  - Subscriptions│  │  - Monitoring│  │  - Notifications│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Webhook Architecture

```
External Service (Stripe/WhatsApp)
         │
         │ Webhook Event
         ▼
┌─────────────────────────┐
│   Vercel Edge Function  │
│   (Webhook Handler)     │
└─────────────────────────┘
         │
         ├─ Signature Verification
         ├─ Event Validation
         └─ Processing
         │
         ▼
┌─────────────────────────┐
│   Business Logic        │
│   - Update Database     │
│   - Send Notifications   │
│   - Trigger Actions     │
└─────────────────────────┘
```

---

## Performance Architecture

### Caching Strategy

```
┌─────────────────────────────────────────┐
│         Client Browser                  │
│  - Browser Cache                        │
│  - Service Worker (if PWA)             │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Vercel Edge Network            │
│  - CDN Caching                          │
│  - Static Asset Caching                 │
│  - ISR (Incremental Static Regeneration)│
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Application Layer               │
│  - React Server Components              │
│  - Streaming                            │
│  - Partial Prerendering                 │
└─────────────────────────────────────────┘
```

### Optimization Techniques

1. **Frontend:**
   - Code splitting
   - Image optimization (Next.js Image)
   - Lazy loading
   - Bundle size optimization

2. **Backend:**
   - Database query optimization
   - Connection pooling
   - Caching strategies
   - API response optimization

3. **Infrastructure:**
   - CDN for static assets
   - Edge functions for low latency
   - Serverless auto-scaling
   - Database connection pooling

---

## Monitoring & Observability

### Monitoring Stack

```
┌─────────────────────────────────────────┐
│         Application                    │
└─────────────────────────────────────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Sentry    │  │    Vercel    │  │   Supabase   │
│              │  │   Analytics  │  │   Dashboard  │
│  - Errors    │  │  - Metrics   │  │  - Database  │
│  - Alerts    │  │  - Performance│  │  - Queries   │
│  - Traces    │  │  - Usage     │  │  - Health    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Key Metrics

- **Error Rate:** Tracked via Sentry
- **Response Time:** Tracked via Vercel Analytics
- **Database Performance:** Tracked via Supabase Dashboard
- **User Analytics:** Custom analytics implementation
- **Uptime:** External monitoring (UptimeRobot, etc.)

---

## Scalability Considerations

### Horizontal Scaling

- **Vercel:** Automatic scaling based on traffic
- **Supabase:** Connection pooling and read replicas
- **Edge Functions:** Distributed globally

### Vertical Scaling

- **Database:** Supabase plan upgrades
- **Functions:** Vercel plan upgrades
- **Storage:** Supabase Storage limits

### Future Enhancements

- Redis caching layer
- Message queue for background jobs
- Read replicas for database
- Microservices architecture (if needed)

---

## Related Documentation

- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `RUNBOOK.md` - Operations runbook
- `API_DOCUMENTATION.md` - API reference
- `SECURITY_CONFIGURATION.md` - Security setup
- `LOGGING_AND_MONITORING.md` - Monitoring setup

---

## Architecture Diagrams (Text-Based)

### System Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────────────────────────────────┐
│         Vercel Edge Network             │
│  ┌──────────────────────────────────┐  │
│  │      Next.js Application          │  │
│  │  ┌──────────┐  ┌──────────────┐   │  │
│  │  │ Frontend │  │  API Routes  │   │  │
│  │  └──────────┘  └──────────────┘   │  │
│  └──────────────────────────────────┘  │
└──────┬──────────────────────────────────┘
       │
       ├──────────┬──────────┬──────────┐
       │          │          │          │
┌──────▼──┐ ┌─────▼──┐ ┌─────▼──┐ ┌─────▼──┐
│Supabase │ │ Stripe │ │ Sentry │ │ Email  │
│         │ │        │ │        │ │Service │
└─────────┘ └────────┘ └────────┘ └────────┘
```

### Data Flow Example: Booking Creation

```
User → Frontend Form
  │
  ▼
API Route: POST /api/bookings
  │
  ├─ Validate Input (Zod)
  ├─ Check Permissions
  └─ Create Booking
      │
      ▼
Supabase: Insert into bookings table
  │
  ├─ RLS Policy Check
  ├─ Trigger Notifications
  └─ Return Booking Data
      │
      ▼
Create Payment Intent (Stripe)
  │
  ▼
Send Confirmation Email
  │
  ▼
Return Response to User
```

---

**Note:** For visual diagrams, consider using tools like:
- Mermaid (for markdown diagrams)
- Draw.io / Lucidchart
- PlantUML
- Excalidraw

This document provides a text-based overview. Visual diagrams can be added to a separate `docs/architecture-diagrams/` directory.
