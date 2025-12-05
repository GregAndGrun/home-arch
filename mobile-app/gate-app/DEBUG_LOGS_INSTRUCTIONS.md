# Instrukcje: Debugowanie aplikacji i odczytywanie logów

## Krok 1: Podłączenie urządzenia

### Opcja A: Przez USB (najłatwiejsze)
1. Podłącz telefon Android do komputera przez USB
2. Na telefonie: **Ustawienia** → **Opcje dewelopera** → Włącz **Debugowanie USB**
3. Na komputerze sprawdź połączenie:
```bash
adb devices
```
Powinieneś zobaczyć swoje urządzenie.

### Opcja B: Przez WiFi (Android 11+)
1. Na telefonie: **Ustawienia** → **Opcje dewelopera** → **Debugowanie bezprzewodowe**
2. Włącz i zanotuj adres IP i port (np. `192.168.1.100:5555`)
3. Na komputerze:
```bash
adb connect 192.168.1.100:5555
adb devices
```

## Krok 2: Instalacja debug APK

```bash
cd mobile-app/gate-app
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Lub przeciągnij plik `app-debug.apk` na telefon i zainstaluj ręcznie.

## Krok 3: Odczytywanie logów

### Podstawowe logi aplikacji

**W czasie rzeczywistym (zalecane):**
```bash
# Wyczyść stare logi
adb logcat -c

# Uruchom aplikację na telefonie

# Zobacz logi aplikacji Smart Home
adb logcat | grep "com.smarthome\|ApiService\|api.config"
```

### Szczegółowe logi błędów

**Wszystkie błędy i wyjątki:**
```bash
adb logcat | grep -E "AndroidRuntime|FATAL|Exception|Error|com.smarthome"
```

**Tylko logi ApiService (połączenie z ESP32):**
```bash
adb logcat | grep "ApiService"
```

**Tylko konfiguracja API:**
```bash
adb logcat | grep "api.config"
```

### Zapis logów do pliku

**Zapisz wszystkie logi do pliku:**
```bash
adb logcat > debug_logs.txt
```
Następnie otwórz plik w edytorze i wyszukaj `ApiService` lub `com.smarthome`.

**Zapisz tylko logi aplikacji:**
```bash
adb logcat | grep "com.smarthome\|ApiService\|api.config" > app_logs.txt
```

## Krok 4: Sprawdzenie połączenia z ESP32

### Co sprawdzić w logach:

1. **Inicjalizacja ApiService:**
```
[ApiService] ==========================================
[ApiService] Initializing with baseURL: http://192.168.0.103:80
[ApiService] Using IP: 192.168.0.103
[ApiService] Using Port: 80
[ApiService] Full URL: http://192.168.0.103:80
[ApiService] ==========================================
```

2. **Próba logowania:**
```
[ApiService] ==========================================
[ApiService] Attempting login to: http://192.168.0.103:80
[ApiService] Endpoint: /api/auth/login
[ApiService] Full URL: http://192.168.0.103:80/api/auth/login
[ApiService] Username: admin
[ApiService] ==========================================
```

3. **Błędy połączenia:**
- `ECONNREFUSED` - ESP32 nie odpowiada na tym IP
- `ENOTFOUND` - Nie można znaleźć hosta
- `ETIMEDOUT` - Timeout połączenia
- `Network error` - Problem z siecią

### Test połączenia z ESP32

**Sprawdź czy ESP32 jest dostępne:**
```bash
# Z telefonu (przez adb shell)
adb shell ping -c 3 192.168.0.103

# Lub z komputera (jeśli jesteś w tej samej sieci)
ping -c 3 192.168.0.103
```

**Sprawdź czy ESP32 odpowiada na HTTP:**
```bash
# Z telefonu
adb shell curl -v http://192.168.0.103:80/api/health

# Lub z komputera
curl -v http://192.168.0.103:80/api/health
```

## Krok 5: Najczęstsze problemy i rozwiązania

### Problem: "ECONNREFUSED" lub "Cannot reach ESP32"

**Rozwiązanie:**
1. Sprawdź czy ESP32 jest włączone
2. Sprawdź czy telefon jest w tej samej sieci WiFi co ESP32
3. Sprawdź IP ESP32 w logach - może być inne niż `192.168.0.103`
4. Sprawdź czy firewall/router nie blokuje połączenia

### Problem: "ENOTFOUND"

**Rozwiązanie:**
- Problem z DNS - sprawdź czy używasz IP, nie nazwy hosta
- Sprawdź konfigurację sieci na telefonie

### Problem: "ETIMEDOUT"

**Rozwiązanie:**
- ESP32 może być przeciążone
- Sprawdź czy ESP32 odpowiada (ping, curl)
- Zwiększ timeout w konfiguracji (domyślnie 10 sekund)

### Problem: Aplikacja crashuje przy starcie

**Rozwiązanie:**
```bash
# Zobacz pełny stack trace
adb logcat | grep -A 20 "AndroidRuntime.*FATAL"
```

## Krok 6: Zaawansowane debugowanie

### Filtrowanie logów po poziomie

```bash
# Tylko błędy
adb logcat *:E

# Błędy i ostrzeżenia
adb logcat *:W

# Wszystko
adb logcat *:V
```

### Logi React Native

```bash
adb logcat | grep "ReactNativeJS"
```

### Logi Hermes (silnik JavaScript)

```bash
adb logcat | grep "hermes"
```

### Logi Expo

```bash
adb logcat | grep "Expo"
```

## Krok 7: Automatyczne monitorowanie

**Uruchom skrypt monitorujący:**
```bash
#!/bin/bash
# monitor_app.sh

echo "Czyszczenie logów..."
adb logcat -c

echo "Uruchom aplikację na telefonie..."
echo "Monitorowanie logów (Ctrl+C aby zatrzymać)..."
echo ""

adb logcat | grep -E "com.smarthome|ApiService|api.config|AndroidRuntime|FATAL|Exception" --color=always
```

Zapisz jako `monitor_app.sh`, nadaj uprawnienia i uruchom:
```bash
chmod +x monitor_app.sh
./monitor_app.sh
```

## Przydatne komendy ADB

```bash
# Lista urządzeń
adb devices

# Wyczyść cache aplikacji
adb shell pm clear com.smarthome.app

# Odinstaluj aplikację
adb uninstall com.smarthome.app

# Zainstaluj aplikację
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Uruchom aplikację
adb shell am start -n com.smarthome.app/.MainActivity

# Zatrzymaj aplikację
adb shell am force-stop com.smarthome.app

# Zobacz informacje o aplikacji
adb shell dumpsys package com.smarthome.app
```

## Wskazówki

1. **Zawsze wyczyść logi przed testem:**
   ```bash
   adb logcat -c
   ```

2. **Uruchom aplikację i od razu sprawdź logi:**
   ```bash
   adb logcat -c && adb shell am start -n com.smarthome.app/.MainActivity && adb logcat | grep "ApiService"
   ```

3. **Zapisuj logi do pliku podczas testów:**
   ```bash
   adb logcat > test_logs_$(date +%Y%m%d_%H%M%S).txt
   ```

4. **Użyj Android Studio Logcat** (jeśli masz) - ma lepsze filtrowanie i kolory

