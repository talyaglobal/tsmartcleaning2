# Performance Optimization Guide

This document outlines the performance optimizations implemented in the tSmartCleaning application.

## Overview

The application has been optimized for:
- **Image optimization** (WebP, AVIF, lazy loading)
- **Code splitting** (dynamic imports, route-based splitting)
- **Bundle size optimization** (tree-shaking, package optimization)
- **Database query optimization** (caching, indexes, query optimization)
- **Caching strategy** (API route caching, static asset caching)
- **CDN configuration** (cache headers, static asset delivery)

## Image Optimization

### Next.js Image Optimization

Images are optimized using Next.js's built-in image optimization:

- **Formats**: AVIF and WebP are automatically generated
- **Device sizes**: Responsive images for various screen sizes
- **Lazy loading**: Images load only when needed
- **Cache TTL**: 30 days for optimized images

**Configuration**: `next.config.mjs`

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
}
```

### Usage

Always use Next.js `Image` component instead of `<img>` tags:

```tsx
import Image from 'next/image'

<Image 
  src="/path/to/image.jpg" 
  alt="Description"
  width={800}
  height={600}
  loading="lazy" // For below-the-fold images
  priority // For above-the-fold images
/>
```

## Code Splitting

### Dynamic Imports

Heavy components are loaded dynamically to reduce initial bundle size:

**Example**: Dev-only components on homepage

```tsx
const HomepageVerification = dynamic(
  () => import('@/components/marketing/HomepageVerification'),
  { ssr: false }
)
```

### Route-Based Splitting

Next.js automatically splits code by route. Large client components should be wrapped in `Suspense`:

```tsx
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

## Bundle Size Optimization

### Package Optimization

Large packages are optimized using Next.js experimental features:

```javascript
experimental: {
  optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
}
```

This automatically tree-shakes unused exports from these packages.

### Build Optimizations

- **SWC Minification**: Enabled for faster builds and smaller bundles
- **Compression**: Gzip/Brotli compression enabled
- **Font Optimization**: Automatic font optimization enabled

## Database Query Optimization

### Caching

Database queries are cached using an in-memory cache with TTL:

**Usage**:

```typescript
import { withCache, generateCacheKey } from '@/lib/cache'

const cacheKey = generateCacheKey('companies:search', { q, lat, lng })
const result = await withCache(cacheKey, async () => {
  // Database query
  return await supabase.from('companies').select('*')
}, 300) // 5 minutes TTL
```

### Query Optimization Utilities

Use utilities from `@/lib/db-optimization`:

- `optimizeSelect()`: Select only needed fields
- `withPagination()`: Add pagination to queries
- `optimizeJoin()`: Optimize join queries
- `deduplicate()`: Remove duplicate results

### Recommended Indexes

Ensure these indexes exist in your database:

```sql
-- Bookings
CREATE INDEX idx_bookings_date_status ON bookings(booking_date, status);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);

-- Companies
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status_verified ON companies(status, verified);
CREATE INDEX idx_companies_location ON companies(latitude, longitude);

-- Reviews
CREATE INDEX idx_reviews_company_rating ON reviews(company_id, rating);

-- Transactions
CREATE INDEX idx_transactions_customer_created ON transactions(customer_id, created_at);
```

## Caching Strategy

### API Route Caching

API routes use different caching strategies based on data type:

1. **Public Data** (services, company search): 5 minutes cache with stale-while-revalidate
2. **Dynamic Data** (user-specific): No cache
3. **Static Pages**: 1 hour cache with background revalidation

**Middleware Configuration**: `middleware.ts`

### Static Asset Caching

Static assets are cached for 1 year (immutable):

- `/_next/static/*`: 1 year
- `/images/*`: 1 year
- `/css/*`: 1 year
- `/js/*`: 1 year

### Cache Headers

Cache headers are set automatically in middleware:

```typescript
// Static assets
'Cache-Control': 'public, max-age=31536000, immutable'

// Public API data
'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'

// HTML pages
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
```

## CDN Configuration

### Next.js Standalone Output

The application uses standalone output mode for optimal CDN deployment:

```javascript
output: 'standalone'
```

### Static Asset Delivery

- All static assets are served from `/public` directory
- Images are optimized and served via Next.js image optimization API
- CSS and JS files are minified and compressed

### Recommended CDN Setup

1. **Vercel**: Automatic CDN configuration
2. **Cloudflare**: Configure caching rules for static assets
3. **AWS CloudFront**: Set up distribution with proper cache behaviors

## Performance Monitoring

### Core Web Vitals

Monitor these metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Tools

- **Lighthouse**: Run performance audits
- **WebPageTest**: Test from multiple locations
- **Next.js Analytics**: Built-in performance monitoring

## Best Practices

1. **Images**: Always use Next.js `Image` component
2. **Code Splitting**: Use dynamic imports for heavy components
3. **Caching**: Cache public data, avoid caching user-specific data
4. **Database**: Use indexes, select only needed fields, use pagination
5. **Bundle Size**: Monitor bundle size, use package optimization
6. **CDN**: Serve static assets via CDN with proper cache headers

## Future Optimizations

- [ ] Implement Redis for distributed caching
- [ ] Add service worker for offline support
- [ ] Implement incremental static regeneration (ISR) for dynamic pages
- [ ] Add database connection pooling
- [ ] Implement GraphQL for efficient data fetching
- [ ] Add image CDN integration (Cloudinary, Imgix)

