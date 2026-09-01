# Monats-Momentum gemessen — Ergebnis, 02.09.2026

**Gemessen:** 02.09.2026 00:25 MESZ (`lauf-2026-09-01-22-25.json`, UTC-Stempel), Werkzeug
`messen.js` wie committet **vor** dem Lauf (9f797c0, Placebo-Patch 3e7d17c). Vorregistrierung
22a0eff, Nachtrag 1 (3e7d17c) **vor** dem Urteilslauf. Archiv `archiv1d`: 2.213 CS/ADRC-Reihen
(716 keine Aktie, 36 F1-kaputt), Zeitachse 1986-08-25 bis 2026-08-28 (#85: letzte Kerze weg).
Wachhund: 1 Handelstag Rückstand (31.08. statt 01.09.) — für 63-Tage-Perioden unerheblich.
**Familie 5 Tests, Schwelle |t| ≥ 2,576. Testzahl dieser Studie: 1.**

## Urteil

> ## **CFD gehebelt (Urteilsgefäß): NICHT ENTSCHEIDBAR.**
> Brutto **+1,541 Pp je Umlauf** (se 0,732, t 2,10, **79 unabhängige Perioden** 2006-08-16 bis
> 2026-06-01). CFD-Hürde K + F·91,5 Nächte = **2,370 Pp**. **Netto −0,829 Pp je Umlauf
> (t −1,13).** Kein JA: netto negativ. Kein NEIN: Obergrenze brutto +2,976 liegt über 2,370.
>
> **Die Aussage, die bleibt — die Obergrenze: netto höchstens +0,605 Pp je Umlauf.** Selbst die
> optimistischste mit den Daten verträgliche Kante ließe nach CFD-Finanzierung 0,6 Pp je
> Quartal übrig; der Punktschätzer liegt bei −0,8. **Ein NEIN wäre erst bei se < 0,42 erreichbar
> — 237 Perioden, rund 60 Jahre.** Die Frage ist am CFD-Gefäß mit diesem Archiv nicht
> schließbar, und sie wird es auch in 20 Jahren nicht.

| | Wert |
|---|---|
| MDE (2 × se) | 1,46 Pp je Umlauf |
| delta80 (1,96) / (Familie 2,576) | 2,05 / 2,50 Pp |
| 95-%-Band brutto | [+0,106, +2,976]; Obergrenze bei 2,576: +3,427 |
| Kalendernächte je Periode | Mittel 91,5, min 88, max 97 |

**Erwartung aus der Registrierung (§1) eingetroffen:** „nicht entscheidbar mit Obergrenze nahe
3 Pp" — 2,976. Nichts an diesem Lauf war überraschend; sein Ertrag sind die Zahlen unten.

## Kandidat, Placebo und Gefäße in einer Tabelle (Bestätigung, Phase 0, 79 Perioden)

| Zeile | brutto | Hürde | netto | t_netto | Obergrenze brutto | Obergrenze netto | Urteil nach §5 |
|---|---|---|---|---|---|---|---|
| **CFD gehebelt — URTEIL** | **+1,541** | 2,370 | **−0,829** | −1,13 | +2,976 | **+0,605** | **nicht entscheidbar** |
| CFD ungehebelt (1:1) — nachrichtlich | +1,541 | 0,110 | +1,431 | 1,95 | +2,976 | +2,866 | formal „nicht messbar" — **kein Urteil** |
| Kassa-Aktie — nachrichtlich, **ANNAHME 0,06** | +1,541 | 0,060 | +1,481 | 2,02 | +2,976 | +2,916 | formal „nicht messbar" — **kein Urteil** |
| *Placebo (Zufallskorb, Soll null)* | *+0,226* | — | *(CFD −2,144)* | *t 1,12* | — | — | *bestanden* |

**Zum Etikett „nicht messbar" in den beiden Nebenzeilen:** Die registrierte Regel vergibt es,
wenn delta80 (2,05) über der Hürde liegt — bei Hürden von 0,06 und 0,11 ist das automatisch
so. Es sagt: *die Anordnung kann eine Kante von Hürdengröße nicht auflösen.* Es sagt **nichts**
über die +1,48. Was die Kassa-Zeile tatsächlich zeigt: t_netto 2,02 — **über der nominalen
Schwelle 1,96, unter der Familienschwelle 2,576**; das untere Ende des 95-%-Bandes (+0,106
brutto) liegt knapp über der Annahme. Drei Vorbehalte gleichzeitig, jeder allein reicht gegen
ein Urteil: (1) **In-Sample** — die Daten waren gesehen (§0 der Registrierung); (2) die Hürde ist
eine **Annahme** für 10.000-$-Positionen in liquiden Werten, kein Messwert; (3) **18,2 % des
Korbs liegen unter 5 Mio $ Tagesumsatz** und nur 2,6 % über 1 Mrd $ — für einen Fünftel des
Korbs gilt die Annahme sicher nicht.

## Kontrollen — alle vor dem Blick auf das Urteil

| Kontrolle | Soll | Ist | |
|---|---|---|---|
| W0 Reproduktion der Eichung | +1,537 Pp, 79 Perioden, Toleranz 0,05 | +1,541, 79, Abweichung 0,004 | bestanden |
| Placebo t | \|t\| < 2,576 | +0,226 Pp, se 0,202, t 1,12 | bestanden |
| Placebo-Rauschboden, **registriertes** Kriterium | sd(200 Placebo-Mittel) / se Kandidat ∈ [0,7; 1,4] | 0,181 / 0,732 = **0,247** | **gefallen — Nachtrag 1** |
| Placebo-Rauschboden, **korrigiertes** Kriterium (Nachtrag 1) | se Placebo / sd(200 Placebo-Mittel) ∈ [0,7; 1,4] | 0,202 / 0,181 = 1,116 | bestanden |
| Placebo-Ziehungen mit \|t\| ≥ 2,576 | ≈ 2,4 von 200 (t₇₈) | 5 von 200 | nachrichtlich; Poisson-Wahrscheinlichkeit ≈ 10 % |
| Positivkontrolle (Ausstieg × 1,02) | Soll exakt +1,893 (Näherung 2,000·(1−Korb/Alle) = +1,800), ±5 % | gefunden +1,893 brutto und netto, Verhältnis 1,0000 | bestanden |
| Wachhund archiv1d / Fingerabdruck / Klassifizierung | ≤ 1 Tag / unverändert / vorhanden | 1 Tag / unverändert (2.965 Dateien) / vorhanden | bestanden |

**Das gefallene Kriterium, ehrlich:** Es war falsch gebaut, nicht die Streuungsrechnung.
Ein Zufallskorb aus ~165 Werten streut gegen den Markt nur mit dem idiosynkratischen Rest
(**1,79 Pp je Periode**); der Momentum-Korb trägt die Zeitreihen-Streuung des Faktors
(**6,51 Pp je Periode**). Das Verhältnis 0,247 ist die Faktorstreuung — und sie ist der Grund
für die Auflösungswand an dieser Stelle. **Wer den Buchstaben der ursprünglichen Registrierung
anlegt, liest „Kontrolle verfehlt, kein Urteil" und alle Zahlen als beschreibend.** Beide
Lesarten stehen hier; das Urteil oben folgt dem Nachtrag, der vor dem Urteilslauf committet
wurde und keine Regel des Endpunkts berührt.

## Machbarkeit: Plan gegen Ist

| | registriert (§2) | gemessen |
|---|---|---|
| delta80 konservativ (überlappend + Newey-West) | 3,16 Pp → 142 nötige Perioden, 79 vorhanden → *„nicht messbar"* | — |
| delta80 realistisch (nicht überlappend, geeicht) | 2,05 Pp → 60 nötige Perioden → messbar | **2,051 Pp** |

Die geeichte Planzahl traf auf drei Stellen. **Die konservative Formel hätte die CFD-Frage
für unbeantwortbar erklärt; sie war es nicht** — genau die Fehlerform aus
`wiki/aufloesungswand.md`. An der Familienschwelle liegt delta80 (2,50) allerdings über der
Hürde (2,37): die Frage ist an der Kante der Auflösung, und das Ergebnis „nicht entscheidbar"
ist die Form, in der sich das zeigt.

## Überlebensverzerrung (§7): Gilt der Weg-3-Wert hier? — **Nein.**

Der Weg-3-Wert (+0,0462 Pp/Tag, t 21,4) ist **über Nacht** und **unbedingt** gemessen. Geprüft
wurde auf dem Fenster der Verschwundenen-Reihen (1.023 CS/ADRC genutzt, 89 zu kurz, **52 von
F1 verworfen** — Sprünge am Delisting), dieselbe Regel auf Überlebenden allein (S) und auf der
Vereinigung (U):

| Periode | Universum (V-Anteil) | Korb (V-Anteil) | delistet im Fenster | brutto S | brutto U | **Δ U−S** | **Weg-3-Analogon 63 T (V−S)** |
|---|---|---|---|---|---|---|---|
| 2025-08-28 → 11-26 | 2.619 (15,6 %) | 262 (19,8 %) | 96 | +2,978 | +3,098 | **+0,120** | **−0,90 Pp** |
| 2025-11-26 → 2026-03-02 | 2.556 (13,5 %) | 256 (19,1 %) | 137 | +4,148 | +4,742 | **+0,594** | **−7,63 Pp** |
| 2026-03-02 → 06-01 | 2.430 (8,9 %) | 243 (8,6 %) | 124 | +10,550 | +10,065 | **−0,485** | **−8,37 Pp** |
| alle 63 Lagen, 190 Perioden | 11,03 % | 13,11 % | | | | | Verhältnis Korb/Universum **1,19** |

**Ergebnis der Prüfung, wie es fiel:**

1. **Das Vorzeichen dreht mit dem Horizont.** Über Nacht laufen die Verschwundenen besser
   (Weg 3); **über 63 Tage laufen sie in diesem Fenster deutlich schlechter** (−0,9 / −7,6 / −8,4
   Pp je Periode, unbedingt). Auf Monatshaltedauer dominieren die Sterbepfade, nicht die
   Übernahmeprämien. **Der Weg-3-Wert ist auf diesen Endpunkt nicht übertragbar.**
2. **Bedingt landen Verschwundene überproportional im stärksten Zehntel** (13,1 % gegen 11,0 %,
   Faktor 1,19) — Übernahmekandidaten steigen vorher. Der Korb ist also *stärker* betroffen
   als der Markt.
3. **Auf Korbebene ist das Vorzeichen in drei Perioden gemischt** (+0,12 / +0,59 / −0,49 Pp):
   beide Seiten der Differenz Korb − Markt verlieren. **Kein Korrekturwert, kein Vorzeichen für
   2006–2026.** Etikett: *Fenster 2024-08 bis 2026-08, übernahme-dominiert, 3 Perioden;
   2008/09 nicht gemessen.*

Für das Urteil oben heißt das: Es ist weder konservativ noch geschönt belegbar. Die
Verschwundenen-Reihen decken zwei Jahre; mehr ist mit diesen Quellen nicht zu prüfen
(`wiki/ueberlebensverzerrung.md`: Lücke nicht zu schließen).

## Nachrichtlich — entscheidet nichts

**Ären, Phase 0:**

| Ära | Perioden | brutto (se, t) | netto CFD (t) | netto Kassa, Annahme (t) | Obergrenze brutto |
|---|---|---|---|---|---|
| Entdeckung (< 2006-08-14) | 76 | +3,309 (0,878, 3,77) | +0,946 (1,08) | +3,249 (3,70) | +5,029 |
| **Bestätigung (Urteil)** | 79 | +1,541 (0,732, 2,10) | −0,829 (−1,13) | +1,481 (2,02) | +2,976 |
| Gesamt | 155 | +2,408 (0,572, 4,21) | +0,041 (0,07) | +2,348 (4,10) | +3,529 |
| 1980er / 1990er | 10 / 40 | +2,469 (t 1,55) / +4,426 (t 3,40) | +0,108 / +2,068 | | |
| **2000er** | 40 | **+0,375 (t 0,29)** | −1,996 | | |
| 2010er / 2020er | 40 / 25 | +1,781 (t 2,70) / +3,409 (t 2,32) | −0,588 / +1,038 | | |

Die Entdeckungshälfte ist mehr als doppelt so stark wie die Bestätigung; die 2000er (mit dem
Momentum-Crash 2009) sind ≈ null. **Selbst über alle 155 Perioden ist netto CFD +0,04 (t 0,07)** —
die Finanzierung frisst die Kante in jeder Ära.

**63 Rasterlagen (Bestätigung), Streubild:** brutto min +0,994 / Median +1,373 / max +1,782;
t brutto 1,18–2,34; **netto CFD in allen 63 Lagen negativ** (−1,375 bis −0,588); Obergrenze
brutto 2,32–3,42; t netto Kassa ≥ 1,96 in 30 von 63, ≥ 2,576 in **0**. **Die registrierte
Phase 0 (+1,541) liegt über dem Median des Streubilds (+1,373)** — sie war per Konstruktion
festgelegt, nicht gewählt, aber der Leser soll es sehen.

**Umschlag:** 54,1 % des Korbs aus der Vorperiode gehalten → effektives K 0,051 Pp. Ändert
nichts: F·H = 2,26 Pp dominiert. **Korb:** im Mittel 165 von 1.650 Werten.

**Liquiditätsprofil des Korbs:** ≥ 1 Mrd $: **2,6 %** · ≥ 100 Mio $: 24,5 % · < 5 Mio $:
**18,2 %**. K = 0,110 ist für Mega-Caps gemessen — es gilt für ein Vierzigstel des Korbs.

## Was daraus folgt (deskriptiv, keine Empfehlung)

- **Am CFD-Gefäß ist Monats-Momentum keine offene Frage mehr, sondern eine unbeantwortbare:**
  die Finanzierung (2,26 Pp je Umlauf) übersteigt die gesamte gemessene Kante, und ein NEIN
  bräuchte 60 Jahre. Die Obergrenze (+0,6 netto) ist die letzte Zahl, die dazu gesagt werden
  kann.
- **Die Kassa-Zeile ist der einzige Ort, an dem die Arithmetik aufgehen könnte** — mit
  Annahme, In-Sample und einem zu einem Fünftel illiquiden Korb. Was sie aus einer Annahme
  machen würde, steht bereits in `wiki/offene-auftraege.md`: Kosten je Umsatzklasse am
  Paper-Konto. Was hier **nicht** gemessen wurde und eine neue Registrierung bräuchte: eine
  **liquide Fassung** (Korb nur aus Werten ≥ 100 Mio $). Die glockendruck-Lehre („der Effekt
  lebt, wo er nicht handelbar ist") ist auch hier unerledigt.
- **Für die Messmethodik:** Die geeichte Planformel traf; die konservative hätte die Frage
  fälschlich für blind erklärt. Und ein Placebo-Kriterium war falsch gebaut — eine
  Nullerwartung ohne Faktorstreuung (Nachtrag 1). Beides gehört ins Wiki.

**Sperrliste eingehalten:** kein Parameter verändert, keine weitere Variante, kein Urteil auf
Kassa oder ungehebelt, kein Korrekturwert aus §7, keine Jahresrechnung, kein Lagenwechsel,
eingefrorenes Universum unberührt, Eichungsstudie unverändert.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
