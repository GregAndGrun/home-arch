#!/bin/bash

# API Testing Script for Smart Gate Control
# Tests all API endpoints

# Configuration
ESP32_IP="${1:-192.168.1.100}"
USERNAME="${2:-admin}"
PASSWORD="${3:-change_this_strong_password_123!}"

BASE_URL="http://$ESP32_IP"
TOKEN=""

echo "======================================"
echo "Smart Gate Control - API Tester"
echo "======================================"
echo "Target: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} - $2"
    else
        echo -e "${RED}✗ FAIL${NC} - $2"
    fi
}

# Test 1: Health Check
echo "Test 1: Health Check"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    print_result 0 "Health endpoint accessible"
    echo "  Response: $body"
else
    print_result 1 "Health endpoint failed (HTTP $http_code)"
fi
echo ""

# Test 2: Login
echo "Test 2: Login"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    print_result 0 "Login successful"
    echo "  Token: ${TOKEN:0:20}..."
else
    print_result 1 "Login failed (HTTP $http_code)"
    echo "  Response: $body"
    exit 1
fi
echo ""

# Test 3: Unauthorized Access (no token)
echo "Test 3: Unauthorized Access Test"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/gates/status")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "401" ]; then
    print_result 0 "Unauthorized access correctly blocked"
else
    print_result 1 "Unauthorized access not blocked (HTTP $http_code)"
fi
echo ""

# Test 4: Get Gates Status (authorized)
echo "Test 4: Get Gates Status"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/gates/status" \
    -H "Authorization: Bearer $TOKEN")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    print_result 0 "Gates status retrieved"
    echo "  Response: $body"
else
    print_result 1 "Gates status failed (HTTP $http_code)"
fi
echo ""

# Test 5: Trigger Entrance Gate
echo "Test 5: Trigger Entrance Gate"
echo -e "${YELLOW}WARNING: This will actually trigger the gate!${NC}"
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/gates/entrance/trigger" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        print_result 0 "Entrance gate triggered"
        echo "  Response: $body"
    else
        print_result 1 "Entrance gate trigger failed (HTTP $http_code)"
    fi
else
    echo -e "${YELLOW}Skipped${NC}"
fi
echo ""

# Test 6: Trigger Garage Gate
echo "Test 6: Trigger Garage Gate"
echo -e "${YELLOW}WARNING: This will actually trigger the gate!${NC}"
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/gates/garage/trigger" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        print_result 0 "Garage gate triggered"
        echo "  Response: $body"
    else
        print_result 1 "Garage gate trigger failed (HTTP $http_code)"
    fi
else
    echo -e "${YELLOW}Skipped${NC}"
fi
echo ""

# Test 7: Rate Limiting
echo "Test 7: Rate Limiting Test"
echo "Sending 15 rapid requests..."
failed_count=0
for i in {1..15}; do
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/gates/status" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" != "200" ]; then
        failed_count=$((failed_count + 1))
    fi
    
    echo -n "."
done
echo ""

if [ $failed_count -gt 0 ]; then
    print_result 0 "Rate limiting working ($failed_count requests blocked)"
else
    print_result 1 "Rate limiting may not be working (all requests succeeded)"
fi
echo ""

# Test 8: Invalid Login
echo "Test 8: Invalid Credentials Test"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"wrong\",\"password\":\"wrong\"}")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "401" ]; then
    print_result 0 "Invalid credentials correctly rejected"
else
    print_result 1 "Invalid credentials not rejected (HTTP $http_code)"
fi
echo ""

# Test 9: Logout
echo "Test 9: Logout"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
    -H "Authorization: Bearer $TOKEN")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "200" ]; then
    print_result 0 "Logout successful"
else
    print_result 1 "Logout failed (HTTP $http_code)"
fi
echo ""

# Test 10: Token Invalid After Logout
echo "Test 10: Token Invalidation Test"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/gates/status" \
    -H "Authorization: Bearer $TOKEN")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "401" ]; then
    print_result 0 "Token correctly invalidated after logout"
else
    print_result 1 "Token still valid after logout (HTTP $http_code)"
fi
echo ""

echo "======================================"
echo "Testing Complete!"
echo "======================================"

