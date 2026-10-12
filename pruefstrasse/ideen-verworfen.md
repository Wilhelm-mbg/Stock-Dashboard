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

---

## 2026-10-11 (vierter Lauf) · `umkehr-nach-grossbewegung` — verworfen (Form und Auflösung)

**Regel (aus der Quelle, nicht erfunden):** Kudryavtsev, „Stock Price Dynamics Surrounding Company-Specific Shocks",
*Economic Studies* 30(7) (2021) 32–45. S&P-500-Werte 1993–2019, Tagesdaten von Yahoo. Ereignis: Tagesrendite |r| > 10 %
(Kappung bei 50 %, ≥ 250 Vortage). Abnormale Renditen nach dem Marktmodell gegen den S&P 500 (Schätzfenster Tag −261 bis −11).
Die Ereignisse werden nach der **5- bzw. 10-Tage-CAR vor dem Ereignis** in Quintile/Dezile **der ganzen Stichprobe** geteilt.
Kaufsignal: großer Kurssturz, dem das unterste Dezil der 5-Tage-CAR vorausging. Halten 21 / 42 / 63 Tage.

**Beleg (brutto):** nach Stürzen mit unterstem Vor-CAR-Dezil CAR(1…63) **+1,52 %**; Abstand oberstes gegen unterstes Dezil
−2,06 % (Anstiege) / −2,20 % (Stürze). Über **alle** großen Bewegungen ohne die Vorbedingung: Umkehr „nicht signifikant oder
knapp signifikant" (Tabelle 1). 4.699 Ereignisse in 27 Jahren (1.887 Anstiege, 2.812 Stürze). Kein Nettobeleg; der Autor
nennt die Regel „vielversprechend … in einem Markt ohne Kommissionen". Quellen:
https://www.iki.bas.bg/Journals/EconomicStudies/2021/2021-7/3_Andrey-Kudryavtsev_f-F.pdf (Volltext, §4–5). Dazu die
Vorarbeit Kudryavtsev, „The Availability Heuristic and Reversals Following Large Stock Price Changes", *Journal of Behavioral
Finance* 19(2) (2018) 159–176, https://ideas.repec.org/a/taf/hbhfxx/v19y2018i2p159-176.html (nur die Zusammenfassung frei:
Umkehr nach 2, 5 und 20 Tagen, wenn der S&P 500 am Ereignistag in dieselbe Richtung lief, keine Zahlen frei). Beide abgerufen
2026-10-11.

**Wogegen geprüft:** `pruefstrasse/register.json` gibt es noch nicht; Zweig `pruefstrasse-ergebnisse` existiert auf origin
nicht; `warteschlange/`: `donchian20-ausbruch-long`, `hochvolumen-praemie`; `ideen-verworfen.md`: Trendfaktor, Kurzfrist-Momentum
mit Umschlag, Sprung-Fortsetzung (Jiang & Zhu). Im Belegstand nächstverwandt: **Kapitulation V2** (Kurssturz mit Volumen, 60m,
in der behaupteten Größe zurückgewiesen 03.10.), die **Dip-Familie** der Minutenstudie (NEIN), die **Kurzfrist-Umkehr 5 Tage**
im Querschnitt (15.09., +0,151 Pp je Woche, t 1,19). Die Regel ist eine Ereignis-Umkehr auf Tagesbasis mit Vorbedingung — neu,
aber am Rand der Dip-/Umkehr-Familie.

**Warum nicht eingestellt:**

1. **Form.** Die Tag-Form sieht eine Reihe allein (`adapter/tag.js`, Sicht ohne Marktreihe). Beide Bedingungen der Quelle brauchen
   den S&P 500: die Vor-CAR (Marktmodell oder marktbereinigt) und, für die Fassung von 2018, das Vorzeichen des Markttags. Die
   Dezilgrenzen der Vor-CAR sind über die **ganze** Stichprobe 1993–2019 gezogen — als Regel ein Blick nach vorn; feste Schwellen
   an ihrer Stelle wären erfunden (Regel 2). Ohne die Bedingungen bleibt die unbedingte Umkehr, die die Quelle selbst als
   „nicht oder knapp signifikant" führt. Haltedauer 63 Tage liegt außerdem über dem Höchstwert 60 der Tag-Form.
2. **Auflösung, auch wenn die Form ginge.** Panel 2016–2022, Klassen 1–3: im Mittel ≈ 809 Reihen je Tag (Zählung des PM zur
   `hochvolumen-praemie`, 1.403.463 Zeilen an 1.735 Tagen). S&P 500 lieferte 0,35 Ereignisse je Wert und Jahr; die breitere,
   schwankungsreichere Menge grob 0,5–1 → 2.800–5.600 Ereignisse in der Entdeckung, davon Stürze im untersten Vor-CAR-Dezil
   **≈ 170–340**. Streuung einer 21-Tage-Rendite nach einem 10-%-Sturz ≈ 15–20 Pp → se ≈ 1,0–1,3 Pp, **MDE₈₀ ≈ 2,9–3,6 Pp**
   (H21); bei 63 Tagen σ ≈ 28 Pp → MDE₈₀ ≈ 4–6 Pp. Behauptete Größe: +1,52 Pp (63 Tage), bei 21 Tagen kleiner. **MDE₈₀ liegt
   über dem Doppelten der Behauptung** — weder Bestätigung noch Größen-Ausschluss möglich.

**Urteil vorab:** nicht messbar (Form fehlt, Auflösung fehlt) — kein Nein. Wieder vorlegen, wenn die Sicht der Tag-Form eine
Marktreihe (SPY) mitliefert **und** eine Fassung mit festen Schwellen aus einer Quelle vorliegt; die Auflösung bleibt auch dann
das Hindernis, solange das Panel erst 2016 beginnt.

**Mitgeprüft und verworfen in diesem Lauf:**
- Gutierrez, „Reversal of 3-day losers and continuation of 3-day winners on the NASDAQ", *Review of Financial Economics* 30 (2016)
  68–73, https://ideas.repec.org/a/eee/revfin/v30y2016icp68-73.html: Rangfolge der drei schlechtesten aus 200 Großwerten. Das ist
  eine Querschnittsregel und eine Abwandlung der gemessenen Kurzfrist-Umkehr (Regel 1).
- IBS < 0,2 (Pagonidis 2014; Nachbau https://arxiv.org/html/2306.12434v1): belegt nur für Länder-ETFs, Einstieg zum Schluss und
  ein Tag Haltedauer. Die Tag-Form steigt zur Folgeeröffnung ein; für Einzelaktien liegt kein Beleg vor.
- Plastun, Sibande, Gupta & Ji, „Price effects after one-day abnormal returns and crises", *RIBAF* 70 (2024),
  https://ideas.repec.org/a/eee/riibaf/v70y2024ipas0275531924001016.html: die Autoren sagen selbst „schwach, schlägt den Markt
  nicht" und arbeiten auf Indexebene.
- Aktiensplits als Ereignis: die Sicht liefert bereinigte Kurse, deshalb ist ein Split dort unsichtbar. Das hängt am offenen
  Auftrag `sicht.roh`.
