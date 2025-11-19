/**
 * k6 Load Testing Script
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run tests/load/k6-load-test.js
 * 
 * This script tests the API under various load conditions
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiResponseTime = new Trend('api_response_time')

// Test configuration
export const options = {
	stages: [
		{ duration: '30s', target: 20 }, // Ramp up to 20 users
		{ duration: '1m', target: 20 }, // Stay at 20 users
		{ duration: '30s', target: 50 }, // Ramp up to 50 users
		{ duration: '1m', target: 50 }, // Stay at 50 users
		{ duration: '30s', target: 0 }, // Ramp down to 0 users
	],
	thresholds: {
		http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
		http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
		errors: ['rate<0.01'],
	},
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
	// Test 1: GET /api/services
	const servicesRes = http.get(`${BASE_URL}/api/services`)
	const servicesSuccess = check(servicesRes, {
		'GET /api/services status is 200': (r) => r.status === 200,
		'GET /api/services response time < 500ms': (r) => r.timings.duration < 500,
	})
	errorRate.add(!servicesSuccess)
	apiResponseTime.add(servicesRes.timings.duration)

	sleep(1)

	// Test 2: GET /api/bookings (with query params)
	const bookingsRes = http.get(
		`${BASE_URL}/api/bookings?userId=test_user&role=customer`,
		{
			headers: {
				'x-tenant-id': 'test-tenant-id',
			},
		}
	)
	const bookingsSuccess = check(bookingsRes, {
		'GET /api/bookings status is 200 or 400': (r) => [200, 400].includes(r.status),
		'GET /api/bookings response time < 1000ms': (r) => r.timings.duration < 1000,
	})
	errorRate.add(!bookingsSuccess)
	apiResponseTime.add(bookingsRes.timings.duration)

	sleep(1)

	// Test 3: GET /api/users
	const usersRes = http.get(`${BASE_URL}/api/users`)
	const usersSuccess = check(usersRes, {
		'GET /api/users status is 200': (r) => r.status === 200,
		'GET /api/users response time < 500ms': (r) => r.timings.duration < 500,
	})
	errorRate.add(!usersSuccess)
	apiResponseTime.add(usersRes.timings.duration)

	sleep(1)
}

export function handleSummary(data) {
	return {
		'stdout': textSummary(data, { indent: ' ', enableColors: true }),
		'summary.json': JSON.stringify(data),
	}
}

function textSummary(data, options) {
	// Simple text summary (k6 provides built-in summary, this is a placeholder)
	return JSON.stringify(data, null, 2)
}

