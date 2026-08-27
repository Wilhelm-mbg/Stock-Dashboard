# Die krummen Sieben: Hypothesen mit Widerlegungskriterien — VOR den Abrufen

**Analytiker, 27.08.2026, ~14:45.** PM-Auflage: zu jeder Hypothese steht VOR dem
Abruf, welches Ergebnis sie widerlegen würde. RGR/SITC/B sind bereits vollständig
belegt (BEFUND-MASSIVE-PROBE.md); hier die vier offenen. Die Vorhersagen stützen
sich auf eine LOKALE Vorab-Messung (Quoten-Segmente 1d/60m, Sprungdaten, Drift —
Ausgabe im Lauf-Log), die VOR jedem Abruf lag.

## Vorab-Messung (lokal, ohne Netz)

| Reihe | Segment-Median vor dem Sprung | Spannweite p10–p90 | Quoten-Sprung am | Faktor |
|---|---|---|---|---|
| CBSH | 0,9520 | 0,13 % (konstant) | **01.12.2023** | 1,0504 |
| DOC | 1,50 / 1,504 / 1,489 | **3,55 % / 4,25 % (driftend!)** | **04.03.2024** | 0,6716 |
| GBTC | 0,9033 | 0,09 % (konstant) | **30.07.2024** | 1,1072 |
| ETHE | 0,8897 | 0,01 % (konstant) | **23.07.2024** | 1,1236 |

## CBSH — starke Form (Zahl UND Datum vorhergesagt)

**Hypothese:** 5-%-Aktiendividende (traditionell im Dezember). 1/1,05 = 0,9524 ≈
gemessene 0,9520; Sprung am 01.12.2023 mit Faktor 1,0504.
**Vorhersage:** Der Splits-Endpunkt führt einen Eintrag mit Kursfaktor ≈ 1,05
(z. B. 100:105) und Ausführung ±5 Handelstage um den **01.12.2023**.
**Widerlegt durch:** keinen solchen Eintrag in diesem Fenster — dann ist die
Zahlen-Übereinstimmung Zufall und CBSH bleibt unentscheidbar.

## DOC — Erzählung, die zwei Merkmale braucht (B-Standard)

**Hypothese:** Ticker-Neuvergabe (Healthpeak übernahm den DOC-Ticker nach der
Physicians-Realty-Fusion, Abschluss ~01.03.2024). **Erstes Merkmal ist vorab
erfüllt:** die Quote DRIFTET in den Vor-Segmenten (3,55/4,25 % — zwei Firmen sind
nie proportional; eine konstante Quote hätte den Mechanismus widerlegt) und
springt am 04.03.2024 auf exakt 1,0.
**Vorhersagen:** (a) Events-Endpunkt zeigt ticker_change auf DOC um Anfang März
2024; (b) **zweites Merkmal wie bei B:** die Dividendenreihe bricht um Q1/2024
(anderer Betrag/Rhythmus davor und danach).
**Widerlegt durch:** (a) keinen ticker_change 2024 → Erzählung tot. Nur (a) ohne
(b): „vereinbar mit", NICHT „belegt" — ein Inhaberwechsel im richtigen Zeitraum
ist ein Zusammentreffen, kein Mechanismus.

## GBTC / ETHE — datums-präzise Spin-off-Hypothese, mit diesen Endpunkten NICHT widerlegbar

**Hypothese (präzisiert durch die Vorab-Messung):** Die Grayscale-Mini-Trust-
Abspaltungen vom Juli 2024 — ETHE → Ethereum Mini Trust um den **23.07.2024**
(Faktor 0,8897 ≈ 11 % abgespalten), GBTC → Bitcoin Mini Trust um den
**30.07.2024** (Faktor 0,9033 ≈ 10 %). Konstante Quote davor (0,01/0,09 %
Spannweite) = mechanische Rückanpassung EINES Archivs, kein Firmenwechsel.
**Vorhersage:** Splits- und Events-Endpunkte sind an diesen Daten LEER (Spin-offs
führen beide nicht; Trust-Produkte zudem unter dem ETF-Abdeckungsvorbehalt).
**Ehrlichkeits-Klausel — die Asymmetrie ist die Information:** Ein leerer Endpunkt
BESTÄTIGT die Hypothese nicht und widerlegt sie nicht (Abdeckungslücke nicht
ausschließbar). Diese Hypothese ist mit diesen Endpunkten nur widerlegbar, falls
dort überraschend ein Split mit passendem Faktor steht (dann wäre es KEIN
Spin-off). Erwartetes Endergebnis daher: **„unentscheidbar mit diesen Endpunkten;
benannte, extern prüfbare Hypothese (EDGAR: Grayscale-Verteilungen Juli 2024)"** —
nicht mehr. Ein „Spin-off belegt" kann es aus diesen Abrufen NICHT geben.

## Abruf-Plan (nach dem 275er, ~5 Calls)

CBSH: Splits. DOC: Events + Dividenden. GBTC: Splits. ETHE: Splits.
