# Momentum 12-1 über Monate mit Halte-Band 40 (Korb-Form)

**Vorregistrierung des PM, Auftrag Nr. 125b Fassung 2 (26.10.2026)**, gebaut vom Bau-Agenten vor jedem Blick auf Renditen dieser Regel.
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Was diese Regel ist — und was nicht

- **Anlass, nicht Grundlage:** die Machbarkeitstabelle des Beraterrats vom 23.10.2026
  (`\\192.168.0.15\archiv\freigabe\muehlwerk\wiki\analysen\2026-10-23-machbarkeit-handelssystem.md`, abgerufen 26.10.2026) mit Zeile 28
  („Momentum 3–12 Monate, Nasdaq-100-Werte, Halte-Band: brutto +2,5 … netto vor Konto +1,5 … bei 1.000/10.000 € +0,4/+1,2"), Zeile 43 („~280 J. (10.000 €)"),
  Zeile 62 („Umschichtung alle 63 Tage mit Halte-Band, ~40 % Austausch je Termin") und Zeile 76 („~20 Titel"), dazu das Ratsurteil
  `…\wiki\analysen\2026-10-23-rat-strategiefindung.md`. **Die Tabelle ist eine Größenordnungsrechnung** mit Annahme A1 (Nasdaq-100 künftig 9 % p. a.) und
  [u]-Markierungen. Sie legt keine Regel fest. **Die Regel unten ist eine Setzung des PM**; jede Zahl steht fest, bevor gemessen wird, und wird nach
  keinem Ergebnis verändert.
- **Das Machbarkeitstor wird voraussichtlich „nicht messbar" ergeben.** Die Kalenderrechnung ohne Renditen gibt folgende Werte: 38 vollständige
  63-Tage-Perioden (04.01.2017–15.09.2026) und m = 14. Mit se_pa = 4 · sd_q / √n folgt MDE80_korb = **22,07 Pp p. a.** gegen die behaupteten 1,2 Pp p. a., also
  **bräuchte die Regel ≈ 12.857 Perioden, ≈ 3.214 Jahre** (FORM.md §5, `tore.js` nach QS-Nachbesserung F1 vom 26.10.2026, Commit 266033b; `streuung.json` korb,
  sd_q 6,32 Pp je Periode; die erste Fassung dieser Datei nannte nach der alten Formel 11,04 Pp und ≈ 804 Jahre). Die Tabelle nennt dafür ~280 Jahre. Der Faktor 11,5
  ist ganz erklärt: Sicherheitsfaktor 1,4² = 1,96 × Schwelle ((3 + 0,84) / 2)² = 3,69 × Streuung (12,65 / 10)² = 1,6 (QS-Übergabe `korb-vorwaerts-qs-2026-10-26.md` F1).
  Maßgeblich ist die Zahl im Protokoll des Läufers, nicht diese hier. **„Nicht messbar" ist das ehrliche Ergebnis, kein Grund
  nachzujustieren.** Nach FORM.md §5 (Entscheid 24) gibt es dann weder Entdeckungslauf noch Vormerkung noch Vorwärtsblick der Prüfstraße. Auch vorwärts
  bräuchte eine Bestätigung bei 1,2 Pp p. a. und dieser Streuung grob 690 Jahre (eine Rechnung ohne Faktor 1,4 und ohne Holm-Familie). Das Buch der App läuft getrennt weiter (Nr. 126).
- **Die Entdeckung auf Panel v2.3 ist nicht frisch.** Korb 187 lief schon auf demselben Panel mit demselben Rechner: Nr. 96 und Nr. 122, Regel K 0,05,
  Fenster 231/21, 63 Starttage (`wiki/belegstand.md` „Rückblick über fünf Jahre"). Die Kante wurde nicht an diesen Daten gefunden,
  aber Wilhelm und der PM kennen die Daten und das Verhalten eines verwandten Korbs. Neu sind nur das Universum (100 statt 187), die Zielzahl
  (20 über `anzahl` statt 10 % des Universums) und das Band 40. **Der einzige saubere Blick wäre der Vorwärtsblick.**
- **Keine Nasdaq-100-Regel.** Das Panel hat kein Börsenfeld (`_stand.json` symbole: reihe, ordner, lebend, art, referenz, ende_grund …). Die heutige
  Nasdaq-100-Liste rückwirkend zu nehmen wäre Überlebensverzerrung (Fehlerform „Überlebensverzerrung ist der Killer"). Das Universum sind deshalb die
  **100 umsatzstärksten Werte des Panels über alle Börsen**. Die Erwartung der Tabelle („Nasdaq-100-Werte") wird damit auf ein anderes Universum übertragen [u].

## Regel (Prosa)

1. **Stichtag und Takt:** umgeschichtet wird alle **63 Handelstage**, ausgeführt zur **Eröffnung** des Umschichtungstags. Der Stichtag der Rangbildung ist der
   Panel-Handelstag davor. In der Entdeckung gibt es 63 Startphasen ab dem 04.01.2017 bis zum Panel-Ende, vorwärts beginnt der Lauf am Stichtag der Vormerkung.
   Liefert die Zielfunktion „zu wenig Werte", versucht `korb.js` die Umschichtung am nächsten Handelstag (es wird nichts verkauft).
   *Fundstelle:* `momentum.js` STANDARD.halten 63; `konfig.js` KORB.periodeTage 63, phasen 63, entdeckungVon 2017-01-04 (Nr. 125a);
   `studien/momentum-korb-2026-10-04/korb.js` simuliere (Ausführung Eröffnung, `zuWenig` → nächster Tag).
2. **Zulässig** ist ein Wert am Stichtag, wenn alle vier Bedingungen gelten (Regel des App-Buchs, `mfhandel.js` momentumZiel und `liquide.js` KORB):
   - Er hat mindestens **253 Zeilen** (231 + 21 + 1).
   - Seine letzte Zeile ist höchstens **7 Tage** alt.
   - Die Kurse am Fensteranfang, am Fensterende und am Stichtag sind > 0.
   - Sein **Median-Tagesumsatz** (Schluss × Stück) über die **20 Balken** bis einschließlich Stichtag ist **≥ 100 Mio $** (nominal).

   Unter 100 zulässigen Werten bildet das App-Buch keine Rangfolge (`mindestWerte` 100).
   Ausländische Werte (ADR, Panel-Art `ADRC`) zählen mit wie im App-Buch.
3. **Universum:** von den zulässigen die **100 mit dem höchsten 20-Tage-Median-Dollarumsatz** am Stichtag, Gleichstand nach Kürzel (`kandidat.json`
   `korb: 100`; `korb.js` korbWaehlen und korbZiel Schritt c/d). Die Größe ist zukunftsfrei, weil der Umsatz bis zum Stichtag reicht. Die Menge selbst ist es nur so weit,
   wie das Panel erloschene Reihen enthält. Die Trockenzählung unten findet 31 später erloschene Werte im Universum.
4. **Rangmaß:** Stärke = Schluss(Zeile i − 21) / Schluss(Zeile i − 252) − 1 auf dem **bereinigten** Schluss des Panels, wobei i die Zeile des Stichtags ist.
   Das ist die Rendite über **231 Handelstage, endend 21 Handelstage vor dem Stichtag**: „12 Monate ohne den letzten Monat". Es wird absteigend sortiert, der Rang gilt **innerhalb der
   100 des Universums**, und bei Gleichstand bleibt die Reihenfolge des Panels (stabile Sortierung, wie das App-Buch).
   *Fundstelle:* `momentum.js` STANDARD rueckblick 231, luecke 21 („Auf 1970–2004 gewählt, auf 2005–2026 bestätigt"); `mfhandel.js` momentumZiel
   (Fenster „EXAKT wie die validierte Stärke"); Literatur laut Wiki: Jegadeesh/Titman 1993, Rendite Monate −12 … −2 (`wiki/mehrfaktor-felder.md` Z. 23).
   **Abweichung vom Auftrag:** dort steht „252 Handelstage, die letzten 21 ausgelassen, mindestens 200 gültige Tage". Übernommen ist das Maß der App
   (Live = Messung geht vor Literatur). Gleich ist die Spanne i−252 … i−21. Die Mindestlänge ist 253 Zeilen statt 200, eine 200 steht nirgends im Code
   (Zweitleser 8). „Gesamtertrag" heißt hier bereinigter Schluss des Panels, wie im App-Buch; ob die Bereinigung Ausschüttungen enthält, prüft diese Regel nicht.
5. **Zielzahl 20, gleich gewichtet beim Kauf:** jeder neue Platz bekommt Depotwert / 20. Gehaltene Positionen werden **nicht** nachjustiert, wie im App-Buch
   (`mfhandel.js` planeUmschichtung). *Fundstelle:* Machbarkeitstabelle Z. 76 („~20 Titel"); `kandidat.json` `anzahl: 20` (FORM.md §2, Nr. 125a B2).
6. **Halte-Band 40 (= 2 × Zielzahl):** eine gehaltene Position bleibt, solange ihr Platz in der Rangliste der 100 **≤ 40** ist. Sie geht bei Platz 41 oder schlechter
   und wenn sie aus dem Universum fällt. Gehaltene Werte im Band belegen ihre Plätze zuerst (beste zuerst, höchstens 20; auch Plätze 21–40). Die übrigen
   Plätze füllen die bestplatzierten nicht gehaltenen Werte in Rangfolge. *Fundstelle:* `mfhandel.js` zielMitBand (Nr. 125a B2, angewandt 26.10.2026);
   `kandidat.json` `params.halteBand: 40`. **Begründung:** eine Setzung des PM. Die Tabelle nennt in Z. 62 „~40 % Austausch je Termin" als Annahme über den
   Umschlag, nicht als Band-Parameter (Zweitleser 18). Eine Literaturstelle für „30–50 % Austausch bei Band 2 × Zielzahl" ist im Wiki nicht zu finden und
   wird deshalb nicht behauptet. Den Austausch zählt die Trockenzählung unten (Rangwechsel, keine Rendite), und das Protokoll misst ihn. Angepasst wird nichts.
7. **Regel K** (Kleinstbestand): an, `kleinstAnteil` 0,05 (Nr. 85/96, `mfhandel.js` buchKonfig, `konfig.js` KORB) — der Adapter setzt sie.
8. **Ausschüttungen** werden nach dem Handel des Ex-Tags gutgeschrieben, Anspruch hat der Bestand vor dem Handel (`korb.js` simuliere). Reihenenden laufen über die Hauptregel des Prüfstands.
9. **Kosten:** es gilt die Kostenregel der Prüfstraße (`kostenBpJeSeite: 'regel'`): Eröffnungsspanne der Kostenklasse 1–5 plus IBKR Fixed (0,005 $/Stück,
   mindestens 1 $, höchstens 1 % je Order). Das **Startkapital ist 10.000 €** (Modell „Dollar wie Euro", `konfig.js` KORB.kapitalUsd), eine Position anfangs also ≈ 500 $.
   **Die Mindestgebühr von 1 $ ist dann ≈ 0,2 % je Order**, rund 0,4 Pp je Umlauf. Das gilt für kleine Konten wirklich und steht deshalb im Protokoll,
   statt wegdefiniert zu werden. Den Vergleich mit 1.000 € kann der Adapter nicht rechnen, weil er nur ein Kapital kennt (`lauf` opt.kapitalUsd). Die Rechnung steht unter „Erwartung".
10. **Maßstab:** Nasdaq-100-ETF nach deutscher Steuer (`massstab: 'nasdaq100-steuer'`, QQQ-Kurs mit Ausschüttungen, Steuerrechner Nr. 82). Der Rang gegen die
    Zufallsbücher wird vor Steuern bestimmt (FORM.md §3).
11. **Placebo** (Zufallsbücher, B = max(200, 20 m + 1)): **dieselben zulässigen Werte, dasselbe Universum, dieselbe Band-Mechanik** (Zweitleser 13).
    **In den Kandidatenläufen baut der Adapter die Zufallsbücher selbst** als **persistenten Zufallsrang** (`adapter/korb.js persistentesPlacebo`, QS-Nachbesserung
    F5 vom 26.10.2026, Commit 266033b). Jeder Wert hat einen Zufallswert, der je Termin mit Wahrscheinlichkeit q neu gezogen wird (mit Halte-Band Vorgabe q = 0,40,
    gesetzt vor dem Rangvergleich ohne Renditen, bei der Vormerkung festgeschrieben). Die Zufallsbücher ziehen dieselbe Zahl Werte aus denselben zulässigen der
    Zielfunktion dieses Kandidaten und laufen durch dasselbe Band. **Damit haben sie denselben Umschlag wie der Kandidat** (Protokoll: Umschlag Kandidat/Zufall, Ziel
    ± 3 Pp; Rang nach **und vor** Kosten). Die Persistenz des Momentum-Rangs (überlappende 12-1-Fenster, ~73 %) ist Mechanik, keine Information; die faire
    Nullhypothese ist deshalb ein gleich zäher Rang ohne Information. *Fundstelle:* FORM.md §3 korb (QS F5).
    `regel.placeboZiel` bleibt Pflicht der Form und wird getestet. Es ordnet die zulässigen Werte nach sha256(placeboWort | Stichtag | Kürzel) je Stichtag neu, liefert
    eine Rangliste der Länge 40 und läuft ebenfalls durch `zielMitBand` (das beschreibt auch `params.placebo` in `kandidat.json`). So ein frischer Zug je Termin
    tauschte aber etwa doppelt so viel wie der Kandidat (gezählt: 66 % gegen 32 % je Termin, unten), bei 500-$-Positionen grob 0,6 Pp p. a. mehr Kosten — diese
    Schieflage beseitigt der persistente Zufallsrang des Adapters.

## Parameter (alle fest vor der Messung)

| Parameter | Wert | Begründung / Fundstelle |
|---|---|---|
| Form, Konfiguration | `korb`, genau eine: `M12-1-H40-T63` | FORM.md §2 korb (Nr. 121-1: genau eine Konfiguration) |
| Universum `korb` | 100 umsatzstärkste zulässige Werte, alle Börsen | Auftrag 0a (PM-Entscheid); kein Börsenfeld im Panel |
| Zulässigkeit | ≥ 253 Zeilen, ≤ 7 Tage alt, Kurse > 0, Median-Dollarumsatz 20 Balken ≥ 100 Mio $, mindestens 100 zulässige | `mfhandel.js` momentumZiel, `liquide.js` KORB (Live = Messung) |
| Rangmaß | Schluss(i−21) / Schluss(i−252) − 1, bereinigt | `momentum.js` STANDARD 231/21; J/T 1993 laut `wiki/mehrfaktor-felder.md` Z. 23 |
| Zielzahl `anzahl` | 20, gleich gewichtet beim Kauf, ohne Nachjustieren | Tabelle Z. 76; `planeUmschichtung` |
| Halte-Band `params.halteBand` | 40 (Platz ≤ 40 hält) | PM-Setzung (2 × Zielzahl); Tabelle Z. 62 nur als Umschlag-Annahme |
| Takt | 63 Handelstage, Eröffnung, Stichtag = Vortag | `momentum.js` halten 63, `konfig.js` KORB |
| Startphasen / Entdeckung | 63 / 04.01.2017 bis Panel-Ende | FORM.md §5 korb (Nr. 125a) |
| Regel K | 0,05 | Nr. 85/96 |
| Kosten | Kostenregel Eröffnung + IBKR Fixed, Kapital 10.000 € | FORM.md §3, Entscheid PM 19 (Nr. 125a) |
| Maßstab | Nasdaq-100 nach Steuer | `konfig.js` KORB.massstab |
| Erwartung | netto 1,2 / brutto 2,5 Pp p. a., Richtung positiv, `fensterWieQuelle` false | Abschnitt „Erwartung" |

## Erwartung

- **`bruttoPp` 2,5** Pp p. a., vor Kosten und Steuer gegen den Nasdaq-100. Die Fundstelle ist die Tabelle, Spalten 1/2 von Z. 28 mit A5: Literatur nach der Veröffentlichung,
  1994–2015 5,5 % p. a. long-short, die Hälfte für „nur kaufen", übertragen auf Nasdaq-100-Werte [u]. Den Verfall nach Veröffentlichung belegt das Wiki:
  McLean/Pontiff 2016 (`wiki/mehrfaktor-felder.md` Z. 15). Asness/Moskowitz/Pedersen 2013 und Novy-Marx 2012 (12-2) sind im Wiki nicht belegt und
  werden nicht zitiert. Für die Korb-Form trägt `bruttoPp` kein Urteil, es steht nur nachrichtlich da.
- **`nettoPp` 1,2** Pp p. a. nach Kostenregel und Steuer gegen den Nasdaq-100-ETF. Diese Zahl trägt das Machbarkeitstor. Sie ist die **10.000-€-Zeile der Tabelle**,
  eine Setzung des PM. Die Tabelle zieht davon Alpaca-Kontokosten ab (A3, ~0,35 Pp bei 10.000 €), die bei IBKR so nicht anfallen; netto vor Konto wären es +1,5.
  Mit 1,2 statt 1,5 wird **das Tor strenger, nicht laxer**: eine kleinere Behauptung braucht mehr Perioden.
  **Was gegen „konservativ" spricht (Zweitleser 14/17/19):** die Tabelle rechnet 1,5 Umläufe × 0,10 Pp = 0,15 Pp p. a. Kosten (Alpaca ohne Provision).
  Die Kostenregel dieser Messung gibt bei ≈ 500-$-Positionen dagegen ≈ 0,40 Pp Gebühr + 0,03–0,08 Pp Eröffnungsspanne (Klasse 5/4) je Umlauf.
  Mit dem **gezählten** Umschlag von 1,28 Umläufen p. a. (unten) sind das ≈ 0,55–0,61 Pp p. a., rund 0,4–0,5 Pp mehr als die Tabelle.
  Nach der Rechenweise der Tabelle läge netto vor Konto dann bei ≈ +1,0 bis +1,1. Die 1,2 liegt also nicht unter dem, was die Tabellenlogik mit IBKR-Kosten
  ergibt. Sie ist eine bewusste Setzung und bleibt unverändert. **Bei 1.000 €** (≈ 50-$-Positionen) greift der 1-%-Deckel der Gebühr, also ≈ 2 Pp je Umlauf
  und ≈ 2,6 Pp p. a. — die Behauptung wäre dort negativ. Gemessen wird nur mit 10.000 €.
- **Steuer** −1,0 Pp p. a. laut Tabelle (A4, Einzelaktien mit Halte-Band) [u]; gemessen wird mit dem Steuerrechner Nr. 82, nicht mit dieser Zahl.

## Trockenzählung (ohne Renditen, 26.10.2026)

Gezählt wurden auf Panel `querschnitt-pruefstand-2026-09-13/panel/v2.3` (Bau 2c, Ordner `voll-v23c`, letzter Tag 15.09.2026) nur Zeilen, Reihen, Umsatz und Rangwechsel. Kein Kurs, keine
Stärke und keine Rendite wurde ausgegeben. Die Funktionen sind die des Laufs: `rohMapAm` → `momentumZiel` → `korbWaehlen` → `zielMitBand`, Startphase k = 0. Das Skript liegt im Kratzordner der
Übergabe (`trockenzaehlung.js`). Die Spalte „Nasdaq heute" ist die **heutige** Börse laut SEC-Stammdaten (`Markt-Dashboard-Daten/markt/stammdaten.json`, Stand 04.09.2026,
2.268 Werte). Sie ist nur nachrichtlich und **keine** Mitgliedschaft im Nasdaq-100: eine Mitgliederliste gibt es offline nicht, und eine Websuche war ausgeschlossen.
Werte ohne Stammdaten sind meist erloschen.

| Stichtage im Jahr | Termine (k = 0) | zulässig insgesamt (min–max) | Universum | Nasdaq heute (Mittel) | ohne Stammdaten | später erloschen (Mittel) | ADR (Mittel) |
|---|---|---|---|---|---|---|---|
| 2017 | 4 | 385–403 | 100 | 37,8 | 8,5 | 7,8 | 3,3 |
| 2018 | 4 | 399–453 | 100 | 39,0 | 9,8 | 8,8 | 3,5 |
| 2019 | 4 | 403–468 | 100 | 38,8 | 8,8 | 7,8 | 2,8 |
| 2020 | 4 | 396–585 | 100 | 44,3 | 6,0 | 4,3 | 4,0 |
| 2021 | 4 | 540–625 | 100 | 45,8 | 6,3 | 3,0 | 8,3 |
| 2022 | 4 | 586–664 | 100 | 43,3 | 6,3 | 2,8 | 6,0 |
| 2023 | 4 | 496–595 | 100 | 43,5 | 5,3 | 2,3 | 4,8 |
| 2024 | 4 | 585–628 | 100 | 45,0 | 3,5 | 0,5 | 4,8 |
| 2025 | 4 | 651–842 | 100 | 45,8 | 3,8 | 0,3 | 4,0 |
| 2026 | 3 | 819–914 | 100 | 51,7 | 1,7 | 0,0 | 4,0 |

- **Umschichtungen:** 39 Termine in der Startphase k = 0 (erste Ausführung 04.01.2017, letzte 16.07.2026), das sind 38 nach dem ersten. Jede der 63 Startphasen hat
  38–39 Termine. 2016 dient nur als Vorlauf, weil die Rangbildung 253 Zeilen braucht. An keinem Termin gab es zu wenige Werte (`zuWenig`).
- **Austausch je Termin (neu gekaufte von 20):** mit Band 40 im Mittel **6,58** (Median 7, 2–12) = **32,9 %**, ≈ 1,32 Umläufe p. a. Ohne Band (die ersten 20)
  sind es 9,47 = 47,4 %, ≈ 1,89 Umläufe p. a. Über 9 der 63 Startphasen (k = 0, 7, …, 56) liegt der Wert mit Band bei 6,1–7,0 (Mittel 6,42 = 32,1 %, 1,28 Umläufe p. a.)
  und ohne Band bei 9,0–9,8 (Mittel 9,37). Die Tabelle nahm ~40 % bzw. 1,5 Umläufe an. Das Band senkt den Austausch um rund ein Drittel.
- **Warum verkauft wird (Band, k = 0):** 134-mal Platz > 40, 116-mal aus dem Universum gefallen. Das Universum wechselt je Termin im Mittel um 16,2
  von 100 Werten (11–23). Fast die Hälfte der Verkäufe kommt also aus der Umsatz-Rangliste, nicht aus dem Momentum.
- **Universum über alle Termine:** 317 verschiedene Werte. 31 davon sind später erloschen (Übernahme 20, Fusion mit Aktientausch 4, Insolvenz 2, Notierung unterbrochen 2,
  Ticker-Umbenennung 2, freiwillig 1) — erloschene Reihen sind im Universum also enthalten. 131 der 317 sind heute an der Nasdaq notiert, 37 haben keine Stammdaten.
- **Placebo-Austausch (5 Zufallswörter, k = 0):** bei Zufallsrang je Stichtag 12,6–13,6 von 20 (≈ 66 %), bei festem Zufallsrang 2,0–2,7 (≈ 12 %). Die
  Kandidatenläufe benutzen keinen von beiden, sondern den persistenten Zufallsrang mit q (Regel 11), der auf den Umschlag des Kandidaten zielt.

## Bekannte Grenzen

- **Überlebensverzerrung im Universum:** das Panel enthält erloschene Reihen (siehe oben). Ob es alle enthält, prüft diese Regel nicht. Die Fehlerformen
  „Zwei Listen heißen Universum" (Kursarchiv gegen Marktkarte) und „verschwundene Reihen" (12.09.) gelten weiter.
- **Nominale Schwelle 100 Mio $:** die Zahl der zulässigen Werte wächst von 385 (2017) auf 914 (2026). Das Universum bleibt fest bei 100, seine untere Umsatzgrenze steigt mit.
  `liquide.js` sagt dazu: „Die Schwelle ist NOMINAL und wird nicht verbessert".
- **Kleinstbestand und Gutschrift-Reihenfolge:** Regel K und die Gutschrift am Ex-Tag folgen dem Rechner von Nr. 85/96 (Fehlerformen „Kleinstbestand",
  „Gutschrift-Reihenfolge" laut Auftrag). Diese Regel ändert daran nichts.
- **Register:** m = Register-Einträge + 1 (heute 14). Die Korb-Familie hat kein eigenes Gewicht. Korb 187 ist kein Register-Eintrag der Prüfstraße, er wurde
  aber auf demselben Panel gesehen (siehe oben).
