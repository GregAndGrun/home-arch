# Plan: Modern UI Redesign (Rounded + Bottom Bar)

## 1. Komponenty Layoutu i Nawigacji

**Nowe komponenty:**
- `src/components/Layout/SplitScreen.tsx`: Główny wrapper z pomarańczowym nagłówkiem (35% wysokości) i zaokrąglonym białym kontenerem treści.
- `src/components/Navigation/BottomTabBar.tsx`: Dolny pasek nawigacji z ikonami (Home, Stats, Settings).
- `src/components/CategoryHeader.tsx`: Pozioma lista kategorii (Bramy, Światło, itp.) w nagłówku.

**Modyfikacja App.tsx:**
- Zastąpienie obecnego routingu opartego tylko na `currentScreen` integracją z `BottomTabBar`.
- Dodanie obsługi routingu między tabami (Home, Stats, Settings).

## 2. Komponenty Sterowania

**Nowe komponenty:**
- `src/components/CircularGateControl.tsx`: Duży, okrągły przycisk sterowania bramą (zgodny z designem "termostatu").
  - Stan Otwarta: Zielony/Aktywny
  - Stan Zamknięta: Czerwony/Nieaktywny
  - Animacja loading

**Modyfikacja GateDetailScreen:**
- Zastąpienie `GateControlPanel` nowym `CircularGateControl`.
- Dodanie atrapy wykresu "Activity" na dole ekranu.

## 3. Ekrany (Refaktoryzacja)

**HomeScreen:**
- Użycie `SplitScreen`.
- Dodanie `CategoryHeader` w sekcji nagłówka.
- Wyświetlanie siatki urządzeń w dolnej sekcji (zaokrąglonej).

**GatesScreen:**
- Użycie `SplitScreen`.
- Naprawa stylów (użycie `useTheme` zamiast hardcoded kolorów).
- Lista bram w formie kart wewnątrz zaokrąglonego kontenera.

**GateDetailScreen:**
- Użycie `SplitScreen`.
- Centralny element: `CircularGateControl`.
- Dolna sekcja: Wykres aktywności (atrapa).

## 4. Style i Motywy

**Globalne zmiany:**
- Przejście na zaokrąglone rogi (`borderRadius: 30` dla głównego kontenera, `borderRadius: 16` dla kart).
- Użycie `colors.accent` (#FF6B35) jako głównego koloru nagłówka.
- Konsekwentne użycie `useTheme` we wszystkich ekranach (szczególnie naprawa `GatesScreen`).

**Ikony:**
- Użycie `MaterialIcons` (lub `Feather` dla lżejszego wyglądu) spójnie w całej aplikacji.

## 5. Harmonogram Wdrażania

1.  Utworzenie `SplitScreen`, `BottomTabBar`, `CircularGateControl`, `CategoryHeader`.
2.  Aktualizacja `HomeScreen` (nowy layout).
3.  Aktualizacja `GatesScreen` (nowy layout + naprawa tła).
4.  Aktualizacja `GateDetailScreen` (nowy layout + circular control + wykres).
5.  Integracja w `App.tsx`.

