# Vorregistrierung „Momentum", 24.08.2026

Geschrieben **vor** jeder Messung. Der Zeitstempel dieses Commits ist der Beleg.

## Warum jetzt

Momentum ist die Strategie, die das Mittelfrist-Depot seit dem 20.08. wirklich
handelt — und sie wurde nie mit der Messmaschine gemessen. Nicht aus Desinteresse:
Die Maschine reichte ihrem Signal genau **einen** Wert, Momentum stellt Werte aber
**gegeneinander** (`M.rangfolge`, stärkste 10 %). Diese Lücke ist heute geschlossen
(`querschnitt`-Hook).

Zwei Dinge kamen zusammen:
- **2.965 Werte über 40 Jahre** statt 189 über die Yahoo-Reichweite.
- Der bisherige Befund lautete: Bestätigungshälfte ab 2005 **+0,939 Pp je Schritt,
  t = 1,49, MDE 1,259, n = 86**. Unter der eigenen Nachweisgrenze — an der Auflösung
  gescheitert, nicht an der Idee.

## Was live läuft — nachgelesen, nicht angenommen

Aus `mittelfrist.js`: **Rückblick 231 Handelstage, Lücke 21, Halten 63, stärkste 10 %.**
Die Lücke ist der klassische Ausschluss des letzten Monats (kurzfristige Umkehr).

## Der entscheidende Unterschied zur Live-Umsetzung

Das Depot schichtet alle 63 Handelstage um. **Welcher Tag der erste ist, ist eine
willkürliche Wahl unter 63 gleichberechtigten** — und die Kontroll-Prüfung der
Parallelsitzung hat gemessen, dass von 63 möglichen Lagen **keine** ein t ≥ 1,96
erreicht; die gewählte saß am günstigen Rand. Das ist Fehlertyp **B9**.

Diese Messung prüft deshalb **an jedem Handelstag**, an dem die Bedingung gilt, statt
auf einem Raster. Damit wird die These gemessen („sind die stärksten Werte in den
folgenden Wochen besser?") und nicht eine Rasterlage.

**Das ist ausdrücklich eine andere Frage als „funktioniert die Live-Umsetzung".**
Trägt die These, muss die Rasterlage separat geprüft werden. Trägt sie nicht, ist die
Rasterfrage erledigt.

## Familie und Schwelle

- Name: `momentum-2026-08-24`, **4 Tests**
- Bonferroni-Schwelle für |t|: **2,50** (zweiseitig, α = 0,05, 4 Tests)
- Zeitrahmen `1d`, Haltedauer **63 Kerzen**, Richtung long
- `leseFensterKerzen: 260` (Rückblick 231 + Lücke 21, aufgerundet) → A7 aktiv
- Universum: Wertpapierart CS und ADRC, keine ETFs (`wertpapierart.js`)
- Kosten: 5 Bp je Seite

## Die vier Tests

Das Merkmal ist immer dasselbe: die Rendite von `t−231` bis `t−21`, also 12 Monate
ohne den letzten. Variiert wird nur, **wie streng** die Auswahl ist:

| | stärkste … | entspricht |
|---|---|---|
| V0 | 10 % | die Live-Einstellung |
| V1 | 20 % | milder |
| V2 | 5 % | strenger |
| V3 | 33 % | das stärkste Drittel |

Mehr Varianten gibt es nicht. Wer die Rückblicklänge, die Lücke oder die Haltedauer
mit durchprobiert, hat ein Raster abgesucht und die Schwelle dafür nicht bezahlt.

## Erwartung, vor der Messung

**Offen — und das ist neu.** Bei allen bisherigen Thesen war die Erwartung negativ.
Hier sprechen zwei Dinge dafür und zwei dagegen:

*Dafür:* Momentum ist der am breitesten replizierte Effekt der Finanzliteratur. Und
die Haltedauer von 63 Tagen amortisiert die Kostenhürde, anders als bei allem
Intraday-Gemessenen.

*Dagegen:* Der bisherige Befund liegt bei t = 1,49 und ist seit 2005 schwächer als
davor. Und das Universum ist überlebensverzerrt — die 2.965 Werte sind die, die
Yahoo heute noch führt. Die 1.037 verschwundenen liegen im Massive-Archiv und sind
**nicht** dabei; sie kommen in einem zweiten Schritt.

## Abbruchregeln

- Keine weiteren Varianten nach dem ersten Blick auf die Zahlen.
- Kein Wechsel von Rückblick, Lücke oder Haltedauer.
- Ein einzelner Lauf zählt. Ergeben sich später mehr Werte (die verschwundenen),
  ist das ein **weiterer** Lauf und die Schwelle steigt — wie beim Kapitulations-Dip
  festgehalten.
- Trägt die These, ist sie damit nicht handelbar: Es folgen die Rasterlagen-Prüfung
  (B9), die Kostenrechnung und die Überlebensverzerrung.
