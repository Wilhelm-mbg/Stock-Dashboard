# REGEL — Qualität: Gross Profits / Assets (Novy-Marx 2013), 30 Titel long gegen den S&P 500 nach Kosten (Phase 3, 04.10.2026)

Kennung `qualitaet-gpa/v1`. Diese Datei ist **vor jeder Zahl** geschrieben; es wurden **keine Kursdaten gelesen und nichts gerechnet**.
Gemessen wird später lokal auf dem Archiv. Teil A ist die Regel, Teil B die Konstanten mit Fundstelle, Teil C die Lesarten (dort
auch die bekannten Mängel der Mechanik), Teil D die Prüfungen. Belegdatei: `studien/kandidaten-blind-2026-10/belege/FAMILIE-qualitaet-profitabilitaet.md`
(Kennzeichen dort: **[Q]** gelesen, **[W]** Websuche, **[G]** Gedächtnis). Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Teil A — die Regel

### A.1 In einem Satz
Jährlich: aus den liquiden US-Nichtfinanzwerten das **obere Terzil nach Bruttogewinn/Bilanzsumme** (12 Monate, nur Meldungen, die schon
veröffentlicht waren), davon die **30 mit der höchsten Kennzahl**, **gleich gewichtet**, long, 20 Bp je Seite, gegen SPY mit Ausschüttungen.

### A.2 Universum (Stichtag t = Panel-Handelstag vor dem Ausführungstag)
1. Aktienreihen des Panels, Referenzreihen (SPY, ETFs) **nicht** — ein Kürzel, das nicht im Panel ist, fehlt in der `rohMap` und ist damit nicht zulässig.
2. Kursreihe mit mindestens 20 Zeilen bis t; letzte Zeile höchstens 7 Kalendertage vor t (sonst „veraltet", wie `momentumZiel`); Schlusskurs an t > 0.
3. Korbregel `liquide.js`: Median-Tagesumsatz ≥ 100.000.000 $ über 20 Balken bis t (Median = `sortiert[n >> 1]`).
4. **Keine Finanzwerte: SIC 6000–6999 raus.** Quelle der Ausschlussregel: Novy-Marx 2013, JFE 108(1) [Q, Belegdatei §1: „ohne Finanzwerte (SIC 6xxx)"];
   Begründung: Für Banken/Versicherer ist der Bruttogewinn nicht definiert (kein Umsatzkosten-Posten). Sie werden **ausgeschlossen, nicht gesondert geregelt**.
   SIC unbekannt ⇒ nicht zulässig (Fail-closed: lieber ein Wert zu wenig als ein Finanzwert im Korb).
5. Bilanzdaten vorhanden und der Bruttogewinn über die Rückfallkette (A.3) rechenbar; Bilanzsumme > 0; jüngste Bilanz höchstens 548 Tage alt.
6. **Mindestzahl:** mindestens **100 rangierbare Werte** nach 1–5 (`Li.KORB.mindestWerte`). Weniger ⇒ `zuWenig: true`, nicht handeln, am nächsten Handelstag neu versuchen (wie das Buch).

### A.3 Signal: GP/A
`GP/A = Bruttogewinn der letzten 12 Monate / Bilanzsumme am Ende dieser 12 Monate` (Novy-Marx: (REVT − COGS)/AT).

**SEC-Tags (us-gaap), exakt, Rückfallkette vorab, in dieser Reihenfolge — die erste Regel, die in ALLEN beteiligten Meldungen Zahlen liefert, gilt für diesen Wert, nie gemischt:**

| Regel | Bruttogewinn |
|---|---|
| 1 | `GrossProfit` |
| 2 | `Revenues` − `CostOfRevenue` |
| 3 | `Revenues` − `CostOfGoodsAndServicesSold` |
| 4 | `RevenueFromContractWithCustomerExcludingAssessedTax` − `CostOfRevenue` |
| 5 | `RevenueFromContractWithCustomerExcludingAssessedTax` − `CostOfGoodsAndServicesSold` |
| 6 | `SalesRevenueNet` − `CostOfRevenue` |
| 7 | `SalesRevenueNet` − `CostOfGoodsSold` |

Nenner: `Assets`. Nicht in der Kette (nicht gerechnet): `RevenueFromContractWithCustomerIncludingAssessedTax`, `SalesRevenueGoodsNet`, `CostOfServices`,
`CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization`. Ist keine Regel rechenbar, ist der Wert nicht zulässig (kein Auffüllen, keine Schätzung).

**12-Monats-Größe (Quartalsflüsse):** für die jüngste Periode E, die rechenbar ist (absteigend nach E):
10-K: der Jahreswert (quartale = 4). 10-Q mit q ∈ {1,2,3} (kumuliert vom Geschäftsjahresbeginn, SEC `qtrs`):
`TTM = Jahreswert (Geschäftsjahr, das q Quartale vor E endet) + Kumulat(E, q) − Kumulat(E − 12 Monate, q)`.
Fehlt einer der drei Teile (nach Karenz sichtbar), gilt die nächstältere rechenbare Periode. Bilanzsumme = `Assets` im Eintrag der Periode E.
Perioden werden mit ±10 Tagen Toleranz zugeordnet (52/53-Wochen-Jahre).

**Look-ahead:** Eine Meldung existiert zum Stichtag erst, wenn `filed + 3 Kalendertage ≤ nowMs`. Maßgeblich ist das Einreichungsdatum `filed`, **nie** das Periodenende.
Mehrfach vorhandene Einträge für dieselbe (Periodenende, quartale): die **jüngste Einreichung ≤ nowMs − Karenz** gilt (Korrekturen/Neudarstellungen ab dann).

### A.4 Auswahl
Rang absteigend nach GP/A, Gleichstand nach Kürzel aufsteigend. **Oberes Terzil** (`ceil(n/3)` der rangierbaren Werte; Novy-Marx 2013 Tab. 7, Large-Cap-Terzile [Q]).
Daraus **die 30 mit der höchsten GP/A**: Zielzahl = `min(30, ceil(n/3))`. Bei n ≥ 100 ist das Terzil ≥ 34, die Zielzahl also **30**, und die Auswahl ist praktisch „die 30 höchsten
GP/A". Begründung der Begrenzung: Rahmen des Auftrags (höchstens ~30 Positionen); Novy-Marx' Terzil hätte 150 Titel [Belegdatei §1]. **Ehrlich:** das Terzil bindet nie; es ist formal die
Eingrenzung, das Signal ist die Spitze des Terzils. Das ist eine **schärfere und stärker streuende Fassung** als die der Quelle (Extremwerte, Branchenhäufung — Teil C.5).
Nicht gerechnet: Quintil, 30 zufällig/umsatzstärkste aus dem Terzil, Dezil, Kapitalgewichtung.

### A.5 Takt — **jährlich** (252 Panel-Handelstage), nicht 63
Novy-Marx bildet die Portfolios **jährlich** (Ende Juni) [Q]. Jährlich ist der Takt der Literatur und zugleich der Takt, in dem GP/A sich ändert (Bilanz ändert sich langsam); Kostenanteil
laut Belegdatei ≈ 0,1–0,2 Pp/Jahr. **Nicht gerechnet:** vierteljährlich (63 Tage; mit jedem Quartalsabschluss neu) — das wäre die Fassung mit mehr Perioden (siehe A.9), aber ohne Literaturbeleg und mit vier Mal mehr Handel.
Der Takt ist **nicht an Juni gebunden**: der erste Ausführungstag je Fenster ist durch die Fenster gegeben (04.01.2017, 16.09.2021), die 63 Starttage streuen über rund drei Monate danach.

**Simulatorgröße, die dafür zu ändern ist (korb.js bleibt unangetastet):** in `studien/momentum-korb-2026-10-04/korb.js` die **eine** Zeile 180 `var halten = MH.buchKonfig().halten, …` (63) auf **252** setzen —
dieselbe Variable bestimmt Zeile 262 (`naechste = o + halten <= oEnd ? Q.ptage[o + halten] : -1`). Ein Simulator für diese Studie braucht also nur eine Kopie von `korb.js` mit `halten = 252`.
In der App selbst steht `MH.buchKonfig().halten` = `Mo.STANDARD.halten` (63); die App wird nicht angefasst.

### A.6 Mechanik: **Gleichgewicht** (die Variante aus `momentum-korb-2026-10-04/REGEL.md` §1.5 und Teil C.3, wörtlich und unverändert)
An jedem Ausführungstag werden **alle Zielwerte auf `Depotwert / Zielzahl`** gestellt (Übergewichtete teilverkauft, Untergewichtete aufgestockt, Nicht-mehr-Ziele ganz verkauft; Verkäufe vor Käufen, 20 Bp auf
jedes gehandelte Volumen, Depotwert zu Eröffnungskursen; ein Ziel ohne Eröffnungskurs wird nicht gehandelt). Begründung: (a) bei einem **jährlichen** Takt würde die Mechanik der App (Gehaltenes wird nie nachjustiert,
Neukauf bekommt `Depotwert/Zielzahl`) ein Jahr Drift ansammeln; die bekannten Mängel (Plätze leer, Kleinstpositionen, Nr. 85) wären hier größer als beim Quartalstakt, weil Gewinner länger wachsen, ohne gestutzt zu werden;
(b) die Quelle bildet Portfolios jährlich neu mit festen Gewichten; (c) Gleichgewicht ist im Projekt schon gerechnet und geprüft (`korb.js`, Lauf A-187-gleich/B-187-gleich), also kein neuer Code. Nicht gerechnet: Mechanik der App.
Hinweis: Wilhelm hat am 04.10.2026 für das **Momentum-Buch** „alle Ziele gleich gewichten" abgelehnt (`wiki/entscheide.md`); das betrifft die Mechanik jenes Buchs, nicht diese Studie. Die Wahl wird **offen** genannt: sie ist hier eine Messentscheidung, kein Vorschlag für die App.

### A.7 Kosten, Fenster, Starttage, Zeitablauf
- **Kosten 20 Basispunkte je Seite** (`MH.fuehreAus(…, 20)` bzw. 0,998/1,002 beim Gleichgewicht). Startkapital 100.000. Maßstab **SPY aus dem Panel mit Ausschüttungen**, ohne Kosten, Kauf zur selben Eröffnung (wie `massstab-rueckblick-2026-10-04/REGEL.md` §1.5–1.6; die SPY-Ergänzung vom 15.06.2018 wie in `korb.js`).
- **Fenster A:** 04.01.2017 – 15.09.2021 (1.183 Handelstage). **Fenster B:** 16.09.2021 – 15.09.2026 (1.254 Handelstage).
- **63 verschobene Starttage k = 0 … 62:** erster Ausführungstag k Panel-Handelstage nach dem ersten Fenstertag, Ende für alle am Fensterende; p. a. über die eigene Dauer. Bei Takt 252 gibt es je Phase **4–5 Perioden**: Fenster A bei k = 0 die Ausführungstage mit Panel-Ordnung 253, 505, 757, 1009, 1261 (letzte angebrochen, 175 Tage), Fenster B 1436, 1688, 1940, 2192, 2444 (letzte angebrochen, 246 Tage).
- **Zeitablauf wie die Grundregel** (`massstab-rueckblick-2026-10-04/REGEL.md` §1.3–1.5, Teil C): Stichtag = Panel-Handelstag vor dem Ausführungstag; Zielliste aus `zielfunktion(roh, { nowMs, fundamental, sic })` mit den Zeilen bis einschließlich Stichtag;
  Handel zur **Eröffnung** des Ausführungstags (ohne Kurs: nicht gekauft, Position ohne Kurs gehalten); bei `zuWenig` kein Handel, nächster Tag neu; Bewertung täglich zum Schluss; Reihenende (Hauptregel Insolvenz/Zwangs-Delisting → 0, sonst letzter Schlusskurs); Ausschüttungen am Ex-Tag
  (Buch: Bargeld, nach dem Handel gutgeschrieben, bei der nächsten Umschichtung wieder angelegt; Maßstab: sofort in SPY); Ende am 15.09.2026.
- **`rohMap` je Stichtag:** `{ KÜRZEL: [[Zeitstempel (Mitternacht UTC), bSchluss, umsatz / bSchluss], …] }` — nur Zeilen bis t; es genügen die letzten 20 Zeilen (`zielfunktion` braucht sie), aber nicht weniger.
- **Fenster A beginnt am 04.01.2017** wie im Projekt üblich (Stichtag 03.01.2017); `zielfunktion` verlangt nur 20 Zeilen, nicht 253.

### A.8 Form von `opts.fundamental` (Kopfkommentar von `ziel.js` und hier identisch)
```
opts.fundamental = {
  KÜRZEL: [
    { filed:      'JJJJ-MM-TT',      // Einreichungsdatum der Meldung (SEC sub.filed), nie das Periodenende
      periodEnde: 'JJJJ-MM-TT',      // Periodenende der Zahl (SEC num.ddate)
      form:       '10-K' | '10-Q',   // andere Formulare (10-K/A, 10-Q/A, 8-K, 20-F …) werden ignoriert
      quartale:   1 | 2 | 3 | 4,     // Dauer der Flussgrößen in Quartalen ab Geschäftsjahresbeginn (SEC num.qtrs):
                                     //   10-K: 4; 10-Q: 1 (nur Q1), 2 (Halbjahr kumuliert), 3 (neun Monate kumuliert)
      werte:      { TagName: Zahl }  // us-gaap-Tags exakt (A.3), in US-Dollar (nicht in Tausend); Flüsse für `quartale`; Assets = Bestand am periodEnde
    }, …
  ]
}
opts.sic = { KÜRZEL: 3571 }          // SIC-Code (Zahl oder Zahlenstring), EDGAR; fehlt er, ist der Wert nicht zulässig
```
- Eine 10-Q trägt neben der laufenden Periode **auch die Vorjahresvergleichszahlen**; sie sind **eigene Einträge** (eigenes `periodEnde`, gleiche `quartale`), mit dem `filed` **derselben** Meldung. `Assets` ist nur im Eintrag der laufenden Periode nötig (die Vorjahresvergleichsbilanz steht zum Vorjahres-Geschäftsjahresende, nicht zum Vorjahresquartal).
- Gleiche (periodEnde, quartale) mehrfach (Korrekturen): die jüngste Einreichung mit `filed + 3 Tage ≤ nowMs` gilt, bei gleichem `filed` die später im Feld stehende. Ungültige Datumsangaben, andere Formulare, `quartale` ∉ {1,2,3,4}, Nicht-Zahlen als Wert werden **ignoriert** (zählen als fehlend).
- Der Leser (Skript des Messlaufs, nicht Teil von `ziel.js`) darf **nur** Meldungen liefern, die es am Stichtag gab; `ziel.js` filtert zusätzlich selbst (Doppelsicherung), liest aber **nichts** nach.
- Fehlt `opts.fundamental` ganz oder für ein Kürzel: nicht zulässig (Grund „keine Bilanzdaten"); kommt ein Kürzel nicht in `rohMap` vor, existiert es für die Regel nicht.

### A.9 Entscheidregel (VORAB, wörtlich nach Auftrag)
**„Schlägt SPY"** nur, wenn **in beiden Fenstern** (A und B)
1. beim Start am ersten Tag (**k = 0**) das Buch **vorn** liegt (Endwert Buch > Endwert SPY, strikt), **und**
2. in **mindestens 45 von 63** Starttagen **vorn** (je Fenster), **und**
3. der **Median des Abstands** (Buch − SPY, Pp p. a.) über die 63 Starttage **> 0** (je Fenster).
Sonst „**schlägt nicht**"; die Zwischenurteile je Fenster (z. B. „A ja, B nein") werden genannt. Gleichstand ist **nicht** vorn. Ein „schlägt nicht" heißt wegen der Auflösung **nicht** „es gibt keinen Effekt" (A.11).

### A.10 Placebo-Kontrolle (`placeboZiel` in `ziel.js`)
Dieselbe Mechanik (Gleichgewicht, jährlich, 20 Bp), **dasselbe Universum** (alle rangierbaren Werte nach A.2 1–5: liquide, Nichtfinanz, Bilanz rechenbar), **dieselbe Zielzahl** (`min(30, ceil(n/3))`, also 30), die Auswahl **zufällig ohne Zurücklegen**
mit einer deterministischen PRNG: Seed = FNV-1a-32 über `"JJJJ-MM-TT|qualitaet-gpa-placebo"` (Stichtag als UTC-Datum), PRNG mulberry32, Ausgangsliste nach Kürzel aufsteigend sortiert, Fisher-Yates über die ersten 30 Plätze.
**Lesart (vorab):** Das Placebo trägt keinerlei GP/A-Information, nur die **Zulässigkeit** (Bilanz rechenbar) ist dieselbe. Die Regel zeigt „Signal-Beitrag" nur, wenn **Buch(Regel) − Buch(Placebo)** je Fenster im Median über die 63 Starttage > 0 ist.
Das Placebo ist **ein Zug**, keine Erwartung (CLAUDE.md: Kontrolle als Erwartung bauen, nie als Zug); die Streuung eines einzelnen 30er-Zugs gegen den Mittelwert des Universums liegt bei einigen Pp p. a. — deshalb **nachrichtlich** zusätzlich die Familie `placeboWort = 'qualitaet-gpa-placebo-01' … '-20'`
(`opts.placeboWort`, vorab festgelegt, **keine Auswahl**): Mittel und Spanne des Abstands über die 20 Züge sind die Erwartung der Kontrolle. Das Placebo bildet den **Gleichgewichts-Korb des Universums** ab; er hat vermutlich die Marktbreite, nicht die Mega-Cap-Last von SPY (Teil C.6).

### A.11 Erwartung (VORAB, aus der Belegdatei §3, ehrlich)
- **Größe nach Kosten, 2017–2026, Regel gegen SPY mit Ausschüttungen:** Spanne **−3 bis +1,5 Pp p. a., Schwerpunkt um −1 Pp** [Belegdatei §3, Urteil des Belegsammlers, **keine Messung**]. Begründung dort: Long-only-Alpha gegen den Markt 2–3 Pp/Jahr historisch **vor** Abzügen (McLean–Pontiff −26 % bis −58 % [W]);
  Mega-Cap-Jahre 2017–2026 [Q: Novy-Marx/Medhat nennen die „Magnificent Seven" als Treiber]; ein Korb, der bei GP/A hoch rangiert, enthält Mega-Caps nur teilweise [G]. Kosten dagegen klein (Umschlag ≈ 1–2 je Jahr, 0,1–0,2 Pp/Jahr bei 20 Bp je Seite [Belegdatei]).
  QUAL (ein ETF, hunderte Titel) lag 10 Jahre hinter SPY (12,41 vs 13,08 % p. a.) [W, Stichtag unklar, nur Größenordnung].
- **Wahrscheinlichkeit, dass „schlägt SPY" nach A.9 in beiden Fenstern gilt:** nach der Belegdatei 25–35 % für „schlägt SPY" über das Ganze; für die **doppelte** Bedingung (beide Fenster, 45/63, Median) eigene Überschlagsrechnung: je Fenster P(Abstand > 0) ≈ 35–40 %
  (Schwerpunkt −1 Pp, Standardfehler 2,3–3,7 Pp p. a. bei Tracking-Error 5–8 %/J. und rund 4,7 Jahren je Fenster), beide Fenster ≈ 12–15 %. Die 63 Starttage sind keine unabhängigen Beobachtungen (dieselben Jahre): 45/63 und der Median folgen fast dem Vorzeichen bei k = 0.
  **Das Kriterium wird also auch ohne jeden Effekt mit ähnlich hoher Wahrscheinlichkeit erfüllt** (unter dem Nullpunkt rund 15–25 %) — ein „schlägt SPY" wäre für sich **kein Beleg**.
- **Auflösung ist die Wand:** bei Takt 252 gibt es **je Fenster nur 4–5 Perioden** (statt ca. 19–20 beim Quartalstakt); die Periodenstreuung (Projekt: Standardfehler je Periode 3–5 Pp bei ~20 Perioden) wird hier **wesentlich schlechter** (n − 1 = 3 bis 4, t-Wert ≈ 2,8–3,2). MDE (80 %) je Fenster ≈ 6–10 Pp p. a., das 4–10-Fache der Literaturerwartung.
  Sichtbar wird ein Effekt der erwarteten Größe (≤ +1,5 Pp p. a.) mit **unter 10 %**; Positiv-Befund nur bei einem Fehler oder einem Zufallsschub.
- **Was als Fehlschlag gilt:** (i) „schlägt nicht" nach A.9 **und** Regel − Placebo ≤ 0 in mindestens einem Fenster ⇒ Fehlschlag der Regel für dieses Fenster; (ii) `zuWenig` an mehr als einem Ausführungstag, mehr als 10 % Bargeld im Mittel oder eine Zielzahl < 30 an einem Ausführungstag ⇒ **Fehlschlag der Messung** (Daten/Abdeckung), nicht der Idee; (iii) Placebo-Mittel − SPY und Regel − Placebo mit entgegengesetzten Vorzeichen (Regel besser als Placebo, aber beide hinter SPY) ⇒ „Signal ja, handelbar nein".
- **Hauptrisiko:** (1) **Auflösung** (5 Perioden, Tracking-Error 5–8 %/J.) — jede Antwort „schlägt nicht" bleibt **nicht entscheidbar**, kein „kein Effekt"; (2) **Korbform gegen SPY**: ein Gleichgewichts-Korb aus 30 Nicht-Finanzwerten gegen einen kapitalgewichteten Mega-Cap-Index; was gemessen wird, ist größtenteils der Unterschied zwischen **Korbform und Maßstab**, nicht Qualität (das Placebo fängt das ein);
  (3) **Datenabdeckung** der Umsatzkosten (laut Mehrfaktor-Studie fehlt `umsatzkosten` bei rund 30 % der Meldungen; Branchenschieflage zu Software/Pharma, wo GP/A hoch ist).
- **Was das Ergebnis NICHT sagen würde:** nichts über Novy-Marx' Long-Short-Effekt (Dezile, Kapitalgewichtung, 1963–2009); nichts über „Qualität" insgesamt (Piotroski, QMJ nicht gerechnet); nichts über eine andere Taktung, ein anderes Terzil oder eine andere Mechanik; kein Hinweis für die Zukunft; **kein** „validierte Kante" (CLAUDE.md: nur mit Protokoll-Urteil `bestaetigt` und bestandenem Placebo); und ein „schlägt SPY" wäre, wie oben, unter dem Rauschen.

### A.12 Abgrenzung zum verworfenen Mehrfaktor-Lauf — **trägt nur zum Teil, und das steht offen hier**
Der Mehrfaktor-Lauf (`studien/mehrfaktor-2026-09-22/`, Urteil „nicht entscheidbar unterhalb von IC 0,0505", IC 0,0124, t 0,69, 92 Signaltage) enthielt das Signal `ertragskraft` — und zwar **dieselbe Größe**:
`(roh.umsatz − roh.umsatzkosten) × 4 / roh.qtrs / roh.vermoegen` des jüngsten Filings (Bruttogewinn auf Jahresrate durch Vermögen), Gewicht 1 von 7 (`VORREGISTRIERUNG-KOMBINATION.md` Zeile 87). **Der Ausdruck ist inhaltlich GP/A.**
Was **neu** ist (und trägt): (a) die Größe **allein**, nicht im Mix mit Momentum, Schwankung, Bewertung, Investition, SUE, F&E; (b) das **Ergebnismaß**: Dort wurde die **Rangkorrelation (IC) der Kombination mit der nächsten Monatsrendite** gemessen, hier die **Rendite eines 30er-Korbs nach Kosten gegen SPY** — ein handelbares, vergleichbares Maß; (c) eine **12-Monats-Größe** (TTM) statt der Jahresrate des **jüngsten Quartals** (×4, saisonanfällig); (d) Finanzwerte werden ausdrücklich ausgeschlossen, Placebo gleicher Mechanik; (e) jährlicher Takt.
Was **nicht** trägt: **kein unabhängiger Beleg.** Dieselbe Größe wurde auf demselben Panel, derselben Fundamentaltafel und denselben Abdeckungslücken schon einmal gemessen, als eines von sieben Gliedern. Das Urteil jenes Laufs („nicht entscheidbar") sagt über das Einzelsignal fast nichts, die Messbedingungen bleiben aber dieselben; „nicht entscheidbar" gilt deshalb voraussichtlich auch hier (Auflösung, A.11).
Die ehrliche Erwartung steht daher oben (A.11); **Erwartung vorab: „nicht entscheidbar" oder „schlägt nicht"**; der Wert der Studie liegt im Vergleich Regel gegen Placebo, nicht im Kriterium „schlägt SPY". Wer das nicht für ausreichend abgegrenzt hält, soll die Regel nicht messen — das wird hier offen gesagt, nicht verdeckt.

## Teil B — Konstanten mit Fundstelle

| Größe | Wert | Fundstelle / Status |
|---|---|---|
| Kennzahl | (Umsatz − Umsatzkosten)/Bilanzsumme | Novy-Marx 2013, JFE 108(1) [Q, Belegdatei §1] |
| Ausschluss | SIC 6000–6999 | Novy-Marx 2013 [Q, Belegdatei §1]; SIC aus EDGAR, **aktueller** Code (nicht punktgenau) — Lesart C.2 |
| Oberes Terzil | `ceil(n/3)` | Novy-Marx 2013 Tab. 7 (500 größte Nichtfinanzwerte, Terzile) [Q, Belegdatei §1] |
| Obergrenze | 30 | Auftrag Phase 3 (Rahmen) |
| Takt | jährlich = 252 Panel-Handelstage | Novy-Marx 2013, jährlich Ende Juni [Q]; Umrechnung 4 × 63 (Projekt) |
| Mechanik | Gleichgewicht | `momentum-korb-2026-10-04/REGEL.md` §1.5, C.3; `korb.js` |
| Korbregel | Median-Tagesumsatz ≥ 100 Mio $ / 20 Balken / ≥ 100 Werte | `liquide.js` Z. 32–43 (`KORB`, `median`) |
| veraltete Reihe | > 7 Kalendertage | `mfhandel.js` Z. 52, 68 |
| Kosten | 20 Bp je Seite | `mfdepot.js` Z. 158 (nach `massstab-rueckblick`) |
| SEC-Tags | Tabelle A.3 | Namen **[G]** (Gedächtnis); die Verwendungs-Tabelle der Projektstudie `fundamental-machbarkeit-2026-09-16/FUNDAMENTALTAFEL.md` führt `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`, `SalesRevenueNet` und `CostOfRevenue`, `CostOfGoodsAndServicesSold`, `CostOfGoodsSold`, `Assets` (**gelesen**); `GrossProfit` steht dort **nicht** (unverifiziert, ob und wie oft gemeldet) |
| Karenz | 3 Kalendertage nach `filed` | **Projektkonvention, nicht aus der Literatur; unverifiziert.** Novy-Marx nimmt ≥ 6 Monate Verzug [Q]; die Gründe für kürzer: Meldungen sind mit `filed` öffentlich, 3 Tage decken Wochenende/Spätmeldung ab. Ob 3 Tage genügen, wird nicht belegt |
| Höchstalter der Bilanz | 548 Tage (18 Monate) | abgeleitet aus Novy-Marx' Jahresbildung (Bilanz Jahr t−1 für Juni t, bis zum nächsten Juni) — **abgeleitet, unverifiziert** |
| Periodentoleranz | ±10 Tage | Projektkonvention (52/53-Wochen-Jahre), unverifiziert |
| Fenster / Starttage / Startkapital | A, B / 63 / 100.000 | Auftrag Phase 3; `massstab-rueckblick-2026-10-04/REGEL.md` |
| Entscheidschwellen | beide Fenster, k = 0, ≥ 45 von 63, Median > 0 | Auftrag Phase 3 (vorab, nicht angepasst) |

**Wo ein Parameter nur aus dem Gedächtnis stammt:** SEC-Tagnamen und deren Abdeckung (`GrossProfit` bei Großwerten), die 3-Tage-Karenz, die 548-Tage-Grenze und das Aussehen von Novy-Marx' Details jenseits Belegdatei §1 (**unverifiziert**).
Der Primärtext (NBER w15940 / JFE 108(1)) wurde hier **nicht** erneut abgerufen; die Belegdatei kennzeichnet die Angaben zu Tab. 7 und zum Universum als [Q] (in der damaligen Sitzung gelesen).

## Teil C — Lesarten

1. **Referenz/ETF:** Fehlt ein Kürzel in der `rohMap` (z. B. SPY, kein Panelwert), ist es nicht zulässig; SPY ist Referenzreihe und gehört nie in die `rohMap`. ETFs haben keine SEC-Bilanz ⇒ nie zulässig (Grund „keine Bilanzdaten"). Zu wenig zulässig ⇒ `zuWenig: true`, nicht handeln.
2. **SIC:** EDGAR liefert den **heutigen** Code, nicht den am Stichtag. Ein Emittent, der später in oder aus SIC 6xxx wechselt, wird falsch eingeordnet (Gegenwartsblick, kleine Verzerrung; hier nicht behebbar). **Offener Punkt für den Leser.**
3. **TTM-Bildung bei fehlenden Teilen:** ist die jüngste Periode nicht rechenbar, gilt die nächstältere (nie eine Schätzung). Das macht den Wert zeitweise 3–12 Monate älter (auf höchstens 548 Tage begrenzt). Ein 10-K für das **laufende** Geschäftsjahr wird ab filed + 3 Tage verwendet; in den Wochen davor gilt die TTM des letzten Quartals. Bilanz von Januar (Fenster A, Stichtag 03.01.2017): in der Regel Q3 2016.
4. **Einheiten:** Die Mehrfaktor-Studie fand Meldungen mit Skalenfehlern („`vermoegen` 4.999,1 statt 4.999.100.000", 4.088 Zeilen Fremdwährung/falsche Einheit verworfen, `FUNDAMENTALTAFEL.md`). `ziel.js` prüft Einheiten **nicht**; der Leser muss **nur USD** und den vollen Betrag liefern. Eine GP/A über etwa 3 oder unter −3 ist ein Datenprüfpunkt (kein Filter, kein Parameter).
5. **Terzil/30er-Spitze:** Das Terzil bindet nie (≥ 34 ≥ 30): die 30 höchsten GP/A sind Extremwerte der Verteilung (asset-leichte Dienstleister, Software, Personalvermittler; Bilanzsumme durch Goodwill/Cash ändert die Rangfolge, [G]). Das ist **nicht** das Portfolio der Quelle. Branchenhäufung wird nicht begrenzt (kein Sektorfilter, kein Parameter hinzugefügt).
6. **Maßstab und Korbform:** SPY ist kapitalgewichtet, das Buch gleichgewichtet mit 30 Werten: in Jahren, in denen wenige Mega-Caps tragen, entsteht ein Rückstand allein aus der Korbform — das Placebo bildet ihn ab; der Unterschied Regel − Placebo ist die Aussage.
7. **Auflösung:** Die 63 Starttage teilen dieselben Jahre; die Zahl „45 von 63" ist keine unabhängige Wiederholung (A.11).
8. **Bekannte Mechanik-Mängel (Wiedervorlage Nr. 85, `wiki/belegstand.md`):** Die Mechanik der App lässt Plätze leer und erzeugt Kleinstpositionen (Gewinner werden nicht gestutzt, Neukauf `Depotwert/Zielzahl`, Erlöse reichen nicht). Diese Studie rechnet **Gleichgewicht** (A.6) und umgeht den Mangel für die Mechanik; **nicht** umgangen sind: (a) Wilhelms Entscheid vom 04.10.2026 („nur Kleinstpositionen abstellen", Kauf unter 5 % des Platzwerts nicht, Kleinstbestand gilt nicht als gehalten) — **gilt für das Momentum-Buch**, wird hier nicht nachgebildet; (b) mit Gleichgewicht fallen die Kosten je Umschichtung höher aus als bei der App (Teilverkäufe/Aufstockungen) — bei jährlichem Takt klein, wird berichtet.
9. **Placebo-Familie:** `placeboWort` = `'qualitaet-gpa-placebo-NN'` (NN = 01…20) ist **nachrichtlich**; Kennzahl der Entscheidregel ist das Hauptplacebo (ohne Suffix). Keine Auswahl unter den 20.
10. **Karenz-Test:** Bilanzdaten und Kurszeilen werden **doppelt** gegen Look-ahead gesichert (der Leser liefert nur Bekanntes; `ziel.js` filtert nach `filed + 3 Tage` und schneidet Kurszeilen > `nowMs` ab).
11. **Austausch in `korb.js`:** `zielfunktion(roh, opts)` hat dieselbe Eingabe und Rückgabe (`ziel`, `rangfolge[i].sym/umsatz/staerke`, `korb.zulaessig/geprueft`, `zuWenig`, `uebersprungen`, `verworfen`) wie `momentumZiel`. Zusätzlich liegen in `korb` Zähler (`finanz`, `ohneSic`, `ohneBilanz`, `ohneBruttogewinn`, `veraltet`, `terzil`, `zielzahl`) und in `rangfolge[i]` `gp`, `assets`, `ttmEnde`, `regel`. Der Simulator muss je Stichtag `opts.fundamental` und `opts.sic` mitgeben und die Korbwahl `korbZiel` (187 umsatzstärkste) **weglassen** — der Korb ist hier das Gesamtuniversum.
12. **Zahl der zulässigen Werte:** Erwartung (Größenordnung, nicht gemessen): 396–923 liquide Werte je Stichtag (Vorprüfung PM) × etwa 85 % Nichtfinanz × etwa 55–70 % mit rechenbarem Bruttogewinn (Mehrfaktor-Studie: 54 % im Gesamt-, 65–77 % im Großwert-Universum) ⇒ ungefähr 200–500 rangierbare Werte; die Untergrenze 100 ist mit Reserve gewahrt. Ist sie an einem Stichtag unterschritten, ist das ein **Messfehler** (A.11 ii).

## Teil D — Prüfungen (`test.js`, 120 Prüfungen, grün, ohne Abhängigkeiten)
Kunstdaten, Sollwerte von Hand: Rangfolge/GP/A, Terzil (aufrunden, 3 von 9, 4 von 10, 34 von 100) und Obergrenze 30; Finanzwerte (SIC 5999/6000/6999/7000, als String, unbekannt); Bilanz fehlt/leer/Assets ≤ 0/Text/NaN/ungültiges Datum/falsches Formular;
Look-ahead mit Gegenprobe (13.03. unsichtbar, 12.03. sichtbar, Karenz 0 sichtbar), Korrektur-Dedupe, Kurszeilen nach `nowMs`; TTM (Q1, Halbjahr, neun Monate, Jahr vor Kumulat, Vorjahr fehlt, Jahr fehlt, 52/53-Wochen-Toleranz, Toleranz überschritten, Karenz auf Teile);
alle sieben Stufen der Rückfallkette, GrossProfit-Vorrang, nie gemischt; Alter 532/624 Tage; Kursreihe (19/20 Zeilen, Lücken, 7/8 Tage, Kurs ≤ 0, 99,9999/100 Mio $, ohne Stückzahlen, Median wie `liquide.js`); Gleichstand und Eingabereihenfolge; Mindestzahl 99/100;
Placebo (deterministisch, gleiches Universum, gleiche Zielzahl, signalunabhängig, Seed am Stichtag und Wort, Gleichverteilung über 300 Tage, FNV-1a-Vergleichswert, Ausschlüsse identisch, `zuWenig`). Alle Schalter wurden einzeln ausgebaut (21 Eingriffe in `ziel.js`): jeder machte mindestens eine Prüfung rot.
