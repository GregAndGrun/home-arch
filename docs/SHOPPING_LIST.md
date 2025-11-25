# Shopping List - Smart Gate Control System

## Kompletna lista zakupów dla systemu sterowania 2 bramami

### Dla każdej bramy (x2)

#### 1. Kontroler ESP32
**ESP32 DevKit (ESP32-WROOM-32)**
- Ilość: 2 sztuki (jedna na każdą bramę)
- Cena: ~25-40 PLN/szt
- Gdzie kupić:
  - Botland.com.pl
  - Kamami.pl
  - Allegro
  - AliExpress (dłuższe oczekiwanie)
- Specyfikacja:
  - WiFi 802.11 b/g/n
  - Bluetooth
  - Minimum 30 pinów GPIO
  - Zasilanie: 5V przez USB lub VIN
- Link przykładowy: Szukaj "ESP32 DevKit v1" lub "ESP32-WROOM-32"

#### 2. Moduł przekaźnika
**2-kanałowy moduł przekaźnikowy 5V**
- Ilość: 2 sztuki (jedna na każdą bramę, jeśli bramy są w różnych miejscach)
  - ALBO: 1 sztuka 4-kanałowy (jeśli obie bramy w tym samym miejscu)
- Cena: ~15-25 PLN/szt (2-kanałowy)
- Gdzie kupić:
  - Botland.com.pl
  - Kamami.pl
  - Allegro
- Specyfikacja:
  - Napięcie cewki: 5V
  - Sterowanie: 3.3V lub 5V (kompatybilne z ESP32)
  - Prąd zwarcia styków: min. 10A przy 250VAC
  - Z optoizolacją (opcjonalnie, zwiększa bezpieczeństwo)
  - LED wskaźniki stanu
- Link przykładowy: Szukaj "moduł przekaźnikowy 2 kanały 5V"

#### 3. Zasilacz
**Zasilacz impulsowy 5V 2A**
- Ilość: 2 sztuki
- Cena: ~15-20 PLN/szt
- Gdzie kupić:
  - Botland.com.pl
  - Kamami.pl
  - Sklepy z elektroniką
- Specyfikacja:
  - Wyjście: 5V DC
  - Prąd: minimum 2A (zalecane 2.5A dla pewności)
  - Wyjście: USB lub przewody (łączówka 5.5mm/2.1mm)
  - Stabilizowany
  - Zabezpieczenia: przeciążeniowe, zwarciowe
- Alternatywa: Zasilacz od starej ładowarki telefonu (jeśli ma 5V/2A)

#### 4. Czujnik stanu bramy (opcjonalnie)
**Reed switch (czujnik magnetyczny)**
- Ilość: 2 sztuki
- Cena: ~5-10 PLN/szt
- Gdzie kupić:
  - Botland.com.pl
  - Kamami.pl
  - Allegro
- Specyfikacja:
  - Typ: NO (Normalnie Otwarty) lub NC (Normalnie Zamknięty)
  - Napięcie: do 200V DC
  - Prąd: 0.5-1A
  - Z magnesem w zestawie
- Uwaga: Nie jest to wymogowe, ale ułatwia wyświetlanie stanu bramy

#### 5. Obudowa wodoodporna
**Obudowa plastikowa IP65**
- Ilość: 2 sztuki
- Cena: ~20-30 PLN/szt
- Gdzie kupić:
  - Botland.com.pl
  - Kamami.pl
  - Sklepy elektryczne
- Specyfikacja:
  - Stopień ochrony: IP65 (pyłoszczelna, chroniona przed strugami wody)
  - Wymiary: min. 100x68x50mm (aby zmieścił się ESP32 + przekaźnik)
  - Dławiki kablowe w zestawie
  - Materiał: ABS lub poliwęglan
  - Kolor: szary/przezroczysty (dobra widoczność LED)

#### 6. Przewody i złącza
**Zestaw przewodów**
- Ilość: 1 zestaw (wystarczy na obie bramy)
- Cena: ~20-30 PLN za zestaw
- Gdzie kupić:
  - Botland.com.pl
  - Allegro
- Co kupić:
  - Przewody dupont żeńsko-męskie (20-30 szt)
  - Przewody dupont żeńsko-żeńskie (10-20 szt)
  - Kabel silikonowy 2x0.5mm² (2-3 metry) - do czujników
  - Złączki skręcane lub szybkozłączki (10 szt)
  - Taśma izolacyjna lub rurki termokurczliwe
  - Opaski zaciskowe (20-30 szt)

### Dodatkowe elementy wspólne

#### 7. Router WiFi z obsługą VPN (opcjonalnie)
**Jeśli nie masz routera z VPN:**

**Opcja A: Router z VPN**
- Cena: ~150-400 PLN
- Przykładowe modele:
  - TP-Link Archer C6 + OpenWRT
  - Mikrotik hAP ac2
  - ASUS RT-AX55 (wbudowane wsparcie VPN)
- Gdzie kupić:
  - Media Expert
  - x-kom
  - Morele.net

**Opcja B: Raspberry Pi jako serwer VPN**
- Raspberry Pi 4 Model B (2GB RAM)
- Cena: ~250-350 PLN
- Gdzie kupić:
  - Botland.com.pl
  - Kamami.pl
- Dodatkowo potrzebne:
  - Karta microSD 16GB (class 10)
  - Zasilacz USB-C 5V/3A
  - Obudowa z wentylatorem

### Narzędzia (jeśli nie posiadasz)

#### 8. Narzędzia do instalacji
- **Śrubokręty** (krzyżak i płaski) - ~20-40 PLN
- **Szczypce do zdejmowania izolacji** - ~30-50 PLN
- **Multimetr cyfrowy** - ~40-80 PLN (ważne do testowania!)
- **Lutownica** (opcjonalnie) - ~50-100 PLN
- **Wiertarka** (do montażu obudów) - jeśli nie masz

## Podsumowanie kosztów

### Wariant podstawowy (bez czujników, bez VPN)
| Pozycja | Ilość | Cena jedn. | Razem |
|---------|-------|------------|-------|
| ESP32 DevKit | 2 | 30 PLN | 60 PLN |
| Moduł przekaźnika 2-kan | 2 | 20 PLN | 40 PLN |
| Zasilacz 5V/2A | 2 | 18 PLN | 36 PLN |
| Obudowa IP65 | 2 | 25 PLN | 50 PLN |
| Przewody i złącza | 1 zestaw | 25 PLN | 25 PLN |
| **SUMA** | | | **211 PLN** |

### Wariant pełny (z czujnikami, bez VPN)
| Pozycja | Ilość | Cena jedn. | Razem |
|---------|-------|------------|-------|
| ESP32 DevKit | 2 | 30 PLN | 60 PLN |
| Moduł przekaźnika 2-kan | 2 | 20 PLN | 40 PLN |
| Zasilacz 5V/2A | 2 | 18 PLN | 36 PLN |
| Reed switch + magnes | 2 | 8 PLN | 16 PLN |
| Obudowa IP65 | 2 | 25 PLN | 50 PLN |
| Przewody i złącza | 1 zestaw | 25 PLN | 25 PLN |
| **SUMA** | | | **227 PLN** |

### Wariant kompletny (z czujnikami i VPN przez RPi)
| Pozycja | Ilość | Cena jedn. | Razem |
|---------|-------|------------|-------|
| ESP32 DevKit | 2 | 30 PLN | 60 PLN |
| Moduł przekaźnika 2-kan | 2 | 20 PLN | 40 PLN |
| Zasilacz 5V/2A | 2 | 18 PLN | 36 PLN |
| Reed switch + magnes | 2 | 8 PLN | 16 PLN |
| Obudowa IP65 | 2 | 25 PLN | 50 PLN |
| Przewody i złącza | 1 zestaw | 25 PLN | 25 PLN |
| Raspberry Pi 4 (2GB) | 1 | 280 PLN | 280 PLN |
| microSD 16GB | 1 | 25 PLN | 25 PLN |
| Zasilacz RPi USB-C | 1 | 35 PLN | 35 PLN |
| Obudowa RPi | 1 | 30 PLN | 30 PLN |
| **SUMA** | | | **597 PLN** |

## Lista zakupów do zaznaczania

Wydrukuj tę listę i zaznaczaj co już kupiłeś:

### Elektronika
- [ ] 2x ESP32 DevKit (ESP32-WROOM-32)
- [ ] 2x Moduł przekaźnika 2-kanałowy 5V
- [ ] 2x Zasilacz 5V 2A
- [ ] 2x Reed switch z magnesem (opcjonalnie)
- [ ] 2x Obudowa IP65 (min 100x68x50mm)

### Przewody i złącza
- [ ] Przewody dupont żeńsko-męskie (20-30 szt)
- [ ] Przewody dupont żeńsko-żeńskie (10-20 szt)
- [ ] Kabel 2x0.5mm² (2-3m)
- [ ] Złączki skręcane (10 szt)
- [ ] Taśma izolacyjna lub rurki termokurczliwe
- [ ] Opaski zaciskowe (20-30 szt)

### VPN (opcjonalnie)
- [ ] Router z VPN lub Raspberry Pi 4
- [ ] microSD 16GB (dla RPi)
- [ ] Zasilacz USB-C 5V/3A (dla RPi)
- [ ] Obudowa z wentylatorem (dla RPi)

### Narzędzia (jeśli nie posiadasz)
- [ ] Śrubokręty (krzyżak, płaski)
- [ ] Szczypce do zdejmowania izolacji
- [ ] Multimetr cyfrowy
- [ ] Lutownica (opcjonalnie)
- [ ] Wiertarka (opcjonalnie)

## Wskazówki zakupowe

### Gdzie kupić w Polsce?

**Elektronika i ESP32:**
1. **Botland.com.pl** - Szeroki wybór, dobre ceny, szybka wysyłka
2. **Kamami.pl** - Profesjonalne komponenty
3. **Allegro.pl** - Różni sprzedawcy, porównaj ceny
4. **x-kom.pl** - Głównie komputery, ale mają też elektronikę

**AliExpress:**
- Najniższe ceny (często 50% taniej)
- Czas dostawy: 2-6 tygodni
- Bez gwarancji zwrotu (trudniejsze reklamacje)
- Dobry wybór dla oszczędnych z cierpliwością

### Porady:

1. **Kupuj ESP32 z pinami przylutowanymi** (jeśli nie masz lutownicy)
2. **Sprawdź opinie** przed zakupem modułów przekaźnikowych
3. **Kup zapas** - zawsze warto mieć jeden ESP32 więcej (na wypadek uszkodzenia)
4. **Zwróć uwagę na napięcie** - przekaźniki muszą być 5V
5. **Nie oszczędzaj na zasilaczach** - tańsze mogą nie dawać stabilnego napięcia

### Alternatywy:

- **Zamiast ESP32:** ESP8266 (tańszy, ale mniej GPIO i mocy)
- **Zamiast przekaźników:** Optocouplers (jeśli znasz elektronikę)
- **Zamiast RPi:** Stary komputer jako serwer VPN

## Linki do przykładowych produktów

**Uwaga:** Ceny i dostępność mogą się zmieniać. Podane linki to przykłady.

### Botland.pl
- ESP32: https://botland.com.pl - szukaj "ESP32 DevKit"
- Przekaźniki: https://botland.com.pl - szukaj "moduł przekaźnikowy 2 kanały"
- Reed switch: https://botland.com.pl - szukaj "czujnik magnetyczny"

### Kamami.pl
- Podobna oferta do Botland
- Dobra jakość komponentów
- Profesjonalne wsparcie techniczne

## Co zrobić po zakupie?

1. ✅ Sprawdź zawartość przesyłek
2. ✅ Przetestuj każdy komponent osobno
3. ✅ Przeczytaj dokumentację
4. ✅ Przejdź do [Installation Guide](installation.md)
5. ✅ Zobacz [Wiring Diagram](wiring.md)

## Pytania?

Jeśli masz pytania co kupić:
- Sprawdź dokumentację projektu
- Przeczytaj opinie innych użytkowników
- Skonsultuj się z sprzedawcą

**Powodzenia w zakupach!** 🛒

