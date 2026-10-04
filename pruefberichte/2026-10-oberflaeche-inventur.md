# Oberflächen-Inventur: jede Zahl und jedes Urteil gegen den Belegstand (04.10.2026, Stand main `61dca2c`)

## Kurzfassung
- **279 Fundstellen** in 23 der 37 durchgesehenen Dateien: **a 133** stimmen · **b 25** als überholt gekennzeichnet, richtig so · **c 53 VERALTET** · **d 68 OHNE BELEG**. Der Kleinsttest bestätigt das: alle 121 c/d-Stellen „ZEIGT ABWEICHUNG“, alle 158 a/b-Stellen „kein Unterschied“.
- **1. Ergebnis-Drift, alte Zahl vor der Zeitzonen-Korrektur:** „+10,44 % p. a. bei t = 3,04“ (index.html:2349, app-shell.js:1256; dazu „+1,72 %“, „−1,74 %“, „8,44 statt 14,07“ in app-shell.js:1095/1257). → „Gemessen 04.10.2026 (Nr. 88): Buch +13,01 % p. a. gegen S&P 500 +12,63 % (+0,38 Pp p. a.), 16 von 200 Zufallsbüchern darüber – nicht entscheidbar.“
- **2. RSI(2) im Seitwärtskanal mit überholten Zahlen, im Regelkopf immer sichtbar:** „+0,065 Pp Überschuss … Rohkante +0,170“ (depot.js:635/662/663), „+0,147 Pp“ (index.html:1690, depot.js:5813), „+0,235 statt +0,147“ (index.html:1747/1749). Dazu ein falsches Urteil: „Vorsprung liegt über der Aktien-Kostenhürde … beide Kanten“ (index.html:1701/1704). → „+0,021 Pp je Signal, Tagesmittel +0,054 Pp – nicht entscheidbar, unter der Kassa-Hürde.“
- **3. Das Wort „Kante“ für Regeln ohne Beleg** (der Belegstand zählt null belegte Kanten): app-shell.js:1054 „Gemessene Intraday-Kanten“, app-shell.js:820, depotmigration.js:152, depot.js:1492/1506/5842/5843, explorer.js:238 „einzige gemessen tragende Kanal-Nutzung“. → überall „Regel“; „gemessen – nicht entscheidbar“.
- **4. News-Sentiment „nie messbar / unbelegt ist nicht widerlegt“** (index.html:1628/1633/1634, strategien.js:66, depotmigration.js:268/269). → „Gemessen 01.09.2026: über Nacht auf Großwerten kein Effekt (t = 0,31) – widerlegt.“
- **5. Momentum-Karte, Etikett und Kontrollmessung:** „gemessen – hält die volle Historie“ (strategien.js:80) und „+2,42 Pp je Umschichtung (t = 3,84)“ / „t = 1,62“ (strategien.js:88, app-shell.js:1095) stehen nicht unter dem Kopf „Überholt“. → „Breite Fassung nach Korrektur t 0,74 – nicht entscheidbar; liquide Fassung „lebt“ (In-Sample, am Rand); Rückblick: breiter Markt −2,06 Pp p. a.“
- **6. Ohne Beleg, mehrfach:** „mit Schein … im Backtest bei −96 %“ (5 Stellen); Stunden-Strategie „−0,74 Pp / 24.727 Signale / 32 von 189“ (11 Stellen, belegt ist nur t = −11,6); „doppelt bestätigte, robuste Ergebnisse“ (index.html:2144, depot.js:5885). → streichen bzw. nur „Kontraindikator (t = −11,6)“; „übernimmt Ergebnisse der zweiten Messung (kein unabhängiger Beleg)“.
- **7. Drift-Laufzeiturteil:** driftui.js:171 „überzufällig (t ≥ 2)“, obwohl die Messung das Tor t ≥ 2,5 gesetzt hat und bei t 1,97 nicht entscheidbar ist. → „auffällig (t ≥ 2) – In-Sample, kein Beleg“.
- **8. Kassa-Hürde als Annahme statt gemessen:** „0,06“ (app-shell.js:868, kosten.js:43), „Aktie 0,04“ (scoreboard.js:454). → „je Umsatzklasse 0,045 bis 0,157 Pp (gemessen 03.09.2026)“.
- Was trägt: alle Kapitulations-Texte („03.10.2026 … zurückgewiesen“), der Regime-Vermerk, Kanal als Bedingung (−0,17 Pp, t −4,1), Signalstudie (0 von 51), die Rückblick-Zeilen aus studienurteile.js. App-Code ist nicht geändert. Keine Anlageberatung.

## Vorgehen

Ich habe `wiki/belegstand.md` ganz gelesen, alle Nachträge bis 04.10.2026 23:06 eingeschlossen. Danach haben sieben Subagenten parallel je eine Dateigruppe durchgesehen. Jeder hat seine Tabelle sofort nach `pruefberichte/oberflaeche-inventur/` geschrieben, als `.md` für Menschen und als `.json` für den Test. Gesucht wurde in allen nutzersichtbaren Texten (HTML, gerenderte Strings, Tooltips, Hilfe-Texte, die sechs Release-Notizen vom 04.10.2026) nach Zahlen mit Wertung und nach Urteilswörtern. Code-Kommentare, Bedienzahlen und reine Laufzeitwerte gehören nicht dazu.

Die Einordnung:
- **a:** Die Zahl steht so in belegstand.md oder in einer dort genannten ERGEBNIS.md.
- **b:** Die Stelle ist als überholt gekennzeichnet.
- **c:** Der Belegstand sagt heute etwas anderes.
- **d:** Die Zahl oder das Urteil steht nirgends im Belegkorpus.

Bei der Endkontrolle habe ich **drei Stellen umgestuft**:
- index.html:1633 von b auf c: dort steht kein Überholt-Vermerk.
- index.html:2221/2222 („Rückschlag 52 % (2008)“, „8 von 22 Jahren“) von c auf b: beide stehen unter dem Laufzeit-Kopf `data-belege-kopf="momentum-liquide"`.

Die Zähler in den Köpfen der Gruppenberichte sind der Stand vor dieser Kontrolle. Maßgeblich sind die JSON-Listen und die Summe des Tests.

| Gruppe (Datei unter `oberflaeche-inventur/`) | Dateien | a | b | c | d |
|---|---|---|---|---|---|
| g1-index | index.html | 19 | 3 | 14 | 22 |
| g2-appshell-notizen | app-shell.js, wasneu.js, release-notizen/2026-10-04-*.md | 23 | 4 | 14 | 8 |
| g3-strategien | strategien.js, studienurteile.js, backtestui.js, strategiechart.js | 57 | 18 | 8 | 14 |
| g4-bestand-drift-markt | bestandui, driftui, marktui, berichte, marktkarteui, wendeui | 7 | 0 | 3 | 10 |
| g5-explorer-quant | explorer, scheinfinder, quant, kosten, messband | 15 | 0 | 4 | 4 |
| g6-depot | depot.js | 6 | 0 | 5 | 7 |
| g7-module | scoreboard, mfdepot, renderer, mittelfrist, massstab, depotmigration, momentum, drift, mfhandel, main, wkn, risiko (+ grep über alle übrigen *.js) | 6 | 0 | 5 | 3 |
| **Summe** | | **133** | **25** | **53** | **68** |

## Der Kleinsttest

```bash
node pruefberichte/oberflaeche-inventur.test.js        # alle 279 Stellen, je eine Zeile
node pruefberichte/oberflaeche-inventur.test.js c      # nur Klasse c
node pruefberichte/oberflaeche-inventur.test.js g6     # nur depot.js
```

Der Test schreibt keine Zahl ab. Er sucht den Wortlaut in der Quelldatei, liest die Zahlen dort heraus und hält sie gegen die Zahlen, die er an der genannten Belegstelle liest, bzw. gegen den ganzen Belegkorpus. Der Belegkorpus umfasst belegstand.md, kosten.md und alle `studien/**/ERGEBNIS*.md`.

So prüft er je Klasse:
- **a:** Jede Zahl steht in der Belegzeile oder in deren Tabellenkopf, auch als Rundung (−0,024 → −0,02).
- **b:** In der Nähe steht ein Überholt-Vermerk, oder der Laufzeit-Kopf (`belegeUeberholt.ab` / `data-belege-kopf`) steht davor.
- **c:** Die Zahlen fehlen in der heutigen Belegzeile, oder sie stehen dort nur noch als „überholt“ bzw. „Annahme“. Stimmen sie, meldet die Zeile, dass nur das Urteil abweicht.
- **d:** Die Zahlen stehen nirgends im Korpus beisammen mit einem Stichwort der Fundstelle. Eine einzelne unscharfe Zahl wie „96 %“ zählt nicht als Treffer.

Ändert jemand einen Text, meldet die Zeile „Wortlaut steht nicht mehr“. Steht eine c- oder d-Zahl nachträglich im Belegstand, wird die Zeile „kein Unterschied – Einordnung prüfen“.

Bei 7 Stellen sind die Ziffern Schwellen oder Parameter des Codes (0.5, 1.5, 60m, H=26, Güte 90, ±0,35). Sie tragen in der Liste `nurUrteil` und werden nur als Urteil geprüft.

Letzter Lauf:
`Summe: 279 Fundstellen - a 133 (0 Abweichung, 133 kein Unterschied); b 25 (0 Abweichung, 25 kein Unterschied); c 53 (53 Abweichung, 0 kein Unterschied); d 68 (68 Abweichung, 0 kein Unterschied)`

**Zu Kleinsttest 11** in `live-gegen-messung-momentum.test.js`: Seine drei Zahlen „Rückschlag 52 %“, „8 von 22 Jahren“ und „+20,3 % p. a.“ stehen hier als **b**. Sie stehen unter dem Kopf „Überholt“: strategien.js:89–91 über `belegeUeberholt.ab`, app-shell.js:1238/1239 über `belegeKopf()`, index.html:2221/2222 über `data-belege-kopf`. Test 11 meldet sie, weil er den Kopf nicht kennt. Seine Abweichung ist also erwartet, wie sein Kopf sagt.

Eine Einschränkung zu diesen Stellen: Unter demselben Kopf in strategien.js steht **nicht** die Kontrollmessung strategien.js:88 (c). Die Drift-Belege strategien.js:112–116 und die Intraday-Belege :36–40 sind nur durch einen Satz im Beleg davor gekennzeichnet („Die Zahlen darunter sind VOR der Zeitzonen-Korrektur“). Der Test zählt das als gekennzeichnet. Die Kennzeichnung ist aber schwach, und die Messung Nr. 88 wird dort nicht genannt.

## Alle c- und d-Stellen nach Sache, mit Vorschlag

Die vollständigen Tabellen mit Wortlaut, Fundstelle und Vorschlag je Zeile stehen in den sieben Gruppenberichten. Hier folgt die Zusammenfassung nach Sache.

### 1. Ergebnis-Drift
- **Veraltet:**
  - „+10,44 % p. a. bei t = 3,04“ (index.html:2349, app-shell.js:1256)
  - „+1,72 % bei t = 0,58“ (index.html:2350, app-shell.js:1257)
  - „−1,74 % (t = −0,88)“ (app-shell.js:1256)
  - „8,44 statt 14,07 % p.a.“ (app-shell.js:1095)
  - „Auf 20 Tagen ist der Effekt seit 2015 tot (t = 0,77) – erst ab rund 60 Tagen trägt er“ (index.html:2299). Nr. 88 misst 20 Tage +1,18 Pp (t 2,22) und 60 Tage Kaufseite netto +1,39 Pp (t 1,97).
  - „ihre eigene Messung steht aus“ (index.html:2297)
  - „überzufällig (t ≥ 2)“ (driftui.js:171)
- **Ohne Beleg:**
  - die Kontrollzahlen der Drift-Karte: „59,8 %“, „1,97 %“, „14,07 auf 8,44“, „12 Pp (t = 5,5)“, „5–7 Pp bei MDE 5,6–6,7“ (strategien.js:111)
  - „Alpha +6,90 % p. a. bei t = 2,20“ (app-shell.js:1254)
  - „beide Beine – long allein ist überwiegend Marktbeta“ (app-shell.js:1257). Gemessen ist nur die Kaufseite.
  - „(geprüft)“ an den Optionen 60 Tage / 20 % / 120 Tage (index.html:2303/2310/2317)
- **Vorschlag:** „Gemessen 04.10.2026 (Nr. 88, Regel vor der Zahl, 2021–2026, nach Kosten): Buch +13,01 % p. a. gegen S&P 500 +12,63 % p. a. (+0,38 Pp p. a.); 16 von 200 Zufallsbüchern liegen darüber → nicht entscheidbar, kein Vorwärtstest. Die frühere Zahl (+10,44 % p. a.) stammt von vor der Zeitzonen-Korrektur.“ „(geprüft)“ streichen.

### 2. RSI(2) im Seitwärtskanal / „Intraday-Kante“
- **Veraltet:**
  - „+0,065 Pp Überschuss … Rohkante +0,170“ (depot.js:635/662/663). Laut der Durchsicht steht das auch bei vorhandenem Protokoll im Regelkopf (depot.js:690).
  - „+0,147 Pp auf 8 Handelsstunden“ (index.html:1690, depot.js:5813)
  - „+0,235 statt +0,147“ (index.html:1747/1749)
  - „rund −0,04 Pp (Messmaschine 23.08.2026)“ (index.html:1790)
  - „+0,024 Pp bei MDE 0,182 … −0,045 je Signal“ (strategien.js:35)
  - „Der gemessene Vorsprung liegt über der Aktien-Kostenhürde … beide Kanten“ (index.html:1701/1704)
  - „Trägt erst mit der Erlaubnis …“ (explorer.js:203)
  - „einzige gemessen tragende Kanal-Nutzung“ (explorer.js:238)
  - „fand auf anderen Zeitrahmen keine tragfähige Kante“ (strategiechart.js:229). Der Satz legt nahe, 60m trage.
  - „RSI(2) … pausiert (verliert dort −0,17 Pp)“ (depot.js:3105). Die Zahl ist laut Vermerk vom 04.10. nicht nachrechenbar.
- **Ohne Beleg:**
  - „Roh ein Münzwurf (+0,017)“ (explorer.js:203)
  - „−0,08 % je Trade / +0,23 %“ (index.html:1703, app-shell.js:1305)
  - „0,10 % / 0,21 %“ (index.html:1702)
  - „Rund 62 % … schlichtes Halten“ (strategien.js:35)
  - „Zeithälften positiv“ (index.html:1691)
  - „99 gemessene Werte“ (index.html:1747/1748)
- **Vorschlag:** „RSI(2) im Seitwärtskanal, Protokoll 26.08.2026: Überschuss +0,021 Pp je Signal (Tagesmittel +0,054 Pp, se 0,065) – nicht entscheidbar, unter der Kassa-Hürde seiner Klasse. Mit Not-Stop: gegen CFD geschlossen.“

### 3. „Kante“ für Regeln ohne Beleg
- **Stellen:**
  - app-shell.js:1054 „Gemessene Intraday-Kanten“, app-shell.js:820 „Jede Kante wurde in genau einem Regime gemessen“ (c)
  - depotmigration.js:152 „Die gemessene Kante war auf“ (c)
  - index.html:1704 „beide Kanten“ (c)
  - strategiechart.js:229 (c), siehe oben
  - depot.js:1492/1506/5842/5843 „Kante“ im Warnband und im Regime-Text (d)
  - depot.js:6214 „im Rahmen der Studie“ bei t ≥ 1,5 (d)
  - strategiechart.js:277 „Put-Seite … trägt nicht“ (d)
  - strategien.js:26 „mit Schein stirbt die Kante (−96 %)“ (d)
- **Vorschlag:** überall „Regel“ statt „Kante“. Für das Urteil des Edge-Wächters: „positiv (t ≥ 1,5) – kein Beleg; die Studie selbst ist nicht entscheidbar“.

### 4. News-Sentiment
- **Stellen:**
  - „Das News-Sentiment war nie messbar“ (index.html:1628, strategien.js:66)
  - „35 Beobachtungen … nötig wären rund 2.600“ und „Unbelegt ist nicht widerlegt“ (index.html:1633/1634, depotmigration.js:268/269)
- **Vorschlag:** „Gemessen am 01.09.2026 (33.307 Beobachtungen, 1.338 Tage): über Nacht auf Großwerten kein Effekt, b = +0,0070 Pp je Score-Punkt, t = 0,31 – widerlegt. Seit dem 31.08.2026 steuert es nichts.“

### 5. Momentum-Buch
- **Veraltet:**
  - „gemessen – hält die volle Historie, nicht die zurückgehaltenen Jahre“ (strategien.js:80, Etikett der Karte)
  - „+2,42 Pp je Umschichtung (t = 3,84)“ und „+1,51 Pp bei MDE 1,86 (t = 1,62)“ (strategien.js:88)
  - „Momentum t = 1,62 … beide halten über die volle Historie“ (app-shell.js:1095)
  - „jede weitere ein Out-of-Sample-Beleg“ (app-shell.js:1232, mfdepot.js:178). Ein Vorwärtstest über Monate prüft die Umsetzung, nicht den Vorsprung.
  - „nach Steuern für den breiten Markt nicht gerechnet“ (studienurteile.js:159). Nr. 82 nennt −2,20 Pp p. a.
- **Ohne Beleg:**
  - „64,8 % … schlichtes Halten“ und „30 von 189 Werten“ (strategien.js:88)
  - „Zehn Prozent schnitten durchweg besser ab als zwanzig“ (index.html:2248)
  - „Bei 10 Basispunkten … rund 1,8 Prozentpunkte im Jahr“ (index.html:2321)
  - „Prüfzeitraum ab 2005 – Parameter auf den Jahren davor ausgesucht“ (mittelfrist.js:344)
- **Vorschlag:**
  - Etikett: „gemessen – nicht entscheidbar; liquide Fassung „lebt“ (In-Sample, am Rand)“.
  - strategien.js:88 unter den Überholt-Kopf schieben: `belegeUeberholt.ab` auf „KONTROLLMESSUNG 23.08.2026: Der eingebaute“ setzen.
  - Statt „Out-of-Sample-Beleg“: „Out-of-Sample-Beobachtung (für sich kein Beleg)“.

### 6. Stunden-Strategie
- **Stellen:** „−0,74 Pp auf 20 Handelstage“, „24.727 Signale, 189 Werte, 8 Jahre“, „32 von 189 positiv“, „Elliott-Beimischung −1,0 Pp“. Sie stehen in index.html:1615/1616/1625/1627/1628, strategien.js:65/66 und depotmigration.js:128/129. Belegt ist nur t = −11,6, und das auch nur über das „Gedächtnisprotokoll“.
- **Vorschlag:** „Ihr Technik-Score ist ein Kontraindikator (t = −11,6) – widerlegt, abgeschaltet.“ Die übrigen Zahlen streichen oder ihr Protokoll in belegstand.md aufnehmen.

### 7. Schein, Kosten, Hürden
- **Veraltet:**
  - „Aktienhürde 0,06“ (app-shell.js:868), `ALP_ANNAHME_PCT = 0.06` (kosten.js:43)
  - „annahmePct: 0.10“ für die Kassa-Bilanz (kosten.js:245)
  - „Aktie 0,04 · Schein am Geld 0,05“ (scoreboard.js:454)
- **Ohne Beleg:**
  - „−96 %“ mit Schein (index.html:1702/1791, app-shell.js:1285, depot.js:5824, strategien.js:26)
  - „ein Viertel bis ein Achtel der Schein-Kostenhürde“ und „5,5 bis 11 %“ (app-shell.js:1252/1255)
  - onvista-Stichprobe „0,13 % / 11,5 % / ein Fünftel“ (berichte.js:354/356)
  - „an echten (Emittenten-)Kursen geeichtes Cent-Modell“ (scheinfinder.js:323/424)
- **Vorschlag:**
  - Kassa-Hürde je Umsatzklasse: 5-50 0,1569 · 50-250 0,0854 · 250-1000 0,0647 · ab1000 0,0449 Pp (gemessen 03.09.2026, kosten.md).
  - Die Schein-Zahlen als „Rechenbeispiel, nicht als Messung abgelegt“ beschriften oder streichen.

### 8. Übrige
- **Winkel- und Trendwende-Detektor:**
  - „der einzige Teilüberlebende … in 4–6 Wochen wird nachgemessen“ (app-shell.js:1326, c)
  - „Das ist die belastbare Aussage“ (wendeui.js:258, c)
  - „widerlegt (0,074 Pp, t = 1,22)“ (wendeui.js:258, d: das t gehört zu einer anderen Zelle)
  - „Trendfinder — Detektor widerlegt“ (index.html:2656, c: laut Belegstand nicht entscheidbar, die Long-Seite in der Größe ausgeschlossen)
  - „1,0 die beste 1-Minuten-Zelle“ (index.html:2674, d)
  - → „nachgemessen: alle 10 Varianten im Punkt negativ, die Long-Seite in der Größe ausgeschlossen“.
- **Autopilot und Lernen:**
  - „doppelt bestätigte, robuste Ergebnisse“ (index.html:2144, depot.js:5885, d)
  - „Stellt alles auf die gemessenen Ergebnisse um“ (index.html:1671, d)
  - Gewichts-Empfehlungen nach „% Treffer“ (berichte.js:70/71, d)
  - „spart / rettet Geld“ auf Schwellen ohne Standardfehler (berichte.js:473/489, d)
  - „belastbar“ als Spalte (berichte.js:350/526, d)
- **Signal und Intraday:**
  - Golden/Death Cross „191 Werte über 55 Jahre“ (explorer.js:236, d)
  - „Intraday: … größeren Zeitrahmen (5/15 Min) testen“ (berichte.js:75, c: 1m, 5m und 15m sind gemessen und geschlossen, 0 von 234)
  - „Erster Backtest zuvor: −39 % bei p = 0,86“ (studienurteile.js:54, d)
- **Release-Notizen (letzte Version):**
  - „von +0,7 % auf +1,1 %“ (2026-10-04-massstab-rueckblick.md:3, d). Belegstand: +0,7 % bzw. aus dem Minutenarchiv +0,88 %.
  - „rund 2 % der Reihen … doppelt“ (2026-10-04-texte-pruefgang.md:3, c). datenquellen.md nennt 2,0 bzw. 2,45 % der **Zeilen**. Dieselbe Version nimmt den Hinweis in `rueckblick-v23` außerdem zurück.
  - Ein Widerspruch zwischen Notiz und App: `texte-pruefgang` sagt, am Drift-Buch stehe jetzt, dass seine Regel nicht gemessen ist. app-shell.js:1256 zeigt aber weiter „Was gemessen ist … +10,44 %“.

## Grenzen dieser Inventur
- Gelesen ist der Quelltext, nicht die laufende App. Texte, die erst zur Laufzeit aus Protokollen entstehen (Urteil, je-Signal-Zahl, Datum), gelten als Messung der App und sind nicht eingeordnet. Ihre festen Begleitsätze sind eingeordnet.
- **d heißt „nicht im Belegkorpus“, nicht „falsch“.** Mehrere d-Zahlen stammen vermutlich aus älteren Läufen (Gedächtnisprotokoll, Regime-Studie vom 21.08.2026, Backtests vor der Kontrollmessung). Sie sind nicht in belegstand.md aufgenommen und deshalb nach der Projektregel unbelegt.
- Die Gruppen haben Urteilswörter verschieden eng gefasst. Neutrales „gemessen“, also eine Messung, die stattfand, ist überwiegend nicht aufgenommen.
- **Audit-Punkt 21** („Messung an den Live-Pfad angleichen“) steht in CLAUDE.md als offen. Die Release-Notiz `live-gleich-messung` („handelt jetzt so, wie es gemessen wurde“) ist als a eingeordnet, belegt durch die REGEL.md des Rückblicks. Ob Punkt 21 damit erledigt ist, entscheidet nicht diese Inventur.

*Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. App-Code ist nicht geändert. Nur der Zweig `pruefung/oberflaeche-inventur` ist gepusht.*

## Prüfläufe auf diesem Zweig
- `npx eslint pruefberichte/`: 0 Fehler.
- `npm test`: 7 Tests in `test-v6.js` rot. Auf dem unveränderten main `61dca2c` sind es in diesem Container **dieselben 7**: kein Datenordner (`massive/universum-*.json`, test-messmaschine), Schreibschutz-Probe als root. Der Zweig ändert keinen App-Code und keine Datei, die test-v6 liest.
