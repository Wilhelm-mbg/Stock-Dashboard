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
- **News-Sentiment (Stand 31.08.):** ~2.600 nötig, 35 vorhanden → **Faktor 75 fehlt**

## Die Regel daraus

> **Machbarkeit VOR der Vorregistrierung rechnen.** Ist die Frage blind, ist *„nicht messbar"*
> der Befund — kein Nein, kein Ja. **34 von 38 frühen Messungen waren blind, ohne es zu wissen.**

Siehe [messmethodik.md](messmethodik.md).
