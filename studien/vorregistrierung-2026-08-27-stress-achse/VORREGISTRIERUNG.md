# Vorregistrierung — Stress-Achse: Trennt die Spannen-Quote die Kapitulations-Kante?

**Stand:** 27.08.2026 ~13:40, vor jedem Rechenschritt. **Rolle:** Berechnungen.
**Auftrag:** PM (Wilhelms Kosten-Freigabeschwelle braucht »verschiedene Marktlagen«;
die einzige validierte Lagen-Achse ist binär SPY/EMA200h). **Ein NEIN ist ein
vollwertiges und ausdrücklich erwartetes Ergebnis** — dann bleibt es bei einer Lage
und die Schwelle bleibt streng. 06 baut erst nach diesem Befund.

## 1. Kandidat (stand fest, bevor irgendetwas gerechnet wurde)

**Achse:** Tagesspannen-Quote der S&P-Referenz.
`Spanne_t = (hoch_t − tief_t) / schluss_t` · `Quote_t = Spanne_t / Median(Spanne_{t−20…t−1})`
**Stress-Tag:** `Quote_t ≥ 1,5` (Schwelle hiermit fixiert, vor jedem Blick auf Wirkung).

**Referenzreihe — Abweichung vom Auftragstext, VOR der Messung erklärt:** SPY liegt
nicht im E:-Archiv (Universum nach Wertpapierart Aktie gefiltert). Ersatz:
**SPXL (3× S&P-ETF, bars_1d, ab 2008)** — die Quote ist gegen den eigenen
20-Tage-Median gebildet und kürzt den Hebel exakt weg; High/Low sind vorhanden
(Balkenformat [zeit, schluss, umsatz, hoch, tief, eroeffnung]). Das ist eine
Datenverfügbarkeits-Substitution, keine andere Definition.

**Kein Blick nach vorn (Stempel-Kerzen-Lehre):** Ein Signal am Tag d nutzt die Quote
des **letzten Achsen-Tages STRENG vor d** — die eigene Tagesspanne ist erst zum
Schluss bekannt. Das ist zugleich die einzig live einsetzbare Form.

## 2. Prüfgerüst

**Kante:** `strategien/kapitulation.js` UNVERÄNDERT (Auslöser aus quant.js, Haltedauer
26 Kerzen, Kosten 5 Bp) auf archiv60m — dieselbe Maschine, dieselben Wächter (A7-
Kontrolle, Placebo der Maschine, W-Serie) wie bei der validierten Messung.

**Basis-Variante für den Split: Liquiditäts-Tor AN, Regime-Tor AUS** — die Achse soll
zeigen, was SIE trennt, nicht das alte EMA200-Tor nachmessen. Die Live-Konfiguration
(liq+regime) läuft als Referenz **außer Konkurrenz** mit.

**Varianten (eine messe()-Familie):**
| # | Variante | Zweck |
|---|---|---|
| 0 | Basis liq (alle Tage) | Referenz + **Positivkontrolle**: zeigt sie die bekannte Kante nicht (Überschuss-t < 2), ist der Lauf »nicht messbar«, kein NEIN |
| 1 | liq + NUR Stress-Tage | **Test 1 der Familie** |
| 2 | liq + NUR ruhige Tage | **Test 2 der Familie** |
| 3 | liq + Placebo-»Stress« | Wächter |
| 4 | liq + Placebo-»ruhig« | Wächter |
| 5 | liq + regime (Live) | Referenz außer Konkurrenz |

**Testfamilie = 2** (Stress-Arm, Ruhig-Arm); Bonferroni-Schwelle aus der Maschine.

**Placebo (Auflage 3):** Tages-Hash ohne jeden Kursbezug — `frac(sin(JJJJMMTT · 12,9898) · 43758,5453) < p`,
p = gemessener Stress-Anteil der echten Achse (gleiche Randhäufigkeit, deterministisch).
Beide Placebo-Arme enthalten die Kante — geprüft wird die **Differenz** der Arme,
Sollwert null.

**Signalanteil VOR dem Lauf (Auflage 4):** Anteil Stress-Tage an allen Achsen-Tagen
wird gezählt und berichtet, **Gate: ≤ 35 %** (kanalUeber-Falle: wer auf der Hälfte
der Tage »Stress« sagt, trennt nichts) → sonst automatisch NEIN.

**Überlappungs-Ausweis (deskriptiv, ohne Urteil):** Anteil der Stress-Tage, die
zugleich SPY<EMA200-Tage sind (Anker wie in kapitulation.js) — damit sichtbar wird,
ob die Achse nur das alte Regime nachzeichnet.

## 3. JA-Kriterium (alles Folgende UND-verknüpft, vorab fixiert)

1. Signalanteil-Gate bestanden (≤ 35 %).
2. Positivkontrolle: Basis-Variante zeigt die Kante (Überschuss-t ≥ 2).
3. **Stress-Arm trägt:** Überschuss-t ≥ Bonferroni(2) und je-Signal-Netto > 0.
4. **Ruhig-Arm trägt nicht:** Überschuss-t < Bonferroni(2).
5. **Differenz trägt:** Welch-t aus (Tagesmittel, se) beider Arme ≥ 2 —
   Auflage 5: nur »Stress trägt« wäre die Wiederentdeckung der Kante, nicht die
   Validierung der Achse.
6. Placebo-Wächter: |Welch-t der Placebo-Differenz| < 2.

**Alles andere ist NEIN** — einschließlich »unterpowert« (delta80/MDE beider Arme und
der Differenz werden ausgewiesen; eine Achse, deren Trennung sich mit diesen Daten
nicht belegen lässt, wird nicht gebaut). Kein Tuning der Schwelle 1,5 nach dem Lauf;
eine andere Schwelle wäre eine neue Vorregistrierung.

## 4. Sperrliste

Kein Kanten-Urteil über Kapitulation selbst (sie ist validiert; hier geht es NUR um
die Achse) · kein Umbau von depot.js/Schwellen aus diesem Lauf (06 baut nach Befund,
nicht ich) · keine weiteren Achsen-Kandidaten in diesem Lauf (jede weitere Definition
wäre eine neue Registrierung mit eigener Familie) · Ergebnis nur in diesen Ordner.

*Gesehene Zahlen vor dieser Registrierung: Balkenformat/-anzahl (SPXL n=4478 ab 2008,
AAPL n=10078), Existenz der Strategie-Datei, KEINE Achsen- oder Ergebniswerte.*

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
