---
tags: [befund]
---
# Die Auflösungswand

**Der wichtigste Begriff des Projekts.** Sie erklärt, warum fast jede Frage unbeantwortbar ist —
nicht aus Rechenmangel, sondern statistisch.

## Die Formel

    N(d) ≈ N_vorhanden · (delta80 / d)²

*Fundstelle: `studien/landkarte-2026-09-01/LANDKARTE.md`, §0.1*

`d` = gesuchte Kantengröße · `delta80` = kleinste Kante, die bei vorhandener Datenmenge mit
80 % Wahrscheinlichkeit auffiele. **Die nötige Tagezahl steigt QUADRATISCH**, wenn die gesuchte
Kante kleiner wird.

## ⚠ Zwei Fallen, die uns beide schon erwischt haben

1. **Einheitenfalle:** `delta80` ist in **Prozentpunkten**, die Schwelle in **Handelstagen**.
   Wer beides gleichsetzt, rechnet Unsinn. *(Passiert; siehe [fehlerformen.md](fehlerformen.md).)*
2. **Haltedauer-Falle:** Bei Haltedauer H sinkt die Zahl **unabhängiger** Beobachtungen um
   Faktor H. **Längere Horizonte sind statistisch TEURER, nicht billiger** — auch wenn die
   Kosten je Tag sinken.
3. **Wand-ist-nicht-Fenster-Falle (NEU 01.09.2026):** Wie weit eine Quelle *zurückreicht* und
   ab wann sie *dicht genug* ist, sind zwei Zahlen. Die Nachrichtenwand liegt bei 2017, die
   brauchbare Abdeckung beginnt 2021 — wer die Wand einsetzt, rechnet mit 2.367 statt 1.338
   Tagen und hält eine Frage für beantwortbar, die es nicht ist.
   *Fundstelle: [datenquellen.md](datenquellen.md), Kasten „Die Wand ist nicht das Fenster".*

## ⚠ Die Planformel ist konservativ — um wie viel, sagt erst der Lauf

Für einen Querschnitts-Endpunkt setzt die Vorab-Rechnung `se ≈ σ/√G` (G = Cluster) an und
unterstellt damit **volle Abhängigkeit innerhalb eines Tages**. Gemessen am 01.09.2026:
nach der **Tagesbereinigung** lag der geclusterte Standardfehler nur **18 % über** dem
ungeclusterten — die realisierte MDE war **4,2× schärfer** als die geplante (0,063 statt
0,264 Pp/Punkt).

> **Regel daraus:** Die Planformel darf eine Messung **abraten** (dann ist sie sicher blind),
> aber ihr Ergebnis ist keine Obergrenze der erreichbaren Schärfe. **Wer nach dem Lauf enger
> ist als geplant, darf das berichten — aber als Zugewinn kennzeichnen, nicht als das, was
> vorregistriert war.**
> *Fundstelle: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md`*

**Zweiter Fall (02.09.2026, Monats-Momentum, H = 63):** Die konservative Rechnung (überlappend
+ Newey-West, se 1,129) verlangte **142 Perioden** für eine Kante in CFD-Hürdengröße — bei 79
vorhandenen wäre die Frage „nicht messbar" gewesen. Die **geeichte** Rechnung (nicht
überlappend, se 0,732) verlangte **60** und sagte „messbar". Gemessen: delta80 **2,051 Pp** —
die geeichte Planzahl (2,05) auf drei Stellen. **Regel bestätigt: beide Rechnungen ausweisen;
die konservative darf abraten, aber nicht allein entscheiden.**
*Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`, „Machbarkeit: Plan gegen Ist"*

## Die Streuungs-Anker

| Fenster | σ | Folge |
|---|---|---|
| **über Nacht** | **0,880 Pp/Tag** | die günstigste Klasse — Faktor ~15 besser als mehrtägig |
| Tag (1 Tag Haltedauer) | 1,474 | |
| mehrtägig | 2,8 | |

*Fundstelle: `studien/landkarte-2026-09-01/LANDKARTE.md`*

## Was das praktisch heißt

Bei 4.665 vorhandenen Handelstagen:

- **Übernacht:** ~735–872 nötige Tage → **die EINZIGE Klasse klar unter der Wand**
- **Monatswende:** hätte **79.500 Tage** gebraucht → strukturell unmöglich
- **Monats-Momentum (H = 63, gemessen 02.09.2026):** die Haltedauer-Falle in Reinform — 4.975
  Bestätigungstage sind **79 unabhängige Perioden**, Streuung je Periode **6,5 Pp** (ein
  Zufallskorb: 1,8 — der Rest ist Faktorstreuung). delta80 2,05 Pp gegen CFD-Hürde 2,37:
  messbar an der Kante, Ergebnis „nicht entscheidbar", **ein NEIN bräuchte 237 Perioden ≈ 60
  Jahre.** *Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`*
- ~~**News-Sentiment (Stand 31.08.):** ~2.600 nötig, 35 vorhanden → **Faktor 75 fehlt**~~
  **ÜBERHOLT 01.09.2026:** auf dem Anbieter-Vollkorpus 33.307 Beobachtungen in 1.338
  Tages-Clustern → Wand genommen, **gemessen, Urteil NEIN**.
  *Fundstelle: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md`*

## Die Regel daraus

> **Machbarkeit VOR der Vorregistrierung rechnen.** Ist die Frage blind, ist *„nicht messbar"*
> der Befund — kein Nein, kein Ja. **34 von 38 frühen Messungen waren blind, ohne es zu wissen.**

Siehe [messmethodik.md](messmethodik.md).

## Nachtrag 11.10.2026 — die Wand in den Formen der Prüfstraße

Die ersten beiden Läufe des Ideen-Agenten scheiterten nicht an der Form, sondern an der Wand (`pruefstrasse/ideen-verworfen.md`, Trendfaktor und Kurzfrist-Momentum):

- **Korb-Form** (ein Buch gegen SPY je 63-Tage-Periode; Entdeckung 2016–2022 ≈ 27 Perioden): Standardfehler 2,6–4,3 Pp je Periode (aus dem Rückblick 04.10.: 3,07 Pp breit / 4,94 Pp Korb 187 über 20 Perioden) → **MDE₈₀ ≈ 7–12 Pp je Periode, grob 30–50 Pp p. a.**; Tor 1 verlangt das Vierfache der Bestätigungs-MDE (≈ 40–60 Pp je Periode). Realistische Kanten (3–7 Pp p. a.) sind dort unsichtbar — dieselbe Wand wie im Rückblick (+7,6 Pp p. a. nicht vom Zufall zu trennen).
- **Tag-Form** (Ereignisse je Reihe, Tagescluster): fein nur mit tausenden Signaltagen; das Panel beginnt 04.01.2016, Vorläufe über ~4 Jahre scheiden aus (Trendfaktor: 1.000-Tage-Mittel + 12 Monate → 24 Signalmonate).
- **Querschnitt** (Prüfstand 15.09., Top-Dezil gegen Universum, ~220 liquide Werte, 115 Monate): MDE₈₀ 0,97–1,76 Pp je Monat — die feinste Form, als Prüfstraßen-Adapter aber nicht gebaut; sie löst nur Größen ab ~12 Pp p. a. auf. Zurückgestellt (PM 11.10.).

Folge für den Ideen-Agenten (Fassung 2, 11.10.): Maßstab ist ein **informatives Urteil** — einstellen, wenn die Messung die Behauptung bestätigen ODER in ihrer Größe ausschließen kann (MDE₈₀ ≤ 2 × behauptete Größe; ein Größen-Ausschluss zählt als Ergebnis); verwerfen nur, wenn beides unmöglich ist oder die Daten die Regel nicht tragen. Brutto-Belege genügen ab dem Dreifachen der Kassa-Hürde je Umlauf (0,157 / 0,085 / 0,065 / 0,045 Pp nach Umsatzklasse), die Kosten rechnet die Prüfstraße selbst.
