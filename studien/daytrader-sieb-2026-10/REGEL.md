# REGEL — Daytrader-Sieb (Auftrag Nr. 107, 05.10.2026)

**Siegel 1.** Diese Datei, `gemeinsam.js`, `setups.js`, `auswahl.js`, `sieb.js`, `test.js`, `werte.json` und `tage.json`
werden in **einem** Commit versiegelt, **bevor** ein Kurs eines Such- oder Bestätigungstages gelesen wird.
**Siegel 2** ist der Commit von `kandidaten.json` (aus den Suchtagen); erst danach werden die Bestätigungstage
gerechnet — `sieb.js bestaetigung` verweigert, solange `kandidaten.json` nicht committet und unverändert ist.

Das ist **kein Urteil**, sondern ein **Sieb** (Wilhelm 05.10.: Stichproben, 1m-Kerzen, fünfzig Werte aus
verschiedenen Sektoren, die vielversprechendsten Kandidaten suchen). Alles Simulation, keine Anlageberatung.

## §1 Werte

- **Grundmenge:** `markt/stammdaten.json` (SEC EDGAR: CIK, SIC), nur Aktien (`wertpapierart.js`: CS/ADRC), mit
  eigener 1m-Reihe im Archiv ohne Kürzelwechsel (`lesen.js reihen()`: kein `schnittMs`, kein `abMs`).
- **Sektor (Quelle):** SEC-SIC, gefaltet mit der Tabelle der App `stammdaten.js` in deren 11 Sektoren nach
  GICS-Vorbild (Technologie, Gesundheit, Finanzen, Immobilien, Energie, Rohstoffe, Industrie, Versorger,
  Telekommunikation, Zyklischer Konsum, Basiskonsum; „Sonstige" fällt weg). **Einzige Abweichung:** SIC 6798
  (REITs) → Immobilien, wie GICS. Die Faltung ist eine SIC-Näherung, nicht GICS selbst (bekannte Folgen: TSLA
  unter Industrie, NKE unter Rohstoffe, UNH unter Finanzen, MCD/SBUX unter Basiskonsum) — für den Zweck
  „Werte aus verschiedenen Branchen" reicht sie; eine GICS-Liste liegt offline nicht vor, ein Abruf ist verboten.
- **Umsatz am Stichtag 2022-12-30** (letzter Handelstag vor dem Suchzeitraum): Median (`sortiert[n>>1]`) von
  Schluss × Stück über die letzten 20 Yahoo-Tagesbalken bis zum Stichtag (`E:/…/archiv1d`); letzter Balken nicht
  vor 2022-12-23. Nur Werte ab **250 Mio $** (Umsatzklassen 250–1.000 und ab 1.000). Je Unternehmen (CIK) nur die
  umsatzstärkste Reihe.
- **Rundlauf:** je Sektor nach Umsatz absteigend sortiert. Runde r nimmt aus jedem Sektor den nächsten tauglichen
  Wert; innerhalb der Runde werden die Sektoren nach dem Umsatz dieses Wertes absteigend gereiht; Schluss bei 50.
- **Tauglich** (nur Vorhandensein, keine Kurse): an **jedem** der 40 Tage ≥ 80 % der Sitzungs-Minutenkerzen,
  Vortag mit Kerzen, ≥ 15 der 20 Vortage mit Kerzen (für die Umsatzklasse), kein Tag im Kapitalmaßnahmen-Fenster
  ±10 Handelstage (`lesen.js ausschlussTage`). Untauglich ⇒ der nächste desselben Sektors rückt nach.
- **Ergebnis (`werte.json`):** 50 Werte, 4 Ersetzungen (APD, BKNG, CHTR: zu wenig Kerzen an einem Tag; HON:
  Kapitalmaßnahme). Je Sektor 4–5:

| Sektor | Werte |
|---|---|
| Technologie | AAPL, NVDA, MSFT, AMD, META |
| Zyklischer Konsum | AMZN, DIS, HD, COST, WMT |
| Energie | XOM, CVX, OXY, COP, DVN |
| Finanzen | BAC, UNH, JPM, C, WFC |
| Gesundheit | MRNA, JNJ, PFE, MRK, LLY |
| Basiskonsum | PG, PEP, MCD, KO, SBUX |
| Industrie | TSLA, BA, UPS, F |
| Telekommunikation | VZ, CMCSA, T, TMUS |
| Rohstoffe | NKE, FCX, LIN, VALE |
| Versorger | NEE, D, SO, AEP |
| Immobilien | PLD, AMT, CCI, O |

Überlebensbedingung, ausgewiesen: Tauglichkeit verlangt Kerzen bis in die Bestätigungstage 2026 — die Auswahl
enthält nur Werte, die bis dahin handeln. Für ein Sieb über 40 Tage hinnehmbar; eine große Messung muss die
Verschwundenen einschließen.

## §2 Tage

Aus dem Kalender der Quelle (`alpaca1m/_kalender.json`), nur **volle** Sitzungen 09:30–16:00 ET, geseedeter
Fisher-Yates (`mulberry32`), für alle Werte dieselben Tage:

- **Suchtage:** 20 aus 2023-01-01 … 2024-12-31, Seed **20261005** (`tage.json` → `suche`).
- **Bestätigungstage:** 20 aus 2025-01-01 … 2026-08-31 (Ende des Lese-Fensters von `lesen.js`), Seed **20261006**
  (`tage.json` → `bestaetigung`). Angesehen erst nach Siegel 2.

## §3 Setups (9, feste Parameter, keine davon in der Minutenstudie)

Nicht wiederholt: RSI-Extrem, Einstieg, Reversion, Pullback, Donchian, Squeeze, Kanaltrend, Wave, Signal-Cross,
Eröffnungsspannen-Ausbruch (`orb`), VWAP-Abstand, Wendepunkt, Kapitulation. Minute = Minuten seit 09:30 ET;
„Signalkerze" ist die 1m-Kerze, nach deren Schluss entschieden wird.

| Schlüssel | Regel | Ausstieg | Quelle |
|---|---|---|---|
| `lueckenschluss` | Lücke Eröffnung 09:30 gegen Vortagesschluss 0,5–3 %, erste Minute berührt den Vortagesschluss nicht → **gegen** die Lücke; Signalkerze 09:30 | erste Kerze, deren Hoch (long) / Tief (short) den Vortagesschluss erreicht → Eröffnung der Kerze danach; sonst Schluss | verbreitete Praxis „Gap fill" |
| `gapAndGo` | Lücke ≥ 2 % und Schluss der 09:34-Kerze jenseits der 09:30-Eröffnung in Lückenrichtung → **mit** der Lücke | Schluss | verbreitete Praxis „Gap and Go" |
| `gao` | Rendite Vortagesschluss → 10:00 (Schluss der letzten Kerze bis 09:59); Vorzeichen = Richtung; Signalkerze 15:29 | Schluss | Gao, Han, Li, Zhou (2018), *Market intraday momentum*, JFE |
| `baltussen` | Rendite Vortagesschluss → 15:30 (Schluss 15:29-Kerze); Vorzeichen = Richtung | Schluss | Baltussen, Da, Lammers, Martens (2021), *Hedging demand and market intraday momentum*, JFE |
| `vortagesbruch` | erster Schluss über dem Vortageshoch (long) / unter dem Vortagestief (short), Signalkerze bis 15:00, Tageseröffnung noch nicht jenseits der Marke | Schluss | verbreitete Praxis „Previous day high/low break" |
| `volumenspitze` | Minutenvolumen ≥ 5 × Mittel der 20 Vorminuten desselben Tages und Schluss über deren Hoch (long, grüne Kerze) / unter deren Tief (short, rote Kerze); Signalkerze 09:50–15:00 | 30 Minuten | verbreitete Praxis „relative volume spike" |
| `mittagsumkehr` | Bewegung 09:30-Eröffnung → Schluss 11:59-Kerze ≥ +1 % → short, ≤ −1 % → long | 120 Minuten | verbreitete Praxis „lunchtime reversal" |
| `spyStaerke` | (Wert 09:30 → 10:29-Schluss) − (SPY dito) ≥ +1 Pp → long, ≤ −1 Pp → short | Schluss | verbreitete Praxis „relative strength vs. SPY" |
| `zehnUhrUmkehr` | Bewegung 09:30-Eröffnung → Schluss 09:59-Kerze ≥ +1 % → short, ≤ −1 % → long | 60 Minuten | verbreitete Praxis „10 o'clock reversal" |

Fest verdrahtete Uhrzeiten nehmen die **erste** Kerze im Fenster [M, M+1]; fehlt sie, kein Signal. Setups mit
Bezug auf 09:30 verlangen die 09:30-Kerze. Vortag = letzter regulärer Schluss / Hoch / Tief des vorigen
Handelstages aus den 1m-Kerzen.

## §4 Handel

- Nur reguläre 1m-Kerzen (`lesen.js`, bereinigt wo vorhanden), Tag gilt nur mit ≥ 80 % der Sollkerzen.
- **Einstieg:** Eröffnung der Folgekerze `k[i+1][5]` (wie die Minutenstudie). Ohne Folgekerze kein Handel.
- **Ausstieg** „N Minuten": Eröffnung der ersten Kerze mit Minute ≥ Einstiegsminute + N; gibt es keine, Schluss.
  „Schluss": Schlusskurs der letzten regulären Kerze.
- **Höchstens ein Handel je Wert, Setup und Tag:** das erste Signal des Tages, gleich welcher Richtung.
- **Long und Short getrennt** ausgewertet: 9 Setups × 2 Richtungen = **18 Tests**. Short braucht Leihe; die
  Hürde ist dort eine Untergrenze.
- Das Signal liest nur `k[0..i]` (und SPY-Kurse bis zur Signalzeit); `test.js` prüft das mit vergifteten Kerzen.

## §5 Kosten und Placebo

- **Kosten:** K der Umsatzklasse des Wert-Tages je Umlauf, Marktorder, Fenster `mitte` ab 2021 (`wiki/kosten.md`):
  0,0647 Pp (250–1.000 Mio $), 0,0449 Pp (ab 1.000 Mio $); fällt ein Wert-Tag in eine kleinere Klasse, gilt deren K.
  Klasse = Median von letztem Schluss × Σ Stück über die 20 Handelstage vor dem Tag (≥ 15 vorhanden), aus den
  1m-Kerzen (Minutenstudie §3). **Nachrichtlich:** netto mit Einstiegsfenster-Hürde (`konfig.js huerdeFenster`,
  Eröffnung 1,8–2,1 × teurer).
- **Placebo (Urteil) — Abweichung vom Auftragstext, vor dem Siegel:** je echtem Handel **derselbe Wert, dieselbe
  Uhrzeit** (Einstiegs- und Ausstiegsminute), dieselbe Richtung, **Mittel über die anderen 19 Tage derselben Phase**
  (Einstieg Eröffnung der ersten Kerze ab der Einstiegsminute, Ausstieg Eröffnung der ersten Kerze ab der
  Ausstiegsminute, bei „Schluss" der Schlusskurs). Erwartung, kein einzelner Zug; misst „wählt das Signal bessere
  Momente als derselbe Wert zur selben Uhrzeit sonst?" und nimmt die Tageszeit-Saisonalität heraus.
- **Grund der Abweichung:** der Auftragstext verlangt Einstiege zu **zufälligen Minuten desselben Tages**. Auf
  einem Zufallsweg ohne jede Kante (`test.js`) liegt dieses Placebo bei vier Setups mit |t| 9–14 neben dem Handel:
  Fenster **vor** dem Signal tragen die Signalbedingung (Mittagsumkehr short nach +1 % Vormittag: ein zufälliges
  Short-Fenster am Vormittag verliert, der Handel sieht dagegen gut aus). Ein Placebo nur **nach** dem Signal ist
  für die sechs Setups „bis Schluss" leer (das einzige Fenster ist der Handel selbst). Das Uhrzeit-Placebo besteht
  den Zufallsweg (|t| < 4 bei allen Setups). Das Zufallsminuten-Placebo (**50 Zufallsminuten**, geseedet je
  Wert|Tag|Setup, gleiche Haltedauer) läuft **nachrichtlich** mit, ohne Urteil.

## §6 Sieb und Bestätigung

- Je Test: Tagesmittel über alle Handel eines Tages; ausgewiesen Zahl der Handel und der Signaltage, brutto, netto,
  Placebo, Handel − Placebo, **t über Tage gebündelt** = Mittel / (sd / √Tage) der Tagesmittel von Handel − Placebo.
- **Kandidat (Siegel 2)**, wenn auf den Suchtagen: netto im Mittel > 0 **und** t ≥ 2 gegen das Placebo **und**
  mindestens 5 Signaltage.
- Bei 18 Tests ist rund ein Zufallstreffer zu erwarten (t ≥ 2 einseitig ≈ 2,5–3 % je Test bei 20 Clustern) —
  deshalb die Bestätigung.
- **Bestätigung:** nur Kandidaten, derselbe Test auf den Bestätigungstagen, gleiche Richtung, netto > 0, t ≥ 2,
  mindestens 5 Signaltage. Beides bestanden ⇒ „**vielversprechend**" (= Kandidat für eine große Messung, kein
  Beleg). Sonst „im Sieb hängen geblieben" bzw. „nicht bestätigt". Ohne Kandidaten bleiben die
  Bestätigungstage verschlossen (sie bleiben für spätere Fragen frisch).

## §7 Gesehen vor dem Siegel — vollständig

- Yahoo-Tagesumsätze Oktober–Dezember 2022 (nur als Rangfolge, in `werte.json` gerundet in Mio $).
- Je Wert und Tag die **Zahl** der regulären 1m-Kerzen der 40 Tage und ihrer Vortage (Tauglichkeit), keine Kurse.
- Drei Kerzen AAPL 2024-01-02 10:25–10:27 ET (Formatprobe der Archivdatei) — kein Suchtag.
- Nur Kunstkerzen in `test.js` (Zufallsweg, Hand-Fälle); daraus die Placebo-Abweichung in §5.
- Aus der Literatur bekannt: Gao et al. und Baltussen et al. berichten Intraday-Momentum für **Indizes** (SPY bzw. Index-Futures);
  für Einzelaktien ist das nicht ihre Aussage.

## Nachtrag 2 — PM, 05.10.2026, nach Siegel 2, vor jedem Blick auf die Bestätigungstage

(Ein Nachtrag 1 existiert nicht; die Placebo-Abweichung in §5 stand schon im ersten Siegel.) Anlass: Wilhelm
möchte, dass das Sieb nichts Vielversprechendes verliert; im Sieb bestanden 0 von 18, die Bestätigungstage
waren zu diesem Zeitpunkt nicht gelesen. Der Wortlaut von §6 bleibt stehen; ab hier gilt zusätzlich:

1. **Alle 18 Tests** werden auf den Bestätigungstagen gerechnet, unabhängig vom Sieb.
2. **„Vielversprechend"** unverändert streng, auf den Bestätigungstagen: netto > 0 **und** t ≥ 2 gegen das
   Placebo (über Tage gebündelt) **und** mindestens 5 Signaltage **und** dieselbe Richtung wie auf den
   Suchtagen (Vorzeichen von Handel − Placebo auf den Suchtagen positiv).
3. Erwartete Zufallstreffer bei 18 Prüfungen mit t ≥ 2 einseitig: **etwa 0,4** (Normalverteilung 2,3 % je
   Test; mit 19 Freiheitsgraden eher 3 % je Test, also rund 0,5). Jeder Test mit t ≥ 2 auf den
   Bestätigungstagen, der auf den Suchtagen schwach war, wird gesondert ausgewiesen als „**nur
   Bestätigungstage, braucht eine dritte Stichprobe**".

`sieb.js bestaetigung` verweigert, solange REGEL.md diesen Nachtrag nicht committet und unverändert trägt.

## §8 Was das Sieb nicht ist

Kein Urteil „belegt" und keine handelbare Kante: 20 Tage × 50 Werte, 20 Cluster je Phase, MDE wird mit
ausgewiesen. Ein „vielversprechend" heißt nur: wert, vorregistriert groß gemessen zu werden (Mühle, alle Werte
inklusive verschwundener, Tore 1 und 2).
