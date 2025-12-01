# Instrukcje budowania APK

## Metoda 1: EAS Build (Zalecane - najprostsze)

### Krok 1: Zaloguj się do EAS
```bash
cd mobile-app/gate-app
eas login
```
Utwórz konto na https://expo.dev (jeśli nie masz) lub zaloguj się.

### Krok 2: Skonfiguruj projekt
```bash
eas build:configure
```

### Krok 3: Zbuduj APK
```bash
# Preview build (do testowania)
eas build --platform android --profile preview

# Lub production build
eas build --platform android --profile production
```

### Krok 4: Pobierz APK
Po zakończeniu builda (10-20 minut):
- EAS wyśle link do pobrania
- Lub sprawdź: `eas build:list`
- Pobierz: `eas build:download`

## Metoda 2: Lokalny build (Wymaga Android Studio)

Jeśli masz Android Studio zainstalowane:

```bash
cd mobile-app/gate-app
npx expo run:android --variant release
```

APK znajdziesz w: `android/app/build/outputs/apk/release/app-release.apk`

## Konfiguracja

- ✅ `eas.json` - utworzony
- ✅ `app.config.js` - skonfigurowany z package name
- ✅ `local.properties` - utworzony (dla lokalnego builda)

## Uwagi

- EAS Build jest darmowy dla publicznych projektów
- Build trwa 10-20 minut
- APK będzie dostępny do pobrania przez link
