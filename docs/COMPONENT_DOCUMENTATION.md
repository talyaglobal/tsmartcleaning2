# Component Documentation

**Last Updated:** 2025-01-27  
**Framework:** React 18.3.1 with Next.js 16.0.3  
**UI Library:** Radix UI + Tailwind CSS

---

## Table of Contents

1. [UI Components](#ui-components)
2. [Admin Components](#admin-components)
3. [Auth Components](#auth-components)
4. [Booking Components](#booking-components)
5. [Provider Components](#provider-components)
6. [Marketing Components](#marketing-components)
7. [Company Components](#company-components)
8. [Component Patterns](#component-patterns)

---

## UI Components

Base UI components located in `components/ui/`. Built on Radix UI primitives with Tailwind CSS styling.

### Button

**Location:** `components/ui/button.tsx`

**Props:**
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
  className?: string
  children: React.ReactNode
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">
  Click Me
</Button>
```

---

### Card

**Location:** `components/ui/card.tsx`

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

---

### Input

**Location:** `components/ui/input.tsx`

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Standard HTML input props
}
```

**Usage:**
```tsx
import { Input } from '@/components/ui/input'

<Input type="email" placeholder="Enter email" />
```

---

### Select

**Location:** `components/ui/select.tsx`

**Sub-components:**
- `Select` - Main component
- `SelectTrigger` - Trigger button
- `SelectValue` - Display value
- `SelectContent` - Dropdown content
- `SelectItem` - Individual option

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Dialog

**Location:** `components/ui/dialog.tsx`

**Sub-components:**
- `Dialog` - Main component
- `DialogTrigger` - Trigger element
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Title
- `DialogDescription` - Description
- `DialogFooter` - Footer section

**Usage:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>
```

---

### DataTable

**Location:** `components/admin/DataTable.tsx`

**Props:**
```typescript
interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey?: (row: T, index: number) => string | number
  className?: string
  emptyState?: React.ReactNode
  loading?: boolean
  density?: 'comfortable' | 'compact'
  stickyHeader?: boolean
}

interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  width?: string | number
}
```

**Usage:**
```tsx
import { DataTable } from '@/components/admin/DataTable'

const columns = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => row.name,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => row.email,
  },
]

<DataTable columns={columns} data={users} />
```

---

## Admin Components

### AdminLayout

**Location:** `components/admin/AdminLayout.tsx`

Main layout wrapper for admin pages. Includes sidebar navigation and header.

**Props:**
```typescript
interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}
```

---

### PageHeader

**Location:** `components/admin/PageHeader.tsx`

**Props:**
```typescript
interface PageHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  breadcrumb?: Array<{ label: string; href?: string }>
  tabs?: Array<{ label: string; href: string; active?: boolean }>
  actions?: React.ReactNode
  className?: string
}
```

**Usage:**
```tsx
import { PageHeader } from '@/components/admin/PageHeader'

<PageHeader
  title="Users"
  subtitle="Manage system users"
  actions={<Button>Add User</Button>}
/>
```

---

### MetricCard

**Location:** `components/admin/MetricCard.tsx`

Display a metric with optional trend indicator.

**Props:**
```typescript
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
}
```

---

### Charts

**Location:** `components/admin/charts/`

Chart components built with Recharts:

- `AreaChart.tsx` - Area chart
- `BarChart.tsx` - Bar chart
- `DonutChart.tsx` - Donut/pie chart
- `LineChart.tsx` - Line chart

**Usage:**
```tsx
import { LineChart } from '@/components/admin/charts/LineChart'

<LineChart
  data={chartData}
  xKey="date"
  yKey="value"
  title="Revenue Over Time"
/>
```

---

## Auth Components

### LoginForm

**Location:** `components/auth/login-form.tsx`

Login form component with email/password authentication.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void
  onError?: (error: Error) => void
  redirectTo?: string
}
```

---

### SignupForm

**Location:** `components/auth/signup-form.tsx`

User registration form.

**Props:**
```typescript
interface SignupFormProps {
  onSuccess?: (user: User) => void
  onError?: (error: Error) => void
  defaultRole?: 'customer' | 'provider'
}
```

---

### OnboardingChecklist

**Location:** `components/auth/OnboardingChecklist.tsx`

Displays onboarding checklist for new users.

**Props:**
```typescript
interface OnboardingChecklistProps {
  userId: string
  tier?: 'standard' | 'premium'
}
```

**Usage:**
```tsx
import { OnboardingChecklist } from '@/components/auth/OnboardingChecklist'

<OnboardingChecklist userId={user.id} tier="premium" />
```

---

### RequirePermission

**Location:** `components/auth/RequirePermission.tsx`

Wrapper component that checks user permissions before rendering children.

**Props:**
```typescript
interface RequirePermissionProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}
```

**Usage:**
```tsx
import { RequirePermission } from '@/components/auth/RequirePermission'

<RequirePermission permission="admin:users:read">
  <UserManagement />
</RequirePermission>
```

---

### RoleGate

**Location:** `components/auth/RoleGate.tsx`

Wrapper component that checks user role before rendering children.

**Props:**
```typescript
interface RoleGateProps {
  allowedRoles: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}
```

---

## Booking Components

### BookingFlow

**Location:** `components/booking/booking-flow.tsx`

Multi-step booking flow component.

**Features:**
- Service selection
- Date/time selection
- Address management
- Add-ons selection
- Payment processing
- Loyalty points redemption

**Usage:**
```tsx
import { BookingFlow } from '@/components/booking/booking-flow'

<BookingFlow />
```

**State Management:**
- Uses React hooks for local state
- Integrates with Supabase for data persistence
- Handles pricing calculations
- Manages loyalty point redemption

---

## Provider Components

### ProviderAvailabilityManager

**Location:** `components/providers/ProviderAvailabilityManager.tsx`

Manages provider availability calendar.

**Props:**
```typescript
interface ProviderAvailabilityManagerProps {
  providerId: string
  onUpdate?: () => void
}
```

---

### ProviderAnalytics

**Location:** `components/providers/ProviderAnalytics.tsx`

Displays analytics dashboard for providers.

**Props:**
```typescript
interface ProviderAnalyticsProps {
  providerId: string
  dateRange?: { start: Date; end: Date }
}
```

---

### PortfolioManager

**Location:** `components/providers/PortfolioManager.tsx`

Manages provider portfolio photos.

**Props:**
```typescript
interface PortfolioManagerProps {
  providerId: string
  maxPhotos?: number
}
```

---

### ServiceManager

**Location:** `components/providers/ServiceManager.tsx`

Manages provider services and pricing.

**Props:**
```typescript
interface ServiceManagerProps {
  providerId: string
  onUpdate?: () => void
}
```

---

## Marketing Components

### CampaignBuilder

**Location:** `components/marketing/CampaignBuilder.tsx`

Build and configure marketing campaigns.

**Props:**
```typescript
interface CampaignBuilderProps {
  onSave: (campaign: CampaignData) => void
}
```

---

### HomepageVerification

**Location:** `components/marketing/HomepageVerification.tsx`

Development tool for verifying homepage rendering.

**Usage:**
Only renders in development mode.

---

### ResponsiveDesignTest

**Location:** `components/marketing/ResponsiveDesignTest.tsx`

Tool for testing responsive design at different breakpoints.

**Usage:**
Only renders in development mode.

---

## Company Components

### CompanyDashboard

**Location:** `components/company/CompanyDashboard.tsx`

Main dashboard for company accounts.

**Props:**
```typescript
interface CompanyDashboardProps {
  companyId: string
}
```

**Features:**
- Property management
- Analytics overview
- Report generation
- User management

**Usage:**
```tsx
import { CompanyDashboard } from '@/components/company/CompanyDashboard'

<CompanyDashboard companyId={company.id} />
```

---

## Component Patterns

### Error Boundaries

**Location:** `components/error-boundary-wrapper.tsx`

Wrap components with error boundaries to catch and handle errors gracefully.

**Usage:**
```tsx
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper'

<ErrorBoundaryWrapper>
  <YourComponent />
</ErrorBoundaryWrapper>
```

---

### Loading States

**Location:** `components/ui/loading-spinner.tsx` and `components/ui/skeleton.tsx`

**Loading Spinner:**
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner />
```

**Skeleton Loader:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-full" />
```

---

### Empty States

**Location:** `components/admin/EmptyState.tsx`

Display when no data is available.

**Props:**
```typescript
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}
```

**Usage:**
```tsx
import { EmptyState } from '@/components/admin/EmptyState'

<EmptyState
  title="No bookings found"
  description="Create your first booking to get started"
  action={<Button>Create Booking</Button>}
/>
```

---

## Styling

All components use Tailwind CSS for styling. The design system is based on:

- **Colors:** Defined in `tailwind.config.js`
- **Spacing:** Tailwind's default spacing scale
- **Typography:** Inter font family
- **Shadows:** Custom shadow utilities
- **Animations:** Tailwind animate utilities + `tailwindcss-animate`

**Custom Utilities:**
```tsx
import { cn } from '@/lib/utils'

// Merge class names with conflict resolution
<div className={cn('base-class', condition && 'conditional-class')} />
```

---

## Accessibility

Components follow WCAG 2.1 AA guidelines:

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader compatibility

**Example:**
```tsx
<button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  onClick={handleClose}
>
  <CloseIcon />
</button>
```

---

## Testing

Components can be tested using:

- **Vitest** - Unit tests
- **@testing-library/react** - Component testing
- **Playwright** - E2E tests

**Example Test:**
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

---

## Best Practices

1. **Props Interface:** Always define TypeScript interfaces for component props
2. **Default Props:** Use default parameters for optional props
3. **Error Handling:** Wrap async operations in try-catch blocks
4. **Loading States:** Always show loading indicators for async operations
5. **Accessibility:** Include ARIA labels and semantic HTML
6. **Performance:** Use React.memo for expensive components
7. **Code Splitting:** Use dynamic imports for large components

---

## Component Library Structure

```
components/
├── ui/              # Base UI components (shadcn/ui)
├── admin/           # Admin-specific components
├── auth/            # Authentication components
├── booking/         # Booking-related components
├── providers/       # Provider-specific components
├── marketing/       # Marketing components
├── company/         # Company-specific components
├── cleaners/        # Cleaner directory components
└── ...
```

---

## Contributing

When adding new components:

1. Follow the existing component structure
2. Add TypeScript types for all props
3. Include JSDoc comments for complex components
4. Add examples in this documentation
5. Write tests for the component
6. Ensure accessibility compliance

