# Szybki start: Uruchomienie aplikacji na Androidzie

## Problem: Aplikacja się nie odpala

### Krok 1: Podłącz urządzenie

**Opcja A: Przez USB (najłatwiejsze)**
1. Podłącz telefon Android do komputera przez USB
2. Na telefonie: **Ustawienia** → **O telefonie** → Naciśnij 7x na **Numer kompilacji** (aby włączyć tryb dewelopera)
3. Wróć do **Ustawienia** → **Opcje dewelopera** → Włącz **Debugowanie USB**
4. Na komputerze sprawdź:
```bash
adb devices
```
Powinieneś zobaczyć swoje urządzenie.

**Opcja B: Przez WiFi (Android 11+)**
1. Na telefonie: **Ustawienia** → **Opcje dewelopera** → **Debugowanie bezprzewodowe**
2. Włącz i zanotuj adres IP i port (np. `192.168.1.100:5555`)
3. Na komputerze:
```bash
adb connect 192.168.1.100:5555
adb devices
```

### Krok 2: Uruchom Expo development server

```bash
cd mobile-app/gate-app
npx expo start --android
```

### Krok 3: Jeśli aplikacja nie uruchamia się automatycznie

**W terminalu Expo:**
- Naciśnij `a` aby uruchomić na Androidzie
- Naciśnij `r` aby odświeżyć
- Naciśnij `m` aby otworzyć menu deweloperskie

**Na telefonie:**
- Zainstaluj aplikację **Expo Go** z Google Play
- Zeskanuj QR kod z terminala Expo
- Lub otwórz aplikację Expo Go i wybierz projekt z listy

### Krok 4: Jeśli nadal nie działa

**Sprawdź logi błędów:**
```bash
adb logcat | grep -E "AndroidRuntime|FATAL|Exception|com.smarthome|Expo"
```

**Wyczyść cache i spróbuj ponownie:**
```bash
adb shell pm clear com.smarthome.app
npx expo start --android --clear
```

**Zainstaluj development build:**
```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Rozwiązywanie problemów

### "adb: no devices/emulators found"
- Sprawdź czy USB debugging jest włączony
- Spróbuj innego kabla USB
- Sprawdź czy telefon pokazuje powiadomienie o autoryzacji USB debugging

### "Expo server nie łączy się z urządzeniem"
- Upewnij się że telefon i komputer są w tej samej sieci WiFi
- Sprawdź firewall - port 8081 musi być otwarty
- Spróbuj użyć tunelu: `npx expo start --tunnel`

### "Aplikacja crashuje przy starcie"
- Sprawdź logi: `adb logcat | grep "AndroidRuntime"`
- Wyczyść cache: `adb shell pm clear com.smarthome.app`
- Zainstaluj ponownie aplikację

