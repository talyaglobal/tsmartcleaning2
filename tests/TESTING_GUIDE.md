# Testing Guide

This document provides an overview of the testing infrastructure and how to run tests.

## Test Structure

```
tests/
├── unit/              # Unit tests for individual components/functions
│   └── api-routes/   # API route unit tests
├── integration/       # Integration tests for feature flows
├── e2e/              # End-to-end tests (Playwright)
├── performance/      # Performance tests
├── load/             # Load testing scripts (k6, Artillery)
└── utils/            # Test utilities and helpers
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm test tests/unit/api-routes/auth.test.ts

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test tests/integration/booking-flow.test.ts
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test
npx playwright test tests/e2e/critical-paths.spec.ts
```

### Performance Tests

```bash
# Run performance tests
npm run test:performance
```

### Load Tests

```bash
# Using k6 (recommended)
k6 run tests/load/k6-load-test.js

# Using Artillery
artillery run tests/load/artillery-load-test.yml
```

### All Tests

```bash
# Run all test suites
npm run test:all
```

### Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

## Writing Tests

### Unit Tests

Unit tests should test individual functions or components in isolation.

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { createMockRequest } from '../utils/test-helpers'

describe('My API Route', () => {
  it('should handle valid request', async () => {
    const req = createMockRequest('http://localhost/api/endpoint')
    const res = await handler(req)
    expect(res.status).toBe(200)
  })
})
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

Example:
```typescript
describe('Booking Flow', () => {
  it('should create, update, and cancel booking', async () => {
    // Create booking
    // Update booking
    // Cancel booking
  })
})
```

### E2E Tests

E2E tests verify complete user flows in a real browser environment.

Example:
```typescript
import { test, expect } from '@playwright/test'

test('user can complete booking', async ({ page }) => {
  await page.goto('/book')
  await page.fill('input[name="service"]', 'Standard Cleaning')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/.*confirmation/)
})
```

## Test Utilities

### `test-helpers.ts`

Provides utilities for creating mock requests and test data:

- `createMockRequest()` - Create NextRequest objects for testing
- `createMockUser()` - Create mock user objects
- `TestData` - Factory functions for test data

### `supabase-mock.ts`

Provides Supabase client mocks for testing:

- `createSupabaseMock()` - Create a mock Supabase client
- `setMockData()` - Set mock data for tables
- `setMockError()` - Set mock errors for tables

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies (database, APIs, etc.)
3. **Clear Names**: Use descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
5. **Coverage**: Aim for high code coverage, but focus on testing critical paths
6. **Performance**: Keep unit tests fast (< 100ms each)
7. **Maintainability**: Keep tests simple and easy to understand

## CI/CD Integration

Tests are automatically run in CI/CD pipelines. Make sure all tests pass before merging:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    npm install
    npm run test:all
```

## Debugging Tests

### Vitest

```bash
# Run with debug output
npm test -- --reporter=verbose

# Run specific test
npm test -- tests/unit/api-routes/auth.test.ts
```

### Playwright

```bash
# Debug mode (opens Playwright Inspector)
npx playwright test --debug

# Run with trace
npx playwright test --trace on
```

## Common Issues

### Tests timing out

- Increase timeout in test configuration
- Check for hanging promises or unclosed connections
- Verify mocks are properly set up

### Flaky tests

- Ensure tests are deterministic (no random data)
- Use proper wait conditions in E2E tests
- Avoid race conditions with proper async/await

### Mock issues

- Verify mocks are reset between tests
- Check that mock implementations match real API signatures
- Ensure mocks are imported before the code being tested

