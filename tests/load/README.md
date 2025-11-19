# Load Testing

This directory contains load testing configurations for the application.

## Tools

### k6 (Recommended)

[k6](https://k6.io/) is a modern load testing tool built for developers.

**Installation:**
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

**Run tests:**
```bash
# Basic run
k6 run tests/load/k6-load-test.js

# With custom base URL
BASE_URL=https://staging.example.com k6 run tests/load/k6-load-test.js

# With more virtual users
k6 run --vus 100 --duration 30s tests/load/k6-load-test.js
```

### Artillery (Alternative)

[Artillery](https://www.artillery.io/) is a Node.js-based load testing toolkit.

**Installation:**
```bash
npm install -g artillery
```

**Run tests:**
```bash
artillery run tests/load/artillery-load-test.yml
```

## Test Scenarios

### Current Tests

1. **API Endpoint Load Test** (`k6-load-test.js`)
   - Tests GET /api/services
   - Tests GET /api/bookings
   - Tests GET /api/users
   - Gradually ramps up load from 20 to 50 concurrent users

### Adding New Load Tests

1. Create a new `.js` file for k6 or `.yml` file for Artillery
2. Define your test scenarios
3. Set appropriate thresholds and stages
4. Document the test in this README

## Performance Targets

- **Response Time (p95)**: < 500ms for simple endpoints
- **Response Time (p95)**: < 1000ms for complex endpoints
- **Error Rate**: < 1%
- **Availability**: > 99.9%

## CI/CD Integration

Load tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Load Tests
  run: |
    k6 run tests/load/k6-load-test.js
```

## Monitoring

During load tests, monitor:
- Server CPU and memory usage
- Database connection pool
- API response times
- Error rates
- Network bandwidth

