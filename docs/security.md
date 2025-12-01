# Security Guide - Smart Gate Control System

## Table of Contents

1. [Security Overview](#security-overview)
2. [Threat Model](#threat-model)
3. [Security Layers](#security-layers)
4. [Network Security](#network-security)
5. [Authentication & Authorization](#authentication--authorization)
6. [Encryption](#encryption)
7. [Best Practices](#best-practices)
8. [Monitoring & Logging](#monitoring--logging)
9. [Incident Response](#incident-response)
10. [Security Checklist](#security-checklist)

## Security Overview

This system implements multiple layers of security (defense in depth) to protect your gates from unauthorized access. No single security measure is perfect, but combined they provide robust protection.

### Security Philosophy

**Core Principles:**
- **Defense in Depth:** Multiple independent security layers
- **Least Privilege:** Minimal permissions by default
- **Fail Secure:** System locks on failure
- **Audit Trail:** All actions are logged
- **Regular Updates:** Keep software current

## Threat Model

### What We're Protecting Against

1. **Network Attacks**
   - Man-in-the-middle (MITM)
   - Packet sniffing
   - Replay attacks
   - DDoS attempts

2. **Authentication Attacks**
   - Brute force password guessing
   - Credential stuffing
   - Session hijacking
   - Token theft

3. **Physical Attacks**
   - Device tampering
   - Power interruption
   - Network disconnection
   - Relay manipulation

4. **Software Vulnerabilities**
   - Buffer overflows
   - Injection attacks
   - Firmware manipulation
   - Dependency vulnerabilities

### What We're NOT Fully Protected Against

⚠️ **Known Limitations:**

1. **Sophisticated Attackers:** Nation-state actors with unlimited resources
2. **Physical Access:** Someone with physical access to ESP32 can potentially extract secrets
3. **Compromised Router:** If your router is hacked, additional protections needed
4. **Social Engineering:** Cannot protect against user giving away credentials
5. **Zero-Day Exploits:** Unknown vulnerabilities in underlying systems

## Security Layers

### Layer 1: Network Isolation

**Configuration:**
```
Internet ←→ Router/Firewall ←→ Home Network ←→ ESP32
                  ↑
                  └──── Block incoming connections
```

**Implementation:**
1. ESP32 devices on private network (192.168.x.x)
2. No port forwarding to ESP32
3. Firewall rules blocking external access
4. Separate VLAN for IoT devices (advanced)

**Router Configuration:**
```
# Recommended settings:
- Disable UPnP
- Enable firewall
- Disable remote management
- Use WPA3 encryption (or WPA2 minimum)
- Change default admin password
- Update router firmware
```

### Layer 2: WiFi Security

**Requirements:**
- WPA2-PSK (minimum) or WPA3 (preferred)
- Strong WiFi password (16+ characters)
- Hidden SSID (optional, adds minor security)
- MAC address filtering (optional)

**WiFi Password Requirements:**
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Not based on dictionary words
- Unique (not reused elsewhere)

### Layer 3: Device Authentication

**Multi-Factor Authentication:**

1. **Device Level:** Mobile device must be authorized
2. **User Level:** Username/password required
3. **Session Level:** JWT token with expiration
4. **App Level:** Biometric/PIN to unlock app

**Configuration in `secrets.h`:**
```cpp
// Change these immediately!
#define API_USERNAME "admin"  // Change to something unique
#define API_PASSWORD "YourStr0ngP@ssw0rd!2023"  // Min 12 chars
#define JWT_SECRET "random_32_character_secret_key_here_xyz123"
```

**Password Requirements:**
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Not in common password lists

### Layer 4: Rate Limiting

**Prevents brute force attacks:**

```cpp
#define MAX_LOGIN_ATTEMPTS 5      // Max failed attempts
#define RATE_LIMIT_WINDOW 60000   // Time window (1 minute)
#define MAX_REQUESTS_PER_WINDOW 10 // Max requests in window
```

**How it works:**
1. Track failed login attempts per IP
2. Block IP after 5 failed attempts
3. Limit API requests to 10 per minute
4. Automatic unblock after timeout (configurable)

### Layer 5: Token-Based Sessions

**JWT (JSON Web Token) Implementation:**

```
Login → Server validates → Issues JWT token → Client stores token
                                                      ↓
Client sends token with each request → Server validates → Action allowed
                                              ↓
                                     Token expires → Login again
```

**Token Security:**
- Tokens expire after 30 minutes
- Stored securely in device keychain
- Cannot be modified without detection
- Unique per session
- Invalidated on logout

### Layer 6: HTTPS/TLS (Future Enhancement)

**Currently:** HTTP only (local network)
**Recommended for production:** HTTPS

**To enable HTTPS:**

1. Generate SSL certificates:
```bash
cd docs/scripts
./generate_certificates.sh
```

2. Update firmware to use HTTPS
3. Update mobile app to use https:// URLs
4. Install certificate on mobile device

**Note:** Self-signed certificates will show warnings but provide encryption.

## Network Security

### Recommended Network Architecture

#### Option 1: Local Only (Most Secure)

```
Internet ─────┬──→ Router ──→ Main Network (PCs, phones)
              │
              └──→ IoT VLAN ──→ ESP32 devices
                     ↑
                     └──── Firewall rules:
                           - Allow outgoing
                           - Block incoming
                           - Allow from Main Network
```

**Advantages:**
- Maximum security
- Simple to set up
- No internet exposure

**Disadvantages:**
- Only works when home
- Requires WiFi connection

#### Option 2: VPN Access (Recommended for Remote Access)

```
Internet ←→ Router with VPN ←→ Home Network ←→ ESP32
              ↑
              │
        Mobile device connects via VPN
        (appears as if on home network)
```

**Setup VPN:**

1. **On Router (if supported):**
   - Enable WireGuard or OpenVPN
   - Create client configuration
   - Install VPN app on phone
   - Connect before using gate app

2. **On Raspberry Pi:**
   ```bash
   # Install PiVPN
   curl -L https://install.pivpn.io | bash
   
   # Follow setup wizard
   # Generate client config
   pivpn add
   ```

**Advantages:**
- Secure remote access
- All traffic encrypted
- Acts like you're home

**Disadvantages:**
- Slightly more complex setup
- Need to connect VPN first
- May impact battery life

#### Option 3: Cloud Relay (Advanced)

For developers who want remote access without VPN:

```
ESP32 ←→ Cloud Server ←→ Mobile App
         (Websocket)
```

**Not implemented by default - requires:**
- Dedicated server
- Websocket implementation
- End-to-end encryption
- Certificate management

### Firewall Rules

**Recommended iptables rules (Linux router):**

```bash
# Block incoming connections to ESP32
iptables -A FORWARD -d 192.168.1.100 -i eth0 -j DROP

# Allow from local network
iptables -A FORWARD -d 192.168.1.100 -s 192.168.1.0/24 -j ACCEPT

# Allow established connections
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
```

## Authentication & Authorization

### Password Management

**Changing Default Password:**

1. Edit `firmware/gate-controller/secrets.h`:
```cpp
#define API_PASSWORD "NewSecurePassword123!"
```

2. Recompile and upload firmware

3. Update mobile app credentials

**Password Storage:**
- Mobile app: Encrypted in device keychain
- ESP32: Hashed (not plaintext)
- Never logged or transmitted unencrypted

### JWT Token Security

**Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "iat": 1234567890,
    "exp": 1234569690
  },
  "signature": "HMAC_signature"
}
```

**Token Validation:**
1. Signature verified with JWT_SECRET
2. Expiration time checked
3. Timestamp validated (prevent replay)
4. Client IP can be validated (optional)

### Session Management

**Best Practices:**
- Logout when not needed
- Tokens auto-expire
- One active session per device
- Forced logout on suspicious activity

## Encryption

### Data in Transit

**Current:** HTTP (plaintext on local network)
**Risk:** Can be sniffed if on same WiFi

**Mitigation:**
- Use WPA2/WPA3 WiFi encryption
- Trust your local network
- Consider HTTPS for production

**HTTPS Implementation (Optional):**

See `firmware/gate-controller/src/CertificateData.h` for certificate storage.

### Data at Rest

**Mobile App:**
- Credentials: Encrypted keychain (Keychain on iOS, EncryptedStorage on Android)
- Settings: AsyncStorage (not encrypted, but non-sensitive)
- Tokens: Secure keychain (JWT tokens)
- Device Configuration: Secure storage (IP addresses, device settings)
- Environment Variables: `.env` file (local only, not committed to git)

**ESP32:**
- Secrets in encrypted flash (ESP32 security features)
- WiFi credentials: Stored securely
- API passwords: Hashed before storage

### Environment Variables (.env)

**Security Best Practices:**

1. **Never commit `.env` to git:**
   - `.env` is in `.gitignore`
   - Use `.env.example` as template (committed, no real data)
   - Each developer/user creates their own `.env`

2. **What goes in `.env`:**
   - Device IP addresses (semi-sensitive)
   - API timeouts and retry settings (non-sensitive)
   - Development/test configuration

3. **What does NOT go in `.env`:**
   - Passwords or API keys (use secure storage)
   - JWT secrets (use secure storage)
   - User credentials (use secure storage)

4. **Production considerations:**
   - For production builds, consider using build-time environment variables
   - Or use secure storage for all sensitive configuration
   - Rotate IP addresses if they change

**Example `.env` structure:**
```bash
# Device IPs (semi-sensitive - change if compromised)
GATE_ENTRANCE_IP=192.168.1.100
GATE_GARAGE_IP=192.168.0.103

# API Configuration (non-sensitive)
API_TIMEOUT=10000
API_RETRY_ATTEMPTS=3
```

**Secure Storage for Sensitive Data:**
- Device configurations with passwords: Use `StorageService.saveDeviceConfig()` (stored in Keychain)
- User credentials: Use Keychain/EncryptedStorage
- API tokens: Use Keychain/EncryptedStorage
- Use `esp_efuse_write_key()` for permanent secrets
- Enable flash encryption in production

**Enable Flash Encryption:**
```cpp
// In platformio.ini
build_flags = 
    -DCONFIG_SECURE_FLASH_ENC_ENABLED=y
    -DCONFIG_SECURE_BOOT_ENABLED=y
```

## Best Practices

### For Users

1. **Strong Passwords**
   - Use password manager
   - Unique password for this system
   - Change periodically (every 6 months)

2. **Keep Software Updated**
   - Update ESP32 firmware regularly
   - Update mobile app
   - Update router firmware

3. **Network Hygiene**
   - Secure WiFi network
   - Change WiFi password periodically
   - Monitor connected devices

4. **Physical Security**
   - Secure ESP32 enclosures
   - Limit physical access
   - Lock down USB port

5. **Operational Security**
   - Don't share credentials
   - Logout when not using
   - Review logs regularly
   - Report suspicious activity

### For Developers

1. **Code Security**
   - Input validation
   - Sanitize all inputs
   - Avoid buffer overflows
   - Use safe string functions

2. **Dependency Management**
   - Keep libraries updated
   - Review library code
   - Use verified sources
   - Pin library versions

3. **Secret Management**
   - Never commit secrets to git
   - Use `.gitignore`
   - Rotate secrets regularly
   - Use environment variables

4. **Testing**
   - Test authentication edge cases
   - Fuzz test API endpoints
   - Load testing
   - Penetration testing

5. **Code Review**
   - Review security-critical code
   - Use static analysis tools
   - Follow secure coding standards

## Monitoring & Logging

### What to Log

**ESP32 Serial Output:**
```cpp
// Login attempts
[INFO] Login attempt from 192.168.1.50
[WARN] Failed login from 192.168.1.50 (attempt 3/5)
[ERROR] IP blocked: 192.168.1.50

// Gate actions
[INFO] Gate triggered: entrance by 192.168.1.50
[INFO] Gate status changed: entrance -> opening

// System events
[INFO] WiFi connected, IP: 192.168.1.100
[WARN] WiFi disconnected, reconnecting...
[ERROR] Memory low: 5000 bytes free
```

### Log Monitoring

**Access logs from ESP32:**

```cpp
// In firmware, add to file system
void logEvent(String event) {
  File log = SPIFFS.open("/logs.txt", "a");
  log.println(String(millis()) + ": " + event);
  log.close();
}
```

**Review logs:**
- Check for failed login attempts
- Monitor unusual access times
- Look for repeated errors
- Identify patterns

### Alerts

**Set up notifications for:**
- Multiple failed logins
- Gate opened at unusual times
- System errors
- Network disconnections
- Low memory/storage

## Incident Response

### If You Suspect Unauthorized Access

**Immediate Actions:**

1. **Disconnect Network**
   ```
   - Unplug ESP32 or disable WiFi
   - Disconnect router if needed
   ```

2. **Change All Passwords**
   ```
   - API password
   - WiFi password
   - Router admin password
   ```

3. **Review Logs**
   ```
   - Check when unauthorized access occurred
   - Identify what was accessed
   - Document everything
   ```

4. **Update Firmware**
   ```
   - Download latest version
   - Verify integrity
   - Flash to ESP32
   ```

5. **Regenerate Secrets**
   ```
   - New JWT_SECRET
   - New certificates (if using HTTPS)
   - Clear all existing tokens
   ```

### After an Incident

**Post-Incident Actions:**

1. Document what happened
2. Identify how breach occurred
3. Fix the vulnerability
4. Implement additional monitoring
5. Consider professional security audit

### When to Seek Help

**Contact security professional if:**
- Breach affected others
- Financial loss occurred
- Cannot identify attack vector
- Repeated incidents
- Legal implications

## Security Checklist

### Initial Setup

- [ ] Changed default API_USERNAME
- [ ] Set strong API_PASSWORD (12+ chars)
- [ ] Generated random JWT_SECRET (32+ chars)
- [ ] Changed WiFi password
- [ ] Changed router admin password
- [ ] Disabled router remote management
- [ ] Enabled WPA2/WPA3 encryption
- [ ] Updated router firmware
- [ ] Set up firewall rules
- [ ] Configured rate limiting
- [ ] Tested emergency access (physical button)
- [ ] Documented emergency procedures

### Regular Maintenance (Monthly)

- [ ] Review access logs
- [ ] Check for firmware updates
- [ ] Verify backup systems work
- [ ] Test emergency procedures
- [ ] Check physical security
- [ ] Monitor system performance
- [ ] Review connected devices

### Quarterly Tasks

- [ ] Change API password
- [ ] Rotate JWT_SECRET
- [ ] Update all dependencies
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review firewall rules
- [ ] Update documentation

### Annual Tasks

- [ ] Full security review
- [ ] Change all passwords
- [ ] Regenerate certificates
- [ ] Hardware inspection
- [ ] Professional security audit
- [ ] Disaster recovery test

## Additional Resources

### Security Tools

- **Network Scanner:** nmap, Angry IP Scanner
- **Packet Analysis:** Wireshark
- **Penetration Testing:** OWASP ZAP, Burp Suite
- **Password Management:** 1Password, Bitwarden
- **VPN:** WireGuard, OpenVPN

### Learning Resources

- OWASP IoT Security Project
- ESP32 Security Guide
- RFC 7519 (JWT)
- NIST Cybersecurity Framework

### Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do NOT** disclose publicly
2. Document the issue
3. Contact maintainer privately
4. Provide proof of concept
5. Allow reasonable time for fix

## Conclusion

Security is an ongoing process, not a one-time setup. Regular monitoring, updates, and following best practices will keep your system secure.

**Remember:**
- Use strong, unique passwords
- Keep software updated
- Monitor for suspicious activity
- Have backup access methods
- Document your security setup

**When in doubt:**
- Assume breach has occurred
- Disconnect and investigate
- Seek professional help
- Learn and improve

Stay safe! 🔒

