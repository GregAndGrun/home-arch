# Testing Guide - Smart Gate Control System

## Overview

This document describes the testing procedures for the Smart Gate Control system, including unit tests, integration tests, security tests, and end-to-end testing.

## Test Categories

### 1. Hardware Tests
### 2. Firmware Tests
### 3. API Tests
### 4. Mobile App Tests
### 5. Security Tests
### 6. Integration Tests
### 7. Performance Tests

---

## 1. Hardware Tests

### 1.1 Power Supply Test

**Purpose:** Verify power supply is stable and sufficient

**Equipment:**
- Multimeter
- ESP32
- Relay module

**Procedure:**
1. Measure power supply output voltage
   - Expected: 5.0V ± 0.25V
   - Test under no load
   - Test under full load (ESP32 + relays active)

2. Check current draw
   - ESP32 idle: ~80mA
   - ESP32 + WiFi active: ~150-200mA
   - With relays triggered: ~250-300mA
   - Maximum: < 2A

3. Ripple voltage test
   - Should be < 100mV peak-to-peak
   - Use oscilloscope if available

**Pass Criteria:**
- ✅ Voltage: 4.75V - 5.25V under load
- ✅ Current draw: < 2A
- ✅ No brownouts during relay activation

---

### 1.2 Relay Test

**Purpose:** Verify relay switching works correctly

**Equipment:**
- Multimeter (continuity mode)
- ESP32 connected to relay

**Procedure:**
1. **Static Test (Power Off):**
   - Measure NO to COM: Open circuit
   - Measure NC to COM: Short circuit

2. **Dynamic Test (Power On):**
   ```cpp
   digitalWrite(RELAY_PIN, HIGH);
   delay(500);
   // Measure: NO to COM should be closed
   digitalWrite(RELAY_PIN, LOW);
   // Measure: NO to COM should be open
   ```

3. **Audio Test:**
   - Listen for distinct "click" sound
   - Should click on activation and deactivation

4. **LED Indicator Test:**
   - LED should light when relay is active

5. **Load Test:**
   - Connect relay to actual gate control
   - Verify gate responds

**Pass Criteria:**
- ✅ Relay clicks audibly
- ✅ Contacts switch correctly
- ✅ Gate responds to relay activation
- ✅ No stuck relays

---

### 1.3 Reed Switch Test

**Purpose:** Verify sensor detects gate position

**Equipment:**
- Multimeter (continuity mode)
- Reed switch
- Magnet

**Procedure:**
1. **Static Test:**
   - Magnet far: Open circuit (HIGH with pull-up)
   - Magnet near (<1cm): Closed circuit (LOW)

2. **Dynamic Test:**
   - Move magnet slowly toward sensor
   - Note activation distance
   - Should be <1cm for reliable operation

3. **Mounting Test:**
   - Install on actual gate
   - Open/close gate manually
   - Monitor serial output for state changes

**Pass Criteria:**
- ✅ Activates at <1cm distance
- ✅ Reliable switching (no flutter)
- ✅ State correctly reported in firmware

---

## 2. Firmware Tests

### 2.1 WiFi Connection Test

**Purpose:** Verify ESP32 connects to WiFi reliably

**Procedure:**
1. Upload firmware with correct credentials
2. Monitor serial output
3. Expected output:
   ```
   Connecting to WiFi: YourNetwork
   .....
   WiFi connected!
   IP address: 192.168.1.100
   Signal strength: -45 dBm
   ```

4. Test reconnection:
   - Disable WiFi on router
   - Wait 30 seconds
   - Re-enable WiFi
   - ESP32 should reconnect automatically

**Pass Criteria:**
- ✅ Connects within 20 seconds
- ✅ Obtains IP address
- ✅ Auto-reconnects after interruption
- ✅ Signal strength > -70 dBm

---

### 2.2 mDNS Test

**Purpose:** Verify local network discovery

**Procedure:**
1. From computer on same network:
   ```bash
   ping gate-controller.local
   ```

2. Expected: Response from ESP32 IP

3. Test DNS-SD:
   ```bash
   dns-sd -B _http._tcp
   # Should list: gate-controller
   ```

**Pass Criteria:**
- ✅ Responds to .local address
- ✅ Service advertised correctly

---

### 2.3 Gate Control Test

**Purpose:** Verify GPIO control of relays

**Test Code:**
```cpp
void testGateControl() {
  Serial.println("Testing Gate 1...");
  gate1.trigger();
  delay(2000);
  
  Serial.println("Testing Gate 2...");
  gate2.trigger();
  delay(2000);
  
  Serial.println("Test complete");
}
```

**Procedure:**
1. Upload test firmware
2. Observe relay activation
3. **IMPORTANT:** Disconnect from actual gate for this test!

**Pass Criteria:**
- ✅ Relay activates for configured duration
- ✅ Relay deactivates after pulse
- ✅ No stuck states

---

## 3. API Tests

### 3.1 Automated API Tests

**Using test script:**
```bash
cd docs/scripts
./test_api.sh 192.168.1.100 admin your_password
```

**Manual testing with curl:**

#### Test 1: Health Check
```bash
curl http://192.168.1.100/api/health
```
Expected:
```json
{"status":"healthy","uptime":123,"freeHeap":234567,"wifiRSSI":-45}
```

#### Test 2: Login
```bash
curl -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```
Expected:
```json
{"success":true,"token":"abc123...","expiresIn":1800}
```

#### Test 3: Get Status (authenticated)
```bash
curl http://192.168.1.100/api/gates/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected:
```json
{
  "entrance":{"state":"closed","hasSensor":true,"lastAction":0},
  "garage":{"state":"closed","hasSensor":true,"lastAction":0}
}
```

#### Test 4: Trigger Gate
```bash
curl -X POST http://192.168.1.100/api/gates/entrance/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected:
```json
{"success":true,"gate":"entrance","action":"triggered","state":"opening"}
```

**Pass Criteria:**
- ✅ All endpoints respond correctly
- ✅ Authentication required for protected endpoints
- ✅ Proper HTTP status codes
- ✅ JSON responses well-formed

---

### 3.2 Error Handling Tests

#### Test 1: Invalid Credentials
```bash
curl -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wrong","password":"wrong"}'
```
Expected: HTTP 401, `{"error":"Invalid credentials"}`

#### Test 2: Missing Token
```bash
curl http://192.168.1.100/api/gates/status
```
Expected: HTTP 401, `{"error":"Unauthorized"}`

#### Test 3: Invalid Token
```bash
curl http://192.168.1.100/api/gates/status \
  -H "Authorization: Bearer invalid_token"
```
Expected: HTTP 401, `{"error":"Unauthorized"}`

#### Test 4: Expired Token
Wait 31 minutes after login, then try to use token.
Expected: HTTP 401

**Pass Criteria:**
- ✅ All invalid requests rejected
- ✅ Appropriate error messages
- ✅ No sensitive data leaked

---

## 4. Mobile App Tests

### 4.1 UI Tests

**Test Scenarios:**

1. **Login Screen:**
   - [ ] Empty fields show error
   - [ ] Wrong credentials show error
   - [ ] Correct credentials proceed to dashboard
   - [ ] Password is masked
   - [ ] Loading indicator during login

2. **Dashboard Screen:**
   - [ ] Both gates displayed
   - [ ] Status indicators correct
   - [ ] Pull-to-refresh works
   - [ ] Logout button functional
   - [ ] Network status indicator

3. **Gate Cards:**
   - [ ] Trigger button works
   - [ ] Loading state during action
   - [ ] Disabled when offline
   - [ ] State updates after action

4. **Biometric Lock:**
   - [ ] Appears on app resume
   - [ ] Touch ID/Face ID prompts
   - [ ] Fallback to PIN works
   - [ ] Can't bypass

### 4.2 Network Tests

1. **Offline Mode:**
   - Disable WiFi
   - App should show "No connection" banner
   - Buttons should be disabled
   - No crashes

2. **Slow Network:**
   - Use network throttling
   - Request timeout should work
   - Loading indicators shown
   - Graceful error messages

3. **API Unreachable:**
   - Stop ESP32
   - App should show connection error
   - No crashes
   - Retry should work

**Pass Criteria:**
- ✅ UI responsive
- ✅ No crashes
- ✅ Graceful error handling
- ✅ Network issues handled properly

---

## 5. Security Tests

### 5.1 Authentication Tests

#### Test 1: Brute Force Protection
```bash
for i in {1..10}; do
  curl -X POST http://192.168.1.100/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}' &
done
```

**Expected:**
- First 5 attempts: HTTP 401
- After 5 attempts: IP blocked
- Subsequent attempts: HTTP 429 (Too Many Requests)

#### Test 2: Rate Limiting
```bash
for i in {1..20}; do
  curl http://192.168.1.100/api/health &
done
```

**Expected:**
- Requests limited to MAX_REQUESTS_PER_WINDOW
- HTTP 429 for exceeded requests

#### Test 3: Token Security
1. Login and get token
2. Modify token slightly
3. Try to use modified token
4. Expected: HTTP 401 (invalid signature)

**Pass Criteria:**
- ✅ Brute force blocked
- ✅ Rate limiting active
- ✅ Token tampering detected

---

### 5.2 Network Security Tests

#### Test 1: Packet Sniffing
**Tools:** Wireshark

1. Start packet capture
2. Login via mobile app
3. Trigger gate
4. Analyze captured packets

**Check for:**
- ⚠️ Passwords transmitted in plaintext (expected with HTTP)
- ✅ JWT tokens used for subsequent requests
- ✅ No secrets in URLs

**Mitigation:** Use HTTPS in production

#### Test 2: Man-in-the-Middle
**Tools:** mitmproxy

1. Set up proxy
2. Configure device to use proxy
3. Intercept and modify requests

**Expected:**
- Can intercept (HTTP is not encrypted)
- Token signature verification should fail if modified
- Actions should be rejected

**Pass Criteria:**
- ✅ Modified requests rejected
- ✅ Token validation working

---

### 5.3 Physical Security Tests

#### Test 1: Device Tampering
1. Connect ESP32 to computer via USB
2. Try to read flash memory
3. Check if secrets are accessible

**Expected:**
- Secrets in plaintext in flash (current implementation)
- **Production:** Enable flash encryption

#### Test 2: Power Loss
1. Trigger gate
2. Immediately unplug power
3. Restore power
4. Check system state

**Expected:**
- System boots normally
- No corrupted state
- Gate position sensed correctly

**Pass Criteria:**
- ✅ Graceful power loss handling
- ✅ No data corruption

---

## 6. Integration Tests

### 6.1 End-to-End Test

**Scenario:** Complete user flow

1. **Setup:**
   - ESP32 powered and connected
   - Mobile app installed
   - On same WiFi network

2. **Test Steps:**
   ```
   1. Open mobile app
   2. Login with credentials
      → Expected: Dashboard appears
   
   3. Pull to refresh status
      → Expected: Gates show "closed"
   
   4. Tap "Toggle Gate" on entrance
      → Expected:
        - Button shows loading
        - Gate activates
        - Status changes to "opening"
        - After 5s: Status "open" (if sensor)
   
   5. Close app (go to background)
      → Expected: App continues running
   
   6. Reopen app
      → Expected: Biometric prompt
   
   7. Authenticate
      → Expected: Return to dashboard
   
   8. Logout
      → Expected: Return to login screen
   ```

**Pass Criteria:**
- ✅ All steps complete without error
- ✅ Gates respond correctly
- ✅ Status updates accurate
- ✅ No crashes or freezes

---

### 6.2 Multi-Device Test

**Scenario:** Two phones controlling same gates

1. Login on Phone A
2. Login on Phone B
3. Phone A triggers gate
4. Phone B refreshes status
   → Expected: Shows updated state

**Pass Criteria:**
- ✅ Multiple simultaneous connections work
- ✅ State synchronized across devices

---

### 6.3 Network Interruption Test

**Scenario:** WiFi drops during operation

1. App open and authenticated
2. Trigger gate
3. Immediately disable WiFi on phone
4. Re-enable WiFi after 10 seconds
5. Try triggering gate again

**Expected:**
- First trigger: Succeeds (if request sent before disconnect)
- During offline: Error message, buttons disabled
- After reconnect: Token still valid, operations resume

**Pass Criteria:**
- ✅ Graceful handling of network loss
- ✅ Auto-recovery when network returns
- ✅ Token persists across network changes

---

## 7. Performance Tests

### 7.1 Response Time Tests

**Test API response times:**

```bash
# Measure response time
time curl http://192.168.1.100/api/health

# Multiple iterations
for i in {1..10}; do
  time curl -s http://192.168.1.100/api/gates/status \
    -H "Authorization: Bearer TOKEN" > /dev/null
done
```

**Expected Response Times:**
- Health check: < 50ms
- Login: < 200ms
- Get status: < 100ms
- Trigger gate: < 150ms

**Pass Criteria:**
- ✅ 95% of requests < expected time
- ✅ No timeouts under normal load

---

### 7.2 Load Test

**Purpose:** Verify system under concurrent load

**Test scenario:**
```bash
# Using Apache Bench
ab -n 100 -c 10 http://192.168.1.100/api/health

# Results to check:
# - Requests per second
# - Mean response time
# - Failed requests (should be 0)
```

**Expected:**
- Handle 10 concurrent requests
- No crashes
- Response time degradation < 2x

**Pass Criteria:**
- ✅ System remains stable
- ✅ No crashes or reboots
- ✅ All requests complete

---

### 7.3 Memory Leak Test

**Purpose:** Verify no memory leaks over time

**Procedure:**
1. Monitor serial output for heap size:
   ```cpp
   Serial.print("Free heap: ");
   Serial.println(ESP.getFreeHeap());
   ```

2. Run system for 24 hours
3. Make API calls periodically
4. Check heap size over time

**Expected:**
- Initial heap: ~250-280 KB
- After 24h: > 200 KB
- Should stabilize, not continuously decrease

**Pass Criteria:**
- ✅ Heap size stable
- ✅ No continuous decrease
- ✅ System runs for 24+ hours

---

## 8. Safety Tests

### 8.1 Gate Safety Test

⚠️ **CRITICAL SAFETY TEST**

**Purpose:** Ensure gate safety features work

**Procedure:**
1. **Test with obstruction:**
   - Place object in gate path
   - Trigger gate
   - Verify gate stops (if equipped with safety sensors)
   - If no safety sensors: MANUALLY STOP GATE

2. **Test emergency stop:**
   - Trigger gate
   - Immediately press physical button
   - Verify gate stops

3. **Test power loss during operation:**
   - Trigger gate
   - Immediately cut power to ESP32
   - Verify gate has independent safety
   - Never rely solely on ESP32 for safety

**Pass Criteria:**
- ✅ Physical controls still work
- ✅ Gate safety features independent of ESP32
- ✅ No dangerous scenarios

---

## Test Reports

### Test Report Template

```markdown
## Test Report - [Date]

**Tester:** [Name]
**Version:** [Firmware/App version]
**Duration:** [Time]

### Summary
- Tests passed: X/Y
- Critical issues: N
- Warnings: M

### Test Results

#### Hardware Tests
- Power Supply: ✅ PASS
- Relay Operation: ✅ PASS
- Reed Switches: ✅ PASS

#### Firmware Tests
- WiFi Connection: ✅ PASS
- Gate Control: ✅ PASS
- mDNS: ✅ PASS

#### API Tests
- Authentication: ✅ PASS
- Gate Operations: ✅ PASS
- Error Handling: ✅ PASS

#### Mobile App Tests
- UI: ✅ PASS
- Network Handling: ⚠️ WARNING - Slow on 3G
- Biometrics: ✅ PASS

#### Security Tests
- Brute Force Protection: ✅ PASS
- Rate Limiting: ✅ PASS
- Token Security: ✅ PASS

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Status: Open/Fixed
   
### Recommendations
1. [Recommendation]
2. [Recommendation]

### Sign-off
- [ ] All critical tests passed
- [ ] No safety issues
- [ ] System ready for deployment
```

---

## Continuous Testing

### Daily Checks
- WiFi connection stable
- Gates respond correctly
- No error logs

### Weekly Checks
- Run automated API tests
- Check heap memory
- Review access logs

### Monthly Checks
- Full security audit
- Performance tests
- Update firmware if needed

---

## Conclusion

Thorough testing ensures:
- System reliability
- User safety
- Security protection
- Performance standards

**Always test before deploying to production!**

For issues found during testing, refer to the [Troubleshooting Guide](installation.md#troubleshooting).

