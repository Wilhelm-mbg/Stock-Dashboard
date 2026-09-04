---
tags: [bauplan]
---
# Struktur der Oberfläche — mit Aufnahmen

*Erzeugt am 2026-09-04 von `tools/ui-struktur.js` aus der **laufenden** Oberfläche der Version **8.40.1** — nicht aus `index.html`. Instanz: isolierte Kunstdaten-Instanz (`tools/kunstinstanz.js`), 1280 px breit, ohne Netz; die Zahlen darin sind erfunden, die Struktur ist die echte. Wer die Oberfläche umbaut, fährt das Werkzeug danach einmal — ein Aufruf erneuert Bilder und Seite: `.\node_modules\.bin\electron.cmd tools\ui-struktur.js`.*

**Was hier steht:** ▪ = Überschrift `h2`, · = Überschrift `h3`, ▸ = Klappe (`<details>`). Die Einrückung ist die echte Verschachtelung: eine Klappe **in** einer Klappe steht eine Stufe weiter rechts. `[#kennung]` ist die `id` des Blocks. „verborgen“ heißt: der Block steht in der Seite, ist aber ausgeblendet, bis etwas passiert (z. B. Explorer → „Kennzahlen“ erst nach dem Öffnen eines Werts).

**Grenze dieser Seite.** Sie zeigt, was die laufende Instanz in **diesem** Zustand hergibt — Kunstdepot, kein Netz, jede Klappe zum Lesen einmal geöffnet. Nicht darin: Blöcke, die nur im Fehlerfall erscheinen (Drossel-Hinweis, „N leer versucht“), Inhalte, die erst ein Netzabruf füllt (Explorer, Schein-Finder), und der Inhalt der Dialoge — die stehen unten nur mit ihrem Titel, geöffnet wird keiner. Fließtext, Knöpfe und Tabellen sind bewusst nicht aufgeführt: das hier ist das Inventar der Blöcke, kein Abzug der Seite.

## Baum

```
Heute (data-tab="dashboard")
├─ Überblick (data-sub="ueberblick", #sub-ueberblick)
   │  ▪ Bestand  [in #bestandBlock]
   │  · Momentum-Buch · stärkstes Zehntel, alle 63 Handelstage, 20 Bp je Seite  [in #buchMomentum]
   │  ▸ Klappe: Positionen im Detail — Momentum  [in #buchMomentum]
   │  · Ergebnis-Drift-Buch · 60 Handelstage je Position, long und short, 10 Bp je Seite  [in #buchDrift]
   │  ▸ Klappe: Positionen im Detail — Ergebnis-Drift  [in #buchDrift]
   │  · Intraday-Depot · die Kurzfrist-Regel, virtuelles Kapital  [in #buchIntraday]
   │  · Zuletzt getan – die jüngsten Handlungen aller Bücher  [in #bestandBlock]
   │  · Depotverlauf – jedes Buch gegen sein eigenes Startkapital  [in #bestandBlock]
   │  ▪ Intraday-Depot  [in #intradayBereich]
   │  · Depotverlauf (seit Start der Simulation)  [in #sub-depot]
   │  ▪ Offene Positionen  [in #sub-depot]
   │  ▸ Klappe: Protokoll – jede Handlung des Depots, mit CSV-Ausgabe  [#bestandProtokoll]
   │    ▸ Klappe: Auslöser & Szenario  (6×)  [in #tradeLog]
└─ Meine Papiere (data-sub="papiere", #sub-papiere)
   │  ▪ Meine Papiere – echte Papiere, von der App nie angefasst. Was die gemessenen Regeln zu ihnen sagen, steht in den beiden rechten Spalten.
   │  ▸ Klappe: Papiere übernehmen (Auszug der Depotbank einfügen)

Markt (data-tab="markt")
├─ Überblick (data-sub="marktueberblick", #sub-marktueberblick)
   │  ▪ Marktüberblick
   │  ▪ Sektoren – nach Marktkapitalisierung gewichtet, Branchen aus den SEC-Stammdaten.
   │  ▪ Hotlists – Anzeige, kein Signal: gemessen ist hieran nichts. Gehandelt wird hiervon nichts. Klick öffnet den Explorer.
   │  · Gewinner heute  [in #marktHotlists]
   │  · Verlierer heute  [in #marktHotlists]
   │  · Meist gehandelt (Umsatz)  [in #marktHotlists]
   │  · Ungewöhnliches Volumen  [in #marktHotlists]
   │  · Am 52-Wochen-Hoch  [in #marktHotlists]
   │  ▪ Marktbild – die 15 Werte dieses Reiters, sortiert vom stärksten Gewinner zum stärksten Verlierer. Farbe = heutige Bewegung, Klick öffnet den Explorer
   │  ▸ Klappe: Einzelwerte im Detail – Kennzahlen, 52-Wochen-Spanne, Kursverlauf  [#dashDetail]
   │    ▪ Big Tech  [in #dashDetail]
   │    ▪ Chip-Sektor  [in #dashDetail]
   │  ▪ Ergebnistermine – wer heute und morgen berichtet. Gehandelt wird hiervon nichts.
   │  ▪ Wirtschaftskalender (marktbewegende Termine)
   │  ▪ Markt-News
├─ Marktkarte (data-sub="marktkarte", #sub-marktkarte)
   │  ▪ Marktkarte – Fläche ist Größe, Farbe ist der Tag.
└─ Radar (data-sub="beobachtung", #sub-beobachtung)
   │  ▪ Spekulations-Radar – Gerüchte aus öffentlichen Quellen, dreimal täglich vor US-Eröffnung gesammelt. Gehandelt wird hiervon nichts.
   │  ▪ Insider-Käufe – meldepflichtige Eigengeschäfte von Vorstand und Aufsichtsrat (SEC Form 4). Gehandelt wird hiervon nichts.
   │  ▪ Vorbörsen-Lücken – Werte, die vor der US-Eröffnung deutlich anders stehen als beim gestrigen Schluss. Gehandelt wird hiervon nichts.

Regeln (data-tab="strategien")
├─ Strategien (data-sub="regeln", #sub-regeln)
   │  · Was die App gerade tut  [in #antwortSeite]
   │  · Die Strategien im Überblick
   │  · Belegt oder aktiv gehandelt  [in #stratListe]
   │  · In Messung  [in #stratListe]
   │  · Gemessen und verworfen
   │  ▸ Klappe: Archiv: gemessen und widerlegt – Stunden-Strategie  [#archivWiderlegt]
   │    · Stunden-Strategie  [in #archivWiderlegt]
   │    ▸ Klappe: Wie sie funktioniert hat und was genau gemessen wurde  [in #archivWiderlegt]
└─ Einstellungen (data-sub="einstellungen", #sub-einstellungen)
   │  · Intraday & Risiko  [#abIntraday]
   │  · Intraday-Strategie  [in #sub-strategien]
   │  ▸ Klappe: Was hier gehandelt wird – die beiden gemessenen Einstiege im Klartext  [in #sub-strategien]
   │  ▸ Klappe: Weiterhin wählbar, aber ohne gemessenen Vorsprung  [in #sub-strategien]
   │  ▸ Klappe: Experten-Einstellungen anzeigen (stellt normalerweise die Automatik ein – Änderungen von Hand landen im Experiment-Journal)  [#idExperte]
   │  · Risikomanagement  [in #sub-strategien]
   │  ▸ Klappe: So funktioniert's  [in #sub-strategien]
   │  · Eigene Watchlist – wird bei jedem Scan mitgeprüft  [in #sub-strategien]

Werkzeuge (data-tab="werkzeuge")
├─ Aktien-Explorer (data-sub="explorer", #sub-explorer)
   │  · Einen Wert öffnen  [in #expStart]
   │  · Kennzahlen  [in #expDetail]  (verborgen: ausgeblendet)
   │  · News zu diesem Wert  [in #expDetail]  (verborgen: ausgeblendet)
├─ Schein-Finder (data-sub="scheine", #sub-scheine)
   │  · Schein-Finder · Kennzahlen und Risikostufe
└─ Betrieb (data-sub="betrieb", #sub-betrieb)
   │  ▸ Klappe: Kursarchiv
   │    ▪ Kursarchiv – die App holt die feinen Kerzen selbst und legt sie ab.  [in #sub-archiv]
   │  ▸ Klappe: Autopilot, Marktlage & Kursarchiv auffüllen  — Statuszeile: „Autopilot an · Nachtmessung 04.09.26 · Marktlage 04.09.26“
   │    · Autopilot & Datensammlung  [#abAutopilot]
   │    · Autopilot – die App verbessert sich selbst  [in #sub-auswertung]
   │    ▸ Klappe: Letzte Messung im Detail (Ranking, Empfehlung, Datenbasis)  [in #sub-auswertung]
   │  ▸ Klappe: Kostenmessung Capital & Alpaca  — Statuszeile: „Runden Capital 2 · Alpaca 2 · letzte 02.09.26“
   │  ▸ Klappe: Mittelfrist-Analyse & Bücher steuern  — Statuszeile: „Momentum an · Drift an · zuletzt geprüft 04.09.26“
   │    · Mittelfrist – Momentum & Ergebnis-Drift  [#abMittelfrist]
   │    · Momentum im Querschnitt · Aktien, keine Hebelscheine  [in #sub-mittelfrist]
   │    · Was jetzt zu halten wäre  [in #sub-mittelfrist]
   │    · Wie es sich geschlagen hat  [in #sub-mittelfrist]
   │    · Mittelfrist-Bücher steuern  [in #sub-mittelfrist]
   │    · Ergebnis-Drift · Aktien, keine Hebelscheine  [in #sub-mittelfrist]
   │    · Was wäre heute offen?  [in #sub-mittelfrist]
   │  ▸ Klappe: Live-Signal-Monitor
   │    · Live-Signal-Monitor
   │  ▸ Klappe: Strategie-Chart  [in #sub-werkzeug]
   │    · Strategie-Chart – Signal und Bedingungen nachvollziehen  [in #stratChartPanel]
   │  ▸ Klappe: Regelbuch – die Regel, die handelt · Regeln, die nur messen · Bilanz  [in #sub-werkzeug]  — Statuszeile: „rsi2seit · kein Protokoll“
   │    · Die Regel, die handelt  [in #regelKarte]
   │    · Regeln, die nur messen  [in #regelnKarte]
   │    · Bilanz dieser Regel  [in #regelBilanz]
   │  ▸ Klappe: Berichte & Backtest  [in #sub-werkzeug]
   │    ▸ Klappe: Berichte & Werkzeuge  [in #sub-werkzeug]
   │  ▸ Klappe: Messprotokolle (Scoreboard)
   │    ▪ Scoreboard – jede Strategie, die durch die Messmaschine gelaufen ist. Sortiert nach Belegstatus, nicht nach Rendite.
   │    ▸ Klappe: Für Entwickler  [in #scoreboard]
   │  ▸ Klappe: Strategieregister  — Statuszeile: „25 Strategien im Register“
   │    ▪ Strategien – alle Regeln, die es gibt: wo sie liegen und was aus ihnen wurde.
   │  ▸ Klappe: Neue Strategie ins Rennen schicken
   │    ▪ Neue Strategie ins Rennen schicken
   │    ▸ Klappe: Was die App daraus gemacht hat (Code ansehen)  [#stCodeAuf]
   │  ▸ Klappe: Trendfinder — Detektor widerlegt  — Statuszeile: „widerlegt · Studie 22.08.2026“

Dialoge (gehören zu keinem Reiter)
├─ Kurz gesagt  [#erststartModalBg]
├─ Was ist neu  [#wasNeuModalBg]
├─ Analyse  [#aiModalBg]
├─ Trade nachbilden  [#ticketModalBg]
├─ App-Einstellungen  [#setModalBg]
└─ Diagnosedaten teilen? Die App kann anonyme Diagnosedaten an die zentrale …  (gekürzt von 1240 Zeichen)  [#diagModalBg]
```

## Heute

### Heute → Überblick

`#sub-ueberblick` · 13 Blöcke · 4477 Zeichen sichtbarer Text

- ▪ Bestand  [in #bestandBlock]
- · Momentum-Buch · stärkstes Zehntel, alle 63 Handelstage, 20 Bp je Seite  [in #buchMomentum]
- ▸ Klappe: Positionen im Detail — Momentum  [in #buchMomentum]
- · Ergebnis-Drift-Buch · 60 Handelstage je Position, long und short, 10 Bp je Seite  [in #buchDrift]
- ▸ Klappe: Positionen im Detail — Ergebnis-Drift  [in #buchDrift]
- · Intraday-Depot · die Kurzfrist-Regel, virtuelles Kapital  [in #buchIntraday]
- · Zuletzt getan – die jüngsten Handlungen aller Bücher  [in #bestandBlock]
- · Depotverlauf – jedes Buch gegen sein eigenes Startkapital  [in #bestandBlock]
- ▪ Intraday-Depot  [in #intradayBereich]
- · Depotverlauf (seit Start der Simulation)  [in #sub-depot]
- ▪ Offene Positionen  [in #sub-depot]
- ▸ Klappe: Protokoll – jede Handlung des Depots, mit CSV-Ausgabe  [#bestandProtokoll]
  - ▸ Klappe: Auslöser & Szenario  (6×)  [in #tradeLog]

![[aufnahmen/heute/ueberblick-1.png]]
![[aufnahmen/heute/ueberblick-2.png]]
![[aufnahmen/heute/ueberblick-3.png]]

### Heute → Meine Papiere

`#sub-papiere` · 2 Blöcke · 641 Zeichen sichtbarer Text

- ▪ Meine Papiere – echte Papiere, von der App nie angefasst. Was die gemessenen Regeln zu ihnen sagen, steht in den beiden rechten Spalten.
- ▸ Klappe: Papiere übernehmen (Auszug der Depotbank einfügen)

![[aufnahmen/heute/papiere-1.png]]

## Markt

### Markt → Überblick

`#sub-marktueberblick` · 15 Blöcke · 5439 Zeichen sichtbarer Text

- ▪ Marktüberblick
- ▪ Sektoren – nach Marktkapitalisierung gewichtet, Branchen aus den SEC-Stammdaten.
- ▪ Hotlists – Anzeige, kein Signal: gemessen ist hieran nichts. Gehandelt wird hiervon nichts. Klick öffnet den Explorer.
- · Gewinner heute  [in #marktHotlists]
- · Verlierer heute  [in #marktHotlists]
- · Meist gehandelt (Umsatz)  [in #marktHotlists]
- · Ungewöhnliches Volumen  [in #marktHotlists]
- · Am 52-Wochen-Hoch  [in #marktHotlists]
- ▪ Marktbild – die 15 Werte dieses Reiters, sortiert vom stärksten Gewinner zum stärksten Verlierer. Farbe = heutige Bewegung, Klick öffnet den Explorer
- ▸ Klappe: Einzelwerte im Detail – Kennzahlen, 52-Wochen-Spanne, Kursverlauf  [#dashDetail]
  - ▪ Big Tech  [in #dashDetail]
  - ▪ Chip-Sektor  [in #dashDetail]
- ▪ Ergebnistermine – wer heute und morgen berichtet. Gehandelt wird hiervon nichts.
- ▪ Wirtschaftskalender (marktbewegende Termine)
- ▪ Markt-News

![[aufnahmen/markt/marktueberblick-1.png]]
![[aufnahmen/markt/marktueberblick-2.png]]
![[aufnahmen/markt/marktueberblick-3.png]]
![[aufnahmen/markt/marktueberblick-4.png]]

### Markt → Marktkarte

`#sub-marktkarte` · 1 Blöcke · 773 Zeichen sichtbarer Text

- ▪ Marktkarte – Fläche ist Größe, Farbe ist der Tag.

![[aufnahmen/markt/marktkarte-1.png]]
![[aufnahmen/markt/marktkarte-2.png]]

### Markt → Radar

`#sub-beobachtung` · 3 Blöcke · 2745 Zeichen sichtbarer Text

- ▪ Spekulations-Radar – Gerüchte aus öffentlichen Quellen, dreimal täglich vor US-Eröffnung gesammelt. Gehandelt wird hiervon nichts.
- ▪ Insider-Käufe – meldepflichtige Eigengeschäfte von Vorstand und Aufsichtsrat (SEC Form 4). Gehandelt wird hiervon nichts.
- ▪ Vorbörsen-Lücken – Werte, die vor der US-Eröffnung deutlich anders stehen als beim gestrigen Schluss. Gehandelt wird hiervon nichts.

![[aufnahmen/markt/beobachtung-1.png]]
![[aufnahmen/markt/beobachtung-2.png]]
![[aufnahmen/markt/beobachtung-3.png]]

## Regeln

### Regeln → Strategien

`#sub-regeln` · 8 Blöcke · 7160 Zeichen sichtbarer Text

- · Was die App gerade tut  [in #antwortSeite]
- · Die Strategien im Überblick
- · Belegt oder aktiv gehandelt  [in #stratListe]
- · In Messung  [in #stratListe]
- · Gemessen und verworfen
- ▸ Klappe: Archiv: gemessen und widerlegt – Stunden-Strategie  [#archivWiderlegt]
  - · Stunden-Strategie  [in #archivWiderlegt]
  - ▸ Klappe: Wie sie funktioniert hat und was genau gemessen wurde  [in #archivWiderlegt]

![[aufnahmen/regeln/regeln-1.png]]
![[aufnahmen/regeln/regeln-2.png]]
![[aufnahmen/regeln/regeln-3.png]]

### Regeln → Einstellungen

`#sub-einstellungen` · 8 Blöcke · 8680 Zeichen sichtbarer Text

- · Intraday & Risiko  [#abIntraday]
- · Intraday-Strategie  [in #sub-strategien]
- ▸ Klappe: Was hier gehandelt wird – die beiden gemessenen Einstiege im Klartext  [in #sub-strategien]
- ▸ Klappe: Weiterhin wählbar, aber ohne gemessenen Vorsprung  [in #sub-strategien]
- ▸ Klappe: Experten-Einstellungen anzeigen (stellt normalerweise die Automatik ein – Änderungen von Hand landen im Experiment-Journal)  [#idExperte]
- · Risikomanagement  [in #sub-strategien]
- ▸ Klappe: So funktioniert's  [in #sub-strategien]
- · Eigene Watchlist – wird bei jedem Scan mitgeprüft  [in #sub-strategien]

![[aufnahmen/regeln/einstellungen-1.png]]
![[aufnahmen/regeln/einstellungen-2.png]]

## Werkzeuge

### Werkzeuge → Aktien-Explorer

`#sub-explorer` · 3 Blöcke · 268 Zeichen sichtbarer Text

- · Einen Wert öffnen  [in #expStart]
- · Kennzahlen  [in #expDetail]  (verborgen: ausgeblendet)
- · News zu diesem Wert  [in #expDetail]  (verborgen: ausgeblendet)

![[aufnahmen/werkzeuge/explorer-1.png]]

### Werkzeuge → Schein-Finder

`#sub-scheine` · 1 Blöcke · 648 Zeichen sichtbarer Text

- · Schein-Finder · Kennzahlen und Risikostufe

![[aufnahmen/werkzeuge/scheine-1.png]]

### Werkzeuge → Betrieb

`#sub-betrieb` · 34 Blöcke · 18709 Zeichen sichtbarer Text

- ▸ Klappe: Kursarchiv
  - ▪ Kursarchiv – die App holt die feinen Kerzen selbst und legt sie ab.  [in #sub-archiv]
- ▸ Klappe: Autopilot, Marktlage & Kursarchiv auffüllen  — Statuszeile: „Autopilot an · Nachtmessung 04.09.26 · Marktlage 04.09.26“
  - · Autopilot & Datensammlung  [#abAutopilot]
  - · Autopilot – die App verbessert sich selbst  [in #sub-auswertung]
  - ▸ Klappe: Letzte Messung im Detail (Ranking, Empfehlung, Datenbasis)  [in #sub-auswertung]
- ▸ Klappe: Kostenmessung Capital & Alpaca  — Statuszeile: „Runden Capital 2 · Alpaca 2 · letzte 02.09.26“
- ▸ Klappe: Mittelfrist-Analyse & Bücher steuern  — Statuszeile: „Momentum an · Drift an · zuletzt geprüft 04.09.26“
  - · Mittelfrist – Momentum & Ergebnis-Drift  [#abMittelfrist]
  - · Momentum im Querschnitt · Aktien, keine Hebelscheine  [in #sub-mittelfrist]
  - · Was jetzt zu halten wäre  [in #sub-mittelfrist]
  - · Wie es sich geschlagen hat  [in #sub-mittelfrist]
  - · Mittelfrist-Bücher steuern  [in #sub-mittelfrist]
  - · Ergebnis-Drift · Aktien, keine Hebelscheine  [in #sub-mittelfrist]
  - · Was wäre heute offen?  [in #sub-mittelfrist]
- ▸ Klappe: Live-Signal-Monitor
  - · Live-Signal-Monitor
- ▸ Klappe: Strategie-Chart  [in #sub-werkzeug]
  - · Strategie-Chart – Signal und Bedingungen nachvollziehen  [in #stratChartPanel]
- ▸ Klappe: Regelbuch – die Regel, die handelt · Regeln, die nur messen · Bilanz  [in #sub-werkzeug]  — Statuszeile: „rsi2seit · kein Protokoll“
  - · Die Regel, die handelt  [in #regelKarte]
  - · Regeln, die nur messen  [in #regelnKarte]
  - · Bilanz dieser Regel  [in #regelBilanz]
- ▸ Klappe: Berichte & Backtest  [in #sub-werkzeug]
  - ▸ Klappe: Berichte & Werkzeuge  [in #sub-werkzeug]
- ▸ Klappe: Messprotokolle (Scoreboard)
  - ▪ Scoreboard – jede Strategie, die durch die Messmaschine gelaufen ist. Sortiert nach Belegstatus, nicht nach Rendite.
  - ▸ Klappe: Für Entwickler  [in #scoreboard]
- ▸ Klappe: Strategieregister  — Statuszeile: „25 Strategien im Register“
  - ▪ Strategien – alle Regeln, die es gibt: wo sie liegen und was aus ihnen wurde.
- ▸ Klappe: Neue Strategie ins Rennen schicken
  - ▪ Neue Strategie ins Rennen schicken
  - ▸ Klappe: Was die App daraus gemacht hat (Code ansehen)  [#stCodeAuf]
- ▸ Klappe: Trendfinder — Detektor widerlegt  — Statuszeile: „widerlegt · Studie 22.08.2026“

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

## Dialoge

Modaldialoge am Ende von `index.html`. Sie gehören zu **keinem** Reiter — die Fassung vom 04.09. hatte sie Werkzeuge → Betrieb zugeschlagen (QS-Fund S7). Geöffnet wird hier keiner; aufgeführt ist der Titel, den auch ein Screenreader vorliest (`aria-labelledby`).

- **Kurz gesagt**  [#erststartModalBg]  · Titel aus `#erststartTitle`
- **Was ist neu**  [#wasNeuModalBg]  · Titel aus `#wasNeuTitle`
- **Analyse**  [#aiModalBg]  · Titel aus `#aiTitle`
- **Trade nachbilden**  [#ticketModalBg]  · Titel aus `#ticketTitle`
- **App-Einstellungen**  [#setModalBg]  · Titel aus `#setTitle`
- **Diagnosedaten teilen? Die App kann anonyme Diagnosedaten an die zentrale …**  [#diagModalBg]  · Titel aus `#diagEinwText`  · hier gekürzt, im Dialog 1240 Zeichen
