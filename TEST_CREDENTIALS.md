# 🔐 Dane testowe / Test Credentials

## Dla aplikacji mobilnej (bez ESP32)

Jeśli chcesz tylko przetestować UI aplikacji mobilnej bez fizycznego ESP32, pamiętaj że:

⚠️ **Login NIE ZADZIAŁA** bez działającego ESP32, ale możesz zobaczyć ekran logowania i UI.

## Dane logowania (po wgraniu firmware na ESP32)

### Domyślne dane testowe:

```
Username: admin
Password: test123
```

Te dane są ustawione w pliku: `firmware/gate-controller/secrets.h`

## ⚙️ Konfiguracja przed pierwszym użyciem

### 1. Edytuj firmware/gate-controller/secrets.h

**Musisz zmienić:**
```cpp
#define WIFI_SSID "Your_WiFi_SSID"          // ← Nazwa Twojej sieci WiFi
#define WIFI_PASSWORD "Your_WiFi_Password"  // ← Hasło do Twojej sieci WiFi
```

**Możesz zostawić (dla testów):**
```cpp
#define API_USERNAME "admin"
#define API_PASSWORD "test123"  // Proste hasło do testów
```

### 2. Wgraj firmware na ESP32

```bash
cd firmware/gate-controller
pio run --target upload
```

### 3. Zobacz IP adres ESP32

```bash
pio device monitor
```

Szukaj linii:
```
WiFi connected!
IP address: 192.168.1.100  ← ZAPISZ TEN ADRES!
```

### 4. Zaktualizuj IP w aplikacji mobilnej

Edytuj: `mobile-app/gate-app/src/config/api.config.ts`

```typescript
export const DEFAULT_GATE_ENTRANCE_IP = '192.168.1.100'; // ← Twój IP z kroku 3
```

### 5. Uruchom aplikację

```bash
cd mobile-app/gate-app
npm run web
```

Zaloguj się:
- Username: `admin`
- Password: `test123`

## 🔒 Bezpieczeństwo

⚠️ **WAŻNE:** Hasło `test123` jest TYLKO do testów!

Przed wdrożeniem produkcyjnym zmień hasło na silne w `secrets.h`:

```cpp
#define API_PASSWORD "JakiesBardzoDlugieIBezpieczneHaslo123!@#"
```

## 📋 Checklist przed uruchomieniem

- [ ] Skopiowano secrets.example.h → secrets.h
- [ ] Ustawiono poprawne WIFI_SSID
- [ ] Ustawiono poprawne WIFI_PASSWORD  
- [ ] Wgrano firmware na ESP32
- [ ] Sprawdzono IP ESP32 w serial monitor
- [ ] Zaktualizowano IP w mobile-app/gate-app/src/config/api.config.ts
- [ ] Uruchomiono aplikację mobilną
- [ ] Zalogowano się z admin/test123
- [ ] Działa! 🎉

## 🆘 Problemy?

**"No response from server"**
- Sprawdź czy ESP32 jest włączony
- Sprawdź czy telefon/komputer jest w tej samej sieci WiFi
- Sprawdź czy IP w konfiguracji jest poprawny

**"Invalid credentials"**
- Sprawdź czy hasło w aplikacji == hasło w secrets.h
- Domyślnie: admin/test123

**"WiFi connection failed" na ESP32**
- Sprawdź WIFI_SSID i WIFI_PASSWORD w secrets.h
- Upewnij się że WiFi jest 2.4GHz (nie 5GHz)

## 📚 Więcej informacji

Zobacz pełną dokumentację:
- [Quick Start Guide](docs/QUICK_START.md)
- [Installation Guide](docs/installation.md)
- [Security Guide](docs/security.md)

