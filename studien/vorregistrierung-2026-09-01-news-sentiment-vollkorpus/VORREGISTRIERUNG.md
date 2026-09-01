# Vorregistrierung — News-Sentiment, Vollkorpus (Übernachtertrag)

**01.09.2026**, geschrieben **vor jedem Ertragsblick**. Rolle: Arbeitssitzung.
**Familie:** `news-sentiment-vollkorpus`, **testsGesamt = 1** — nur der Übernacht-Endpunkt
bekommt ein Urteil. Schwelle zweiseitig α = 0,05, **|t| ≥ 1,96**, kein
Multiplizitätsaufschlag, weil nur ein Test angemeldet ist.

## 0. Verhältnis zur Vorregistrierung vom 31.08.2026

`studien/vorregistrierung-2026-08-31-news-sentiment/` **bleibt unverändert stehen und wird
nicht umgedeutet.** Sie galt für einen anderen Korpus (App-eigenes RSS-Archiv, 35
Beobachtungen an 10 Zeitpunkten) und hat für diesen ihr Urteil gefällt: **„NICHT MESSBAR"**.
Dieses Urteil bleibt für jenen Korpus richtig. Hier wird eine **neue** Frage auf **anderen
Daten** registriert.

Grundlage für die Neuanlage: `studien/datentarif-2026-09-01/GRATIS-PRUEFUNG.md`, Commit
`04298ee` — die Gratisstufe liefert Nachrichten bis **2017-04-10** (binär gesucht, HTTP 200),
und die Dichte auf Großwerten beträgt **56,2 %** Score ≠ 0 gegen **3,0 %** im
Zufallsquerschnitt.

## 1. Die Frage

**Sagt der Sentiment-Score den Übernachtertrag voraus — und zwar über die Kostenhürde
hinaus?** Ein statistischer Effekt unterhalb der Kosten ist **kein JA**; die Entscheidungs­regel
in §6 verlangt beides.

## 2. Universum — Regel vorab, mit offengelegter Iteration

1. Symbol liegt in `archiv1d` (Kursquelle).
2. `WP.istAktie(sym)` — **Stammaktie**. ETF, Fonds, ADR, gehebelte/inverse Produkte raus;
   für sie meint „Sentiment" etwas anderes.
3. Existierte am Fensterstart (Kerze am oder vor 2017-04-10) mit ≥ 250 Handelstagen davor.
4. **Punkt-in-Zeit-Liquidität:** Median-Dollarumsatz der **250 Handelstage VOR dem
   Fensterstart** ≥ **0,5 Mrd $**. Gemessen am **Anfang** des Fensters, nie am Ende — sonst
   wäre die Auswahl selbst Rückschau („wer heute groß ist").
5. Die **30 größten** nach ebendieser Vorfenster-Liquidität.
6. **Mehrfachgattungen derselben Firma:** nur die liquidere Linie. *Wirksam geworden bei
   GOOGL/GOOG — GOOG gestrichen.* Zwei Gattungen sind ein Unternehmen und eine Nachricht;
   sie doppelt zu zählen täuscht Unabhängigkeit vor.

**Offengelegte Iteration:** Die Schwelle stand zuerst bei **1 Mrd $** und lieferte **nur acht**
Symbole (der Dollarumsatz war 2017 kleiner als heute) — unbrauchbar. Sie wurde auf 0,5 Mrd
gesenkt, **bevor irgendein Ertrag gegen einen Score gehalten wurde**; die Wahl hängt an der
Symbolzahl und an der Kostenbelegbarkeit, nicht am Ergebnis.

**Ergebnis (30 Werte, Rang 30 bei 0,56 Mrd $):**
AAPL AMZN META BAC MSFT GOOGL JPM BABA WFC C XOM TSLA GE NFLX T PFE JNJ INTC GILD PG DIS
CVX VZ NVDA V CSCO BKNG GS CMCSA HD

### Die Auswahl nach Größe ist selbst eine Auswahl — als Einschränkung ausgewiesen

- **Das Ergebnis gilt für liquide Großwerte, nicht für „den Markt".** Der Zufallsquerschnitt
  reißt die Schwelle nachweislich (3,0 % Dichte → Faktor 0,8, `GRATIS-PRUEFUNG.md`); es gibt
  also keine Wahl zwischen „Großwerte" und „Querschnitt", sondern nur zwischen „Großwerte"
  und „gar nicht".
- **Ein JA hier ist kein JA für kleine Werte** — dort ist die Nachrichtenlage dünner, die
  Streuung größer und die Kostenhürde höher. Übertragung ist unzulässig.
- **Überlebensauswahl:** `archiv1d` enthält nur Werte, die es heute noch gibt. Regel (3)
  verlangt zusätzlich Existenz 2016 **und** heute — also doppelte Überlebensbedingung.
  Behandlung in §7.

## 3. Anordnung

- **Beobachtung:** (Symbol, Handelstag T) mit Score ≠ 0 bei Handelsschluss T.
- **Score:** `require('../../quant.js').sentiment(fenster, nowMs)` — die **echte** Funktion,
  kein Nachbau. `nowMs` = **Handelsschluss T** (16:00 New York, Sommerzeit über
  `Q.usSommerzeit`). Ohne das würde die Frische-Gewichtung (≤ 6 h / ≤ 24 h / ≤ 48 h)
  rückwirkend etwas anderes sehen als sie live sähe.
- **Fenster:** die **12 jüngsten** Schlagzeilen mit `published_utc` ≤ Schluss T — genau so
  viele, wie `getSymbolNews()` live liefert (`depot.js`: höchstens 12 Feed-Einträge).
- **Endpunkt:** Übernachtertrag T→T+1 = Eröffnung(T+1)/Schluss(T) − 1 in Pp, aus `archiv1d`
  (Feld 5 = Eröffnung), **tagesbereinigt** (Querschnittsmittel des Tages über die 30 Werte
  abgezogen). Ohne Bereinigung misst der Querschnitt den Markttag, nicht das Symbol.
- **Primärzahl:** Steigung **b** der Regression tagesbereinigter Übernachtertrag auf Score;
  Standardfehler **je Handelstag geclustert**. Die ungeclusterte Fassung läuft nachrichtlich mit.
- **Fenster:** 2017-04-10 bis 2026-08-28, **2.360 Handelstage**.

## 4. Machbarkeit — VOR der Registrierung gerechnet

Formel `wiki/aufloesungswand.md`: **N(d) ≈ N_vorhanden · (delta80/d)²**

Rauschmaß aus `archiv1d` über das Fenster, nur Streuung, kein Zusammenhang angesehen:
**sd tagesbereinigt = 1,078 Pp** auf 70.800 Symbol-Tagen (archivweiter Wiki-Anker: 0,880 —
dieses Universum ist volatiler). Score-Streuung als Planwert **sx = 0,300** (gemessen 31.08.).
Erwartete Beobachtungen: 2.360 × 30 × 56,2 % = **39.790**.

| | MDE für b (Pp/Score-Punkt) | je 1-sd-Score-Sprung |
|---|---|---|
| ungeclustert (n = 39.790) | 0,0505 | 0,0151 Pp |
| **je Tag geclustert (2.360 Cluster)** | **0,2072** | **0,0622 Pp** |

Kostenhürden nach `wiki/kosten.md`, **H = 1 Nacht**, je Gefäß angesetzt:

| Gefäß | Hürde | b müsste ≥ | nötige Tage (geclustert) | vorhanden | Urteil |
|---|---|---|---|---|---|
| Kassa-Aktie | 0,0600 Pp | 0,200 | **2.534** | 2.360 | **knapp blind** (Faktor 1,07) |
| **CFD gehebelt** (K 0,10 + F 0,0247) | 0,1247 Pp | 0,416 | **587** | 2.360 | **auflösbar** |

> **Die Machbarkeitsprüfung ist bestanden — für die CFD-Hürde.** Auf der Aktienhürde ist die
> Anordnung *geclustert* um 7 % zu klein; ungeclustert wäre auch sie auflösbar. Deshalb steht
> die **NEIN-Seite auf der CFD-Hürde** (Praxis aus `LANDKARTE.md`), und ein NEIN gilt
> ausdrücklich **nicht** für die Aktienhürde.

## 5. Pflichtkontrollen (`wiki/messmethodik.md` B4–B6)

1. **Placebo** — Scores werden zwischen Symbol-Tagen permutiert, **Saat 20260901**, 200
   Ziehungen. Richtige Antwort **null**. Steht in **derselben Tabelle, derselben Blickzeile**
   wie der Kandidat, nie in einer Fußnote.
2. **Positivkontrolle** — dreifach, aus der Lehre vom 31.08.:
   (a) **rauschfrei** y = 0,50 · Score → muss **exakt** 0,500000 zurückkommen;
   (b) **Mittel aus 2.000 Zügen** mit Rauschen → muss 0,50 auf ±30 % treffen;
   (c) ein **Einzelzug** läuft nachrichtlich mit, **ohne Urteilskraft** — am 31.08. fiel er
   durch, obwohl das Werkzeug in Ordnung war (nur 11,5 % der Züge können treffen).
3. **Look-ahead** — für jede Beobachtung wird gezählt und geprüft, dass **kein**
   `published_utc` > Schluss T in den Score eingeht. Ein einziger Verstoß hält den Lauf an.
   *`published_utc` ist die echte Veröffentlichungszeit — das ist der Vorteil gegenüber dem
   App-Archiv, das `it.t || Date.now()` schreibt und damit teils Abrufzeiten führt.*
4. **Datenwächter** — Archiv-Wachhund auf `archiv1d` muss grün sein; Korpus nur aus
   **erschöpften** Blätterketten (ein halb geholtes Symbol sähe später aus wie
   Nachrichtenlosigkeit).

## 6. Entscheidungsregeln — vorab

- **R1 JA:** |t| ≥ 1,96 **UND** |b| · sx ≥ **0,1247 Pp** (CFD-Hürde). **Beides**, weil die
  Frage Handelbarkeit ist, nicht Signifikanz.
- **R1b „statistisch belegt, wirtschaftlich unter der Hürde":** |t| ≥ 1,96, aber |b| · sx <
  Hürde. **Das ist kein JA.** Wird als eigener, wörtlich benannter Ausgang berichtet — bei
  n ≈ 39.790 ist er der wahrscheinlichste und darf hinterher nicht zum JA umgedeutet werden.
- **R2 NEIN (kein handelbarer Effekt im Fenster):** |t| < 1,96 **UND** 90-%-Band ganz
  innerhalb ±MDE_geclustert.
- **R3 nicht entscheidbar:** sonst.
- **Vorrangregel:** Geurteilt wird auf der **geclusterten** Fassung. Die ungeclusterte ist
  nachrichtlich. Weichen beide im Urteil ab, gilt die geclusterte — festgelegt **vorab**,
  damit sich niemand hinterher die passende aussucht.

## 7. Überlebensverzerrung — Richtung vorab benannt (`wiki/ueberlebensverzerrung.md`)

Weg 3, Mitglied 2: das Archiv **untertreibt** über Nacht um **+0,0462 Pp/Tag** (t 21,39).

**Wie das hier wirkt:** Unser Endpunkt ist eine **Steigung**, keine Höhe. Ein gleichmäßiger
Niveauversatz aller Reihen **kürzt sich in einer Differenz vollständig heraus** — die
+0,0462 Pp verschieben b also **nicht**, solange sie die Verschwundenen gleichmäßig treffen.

**Was bleibt:** Falls bei den Verschwundenen der *Zusammenhang* Sentiment→Übernacht anders
ist als bei den Überlebenden, ist b verzerrt — und **diese Richtung können wir nicht messen**,
weil die Nachrichtenabdeckung Verschwundener dünn ist (FRCB: **1** Treffer, `GRATIS-PRUEFUNG.md`).
Nach `wiki/ueberlebensverzerrung.md` gilt deshalb: **ein NEIN muss die Verzerrungsrichtung
mitbedenken** — es könnte ein zu Unrecht verworfener Kandidat sein. Ein JA wäre umgekehrt
konservativ gemessen. **Nie pauschal**, hier ausdrücklich für diese Klasse festgehalten.

## 8. Sperrliste

Kein Kanten-Urteil über die registrierte Frage hinaus · keine Empfehlung zum News-Gewicht
(steht auf 0, Entscheid 31.08., `wiki/entscheide.md`) · keine Änderung an `quant.js` oder
`depot.js` aus diesem Lauf · Ergebnis nur in diesen Ordner · `massive/universum-2024-09-02.json`
wird nicht angefasst · der Schlüssel erscheint in keiner Ausgabe, keinem Log, keinem Commit,
keiner URL.

---

## Nachtrag 1 (01.09.2026, ~22:15) — das Fenster beginnt 2021-05, nicht 2017-04

**Vor jedem Ertragsblick, ausgelöst durch eine Zählung von Meldungen, nicht von Erträgen.**
Die Regel dafür stand in §5 der Quelle (`GRATIS-PRUEFUNG.md`) bereits als offene Aufgabe:
*„Abdeckungsdichte über die Jahre. Ob 2017 so dicht berichtet ist wie 2026, ist ungezählt.
Muss vorab je Jahr gezählt werden."* Jetzt gezählt (`abdeckung-zaehlen.js` → `abdeckung.json`).

**Die Wand und die Abdeckung sind zwei verschiedene Dinge.** Die News-Wand bei 2017-04-10 ist
richtig belegt — sie sagt aber nur, wo die *älteste* Meldung liegt, nicht ob dahinter genug
steht. Abdeckung (Anteil Symbol-Tage mit einer Meldung ≤ 48 h vor Schluss), 30 Werte:

| 2017 | 2018 | 2019 | 2020 | **2021** | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|
| 0,2 % | 3,7 % | 1,9 % | 7,4 % | **69,4 %** | 95,2 % | 96,6 % | 84,5 % | 72,5 % | 78,8 % |

Der Übergang ist eine Stufe, kein Anstieg: **2021-03 9,6 % → 2021-04 44,0 % → 2021-05 94,0 %.**
Das ist eine Bestandsaufnahme des Anbieters, kein Marktereignis.

**Angewandte Regel (vorab festgelegt, siehe Kopf von `abdeckung-zaehlen.js`):** Fensterstart =
erster Monat mit dauerhaft ≥ 50 % Abdeckung. **Ergebnis: 2021-05-01.** Die 50 % sind an die
Machbarkeitsrechnung gebunden (sie rechnete mit 56,2 % Dichte); ein Fenster unter der Hälfte
trüge seine eigene Annahme nicht.

**Neues Fenster: 2021-05-01 … 2026-08-28 = 1.338 Handelstage**, 40.140 Symbol-Tage, davon
**29.202 mit Score ≠ 0 = 72,8 %** — dichter als die geplanten 56,2 %.

**Machbarkeit neu gerechnet** (sd 1,078 Pp, sx 0,300):

| | vorher (2.360 Tage) | **jetzt (1.338 Tage)** |
|---|---|---|
| MDE b geclustert | 0,2072 | **0,2753** |
| nötige Tage CFD-Hürde (b ≥ 0,416) | 587 | **586 — vorhanden 1.338 ✓** |
| nötige Tage Aktienhürde (b ≥ 0,200) | 2.534 | **2.534 — vorhanden 1.338 ✗** |

> **Die Machbarkeit bleibt bestanden — für die CFD-Hürde.** Auf der Aktienhürde ist die
> Anordnung jetzt deutlicher blind als zuvor (Faktor 1,9 statt 1,07). Die Entscheidungsregeln
> aus §6 bleiben **unverändert**; nur das Fenster schrumpft.

**Was das für die Wiki-Aussage heißt:** `wiki/belegstand.md` führt „**2.367 Zeitpunkte** →
~22.600 Beobachtungen = Faktor 8,7". Die Zeitpunkte sind Handelstage, nicht Tage mit
Nachrichten. Richtig sind **1.338** nutzbare Handelstage. Die Klasse bleibt messbar, aber mit
weniger Luft als dort behauptet. Seite wird korrigiert.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
