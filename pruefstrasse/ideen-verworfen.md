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
