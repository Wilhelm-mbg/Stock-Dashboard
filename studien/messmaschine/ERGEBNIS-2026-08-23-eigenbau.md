# Ergebnis „Eigenbau", 23.08.2026

Zur Vorregistrierung: [VORREGISTRIERUNG-2026-08-23-eigenbau.md](VORREGISTRIERUNG-2026-08-23-eigenbau.md),
festgeschrieben in Commit `836bfac` **vor** der ersten Messung.

## Die kurze Antwort

**Keine der drei Thesen trägt.** Alle sieben vorregistrierten Tests: nicht entscheidbar.

Der Ertrag des Tages liegt woanders: Beim Messen der Thesen kam heraus, dass das
Messgerät selbst einen Nullpunktfehler hatte, der jede bisherige Messung dieses
Projekts berührt.

## Die sieben Tests

Alle Zahlen in Prozentpunkten je Signal, Bestätigungshälfte (zurückgehaltene zweite
Hälfte der Handelstage). Bonferroni-Schwelle für |t| bei 7 Tests: **2,69**.

| These | Variante | roh | Verzerrung | korrigiert | t | Urteil |
|---|---|---|---|---|---|---|
| T1 Zwangsglattstellung | k=1,5 | +0,0933 | **+0,0173** | +0,0760 | 1,08 | nicht entscheidbar |
| | k=2,0 | +0,0446 | +0,0197 | +0,0249 | 0,28 | nicht entscheidbar |
| | k=2,5 | −0,1565 | +0,0234 | −0,1798 | −1,55 | nicht entscheidbar |
| T2 Umsatzschock | k=3 | +0,0922 | −0,0046 | +0,0968 | 0,86 | nicht entscheidbar |
| | k=5 | +0,1202 | +0,0035 | +0,1167 | 0,65 | nicht entscheidbar |
| T3 Stunden-Drift | k=1,0 | −0,0329 | **−0,0242** | −0,0088 | −0,85 | nicht entscheidbar |
| | k=2,0 | −0,0547 | **−0,0399** | −0,0148 | −0,82 | nicht entscheidbar |

„Verzerrung" ist das, was **dieselbe Rechnung auf Daten ohne jeden Effekt** liefert —
gemittelt über 30 Archive, in denen die echten Renditen jedes Symbols innerhalb jeder
UTC-Stunde in ihrer Reihenfolge vertauscht wurden.

## Was ohne die Nullversuche im Bericht gestanden hätte

| | ohne Nullpunkt | mit Nullpunkt |
|---|---|---|
| T3 k=1,0 | **widerlegt** (t = −3,19) | nicht entscheidbar (t = −0,85) |
| T3 k=2,0 | **widerlegt** (t = −3,03) | nicht entscheidbar (t = −0,82) |
| T1 k=1,5 auf Zufallsarchiv | **bestätigt** (t = +2,97) | — |

Bei T3 waren **drei Viertel** des „Befundes" das Messgerät. Und T1 wäre auf einem
Archiv ohne jede Vorhersagbarkeit als bestätigt durchgegangen.

## Der Nullpunktfehler (A6)

Die Kontrolle ist der Mittelwert des Symbols zu dieser Stunde über die ganze Hälfte —
ein **endlicher** Topf von rund 366 Werten. Jedes Signal, das seine Auswahl aus
demselben Topf speist, verschiebt mechanisch den Rest:

- **T3** wählt Kerzen, deren vorige 60 Vorkommen hoch lagen → die übrigen müssen
  tiefer liegen → **Sog nach unten**.
- **T1** wählt Tage nach starkem Verlust; die Tagesrendite enthält denselben
  Stundenschritt, aus dessen Topf später gezogen wird → **Sog nach oben**.
- **T2** wählt nach *Umsatz* aus, nicht nach vergangenen Renditen — und hat als
  einzige praktisch keine Verzerrung (−0,005). Das stützt die Diagnose unabhängig.

## Zwei unabhängige Gegenproben der Diagnose

**Erstens: die eingebaute Kante.** Im Testarchiv steckt ein künstlicher Effekt. Auf
den echten Daten findet die Maschine ihn mit t = 40,77. Nach dem Vertauschen —
identische Renditen, identische Stundenmittel bis auf 3·10⁻¹⁸ — bleibt t = 0,44.
Der Nullversuch prüft also wirklich etwas.

**Zweitens: das Vorzeichen kippt mit dem Ausstieg.** Dieselbe Einstiegsregel, dieselben
Daten, nur ein anderer Ausstieg:

| | Verzerrung |
|---|---|
| `rsi2seit` (Zeit-Ausstieg) | **+0,0270** |
| `rsi2seit-mcp` (MCP-Stop 90 %) | −0,0087 |
| `rsi2seit-mcp` (MCP-Stop 10 %) | **−0,0536** |

Ein Markteffekt kann sein Vorzeichen nicht ändern, weil man anders aussteigt. Ein
Messaufbau-Effekt kann es.

## Was das für die bisherigen Messungen heißt

### rsi2seit — der gesamte Überschuss war das Messgerät

```
roh          +0,0241 Pp je Signal
Verzerrung   +0,0270 Pp
────────────────────────────────
korrigiert   −0,0030 Pp     t = −0,03
```

Der Befund von heute früh (+0,0115 Pp, t = 0,14, „kein nachweisbarer Vorteil") wird
damit schärfer: Der kleine positive Rest war nicht klein, sondern gar nicht da.

### rsi2seit-mcp — Urteil unverändert, aber die Zahlen bewegen sich

Nach Korrektur werden alle fünf Varianten positiver, die schärfste (MCP 10 %) erreicht
+0,1009 Pp bei t = 2,01 — Schwelle bei 5 Tests ist 2,58. Damit weiterhin **nicht
entscheidbar**, und die Spanne (0,10 Pp) frisst den korrigierten Überschuss vollständig
auf. Kein Handelsvorschlag, aber die einzige Zahl des Tages, die sich in die richtige
Richtung bewegt hat.

### Noch offen

Momentum, Ergebnis-Drift, Kapitulations-Dip und die große Signalstudie liefen mit
**anderen** Kontrollkonstruktionen, nicht mit dieser Maschine. Ob sie dieselbe
Überlappung haben, ist einzeln zu prüfen und **nicht** aus diesem Befund ableitbar.

## Was nicht registriert wurde, und warum

**Quartalsende-Fensterputzen** — mechanisch die stärkste These der Liste. Nicht
getestet, weil die Zahl der Bestätigungstage vorab feststand (~20 gegen geforderte 30).
Das Urteil hätte vor der Messung festgestanden. Erst mit 6+ Jahren Archiv prüfbar.

**Unbedingte Übernacht-Prämie** — mit dieser Kontrolle strukturell nicht messbar: Ein
Signal, das immer zur selben Stunde feuert, wird gegen genau diese Stundenerwartung
gemessen, der Überschuss ist per Konstruktion null.
