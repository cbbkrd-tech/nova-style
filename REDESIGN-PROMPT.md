# Nova Style - Pełny Redesign Frontend

## Cel
Przeprowadź kompletny redesign frontendu sklepu Nova Style. Implementacja ma być pixel-perfect względem dostarczonych mockupów, z pełną interaktywnością (animacje, micro-interactions, efekty premium).

---

## Projekt

**Stack technologiczny:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (backend - nie zmieniaj logiki pobierania danych)

**Struktura plików do edycji:**
```
storefront/src/
├── App.tsx                    # Główny komponent aplikacji
├── index.css                  # Globalne style
├── components/
│   ├── Header.tsx             # Nawigacja górna
│   ├── Hero.tsx               # Sekcja hero na stronie głównej
│   ├── ProductGrid.tsx        # Siatka produktów
│   ├── ProductDetail.tsx      # Strona szczegółów produktu
│   ├── CartView.tsx           # Widok koszyka
│   ├── Footer.tsx             # Stopka
│   ├── Sidebar.tsx            # Menu mobilne
│   ├── Icons.tsx              # Komponenty ikon
│   ├── BottomNav.tsx          # Dolna nawigacja mobilna
│   ├── LegalModals.tsx        # Modale prawne (nie zmieniaj)
│   └── OptimizedImage.tsx     # Komponent obrazków
└── tailwind.config.js         # Konfiguracja Tailwind
```

---

## Assety designu

Wszystkie assety znajdują się w folderze `Redesign assets/`:

| Plik | Opis |
|------|------|
| `strona-glowna-mockup.png` | **GŁÓWNY MOCKUP** - pixel-perfect wzór strony głównej |
| `design-system-kolory-typografia-ikony.png` | System designu: paleta kolorów, typografia, ikony, przyciski |
| `logo-pelne-jasne-tlo.png` | Logo pełne (NS + "Nova Style Fashion Boutique") na jasnym tle |
| `logo-pelne-ciemne-tlo.png` | Logo pełne na ciemnym tle |
| `logo-znak-ns-biale-tlo.png` | Sam znak NS na białym tle |
| `logo-znak-ns-bezowe-tlo.png` | Znak NS na beżowym tle |
| `logo-tekst-nova-style.png` | Sam tekst "NOVA STYLE" |

**WAŻNE:** Przed rozpoczęciem pracy, otwórz i przeanalizuj WSZYSTKIE obrazki z tego folderu!

---

## Design System (z `design-system-kolory-typografia-ikony.png`)

### Paleta kolorów
```css
--warm-beige: #D4C4A8;      /* Główny akcent, tła sekcji, CTA */
--off-white: #FBF6F3;       /* Tło strony */
--charcoal-text: #333333;   /* Tekst główny */
--light-grey: #E8E8E8;      /* Bordery, separatory */
```

### Typografia
- **Logo & Headings:** Font elegancki, szeryfowy dla "NOVA STYLE"
- **Body & Navigation:** Sans-serif, lekki, nowoczesny
- **Styl:** Uppercase dla nawigacji i nagłówków kategorii

### Przyciski
- Wariant filled: tło beżowe (#D4C4A8), tekst ciemny
- Wariant outlined: border ciemny, tło transparentne
- Hover: subtelna zmiana opacity lub tła

---

## Strona Główna (pixel-perfect z `strona-glowna-mockup.png`)

### 1. Top Bar
- Pełna szerokość, tło beżowe (#D4C4A8)
- Tekst: "Darmowa dostawa na terenie Polski od 400 zł"
- Centered, mały font

### 2. Header/Nawigacja
- Tło: off-white (#FBF6F3)
- Logo NS (złote/gradient) wycentrowane
- Pod logo: "NOVA STYLE" + "FASHION BOUTIQUE"
- Menu: NOWOŚCI | DAMSKIE | MĘSKIE | DRESY I ZESTAWY | BLUZY | AKCESORIA | BESTSELLERY | WYPRZEDAŻ
- Prawa strona: ikony profil, serduszko, koszyk + social icons (FB, IG)
- **WAŻNE:** Zachowaj istniejącą logikę kategorii (men/women) - menu DAMSKIE = women, MĘSKIE = men

### 3. Hero Section
- Dwa panele obok siebie (50/50)
- Lewy panel: "KOBIETY" - kobieta w beżowym dresie, szare tło
- Prawy panel: "MĘŻCZYŹNI" - mężczyzna w grafitowym dresie, szare tło
- Tekst na środku każdego panelu, duży, biały z cieniem
- **Klikalne** - prowadzą do kategorii women/men

### 4. Sekcja Produktów
- Tło białe
- 6 produktów w rzędzie na desktop (3 damskie + 3 męskie jak na mockupie)
- Karty produktów:
  - Zdjęcie produktu na szarym tle
  - Nazwa produktu pod zdjęciem
  - Cena w PLN
  - Hover: subtelne powiększenie lub cień

### 5. Benefits Bar
- Tło beżowe (#D4C4A8)
- 4 kolumny z ikonami:
  - DARMOWA DOSTAWA - "Przy zakupach za minimum 400 zł"
  - NOWE KOLEKCJE - "w każdym miesiącu"
  - BEZPIECZEŃSTWO ZAKUPÓW - "Płać wygodnie i bez obaw"
  - ZAKUPY BEZ RYZYKA - "14 dni na zwrot lub wymianę"

### 6. Kolejna sekcja produktów
- Pod benefits bar kolejne produkty (dresy)
- Ten sam styl kart

### 7. Footer
- Zachowaj istniejącą strukturę i dane kontaktowe
- Dostosuj style do nowego designu (jasne tło, ciemny tekst)

---

## Strony Kategorii (women/men)

Bazuj na stylu strony głównej:
- Ten sam header
- Tytuł kategorii: "KOBIETY" lub "MĘŻCZYŹNI"
- Grid produktów (4 kolumny desktop, 2 mobile)
- Filtrowanie po podkategoriach (zachowaj istniejącą logikę subcategories)

---

## Strona Produktu

- Duże zdjęcie produktu (lewa strona)
- Info produktu (prawa strona):
  - Nazwa
  - Cena
  - Opis
  - Wybór rozmiaru (S, M, L, XL)
  - Przycisk "DODAJ DO KOSZYKA" (beżowy)
- Zachowaj istniejącą logikę dodawania do koszyka

---

## Koszyk

- Czyste, minimalistyczne
- Lista produktów z miniaturkami
- Możliwość zmiany ilości (+/-)
- Usuwanie produktów
- Podsumowanie: suma, przycisk do checkoutu
- Styl zgodny z nowym designem

---

## Animacje i Interakcje (WYMAGANE)

### Globalne
```css
/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Transitions na wszystkich interaktywnych elementach */
* { transition: all 0.3s ease; }
```

### Header
- Sticky header z efektem blur/shadow przy scrollu
- Hover na linkach menu: underline animowany od środka
- Ikony: scale na hover

### Hero
- Subtle parallax lub zoom effect na zdjęciach
- Tekst "KOBIETY"/"MĘŻCZYŹNI" z text-shadow dla czytelności
- Hover: przyciemnienie overlay + scale zdjęcia

### Karty produktów
- Hover:
  - Transform: translateY(-5px)
  - Box-shadow pojawia się
  - Zdjęcie: scale(1.05)
- Opcjonalnie: quick-add button pojawia się na hover

### Przyciski
- Hover: background lightens/darkens
- Active: scale(0.98)
- Focus: outline ring

### Page transitions
- Fade-in przy zmianie widoku
- Skeleton loading dla produktów

### Mobile
- Hamburger menu: smooth slide-in z overlay
- Touch feedback na wszystkich przyciskach

---

## Responsywność

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile specifics
- Hero: stack vertical (kobiety nad mężczyznami)
- Produkty: 2 kolumny
- Menu: hamburger + slide-out sidebar
- Bottom navigation bar (zachowaj BottomNav.tsx)

---

## Instrukcje implementacji

1. **NAJPIERW** otwórz i przeanalizuj wszystkie obrazki z `Redesign assets/`
2. Zaktualizuj `tailwind.config.js` z nową paletą kolorów
3. Zaktualizuj `index.css` z globalnymi stylami i fontami
4. Przepisz komponenty w kolejności:
   - Header.tsx (z top bar)
   - Hero.tsx
   - ProductGrid.tsx + karty produktów
   - ProductDetail.tsx
   - CartView.tsx
   - Footer.tsx
   - Sidebar.tsx (mobile menu)
5. Zaktualizuj App.tsx jeśli potrzeba (layout, spacing)

## Czego NIE zmieniać

- Logika pobierania danych z Supabase
- Struktura typów (types/types.ts)
- Logika koszyka (dodawanie, usuwanie, quantity)
- Logika routingu (hash-based navigation)
- LegalModals.tsx
- Folder admin/

---

## Checklist końcowy

- [ ] Strona główna pixel-perfect z mockupem
- [ ] Wszystkie kolory zgodne z design systemem
- [ ] Logo NS poprawnie zaimplementowane
- [ ] Nawigacja działa (kategorie, podkategorie)
- [ ] Hero sekcja z dwoma klikalnymi panelami
- [ ] Karty produktów z hover effects
- [ ] Benefits bar z ikonami
- [ ] Strony kategorii działają
- [ ] Strona produktu działa
- [ ] Koszyk działa
- [ ] Mobile w pełni responsywny
- [ ] Wszystkie animacje zaimplementowane
- [ ] Smooth transitions między widokami
- [ ] Brak błędów w konsoli

---

**Zacznij od analizy obrazków, potem implementuj systematycznie. Powodzenia!**


nie robimy zmian live- na razie tylko lokalnie bez wypychania zmian do git! 
