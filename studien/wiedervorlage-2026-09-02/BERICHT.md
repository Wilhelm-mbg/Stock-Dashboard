# Wiedervorlage 02.09.2026 — Obergrenzen fertiggestellt, Depot-Kandidatenliste

**Keine neue Messung.** Alle Zahlen stammen aus den vorhandenen Protokollen in
`studien/messmaschine/protokolle/` (identisch mit `Markt-Dashboard-Daten/protokolle/`), gelesen
mit `node tools/obergrenzen-bericht.js --md` (Rohausgabe: `obergrenzen-ausgabe.txt` in diesem
Ordner). Obere Grenze = `tagesmittel + 1,96 × se`, beides steht seit jeher im Protokoll
(Bestätigungshälfte, Überschuss gegen die A7-Kontrolle). Je Strategie-Kennung zählt nur der
jüngste Lauf.

**Hürden (aus `wiki/kosten.md`):**

| Hürde | Pp je Umlauf | Status |
|---|---|---|
| Kassa-Aktie | **~0,06** | **ANNAHME.** Kein Broker-Konto, Freigabeschwelle der Kostenmessung unerfüllt. 0,04 Spanne + 2 × Mindestkommission auf 10.000 $ Referenzposition; bei 2.000 $ wären es 0,10 Pp allein Kommission |
| CFD-Runde K (ohne Nacht) | 0,10 | gemessen für die Mrd-Klasse (Median 0,0857 / p75 0,1103), vorläufig |
| **CFD gehebelt, 1 Nacht (K+F)** | **0,1247** | K + 0,0247 Pp Finanzierung je Nacht (Capital.com-Formel) |
| Standard-Schein | 0,23 | `studien/signalstudie-2026-08/` |

Das Werkzeug rechnete bisher mit 0,04 (Aktie, nur Spanne) und 0,05 (Schein ATM). Beide sind
durch die Kostenformel vom 01.09. überholt und in dieser Sitzung ersetzt worden. Neu sind
außerdem die Spalten *je Signal* und *Tage*, das Zwischenband und eine Markdown-Ausgabe.

---

## TEIL 1 — Was die Obergrenzen ausschließen

### 1.1 Die Zählung

Der Befund vom 25.08. (`studien/OBERGRENZEN-BEFUND.md`) sagte „Erledigt: 5 von 25" bei
Hürde 0,10. Seitdem sind die Übernacht-Familie (12 Protokolle vom 01.09.) und die beiden
Winkel-Detektoren dazugekommen: **52 Varianten aus 27 Protokollen.**

| Hürde | die ursprünglichen 25 | alle 52 heute |
|---|---|---|
| 0,06 (Kassa, Annahme) | 2 geschlossen | **18 geschlossen** |
| 0,10 (CFD-Runde) | 5 geschlossen *(bestätigt die alte Zählung)* | 26 geschlossen |
| **0,1247 (CFD, 1 Nacht)** | **9 geschlossen** | **31 geschlossen, 21 offen** |
| 0,23 (Standard-Schein) | 13 | 40 |

Gegen die CFD-Hürde von 0,1247 Pp sind damit **31 von 52 Varianten erledigt** — bei ihnen
trägt selbst der optimistischste mit den Daten verträgliche Wert die Kosten nicht. Das ist
der eigentliche Zugewinn dieser Wiedervorlage: Das Urteil der Maschine lautet bei 27 dieser 31
„nicht entscheidbar" (3 „nicht bestätigt", 1 „bestätigt"); als Größenaussage heißt es bei allen
31 **„dort liegt nichts über 0,1247 Pp".**

### 1.2 Geschlossen gegen die CFD-Hürde (31) — Kandidat für „wir wissen, dass dort nichts Großes ist"

Nach oberer Grenze sortiert. Skala: Pp je Umlauf. *Tage* = Bestätigungstage.

| Strategie | V | Zeitrahmen/H | Tage | gemessen | je Signal | 95-%-Band | **obere Grenze** | auch unter 0,06? |
|---|---|---|---|---|---|---|---|---|
| `winkelbestaetigt` | 4 (S20) | 60m/8 | 360 | −0,128 | −0,124 | [−0,247, −0,010] | **−0,010** | ja |
| `nachtstoss-umkehr-n-regime` | 0 (bis 2020) | 1d/1 | 3.620 | −0,034 | −0,029 | [−0,062, −0,006] | **−0,006** | ja |
| `nachtstoss-umkehr-n` | 0 | 1d/1 | 5.039 | −0,023 | −0,015 | [−0,047, 0,000] | **0,000** | ja |
| `winkelbestaetigt` | 3 (S15) | 60m/8 | 361 | −0,088 | −0,088 | [−0,196, 0,020] | **0,020** | ja |
| `t3-stundendrift` | 0 (k=1) | 60m/1 | 365 | +0,001 | −0,001 | [−0,018, 0,021] | **0,021** | ja |
| `winkelbestaetigt` | 2 (S10) | 60m/8 | 362 | −0,087 | −0,079 | [−0,197, 0,023] | **0,023** | ja |
| `abgabedruck-nacht-t` | 0 | 1d/1 | 5.039 | −0,005 | −0,001 | [−0,038, 0,027] | **0,027** | ja |
| `abgabedruck-nacht-n` | 0 | 1d/1 | 5.039 | +0,004 | +0,001 | [−0,019, 0,027] | **0,027** | ja |
| `glockendruck-nacht-t` | 0 | 1d/1 | 5.039 | −0,003 | −0,006 | [−0,037, 0,032] | **0,032** | ja |
| `t3-stundendrift` | 1 (k=2) | 60m/1 | 365 | +0,008 | +0,005 | [−0,017, 0,033] | **0,033** | ja |
| `abgabedruck-nacht-n-regime` | 0 (bis 2020) | 1d/1 | 3.620 | +0,006 | +0,002 | [−0,023, 0,034] | **0,034** | ja |
| `abgabedruck-nacht-n-regime` | 1 (ab 2021) | 1d/1 | 1.419 | −0,000 | −0,001 | [−0,040, 0,039] | **0,039** | ja |
| `winkelgrad` | 4 (S20) | 60m/8 | 364 | −0,071 | −0,044 | [−0,186, 0,044] | **0,044** | ja |
| `nachtstoss-umkehr-n-regime` | 1 (ab 2021) | 1d/1 | 1.419 | +0,004 | +0,005 | [−0,038, 0,045] | **0,045** | ja |
| `winkelgrad` | 3 (S15) | 60m/8 | 364 | −0,063 | −0,037 | [−0,175, 0,049] | **0,049** | ja |
| `winkelgrad` | 2 (S10) | 60m/8 | 364 | −0,056 | −0,026 | [−0,169, 0,058] | **0,058** | ja |
| `winkelbestaetigt` | 1 (S05) | 60m/8 | 364 | −0,126 | −0,075 | [−0,309, 0,058] | **0,058** | ja |
| `nachtstoss-umkehr-t` | 0 | 1d/1 | 5.039 | +0,028 | +0,021 | [−0,004, 0,060] | **0,060** | *haarscharf* (0,0599) |
| `winkelbestaetigt` | 0 (S0) | 60m/8 | 364 | −0,063 | −0,070 | [−0,189, 0,063] | **0,063** | nein |
| `winkelgrad` | 1 (S05) | 60m/8 | 364 | −0,046 | −0,021 | [−0,160, 0,067] | **0,067** | nein |
| **`glockendruck-nacht-n`** | 0 | 1d/1 | 5.039 | **+0,044** | +0,042 | **[0,021, 0,068]** | **0,068** | nein — *real, aber gedeckelt* |
| `winkelgrad` | 0 (S0) | 60m/8 | 364 | −0,038 | −0,014 | [−0,154, 0,077] | **0,077** | nein |
| `rsi2seit-mcp` | 0 (MCP 90 %) | 60m/8 | 364 | +0,039 | +0,041 | [−0,005, 0,083] | **0,083** | nein |
| `rsi2seit-mcp` | 1 (MCP 75 %) | 60m/8 | 364 | +0,039 | +0,041 | [−0,006, 0,084] | **0,084** | nein |
| `glockendruck-nacht-h1l` | 0 (liquide ≥1 Mrd $) | 1d/1 | 1.975 | +0,023 | +0,037 | [−0,044, 0,091] | **0,091** | nein |
| `rsi2seit-mcp` | 2 (MCP 50 %) | 60m/8 | 364 | +0,048 | +0,046 | [−0,001, 0,097] | **0,097** | nein |
| `rsi2seit-mcp` | 3 (MCP 25 %) | 60m/8 | 364 | +0,055 | +0,053 | [0,001, 0,110] | **0,110** | nein |
| `t1-zwangsglattstellung` | 0 (k=1,5) | 60m/1 | 361 | −0,005 | −0,172 | [−0,119, 0,110] | **0,110** | nein |
| `glockendruck-nacht-h2` | 0 | 1d/2 | 5.038 | +0,060 | +0,054 | [0,007, 0,114] | **0,114** | nein |
| `rsi2seit-mcp` | 4 (MCP 10 %) | 60m/8 | 364 | +0,059 | +0,053 | [0,001, 0,118] | **0,118** | nein |
| `t1-zwangsglattstellung` | 1 (k=2) | 60m/1 | 361 | −0,010 | −0,345 | [−0,141, 0,122] | **0,122** | nein |

**Lesart je Gruppe:**

- **Die gesamte Übernacht-Familie außer glockendruck H≥3 ist gegen CFD geschlossen** — auch
  die beiden Zeitschnitte (bis 2020 / ab 2021) von abgabedruck und nachtstoss. Das Wiki sagt
  bisher „vier von vier NEIN"; die Obergrenzen sagen zusätzlich: **auch die Größe ist
  gedeckelt.** Zusammen mit den 5.039 Bestätigungstagen ist das die schärfste Aussage im Korpus.
- **glockendruck-nacht H=1 breit ist der Sonderfall:** untere Grenze 0,021 > 0 (real, t 3,71,
  „bestätigt"), obere Grenze **0,068** — die Kante ist real **und** nach oben gedeckelt. Sie liegt
  vollständig unter der CFD-Hürde und mit ihrem Punkt (+0,044) unter der Kassa-Annahme. Nur
  ihr optimistischster Rand (0,068) ragt über 0,06. Liquide (≥1 Mrd $) fällt der Punkt auf
  +0,023 (t 0,68).
- **Winkel-Detektoren (10 Varianten):** alle Punktschätzer negativ, 9 von 10 gegen CFD
  geschlossen, 7 von 10 auch gegen 0,06. Das Wiki führt sie als „Netto unentscheidbar"; als
  Größenaussage ist die Long-Seite tot.
- **rsi2seit-mcp (5 Varianten):** alle fünf gegen CFD geschlossen (obere Grenze 0,083–0,118).
  V3/V4 haben eine untere Grenze knapp über null (0,001) bei nur 364 Tagen und fünf
  Familientests — kein Beleg, aber: die Punkte (0,055 / 0,059) liegen **unter** 0,06.
- **t1-zwangsglattstellung V0/V1:** formal gegen CFD geschlossen; zusätzlich zeigt die
  B2-Warnung der Maschine, dass die *je-Signal*-Zahl deutlich negativ ist (−0,17 / −0,34 Pp).
  Dünne Tage tragen den Tagesmittel-Schätzer. Praktisch tot, unabhängig vom Band.

### 1.3 Offen gegen die CFD-Hürde (21) — hier ist „nicht entscheidbar" wirklich Unwissen

Zwei ganz verschiedene Gruppen, die man nicht in einen Topf werfen darf:

**(a) Punktschätzer ÜBER 0,1247, Band bis null oder darunter — die „schlecht gemessene" Gruppe (12):**

| Strategie | V | Zeitrahmen/H | Tage | gemessen | je Signal | 95-%-Band | obere Grenze |
|---|---|---|---|---|---|---|---|
| `momentum` | 2 (stärkste 5 %) | 1d/63 | 4.975 | +1,687 | +2,020 | [−0,890, 4,264] | 4,264 |
| `momentum` | 0 (stärkste 10 %, Live) | 1d/63 | 4.975 | +1,160 | +1,411 | [−1,053, 3,373] | 3,373 |
| `momentum` | 1 (stärkste 20 %) | 1d/63 | 4.975 | +0,576 | +0,764 | [−1,328, 2,480] | 2,480 |
| `kapitulation` | 2 (≥50 Mio $ + Regime) | 60m/26 | **98** | +1,107 | +1,071 | **[0,094, 2,120]** | 2,120 |
| `momentum` | 3 (stärkste 33 %) | 1d/63 | 4.975 | +0,277 | +0,418 | [−1,454, 2,008] | 2,008 |
| `kapitulation` | 0 (Auslöser allein) | 60m/26 | 338 | +0,545 | +0,188 | [−0,162, 1,253] | 1,253 |
| `kapitulation` | 1 (≥50 Mio $) | 60m/26 | 314 | +0,423 | +0,614 | [−0,275, 1,120] | 1,120 |
| `quartalsschub-betrag` | 1 (Verfall −5 %) | 1d/5 | 996 | +0,162 | +0,222 | [−0,293, 0,617] | 0,617 |
| `quartalsschub-betrag` | 0 (Verfall −2 %) | 1d/5 | 1.198 | +0,184 | +0,147 | [−0,205, 0,574] | 0,574 |
| `monatswende-breit` | 1 (Fenster 4) | 1d/5 | 241 | +0,155 | +0,143 | [−0,206, 0,516] | 0,516 |
| `monatsende-kauf` | 0 | 60m/8 | **17** | +0,155 | +0,110 | [−0,203, 0,513] | 0,513 |
| `monatswende-breit` | 0 (Fenster 5) | 1d/5 | 241 | +0,150 | +0,147 | [−0,206, 0,505] | 0,505 |

Hier gilt, was der Befund vom 25.08. schon sagte: Je länger die Haltedauer, desto weiter die
Grenze; die Bänder sind so breit, dass sie **nichts** ausschließen — weder eine Kante von
2 Pp noch null. Momentum ist per Wilhelms Entscheid vom 01.09. vertagt, bis Aktienkosten
gemessen sind. **Einzige Auffälligkeit: `kapitulation` V2** hat als einzige Variante der Gruppe
eine untere Grenze über null (0,094). Das ist **kein Beleg**: 98 Bestätigungstage, t 2,14 unter
der Familienschwelle (3 Tests), Urteil der Maschine „nicht bestätigt" — und die Dip-Familie ist
die Klasse, die das Überlebenden-Archiv um **−3,78 Pp je Signaltag beschönigt**
(`studien/verzerrungsrichtung-2026-08-26/ERGEBNIS.md`). Ein +1,1 Pp in einem Archiv, das diese
Klasse um −3,78 Pp schönt, ist kein Kandidat, sondern eine Warnung.

**(b) Punktschätzer UNTER 0,1247, nur die obere Grenze ragt darüber (9):**

| Strategie | V | Zeitrahmen/H | Tage | gemessen | je Signal | 95-%-Band | obere Grenze |
|---|---|---|---|---|---|---|---|
| `glockendruck-nacht-h5` | 0 | 1d/5 | 5.035 | +0,071 | +0,063 | [−0,077, 0,220] | 0,220 |
| `t2-umsatzschock` | 1 (k=5) | 60m/8 | 364 | +0,043 | **−0,059** | [−0,121, 0,207] | 0,207 |
| `glockendruck-nacht-h5l` | 0 (liquide) | 1d/5 | 1.971 | −0,100 | −0,014 | [−0,404, 0,204] | 0,204 |
| `rsi2seit` | 0 (Zeit-Ausstieg) | 60m/8 | 364 | +0,054 | **+0,021** | [−0,073, 0,182] | 0,182 |
| `t1-zwangsglattstellung` | 2 (k=2,5) | 60m/1 | 361 | +0,027 | **−0,556** | [−0,121, 0,175] | 0,175 |
| `glockendruck-nacht-h3l` | 0 (liquide) | 1d/3 | 1.973 | −0,037 | +0,005 | [−0,228, 0,154] | 0,154 |
| `glockendruck-nacht-h3` | 0 | 1d/3 | 5.037 | +0,065 | +0,058 | [−0,021, 0,151] | 0,151 |
| `t2-umsatzschock` | 0 (k=3) | 60m/8 | 364 | +0,018 | **−0,016** | [−0,103, 0,140] | 0,140 |
| `glockendruck-nacht-h2l` | 0 (liquide) | 1d/2 | 1.974 | −0,002 | +0,025 | [−0,134, 0,129] | 0,129 |

Diese neun sind **keine Kandidaten**, sondern zu grob gemessen: Die glockendruck-H≥2-Läufe
stehen laut `ERGEBNIS.md` der Haltedauer-Studie als **nicht messbar** (delta80 > K), die
60m-Läufe haben nur 364 Bestätigungstage (Archiv 730 Handelstage). Bei t1 V2 und t2 V0/V1
ist die je-Signal-Zahl **negativ** (B2-Warnung) — der positive Tagesmittel-Punkt ist ein
Dünne-Tage-Artefakt.

### 1.4 Zwei Skalen, ein Protokoll — Hinweis für das Wiki

`wiki/belegstand.md` führt `rsi2seit` mit **+0,021 Pp je Signal**. Das ist die Zahl
`ueberschuss.jeSignal` aus `rsi2seit-2026-08-26.json`. Das Tagesmittel derselben Variante ist
**+0,054** (se 0,065); nur für dieses gibt es einen Standardfehler, deshalb rechnet die
Obergrenze darauf. Beide Zahlen sind richtig und stehen im selben Protokoll; wer sie
vergleicht, muss die Skala nennen. Die Tabelle oben führt deshalb beide Spalten.

---

## TEIL 2 — Depot-Kandidatenliste

> ### ⚠ KENNZEICHNUNG
> Die **~0,06 Pp Kassa-Hürde ist eine Annahme, keine Messung.** Es gibt kein Broker-Konto;
> die Freigabeschwelle der Kostenmessung (≥20 Runden, ≥2 Tage, ≥2 Marktlagen) ist unerfüllt,
> und die vorhandenen 20 Runden stammen ausnahmslos aus der Mrd-Klasse. **Diese Liste
> begründet kein JA.** Sie beantwortet genau eine Frage: Gibt es Kandidaten, für die sich ein
> echtes Depot lohnen KÖNNTE — ja oder nein, mit Namen und Zahl?

### 2.1 Was zwischen den Hürden liegt (Punkt ≥ 0,06 und < 0,1247)

| Kandidat | Punkt (Tagesmittel) | je Signal | 95-%-Band | Urteil | Was dagegen spricht |
|---|---|---|---|---|---|
| **`glockendruck-nacht` H=2, breit** | **+0,0604** | +0,054 | [0,007, 0,114] | nicht bestätigt (t 2,22 < 2,69) | Punkt liegt **0,0004 Pp** über der Annahme; je Signal **unter** 0,06; **liquide (≥1 Mrd $) −0,002** (t −0,04); Universum-Median 69 Mio $ — genau dort ist die 0,06-Annahme am unsichersten; Dip-Seite vom Archiv **nach oben** verzerrt |
| `glockendruck-nacht` H=3, breit | +0,0651 | +0,058 | [−0,021, 0,151] | **nicht messbar** | null im Band; liquide −0,037 |
| `glockendruck-nacht` H=5, breit | +0,0712 | +0,063 | [−0,077, 0,220] | **nicht messbar** | null im Band; liquide −0,100 |

Knapp unter der unteren Hürde (nachrichtlich): `rsi2seit-mcp` V4 +0,059 / V3 +0,055 (untere
Grenze 0,001, fünf Familientests, 364 Tage) und `rsi2seit` +0,054 Tagesmittel (je Signal
+0,021). Bekannt und bestätigt: `rsi2seit` +0,021 je Signal **darunter**, `glockendruck` H=1
+0,044 **darunter** und stirbt liquide.

### 2.2 Die Antwort

> ## **NEIN.** Aus den vorhandenen Protokollen gibt es **keinen** Kandidaten, für den sich ein
> echtes Kassa-Depot rechnerisch lohnen könnte.

Begründung in drei Sätzen: **Alles, was real ist, ist zu klein** — glockendruck H=1 (+0,044,
obere Grenze 0,068) und rsi2seit (+0,021 je Signal) liegen unter der Kassa-Annahme. **Das
Einzige im Zwischenband mit unterer Grenze über null** (glockendruck H=2, +0,0604) liegt um
vier Zehntausendstel über einer Annahme, deren Unsicherheit ein Vielfaches davon beträgt,
und verschwindet in den Werten, für die Kosten überhaupt messbar sind. **Alles, was groß
sein könnte** (momentum, kapitulation, quartalsschub, monatswende), ist nicht „real-aber-klein",
sondern **ungemessen** — mit Bändern, die null einschließen, und bei kapitulation mit einer
Archiv-Verzerrung, die dreimal so groß ist wie der Punkt.

**Was ein Kassa-Depot am Bild ändern würde — und was nicht:** Es ändert nichts am
Zwischenband (leer bzw. ein Grenzfall). Es ändert die Arithmetik nur für die 63-Tage-Klasse:
Auf CFD frisst die Finanzierung ~2,2 Pp je Umlauf (90 Nächte × 0,0247), auf Kassa entfällt sie.
Das ist der Grund, warum Momentum bis zur Kostenmessung vertagt ist — diese Liste bestätigt
die Reihenfolge von Wilhelms Entscheid vom 01.09., sie verschiebt sie nicht.

### 2.3 Zusatz — Wo die kommende Kostenmessung im Paper-Konto hinmuss

Die vorhandene Messbasis (`KOSTEN-IST-2026-09-01.md`): 15 Symbole, ausnahmslos Mega-Caps,
kleinster Tagesumsatz ARM 1,6 Mrd $, Median 10 Mrd $. Werte unter ~1 Mrd $ kommen **gar nicht
vor.** Die Kandidaten-Universen sehen anders aus:

| Universum | Zulassung im Protokoll | Umsatz der Auswahl | Fundstelle |
|---|---|---|---|
| glockendruck-Quintil | Tagesumsatz ≥ 5 Mio $ (`glockendruck-nacht-n.js`) | **Median 69 Mio $**, p25 26, p75 203; **41 % in 5–50 Mio, 4,8 % ≥ 1 Mrd** | `KOSTEN-IST-2026-09-01.md` §c |
| kapitulation V1/V2 | 20-Tage-Mittel Dollarumsatz ≥ 50 Mio $ (`kapitulation.js`) | ab 50 Mio $, sonst ungefiltert | Protokoll `kapitulation-2026-08-26.json` |
| rsi2seit / rsi2seit-mcp | `universum: 'aktien'`, **keine Umsatzschranke** (MINQ 0), 2.874 Werte im 60m-Archiv | ungefiltert | Protokolle vom 26.08. |
| momentum | alle CS/ADRC, stärkstes Dezil, keine Umsatzschranke | ungefiltert | `momentum-2026-08-26.json` |

**Daraus folgt für die Spiegelung — als Anforderung, nicht als Messung:**

1. **Nach Umsatzklasse schichten, nicht nach Namensliste:** je Klasse **5–50 Mio $**,
   **50–250 Mio $**, **250 Mio–1 Mrd $** und **≥ 1 Mrd $ (Kontrolle, Anschluss an die
   Capital-Messung)** mindestens 10 Runden, insgesamt die Freigabeschwelle (≥ 20 Runden,
   ≥ 2 Tage, ≥ 2 Marktlagen). Die Klassen sind die aus der Kosten-IST-Tabelle, die dort
   mit „0 Runden, 0 Spannen" stehen.
2. **Symbole aus der tatsächlichen Signalliste ziehen**, nicht aus einer festen Liste: Die
   Protokolle speichern keine Symbole, nur Aggregate — die Namen kommen aus dem
   glockendruck-Quintil des jeweiligen Tages (unterstes Quintil des Schlussdrucks) bzw. aus
   den kapitulation-Signalen mit ≥ 50 Mio $. Gewichtet nach der gemessenen Verteilung
   (41 % der glockendruck-Auswahl in 5–50 Mio $) — sonst misst man wieder nur Mega-Caps.
3. **Eine Übernacht-Runde mitmessen:** Kauf in der Schlussauktion, Verkauf zur Folgeeröffnung
   (der Ausstieg `folgeEroeffnung` von glockendruck). Die Capital-Runden schließen sofort;
   die Kosten der Auktionsfüllung sind laut Haltedauer-Studie **ungemessen**. Ohne diese
   Runde bleibt die 0,06-Annahme für genau die Klasse ungeprüft, in der der einzige reale
   Effekt lebt.
4. **Mindestkommission gegen Positionsgröße ausweisen:** Die 0,06 gelten für 10.000 $ je
   Position; bei 2.000 $ sind es 0,10 Pp allein Kommission. Die Spiegelung muss die
   Positionsgröße protokollieren, die im Depot realistisch ist.

Wenn die Messung nur die Mrd-Klasse trifft, misst sie die Kosten eines Universums, in dem
der Effekt nicht existiert (glockendruck liquide: t 0,68). Das wäre dieselbe Falle wie am
Capital-Demo.

---

## Was in dieser Sitzung NICHT passiert ist

Keine neue Messung, kein Parameter-Sweep, keine Erträge außerhalb der Protokolle. Die
Protokolle sind unverändert. Geändert: `tools/obergrenzen-bericht.js` (Hürden aus
`wiki/kosten.md`, Spalten *je Signal*/*Tage*, Zwischenband, `--md`), dieser Bericht, das Wiki
(`belegstand.md`, `offene-auftraege.md`, `log.md`) und ein Verweis oben in
`studien/OBERGRENZEN-BEFUND.md`.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
