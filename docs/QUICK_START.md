# Quick Start Guide - Smart Gate Control

## Szybki start dla niecierpliwych! 🚀

Ten przewodnik przeprowadzi Cię przez podstawową instalację w 30-60 minut.

## Krok 1: Zakupy (15 min planowania)

**Minimalna lista zakupów (~220 PLN):**
- [ ] 2x ESP32 DevKit (~60 PLN)
- [ ] 2x Moduł przekaźnika 2-kanałowy (~40 PLN)
- [ ] 2x Zasilacz 5V/2A (~36 PLN)
- [ ] 2x Obudowa IP65 (~50 PLN)
- [ ] Przewody i złącza (~25 PLN)

Zobacz [SHOPPING_LIST.md](SHOPPING_LIST.md) dla szczegółów.

## Krok 2: Przygotowanie oprogramowania (10 min)

### A. Zainstaluj PlatformIO

```bash
# Zainstaluj PlatformIO (wymaga Python)
pip install platformio
```

### B. Zainstaluj Node.js

Pobierz z https://nodejs.org (wersja 18+)

## Krok 3: Konfiguracja firmware (15 min)

```bash
# Sklonuj/otwórz projekt
cd firmware/gate-controller

# Skopiuj i edytuj secrets
cp secrets.example.h secrets.h
nano secrets.h
```

**Edytuj secrets.h:**
```cpp
#define WIFI_SSID "TwojaNazwaWiFi"        // ← Zmień!
#define WIFI_PASSWORD "TwojeHasloWiFi"    // ← Zmień!
#define API_PASSWORD "ZmienienieDlugie123!" // ← Zmień!
```

**Podłącz ESP32 przez USB i wgraj:**
```bash
pio run --target upload
pio device monitor  # Zobacz logi
```

**Szukaj w logach:**
```
WiFi connected!
IP address: 192.168.1.100  ← ZAPISZ TEN ADRES!
```

## Krok 4: Test firmware (5 min)

Z komputera w tej samej sieci:

```bash
# Test 1: Health check
curl http://192.168.1.100/api/health

# Test 2: Login (użyj swojego hasła)
curl -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ZmienienieDlugie123!"}'
```

Jeśli działa → Przejdź dalej!  
Jeśli nie → Zobacz [troubleshooting](installation.md#troubleshooting)

## Krok 5: Podłączenie hardware (20 min)

### ⚠️ WYŁĄCZ WSZYSTKIE ZASILANIE PRZED PODŁĄCZANIEM!

**Podstawowe połączenia:**

```
ESP32          →    Moduł przekaźnika
─────────────────────────────────────
GPIO 16        →    IN1
GPIO 18        →    IN2  
5V             →    VCC
GND            →    GND

Przekaźnik     →    Brama
─────────────────────────────────────
NO1            →    Przycisk bramy 1 (+)
COM1           →    Przycisk bramy 1 (-)
NO2            →    Przycisk bramy 2 (+)
COM2           →    Przycisk bramy 2 (-)
```

**Szczegóły:** Zobacz [wiring.md](wiring.md)

### Test przekaźnika:

```bash
# Zdobądź token
TOKEN=$(curl -s -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ZmienienieDlugie123!"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Trigger gate 1 (UWAGA: to uruchomi bramę!)
curl -X POST http://192.168.1.100/api/gates/entrance/trigger \
  -H "Authorization: Bearer $TOKEN"
```

Czy brama się poruszyła? ✅ Świetnie!

## Krok 6: Aplikacja mobilna (15 min)

```bash
cd mobile-app/gate-app

# Zainstaluj zależności
npm install

# Edytuj config - ustaw IP ESP32
nano src/config/api.config.ts
```

**Zmień:**
```typescript
export const DEFAULT_GATE_ENTRANCE_IP = '192.168.1.100'; // ← Twój IP z kroku 3
```

**Uruchom:**
```bash
# Android
npm run android

# iOS (tylko macOS)
npm run ios
```

## Krok 7: Pierwsze użycie (2 min)

1. Otwórz aplikację
2. Zaloguj się:
   - Username: `admin`
   - Password: (twoje hasło z secrets.h)
3. Uwierzytelnij biometrycznie
4. Zobacz status bram
5. Kliknij "Toggle Gate"

**DZIAŁA? GRATULACJE!** 🎉

## Co dalej?

### Dla bezpieczeństwa (WAŻNE!):
- [ ] Zmień domyślne hasło na silne (min 12 znaków)
- [ ] Przeczytaj [Security Guide](security.md)
- [ ] Nie udostępniaj projektu w internecie (tylko sieć lokalna)
- [ ] Rozważ VPN dla zdalnego dostępu

### Dla niezawodności:
- [ ] Zamontuj ESP32 w wodoodpornej obudowie
- [ ] Dodaj czujniki Reed (opcjonalnie)
- [ ] Przetestuj po odłączeniu zasilania
- [ ] Zachowaj piloty jako backup

### Dla wygody:
- [ ] Ustaw statyczne IP dla ESP32 w routerze
- [ ] Dodaj ikonę aplikacji na ekranie głównym
- [ ] Przetestuj zasięg WiFi
- [ ] Rozważ drugi ESP32 jako backup

## Typowe problemy w 1 minutę

**"WiFi disconnected"**
→ Sprawdź SSID i hasło w secrets.h, musi być 2.4GHz

**"No response from server"**
→ Sprawdź IP w mobile app config, ping ESP32

**"Relay not clicking"**
→ Sprawdź GPIO pins w config.h, test przekaźnika osobno

**"Invalid credentials"**
→ Hasło w secrets.h musi być takie samo jak przy logowaniu

**"Gate doesn't respond"**
→ Sprawdź połączenie przekaźnik-brama, test pilotem

## Pomoc

Szczegółowe instrukcje:
- [Installation Guide](installation.md) - Pełna instalacja
- [Wiring Diagrams](wiring.md) - Schemat połączeń
- [Security Guide](security.md) - Zabezpieczenia
- [Testing Guide](TESTING.md) - Testy

## Bezpieczeństwo - przypomnienie

⚠️ **ZAWSZE:**
- Testuj z dala od bramy
- Zachowaj fizyczne piloty
- Nie obchodź zabezpieczeń bramy
- Upewnij się że brama ma sensory bezpieczeństwa

🎯 **Cel:** Wygodne sterowanie + bezpieczeństwo + niezawodność

**Powodzenia!** Jeśli coś nie działa, sprawdź pełną dokumentację.

