# Nachrichten-Stimmung als Messobjekt — Machbarkeit (19.09.2026)

**Rolle:** Studien-Chat (Machbarkeit). **Auftrag:** `uebergabe/auftrag-nachrichten-stimmung-machbarkeit-2026-09-19.md`.
**Keine Schlagzeile bewertet, kein Modell aufgerufen, keine Bigdata-Anfrage.** App-Store nur als Kopie gelesen
(Kratzordner, 09:32 Uhr). Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

Belege in diesem Ordner: `lesenotizen-gdelt.md`, `lesenotizen-fnspid.md`, `lesenotizen-literatur.md` (Haiku-Leseagenten),
`archiv-zaehlung.json`, `gkg-stichprobe.json`, `fnspid-stichprobe.json`, `mde-vorpruefung.json` (+ `.log`),
`universum-je-jahr.json`. Skripte daneben (`*.js`), alle nur lesend.

---

## 0. Ergebnis in einem Blick

| Quelle | Fenster (≥ 80 % Abdeckung) | Kl. 1 | Kl. 2 | Kl. 3 | Aufwand Bewertung |
|---|---|---|---|---|---|
| **GDELT GKG 2.1** | Abdeckung **nicht belegt** (Stichprobe: AAON 0 Treffer in 30 min); Bestand ab 19.02.2015, Panel ab 2017 → 115 Monate | MDE₈₀ **0,35 Pp** | **0,58** | **1,69** | **ohne Modell** (Ton fertig) |
| **FNSPID** | Benzinga-Teil: ≥ 80 % erst **ab 2020** (Kl. 1/2), 2016–19 bei 70–78 %; Hauptteil (23 GB) aus Stichprobe nicht prüfbar → **48 Monate 2020–2023** | **0,56** | **1,02** | **2,26** | **mittel** (≈ 7 Mio Token) |
| **App-Archiv** | 17 Symbole, 40 Tage, Deckel 400 → **1 Monat** | — | — | — (17 Symbole: MDE₈₀ erst nach **94 Monaten** ≤ 2 Pp) | klein (< 0,1 Mio) |
| **Bigdata** | 876.000 Anfragen × 2,2 ≈ 1,9 Mio Einheiten gegen 885 Guthaben | — | — | — | nicht finanzierbar |

**Urteil auflösbar (MDE₈₀ ≤ Literaturgröße):** Die Literaturgröße für **21 Handelstage** ist **nicht belegt** (Tetlock 2007:
9,5 bp am Folgetag, läuft binnen einer Woche zurück — Sekundärzitat; Ke/Kelly/Xiu 2019: Zahl nicht erreichbar, PDF liegt
lokal, ohne Textwerkzeug nicht lesbar). Unter der **Arbeitsannahme 1 Pp je Monat** (Dezil gegen Universum, zu belegen):
Kl. 1 **ja** (beide Quellen), Kl. 2 **ja** bei GDELT, **knapp nein** bei FNSPID (1,02), Kl. 3 **nein** (beide).

---

## 1. Datenlage

### 1.1 App-Archiv (`store/newsarchiv_<SYM>.json`, Kopie 19.09. 09:32)

Quelle: `archiv-zaehlung.json`; Form je Datei `{stand, items: [[ms, Titel], …]}` (nicht `[…]` roh, wie der Auftrag annahm).

- **17 Dateien** (Auftrag: 18) — GOOG (24 Einträge, nur 21.08.) und XOM (12 Einträge, 19.–21.08.) sind **abgemeldete
  Reihen** (`newsArchivStand` in `depot.json`: `at 2026-09-19T07:20Z, symbole 15, mitMeldungen 15`).
- **4.530 Einträge**, 3.477 verschiedene Titel (**23 % der Titel stehen unter mehreren Symbolen** — Sammelmeldungen),
  0 Dubletten innerhalb eines Symbols. Spanne **2026-08-10 → 2026-09-19 (39,7 Tage)**.
- **Deckel 400 frisst Historie:** 7 von 17 Symbolen stehen auf 400; AAPL hält damit nur 17 Tage (23,5/Tag), NVDA 8 Tage
  (50/Tag), TSLA 17 Tage. Dünn: ARM 2,1/Tag, ASML 4,8/Tag. Mittel **6,7 Einträge je Symbol und Kalendertag**.
- **Zeitstempel:** 4.359 von 4.530 (96,2 %) mit Uhrzeit unterhalb des Tages → **Minutenstempel ja**, Leck-Klinke tragfähig.
- **Überschneidung Panel:** alle 17 im Universum 2026 (`universum-je-jahr.json`, Signaltag 2026-01-30): 16 × Klasse 3,
  ARM Klasse 2, **keins in Klasse 1**. Klassen 1–3 am 30.01.2026: 634 / 309 / 76 Symbole.
- **Befund:** ein Monat, eine Klasse, 17 Symbole — **allein für jede Querschnittsmessung unbrauchbar** (§1.4: 94 Monate nötig).

### 1.2 Freie historische Quellen

#### GDELT (GKG 2.1) — Tafel

| Feld | Befund | Beleg |
|---|---|---|
| Zeitraum laut Doku | GKG 1.0 ab 01.04.2013 (Tagesdateien); **gdeltv2 (15-min, GKG 2.0/2.1) ab 19.02.2015**; DOC-API ab 01.01.2017 | `lesenotizen-gdelt.md` §1; **Korrektur** der Notiz („2.0 ab 2013"): HEAD-Probe `gdeltv2/20150218230000.gkg.csv.zip` → 200 (10,8 MB), `20150101…` und `20130401…` → 404 |
| Abdeckung je Klasse/Jahr (≥ 80 %) | **Nein — nicht belegt.** 30 min GKG (04.08.2026 14:30–15:00 UTC, 3.071 Artikel, 2.287 mit Organisation): „apple inc" exakt **1**, „aaon" **0**. DOC-API: 5 von 7 Aufrufen trotz 7–15 s Abstand mit „limit requests to one every 5 seconds" abgewiesen; Phrase „AAON" → „specified phrase is too short" | `gkg-stichprobe.json`; Kratzordner `gdelt/doc-*.json` |
| Ticker-Zuordnung | **Nein — über Namen** (`V2EnhancedOrganizations`, Spalte 15). Fehlerquote: exakter Namensvergleich 1/1 richtig; Teilstring „apple" 2 von 3 falsch (Apple Watch, Appleton MN). DOC-API-Phrase „Apple Inc" (20 Artikel 01.–05.08.2026): **0 falsche Firma, ≈ 4 Nebenerwähnungen**, 9 von 20 nicht englisch | ebd. |
| Zeitstempel | **15 Minuten** (DATE = Crawl-Zeit `YYYYMMDDHHMMSS`); `PAGE_PUBDATE` in **0 von 3.071** Zeilen. Crawl ≥ Veröffentlichung → Klinke „Crawl vor 16:00 ET" ist die **konservative** Seite: **Minutenstempel ja** | ebd. |
| Titel | `PAGE_TITLE` in 3.065 von 3.071 (99,8 %) | ebd. |
| Ton | `V1.5Tone` Spalte 16 (Ton, Positiv, Negativ, Polarität, …), Stichprobe −17,8 … +14,0, Mittel −0,73; Wörterbuch, je Artikel | ebd.; Notiz §3 |
| Lizenz privat | **Ja** — „available for unlimited and unrestricted use for any academic, commercial, or governmental use", Zitat + Link Pflicht | Notiz §7, gdeltproject.org/about.html#termsofuse |
| Größe | 2,86 MB je 15-min-Block gezippt (19.09.2026), 2015 10,8 MB; ≈ 280 MB/Tag, ≈ 100 GB/Jahr gezippt; Stichprobe 6,9 MB zip → 21,4 MB CSV (×3) | Notiz §2/§8; HEAD-Probe |
| Abrufweg | `data.gdeltproject.org/gdeltv2/<Stempel>.gkg.csv.zip`, `masterfilelist.txt`; BigQuery `gdelt-bq.gdeltv2.gkg` (bezahlt je gelesenem Byte); DOC-API 1 Aufruf/5 s | Notiz §2 |

Schließen der Abdeckungslücke (nicht Teil dieser Machbarkeit): GKG-Vollstrom eines Jahres im Fluss filtern (Spalten 2, 15,
16, 27 behalten → Bruchteil), Firmennamen je Panel-Symbol nötig (Panel führt keine Namen; Marktkarte 1.653 Namen, Panel
7.338 Reihen). Die DOC-API scheidet für kurze Namen aus.

#### FNSPID — Tafel

| Feld | Befund | Beleg |
|---|---|---|
| Zeitraum laut Doku | 1999–2023, 15,7 Mio Zeilen, 4.775 Ticker; **37,5 % mit Ticker**; Stichprobe: `All_external.csv` 2009-04 … 2020-06, `nasdaq_exteral_data.csv` 2009-10 … 2023-12-28 | `lesenotizen-fnspid.md` §1/§2; `fnspid-stichprobe.json` |
| Abdeckung je Klasse/Jahr (≥ 80 %) | Dateien sind **nach Symbol sortiert** → Teilstück = alphabetischer Ausschnitt **A–ARAY** (333 Symbole, Benzinga-Teil, 88.609 Zeilen): Kl. 1 (36 Panel-Symbole im Bereich) **2016 70 %, 2017 73 %, 2018 75 %, 2019 71 %, 2020 (H1) 86 %**; Kl. 2 (10) 69/76/76/78/**88 %**; Kl. 3 (2–3 Symbole) nicht belastbar. **Hauptteil (23 GB, Volltext) aus 20 MB nicht prüfbar** (6 Symbole A…AAL). → Fenster **frühestens 2020–2023 = 48 Monate**; für 2017–2019 liegt der belegte Teil **unter 80 %** | `fnspid-stichprobe.json` → `abdeckungJeJahr` |
| Ticker-Zuordnung | **Ja je Zeile** (quellenseitig, nasdaq.com je Ticker). Aber Stichprobe 20 + 20: AAON **8 von 20** Sammelmeldungen („52-Week Highs", „144 Biggest Movers"), AAPL **≈ 8 von 20** Nebenerwähnungen (MoneyGram, Tesla/Musk, Sonos …) → **≈ 40 % der Zeilen tragen das Symbol nur als Liste** | ebd. `suche` |
| AAON | **enthalten** (121 Zeilen 2009–2020 im Benzinga-Teil; Klasse 1 am 03.08.2026 bestätigt: `mde-vorpruefung.json → aaon`) | ebd. |
| Zeitstempel | **Tag**: 85.456 von 88.609 (96,4 %) und 3.207 von 3.214 auf `00:00:00`; Uhrzeiten nur ab ≈ Mai 2020 und als UTC beschriftet, aber unplausibel (Analystennote 03:19 UTC) → **Minutenstempel nein**; Leck-Regel nur als Tagesregel (Datum ≤ Signaltag − 1) | ebd. `stempel` |
| Lizenz privat | **Ja** — HuggingFace-Karte CC BY-NC 4.0 (Paper nennt CC BY 4.0; Widerspruch notiert); Simulation ohne Verkauf fällt darunter | Notiz §6 |
| Größe | 5,73 GB + 23,23 GB CSV (+ 0,59 GB Kurse); **Range-Abrufe funktionieren** (2 × 20 MB geholt) | Notiz §3; Kratzordner |
| Abrufweg | `huggingface.co/datasets/Zihan1004/FNSPID/resolve/main/Stock_news/<Datei>`; datasets-server (`/filter`, `/rows`) **fällt aus** (ArrowInvalid) | Kratzordner `fnspid/aaon.json` |
| Fertiges Stimmungsmaß | nur 402.546 Zeilen für **50 Aktien** (ChatGPT 1–5) → für den Querschnitt unbrauchbar | Notiz §2/§7 |

### 1.3 Bigdata — eine Zeile

Schnellsuche `news_public` ≈ **2,2 Einheiten je Anfrage** (`wiki/chancen-karte.md`, Abschnitt Preisregeln). 7.300 Symbole
× 10 Jahre × 12 Monate = 876.000 Anfragen × 2,2 ≈ **1,93 Mio Einheiten** gegen **885 Guthaben** (0,05 %); selbst eine
Anfrage je Symbol-Jahr (73.000 × 2,2 = 160.600) ist das 181-Fache. **Nein**, keine Anfrage gestellt.

### 1.4 Vorwärts — wie lange muss das eigene Archiv wachsen?

Rechnung wie §3 (MDE₈₀ = 2,8016 · sd/√n ≤ 2 Pp ⇒ n ≥ (2,8016 · sd / 2)²), Paar-sd aus `mde-vorpruefung.json`,
Fenster 2017–2026:

| Universum | n je Monat | Dezil | Paar-sd (Pp) | Monate bis MDE₈₀ ≤ 2 Pp | bis ≤ 1 Pp |
|---|---|---|---|---|---|
| App-Liste heute (17 Symbole) | 16 | 2 | 6,90 | **94** (≈ 8 Jahre) | 374 |
| Ausbau Klasse 1 | 562 | 56 | 1,33 | **4** | 14 |
| Ausbau Klasse 2 | 185 | 18 | 2,23 | **10** | 39 |
| Ausbau Klasse 3 | 42 | 4 | 5,55 | **61** (≈ 5 Jahre) | 242 |

Voraussetzung für den Ausbau: Deckel 400 aufheben (sonst 8–17 Tage Tiefe bei aktiven Werten), Universum auf die Klassen
1–3 (≈ 1.000 Symbole 2026; Yahoo-RSS 1,2 s je Symbol → ≈ 20 min je Runde). Das Archiv würde damit **nach 4 Monaten für
Klasse 1** tragen — schneller als jeder Rückblick, aber ohne Rückblick.

---

## 2. Bewertung der Schlagzeilen — Aufwand (nur Papier)

**Volumen** (FNSPID, aus der Stichprobe): Benzinga-Teil 2020 H1 ≈ 4,3 Zeilen je Symbol und Monat (7.610 Zeilen / 333
Symbole / 5,3 Monate); Hauptteil bei liquiden Werten ≈ 9 je Monat (AA 1.525 Zeilen / 14 Jahre). Annahme **12 Schlagzeilen je
Symbol-Monat** (≈ 0,55 je Symbol-Handelstag) für ≈ 780 Symbole der Klassen 1–3:

| Fenster | Schlagzeilen | Token (15 je Titel + 60 je Bündel à 50) | Anfragen | Klasse |
|---|---|---|---|---|
| 2020–2023 (48 Mon.) | ≈ 450.000 | ≈ 7,3 Mio Eingabe (+ ≈ 1,4 Mio Ausgabe) | ≈ 9.000 | **mittel** |
| 2017–2023 (84 Mon.) | ≈ 790.000 | ≈ 12,8 Mio | ≈ 15.800 | **groß** |

- **Haiku:** 9.000 Anfragen à ≈ 800 Token. Maßstab aus `omniroute-kostenrechnung.md` §2: ≈ 343k Token je Woche
  „auslagerbar" — das 21-Fache einer Woche; als Kontingent nicht belegbar, nur in Token ausweisbar.
- **Gratis-Modell** (Deckel aus §3 der Kostenrechnung): OpenRouter 50 Anfragen/Tag → **180 Tage**, 1.000/Tag (einmalig
  10 $) → 9 Tage; Groq 30 Mio Token/Monat → **1 Monat**; Mistral 1 Mrd/Monat („nur persönliche Zwecke") → Rate offen.
- **Ohne Modell:** (a) **GDELT-Ton** liegt je Artikel vor — Kosten 0, aber Abdeckung unbelegt und Zuordnung über Namen;
  (b) **Loughran-McDonald-Wortliste**: „free for use in academic research" (sraf.nd.edu, `lesenotizen-literatur.md` §3);
  Aussagekraft: Loughran/McDonald 2011 (JF 66(1)) — fast drei Viertel der Harvard-IV-Negativwörter sind im Finanzkontext nicht
  negativ (Notiz: 73,8 %, Sekundärzitat) — d. h. **die Finanzliste, nicht Harvard-IV**. Ein Zahlenbeleg für die Vorhersagekraft
  des GDELT-Tons an Aktien wurde **nicht gefunden** (drei Arbeiten ohne sichtbare Kennziffer, Notiz §4).
- **Nicht getan:** keine Schlagzeile bewertet.

---

## 3. Vorprüfung der Auflösung (Panel v2.1, ohne Stimmung)

`mde-vorpruefung.js`: `Tafel(voll)` (Kennung `querschnitt-pruefstand-2026-09-13/panel/v2`, Stand 18.09. 12:56Z), Monats-
Signaltage `signaltage(T,'monat')` (128, 2016-01-29 … 2026-08-31), `universum(T, t, {klassen:[1,2,3]})`, je Klasse getrennt:
Universumskorb `halte()` über **21 Handelstage** gegen ein **Zufalls-Dezil** (⌈n/10⌉, Saat `nachrichten-machbarkeit-2026-09-19`,
`fnv`/`mulberry32` der Maschine, **5 Ziehungen**); daneben Zufalls-Dezil oben gegen unten (L-S) und Zufallshälften.
sd über die Monate je Ziehung, Mittel über Ziehungen; **MDE₈₀ = 2,8016 · se** (`K.MDE_FAKTOR`, Lag 1, nicht überlappend).
Erste vollständige Monate ab 2017 (`MIN_VORTAGE` 250). Klasse 3 ist vor 2020 in 32 Monaten „dünn" (< 20 Papiere) und fällt
dort heraus. Mittel der Zufallsdifferenzen liegt in allen Klassen bei ≈ 0 (Kl. 1 −0,03, Kl. 2 −0,01, Kl. 3 +0,12 Pp) — Nullpunkt stimmt.

| Klasse | Fenster | Monate | n/Monat | Dezil | Paar-sd (Pp) [min–max der Ziehungen] | **MDE₈₀ Dezil-Uni** | MDE₈₀ L-S | MDE₈₀ Hälften |
|---|---|---|---|---|---|---|---|---|
| 1 | GDELT 2017–2026 | 115 | 562 | 56 | 1,33 [1,18–1,45] | **0,35** | 0,51 | 0,23 |
| 1 | FNSPID 2020–2023 | 48 | 570 | 57 | 1,41 [1,19–1,64] | **0,56** | 0,84 | 0,38 |
| 1 | (FNSPID falls 2017–2023) | 84 | 558 | 56 | 1,27 | 0,39 | 0,59 | 0,27 |
| 2 | GDELT 2017–2026 | 115 | 185 | 18 | 2,23 [2,02–2,32] | **0,58** | 0,88 | 0,39 |
| 2 | FNSPID 2020–2023 | 48 | 191 | 19 | 2,56 [2,48–2,65] | **1,02** | 1,45 | 0,65 |
| 2 | (FNSPID falls 2017–2023) | 84 | 159 | 16 | 2,35 | 0,71 | 1,04 | 0,45 |
| 3 | GDELT 2017–2026 | 84 | 42 | 4 | 5,55 [4,95–6,36] | **1,69** | 2,44 | 1,05 |
| 3 | FNSPID 2020–2023 | 46 | 36 | 4 | 5,54 [5,07–6,57] | **2,26** | 3,41 | 1,43 |

**Literaturgröße (je Arbeit eine Zahl, Quelle in `lesenotizen-literatur.md`):**
- Tetlock 2007 (JF 62(3)): eine Standardabweichung Pessimismus → **≈ 9,5 bp** am Folgetag, „dissipates within one week" —
  **Sekundärzitat** (Wiley/SSRN 403). Für 21 Tage Haltedauer heißt das: Erwartung nahe **null**.
- Ke/Kelly/Xiu 2019 (NBER 26186): **nicht belegt** — Abklingen ≈ 5 Tage (Chicago Booth Review, Notiz §2); Sharpe/Tagesrendite
  nicht erreichbar (PDF 1,4 MB liegt in `tool-results/webfetch-…15fe0d.pdf`, ohne pdftoppm nicht lesbar).
- Folge: **das Kriterium „MDE₈₀ ≤ Literaturgröße" ist für 21 Tage nicht belegt anwendbar.** Die Literatur misst Tage, der
  Auftrag Monate. Mit der Arbeitsannahme 1 Pp je Monat (zu belegen — Wilhelms Hand, §5): Kl. 1 ja / Kl. 2 ja (GDELT), knapp
  nein (FNSPID 48 Monate) / Kl. 3 nein. Zum Vergleich: Kl. 1 löst sogar 0,4 Pp auf — jede realistische Monatsgröße.

**Placebo-Entwurf:** dieselbe Stimmungsgröße, aber jedem Signaltag die Schlagzeilen des **um +21 Handelstage verschobenen**
Fensters zugeordnet (Zukunft, die die Maschine nicht sehen darf → über `Sicht` mit Orakelschlüssel gelesen, als Placebo
deklariert) — Erwartung 0, Schranke wie T4.7 (|Mittel| < 0,5 Pp, ≤ 3 von 12 Ziehungen mit |t| ≥ 3). Zweiter Placebo:
Symbolzuordnung je Monat permutiert. **Orakel-Entwurf:** Rang nach dem Vorzeichen der künftigen 21-Tage-Rendite
(`orakelPeriode`), Δ ≥ 20 Pp je Monat, t_HH ≥ 8. **Leck-Klinke:** nur Schlagzeilen mit Stempel **vor Signaltag-Schluss**
(GDELT: Crawl ≤ 16:00 ET; App: Minutenstempel; FNSPID: nur Tagesregel möglich, Datum ≤ t − 1) — Positivkontrolle: eine
präparierte Zeile mit Stempel t + 1 muss die Klinke werfen lassen.

---

## 4. Urteil im Gitter und Empfehlung

| | auflösbar Kl. 1 | Kl. 2 | Kl. 3 | Aufwand |
|---|---|---|---|---|
| GDELT | ja (0,35) | ja (0,58) | nein (1,69) | **ohne Modell** — aber Abdeckung unbelegt, Namen statt Ticker |
| FNSPID | ja (0,56) | knapp nein (1,02) | nein (2,26) | **mittel** (7 Mio) bei 48 Monaten; groß (13 Mio) bei 84 |
| App-Archiv vorwärts | nach 4 Monaten (Ausbau) | nach 10 | nach 61 | klein |
| Bigdata | — | — | — | nicht finanzierbar |

(„auflösbar" unter der Arbeitsannahme 1 Pp je Monat; Literaturgröße für 21 Tage offen.)

**Empfehlung (drei Sätze):** Vorrang hat GDELT, weil das Ton-Maß fertig ist (kein Modell, Lizenz frei, Minutenstempel) und
Klasse 1/2 mit 0,35/0,58 Pp auflösen würde — aber erst nach einer **Abdeckungsprobe** (ein GKG-Jahr im Fluss gegen eine
Namensliste der Panel-Klassen; Kosten 0, ≈ 100 GB Durchsatz), weil die 30-Minuten-Stichprobe AAON gar nicht und Apple nur
einmal fand. FNSPID ist die Rückfalloption mit Ticker je Zeile, aber nur Tagesstempeln, ≈ 40 % Sammelmeldungen und einem
belegten Fenster erst ab 2020; ihr Bewertungsaufwand (≈ 7 Mio Token) lohnt nur, wenn GDELT an der Abdeckung scheitert.
Parallel sollte das App-Archiv **jetzt** ausgebaut werden (Deckel 400 weg, Klassen 1–3), weil es nach 4 Monaten die
einzige Quelle mit Minutenstempel **und** Ticker wäre.

---

## 5. Was Wilhelms Hand braucht (Entscheide, nichts davon registriert)

1. **Literaturgröße für 21 Tage:** Ke/Kelly/Xiu-PDF öffnen (liegt lokal) und die L-S-Zahl nachschlagen — oder die Vorregistrierung
   auf **5 Handelstage** legen, wo die Literatur misst (Kosten: Kassa-Hürde je Umlauf 0,045–0,157 Pp, `spannen-studie`).
2. **Quelle:** GDELT-Abdeckungsprobe freigeben (Namensliste nötig; Panel führt keine Namen) — oder direkt FNSPID (2 × 20 MB
   Range-Abrufe funktionieren; Vollabruf 29 GB, nur drei Spalten behalten).
3. **Bewertung:** Haiku oder Anbieter hinter OmniRoute — erst nach 2.; bei GDELT entfällt die Frage.
4. **App-Archiv:** Deckel 400 aufheben und Universum auf die Klassen 1–3 erweitern (Eingriff in `depot.js`, nicht Teil dieser Studie).

---

## 6. Entwurf der Vorregistrierungs-Gliederung (nicht registriert)

- **V0 Frage:** Trägt die Nachrichten-Stimmung der letzten 21 Handelstage einen Querschnitts-Überschuss über die nächsten 21
  Handelstage, je Klasse 1/2/3 getrennt?
- **V1 Größen:** je Symbol-Monat `stimmung` = Mittel des Ton-/Bewertungsmaßes über alle zugeordneten Schlagzeilen mit Stempel
  vor Signaltag-Schluss (GDELT: `V1.5Tone[0]`; Modell: Skala −1/0/+1; Wortliste: (pos−neg)/Wörter); `anzahl` als Nebengröße;
  Symbole ohne Schlagzeile fallen aus dem Rang (Anteil ausweisen, Tor V3).
- **V2 Rang und Portfolio:** Dezil oben gegen Universum (Hauptzahl) und oben gegen unten (nachrichtlich), gleichgewichtet,
  `halte()` 21 Tage, Kosten je Umschlag aus `umschlagKosten`, Klassen getrennt, nie gepoolt.
- **V3 Tore vor der Messung:** (a) Abdeckung ≥ 80 % je Klasse im Fenster, sonst Klasse „nicht messbar"; (b) Reproduktion dieser
  Vorprüfung (Paar-sd je Klasse innerhalb Faktor 1,5 von 1,33 / 2,23 / 5,55); (c) Tor 1: Entdeckung ≥ 4 × Bestätigungs-MDE;
  (d) Leck-Klinke mit Positivkontrolle; (e) Sammelmeldungs-Regel vorab (Schlagzeile mit > k Symbolen zählt nicht) — k vorab fest.
- **V4 Statistik:** Monatsreihe, Hansen-Hodrick Lag 1, MDE₈₀ = 2,8016 · se, Bonferroni über 3 Klassen × 1 Hauptzahl
  (z_Bonf(3)); Entdeckung/Bestätigung an getrennten Monaten (gerade/ungerade Jahre), Testzahl ausweisen.
- **V5 Kontrollen:** Placebo +21 Tage (12 Ziehungen), Placebo Permutation, Orakel (Δ ≥ 20 Pp), kursloses Signal (Soll null).
- **V6 Urteil vorab:** „belegt" nur bei Δ̄_netto ≥ MDE₈₀ und t_HH ≥ z_Bonf und Placebos bestanden; sonst „nichts oberhalb von
  <MDE₈₀> Pp je Monat", nie „kein Effekt".
- **V7 Was die Tafel nicht weiß:** Übersetzungston (GDELT: 9 von 20 Artikeln nicht englisch), Nebenerwähnungen, Zeitzonen der
  FNSPID-Stempel, Überlebensverzerrung der Quelle (FNSPID: 4.775 Ticker, Auswahl undokumentiert).

---

*Verbrauch: siehe Übergabe. Leseagenten (Haiku): GDELT 66.930, FNSPID 80.041, Literatur 80.567 Token.*

---

## 7. Gegenprobe des PM (19.09.2026) — die MDE aus Zufallsdezilen ist ein Boden, kein Maß

**Nachgerechnet** (`pm-mde-boden.js`, Kratzordner; eigene Ziehung, monatliche Signaltage ab 2017, 21 Handelstage, Panel v2.1):
Paar-sd Zufallsdezil gegen Universum Klasse 1 **1,44 Pp** (Chat 1,33), Klasse 2 **2,33** (2,23), Klassen 1–3 gepoolt 1,20;
MDE₈₀ Klasse 1 **0,37 Pp** (Chat 0,35), Klasse 2 **0,60** (0,58), gepoolt 0,31; Klasse 3 nur 23 Monate mit ≥ 50 Papieren
→ 2,84 (Chat 1,69 über 84 dünnere Monate). **Die Zahlen des Chats sind reproduziert.**

**Aber:** ein Zufallsdezil hat keine Faktorneigung. Ein echtes Dezil hat sie — und darum eine viel größere Streuung. Beleg aus
unseren eigenen Messungen: das Momentum-Dezil aus Teil 3 (Klassen 1–3, dieselben 21 Tage, dieselben Monate) hat gegen das
Universum eine realisierte **se von 0,49 Pp** (Δ +1,10, t 2,23, n 115, Panel v2.1) — gegen den Zufallsboden 0,112 Pp ein
**Faktor 4,45**. Ein Stimmungsdezil ist vermutlich weniger geballt als Momentum (Faktor eher 2–4), aber kein Zufallsdezil.
Realistische MDE₈₀ je Monat also: **Klasse 1 ≈ 0,8–1,6 Pp, Klasse 2 ≈ 1,2–2,7 Pp, Klasse 3 > 5 Pp.** Gegen die Arbeitsannahme
1 Pp je Monat ist damit **keine Klasse sicher auflösbar** — das Gitter in §4 gilt nur für den Boden.

**Und das Entscheidende steht in §3 selbst:** die Literatur misst Tage. Tetlock 2007 (≈ 9,5 bp am Folgetag, verschwindet
innerhalb einer Woche) und Ke/Kelly/Xiu 2019 (Abklingen ≈ 5 Tage) beschreiben ein **Signal mit Tagen Halbwertszeit**. Eine
monatliche Querschnittsmessung mit 21 Tagen Haltedauer misst davon fast nichts — erwartete Größe nahe null, egal wie fein die
Auflösung. Das richtige Instrument wäre eine **Tages- bis Wochenmessung (1–5 Handelstage)** mit der gemessenen Kassa-Hürde
je Umlauf (0,157 / 0,085 / 0,065 / 0,045 Pp) — also genau das Feld, in dem die Minutenstudien und Trendwende II nichts über
den Kosten fanden, nur mit einer anderen Signalfamilie (Text statt Kurs). Ob dort etwas bleibt, sagt erst eine
Vorregistrierung mit Kostenprüfung **vor** dem Urteil; die Ke/Kelly/Xiu-Zahl (Tagesrendite des Long-Short) ist dafür die
Messlatte und noch nicht belegt (PDF liegt lokal, `pdftoppm` fehlt — Wilhelms Hand oder Zweitquelle).

**Was von der Machbarkeit unabhängig vom Design steht:** (1) das eigene Archiv trägt heute nichts (17 Symbole, keins in
Klasse 1, Deckel 400 frisst Historie) — der Ausbau ist ein **Datenschritt**, der jedem Design dient; (2) GDELT ist die einzige
freie Quelle mit Minutenstempel und Ton-Maß, aber ohne Ticker — die Abdeckungsprobe ist der nächste sinnvolle Schritt, die
Namensliste gibt es (EDGAR `company_tickers.json`, Stammdaten der App); (3) FNSPID nur Tagesstempel → für ein Tagesdesign
unbrauchbar (Leck), für ein Monatsdesign zu wenig Fenster; (4) Bigdata nicht finanzierbar.

**Verbrauch laut Abrechnung:** Studien-Chat 248k (Selbstschätzung 95k, Faktor 2,6) + Haiku-Leseagenten 228k.
