# Verworfene Ideen der Prüfstraße

Vom Ideen-Agenten vor dem Einstellen geprüft und **nicht** in die Warteschlange gestellt — meist,
weil die erwartete Größe unter dem liegt, was die Prüfstraße mit den vorhandenen Daten auflösen
kann (`wiki/aufloesungswand.md`). Alles Simulation, keine Anlageberatung. Neue Einträge unten anhängen.

---

## 2026-10-11 · `trendfaktor-gleitende-mittel` — verworfen (Datenlänge und Auflösung)

**Regel (aus der Quelle, nicht erfunden):** Han, Zhou & Zhu, „A trend factor: Any economic gains from
using information over investment horizons?", *Journal of Financial Economics* 122 (2016) 352–375.
Für jede Aktie elf gleitende Mittel der Schlusskurse über 3, 5, 10, 20, 50, 100, 200, 400, 600, 800
und 1.000 Handelstage, je durch den Schlusskurs geteilt; monatlich eine Querschnittsregression der
Monatsrenditen auf diese elf Größen; die erwartete Rendite je Aktie ist das Produkt aus ihren
heutigen Größen und dem **Mittel der Koeffizienten der letzten 12 Monate**. Kauf des obersten
Quintils, gleich gewichtet, monatlich umgeschichtet.

**Beleg:** 1926–2014, alle US-Stammaktien: Long-Short brutto +1,63 % je Monat, Long-Seite +1,93 %
gegen Markt +0,62 %; Umschlag rund 65,6 % je Monat, Kostengrenze (break-even) 1,24 % je Umlauf.
Quellen: https://ideas.repec.org/a/eee/jfinec/v122y2016i2p352-375.html und die Zusammenfassung
https://www.cxoadvisory.com/technical-trading/trend-factor-and-stock-returns (beide abgerufen
2026-10-11). Die Kostenaussage ist eine Kostengrenze, kein Nettolauf in liquiden Werten.

**Wogegen geprüft:** nicht im Register (`pruefstrasse/register.json` existiert noch nicht), nicht in
`warteschlange/` (dort nur `donchian20-ausbruch-long`), keine Zweige `pruefstrasse-ergebnisse` /
`pruefstrasse-ideen` auf origin. Im Belegstand verwandt, aber nicht gleich: Momentum 12-1
(Rückblick 04.10., Trend reiten 16.09., Mehrfaktor 23.09.), Kurzfrist-Umkehr 5 Tage und nahe am
52-Wochen-Hoch (Querschnitt 15.09.), Trendfilter auf SPY (05.10.), Donchian-/Kanal-Linien
(Trendkanal 09.09.). Der Trendfaktor bündelt mehrere dieser Horizonte in einer Schätzung — er wäre
neu, aber zu großen Teilen deren Kombination.

**Warum nicht eingestellt (Machbarkeit vor der Wand):**

1. **Datenlänge.** Die Tagesdaten beginnen am 04.01.2016 (`konfig.json`). Das längste Mittel braucht
   1.000 Handelstage (≈ Ende 2019), die Koeffizienten noch 12 Monate dazu → erstes gültiges Signal
   ≈ Januar 2021. Die Entdeckung endet am 30.12.2022: **rund 24 Signalmonate**. Die 1.000-Tage-Linie
   zu kürzen hieße Parameter erfinden.
2. **Auflösung.** Im Querschnitt-Prüfstand (Teil 2, 15.09.2026) lag die MDE₈₀ eines Dezils gegen das
   Universum bei monatlicher Umschichtung über ~115 Monate bei **0,97–1,76 Pp je Monat**. Mit 24
   Monaten wächst sie um √(115/24) ≈ 2,2 auf **≈ 2,1–3,9 Pp je Monat**; Tor 1 verlangte das Vierfache
   der Bestätigungs-MDE (Bestätigung 2023–2026, ≈ 44 Monate: ≈ 1,6–2,9 Pp) — **6 bis 12 Pp je Monat**.
3. **Erwartete Größe.** Selbst der Bruttovorsprung der Long-Seite in der Quelle (+1,31 Pp je Monat
   gegen den Markt, alle US-Aktien inklusive Kleinstwerte, 1926–2014) liegt unter der Entdeckungs-MDE
   und weit unter Tor 1; in liquiden Werten nach 2016 ist er nicht belegt und eher kleiner. Auch die
   Korb-Form (Rang gegen 200 Zufallsbücher) konnte im Rückblick schon +7,6 Pp p. a. nicht vom Zufall
   trennen.

**Urteil vorab:** strukturell blind — „nicht messbar", kein Nein. Wieder vorlegen erst, wenn die
Tagesdaten vor 2016 zurückreichen (mindestens 2008, damit die Entdeckung ≥ 8 Jahre Signale hat).

---

## 2026-10-11 (zweiter Lauf) · `kurzfrist-momentum-umschlag` — verworfen (Auflösung der Korb-Form)

**Regel (aus der Quelle, nicht erfunden):** Medhat & Schmeling, „Short-term Momentum", *Review of Financial
Studies* 35(3) (2022) 1480–1526. Monatsende: unabhängige Doppelsortierung nach der Rendite des Vormonats und dem
Umschlag (Stückumsatz/Aktienzahl) des Vormonats, NYSE-Grenzen; gekauft wird das oberste Rendite-Dezil **im obersten
Umschlag-Dezil** (bei Umschlag-Schwachen kehrt sich der Vormonat um, bei Umschlag-Starken setzt er sich fort), die
letzten drei Tage des Bildungsmonats ausgelassen („excl. EOM"), wertgewichtet, monatlich umgeschichtet.

**Beleg nach Kosten:** 1963–2018, US-Stammaktien. Long-Short brutto +1,37 % je Monat (t 4,74); nach Kosten
(Umschlag × halbe Geld-Brief-Spanne aus CRSP, ab 1983) **+1,00 %** (t 3,47); mit EOM-Auslassung netto +1,45 %.
Für den handelbaren Teil: **Großwerte (über NYSE-Median) netto +0,62 % je Monat (t 3,14), Megawerte +0,59 % (t 3,10)**,
Kosten dort 0,13–0,15 % je Monat; größte 500 Werte brutto +0,42 % (t 4,91). Die Autoren sehen keine Teilperiode,
die den Effekt allein trägt. Quelle: https://openaccess.city.ac.uk/id/eprint/31278/1/MS_short_term_mom_v27.pdf
(angenommene Fassung, Tabellen III und VII, §3.2), https://doi.org/10.1093/rfs/hhab055 — abgerufen 2026-10-11.

**Wogegen geprüft:** `pruefstrasse/register.json` gibt es noch nicht; `warteschlange/` enthält nur
`donchian20-ausbruch-long`; Zweig `pruefstrasse-ergebnisse` existiert auf origin nicht; auf `pruefstrasse-ideen` steht
nur `trendfaktor-gleitende-mittel` (verworfen). Im Belegstand nächstverwandt: **K4 „Umsatzschock mit Richtung"**
(Querschnitt 15.09.2026: Ein-Tages-Umsatz/Median(60) × Vorzeichen der Tagesrendite, Woche −0,17 / t −2,36, Monat
−0,45 / t −1,65) — anderes Signal (ein Tag statt ein Monat, Vorzeichen statt Rendite-Rang, keine Doppelsortierung),
aber dieselbe Familie „Umsatz bestimmt, ob ein Kursschritt nachläuft". Ferner Kurzfrist-Umkehr 5 Tage (15.09.,
univariat, Gegenrichtung) und Momentum 12-1 (Trend reiten 16.09., Rückblick 04.10.). Keine Wiederholung, aber
kein unbesetztes Feld.

**Warum nicht eingestellt (Machbarkeit vor der Wand):**

1. **Form.** Die Regel ist eine Querschnitts-Rangfolge (Doppel-Dezil über alle Werte) und passt nur in die
   Korb-Form; die Tag-Form sieht eine Reihe allein und könnte die Dezilgrenzen nur durch erfundene feste
   Schwellen ersetzen (Regel 2 verbietet das).
2. **Erwartete Größe für einen Privatanleger (long only gegen SPY):** die Quelle belegt Long-Short. Die Long-Seite
   allein gegen den Markt trägt grob die Hälfte: **≈ 0,3 Pp je Monat ≈ 0,9 Pp je 63-Tage-Periode ≈ 3–4 Pp p. a.**
   netto der Quellkosten (vor den 20 Bp je Seite der Prüfstraße bei ~85 % Monatsumschlag, die allein ≈ 0,34 Pp je
   Monat kosten — die Kante ist damit eher **null bis negativ**).
3. **Auflösung der Korb-Form:** Im Rückblick 04.10.2026 hatte der Abstand zu SPY je 63-Tage-Periode einen
   Standardfehler von **3,07 Pp** (breiter Korb, 20 Perioden) bzw. **4,94 Pp** (187 Umsatzstärkste). Die Entdeckung
   2016–2022 hat ≈ 27 Perioden → se ≈ 2,6–4,3, **MDE₈₀ ≈ 7–12 Pp je Periode**; Tor 1 (4 × Bestätigungs-MDE, ≈ 15
   Perioden 2023–2026) verlangte **≈ 40–60 Pp je Periode**. Die erwartete Größe liegt **Faktor 8–13 unter der MDE**
   — auch die Gegenprobe mit 200 Zufallsbüchern trennt das nicht (der Rückblick konnte +7,6 Pp p. a. nicht vom
   Zufall trennen).

**Mitgeprüft und aus anderem Grund verworfen:** Sprung-Fortsetzung (Jiang & Zhu, „Information shocks and
short-term market underreaction", *JFE* 124 (2017) 43–64, https://ideas.repec.org/a/eee/jfinec/v124y2017i1p43-64.html,
abgerufen 2026-10-11) — wäre als Tag-Form auflösbar (viele Ereignisse, Haltedauer 20–60 Tage), aber **kein
Nettobeleg nach Kosten gefunden** (Regel 2); Wiedervorlage, sobald ein Nachbau nach Kosten vorliegt.

**Urteil vorab:** strukturell blind in der Korb-Form — „nicht messbar", kein Nein. Wieder vorlegen, wenn die
Prüfstraße eine Querschnittsform mit Tagesclusterung über Einzelwerte bekommt (Auflösung wie im Querschnitt-
Prüfstand) oder die Tagesdaten vor 2016 zurückreichen.
