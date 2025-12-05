# Debugowanie crasha aplikacji

## Podłączenie urządzenia przez WiFi ADB

### Krok 1: Włącz USB Debugging przez WiFi (jednorazowo)

**Na telefonie Android:**
1. Przejdź do **Ustawienia** → **O telefonie**
2. Naciśnij 7 razy na **Numer kompilacji** (aby włączyć tryb dewelopera)
3. Wróć do **Ustawienia** → **Opcje dewelopera**
4. Włącz **Debugowanie USB**
5. Włącz **Debugowanie bezprzewodowe** (Wireless debugging)

### Krok 2: Podłącz przez USB (pierwszy raz)

**Na komputerze Mac:**
```bash
# Sprawdź czy urządzenie jest widoczne
adb devices

# Jeśli widzisz urządzenie, możesz przejść do kroku 3
```

### Krok 3: Podłącz przez WiFi

**Opcja A: Automatyczne (Android 11+)**
```bash
# Na telefonie: Ustawienia → Opcje dewelopera → Debugowanie bezprzewodowe
# Zobaczysz adres IP i port (np. 192.168.1.100:5555)
# Na komputerze:
adb connect 192.168.1.100:5555

# Sprawdź połączenie:
adb devices
```

**Opcja B: Ręczne (starsze Android)**
```bash
# 1. Podłącz telefon przez USB
adb devices

# 2. Sprawdź IP telefonu (na telefonie: Ustawienia → O telefonie → Status → IP)
# Lub użyj:
adb shell ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d/ -f1

# 3. Ustaw port TCP/IP
adb tcpip 5555

# 4. Odłącz USB i połącz przez WiFi
adb connect <IP_TELEFONU>:5555

# Przykład:
# adb connect 192.168.1.100:5555
```

### Krok 4: Sprawdź logi crasha

```bash
# Wyczyść logi
adb logcat -c

# Uruchom aplikację na telefonie

# Zobacz logi w czasie rzeczywistym (filtr dla błędów)
adb logcat | grep -E "AndroidRuntime|FATAL|Exception|Error|com.smarthome"

# Lub wszystkie logi aplikacji:
adb logcat | grep "com.smarthome"

# Zapis logów do pliku:
adb logcat > crash_logs.txt
```

## Najczęstsze przyczyny crashów przy starcie

1. **Brak uprawnień** - sprawdź AndroidManifest.xml
2. **Błąd inicjalizacji bazy danych** - ActivityService
3. **Problem z fontami** - expo-font
4. **Błąd w komponencie** - sprawdź renderowanie
5. **Brak zależności native** - expo-sqlite, expo-notifications

## Szybkie debugowanie

```bash
# 1. Wyczyść cache aplikacji
adb shell pm clear com.smarthome.app

# 2. Zainstaluj aplikację
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 3. Uruchom z logami
adb logcat -c && adb shell am start -n com.smarthome.app/.MainActivity && adb logcat | grep -E "AndroidRuntime|FATAL|Exception"
```

## Alternatywa: Debug build

Jeśli release build crashuje, spróbuj debug build:

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Debug build ma więcej informacji o błędach.

