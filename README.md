# Smart Home Gate Control System

Bezpieczny system sterowania bramą wjazdową i garażową przez aplikację mobilną – w domu przez Wi‑Fi, a zdalnie przez tunel VPN (WireGuard/OpenVPN).

## Opis projektu

System umożliwia zdalne sterowanie bramami (wjazdową i garażową) za pomocą aplikacji mobilnej React Native. Komunikacja odbywa się przez sieć lokalną Wi‑Fi z ESP32 i jest obecnie zabezpieczona dzięki JWT oraz kontroli dostępu (HTTPS/TLS zaplanowane w kolejnej iteracji). Poza domem aplikacja zestawia połączenie przez systemowy klient VPN (np. WireGuard), dzięki czemu adresy IP ESP32 pozostają prywatne.

Aplikacja została zaprojektowana jako rozszerzalny system inteligentnego domu - obecnie obsługuje bramy, ale struktura pozwala na łatwe dodanie innych urządzeń (oświetlenie, ogrzewanie, czujniki, itp.).

## Architektura

```
[Aplikacja React Native]
       ↕ (HTTP po LAN) / (tunel VPN poza domem)
[Router Wi‑Fi z serwerem VPN]
       ↕
[ESP32 #1 - Brama wjazdowa] → [Przekaźnik] → [Pilot bramy wjazdowej]
[ESP32 #2 - Brama garażowa] → [Przekaźnik] → [Pilot bramy garażowej]
```

## Warstwy zabezpieczeń

1. **Komunikacja HTTP (LAN)** - Wewnątrz sieci domowej (HTTPS/TLS w przygotowaniu)
2. **Tunel VPN (WireGuard/OpenVPN)** - Zdalny dostęp wyłącznie po zestawieniu szyfrowanego tunelu do routera w domu
3. **Uwierzytelnianie JWT** - Tokeny z wygasaniem (15-30 min)
4. **Rate limiting** - Ochrona przed atakami brute-force
5. **Whitelist urządzeń** - Tylko zarejestrowane urządzenia
6. **Potwierdzenie działania** - Drugi krok uwierzytelniania
7. **PIN/biometria** - Zabezpieczenie aplikacji mobilnej

## Zdalny dostęp przez VPN

1. **Router z VPN** – na głównym routerze (np. TP-Link Archer AX55 Pro lub Asus RT‑AX88) włącz serwer WireGuard/OpenVPN i ustaw stałe IP dla ESP32.
2. **Konfiguracja klienta** – na telefonie dodaj profil VPN (systemowe ustawienia lub aplikacja WireGuard/OpenVPN). Klucze/dane logowania przechowuje wyłącznie system, aplikacja mobilna ich nie dotyka.
3. **Zachowanie aplikacji**  
   - W sieci domowej aplikacja łączy się bezpośrednio przez Wi‑Fi.  
   - Poza domem, gdy ESP32 nie odpowiada, aplikacja pokazuje baner „Połącz z VPN”.  
   - **Automatyczne włączanie VPN:** Jeśli masz zainstalowaną aplikację WireGuard z skonfigurowanym tunelem, aplikacja automatycznie otworzy WireGuard i aktywuje tunel (deep link `wireguard://activate?tunnel=NAZWA`). Jeśli WireGuard nie jest zainstalowany, aplikacja otworzy ustawienia systemowe VPN.  
   - **Automatyczne wykrywanie aktywacji VPN:** Aplikacja monitoruje powiadomienia systemowe z WireGuard. Gdy VPN zostanie aktywowany (nawet jeśli aplikacja jest w tle), automatycznie sprawdza dostępność bramy i aktualizuje status. Nie musisz ręcznie wracać do aplikacji – baner VPN zniknie automatycznie po aktywacji tunelu.  
   - Po zestawieniu tunelu adresy `192.168.x.x` stają się osiągalne, a ruch nadal przechodzi przez HTTP (TDL HTTPS).
4. **Uwierzytelnienie użytkownika** – dostęp do aplikacji chronią biometria (TouchID/FaceID) lub PIN. Token JWT zapisany w pamięci jest automatycznie czyszczony przy wylogowaniu lub wygaśnięciu.
5. **Rekomendacja** – nie udostępniaj ESP32 bezpośrednio do Internetu; używaj wyłącznie tunelu VPN lub sieci lokalnej.

## Struktura projektu

```
home-arch/
├── firmware/              # Kod dla ESP32 (PlatformIO)
│   └── gate-controller/   # Główny program sterujący
├── mobile-app/           # Aplikacja React Native
│   └── src/
├── docs/                 # Dokumentacja
└── README.md
```

## Wymagania sprzętowe

### Dla każdej bramy:
- ESP32 DevKit (ESP32-WROOM-32)
- Moduł przekaźnika 2-kanałowy (5V)
- Zasilacz 5V/2A
- Czujnik magnetyczny/reed switch (opcjonalnie)
- Obudowa IP65
- Przewody, złącza, śruby

### Szacunkowy koszt: ~400-700 PLN (bez routera VPN)

## Szybki start

**Chcesz szybko zacząć?** Zobacz [Quick Start Guide](docs/QUICK_START.md) - 30 minut od zera do działającego systemu!

**Dane do logowania:** [TEST_CREDENTIALS.md](TEST_CREDENTIALS.md) - Login: `admin` / Password: `test123`

## Instalacja

### 1. Przygotuj hardware

Pełna lista zakupów: [SHOPPING_LIST.md](docs/SHOPPING_LIST.md)

### 2. Firmware ESP32

```bash
cd firmware/gate-controller

# Skopiuj i skonfiguruj secrets
cp secrets.example.h secrets.h
nano secrets.h  # Uzupełnij WiFi i hasła

# Wgraj firmware
pio run --target upload
pio device monitor  # Zobacz logi
```

### 3. Aplikacja mobilna

```bash
cd mobile-app/gate-app

# Zainstaluj zależności
npm install

# Skonfiguruj zmienne środowiskowe
cp .env.example .env
nano .env  # Uzupełnij adresy IP ESP32

# Uruchom
npm start
# Następnie:
npm run android  # lub npm run ios lub npm run web
```

**Ważne:** Plik `.env` zawiera wrażliwe dane (adresy IP) i NIE jest commitowany do repozytorium. Zawsze używaj `.env.example` jako szablonu.

**Szczegółowe instrukcje:** [Installation Guide](docs/installation.md)

## Konfiguracja

### Firmware ESP32:
1. Skopiuj `firmware/gate-controller/secrets.example.h` do `secrets.h`
2. Uzupełnij dane WiFi i hasła
3. Wygeneruj certyfikaty SSL (patrz: `docs/security.md`)

### Aplikacja mobilna:
1. Skopiuj `.env.example` do `.env` w katalogu `mobile-app/gate-app/`
2. Uzupełnij adresy IP swoich urządzeń ESP32:
   ```
   GATE_ENTRANCE_IP=192.168.1.100
   GATE_GARAGE_IP=192.168.0.103
   ```
3. (Opcjonalnie) Ustaw nazwę tunelu WireGuard dla automatycznego włączania VPN:
   ```
   WIREGUARD_TUNNEL_NAME=Home
   ```
   **Uwaga:** Nazwa musi dokładnie odpowiadać nazwie tunelu w aplikacji WireGuard na telefonie. Jeśli nie ustawisz, domyślnie użyta zostanie nazwa "Home".
4. Plik `.env` jest w `.gitignore` i nie będzie commitowany do repozytorium

## Bezpieczeństwo

⚠️ **WAŻNE:**
- Nigdy nie commituj plików `secrets.h` ani `.env`
- Zmień domyślne hasła przed pierwszym użyciem
- Używaj silnych haseł (min. 12 znaków)
- Regularnie aktualizuj firmware
- Monitoruj logi dostępu
- Wszystkie secrets są przechowywane bezpiecznie (Keychain/EncryptedStorage w aplikacji)

## Dokumentacja

Kompletna dokumentacja w katalogu `docs/`:

### Pierwsze kroki
- 🚀 [Quick Start Guide](docs/QUICK_START.md) - Start w 30 minut
- 🛒 [Shopping List](docs/SHOPPING_LIST.md) - Co kupić i gdzie

### Instalacja i konfiguracja
- 📖 [Installation Guide](docs/installation.md) - Pełna instrukcja instalacji
- 🔌 [Wiring Diagrams](docs/wiring.md) - Szczegółowe schematy połączeń
- 🔐 [Security Guide](docs/security.md) - Zabezpieczenia i best practices

### Testowanie i rozwój
- ✅ [Testing Guide](docs/TESTING.md) - Procedury testowania
- 🤝 [Contributing](CONTRIBUTING.md) - Jak współtworzyć projekt
- 📝 [Changelog](CHANGELOG.md) - Historia zmian

## Licencja

MIT License - Ten projekt jest Open Source

## Autor

Projekt stworzony jako część systemu inteligentnego domu.

