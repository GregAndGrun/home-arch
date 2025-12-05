# Instrukcje: Budowanie aplikacji iOS i przesłanie do TestFlight

## ✅ Co zostało już skonfigurowane:

1. ✅ Bundle ID: `com.grunert.smarthome` (w `app.config.js`)
2. ✅ EAS project ID: `45c2c77b-51c8-4c87-b7f2-7d9b772be609` (w `app.config.js`)
3. ✅ Konfiguracja iOS w `eas.json` (profile preview i production)
4. ✅ EAS CLI zainstalowane
5. ✅ Zalogowany do EAS jako: `greggrun`

## 🚀 Krok 1: Skonfiguruj projekt EAS (jednorazowo)

Uruchom następującą komendę i odpowiedz **"y"** na pytanie:

```bash
cd mobile-app/gate-app
eas build --platform ios --profile preview
```

Gdy zapyta: **"Existing EAS project found for @greggrun/smart-home (id = 45c2c77b-51c8-4c87-b7f2-7d9b772be609). Configure this project?"**
- Odpowiedz: **y** (yes)

## 🏗️ Krok 2: Budowanie aplikacji iOS

Po skonfigurowaniu projektu, EAS automatycznie:
1. Zbuduje aplikację iOS w chmurze
2. Prześle ją do App Store Connect
3. Udostępni w TestFlight

**Czas budowania:** ~15-30 minut

## 📱 Krok 3: Konfiguracja TestFlight w App Store Connect

Po zakończeniu builda:

1. **Przejdź do App Store Connect:**
   - https://appstoreconnect.apple.com
   - Zaloguj się swoim kontem Apple Developer

2. **Sprawdź czy aplikacja istnieje:**
   - Jeśli nie, utwórz nową aplikację z Bundle ID: `com.grunert.smarthome`
   - Wypełnij podstawowe informacje (nazwa, język, SKU)

3. **Przejdź do TestFlight:**
   - Wybierz aplikację → TestFlight
   - Build powinien pojawić się automatycznie (może zająć kilka minut)

4. **Dodaj testerów:**
   - **Wewnętrzni testerzy:** Do 100 osób z Twojego zespołu
   - **Zewnętrzni testerzy:** Do 10,000 osób (wymaga review Apple)
   - Wpisz email testera i wyślij zaproszenie

## 🔧 Alternatywa: Lokalny build przez Xcode

Jeśli wolisz zbudować lokalnie:

```bash
cd mobile-app/gate-app

# 1. Wygeneruj projekt iOS
npx expo prebuild --platform ios

# 2. Otwórz w Xcode
open ios/SmartHome.xcworkspace

# 3. W Xcode:
#    - Wybierz swój zespół deweloperski (Team)
#    - Ustaw Bundle Identifier: com.grunert.smarthome
#    - Product → Archive
#    - Po archiwizacji: Distribute App → App Store Connect → Upload
```

## ⚠️ Wymagania:

- **Konto Apple Developer** ($99/rok)
- **App ID** z Bundle ID: `com.grunert.smarthome` (utworzony w Apple Developer Portal)
- **Certyfikat dystrybucji** (EAS automatycznie zarządza certyfikatami)

## 📝 Uwagi:

- EAS automatycznie zarządza certyfikatami i profilami provisioning
- Build odbywa się w chmurze Expo (nie potrzebujesz Maca z Xcode)
- Po pierwszym buildzie, kolejne będą szybsze
- Aplikacja automatycznie trafi do TestFlight po zakończeniu builda

## 🆘 Rozwiązywanie problemów:

**Problem:** "EAS project not configured"
**Rozwiązanie:** Uruchom `eas build --platform ios --profile preview` i odpowiedz "y" na pytanie

**Problem:** "Bundle ID not found"
**Rozwiązanie:** Utwórz App ID w Apple Developer Portal z Bundle ID: `com.grunert.smarthome`

**Problem:** "No Apple Developer account"
**Rozwiązanie:** Zarejestruj się na https://developer.apple.com ($99/rok)

