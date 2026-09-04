---
tags: [bauplan]
---
# Oberfläche — Ist, Befund, Zielbild „vier Bildschirme"

*Stand 02.09.2026 (PM). Entscheid Wilhelm 02.09. abends: **schneiden auf drei Bildschirme**, nicht
umräumen. Fundstellen: Aufnahmen aller 15 Seiten in isolierter Instanz (Rezept §6),
Code-Karte vom 02.09. (Explore-Agent, in diese Seite eingearbeitet),
`studien/struktur-plan-2026-08-25/PLAN.md` (Leitplanken §5 gelten weiter).*

> **Achtung, §1 und §5 sind seit dem 02.09. abends Geschichte, nicht Gegenwart.** Stufe 1
> ist geliefert: die App hat drei Reiter, neun Pillen und den Maschinenraum
> `#sub-betrieb` mit elf `<details>`-Klappen (`data-klappe`). Beides bleibt stehen, weil
> es beschreibt, WOVON umgezogen wurde — der Ist-Zustand steht ab jetzt in §3 (Zielbild)
> und in `uebergabe/oberflaeche-stufe1-2026-09-02.md`. Die Zeilennummern in §5 gelten
> nicht mehr; die Klinken selbst tragen ihre Begründung im Code.

## 1. Ist-Zustand vor Stufe 1 (v8.37.3)

5 Reiter, 14 navigierende Pillen + 1 Aktions-Pille (`#wzEinstellungen`). Vertrag der
Navigation: **Panel-ID = `sub-` + `data-sub`**, Umschalten über Klasse `active`, Logik in
`app-shell.js` (`reiterZeigen`, `pilleZeigen`, `uiHerstellen`), Ereignisse `tab-changed` /
`sub-changed`, Ort-Merker `store('ui')`.

| Reiter (`data-tab`) | Panel | Pillen (`data-sub` → Panel) |
|---|---|---|
| Heute (`dashboard`) | `#tab-dashboard` | ueberblick · marktkarte · beobachtung |
| Regeln (`strategien`) | `#tab-strategien` | regeln · einstellungen · werkzeug |
| Vermögen (`depot`) | `#tab-depot` | depot · mittel · papiere · protokoll |
| Werkzeuge (`werkzeuge`) | `#tab-werkzeuge` | explorer · scheine · wende · archiv (+ `#wzEinstellungen`) |
| Messung (`messung`) | `#tab-messung` | keine (eine Scroll-Seite) |

**Falle:** fünf `#sub-*`-Container **ohne** `class="sub"` und ohne Pille — Alt-Kennungen des
6→3-Umbaus vom 31.08., immer sichtbar, von test-v6 namentlich und in fester Reihenfolge
geprüft: `#sub-strategien`, `#sub-mittelfrist`, `#sub-auswertung` (alle in
`#sub-einstellungen`), `#sub-stratchart`, `#sub-regelbuch` (in `#sub-werkzeug`).
`#messband` steht nicht im HTML — `messband.js` hängt es zur Laufzeit als erstes Kind in
`#sub-depot`.

### Blöcke je Panel (Kennung → Renderer)

- **Heute/Überblick:** `#newsTicker`, `#tiles`, `#dashHeat`, `#dashDetail` (`#bigtech`,
  `#chips`), `#calendar` (calendar.js), `#news` — renderer.js. **Marktkarte:** `#mk*`
  (marktkarteui.js). **Radar & Insider:** `#spekRadar`, `#insiderKarte`, `#vormarktKarte`
  (renderer.js).
- **Regeln/Strategien (`#sub-regeln`):** `#antwortSeite` (strategien.js `renderAntwort`),
  `#stratListe`, `#verworfenListe`, `#archivWiderlegt` (+ `#hourlyEnabled`, `#runJobBtn`).
- **Regeln/Risiko & Einstellungen (`#sub-einstellungen`, index.html ~1073–1507), drei
  Bereiche:** `#abIntraday` → `#sub-strategien`: `#stratEmpfohlenBtn`, Intraday-Karte
  (`#idEnabled`, `#idKlartext`, `#idPool`, `#idKapiZusatz`, `#idRegime`, Experten-Klappe
  `#idExperte` mit `#idParams`, `#kostenHuerde`), Fußzeile in **einer** langen Zeile (~1263)
  mit `#idStatus`, `#capStatus`, `#alpStatus`, `#kostenRundeSym`, `#kostenRundeBtn`,
  `#kostenAutomatAlpChk`, `#kostenRundeStatus`; Risikomanagement (`#rkMaxPos`,
  `#rkDayLoss`, `#rkExposure`, risiko.js); Watchlist (`#watchChips`); Live-Signal-Monitor
  (`#sigMonitor`, `#symBlocks`). `#abMittelfrist` → `#sub-mittelfrist`: Momentum
  (`#mfRueck`, `#mfLuecke`, `#mfHalten`, `#mfAnteil`, `#mfKosten`, `#mfLadenBtn`, `#mfRang`,
  `#mfErgebnis`; mittelfrist.js), Bücher steuern (`#mfdTaktBtn`, `#mfdRebalanceBtn`,
  `#mfdDriftBtn`, `#mfdStatus`; mfdepot.js), Drift (`#dr*`; driftui.js). `#abAutopilot` →
  `#sub-auswertung`: `#pilotOn`/`#pilotBtn`/`#pilotStatus`/`#pilotLog`, Kursarchiv auffüllen
  Capital (`#quelleTestBtn`, `#massenBtn`, `#massen1mBtn`, `#massenStopBtn`; backfill.js),
  Marktlage (`#regimeAn`, `#regimeBtn`, `#regimeStatus`), `#centralResult`.
- **Regeln/Werkzeug (`#sub-werkzeug`):** `#sub-stratchart` → `#stratChartPanel` (`#stc*`,
  strategiechart.js), Berichte (`#retroBtn`, `#weeklyBtn`, `#reportShowBtn`,
  `#exportDataBtn`; berichte.js), Backtest (`#bt*`; backtestui.js); `#sub-regelbuch` →
  `#regelKarte`, `#regelnKarte` (`#regelName`, `#regelNeuBtn`, `#regelnListe`),
  `#regelBilanz` (`#tuneLog`, `#filterBtn`, `#patience`, `#benchChart`, `#hitrates`).
- **Vermögen:** `#sub-depot` (`#depotStats`, `#equityChart`, `#positionsPanel`; depot.js),
  `#sub-mittel` (`#mfdMomentum`, `#mfdDrift`; mfdepot.js), `#sub-papiere` (`#bestandTabelle`,
  `#bestandText`, `#bestandLesen`; bestandui.js), `#sub-protokoll` (`#logFilter` mit
  `data-lf`-Knöpfen, `#csvBtn`, `#tradeLog`; depot.js).
- **Werkzeuge:** `#sub-explorer` (explorer.js), `#sub-scheine` (scheinfinder.js),
  `#sub-wende` (wendeui.js), `#sub-archiv` (`#archivKarte`; archivkarte.js).
- **Messung:** `#scoreboardKarte`/`#scoreboard`, `#strategienKarte`/`#strategienListe`,
  `#strategieEingabe` (`#st*`; scoreboard.js, strategiebaukasten.js).
- **Kopfzeile:** `#cockpit` (`#ckEquity`, `#ckDay`, `#ckOpen`, `#ckBooks`, `#ckMarkt`,
  `#ckScan`) — depot.js `cockpitRender()`. **„M – · D –"** = Momentum-Buch / Drift-Buch in
  Prozent gegen das eigene Startkapital; „–" = Buch aus oder kein Verlaufspunkt.
  *Seit Stufe 2 (03.09.2026) steht dort ausgeschrieben, welcher der drei Zustände gemeint
  ist — „Momentum +1,2 %“, „Momentum aus“, „Momentum noch kein Stand“.*

## 2. Befund (PM, 02.09., alle 15 Seiten in isolierter Instanz gesehen)

**Die App ist nach ihrer Baugeschichte gegliedert, nicht nach dem, was Wilhelm tut.** Jede
Studie, jedes Werkzeug, jede Messung hat sich einen Platz genommen. Wilhelms tägliche Nutzung
(Formular 02.09.): **Bücher und Depot ansehen, Marktüberblick und News; Explorer und
Schein-Finder behalten (später optimieren); Backtest und Kursarchiv wenig bis gar nicht —
höchstens eine Grafik zur Vollständigkeit des Archivs.**

1. Drei Orte heißen „Werkzeug": Reiter Werkzeuge, Pille Regeln → Werkzeug, Klappe
   „Berichte & Werkzeuge" darin.
2. „Risiko & Einstellungen" ist eine Rumpelkammer: ~2.700 px, 25 Knöpfe, 32 Eingaben, neun
   Themen; die „Direkt zu"-Sprungleiste ist das Eingeständnis.
3. Das Geld-Bild zeigt die falsche Strategie: Vermögen → Depot zeigt sechs Kacheln des
   Intraday-Depots (aus); die Bücher, die wirklich handeln, stecken in der zweiten Pille.
4. Widerlegtes hat eigene Seiten: Trendfinder-Pille (Detektor widerlegt) mit Textwand;
   „Depot gegen Buy & Hold" führt News-Sentiment, Elliott-Wellen, KI-Prüfung als Balken
   (Reste der Stunden-Strategie).
5. Jede Seite beginnt mit einem Absatz Erklärtext; „Alles hier ist Simulation" und die
   Yahoo-Fußzeile auf jeder Seite.
6. Reiter Messung spricht Entwicklerisch: Dateinamen als Zeilen, Beschreibungen mitten im
   Satz abgeschnitten, ASCII-Umlaute.
7. Kopfzeile kryptisch („BÜCHER M – · D –", „SCAN –").
8. Knöpfe ohne Ort: Kostenrunde/Automat Alpaca sitzen unter der Intraday-Strategie.

**Gut und nach vorn gehörend:** Belegstand-Etiketten je Strategie, die Gruppen „belegt / in
Messung / verworfen / Archiv", der Klartext, was gehandelt wird (`#antwortSeite`,
`#stratListe`).

## 3. Zielbild — vier Bildschirme

*War „drei Bildschirme" (02.09.). Am 04.09.2026 kam **Markt** als vierter dazu — Wilhelms
Entscheid nach der TradingView-Sichtung: „nicht so vermixt mit den Strategien". Der Markt
stand nur deshalb im Alltagsreiter, weil beides zusammen gewachsen ist.*

| Reiter | Pillen | Inhalt |
|---|---|---|
| **Heute** (`dashboard`) | Überblick · Meine Papiere | **Nur das eigene Geld:** Bestand (drei Buch-Karten, Zuletzt getan, Depotverlauf, Intraday-Bereich, Protokoll als Klappe), daneben die eigenen Papiere |
| **Markt** (`markt`) | Überblick · Marktkarte · Radar | **Nur der Markt:** Sitzungszustand, Index-Kacheln (10, mit Gold/Öl/Dollar/Dow), Sektor-Leiste 1T/1W/1M, fünf Hotlists, Marktbild, Einzelwerte, Ergebnistermine, Wirtschaftskalender, Schlagzeilen (höchstens 5). Marktkarte und Radar/Insider/Vorbörse als zweite und dritte Pille |
| **Regeln** (`strategien`) | Strategien · Einstellungen | Strategien wie heute (Antwort-Seite, Gruppen, Archiv). Einstellungen nur: Voreinstellungen-Knopf, Intraday-Karte (mit Experten-Klappe), Risikomanagement, Watchlist. *Seit Stufe 4b (03.09.2026, Wilhelms Entscheid) ohne Mittelfrist: die Analyse-Knöpfe und -Felder bringen nichts, herumklicken soll es dort nicht geben — der ganze Block liegt in Betrieb.* |
| **Werkzeuge** (`werkzeuge`) | Aktien-Explorer · Schein-Finder · **Betrieb** | Betrieb = Maschinenraum: jeder Block eine `<details>`-Klappe mit einer Statuszeile im `<summary>`: Kursarchiv, Autopilot & Marktlage, Kursarchiv auffüllen (Capital), Kostenmessung (Capital + Alpaca), **Mittelfrist-Analyse & Bücher steuern** (seit Stufe 4b), Live-Signal-Monitor, Strategie-Chart, Regelbuch (Regel die handelt / nur messen / Bilanz), Berichte & Backtest, Messprotokolle (Scoreboard), Strategieregister, Neue Strategie, Trendfinder (widerlegt) — **zwölf Klappen** |

Entfällt als Reiter: **Vermögen** (Inhalt nach Heute), **Messung** (Inhalt nach Betrieb).
Entfällt als Pille: Regeln → Werkzeug, Werkzeuge → Trendfinder, Werkzeuge → Kursarchiv,
`#wzEinstellungen` (Doppel zum Kopfzeilen-Knopf). Kein Block wird gelöscht — was aus der
Bedienoberfläche verschwindet, liegt in Betrieb in einer Klappe.

**Grundsätze (ergänzen PLAN.md §5):**
- **IDs sind Schnittstellen.** `data-tab`-Werte `dashboard`/`markt`/`strategien`/`werkzeuge`
  und alle `sub-*`-Kennungen bleiben; DOM-Blöcke werden verschoben, nicht neu gebaut. Neue
  Pillen `data-sub="betrieb"` → `#sub-betrieb` und `data-sub="marktueberblick"` →
  `#sub-marktueberblick` (beide class="sub").
- **Eine Grundmenge, nicht zwei** (seit Stufe 5). Der Markt-Überblick fragt die Marktkarte
  über `window.Marktwerte` nach ihrer Auswahl und ihren Kursen, statt sich eine eigene zu
  bauen — sonst stünden auf demselben Reiter zwei Antworten auf die Frage, was „der Markt" ist.
- **Messaussagen unantastbar**, Belegtexte wörtlich; Widerlegtes bleibt sichtbar — als
  Zeile im Archiv, nicht als Seite.
- **Ein Satz Dauertext je Block**, der Rest hinter den Info-Knopf (Linie aus Audit-Stufe 2).
  Fußzeile (Datenquelle, keine Anlageberatung) **einmal** am Seitenende, nicht je Panel.
  *Seit Stufe 3 (03.09.2026) hält das eine Sperrklinke: außerhalb von Klappen, versteckten
  Bereichen und einer begründeten Weißliste steht in keinem Panel ein Erklärabsatz über
  240 Zeichen. Die elf Betrieb-Klappen zählen dabei mit — sie sind die Gliederung des
  Panels, kein Versteck.*
- **Kein Handelscode:** `intradayScan()`, Autopilot-/Edge-Ring, `SETUPS`, Gates — tabu.
- **Live = Messung:** Mittelfrist-Parameter sind die gemessene Konfiguration; sie werden
  angezeigt, nicht eingestellt (Stufe 3). *Umgesetzt 03.09.: die neun Felder bleiben im DOM
  (K18), sind `disabled` und werden aus `D.mfBuch.konfig` bzw. `Drift.STANDARD` gefüllt —
  nie aus einer Zahl im Markup. Ausnahme mit eigener Klinke: `#mfKosten`, siehe Übergabe
  Abweichung 4.*
- **Sperrklinken ziehen mit:** eine Zusicherung, die korrektes Verhalten rot malt, wird auf
  die neue Struktur umgeschrieben — nie abgeschwächt, nie gelöscht ([fehlerformen.md](fehlerformen.md), Testmarken-Falle).
- **Vorher/nachher belegen:** `tools/ui-probe.js` und `tools/a11y-probe.js` einmal vor, einmal
  nach; Aufnahmen aller Seiten (Rezept §6) in der Übergabe verlinkt.
- **Klick-Sperrliste** beim Testen: nichts, was Orders auslöst (`#kostenRundeBtn`,
  `#mfdRebalanceBtn`, `#mfdDriftBtn`, `#massenBtn`); nie die installierte App anfassen.

## 4. Stufen (je eine Sitzung, eine Release-Notiz, Version durch die Wache)

| Stufe | Inhalt | Zustand |
|---|---|---|
| **1 Umzug** | 5 → 3 Reiter; Betrieb-Pille; Bestand nach Heute; Papiere/Protokoll nach Heute; Klinken K1–K26 (§5) umschreiben; keine Textänderung, keine Löschung | ✅ **geliefert 02.09.** (`uebergabe/oberflaeche-stufe1-2026-09-02.md`) — 3 Reiter / 9 Pillen, elf Betrieb-Klappen; 36 Klinken umgeschrieben oder neu, 37 Gegenproben rot; ui-probe + a11y-Sonde + `npm test` grün. **Ohne Statuszeile im `<summary>`** — die ist Gestaltung und liegt in Stufe 2. |
| **2 Bestand & Kopfzeile** | Bestand-Block auf Heute gestalten (eine Bücher-Karte: Wert, Ergebnis, Positionen, letzte Handlung, nächste Umschichtung; Intraday-Depot nur wenn ein; Depotverlauf über alle Bücher); Cockpit in Worten statt „M – · D –"; **Statuszeile im `<summary>` jeder Betrieb-Klappe** (aus Stufe 1 hierher verschoben, Übergabe §6.1) | ✅ **geliefert 03.09.** (`uebergabe/oberflaeche-stufe2-2026-09-03.md`) — drei Buch-Karten (Momentum · Ergebnis-Drift · Intraday) mit Wert, Ergebnis, Positionen, Status, nächstem Takt und letzter Handlung; „Zuletzt getan“ aus der neuen Leseauskunft `DepotAPI.handlungen(n)`; **ein** Verlauf mit drei Linien (je gegen das eigene Startkapital, gezeichnet von `Chart.drawLines`); Positionstabellen und Korb-Text wörtlich in je einer Klappe unter der Karte; Intraday-Bereich per `hidden` statt Entfernen; `#ckBooks` mit drei Zuständen (Prozent / aus / noch kein Stand), `#ckScan` in Worten, `#ckEquity` heißt Intraday-Depot. Elf Statuszeilen im `<summary>`, jede mit benannter Quelle, keine Konstante, kein Zeitgeber. |
| **3 Schnitt** | Erklärtexte hinter i-Knöpfe (ein Satz Dauertext je Block), Fußzeile und Simulations-Hinweis einmal; Stunden-Strategie-Reste ins Archiv (Balken „Depot gegen Buy & Hold", Backtest-Voreinstellung `daily`); Trendfinder-Textwand hinter i, Urteil bleibt; Mittelfrist-Parameter als gemessene Konfiguration (gesperrt), nicht als freie Auswahl; Strategieregister: Beschreibungen ganz; Kopfzeile „SCAN 14:32" | ✅ **geliefert 03.09.** (`uebergabe/oberflaeche-stufe3-2026-09-03.md`) — **36 Sätze aus elf Blöcken wörtlich ins Erklaerregister**, im Panel je ein Satz plus i-Knopf; sechs neue Registereinträge, sechs erweiterte, 32 insgesamt, keiner leer, keiner verwaist. Dauertext je Panel **−17 %** (39.542 → 33.005 Zeichen `innerText` in isolierter Instanz), im Maschinenraum −22 %. Simulations-Satz **einmal** in der Kopfzeile statt als Kasten am Fuß des Regeln-Reiters; Fußzeile stand schon einmal (Abweichung 1). `#ckScan` ohne doppeltes Wort. `#hitrates` (fünf Balken der widerlegten Stunden-Strategie) aus der Bilanz der laufenden Regel in die Archiv-Klappe, gleiche Kennung, gleicher Schreiber; Backtest-Voreinstellung ist die laufende Regel. Neun Mittelfrist-Felder **gesperrt und aus `D.mfBuch.konfig` / `Drift.STANDARD` gefüllt**, `opts()` unverändert. Strategieregister zeigt den ganzen ersten Absatz (kein `slice(0,110)`, **keine** ue→ü-Ersetzung — die Protokolle sind ASCII). Neuer Abschnitt `65) Schnitt` mit **65 Zusicherungen** plus sechs umgeschriebenen Altklinken; **12 Gegenproben, 10 sofort rot** — die zwei anderen fanden einen zu kurzen Eingriff und **eine echte Lücke** (der Panel-Ausschnitt las die Knöpfe der Nachbarpanels mit). `npm test`, ui-probe und a11y-Sonde vorher/nachher grün; dazu eine Info-Probe, die drei i-Knöpfe in einer isolierten Instanz wirklich anklickt. Aufnahmen in `uebergabe/aufnahmen-stufe3/` (vorher, vorher-kunstdaten, nachher, kunstdaten — je mit `textmenge.json`). **Als Nächstes: Stufe 4.** |
| **4 Archiv-Grafik, Kopfzeile, Werkzeug-Politur** | eine Grafik „wie vollständig ist das Archiv" statt Tabelle; Kopfzeile wieder einzeilig (Simulations-Satz als Marke „Simulation" mit i-Knopf, Satz wörtlich im Register — Abweichung 5 der Stufe-3-Übergabe); Restwände in der Intraday-Karte (Marktlage-Absatz); Explorer/Schein-Finder auf Wilhelms Zuruf | ✅ **geliefert 03.09.** (`uebergabe/oberflaeche-stufe4-2026-09-03.md`) — **Das Kursarchiv ist eine Grafik**: je Auflösung ein Balken über die letzten 60 Handelstage, **eine Zelle je Tag** (gesammelt / lückenhaft / nichts da) — eine Kerbe mittendrin bleibt sichtbar, in einer Prozentzahl verschwindet sie. Daneben Werte, angesehene Reihen, Alter der jüngsten Kerze; ein Alarm **nur wenn etwas schiefsteht**. Die fünf „Jetzt holen"-Knöpfe stehen unter der Grafik und bleiben verdrahtet, die Live-Zeile „So ist es eingestellt" bleibt. **Keine Zahl im Markup:** neue Leseauskunft `archiv-abdeckung` (main.js) auf **reinen, in Node prüfbaren** Funktionen in `archiv.js` (`tageVon`, `tagesBild`, `abdeckungBild`); die erwarteten Handelstage kommen aus `boerse.js` — ohne Feiertagskalender wären Thanksgiving und der 4. Juli Kerben, an denen niemand etwas versäumt hat. Sie schreibt nichts und hängt **nicht** an `sammlerStand()` (der wird während eines Laufs alle zehn Werte gefunkt). Reines SVG, kein neuer Zeichner. Die zwei Autopilot-Balken „1-Min: x/60 Tage" entfallen als **Anzeige**, die Rechnung bleibt im Analyse-Export. **Kopfzeile einzeilig:** Marke „Simulation" mit i-Knopf statt des ganzen Satzes, der wörtlich in `heute.simulation` steht — **gemessen** bei 1280 **und** 1024 px (gemeinsames waagerechtes Band, `tools/ui-aufnahmen.js --breite`), Kopfhöhe 67 → 33 px. Bei 1024 war der Anstoß der **leere** Fehlerplatz `#err` mit 8 px Außenabstand (981 von 984 Punkten belegt) — behoben mit `.err:empty` und einer Medienregel. Marktlage-Absatz wörtlich nach `regeln.intraday`, Statuszeilen unangetastet; tote Regel `.buecher-zusicherung` weg (Abweichungen 5 und 9 der Stufe-3-Übergabe erledigt). Neuer Abschnitt `66)` mit **45 Zusicherungen**, vier Altklinken umgeschrieben. **48 Gegenproben, 47 sofort rot** — der Ertrag sind die zwei, die **grün blieben, weil sie nichts fanden**: beide verglichen zwei `indexOf`-Ergebnisse, und ein fehlender Treffer ist −1, der vor allem sortiert; genau am Fall, gegen den sie gebaut waren, waren sie blind (geschärft, `60188db`). Ein 48. Eingriff macht nicht rot, sondern **bringt die Suite um** (fehlender `isFinite`-Wächter) — ausgewiesen. `npm test` (3.089 allein, 3.137 mit Stufe 4b), ui-probe und a11y-Sonde vorher/nachher grün. Aufnahmen in `uebergabe/aufnahmen-stufe4/` (leer/Kunstdaten × 1280/1024, je mit `textmenge.json` samt Kopfzeilen-Messung); Kunst-Archiv in `tools/kunstdepot.js` mit absichtlichem Loch und teilgefüllten Tagen. **Zwei Befunde:** (1) es gibt **zwei** Archive namens Kursarchiv — der Datenordner (den die Grafik zeigt) und der Renderer-Store `bars_*` (den die Autopilot-Balken zeigten), **ohne Spiegelung**; (2) der Dauertext-Abtaster aus Stufe 3 liest nur `index.html` und ist für jeden vom Renderer geschriebenen Absatz blind — die neue Laufzeit-Messung findet 13 Läufe über 240 Zeichen, zwölf davon Live-Daten oder Messaussagen, **einer** echter Erklärtext (`depot.js:1614`). **Explorer/Schein-Finder nicht angefasst — der Zuruf liegt nicht vor.** |
| **4b Mittelfrist in den Maschinenraum** | Der ganze Bereich `#abMittelfrist`/`#sub-mittelfrist` (Momentum-Karte mit den fünf gesperrten Feldern, die zwei Ergebnis-Kästen, „Bücher steuern" mit den drei Knöpfen, Drift-Karte mit Termin-Knöpfen, Messzahlen-Fußnote) als **eine** Klappe nach Werkzeuge → Betrieb; Regeln → Einstellungen behält Voreinstellungen, Intraday, Risiko, Watchlist | ✅ **geliefert 03.09.** (`uebergabe/oberflaeche-stufe4b-2026-09-03.md`) — DOM-Block unverändert verschoben (8.664 Zeichen), alle 23 Kennungen erhalten, kein Text geändert, beide Messaussagen wörtlich und **einmal**. Vorher belegt, dass `mfdepot.js takt()` **keines** der neun Bedienfelder liest (Momentum aus `MH.buchKonfig()` `mfdepot.js:143`, Drift aus `Dr.heute(kurseD, termD, markt)` `:192`, Daten über `ladeUniversum()` `:128`/`:153` und `storeGet('drift_termine')` `:184`) — der Umzug war deshalb gefahrlos, und die Prüfung selbst ist jetzt Zusicherung. Statuszeile im `<summary>` aus `DepotAPI.regelStatus()`/`.antwort()` („Momentum an · Drift an · zuletzt geprüft 03.09.26"), zwölfte Klappe zwischen Kostenmessung und Signal-Monitor. Einstellungen **−47 %** Dauertext (3.692 → 1.958 Zeichen), „Direkt zu"-Leiste entfallen (ein Ziel ist keine Orientierung), Bereichskopf „Intraday & Risiko" bleibt. Vier Wegweiser der Buch-Karten auf den neuen Ort. Neuer Abschnitt `67) Mittelfrist im Maschinenraum` mit **45 Zusicherungen**, sechs umgeschriebene Altklinken (K18, K8 u. a.), **27 Gegenproben, 27-mal rot**. **Fund nebenbei:** K7 las die Klappen-Titel mit `<summary>([^<]+)</summary>` und fand seit Stufe 2 **keinen** — die Statuszeile im `<summary>` bricht das Muster ab; repariert, Gegenprobe G27 belegt es. `npm test` (3.137), ui-probe und a11y-Sonde grün; Funktionsprobe in isolierter Kunstdaten-Instanz klickt „Daten holen und rechnen" wirklich (187 Werte, 19 Rangzeilen). Aufnahmen in `uebergabe/aufnahmen-stufe4b/`. |
| **5 Reiter „Markt" — reines Markt-Dashboard** | Vierter Reiter `data-tab="markt"` mit drei Pillen: **Überblick**, **Marktkarte** (zieht um), **Radar** (zieht um). Aus Heute→Überblick wandern `#tiles`, `#dashHeat`, `#bigtech`/`#chips`, `#news`, `#newsTicker`, `#calendar` nach Markt; Heute behält den Bestand. IDs bleiben, DOM-Blöcke wandern. | ✅ **geliefert 04.09.** (`uebergabe/oberflaeche-stufe5-2026-09-04.md`) — **4 Reiter / 10 Pillen.** Sieben DOM-Blöcke und zwei ganze Panels wörtlich verschoben (1.788 + 2.086 + 2.165 Zeichen), alle Kennungen erhalten, kein Text geändert; „Gehandelt wird hiervon nichts" steht weiter genau dreimal. Heute hat zwei Pillen und zeigt nur noch das eigene Geld. **Neu:** Sitzungszustand in einer Zeile (`#marktSitzung`), kapitalgewichtete Sektor-Leiste mit Umschalter 1T/1W/1M (`#marktSektoren`), fünf Hotlists (`#marktHotlists`), Ergebnistermine heute/morgen (`#marktEarnings`); vier Index-Kacheln dazu (Dow, Gold, Öl, Dollar-Index → zehn), Schlagzeilen auf fünf gedeckelt. **Die Rechnung steht getrennt:** neues reines Modul `markt/uebersicht.js` (`sitzungszustand`, `relativesVolumen`, `sektorLeiste`, `hotlists`, `spanne`, `tagesreiheAusText`), in Node prüfbar; **keine Zahl im Markup**. **Eine Grundmenge, nicht zwei:** der Überblick fragt die Marktkarte über die neue Leseauskunft `window.Marktwerte` nach Auswahl und Kursen (600 größte Werte). **Zwei neue Leseauskünfte, beide nur lesend:** `markt-tagesreihen` (Volumen-Median und Wochen-/Monatsspanne aus dem Tagesarchiv — **gemessen:** 120 Dateien voll parsen 1,9 s, aus den letzten 96 KB 127 ms) und `earnings-kalender`. `yahoo-quotes` um Volumen, MKap, 52-Wochen-Hoch und Vor-/Nachbörsenkurs erweitert, `null` statt `0`. **Zwei Funde:** (1) `gte` **und** `lt` auf `startdatetime` liefern bei Yahoo **Status 200 und null Zeilen** ohne Fehlermeldung — der Termin-Kasten hätte jeden Tag „heute berichtet keiner" gesagt und gelogen; jetzt eine Bedingung, Schnitt nach dem Abruf, eigene Klinke; (2) ein halber Kurslauf hätte den gemerkten Stand mit einer Liste aus **einem** Wert überschrieben (META aus der Ersatzliste der Karte) — gefunden von der Kunstdaten-Probe, jetzt bleibt der letzte vollständige Stand mit seinem Zeitstempel stehen. Neuer Abschnitt `68) Reiter Markt` mit **171 Zusicherungen**, sieben Altklinken umgeschrieben (K1, K7, K10, K14, K16, Reiter-Rollen, „Drei Bildschirme"). **47 Gegenproben, 47-mal rot** (zwei davon erst nach einer Schärfung — siehe Übergabe §9). `npm test` **3.318 → 3.495**, ui-probe (4 Reiter / 10 Pillen) und a11y-Sonde vorher/nachher grün; Funktionsprobe an echten Daten (598 von 600 Kursen, 11 Sektoren). Aufnahmen in `uebergabe/aufnahmen-stufe5/` (leer/Kunstdaten × 1280/1024, Kopfzeile bleibt einzeilig bei 33 px); Kunstdaten um Stammdaten, Tagesarchiv und gemerkten Stand ergänzt. **Nächste Stufe: 6 — Aktien-Viewer nach TradingView-Muster.** **PM-Abnahme 04.09. 08:10:** eigener Lauf 3.419 grün (test-v6 allein), ui-probe 4 Reiter / 10 Pillen grün, Aufnahmen gesichtet (Kacheln, Sektor-Leiste, fünf Hotlists, Marktbild, Ergebnistermine); neun Abweichungen zur Kenntnis, Vor-/Nachbörsenkurs der Kacheln → Stufe 6. **Release fällig.** |
| **6 Aktien-Viewer** | Einzelwert-Ansicht nach TradingView-Muster: Kerzenchart mit Zeitrahmen-Wahl, Kennzahlen, Nachrichten und Termine zum Wert, Sprung aus Marktkarte/Hotlists; Vor-/Nachbörse nach Wilhelms Entscheid (Formular vor dem Auftrag) | ✅ **geliefert 04.09.** (`uebergabe/oberflaeche-stufe6-2026-09-04.md`): Canvas-Kerzenchart aus reinem Modul `markt/kerzenchart.js`, sechs Zeitrahmen, Vor-/Nachbörse als graues Band mit Umschalter, Leseauskunft `archiv-kerzen` (Alpaca bereinigt → roh → App-Archiv → Yahoo, Quelle in der Fußzeile), laufende Kerze aus Quotes nie ins Archiv, Karten Kennzahlen/Nachrichten/Termine/Im Archiv, Wegweiser Belegstand; alte Linien-Ansicht in Klappe. Dazu F2/F4/F6/F7/F8 und Kursabruf zusammengelegt. Vom PM fotografiert und abgenommen; Release durch die Wache. |
| **7 Schein-Finder** | Bedienung: zwei Karten (Basiswert · Was für ein Schein), Auswahllisten mit Bereichen statt freier Zahlen, drei Voreinstellungen, Live-Filter, Tabelle sieben Spalten + Schalter, Stufe als Pille, Risiko-Begründung aufklappbar, Einstellungen im Store; Rechnung unangetastet | 🔵 **beauftragt 04.09.** (`uebergabe/auftrag-scheinfinder-ui-2026-09-04.md`), nach Nr. 15 in [offene-auftraege.md](offene-auftraege.md) |

## 5. Sperrklinken an der Navigation (test-v6.js, Zeilen Stand 02.09.)

| # | Zeile | Prüft | Stufe 1 |
|---|---|---|---|
*Spalte „Stufe 5" ergänzt am 04.09.2026. Was dort leer bleibt, war nicht zu ändern —
der Reiter „Markt" ändert die Struktur, nicht die geschützten Eigenschaften.*

| K1 | 3550–3553 | `data-tab`-Zahl === 5, `messung` vorhanden, `marktkarte` nicht | umschreiben auf 3 → **Stufe 5: auf 4** (`markt` benannt, `marktkarte` bleibt verboten — die Karte ist eine Pille) |
| K2 | 3554–3557 | Knopf + `#tab-*` für dashboard/strategien/depot/werkzeuge | depot raus |
| K3 | 3560 | `data-sub="mittel"` + `#sub-mittel` | umschreiben, wenn `#sub-mittel` im Bestand-Block aufgeht |
| K4 | 3572–3590 | Umschalter nur über `.pills button[data-sub]`; `#logFilter`/`#csvBtn` ohne `data-sub` | bleibt |
| K5 | 3594–3601 | kein `data-tab="explorer"`; Sprungmarken `#wzPills [data-sub="explorer"]` | bleibt |
| K6 | 3660 | wortgenau `<button data-sub="wende">Trendfinder</button>` | umschreiben (Trendfinder in Betrieb-Klappe) |
| K7 | 6063–6090 | **Wegweiser-Klinke:** Reiter-/Pillen-Labels aus Markup gegen alle „Reiter „X""-Texte in 11 Quelldateien; fordert `reiter.length === 5`, `pillen.length >= 6` | umschreiben auf 3; alle Wegweiser-Texte anpassen → **Stufe 5: auf 4**; die Weißliste bekommt „Markt" von selbst (sie liest die Leiste) |
| K8 | 6197–6205 | `#regelPills` exakt regeln/einstellungen/werkzeug; Reihenfolge sub-einstellungen < sub-strategien < sub-mittelfrist < sub-auswertung | umschreiben |
| K9 | 7849–7866 | Bijektion Pille ↔ `class="sub" id="sub-…"` | bleibt (neue Pille betrieb) → **Stufe 5: bleibt** (neue Pille marktueberblick, greift ohne Änderung) |
| K10 | 7875–7884 | je Reiter genau ein `class="sub active"` und eine aktive Pille; Attributreihenfolge `data-sub` vor `class` | tab-depot raus → **Stufe 5: `tab-markt` in die Liste** |
| K11 | 7876–7878 | Endmarke `<!-- /tab-… -->` je Reiter | einhalten |
| K12 | 7890–7899 | Vermögen hält sub-depot/protokoll/mittel/papiere (+ bestand*) | umschreiben auf Heute |
| K13 | 8064–8079 | Vermögen ohne sub-strategien/wende/auswertung; Werkzeuge mit wende/explorer/scheine; `#wzEinstellungen` ohne data-sub; Regeln hält sub-strategien+auswertung+regelbuch+stratchart | umschreiben |
| K14 | 8081–8092 | Marktkarte ist Pille; Radar-Karten in dritter Pille | Pillen-Index prüfen → **Stufe 5: Ausschnitt `heute` → `markt`**, dazu die Umkehrung (nicht mehr auf Heute) |
| K15 | 8093–8095 | keine Reste tab-marktkarte | bleibt |
| K16 | 8096–8101 | `<h2>` „Gehandelt wird hiervon nichts" über Radar-Karten | bleibt → **Stufe 5: im Reiter Markt gemessen**, dazu neu: der Satz steht genau dreimal |
| K17 | 8105–8108 | `#hoverInfo` vor `#heutePills` | bleibt |
| K18 | 8118–8135 | 23 Mittelfrist-Kennungen im Reiter Regeln, keine in Vermögen | bleibt, „Vermögen" durch „Heute" ersetzen |
| K19 | 8135–8143 | 9 Kennungen genau einmal; `#mfdMomentum`/`#mfdDrift` mit `.empty` | bleibt |
| K20 | 8148–8151 | wortgenau `data-sub="mittel">Bücher<`, `data-sub="einstellungen">Risiko &amp; Einstellungen<` | umschreiben (Label „Einstellungen") |
| K21 | 8166–8180 | keine Texte „Vermögen → Schalter/Auswertung/Trendfinder/Mittelfristig" | erweitern: kein „Reiter Vermögen", kein „Reiter Messung" mehr |
| K22 | 10062–10084 | app-shell-Verträge (`querySelectorAll('.pills button[data-sub]')`, `sub-changed`, `sub === 'wende' && !wieder`, `store('ui')`) | bleibt; `wende`-Sonderfall prüfen |
| K23 | 10088–10098 | bugs.js liest `nav.tabs button.active` | bleibt |
| K24 | 10096–10108 | DOM-Reihenfolge `#tab-*` = Leiste; Endmarken | einhalten |
| K25 | 10111–10117 | kein leeres `grid2`; jeder `<!-- ==== Titel ==== -->` direkt vor `<div` | einhalten |
| K26 | 1051 / 5060 / 11379 | `#sub-wende`+`data-sub="wende"`; `data-tab="messung"`+`#scoreboard`+`#stAblegen`; `data-sub="archiv"`+`#sub-archiv`+archivkarte.js | umschreiben auf Betrieb |

`tools/ui-probe.js` klickt `nav.tabs button[data-tab]` und `#tab-X .pills button[data-sub]`,
erwartet `active` auf `#tab-X` / `#sub-Y`, `#warnband` ohne Startabbruch. `tools/a11y-probe.js`
dieselben Selektoren, Prüfbereich `.tab.active`.

## 6. Aufnahme-Rezept (isolierte Instanz, nichts von Wilhelm wird berührt)

Electron-Wrapper: `app.setPath('userData', TEMP)`, `app.setPath('downloads', TEMP)`,
`BrowserWindow.prototype.loadFile` auf die Repo-Wurzel biegen, Schalter
`disable-features=CalculateNativeWinOcclusion`, `disable-backgrounding-occluded-windows`,
`disable-renderer-backgrounding`; nach `did-finish-load` 7 s warten, `setContentSize(1280,
820)`, `#erststartOk` und `#diagNein` klicken, je Reiter/Pille klicken, `window.scrollTo`
in Fensterhöhen, `webContents.capturePage()` → PNG. Vorbild: `tools/ui-probe.js`. Die
Aufnahmen vom 02.09. (v8.37.3) liegen beim PM; Stufe 1 legt das Skript als
`tools/ui-aufnahmen.js` ab.

## 7. Aktuelle Aufnahmen und Struktur (seit 04.09.2026)

**[aufnahmen/struktur.md](aufnahmen/struktur.md)** zeigt die Oberfläche der ausgelieferten Fassung als Baum (Reiter → Pille → Blöcke und Klappen, mit den Kennungen aus `index.html`) und darunter je Pille die Aufnahmen. Die Bilder liegen je Reiter in einem Unterordner (`aufnahmen/heute/`, `markt/`, `regeln/`, `werkzeuge/`), damit die Struktur auch im Datei-Baum von Obsidian sichtbar ist.

**Regel (Wilhelm 04.09.):** Jeder Auftrag, der die Oberfläche umbaut, erneuert diesen Ordner nach dem Umbau — `tools/ui-aufnahmen.js <ziel> --kunstdaten` fotografieren, Bilder je Reiter einsortieren, `struktur.md` neu erzeugen — damit das nächste Modell die Struktur sieht, bevor es baut. Die Aufnahmen stammen aus einer ISOLIERTEN Kunstdaten-Instanz (Zahlen erfunden, Marktkarte zeigt dort nur die wenigen Kunst-Werte); die Struktur ist die echte. Erzeugt wird die Seite von **`tools/ui-struktur.js`** (seit efe6977, 04.09.): ein Aufruf (`.\node_modules\.bin\electron.cmd tools\ui-struktur.js`) erneuert Bilder **und** Seite aus einer isolierten Kunstdaten-Instanz. Gelesen wird der DOM der laufenden App, nicht `index.html` — damit steht auch drin, was erst der Renderer schreibt (Belegstand-Gruppen, Hotlist-Überschriften, Statuszeilen der Klappen), samt Verschachtelung der Klappen und einem eigenen Abschnitt „Dialoge". Der frühere Zweischritt „`ui-aufnahmen.js` fotografieren, Bilder einsortieren, Seite neu erzeugen" entfällt. Was die Seite nicht ist: kein Abzug (Knöpfe, Tabellen, Fließtext fehlen — dafür `textmenge.json`), gefüllter Explorer/Schein-Finder und Fehlerfall-Blöcke fehlen, Dialoge nur mit Titel.
