# Kapitulations-Dip auf 2.208 Werten — das endgültige Ergebnis

Vorregistrierung: [VORREGISTRIERUNG-2026-08-24-kapitulation.md](VORREGISTRIERUNG-2026-08-24-kapitulation.md) (Commit `40d6a37`).
Festlegung vor dem Ergebnis: [NOTIZ-2026-08-24-teiluniversum.md](NOTIZ-2026-08-24-teiluniversum.md) (Commit `4ed10bb`).

## Urteil

**Nicht bestätigt.** V0 erreicht t = 2,59 — über der Schwelle für 3 Tests (2,39), aber
**unter der vorab festgelegten Schwelle von 2,77** für die tatsächliche Zahl der
Testläufe. Nach der eigenen Regel heißt das: *grenzwertig, und die Schwelle ist
umstritten* — nicht „bestätigt".

| Variante | Werte | Signale | Überschuss | MDE | t | netto/Signal |
|---|---|---|---|---|---|---|
| **V0** nur der Auslöser | 2.208 | 10.830 | +0,613 | 0,474 | **2,59** | **+0,115** |
| V1 + Liquidität | 2.208 | 5.218 | +0,413 | 0,511 | 1,62 | +0,500 |
| V2 + Regime-Tor | 2.208 | 2.569 | +1,089 | 1,068 | 2,04 | +0,967 |

## Warum die Festlegung von vorher gebraucht wurde

| Universum | Werte | V0 (t) | V2 (t) | V2-Urteil |
|---|---|---|---|---|
| altes Archiv | 191 | 0,58 | 1,43 | nicht entscheidbar |
| Zwischenstand | 630 | 1,87 | **2,51** | **BESTÄTIGT** |
| voll, ungefiltert | 2.885 | 2,44 | 1,72 | nicht entscheidbar |
| voll, nur Aktien | 2.208 | 2,59 | 2,04 | nicht bestätigt |

**V2 war auf 630 Werten „bestätigt" und fällt auf 2.885 Werten auf t = 1,72.** Wäre
der Zwischenstand gemeldet worden, stünde heute ein Fund in der App, den die nächste
Datenlieferung kassiert hätte. Die Notiz, die das vorab ausgeschlossen hat, ist der
eigentliche Ertrag dieses Durchgangs.

## Der Ertrag hängt weiter an einer Handvoll Trades

```
Bestätigungshälfte, 6.478 Trades (nur Aktien)
  Mittel Überschuss        +0,215 Pp
  Median                   +0,297 Pp
  ohne die besten 1 %      −0,117 Pp
  ohne die besten 5 %      −0,817 Pp
  nur die besten 5 %      +19,830 Pp
  Anteil positiv             51,9 %
  Hälfte des Ertrags aus     12 Trades  (0,2 %)
```

Mit der 13-fachen Datenmenge ist der Schätzer **konzentrierter** geworden, nicht
stabiler: vorher 6 von 676 (0,9 %), jetzt 12 von 6.478 (0,2 %). Größter Einzeltrade
**REPL +124,6 Pp in 26 Handelsstunden** — das ist eine Zulassungsmeldung, keine Kante.

Und die Entdeckungshälfte bleibt negativ (−0,097 Pp, t = −0,43). Bei V1 sogar
deutlich: t = −2,06. Was in der ersten Hälfte verliert und in der zweiten gewinnt,
ist ein Zeitraum.

## Was die Datenmenge gebracht hat

Die Auflösung fiel von **0,695 auf 0,474 Pp**. Damit ist die Frage zum ersten Mal
beantwortbar — und die Antwort ist ein knappes Nein statt eines Achselzuckens.

Wichtiger noch: Zum ersten Mal in diesem Projekt konnte ein „bestätigt" wieder
**kassiert** werden, weil mehr Daten kamen. Bisher gab es nur den umgekehrten Weg.

## Ein Fund, den erst die Menge sichtbar gemacht hat

Der schlechteste Trade der ungefilterten Messung war **SVIX**, ein inverses
Volatilitätsprodukt. Beim Nachschauen fanden sich im 2.885er-Archiv:

| Art | Anzahl | |
|---|---|---|
| CS Stammaktien | 2.064 | gehört rein |
| ADRC Hinterlegungsscheine | 144 | gehört rein (ASML, ARM, ABEV sind Unternehmen) |
| ETF | 622 | raus |
| ETV Rohstoff-Treuhänder | 29 | raus |
| FUND / ETN / ETS | 25 | raus |

**28 % waren keine Unternehmensaktien** — darunter `ZVZZT`, das **Testsymbol der
NASDAQ** (41 % seiner Stundenkerzen springen über 8 %), und ein Dutzend gehebelter
oder inverser Produkte (SOXL, SOXS, UVIX, TSLL, GDXU, CONL).

Der Universumsfilter der Maschine lautete `sym.indexOf('-USD') === -1` — „kein
Krypto". Das ist kein Aktienfilter. Er liest jetzt die **Wertpapierart** von der
Schnittstelle statt einer Namensliste: eine Liste wäre eine Setzung, die still
veraltet; die Wertpapierart ist eine Tatsache.

Dass die Bereinigung das Ergebnis leicht **verbessert** (t 2,44 → 2,59), ist kein
Argument für sie. Ein Testsymbol gehört unabhängig davon nicht ins Universum. Beide
Zahlen stehen deshalb oben.

## Was für den Handel folgt

Nichts wurde abgeschaltet. Aber die belastbare Aussage ist inzwischen präziser als
gestern:

- **Über den Ertrag:** kein belegter Vorsprung. t = 2,59 gegen die geforderten 2,77.
- **Über das Risiko:** belastbar. Wer diese Kante handelt, handelt eine Verteilung,
  in der 0,2 % der Trades die Hälfte des Ertrags tragen — in beide Richtungen.
  Ohne die besten 5 % steht −0,817 Pp.

Das ist keine Kante, die man mit Positionsgrößen zähmt. Sie ist entweder dabei oder
nicht.
