# Bezpieczeństwo aplikacji w TestFlight

## Ważne: TestFlight NIE wymaga podania hasła do aplikacji

**TestFlight wymaga tylko:**
- Email testera (do wysłania zaproszenia)
- Opcjonalnie: imię i nazwisko testera
- Opcjonalnie: notatki dla testera

**TestFlight NIE wymaga:**
- ❌ Hasła do aplikacji
- ❌ Danych logowania
- ❌ Tokenów autentykacji
- ❌ Jakichkolwiek wrażliwych danych

Każdy tester musi się zalogować własnymi danymi po zainstalowaniu aplikacji.

## Obecne zabezpieczenia aplikacji

Aplikacja już ma **wielowarstwowe zabezpieczenia**:

### 1. Warstwa aplikacji mobilnej
- ✅ **Autentykacja użytkownika** - wymaga hasła/biometrii
- ✅ **Tokeny JWT** - wygasają po 30 minutach
- ✅ **Bezpieczne przechowywanie** - tokeny w Keychain (szyfrowane)
- ✅ **Automatyczne wylogowanie** - przy wygaśnięciu tokenu
- ✅ **Biometria** - dodatkowa warstwa bezpieczeństwa

### 2. Warstwa serwera (ESP32)
- ✅ **Rate limiting** - maksymalnie 5 prób logowania, potem blokada IP
- ✅ **Walidacja tokenów** - każdy token jest weryfikowany
- ✅ **Logowanie prób logowania** - wszystkie próby są logowane
- ✅ **Blokada IP** - po zbyt wielu nieudanych próbach
- ✅ **Pojedyncza sesja** - tylko jeden aktywny token na raz

### 3. Warstwa sieciowa
- ✅ **Lokalna sieć** - ESP32 dostępne tylko w sieci lokalnej
- ✅ **VPN** - opcjonalnie dla dostępu zdalnego
- ✅ **Firewall** - brak port forwarding do ESP32

## Dodatkowe opcje bezpieczeństwa dla TestFlight

### Opcja 1: Skrócenie czasu wygaśnięcia tokenów (ZALECANE)

Dla testów możesz skrócić czas wygaśnięcia tokenów z 30 minut do 10 minut:

**W pliku `firmware/gate-controller/src/config.h`:**
```cpp
// Dla testów TestFlight - krótszy czas wygaśnięcia
#define JWT_EXPIRATION_TIME 600  // 10 minut zamiast 30 minut (1800 sekund)
```

**Zalety:**
- Tokeny szybciej wygasają
- Mniejsze ryzyko w przypadku kradzieży tokenu
- Testerzy będą musieli częściej się logować

**Wady:**
- Testerzy będą musieli częściej się logować

### Opcja 2: IP Whitelisting (OPCJONALNIE)

Możesz dodać listę dozwolonych IP, które mogą się logować:

**W pliku `firmware/gate-controller/src/Authentication.h`:**
```cpp
// Dodaj na początku klasy
private:
  std::vector<String> allowedIPs = {
    "192.168.1.50",  // Twój telefon
    "192.168.1.51",  // Inny telefon
    // Dodaj więcej IP jeśli potrzebujesz
  };
  
  bool isIPAllowed(String ip) {
    for (const String& allowedIP : allowedIPs) {
      if (ip == allowedIP) return true;
    }
    return false;
  }
```

**W pliku `firmware/gate-controller/src/Authentication.cpp`:**
```cpp
String Authentication::login(String username, String password, String clientIP) {
  // Sprawdź czy IP jest dozwolone
  if (!isIPAllowed(clientIP)) {
    logWarn("Login attempt from non-whitelisted IP: " + clientIP);
    return "";
  }
  
  // ... reszta kodu logowania
}
```

**Zalety:**
- Tylko określone IP mogą się logować
- Dodatkowa warstwa bezpieczeństwa

**Wady:**
- Trudniejsze zarządzanie (IP mogą się zmieniać)
- Nie działa z VPN (IP będzie inne)

### Opcja 3: Zdalne unieważnienie tokenów

Możesz dodać endpoint do unieważnienia wszystkich tokenów:

**W pliku `firmware/gate-controller/src/WebServer.cpp`:**
```cpp
// Dodaj endpoint do unieważnienia wszystkich tokenów
server.on("/api/auth/invalidate-all", HTTP_POST, [&auth]() {
  if (!auth.validateToken(getAuthToken())) {
    sendError(401, "Unauthorized");
    return;
  }
  
  auth.invalidateAllTokens();
  sendJSON(200, "{\"message\":\"All tokens invalidated\"}");
});
```

**W pliku `firmware/gate-controller/src/Authentication.cpp`:**
```cpp
void Authentication::invalidateAllTokens() {
  validTokens.clear();
  logInfo("All tokens invalidated by admin");
}
```

**Zalety:**
- Możesz natychmiast unieważnić wszystkie tokeny
- Przydatne w przypadku podejrzenia naruszenia bezpieczeństwa

### Opcja 4: Dodatkowe logowanie

Możesz dodać bardziej szczegółowe logowanie prób logowania:

**W pliku `firmware/gate-controller/src/Authentication.cpp`:**
```cpp
String Authentication::login(String username, String password, String clientIP) {
  // Loguj wszystkie próby logowania
  logInfo("Login attempt - IP: " + clientIP + ", Username: " + username + ", Time: " + String(millis()));
  
  // ... reszta kodu
}
```

**Zalety:**
- Możesz śledzić wszystkie próby logowania
- Łatwiejsze wykrycie podejrzanej aktywności

## Rekomendacje dla TestFlight

### Minimum (już masz):
1. ✅ Silne hasło API (12+ znaków)
2. ✅ Tokeny JWT z wygaśnięciem
3. ✅ Rate limiting
4. ✅ Logowanie prób logowania
5. ✅ Bezpieczne przechowywanie tokenów

### Zalecane dodatki:
1. **Skróć czas wygaśnięcia tokenów** do 10 minut (Opcja 1)
2. **Monitoruj logi** - sprawdzaj próby logowania
3. **Używaj VPN** - dla dostępu zdalnego
4. **Zmieniaj hasło** - po zakończeniu testów

### Opcjonalne (dla maksymalnego bezpieczeństwa):
1. IP Whitelisting (Opcja 2)
2. Zdalne unieważnienie tokenów (Opcja 3)
3. Dodatkowe logowanie (Opcja 4)

## Co zrobić przed udostępnieniem w TestFlight

### Checklist bezpieczeństwa:

- [ ] Zmień domyślne hasło API (jeśli jeszcze nie zmienione)
- [ ] Ustaw silne hasło (12+ znaków, mieszanka znaków)
- [ ] Skróć czas wygaśnięcia tokenów do 10 minut (Opcja 1)
- [ ] Sprawdź, że rate limiting jest aktywny
- [ ] Upewnij się, że logowanie działa
- [ ] Przetestuj automatyczne wylogowanie przy wygaśnięciu tokenu
- [ ] Przetestuj blokadę IP po zbyt wielu próbach
- [ ] Upewnij się, że ESP32 jest tylko w sieci lokalnej (bez port forwarding)
- [ ] Skonfiguruj VPN jeśli potrzebujesz dostępu zdalnego

### Po zakończeniu testów:

- [ ] Zmień hasło API
- [ ] Przywróć czas wygaśnięcia tokenów do 30 minut (jeśli skróciłeś)
- [ ] Przejrzyj logi pod kątem podejrzanej aktywności
- [ ] Unieważnij wszystkie tokeny (jeśli dodałeś Opcję 3)

## Najczęstsze pytania

### Q: Czy testerzy będą mogli się zalogować bez mojego hasła?
**A:** Nie. Każdy tester musi mieć własne dane logowania. Możesz:
- Dać im tymczasowe hasło (zmień po testach)
- Utworzyć osobne konto dla każdego testera
- Użyć jednego wspólnego konta testowego (mniej bezpieczne)

### Q: Co jeśli ktoś ukradnie token?
**A:** Token wygaśnie po 10-30 minutach. Dodatkowo:
- Rate limiting ogranicza liczbę prób
- IP jest logowane przy każdej próbie
- Możesz unieważnić wszystkie tokeny (Opcja 3)

### Q: Czy mogę śledzić kto się loguje?
**A:** Tak! Wszystkie próby logowania są logowane w ESP32. Możesz sprawdzić logi przez Serial Monitor.

### Q: Co jeśli zapomnę hasła?
**A:** Musisz zresetować ESP32 i ustawić nowe hasło w `secrets.h`, a następnie przeładować firmware.

## Podsumowanie

**Twoja aplikacja jest już bezpieczna!** 

TestFlight nie wymaga podania hasła - każdy tester musi się zalogować własnymi danymi. Obecne zabezpieczenia (JWT, rate limiting, logowanie) są wystarczające dla testów.

**Dla maksymalnego bezpieczeństwa:**
1. Skróć czas wygaśnięcia tokenów do 10 minut
2. Monitoruj logi podczas testów
3. Zmień hasło po zakończeniu testów

**Pamiętaj:** Bezpieczeństwo to proces ciągły, nie jednorazowa akcja. Regularnie przeglądaj logi i aktualizuj oprogramowanie.

