#include "WebServer.h"
#include <ArduinoJson.h>
#include "config.h"
#include "Logger.h"

// Prosta strona HTML do logowania i podglądu logów
static const char LOGS_PAGE_HTML[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Smart Gate · Logs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root {
      --bg: #121212;
      --card: #1e1e1e;
      --button: #2a2a2a;
      --button-pressed: #353535;
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --accent: #ff6b35;
      --accent-dark: #d45527;
      --accent-light: #ff8a5f;
      --border: #2a2a2a;
      --error: #f44336;
      --success: #4caf50;
      --warning: #ff9800;
      --header: #1e1e1e;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
      padding: 0;
      background: #000;
      color: var(--text-primary);
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px 32px;
    }
    .card {
      background: var(--card);
      border-radius: 0;
      padding: 18px 18px 16px;
      border: 1px solid var(--border);
      box-shadow: 0 14px 30px rgba(0,0,0,0.7);
    }
    h1 {
      font-size: 1.5rem;
      margin: 0;
      letter-spacing: 0.03em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h1 span.accent {
      font-weight: 600;
      color: var(--accent);
    }

    label {
      display: block;
      font-size: 0.85rem;
      margin-bottom: 5px;
      color: var(--text-secondary);
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    input {
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 12px;
      border-radius: 0;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text-primary);
      box-sizing: border-box;
      transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out, background 0.15s ease-out;
      font-size: 0.95rem;
    }
    input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(255,107,53,0.2);
      background: #181818;
    }
    button {
      padding: 10px 18px;
      border-radius: 0;
      border: none;
      background: var(--accent);
      color: #000;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(255,107,53,0.3);
      transition: all 0.15s ease-out;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
      box-shadow: none;
    }
    button:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(255,107,53,0.4);
      background: var(--accent-light);
    }
    button:not(:disabled):active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(255,107,53,0.3);
    }
    button.secondary {
      background: var(--button);
      color: var(--text-secondary);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    button.secondary:not(:disabled):hover {
      background: var(--button-pressed);
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      transform: translateY(-1px);
    }
    .row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .row > * {
      flex: 1;
      min-width: 140px;
    }
    .row.actions {
      justify-content: flex-start;
      margin-top: 6px;
      margin-bottom: 14px;
    }
    .status {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 8px;
      margin-bottom: 10px;
      min-height: 1.3em;
      font-weight: 500;
    }
    .status.error { color: #f87171; }
    .status.success { color: var(--success); }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
      margin: 18px 0;
    }
    .filters-section {
      background: rgba(255,107,53,0.03);
      border-left: 2px solid var(--accent);
      padding: 12px 14px;
      margin-bottom: 14px;
    }
    pre {
      background: #0d0d0d;
      border-radius: 0;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      font-size: 0.8rem;
      max-height: 60vh;
      overflow: auto;
      white-space: pre;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      line-height: 1.5;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }
    .badge {
      font-size: 0.65rem;
      padding: 3px 9px;
      border-radius: 0;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      background: var(--header);
    }
    .subheader {
      font-size: 0.78rem;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .filters-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 6px;
    }
    .chip-group {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip {
      font-size: 0.75rem;
      padding: 5px 12px;
      border-radius: 0;
      border: 1px solid var(--border);
      background: var(--button);
      color: var(--text-secondary);
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease-out;
      font-weight: 500;
    }
    .chip:hover {
      background: var(--button-pressed);
      border-color: var(--accent);
    }
    .chip.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #000000;
      box-shadow: 0 2px 8px rgba(255,107,53,0.3);
      font-weight: 600;
    }
    .search-input {
      min-width: 160px;
      max-width: 260px;
      margin-bottom: 0;
    }
    @media (max-width: 640px) {
      .filters {
        flex-direction: column;
        align-items: flex-start;
      }
      .filters > div {
        width: 100%;
      }
      .search-input {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1><span class="accent">Smart Gate</span> · Logs</h1>
        <span id="connectionStatus" class="badge">Not authenticated</span>
      </div>
      <div class="subheader">
        Lightweight embedded log viewer. Use your standard Smart Gate credentials to sign in.
      </div>

      <div id="loginSection">
        <div class="row">
          <div>
            <label for="username">Username</label>
            <input id="username" type="text" autocomplete="username" />
          </div>
          <div>
            <label for="password">Password</label>
            <input id="password" type="password" autocomplete="current-password" />
          </div>
        </div>

        <div class="row actions">
          <button id="loginBtn">
            <span>Login</span>
          </button>
          <button id="logoutBtn" class="secondary" style="display:none;">
            <span>Logout</span>
          </button>
          <button id="refreshBtn" disabled>Refresh logs</button>
        </div>
        <div id="loginStatus" class="status"></div>

        <div class="divider"></div>

        <div class="filters-section">
          <div class="filters">
            <div>
              <div class="filters-label">Level</div>
              <div class="chip-group">
                <span class="chip active" data-level="ALL" id="levelAll">All</span>
                <span class="chip" data-level="INFO" id="levelInfo">Info</span>
                <span class="chip" data-level="WARN" id="levelWarn">Warn</span>
                <span class="chip" data-level="ERROR" id="levelError">Error</span>
              </div>
            </div>
            <div style="flex:1; min-width:160px; text-align:right;">
              <label for="search" style="margin-bottom:2px; text-align:left;">Search</label>
              <input id="search" class="search-input" type="text" placeholder="Filter by text..." />
            </div>
          </div>
        </div>
      </div>

      <pre id="logs">No logs loaded yet.</pre>
    </div>
  </div>

  <script>
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusEl = document.getElementById('loginStatus');
    const logsEl = document.getElementById('logs');
    const connectionBadge = document.getElementById('connectionStatus');
    const searchInput = document.getElementById('search');
    const levelChips = document.querySelectorAll('.chip[data-level]');

    let token = null;
    let rawLogs = '';       // pełny tekst logów z ESP
    let currentLevel = 'ALL';

    function setStatus(text, type) {
      statusEl.textContent = text || '';
      statusEl.className = 'status' + (type ? ' ' + type : '');
    }

    function setConnection(authenticated) {
      if (authenticated) {
        connectionBadge.textContent = 'Authenticated';
        connectionBadge.style.color = '#4ade80';
        connectionBadge.style.borderColor = '#4ade80';
      } else {
        connectionBadge.textContent = 'Not authenticated';
        connectionBadge.style.color = '#9ca3af';
        connectionBadge.style.borderColor = '#374151';
      }
    }

    function applyFilters() {
      if (!rawLogs) {
        logsEl.textContent = 'No logs yet.';
        return;
      }

      const lines = rawLogs.split('\n');
      const query = (searchInput.value || '').toLowerCase().trim();
      const level = currentLevel;

      const filtered = lines.filter(line => {
        if (!line.trim()) return false;

        // oczekiwany format: "<timestamp> [LEVEL] message"
        const levelMatch = line.match(/\\[(INFO|WARN|ERROR)\\]/);
        const lineLevel = levelMatch ? levelMatch[1] : 'INFO';

        if (level !== 'ALL' && lineLevel !== level) return false;
        if (query && !line.toLowerCase().includes(query)) return false;

        return true;
      });

      logsEl.textContent = filtered.length ? filtered.join('\n') : '(No logs for current filters)';
    }

    function setLevel(level) {
      currentLevel = level;
      levelChips.forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-level') === level);
      });
      applyFilters();
    }

    async function login() {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      if (!username || !password) {
        setStatus('Please enter username and password', 'error');
        return;
      }

      setStatus('Logging in...', '');
      loginBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.token) {
          throw new Error(data.error || 'Login failed');
        }

        token = data.token;
        setStatus('Login successful', 'success');
        setConnection(true);
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        refreshBtn.disabled = false;

        await refreshLogs();
      } catch (err) {
        console.error(err);
        setStatus(err.message || 'Login failed', 'error');
        setConnection(false);
      } finally {
        loginBtn.disabled = false;
      }
    }

    async function refreshLogs() {
      if (!token) {
        setStatus('Please login first', 'error');
        return;
      }

      setStatus('Loading logs...', '');
      refreshBtn.disabled = true;

      try {
        const res = await fetch('/api/logs', {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.status === 401) {
          token = null;
          setConnection(false);
          loginBtn.style.display = 'inline-block';
          logoutBtn.style.display = 'none';
          refreshBtn.disabled = true;
          logsEl.textContent = 'Unauthorized. Please login again.';
          setStatus('Session expired. Please login again.', 'error');
          return;
        }

        rawLogs = await res.text();
        applyFilters();
        setStatus('Logs loaded', 'success');
      } catch (err) {
        console.error(err);
        setStatus('Failed to load logs', 'error');
      } finally {
        refreshBtn.disabled = false;
      }
    }

    function logout() {
      token = null;
      setConnection(false);
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      refreshBtn.disabled = true;
      setStatus('Logged out', '');
    }

    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);
    refreshBtn.addEventListener('click', refreshLogs);

    levelChips.forEach(chip => {
      chip.addEventListener('click', () => {
        setLevel(chip.getAttribute('data-level'));
      });
    });

    searchInput.addEventListener('input', () => {
      applyFilters();
    });

    // Enter = login
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        login();
      }
    });
  </script>
</body>
</html>
)HTML";

void setupWebServer(AsyncWebServer& server, 
                   #if ENABLE_GATE1
                   GateController& gate1,
                   #endif
                   #if ENABLE_GATE2
                   GateController& gate2,
                   #endif
                   Authentication& auth) {
  
  // CORS headers for all responses
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Handle CORS preflight OPTIONS requests globally
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      request->send(200);
    } else {
      request->send(404, "application/json", "{\"error\":\"Not found\"}");
    }
  });
  
  // OPTIONS handler for API routes (CORS preflight)
  server.on("/api/auth/login", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/auth/logout", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/status", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/trigger", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/entrance/open", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/entrance/close", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  #endif
  #if ENABLE_GATE2
  server.on("/api/gates/garage/trigger", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/garage/open", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/garage/close", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  #endif
  
  // Root endpoint - API info
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<200> doc;
    doc["name"] = "Smart Gate Controller API";
    doc["version"] = "1.0.0";
    doc["status"] = "online";
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // Health check endpoint
  server.on("/api/health", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<300> doc;
    doc["status"] = "healthy";
    doc["uptime"] = millis() / 1000;
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["wifiRSSI"] = WiFi.RSSI();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });

  // Prosty panel WWW do logowania i podglądu logów
  server.on("/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send_P(200, "text/html", LOGS_PAGE_HTML);
  });

  // Logs endpoint - zwraca ostatnie logi tekstowo (wymaga autoryzacji)
  server.on("/api/logs", HTTP_GET, [&auth](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }

    String logs = getLogText();
    if (logs.length() == 0) {
      logs = "No logs yet.\n";
    }
    request->send(200, "text/plain", logs);
  });
  
  // Login endpoint
  server.on("/api/auth/login", HTTP_POST, 
    [&auth](AsyncWebServerRequest *request) {}, 
    NULL,
    [&auth](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, (const char*)data);
    
    if (error) {
      request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      return;
    }
    
    String username = doc["username"] | "";
    String password = doc["password"] | "";
    String clientIP = getClientIP(request);
    
    String token = auth.login(username, password, clientIP);
    
    if (token.length() > 0) {
      StaticJsonDocument<200> response;
      response["success"] = true;
      response["token"] = token;
      response["expiresIn"] = JWT_EXPIRATION_TIME;
      
      String jsonResponse;
      serializeJson(response, jsonResponse);
      request->send(200, "application/json", jsonResponse);
    } else {
      request->send(401, "application/json", "{\"error\":\"Invalid credentials\"}");
    }
  });
  
  // Logout endpoint
  server.on("/api/auth/logout", HTTP_POST, [&auth](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    String token = extractToken(request);
    auth.logout(token);
    
    request->send(200, "application/json", "{\"success\":true}");
  });
  
  // Gate status endpoint
  server.on("/api/gates/status", HTTP_GET, [&auth
    #if ENABLE_GATE1
    , &gate1
    #endif
    #if ENABLE_GATE2
    , &gate2
    #endif
    ](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    StaticJsonDocument<400> doc;
    
    #if ENABLE_GATE1
    JsonObject g1 = doc.createNestedObject("entrance");
    g1["state"] = gate1.getStateString();
    g1["hasSensor"] = gate1.hasSensor();
    g1["lastAction"] = gate1.getLastActionTime();
    #endif
    
    #if ENABLE_GATE2
    JsonObject g2 = doc.createNestedObject("garage");
    g2["state"] = gate2.getStateString();
    g2["hasSensor"] = gate2.hasSensor();
    g2["lastAction"] = gate2.getLastActionTime();
    #endif
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // Trigger gate 1 (entrance)
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/trigger", HTTP_POST, [&auth, &gate1](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate1.trigger();
    
    StaticJsonDocument<200> doc;
    doc["success"] = true;
    doc["gate"] = "entrance";
    doc["action"] = "triggered";
    doc["state"] = gate1.getStateString();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  #endif
  
  // Trigger gate 2 (garage)
  #if ENABLE_GATE2
  server.on("/api/gates/garage/trigger", HTTP_POST, [&auth, &gate2](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate2.trigger();
    
    StaticJsonDocument<200> doc;
    doc["success"] = true;
    doc["gate"] = "garage";
    doc["action"] = "triggered";
    doc["state"] = gate2.getStateString();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  #endif
  
  // Open gate 1
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/open", HTTP_POST, [&auth, &gate1](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate1.open();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"open\"}");
  });
  #endif
  
  // Open gate 2
  #if ENABLE_GATE2
  server.on("/api/gates/garage/open", HTTP_POST, [&auth, &gate2](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate2.open();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"open\"}");
  });
  #endif
  
  // Close gate 1
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/close", HTTP_POST, [&auth, &gate1](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate1.close();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"close\"}");
  });
  #endif
  
  // Close gate 2
  #if ENABLE_GATE2
  server.on("/api/gates/garage/close", HTTP_POST, [&auth, &gate2](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate2.close();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"close\"}");
  });
  #endif
  
  // 404 handler
  server.onNotFound([](AsyncWebServerRequest *request) {
    request->send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
  });
}

String getClientIP(AsyncWebServerRequest *request) {
  if (request->hasHeader("X-Forwarded-For")) {
    return request->header("X-Forwarded-For");
  }
  return request->client()->remoteIP().toString();
}

String extractToken(AsyncWebServerRequest *request) {
  if (request->hasHeader("Authorization")) {
    String auth = request->header("Authorization");
    if (auth.startsWith("Bearer ")) {
      return auth.substring(7);
    }
  }
  return "";
}

bool authorizeRequest(AsyncWebServerRequest *request, Authentication& auth) {
  String clientIP = getClientIP(request);
  
  // Check rate limit
  if (!auth.checkRateLimit(clientIP)) {
    return false;
  }
  
  // Extract and validate token
  String token = extractToken(request);
  return auth.validateToken(token);
}

