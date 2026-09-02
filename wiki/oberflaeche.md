# Oberfläche — Ist, Befund, Zielbild „drei Bildschirme"

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

## 3. Zielbild — drei Bildschirme

| Reiter | Pillen | Inhalt |
|---|---|---|
| **Heute** (`dashboard`) | Überblick · Meine Papiere · Marktkarte · Radar & Insider | Überblick beginnt mit **Bestand** (Bücher, Intraday-Depot nur wenn ein, Depotverlauf, Protokoll als Klappe), dann Marktüberblick, Marktbild, Kalender, News |
| **Regeln** (`strategien`) | Strategien · Einstellungen | Strategien wie heute (Antwort-Seite, Gruppen, Archiv). Einstellungen nur: Voreinstellungen-Knopf, Intraday-Karte (mit Experten-Klappe), Risikomanagement, Watchlist, Mittelfrist kompakt (Bücher steuern; Parameter, Rang und Ergebnis als Klappen) |
| **Werkzeuge** (`werkzeuge`) | Aktien-Explorer · Schein-Finder · **Betrieb** | Betrieb = Maschinenraum: jeder Block eine `<details>`-Klappe mit einer Statuszeile im `<summary>`: Kursarchiv, Autopilot & Marktlage, Kursarchiv auffüllen (Capital), Kostenmessung (Capital + Alpaca), Live-Signal-Monitor, Strategie-Chart, Regelbuch (Regel die handelt / nur messen / Bilanz), Berichte & Backtest, Messprotokolle (Scoreboard), Strategieregister, Neue Strategie, Trendfinder (widerlegt) |

Entfällt als Reiter: **Vermögen** (Inhalt nach Heute), **Messung** (Inhalt nach Betrieb).
Entfällt als Pille: Regeln → Werkzeug, Werkzeuge → Trendfinder, Werkzeuge → Kursarchiv,
`#wzEinstellungen` (Doppel zum Kopfzeilen-Knopf). Kein Block wird gelöscht — was aus der
Bedienoberfläche verschwindet, liegt in Betrieb in einer Klappe.

**Grundsätze (ergänzen PLAN.md §5):**
- **IDs sind Schnittstellen.** `data-tab`-Werte `dashboard`/`strategien`/`werkzeuge` und alle
  `sub-*`-Kennungen bleiben; DOM-Blöcke werden verschoben, nicht neu gebaut. Neue Pille
  `data-sub="betrieb"` → `#sub-betrieb` (class="sub").
- **Messaussagen unantastbar**, Belegtexte wörtlich; Widerlegtes bleibt sichtbar — als
  Zeile im Archiv, nicht als Seite.
- **Ein Satz Dauertext je Block**, der Rest hinter den Info-Knopf (Linie aus Audit-Stufe 2).
  Fußzeile (Datenquelle, keine Anlageberatung) **einmal** am Seitenende, nicht je Panel.
- **Kein Handelscode:** `intradayScan()`, Autopilot-/Edge-Ring, `SETUPS`, Gates — tabu.
- **Live = Messung:** Mittelfrist-Parameter sind die gemessene Konfiguration; sie werden
  angezeigt, nicht eingestellt (Stufe 3).
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
| **2 Bestand & Kopfzeile** | Bestand-Block auf Heute gestalten (eine Bücher-Karte: Wert, Positionen, letzte Handlung, nächste Umschichtung; Intraday-Depot nur wenn ein; Depotkurve über alle Bücher); Cockpit in Worten statt „M – · D –" | offen |
| **3 Schnitt** | Erklärtexte hinter i-Knöpfe, Fußzeile einmal; Stunden-Strategie-Reste ins Archiv (Balken „Depot gegen Buy & Hold", Backtest-Voreinstellung `daily`); Trendfinder als Archivzeile; Mittelfrist-Parameter als Text; Strategieregister: Beschreibungen ganz, Umlaute | offen |
| **4 Archiv-Grafik, Werkzeug-Politur** | eine Grafik „wie vollständig ist das Archiv" statt Tabelle; Explorer/Schein-Finder auf Wilhelms Zuruf | offen |

## 5. Sperrklinken an der Navigation (test-v6.js, Zeilen Stand 02.09.)

| # | Zeile | Prüft | Stufe 1 |
|---|---|---|---|
| K1 | 3550–3553 | `data-tab`-Zahl === 5, `messung` vorhanden, `marktkarte` nicht | umschreiben auf 3 |
| K2 | 3554–3557 | Knopf + `#tab-*` für dashboard/strategien/depot/werkzeuge | depot raus |
| K3 | 3560 | `data-sub="mittel"` + `#sub-mittel` | umschreiben, wenn `#sub-mittel` im Bestand-Block aufgeht |
| K4 | 3572–3590 | Umschalter nur über `.pills button[data-sub]`; `#logFilter`/`#csvBtn` ohne `data-sub` | bleibt |
| K5 | 3594–3601 | kein `data-tab="explorer"`; Sprungmarken `#wzPills [data-sub="explorer"]` | bleibt |
| K6 | 3660 | wortgenau `<button data-sub="wende">Trendfinder</button>` | umschreiben (Trendfinder in Betrieb-Klappe) |
| K7 | 6063–6090 | **Wegweiser-Klinke:** Reiter-/Pillen-Labels aus Markup gegen alle „Reiter „X""-Texte in 11 Quelldateien; fordert `reiter.length === 5`, `pillen.length >= 6` | umschreiben auf 3; alle Wegweiser-Texte anpassen |
| K8 | 6197–6205 | `#regelPills` exakt regeln/einstellungen/werkzeug; Reihenfolge sub-einstellungen < sub-strategien < sub-mittelfrist < sub-auswertung | umschreiben |
| K9 | 7849–7866 | Bijektion Pille ↔ `class="sub" id="sub-…"` | bleibt (neue Pille betrieb) |
| K10 | 7875–7884 | je Reiter genau ein `class="sub active"` und eine aktive Pille; Attributreihenfolge `data-sub` vor `class` | tab-depot raus |
| K11 | 7876–7878 | Endmarke `<!-- /tab-… -->` je Reiter | einhalten |
| K12 | 7890–7899 | Vermögen hält sub-depot/protokoll/mittel/papiere (+ bestand*) | umschreiben auf Heute |
| K13 | 8064–8079 | Vermögen ohne sub-strategien/wende/auswertung; Werkzeuge mit wende/explorer/scheine; `#wzEinstellungen` ohne data-sub; Regeln hält sub-strategien+auswertung+regelbuch+stratchart | umschreiben |
| K14 | 8081–8092 | Marktkarte ist Pille; Radar-Karten in dritter Pille | Pillen-Index prüfen |
| K15 | 8093–8095 | keine Reste tab-marktkarte | bleibt |
| K16 | 8096–8101 | `<h2>` „Gehandelt wird hiervon nichts" über Radar-Karten | bleibt |
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
