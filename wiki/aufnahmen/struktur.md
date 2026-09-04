---
tags: [bauplan]
---
# Struktur der Oberfläche — mit Aufnahmen

*Erzeugt am 2026-09-04 aus `index.html` (Reiter, Pillen, Überschriften, Klappen) und den Aufnahmen einer ISOLIERTEN Kunstdaten-Instanz (`tools/ui-aufnahmen.js --kunstdaten`, 1280 px; Zahlen darin sind erfunden). Wer die Oberfläche umbaut, erneuert nach dem Umbau diesen Ordner: Aufnahmen neu fotografieren, diese Seite neu erzeugen. Die Aufnahmen liegen je Reiter in einem Unterordner, damit die Struktur auch im Datei-Baum sichtbar ist.*

## Baum

```
Heute (data-tab="dashboard")
├─ Überblick (data-sub="ueberblick", #sub-ueberblick)
   │  Bestand
   │  · Momentum-Buch · stärkstes Zehntel, alle 63 Handelstage, 20 Bp je Seite
   │  ▸ Klappe: Positionen im Detail — Momentum
   │  · Ergebnis-Drift-Buch · 60 Handelstage je Position, long und short, 10 Bp je Seite
   │  ▸ Klappe: Positionen im Detail — Ergebnis-Drift
   │  · Intraday-Depot · die Kurzfrist-Regel, virtuelles Kapital
   │  · Zuletzt getan – die jüngsten Handlungen aller Bücher
   │  · Depotverlauf – jedes Buch gegen sein eigenes Startkapital
   │  Intraday-Depot
   │  · Depotverlauf (seit Start der Simulation)
   │  Offene Positionen
   │  ▸ Klappe: Protokoll – jede Handlung des Depots, mit CSV-Ausgabe
└─ Meine Papiere (data-sub="papiere", #sub-papiere)
      ▸ Klappe: Papiere übernehmen (Auszug der Depotbank einfügen)

Markt (data-tab="markt")
├─ Überblick (data-sub="marktueberblick", #sub-marktueberblick)
   │  Marktüberblick
   │  Sektoren – nach Marktkapitalisierung gewichtet, Branchen aus den SEC-Stammdaten. i
   │  Hotlists – Anzeige, kein Signal: gemessen ist hieran nichts. Klick öffnet den Explorer. i
   │  ▸ Klappe: Einzelwerte im Detail – Kennzahlen, 52-Wochen-Spanne, Kursverlauf
   │  Big Tech
   │  Chip-Sektor
   │  Ergebnistermine – wer heute und morgen berichtet. i
   │  Wirtschaftskalender (marktbewegende Termine)
   │  Markt-News
├─ Marktkarte (data-sub="marktkarte", #sub-marktkarte)
   │  Marktkarte – Fläche ist Größe, Farbe ist der Tag. i
└─ Radar (data-sub="beobachtung", #sub-beobachtung)

Regeln (data-tab="strategien")
├─ Strategien (data-sub="regeln", #sub-regeln)
   │  · Was die App gerade tut i
   │  · Die Strategien im Überblick
   │  · Gemessen und verworfen
   │  ▸ Klappe: Archiv: gemessen und widerlegt – Stunden-Strategie
   │  · Stunden-Strategie
   │  ▸ Klappe: Wie sie funktioniert hat und was genau gemessen wurde
└─ Einstellungen (data-sub="einstellungen", #sub-einstellungen)
      · Intraday & Risiko
      · Intraday-Strategie
      ▸ Klappe: Was hier gehandelt wird – die beiden gemessenen Einstiege im Klartext
      ▸ Klappe: Weiterhin wählbar, aber ohne gemessenen Vorsprung
      · Risikomanagement
      ▸ Klappe: So funktioniert's
      · Eigene Watchlist – wird bei jedem Scan mitgeprüft i

Werkzeuge (data-tab="werkzeuge")
├─ Aktien-Explorer (data-sub="explorer", #sub-explorer)
   │  · Kennzahlen
   │  · News zu diesem Wert
├─ Schein-Finder (data-sub="scheine", #sub-scheine)
   │  · Schein-Finder · Kennzahlen und Risikostufe i
└─ Betrieb (data-sub="betrieb", #sub-betrieb)
      ▸ Klappe: Kursarchiv
      Kursarchiv – die App holt die feinen Kerzen selbst und legt sie ab. i
      ▸ Klappe: Autopilot, Marktlage & Kursarchiv auffüllen
      · Autopilot & Datensammlung
      · Autopilot – die App verbessert sich selbst i
      ▸ Klappe: Letzte Messung im Detail (Ranking, Empfehlung, Datenbasis)
      ▸ Klappe: Kostenmessung Capital & Alpaca
      ▸ Klappe: Mittelfrist-Analyse & Bücher steuern
      · Mittelfrist – Momentum & Ergebnis-Drift
      · Momentum im Querschnitt · Aktien, keine Hebelscheine i
      · Was jetzt zu halten wäre
      · Wie es sich geschlagen hat
      · Mittelfrist-Bücher steuern
      · Ergebnis-Drift · Aktien, keine Hebelscheine i
      · Was wäre heute offen?
      ▸ Klappe: Live-Signal-Monitor
      · Live-Signal-Monitor
      ▸ Klappe: Strategie-Chart
      · Strategie-Chart – Signal und Bedingungen nachvollziehen i
      ▸ Klappe: Regelbuch – die Regel, die handelt · Regeln, die nur messen · Bilanz
      · Die Regel, die handelt i
      · Regeln, die nur messen i
      · Bilanz dieser Regel
      ▸ Klappe: Berichte & Backtest
      ▸ Klappe: Berichte & Werkzeuge
      ▸ Klappe: Messprotokolle (Scoreboard)
      ▸ Klappe: Strategieregister
      Strategien – alle Regeln, die es gibt: wo sie liegen und was aus ihnen wurde. i
      ▸ Klappe: Neue Strategie ins Rennen schicken
      Neue Strategie ins Rennen schicken i
      ▸ Klappe: Was die App daraus gemacht hat (Code ansehen)
      ▸ Klappe: Trendfinder — Detektor widerlegt
      Kurz gesagt
      Was ist neu
      Analyse
      Trade nachbilden
      App-Einstellungen

```

## Heute

### Heute → Überblick

- Bestand
- · Momentum-Buch · stärkstes Zehntel, alle 63 Handelstage, 20 Bp je Seite
- ▸ Klappe: Positionen im Detail — Momentum
- · Ergebnis-Drift-Buch · 60 Handelstage je Position, long und short, 10 Bp je Seite
- ▸ Klappe: Positionen im Detail — Ergebnis-Drift
- · Intraday-Depot · die Kurzfrist-Regel, virtuelles Kapital
- · Zuletzt getan – die jüngsten Handlungen aller Bücher
- · Depotverlauf – jedes Buch gegen sein eigenes Startkapital
- Intraday-Depot
- · Depotverlauf (seit Start der Simulation)
- Offene Positionen
- ▸ Klappe: Protokoll – jede Handlung des Depots, mit CSV-Ausgabe

![[aufnahmen/heute/ueberblick-1.png]]
![[aufnahmen/heute/ueberblick-2.png]]
![[aufnahmen/heute/ueberblick-3.png]]

### Heute → Meine Papiere

- ▸ Klappe: Papiere übernehmen (Auszug der Depotbank einfügen)

![[aufnahmen/heute/papiere-1.png]]

## Markt

### Markt → Überblick

- Marktüberblick
- Sektoren – nach Marktkapitalisierung gewichtet, Branchen aus den SEC-Stammdaten. i
- Hotlists – Anzeige, kein Signal: gemessen ist hieran nichts. Klick öffnet den Explorer. i
- ▸ Klappe: Einzelwerte im Detail – Kennzahlen, 52-Wochen-Spanne, Kursverlauf
- Big Tech
- Chip-Sektor
- Ergebnistermine – wer heute und morgen berichtet. i
- Wirtschaftskalender (marktbewegende Termine)
- Markt-News

![[aufnahmen/markt/marktueberblick-1.png]]
![[aufnahmen/markt/marktueberblick-2.png]]
![[aufnahmen/markt/marktueberblick-3.png]]
![[aufnahmen/markt/marktueberblick-4.png]]

### Markt → Marktkarte

- Marktkarte – Fläche ist Größe, Farbe ist der Tag. i

![[aufnahmen/markt/marktkarte-1.png]]
![[aufnahmen/markt/marktkarte-2.png]]

### Markt → Radar

![[aufnahmen/markt/beobachtung-1.png]]
![[aufnahmen/markt/beobachtung-2.png]]
![[aufnahmen/markt/beobachtung-3.png]]

## Regeln

### Regeln → Strategien

- · Was die App gerade tut i
- · Die Strategien im Überblick
- · Gemessen und verworfen
- ▸ Klappe: Archiv: gemessen und widerlegt – Stunden-Strategie
- · Stunden-Strategie
- ▸ Klappe: Wie sie funktioniert hat und was genau gemessen wurde

![[aufnahmen/regeln/regeln-1.png]]
![[aufnahmen/regeln/regeln-2.png]]
![[aufnahmen/regeln/regeln-3.png]]

### Regeln → Einstellungen

- · Intraday & Risiko
- · Intraday-Strategie
- ▸ Klappe: Was hier gehandelt wird – die beiden gemessenen Einstiege im Klartext
- ▸ Klappe: Weiterhin wählbar, aber ohne gemessenen Vorsprung
- · Risikomanagement
- ▸ Klappe: So funktioniert's
- · Eigene Watchlist – wird bei jedem Scan mitgeprüft i

![[aufnahmen/regeln/einstellungen-1.png]]
![[aufnahmen/regeln/einstellungen-2.png]]

## Werkzeuge

### Werkzeuge → Aktien-Explorer

- · Kennzahlen
- · News zu diesem Wert

![[aufnahmen/werkzeuge/explorer-1.png]]

### Werkzeuge → Schein-Finder

- · Schein-Finder · Kennzahlen und Risikostufe i

![[aufnahmen/werkzeuge/scheine-1.png]]

### Werkzeuge → Betrieb

- ▸ Klappe: Kursarchiv
- Kursarchiv – die App holt die feinen Kerzen selbst und legt sie ab. i
- ▸ Klappe: Autopilot, Marktlage & Kursarchiv auffüllen
- · Autopilot & Datensammlung
- · Autopilot – die App verbessert sich selbst i
- ▸ Klappe: Letzte Messung im Detail (Ranking, Empfehlung, Datenbasis)
- ▸ Klappe: Kostenmessung Capital & Alpaca
- ▸ Klappe: Mittelfrist-Analyse & Bücher steuern
- · Mittelfrist – Momentum & Ergebnis-Drift
- · Momentum im Querschnitt · Aktien, keine Hebelscheine i
- · Was jetzt zu halten wäre
- · Wie es sich geschlagen hat
- · Mittelfrist-Bücher steuern
- · Ergebnis-Drift · Aktien, keine Hebelscheine i
- · Was wäre heute offen?
- ▸ Klappe: Live-Signal-Monitor
- · Live-Signal-Monitor
- ▸ Klappe: Strategie-Chart
- · Strategie-Chart – Signal und Bedingungen nachvollziehen i
- ▸ Klappe: Regelbuch – die Regel, die handelt · Regeln, die nur messen · Bilanz
- · Die Regel, die handelt i
- · Regeln, die nur messen i
- · Bilanz dieser Regel
- ▸ Klappe: Berichte & Backtest
- ▸ Klappe: Berichte & Werkzeuge
- ▸ Klappe: Messprotokolle (Scoreboard)
- ▸ Klappe: Strategieregister
- Strategien – alle Regeln, die es gibt: wo sie liegen und was aus ihnen wurde. i
- ▸ Klappe: Neue Strategie ins Rennen schicken
- Neue Strategie ins Rennen schicken i
- ▸ Klappe: Was die App daraus gemacht hat (Code ansehen)
- ▸ Klappe: Trendfinder — Detektor widerlegt
- Kurz gesagt
- Was ist neu
- Analyse
- Trade nachbilden
- App-Einstellungen

![[aufnahmen/werkzeuge/betrieb-1.png]]
![[aufnahmen/werkzeuge/betrieb-offen-1.png]]
![[aufnahmen/werkzeuge/betrieb-offen-2.png]]
![[aufnahmen/werkzeuge/betrieb-offen-3.png]]
![[aufnahmen/werkzeuge/betrieb-offen-4.png]]
![[aufnahmen/werkzeuge/betrieb-offen-5.png]]
![[aufnahmen/werkzeuge/betrieb-offen-6.png]]
![[aufnahmen/werkzeuge/betrieb-offen-7.png]]
![[aufnahmen/werkzeuge/betrieb-offen-8.png]]
![[aufnahmen/werkzeuge/betrieb-offen-9.png]]
![[aufnahmen/werkzeuge/betrieb-offen-10.png]]

