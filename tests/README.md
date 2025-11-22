# Testing Infrastructure

This directory contains the comprehensive testing suite for the tSmart Cleaning application.

## Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # E2E tests (Playwright)
npm run test:performance  # Performance tests

# Generate coverage report
npm run test:coverage
```

## Test Structure

- **`unit/`** - Unit tests for individual API routes and functions
- **`integration/`** - Integration tests for complete feature flows
- **`e2e/`** - End-to-end tests using Playwright
- **`performance/`** - Performance and response time tests
- **`load/`** - Load testing scripts (k6, Artillery)
- **`utils/`** - Test utilities and helpers

## Test Coverage

### ✅ Completed

- **Unit Tests**: Auth routes, booking routes, admin routes, role/permission tests
- **Integration Tests**: Complete booking flow (create, update, cancel, reschedule)
- **E2E Tests**: Critical user paths (homepage, navigation, forms, booking)
- **Responsive Design Tests**: Comprehensive E2E tests for responsive design across mobile, tablet, and desktop viewports
  - Horizontal scroll detection
  - Touch target sizes (44x44px minimum)
  - Navigation behavior at different breakpoints
  - Image responsiveness
  - Text readability
  - Form usability
  - Visual regression testing (screenshots)
  - Cross-viewport consistency
  - Performance at different viewports
- **Performance Tests**: API response time measurements
- **Load Tests**: k6 and Artillery configurations
- **Test Infrastructure**: Mock utilities, test helpers, configuration, responsive test helpers

### 📝 To Add (Incremental)

Additional API route tests can be added incrementally as needed. The infrastructure is in place to easily add tests for:
- Payment routes
- Provider routes
- Customer routes
- Insurance routes
- Company/Enterprise routes
- And more...

## Documentation

- **`TESTING_GUIDE.md`** - Comprehensive guide on writing and running tests
- **`load/README.md`** - Load testing documentation

## Test Commands

See `package.json` for all available test scripts:

- `npm test` - Run Vitest in watch mode
- `npm run test:run` - Run all Vitest tests once
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:performance` - Run performance tests
- `npm run test:coverage` - Generate coverage report
- `npm run test:all` - Run all test suites

## CI/CD

Tests are designed to run in CI/CD pipelines. All tests should pass before merging code.

