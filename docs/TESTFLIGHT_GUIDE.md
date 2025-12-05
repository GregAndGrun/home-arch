# Przewodnik: Dodawanie aplikacji do TestFlight (iOS) i dystrybucji testowej (Android)

## Ważne: TestFlight vs Android

- **TestFlight** = tylko dla **iOS** (iPhone/iPad)
- **APK** = format dla **Android**
- Dla Android odpowiednikiem TestFlight jest **Google Play Console** lub **Firebase App Distribution**

---

## Część 1: TestFlight (iOS) - Dodawanie aplikacji

### Wymagania wstępne:

1. **Konto Apple Developer** ($99/rok)
   - Zarejestruj się na: https://developer.apple.com
   - Potrzebne do publikacji w App Store i TestFlight

2. **App Store Connect**
   - Zaloguj się na: https://appstoreconnect.apple.com
   - Utwórz nową aplikację (jeśli jeszcze nie istnieje)

### Krok 1: Konfiguracja aplikacji w App Store Connect

1. Zaloguj się do **App Store Connect**
2. Przejdź do **"Moje aplikacje"** → **"+"** → **"Nowa aplikacja"**
3. Wypełnij formularz:
   - **Nazwa:** Smart Home (lub inna)
   - **Język podstawowy:** Polski
   - **Bundle ID:** Musi być unikalny (np. `com.grunert.smarthome`)
   - **SKU:** Unikalny identyfikator (np. `smart-home-001`)

### Krok 2: Konfiguracja Bundle ID w projekcie

**W pliku `app.json`:**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.grunert.smarthome",
      "supportsTablet": true
    }
  }
}
```

### Krok 3: Budowanie aplikacji iOS (IPA)

**Opcja A: Używając EAS Build (ZALECANE)**

1. **Zainstaluj EAS CLI** (jeśli jeszcze nie masz):
```bash
npm install -g eas-cli
```

2. **Zaloguj się do EAS:**
```bash
eas login
```

3. **Skonfiguruj projekt:**
```bash
cd mobile-app/gate-app
eas init
```

4. **Zaktualizuj `eas.json`** - dodaj konfigurację iOS:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

5. **Zbuduj aplikację iOS:**
```bash
eas build --platform ios --profile preview
```

6. **Po zakończeniu builda**, EAS automatycznie przesła aplikację do App Store Connect (jeśli masz skonfigurowane credentials)

**Opcja B: Lokalnie przez Xcode (Zaawansowane)**

1. **Wygeneruj projekt iOS:**
```bash
cd mobile-app/gate-app
npx expo prebuild --platform ios
```

2. **Otwórz projekt w Xcode:**
```bash
open ios/SmartHome.xcworkspace
```

3. **Skonfiguruj signing:**
   - Wybierz swój zespół deweloperski
   - Ustaw Bundle Identifier
   - Wybierz profil provisioning

4. **Zbuduj i archiwizuj:**
   - Product → Archive
   - Po zakończeniu, kliknij "Distribute App"
   - Wybierz "App Store Connect"
   - Postępuj zgodnie z instrukcjami

### Krok 4: Przesłanie do TestFlight

**Jeśli używasz EAS Build:**
- EAS automatycznie przesyła aplikację do App Store Connect
- Przejdź do App Store Connect → TestFlight
- Aplikacja pojawi się automatycznie

**Jeśli budujesz lokalnie:**
1. W Xcode, po archiwizacji, kliknij **"Distribute App"**
2. Wybierz **"App Store Connect"**
3. Wybierz **"Upload"**
4. Postępuj zgodnie z instrukcjami

### Krok 5: Konfiguracja TestFlight

1. **Przejdź do App Store Connect** → **TestFlight**
2. **Wybierz swoją aplikację**
3. **Dodaj informacje o buildzie:**
   - Co nowego w tej wersji?
   - Notatki dla testerów
   - Informacje o wymaganiach

4. **Dodaj testerów:**
   - **Wewnętrzni testerzy** (do 100 osób z Twojego zespołu)
   - **Zewnętrzni testerzy** (do 10,000 osób, wymaga review Apple)

5. **Wyślij zaproszenia:**
   - Wpisz email testera
   - Tester otrzyma email z linkiem do TestFlight
   - Po zainstalowaniu TestFlight, aplikacja będzie dostępna

### Krok 6: Instalacja przez testerów

1. Tester instaluje **TestFlight** z App Store
2. Otwiera email z zaproszeniem
3. Klika link → aplikacja otwiera się w TestFlight
4. Klika **"Zainstaluj"**
5. Po instalacji może uruchomić aplikację

---

## Część 2: Android - Dystrybucja testowa

### Opcja A: Google Play Console (Internal Testing)

**Wymagania:**
- Konto Google Play Developer ($25 jednorazowo)
- Zarejestruj się na: https://play.google.com/console

**Proces:**

1. **Utwórz aplikację w Google Play Console:**
   - Przejdź do Google Play Console
   - Kliknij **"Utwórz aplikację"**
   - Wypełnij szczegóły aplikacji

2. **Prześlij APK:**
   - Przejdź do **"Wersje"** → **"Testowanie"** → **"Testowanie wewnętrzne"**
   - Kliknij **"Utwórz nową wersję"**
   - Prześlij plik `app-release.apk`
   - Wypełnij informacje o wersji
   - Kliknij **"Prześlij"**

3. **Dodaj testerów:**
   - Przejdź do **"Testowanie"** → **"Listy testerów"**
   - Utwórz listę testerów (email lub grupa Google)
   - Dodaj testerów do listy

4. **Udostępnij link:**
   - Po przesłaniu, otrzymasz link do testowania
   - Wyślij link testerom
   - Testerzy mogą zainstalować aplikację bezpośrednio z linku

### Opcja B: Firebase App Distribution (BEZPŁATNE, SZYBSZE)

**Wymagania:**
- Konto Google (darmowe)
- Projekt Firebase

**Proces:**

1. **Zainstaluj Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Zaloguj się:**
```bash
firebase login
```

3. **Zainicjuj Firebase w projekcie:**
```bash
cd mobile-app/gate-app
firebase init appdistribution
```

4. **Prześlij APK:**
```bash
firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
  --app YOUR_APP_ID \
  --groups "testers" \
  --release-notes "Nowa wersja z poprawkami UI"
```

5. **Testerzy otrzymają email** z linkiem do pobrania APK

### Opcja C: Bezpośrednie udostępnienie APK

**Najprostsze, ale najmniej bezpieczne:**

1. **Prześlij APK** przez:
   - Email
   - Google Drive / Dropbox
   - Inne narzędzie do udostępniania plików

2. **Testerzy muszą:**
   - Pobrać plik APK
   - Włączyć **"Instalacja z nieznanych źródeł"** w ustawieniach Android
   - Zainstalować aplikację

**⚠️ Uwaga:** Ta metoda nie jest zalecana dla produkcji, ale działa szybko dla testów.

---

## Porównanie metod dystrybucji

| Metoda | Platforma | Koszt | Czas setup | Zalety | Wady |
|--------|-----------|-------|------------|--------|------|
| **TestFlight** | iOS | $99/rok | Średni | Oficjalne, bezpieczne, łatwe zarządzanie | Wymaga Apple Developer |
| **Google Play Console** | Android | $25 jednorazowo | Średni | Oficjalne, bezpieczne | Wymaga rejestracji |
| **Firebase App Distribution** | Android/iOS | Darmowe | Szybki | Darmowe, szybkie | Wymaga Firebase |
| **Bezpośrednie APK** | Android | Darmowe | Natychmiastowy | Najszybsze | Mniej bezpieczne |

---

## Rekomendacja

**Dla iOS:**
- Użyj **EAS Build** + **TestFlight** (najprostsze i najbezpieczniejsze)

**Dla Android:**
- **Firebase App Distribution** (darmowe, szybkie, bezpieczne)
- Lub **Google Play Console** (jeśli planujesz publikację w Play Store)

---

## Szybki start: iOS (TestFlight)

```bash
# 1. Zainstaluj EAS CLI
npm install -g eas-cli

# 2. Zaloguj się
eas login

# 3. Skonfiguruj projekt
cd mobile-app/gate-app
eas init

# 4. Zbuduj aplikację iOS
eas build --platform ios --profile preview

# 5. Po zakończeniu, przejdź do App Store Connect → TestFlight
# 6. Dodaj testerów i wyślij zaproszenia
```

## Szybki start: Android (Firebase)

```bash
# 1. Zainstaluj Firebase CLI
npm install -g firebase-tools

# 2. Zaloguj się
firebase login

# 3. Zainicjuj Firebase
cd mobile-app/gate-app
firebase init appdistribution

# 4. Prześlij APK
firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
  --app YOUR_APP_ID \
  --groups "testers" \
  --release-notes "Wersja testowa"
```

---

## Wskazówki

1. **Dla TestFlight:** Upewnij się, że masz ważne konto Apple Developer przed rozpoczęciem
2. **Dla Android:** Firebase App Distribution jest najszybszą opcją dla testów
3. **Bezpieczeństwo:** Zawsze używaj oficjalnych kanałów dystrybucji dla produkcji
4. **Wersjonowanie:** Zwiększaj numer wersji (`version` w `app.json`) przed każdym buildem

---

## Pomoc

- **EAS Build:** https://docs.expo.dev/build/introduction/
- **TestFlight:** https://developer.apple.com/testflight/
- **Firebase App Distribution:** https://firebase.google.com/docs/app-distribution
- **Google Play Console:** https://support.google.com/googleplay/android-developer

