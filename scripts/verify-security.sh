#!/bin/bash
# Security Verification Script
# Usage: ./scripts/verify-security.sh [DOMAIN]
# Example: ./scripts/verify-security.sh https://tsmartcleaning.com

DOMAIN="${1:-https://localhost:3000}"
DOMAIN_NAME="${DOMAIN#https://}"
DOMAIN_NAME="${DOMAIN_NAME#http://}"
DOMAIN_NAME="${DOMAIN_NAME%%/*}"

echo "🔒 Security Verification for $DOMAIN"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper function to check result
check_result() {
  local test_name="$1"
  local result="$2"
  local status="$3"
  
  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✅ $test_name: PASS${NC}"
    ((PASS_COUNT++))
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠️  $test_name: WARN${NC}"
    ((WARN_COUNT++))
  else
    echo -e "${RED}❌ $test_name: FAIL${NC}"
    ((FAIL_COUNT++))
  fi
}

# 1. HTTPS Enforcement
echo -n "1. Testing HTTPS Enforcement... "
if [ "$DOMAIN" != "https://localhost:3000" ] && [ "${DOMAIN#http://}" != "$DOMAIN" ]; then
  HTTP_REDIRECT=$(curl -sI "http://$DOMAIN_NAME" 2>/dev/null | grep -i "301\|302\|Location.*https")
  if [ -n "$HTTP_REDIRECT" ]; then
    check_result "HTTPS Enforcement" "" "PASS"
  else
    check_result "HTTPS Enforcement" "" "FAIL"
  fi
else
  check_result "HTTPS Enforcement" "" "WARN"
fi

# 2. Security Headers
echo -n "2. Testing Security Headers... "
HEADERS=$(curl -sI "$DOMAIN" 2>/dev/null)
HAS_CSP=$(echo "$HEADERS" | grep -i "content-security-policy")
HAS_XFRAME=$(echo "$HEADERS" | grep -i "x-frame-options")
HAS_XCTYPE=$(echo "$HEADERS" | grep -i "x-content-type-options")
HAS_REFERRER=$(echo "$HEADERS" | grep -i "referrer-policy")

if [ -n "$HAS_CSP" ] && [ -n "$HAS_XFRAME" ] && [ -n "$HAS_XCTYPE" ] && [ -n "$HAS_REFERRER" ]; then
  check_result "Security Headers" "" "PASS"
else
  check_result "Security Headers" "" "FAIL"
  [ -z "$HAS_CSP" ] && echo "   Missing: Content-Security-Policy"
  [ -z "$HAS_XFRAME" ] && echo "   Missing: X-Frame-Options"
  [ -z "$HAS_XCTYPE" ] && echo "   Missing: X-Content-Type-Options"
  [ -z "$HAS_REFERRER" ] && echo "   Missing: Referrer-Policy"
fi

# 3. Rate Limiting
echo -n "3. Testing Rate Limiting... "
RATE_LIMIT_HEADERS=$(curl -sI "$DOMAIN/api/contact" 2>/dev/null | grep -i "x-ratelimit")
if [ -n "$RATE_LIMIT_HEADERS" ]; then
  check_result "Rate Limiting" "" "PASS"
else
  check_result "Rate Limiting" "" "WARN"
fi

# 4. CORS Configuration
echo -n "4. Testing CORS Configuration... "
CORS_HEADERS=$(curl -sI -X OPTIONS "$DOMAIN/api/companies/search" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
  check_result "CORS Configuration" "" "PASS"
else
  check_result "CORS Configuration" "" "WARN"
fi

# 5. Authentication Protection
echo -n "5. Testing Authentication Protection... "
AUTH_RESPONSE=$(curl -sI "$DOMAIN/api/admin/users" 2>/dev/null | head -n 1)
if echo "$AUTH_RESPONSE" | grep -q "401\|403"; then
  check_result "Authentication Protection" "" "PASS"
else
  check_result "Authentication Protection" "" "WARN"
fi

# 6. XSS Protection Header
echo -n "6. Testing XSS Protection... "
XSS_HEADER=$(curl -sI "$DOMAIN" 2>/dev/null | grep -i "x-xss-protection")
if [ -n "$XSS_HEADER" ]; then
  check_result "XSS Protection Header" "" "PASS"
else
  check_result "XSS Protection Header" "" "WARN"
fi

# Summary
echo ""
echo "======================================"
echo "Summary:"
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ All critical security checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some security checks failed. Please review.${NC}"
  exit 1
fi

