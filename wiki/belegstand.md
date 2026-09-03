# Belegstand

> ## **Belegte handelbare Kanten: NULL.**
> Stand 03.09.2026. Das ist seit Wochen der Stand und er ist ehrlich.
> **Neu seit 02.09.:** Für **31 von 52** gemessenen Varianten ist zusätzlich die **Größe
> ausgeschlossen** — obere 95-%-Grenze unter der CFD-Hürde 0,1247 Pp. Siehe Abschnitt
> „Größen-Ausschlüsse" unten.
> **Neu am 03.09.:** Die Kassa-Hürde ist **gemessen** statt angenommen (55.455 Zeitpunkte,
> [kosten.md](kosten.md)) — und sie ist **klassenspezifisch, Faktor 3,5 zwischen den
> Klassen**. Von den 31 sind damit **2 wieder offen** (beide glockendruck, belegte Klasse),
> 14 endgültig zu, 15 unentschieden mangels belegter Klasse. **„Wieder offen" ist eine
> Größenaussage, kein Ertragsbeleg** — die Zahl der belegten Kanten bleibt **NULL**.

## Widerlegt (gemessen tot)

| Sache | Zahl | Fundstelle |
|---|---|---|
| **News-Sentiment (Übernacht, Großwerte)** | **b = +0,0070 Pp/Score-Punkt, t = 0,31** — mitten im Placebo-Band. Selbst die Obergrenze des 90-%-Bandes liegt **Faktor 8,5 unter der CFD-Hürde** (und 4,1 unter der Aktienhürde). 33.307 Beobachtungen, 1.338 Tages-Cluster, 233.625 Meldungen. **Gilt für überlebende Großwerte über Nacht mit der Scorer-Funktion aus `quant.js` — nicht für Nebenwerte, andere Fenster oder andere Scorer.** | `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md` |
| Stunden-Strategie (Technik-Score) | **t = −11,6** — Kontraindikator, nicht nur wirkungslos | Gedächtnisprotokoll + `#hourlyEnabled` steht in der App als „widerlegt – abgeschaltet" |
| glockendruck-nacht | **Effekt stirbt in liquiden Werten** (≥1 Mrd $: H=1 +0,023 Pp, t 0,68). *Ergänzt 02.09.:* breit H=1 ist **real und gedeckelt** — Band [0,021, **0,068**] Pp, liegt vollständig unter der CFD-Hürde | `studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/`, Commit `6263f1b` · Obergrenze: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 |
| nachtstoss-umkehr | Gegenrichtung; Richtungssäule von den eigenen Autoren zurückgenommen | `studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/ERGEBNIS.md` |
| abgabedruck-nacht | — | `studien/vorregistrierung-2026-08-27-abgabedruck-nacht/ERGEBNIS.md` |
| Supertrend-Regelwerk | EMA-/RSI-Filter tragen null, halbieren aber die Signale | `studien/63-supertrend/` |
| Abschnittskanäle **als Bedingung** | −0,17 Pp, t = −4,1 → nur Anzeige | Gedächtnisprotokoll |
| Monatswende | war Marktzeitgeschäft, nicht Saisonalität | Gedächtnisprotokoll |
| Krypto-Dip-Modi, Bullenflagge | verlieren bzw. widerlegt | Gedächtnisprotokoll |
| Große Signalstudie | **0 von 51 Detektoren bestätigt**, 3.372 Tests | `studien/signalstudie-2026-08/` |

**Die Übernacht-Familie ist komplett durchgemessen: vier von vier NEIN.** *Ergänzt 02.09.:* und
**die Größe ist gedeckelt** — alle H=1-Varianten (abgabedruck, nachtstoss, glockendruck; breit,
Zeitschnitte bis 2020 / ab 2021, liquide) haben obere Grenzen zwischen −0,010 und 0,091 Pp,
also unter der CFD-Hürde; nur glockendruck H≥3 ist zu grob gemessen („nicht messbar").
*Fundstelle: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2*

## Nicht entscheidbar (ruht — weder belegt noch widerlegt)

| Sache | Zahl | Fundstelle |
|---|---|---|
| `rsi2seit` (RSI2 im Seitwärtskanal) | Überschuss **+0,021 Pp je Signal**, real, unter jeder Beweisschwelle. *Ergänzt 02.09.:* dieselbe Variante hat ein **Tagesmittel +0,054** (se 0,065, Band [−0,073, 0,182]) — zwei Skalen aus einem Protokoll, nur das Tagesmittel hat einen Standardfehler. **Mit MCP-Stop (5 Varianten): alle obere Grenzen 0,083–0,118 Pp → gegen CFD geschlossen**, Punkte 0,039–0,059 unter der Kassa-Annahme | `studien/messmaschine/protokolle/rsi2seit-2026-08-26.json`, `rsi2seit-mcp-2026-08-26.json` · `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2/§1.4 |
| **Momentum-Buch (Monats-Momentum, H=63)** | t fiel von 4,74 auf **0,74** nach Korrektur. *Ergänzt 02.09.:* obere Grenzen **2,0–4,3 Pp**, untere −0,9 bis −1,5 — das Band schließt **nichts** aus. ~~Vertagt bis Aktienkosten gemessen (Entscheid 01.09.)~~ **GEMESSEN 02.09. (Auftrag, nicht überlappend, 79 unabhängige Perioden): „nicht entscheidbar" am CFD-Gefäß.** Brutto **+1,541 Pp je Umlauf** (se 0,732, t 2,10), CFD-Hürde K + F·91,5 Nächte = 2,370 → **netto −0,829 (t −1,13)**; **Obergrenze netto +0,605 Pp je Umlauf**; ein NEIN bräuchte ~60 Jahre. Netto CFD in **allen 63 Rasterlagen negativ**. Kassa-Zeile (**Annahme 0,06**, nachrichtlich): netto +1,481, t 2,02 — unter der Familienschwelle 2,576, In-Sample, **18 % des Korbs unter 5 Mio $ Umsatz, nur 2,6 % über 1 Mrd $** → kein Urteil. Placebo +0,23 (t 1,12), Positivkontrolle 1,0000. Überlebensverzerrung: Weg-3-Wert **nicht übertragbar** (63-Tage-Vorzeichen negativ, Korb-Δ gemischt). *Ergänzt 02.09., liquide Fassung (Korb nur ≥ 100 Mio $ Median-Tagesumsatz, Punkt-in-Zeit, 40 von 400 Werten):* **„LEBT" nach registrierter Regel — In-Sample und am Rand.** Brutto **+1,835 Pp je Umlauf** (se 0,911, t 2,02, 79 Perioden, 1 Test), Band **[+0,050, +3,620]**; gepaart liquide − breit **+0,29 (t 0,69)** — der liquide Korb ist **nicht schwächer** als der breite, die glockendruck-Lehre gilt hier nicht. Etiketten: untere Grenze 0,05 über null; bei Familienschwelle 2,638 schließt das Band null ein; LEBT-Regel in **18 von 63 Rasterlagen**; ohne 2020er +0,40 Pp (54 Perioden). **Kein „belegt".** Gefäße nachrichtlich: CFD netto −0,535 (Obergrenze netto +1,25), Kassa (**Annahme**) netto +1,775, t 1,95 — Liquiditäts-Vorbehalt weg, In-Sample und Annahme bleiben, kein Urteil. Placebo +0,24 (t 0,74), Positivkontrolle 1,0000, W0 exakt. **Buch seit 02.09.2026 auf liquidem Korb — ab hier Out-of-Sample** (Wilhelms Entscheid 02.09.): das App-Buch rechnet exakt die gemessene Konfiguration (231/21/63, stärkste 10 %, Korb nur Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken, Punkt-in-Zeit, mindestens 100 Werte; Schwelle nominal, Drift nachrichtlich als Korbgröße je Umschichtung). Umstellung greift bei der nächsten regulären Umschichtung und steht als Handlung im Journal; die erste Umschichtung auf dem Korb datiert das Buch selbst (»Vorwärtstest seit«). Sperrklinke test-v6 Block 34: Fenster und Korbregel gegen `lauf-2026-09-01-22-52.json`, Äquivalenz zum Studienwerkzeug auf Kunst- und Archivdaten (Symbolmengen). Bekannte Abweichung: Universum des Buchs 193 Werte (Studie 2.213) | `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md` · liquide: `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md` · älter: `studien/momentum-nichtueberlappend/`, `studien/OBERGRENZEN-BEFUND.md`, `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.3a |
| Ergebnis-Drift-Buch | t 1,7–2,0 nach Zeitzonen-Korrektur | Protokolle im Datenordner |
| Trendwende-/Winkel-Detektor | Netto unentscheidbar. *Ergänzt 02.09.:* in der Maschine (winkelbestaetigt/winkelgrad, je 5 Schwellen) **alle 10 Punktschätzer negativ**, 9 von 10 obere Grenzen unter 0,1247 Pp — die Long-Seite ist als Größe ausgeschlossen | `studien/33-winkel-detektor/` · `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 |
| `kapitulation` (Kapitulations-Dip, 60m, H=26) | V2 (≥50 Mio $ + Regime) **+1,107 Pp**, Band [0,094, 2,120], aber nur **98 Bestätigungstage**, t 2,14 unter Familienschwelle, Urteil „nicht bestätigt"; V0/V1 Bänder schließen null ein. **Dip-Familie wird vom Archiv um −3,78 Pp je Signaltag beschönigt** — der Punkt ist eher zu hoch | `studien/messmaschine/protokolle/kapitulation-2026-08-26.json`, `studien/verzerrungsrichtung-2026-08-26/ERGEBNIS.md` · `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.3a |

## Größen-Ausschlüsse (Obergrenzen, Stand 02.09.2026)

„Nicht entscheidbar" ist eine Nicht-Aussage. Die obere 95-%-Grenze (`tagesmittel + 1,96 × se`,
beides im Protokoll) macht daraus eine Größenaussage: **„dort liegt nichts über X."** Keine
neue Messung — nur vorhandene Protokolle neu gelesen mit `tools/obergrenzen-bericht.js`.

| Hürde | geschlossen von 52 Varianten |
|---|---|
| ~~0,06 Pp (Kassa-Aktie, **Annahme**)~~ | ~~18~~ — **überholt 03.09.**: die Kassa-Hürde ist gemessen und liegt je Klasse bei 0,0449 bis 0,1569 Pp, siehe [kosten.md](kosten.md) und den Abschnitt darunter |
| 0,10 Pp (CFD-Runde ohne Nacht) | 26 |
| **0,1247 Pp (CFD gehebelt, 1 Nacht)** | **31** — 21 offen |
| 0,23 Pp (Standard-Schein) | 40 |

**Die 21 Offenen sind zwei Gruppen:** (a) 12 mit Punkt über der Hürde und Band bis unter null —
momentum, kapitulation, quartalsschub, monatswende, monatsende: **ungemessen, nicht
„vielversprechend"**; (b) 9 mit Punkt unter der Hürde, nur der Rand ragt darüber — glockendruck
H≥2, rsi2seit Zeit-Ausstieg, t1/t2: **zu grob gemessen**, bei t1 V2 und t2 ist die je-Signal-Zahl
sogar negativ (B2). *Fundstelle: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.3*

### Wiedervorlage an der **gemessenen** Kassa-Hürde (03.09.2026)

Die 31 gegen die CFD-Hürde 0,1247 Pp geschlossenen Varianten, gehalten gegen die am
03.09.2026 gemessene Kassa-Hürde **ihrer Umsatzklasse** statt gegen eine Annahme.
*Fundstelle: `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md` §5 ·
Obergrenzen aus `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 · Hürden in
[kosten.md](kosten.md).*

> **„Wieder offen" heißt: obere Grenze > Kassa-Hürde ihrer Klasse.** Das ist eine
> **Größenaussage, kein Ertragsbeleg** — eine wieder offene Variante ist nicht besser
> geworden, sie ist nur nicht mehr durch die Kosten erledigt. **Belegt ist keine davon.**

**Zuordnung, Regel vor dem Lauf (Registrierung §8):** Die Protokolle führen die Liquidität
ihres Universums nicht (geprüft an `glockendruck-nacht-n-2026-09-01.json`). Wo der Bericht
sie ausdrücklich belegt, steht sie; sonst wird gegen **alle vier** Hürden ausgewiesen und das
Universum als *unbekannt* markiert. **Es wird nicht geraten und nicht die günstigste Klasse
gewählt.** Belegt sind nur zwei Fundstellen: glockendruck breit → Universum-Median 69 Mio $
→ Klasse 50-250; die `*l`-Varianten → ausdrücklich „liquide ≥ 1 Mrd $" → Klasse ab1000.

Verwendete Hürden (Fenster `mitte`, ab 2021): 5-50 = **0,1569** · 50-250 = **0,0854** ·
250-1000 = **0,0647** · ab1000 = **0,0449** Pp.

| Strategie | V | obere Grenze | Universum | offen gegen 5-50 | 50-250 | 250-1000 | ab1000 | Urteil |
|---|---|---|---|---|---|---|---|---|
| `t1-zwangsglattstellung` | 1 (k=2) | 0,1220 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `rsi2seit-mcp` | 4 (MCP 10 %) | 0,1180 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `glockendruck-nacht-h2` | 0 | 0,1140 | 50-250 | nein | ja | ja | ja | **wieder offen** (50-250) |
| `rsi2seit-mcp` | 3 (MCP 25 %) | 0,1100 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `t1-zwangsglattstellung` | 0 (k=1,5) | 0,1100 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `rsi2seit-mcp` | 2 (MCP 50 %) | 0,0970 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `glockendruck-nacht-h1l` | 0 (liquide) | 0,0910 | ab1000 | nein | ja | ja | ja | **wieder offen** (ab1000) |
| `rsi2seit-mcp` | 1 (MCP 75 %) | 0,0840 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `rsi2seit-mcp` | 0 (MCP 90 %) | 0,0830 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `winkelgrad` | 0 (S0) | 0,0770 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `glockendruck-nacht-n` | 0 | 0,0680 | 50-250 | nein | nein | ja | ja | **endgültig zu** (50-250) |
| `winkelgrad` | 1 (S05) | 0,0670 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `winkelbestaetigt` | 0 (S0) | 0,0630 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `nachtstoss-umkehr-t` | 0 | 0,0599 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `winkelgrad` | 2 (S10) | 0,0580 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `winkelbestaetigt` | 1 (S05) | 0,0580 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `winkelgrad` | 3 (S15) | 0,0490 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `nachtstoss-umkehr-n-regime` | 1 (ab 2021) | 0,0450 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `winkelgrad` | 4 (S20) | 0,0440 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `abgabedruck-nacht-n-regime` | 1 (ab 2021) | 0,0390 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `abgabedruck-nacht-n-regime` | 0 (bis 2020) | 0,0340 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `t3-stundendrift` | 1 (k=2) | 0,0330 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `glockendruck-nacht-t` | 0 | 0,0320 | 50-250 | nein | nein | nein | nein | **endgültig zu** (50-250) |
| `abgabedruck-nacht-t` | 0 | 0,0270 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `abgabedruck-nacht-n` | 0 | 0,0270 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `winkelbestaetigt` | 2 (S10) | 0,0230 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `t3-stundendrift` | 0 (k=1) | 0,0210 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `winkelbestaetigt` | 3 (S15) | 0,0200 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `nachtstoss-umkehr-n` | 0 | 0,0000 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `nachtstoss-umkehr-n-regime` | 0 (bis 2020) | -0,0060 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `winkelbestaetigt` | 4 (S20) | -0,0100 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |

**Zählung (wörtlich aus `ERGEBNIS.md` §5):** von den **4 Varianten mit belegtem Universum**
sind **2 wieder offen** (`glockendruck-nacht-h2`, 0,1140 gegen 0,0854 in 50-250;
`glockendruck-nacht-h1l`, 0,0910 gegen 0,0449 in ab1000), **2 endgültig zu**
(`glockendruck-nacht-n` 0,0680 und `glockendruck-nacht-t` 0,0320, beide 50-250).
Von den **27 mit unbekanntem Universum** sind **12 in jeder Klasse zu** — das ist das robuste
Teilergebnis —, **0 in jeder Klasse offen**, und **15 hängen daran, wo ihr Universum liegt**.

**Also: 2 offen, 14 zu, 15 unentschieden, weil die Klasse unbekannt ist.** Keine der 15
bekommt hier ein Urteil, und keine wird der günstigsten Klasse zugeschlagen.

> **⚠ Der Cent-Boden-Vorbehalt gilt auch hier** (Registrierung §9a): für die liquiden Klassen
> ist „die Hürde der Umsatzklasse" **keine Liquiditätsaussage**, sondern zu einem großen Teil
> eine Aussage über den Aktienkurs. Eine Variante, die gegen `ab1000` wieder offen ist, ist es
> auf teuren Aktien; auf billigen nicht. Siehe [kosten.md](kosten.md).

> **⚠ Die Übernacht-Familie steht hier gegen die MITTAGS-Hürde.** `ERGEBNIS.md` §5 setzt für
> alle 31 Varianten die `mitte`-Hürden ein, auch für die `*-nacht-*`- und
> `nachtstoss-umkehr-*`-Zeilen. Registrierung §8 gibt der Übernacht-Familie ihre Hürde
> dagegen im **Schlussfenster**. Zusatz B liefert dafür keinen Ersatz: der dort gemessene
> Abstand Schlussauktion → Folgeeröffnung (Median **0,486 Pp**) ist nach `ERGEBNIS.md` §6
> ausdrücklich **keine Kostengröße**, sondern die Größe des Übernachtsprungs. Die
> Schlussfenster-Hürden sind gemessen (5-50 0,0868 · 50-250 0,0433 · 250-1000 0,0359 ·
> ab1000 0,0317 Pp, alle Jahre gepoolt, ohne Band), aber `ERGEBNIS.md` weist sie **nicht je
> Regime** aus und wendet sie nicht auf die Varianten an. **Die Übernacht-Zeilen der Tabelle
> sind damit gegen die falsche Hürde gehalten; sie werden hier nicht nachgerechnet, sondern
> als offener Punkt ausgewiesen** ([offene-auftraege.md](offene-auftraege.md)). Richtung:
> das Schlussfenster ist in jeder Klasse **günstiger** als das Mittagsfenster, es würden also
> eher mehr Varianten „wieder offen" als weniger.

### Depot-Kandidatenliste — Antwort: **NEIN**

> ⚠ ~~**Die ~0,06 Pp Kassa-Hürde ist eine ANNAHME**~~ **Überholt 03.09.2026: die Kassa-Hürde
> ist gemessen** und klassenspezifisch (0,0449 bis 0,1569 Pp, [kosten.md](kosten.md)). Die
> Rechnung dieses Abschnitts steht noch gegen die alte Annahme 0,06 und ist **nicht** gegen
> die gemessenen Hürden neu aufgestellt worden — das wäre eine neue Auswertung, sie steht in
> [offene-auftraege.md](offene-auftraege.md). **Diese Liste begründet kein JA.**

Zwischen Kassa-Annahme (0,06) und CFD-Hürde (0,1247) liegt als Punktschätzer mit unterer Grenze
über null **genau eine** Variante: glockendruck H=2 breit, **+0,0604 Pp** — 0,0004 über der
Annahme, je Signal 0,054 darunter, **liquide −0,002** (t −0,04). glockendruck H=3/H=5 (+0,065 /
+0,071) sind „nicht messbar" (null im Band). Alles Reale (glockendruck H=1 +0,044, rsi2seit
+0,021 je Signal) liegt **unter** der Kassa-Annahme; alles potenziell Große ist ungemessen.
**Es gibt derzeit keinen Kandidaten, für den sich ein echtes Kassa-Depot rechnerisch lohnen
könnte.** Ein Kassa-Depot ändert die Arithmetik nur für die 63-Tage-Klasse (Finanzierung ~2,2 Pp
entfällt) — das bestätigt die Reihenfolge des Entscheids vom 01.09., verschiebt sie nicht.
*Fundstelle: `studien/wiedervorlage-2026-09-02/BERICHT.md` Teil 2*

## Nicht messbar (Werkzeug oder Daten reichen nicht)

| Sache | Grund | Fundstelle |
|---|---|---|
| ~~News-Sentiment~~ | ~~**⚠ ÜBERHOLT 01.09.2026** — das Urteil „es fehlt Faktor 75" galt für das App-Archiv (35 Beobachtungen an 10 Zeitpunkten). Auf der **Gratisstufe** des Anbieters stehen **2.367 Zeitpunkte** zur Verfügung → auf Großwerten ~22.600 Beobachtungen gegen nötige ~2.600 = **Faktor 8,7. Die Klasse ist messbar, die Messung steht aus.**~~ **ERLEDIGT 01.09.2026 abends: die Messung ist gelaufen, das Urteil lautet NEIN — Zeile jetzt unter „Widerlegt".** *Und die 2.367 Zeitpunkte waren zu optimistisch: das sind Handelstage, nicht Tage mit Nachrichten. Nutzbar sind **1.338** (Abdeckung vor Mai 2021 unter 10 %).* | Urteil: `studien/vorregistrierung-2026-08-31-news-sentiment/ERGEBNIS.md` · Überholung: `studien/datentarif-2026-09-01/GRATIS-PRUEFUNG.md` · Korrektur: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/VORREGISTRIERUNG.md` Nachtrag 1 |
| Optionen, Value/Quality, Index-Aufnahmen, Dividendentermine, Saisonalität, Intraday | strukturell, siehe [datenquellen.md](datenquellen.md) | `studien/landkarte-2026-09-01/LANDKARTE.md` |

## Validierte BEDINGUNGEN (keine Strategien!)

Diese haben eine unabhängige Re-Validierung überlebt. **Sie sagen, WANN etwas erlaubt ist —
sie sind selbst kein Einstieg.**

- **SPY > EMA200 als Gate:** +0,098 Pp, **t = 2,6** — eingebaut
- **Regime-Zuteilung R-TREND:** **t = 3,2** — eingebaut (`rsi2seit` über der EMA200, Kapitulation darunter)

Siehe [messmethodik.md](messmethodik.md) für die Frage, warum eine Bedingung leichter zu belegen
ist als eine Strategie.
