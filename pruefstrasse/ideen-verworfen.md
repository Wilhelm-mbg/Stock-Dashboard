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

---

## 2026-10-14 · kein Kandidat — Vorrat Nr. 1, 3, 4 nachgeprüft, nichts einstellbar

**Vorrat.** Im Vorrat steht kein Eintrag mit dem Urteil „einstellbar“ und leerer Spalte „Stand“ mehr. Nr. 2 ist am 13.10. eingestellt
worden. Nr. 1, 3 und 4 hängen an Größen, die erst im Volltext stehen sollten. Diese drei habe ich nachgesehen:

- **Nr. 3 `umkehr-uebernachtsprung` — verworfen.** Volltext gelesen: Bahcivan, Dam & Gonenc, „New Avenues in Expected Returns:
  Investor Overreaction and Overnight Price Jumps in US Stock Markets“, FEBRI Research Report 2023002-EEF (Februar 2023),
  https://www.rug.nl/feb/research/febri-research-reports/docs-2023/2023002-eef-def.pdf (abgerufen 2026-10-14). Stichprobe: CRSP,
  Juni 1993 bis Dezember 2021. Sprungtest: Lee-Mykland mit K = 16; α steht nicht im Text.
  (1) **Die Studie nennt keine Größe als Zahl.** Die Umkehr gibt es nur als Grafik (Figure 1). Sonst stehen da Fama-MacBeth-Koeffizienten
  von −0,80 bzw. −0,37 auf die kumulierte Sprungrendite; t sinkt von 3,70/5,76 bis Tag 5 auf 3,30/2,26.
  (2) **Tag 1 ist die Intraday-Rendite des Sprungtags selbst** („post-jump intraday return … at the end of the first day“, Table 2).
  Die Tag-Form steigt aber erst zur Folgeeröffnung ein. Diesen Teil hat der Vorrat schon unter „Eröffnungslücke → Umkehr am
  selben Tag“ ausgeschlossen.
  (3) **Die eigene Handelsstrategie der Autoren verliert** (Table 7, FF4-Alpha, 1 Monat): D1 long −0,2 % (t −0,71), D1−D10
  −0,8 % (t −2,26). Die Autoren schreiben selbst „short-term market phenomena“.
  Damit bleibt für die Tag-Form keine belegte Größe ab Tag 2, gegen die eine MDE80 stehen könnte.
- **Nr. 4 `sprung-fortsetzung` (Jiang & Zhu 2017) — verworfen.** Ein Arbeitspapier im Volltext ist nicht frei zu finden. Die Regel der
  Quelle sortiert monatlich in Dezile (Querschnitt), gehört also in die Korb-Form, und die löst nur 7–12 Pp je Periode auf. Der
  unabhängige Nachbau nach 2010 ist dieselbe Groninger Studie (Table 7, Überschrift „relative strength“, Übernacht-Sprünge 1993–2021):
  D10 long +0,4 % FF4-Alpha je Monat (t 1,49), D10−D1 +0,4 % (t 1,22) — **nicht signifikant**. Auch eine Long-Seite von 0,4 Pp je
  20 Tage läge unter der halben MDE80 der Tag-Form (≈ 1,0 Pp bei H20, siehe Vorrat).
- **Nr. 1 `umkehr-grossbewegung-marktgleich` — zurückgestellt.** Der Volltext von Kudryavtsev (JBF 2018) ist weiter nicht frei. Gefunden
  habe ich nur das Abstract, die IDEAS-Seite und das Kapitel bei World Scientific, alle ohne Zahl. Laut Vorrat-Urteil wird der Eintrag ohne
  Zahl nicht eingestellt.

**Eigene Suche.** Gesucht habe ich nach Ereignisregeln mit festen Schwellen aus Quellen nach 2010, die die Panel-Sicht trägt (o, c, v,
roh, markt, datum). Keine war neu und auflösbar:
- **Dividendenmonat:** geht nicht über roh/c, weil das Panel nur um Splits und Abspaltungen bereinigt, nicht um Bardividenden
  (`studien/querschnitt-pruefstand-2026-09-13/ERGEBNIS-KUNST.md` Z. 51).
- **Persistence or reversal? Abnormal trading volume** (European Journal of Finance 2024): Umsatzregel, Abwandlung von
  `hochvolumen-praemie` (Regel 1).
- **Graziani, „Time Series Reversal: A Payment Cycle Friction“** und **Boyarchenko et al., „The Overnight Drift“** (NY Fed SR 917): beide
  marktweit (Topf ≡ 0) bzw. Übernacht-Haltung, die die Tag-Form nicht kennt.
- **Akbas, Boehmer, Jiang & Koch (JFE 2022):** monatlicher Querschnitt (Korb), Übernacht-/Tag-Zerlegung — Form fehlt (wie Vorrat Nr. 9).

**Wogegen geprüft:** `register.json` (donchian20-ausbruch-long H5/H10/H20), `erledigt/donchian20-ausbruch-long`. Warteschlange:
donchian20-ausbruch-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, vor-fomc-long,
umkehr-nach-vorzeichenserie. Dazu `vorrat/` (nur LIESMICH), diese Datei, der Vorrat Nr. 1–17 und dessen Liste „bewusst nicht aufgenommen“.

---

## 2026-10-14 (zweiter Lauf) · kein Kandidat — Vorrat Nr. 1 verworfen, eigene Suche ohne auflösbare Tagesregel

**Vorrat.** Weiter kein Eintrag mit Urteil „einstellbar“ und leerer Spalte „Stand“. Nr. 1 war am Vormittag nur zurückgestellt, weil der
Volltext von Kudryavtsev (JBF 2018) nicht frei ist. Das ist so geblieben. Gelesen habe ich jetzt den Volltext des **unabhängigen Nachbaus
nach 2010**: Matos, Pacheco & Lobão, „Availability heuristic and reversals following large stock price changes: Evidence from the
FTSE 100“, *Quantitative Finance and Economics* 6(1) (2022) 54–82, DOI 10.3934/QFE.2022003,
https://www.aimspress.com/aimspress-data/qfe/2022/1/PDF/QFE-06-01-003.pdf (abgerufen 2026-10-14). Er baut die Regel der Quelle mit
denselben drei Ereignis-Proxys nach (|SR| > 8 / 10 %, |SR| > 3σ / 4σ über 250 Tage, |AR| > 8 / 10 % Marktmodell). Ergebnis: „no significant
evidence of price overreaction for both price decreases and increases“. Für die Long-Seite unserer Regel (Sturz bei fallendem Markt) zeigt
Tabelle 6 bei |SR| > 10 % und MR < 0 eine mittlere AR über Tag 1–5 von **−0,45 %** (große Werte, 53 Ereignisse) bzw. **−0,18 %**
(kleine, 98), über Tag 1–20 −0,06 % / +0,16 %, alles nicht signifikant. Das ist eher Fortsetzung als Umkehr. Tabelle 7 (4σ, MR < 0, 153/216
Ereignisse): Tag 1–5 −0,14 % / −0,04 %. **Nr. 1 ist damit verworfen.** Der einzige frei lesbare Nachbau nach 2010 hat in liquiden Werten
keine Größe, gegen die eine MDE80 (≈ 3 / 4,6 / 9 Pp bei H2 / H5 / H20 laut Vorrat) stehen könnte. Wiedervorlage nur, wenn der Volltext der
Quelle doch auftaucht **und** ein US-Nachbau nach 2010 eine Umkehr ≥ 2,3 Pp (H5) zeigt.

**Eigene Suche.** Gesucht habe ich Ereignisregeln mit festen Schwellen, Haltedauer ab einem Tag und einem Beleg nach 2010, die die
Panel-Sicht trägt (o, c, v, roh, markt, datum). Gefunden habe ich nichts, das neu, belegt und auflösbar wäre:
- **Große Bewegung nahe dem 52-Wochen-Hoch/-Tief (Anker-Drift; Brady & Premti 2019 nach einer koreanischen Studie 2023):** die Quelle
  selbst war nicht auffindbar, und der koreanische Nachbau (KOSPI) ist kein US-Beleg. Die Long-Seite (Anstieg ≥ 10 % auf ein neues Hoch)
  ist außerdem eine Abwandlung von Ausbruch/52-Wochen-Hoch (Donchian 20/55, Querschnitt 15.09.) und von `grossanstieg-ohne-umsatz`
  (Regel 1).
- **Kudryavtsev 2017, große Bewegungen vor Feiertagen → Drift** (https://rfb.ase.ro/vol9-2017/dec1a.asp): rund 9 Vorfeiertage im Jahr mal
  wenige Bewegungen über 10 % je Tag ergeben in der Entdeckung grob 100–300 Ereignisse. Die MDE80 (H5 ≈ 4–6 Pp) liegt weit über jeder
  plausiblen Größe.
- **Kurssturz mit hohem Umsatz → Umkehr (Kudryavtsev 2019, Gegenseite von `grossanstieg-ohne-umsatz`):** im Vorrat als Tagesfassung der
  gemessenen Kapitulation ausgeschlossen (Regel 1).
- **Tägliche Gewinner/Verlierer (Atkins & Dyl, Cox & Peterson):** vor 2010. Nach Spanne und Kosten nicht signifikant; der einzige neue
  Nachbau ist der oben genannte (null).

**Wogegen geprüft:** `register.json` (donchian20-ausbruch-long H5/H10/H20), `erledigt/donchian20-ausbruch-long`. Warteschlange:
donchian20-ausbruch-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, umkehr-nach-vorzeichenserie, vor-fomc-long.
Dazu `vorrat/` (nur LIESMICH), diese Datei (alle Einträge bis zum ersten Lauf vom 14.10.), der Vorrat Nr. 1–17, dessen Liste „bewusst
nicht aufgenommen“ und `wiki/belegstand.md`. Der Zweig `origin/pruefstrasse-ergebnisse` fehlt.

**Was freischalten würde (unverändert):** Ex-Tage je Reihe (Vorrat Nr. 5), Form-4-Tafel (Nr. 7), Querschnitts-Adapter mit Tagesclusterung
(Nr. 9–12). Ohne eine dieser Erweiterungen ist der Vorrat an belegten, auflösbaren Tagesregeln für die Panel-Sicht vorerst leer.

---

## 2026-10-15 · kein Kandidat — Vorrat leer, Optionsverfallswoche und Makro-Bekanntgabetage verworfen (Auflösung)

**Vorrat.** Kein Eintrag mit Urteil „einstellbar“ und leerer Spalte „Stand“ (Nr. 1–4 erledigt, Nr. 5–12 und 16–17 „Form fehlt“ bzw. „zu
klein“, Nr. 13–15 eingestellt). Deshalb eigene Suche, diesmal in der Lücke, die der Vorrat ausdrücklich offen ließ („Wochentagseffekte,
Optionsverfall …: nicht recherchiert“). Der Bewertungsmodus `zeit` (Nr. 118) ist inzwischen da, die Form wäre also erfüllt — beide Ideen
scheitern an der Auflösung, nicht an der Form.

- **`optionsverfall-woche-long` — verworfen (MDE80 > 2 × Behauptung).** Quelle: Stivers & Sun, „Returns and option activity over the
  option-expiration week for S&P 100 stocks“, *Journal of Banking & Finance* 37(11) (2013) 4226–4240,
  https://ideas.repec.org/a/eee/jbfina/v37y2013i11p4226-4240.html (abgerufen 2026-10-15; Volltext nicht frei). Zahlen nur aus Sekundärquellen:
  Arbeitspapier 2010 (28 optionsstarke Großwerte, 1996–2008) Woche mit dem dritten Freitag **+0,45 %** gegen +0,12 % in den übrigen Wochen,
  also **≈ +0,33 Pp je Woche** (https://cxoadvisory.com/calendar-effects/option-expiration-week-stock-return-drill-down); Quantpedia nennt aus
  Tab. 3 der JBF-Fassung +0,528 % je Verfallswoche roh, ohne Vergleichswoche (https://quantpedia.com/screener/details/102). Die größeren Spannen
  (0,68–0,83 Pp) gelten nur für Wochen mit hohem Options-/Aktienumsatz — Optionsumsätze hat die Sicht nicht. Kein Nachbau nach 2010 mit Zahl
  gefunden. **Rechnung:** marktweit (alle Reihen derselben Woche) → Bewertung `zeit`, je Verfallswoche ein Cluster: 12 × 7 = **84 Cluster**
  in 2016–2022 (≈ 800 Reihen je Signaltag, ≈ 67.000 Trades, aber Auflösung an den 84 Wochen). σ der 5-Tage-Rendite des gleichgewichteten
  liquiden Markts = 1,0–1,4 Pp × √5 = 2,2–3,1 Pp (Tagesstreuung wie in `warteschlange/monatswende-long/REGEL.md`) → se = 0,24–0,34 Pp →
  **MDE80 ≈ 0,68–0,96 Pp (H5)** gegen eine Behauptung von **0,33 Pp**: weder Größe ≥ MDE80 noch MDE80 ≤ 2 × Behauptung (0,66). Brutto-Hürde
  (3 × Kassa-Hürde Klasse 1 = 0,255 Pp) wäre erfüllt. Wiedervorlage nur mit Optionsumsatz je Reihe (dann Topf-Form: optionsstarke gegen
  optionsschwache Werte derselben Woche, Spanne 0,68 Pp) oder mit einem Nachbau nach 2010, der ≥ 0,5 Pp je Woche zeigt.
- **Makro-Bekanntgabetage (Savor & Wilson, „How Much Do Investors Care About Macroeconomic Risk?“, JFQA 48(2) (2013) 343–375,
  https://ideas.repec.org/a/cup/jfinqa/v48y2013i02p343-375_00.html, abgerufen 2026-10-15) — verworfen (Größe).** Inflation, Arbeitsmarkt, FOMC:
  **+11,4 Bp** am Bekanntgabetag gegen +1,1 Bp an den übrigen Tagen (1958–2009; NBER-Fortschreibung bis 2023: 10,7 gegen 0,9 Bp). Der
  Unterschied von ≈ 0,10 Pp je Tag liegt **unter dem Dreifachen jeder Kassa-Hürde** der Klassen 1–3 (0,255 / 0,195 / 0,135 Pp) — Regel 2
  verlangt dann einen Netto-Beleg, den es nicht gibt. Auflösung zudem zu grob: ≈ 30 Termine im Jahr → ≈ 210 Cluster, σ 1,0–1,4 Pp →
  MDE80 ≈ 0,19–0,27 Pp (H1) > 2 × 0,10. Der FOMC-Teil ist ohnehin als `vor-fomc-long` eingestellt.
- **Wochentag (Montag/Wochenende):** nach 2010 klein und uneinheitlich, je Tag weit unter der dreifachen Hürde; nicht weiter verfolgt.

**Wogegen geprüft:** `register.json` (donchian20-ausbruch-long H5/H10/H20), `erledigt/donchian20-ausbruch-long`. Warteschlange:
donchian20-ausbruch-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, umkehr-nach-vorzeichenserie, vor-fomc-long.
`vorrat/` (nur LIESMICH), diese Datei bis zum zweiten Lauf vom 14.10., der Vorrat Nr. 1–17 samt „bewusst nicht aufgenommen“,
`wiki/belegstand.md` (Optionsverfall dort nicht gemessen). Der Zweig `origin/pruefstrasse-ergebnisse` fehlt.

**Was freischalten würde (unverändert, ergänzt):** Ex-Tage je Reihe (Vorrat Nr. 5), Form-4-Tafel (Nr. 7), Querschnitts-Adapter mit
Tagesclusterung (Nr. 9–12) — und neu **Optionsumsatz je Reihe** (macht die Optionsverfallswoche als Querschnittsregel in der Topf-Form messbar).

---

## 2026-10-16 · kein Kandidat — Vorrat leer, Split-Ex-Tag und Residual-Umkehr großer Werte verworfen

**Vorrat.** Kein Eintrag mit Urteil „einstellbar“ und leerer Spalte „Stand“ (Nr. 1–4 erledigt, Nr. 5–12 und 16–17 „Form fehlt“ bzw. „zu
klein“, Nr. 13–15 eingestellt). Deshalb eigene Suche, diesmal gezielt nach dem, was `sicht.roh` neu sichtbar macht: der Quotient
`roh(j)/c(j)` springt am Ex-Tag eines Splits (das Panel bereinigt nur Splits und Abspaltungen), am Tag i ohne Blick nach vorn erkennbar.

- **`split-extag-long` — verworfen (Beleg nach 2010 fehlt, Effekt verschwunden, Auflösung).** Ex-Tag-Prämie: Kadapakkam, Krishnamurthy & Tse,
  „Stock Splits, Broker Promotion, and Decimalization“, *JFQA* 40(4) (2005) 873–895, https://ideas.repec.org/a/cup/jfinqa/v40y2005i04p873-895_00.html
  (abgerufen 2026-10-16): „significant positive abnormal returns around the ex-date during the 1/8th pricing period, **but not in the decimal
  pricing period**“ — die Quelle selbst sagt, dass der Effekt seit 2001 fehlt. Nach dem Ex-Tag: Boehme & Danielsen (*Financial Review* 42(4)
  (2007), https://ideas.repec.org/a/bla/finrev/v42y2007i4p485-506.html, 1950–2000): positive Renditen nach der Ankündigung „do not persist after
  the actual date of the stock split“; Chan, Li & Lin (*JBF* 2019, laut Suchzusammenfassung): Drift kurzlebig, an Bilanzpolitik gebunden, Markt
  unklar. Kein US-Nachbau nach 2010 mit Zahl gefunden. Die Tag-Form steigt außerdem erst zur Eröffnung nach dem Ex-Tag ein und verpasst den Ex-Tag
  selbst. **Rechnung:** Vorwärts-Splits in den Klassen 1–3 grob 20–30 je Jahr → ≈ 150–200 Ereignisse 2016–2022 (< 0,1 je Tag), σ einer
  5-Tage-Einzelrendite ≈ 5 Pp → se ≈ 0,38 Pp → **MDE80 ≈ 1,1 Pp (H5)** gegen eine behauptete Größe nach dem Ex-Tag von ≈ 0. Ankündigungstage
  (dort lag die Drift) sieht die Sicht nicht.
- **Residual-Umkehr großer Werte am Folgetag (Collin-Dufresne & Daniel, https://business.columbia.edu/sites/default/files-efs/pubfiles/11568/str1.pdf;
  Hameed, Lof & Suominen, „slow trading“, AEA 2017, https://topcat.aeaweb.org/conference/2017/preliminary/paper/D7FhZBRb; beide abgerufen 2026-10-16)
  — verworfen (Regel 1, Größe).** Stichprobe bis 2014; große Werte zeigen dort „little predictable idiosyncratic component“, Halbwertszeit des
  vorübergehenden Teils ≈ 2,5 Tage. Das ist die gemessene Kurzfrist-Umkehr (Querschnitt 15.09., t 1,19) bzw. `umkehr-nach-vorzeichenserie` in
  anderer Gestalt, und die Größe je Tag liegt unter dem Dreifachen der Kassa-Hürde.

**Wogegen geprüft:** `register.json` (donchian20-ausbruch-long H5/H10/H20), `erledigt/donchian20-ausbruch-long`. Warteschlange:
donchian20-ausbruch-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, umkehr-nach-vorzeichenserie, vor-fomc-long.
`vorrat/` (nur LIESMICH), diese Datei bis zum Lauf vom 15.10., der Vorrat Nr. 1–17, `wiki/belegstand.md` (Splits dort nicht gemessen; „Aktiensplits“
in dieser Datei am 11.10. nur wegen fehlendem `roh` zurückgestellt). Der Zweig `origin/pruefstrasse-ergebnisse` fehlt.

**Was freischalten würde (unverändert):** Ex-Tage je Reihe (Vorrat Nr. 5), Form-4-Tafel (Nr. 7), Querschnitts-Adapter mit Tagesclusterung
(Nr. 9–12), Optionsumsatz je Reihe; für Splits zusätzlich die **Ankündigungstage** (8-K), weil die Literatur die Drift dort misst, nicht am Ex-Tag.

---

## 2026-10-17 · kein Kandidat — Vorrat leer, Tauziehen-Intensität, Sturz-Fortsetzung und Korea-Umkehr verworfen

**Vorrat.** Kein Eintrag mit Urteil „einstellbar“ und leerer Spalte „Stand“. Nr. 1–4 sind erledigt, Nr. 5–12 und 16–17 stehen auf „Form
fehlt“ bzw. „zu klein“, Nr. 13–15 sind eingestellt. Die Spalte „Stand“ bleibt deshalb unverändert. Eigene Suche, diesmal nach Regeln aus
o/c allein (Übernacht gegen Tag) und nach neuen Nachbauten der Großbewegungs-Familie.

- **`tauziehen-intensitaet` — verworfen (Korb-Form, Auflösung).** Quelle: Akbas, Boehmer, Jiang & Koch, „Overnight returns, daytime reversals,
  and future stock returns“, *JFE* 145(3) (2022) 850–875, https://academicnewsletter.sufe.edu.cn/info/355173. Zahlen nach
  https://cxoadvisory.com/?p=32204 (beide abgerufen 2026-10-17). US-Aktien 05/1993–12/2017. Das Signal ist der Monatsanteil der Tage mit
  „negativer Tagesumkehr“ (Übernacht positiv, Tag negativ), geteilt durch das 12-Monats-Mittel. Gebildet wird ein **Dezil gegen Dezil**,
  gleichgewichtet: **+0,92 % je Monat** Long-Short brutto, bei großen Werten nur **+0,43 %**. o/c trägt die Sicht zwar, aber die Quelle
  sortiert im Querschnitt; eine feste Schwelle für die Tag-Form wäre erfunden (Regel 2). Als Korb kommt man auf ≈ 2,8 Pp je 63-Tage-Periode
  Long-Short (Long-Seite allein kleiner) gegen eine Auflösung von 7–12 Pp (`aufloesungswand.md`, Nachtrag 11.10.). Nachbauten:
  G7 nur USA/Kanada, China null (laut Suchzusammenfassung). Verwandt mit Vorrat Nr. 9 (Lou/Polk/Skouras, „Form fehlt“). Wiedervorlage mit dem
  Querschnitts-Adapter mit Tagesclusterung.
- **Fortsetzung nach großem Tagessturz (Short), S&P 100 2018–2025, Schwellen 2/4/6/8 % — verworfen (Beleg, Regel 1).** Nur aus einer
  Suchzusammenfassung bekannt: „continued momentum following negative shocks“, abnormal schwach und je Jahr instabil, ohne Kosten. Die Quelle
  war nicht auffindbar, also gibt es keine Größe. Zugleich ist es die Gegenrichtung von Vorrat Nr. 1, und dort fand der gelesene Nachbau
  (Matos et al. 2022) nach Stürzen nur −0,45 / −0,18 % über Tag 1–5, n. s. Das liegt unter jeder MDE80 der Ereignisgröße (≈ 4,6 Pp H5 bei
  ≈ 1.000 Ereignissen).
- **Umkehr nach Kursschock mit Umsatz (Lee, Park & Son, *Journal of Distribution Science* 21(3) (2023) 93–100, DOI 10.15722/jds.21.03.202303.93,
  Volltext gelesen, abgerufen 2026-10-17) — verworfen.** Grundlage sind KOSPI-Handelswerte 2004–2022, also kein US-Beleg. Bedingt wird auf den
  Umsatz am Ereignistag; Umsatzregeln sind durch `hochvolumen-praemie` und `grossanstieg-ohne-umsatz` sowie die gemessene Kapitulation
  abgedeckt (Regel 1).
- **Relative Stärke an Markt-Sturztagen (Wert steigt, Markt fällt → Fortsetzung):** Kudryavtsev (2018, Vorrat Nr. 1) findet bei gegenläufigem
  Markt „nonsignificant price drifts“. Damit fehlt ein Beleg, nicht weiter verfolgt.
- **Kerzenmuster (Engulfing, Hammer):** Hoch/Tief gibt es nur auf trendkanal-tage. Kein US-Beleg nach 2010 mit Gewinn gefunden; Duvinage et al.
  (2013) an Dow-30-Werten ohne Ertrag nach Kosten (aus Erinnerung, nicht nachgelesen). Nicht weiter verfolgt.

**Wogegen geprüft:** `register.json` (donchian20-ausbruch-long H5/H10/H20), `erledigt/donchian20-ausbruch-long`. Warteschlange:
donchian20-ausbruch-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, umkehr-nach-vorzeichenserie, vor-fomc-long.
Dazu `vorrat/` (nur LIESMICH), diese Datei bis zum Lauf vom 16.10., der Vorrat Nr. 1–17 samt „bewusst nicht aufgenommen“ und
`wiki/belegstand.md`. Der Zweig `origin/pruefstrasse-ergebnisse` fehlt.

**Was freischalten würde (unverändert):** Ex-Tage je Reihe (Vorrat Nr. 5), Form-4-Tafel (Nr. 7), Querschnitts-Adapter mit Tagesclusterung
(Nr. 9–12 und neu Akbas et al. 2022), Optionsumsatz je Reihe, Split-Ankündigungstage. Ohne eine dieser Erweiterungen ist an belegten,
auflösbaren Tagesregeln für die Panel-Sicht der vierte Lauf in Folge nichts zu finden. Ein Lauf je Nacht ist damit vorerst überflüssig, der
Engpass ist das Messgerät, nicht die Suche.

---

## 2026-10-19 · kein Kandidat — Vorrat leer, Monatsend-Umkehr (Graziani) und Reverse-Split verworfen

**Vorrat.** Kein Eintrag mit Urteil „einstellbar" und leerer Spalte „Stand". Nr. 1–4 sind erledigt, Nr. 5–7, 9–12 und 16–17 stehen auf „Form
fehlt" bzw. „zu klein". Nr. 8 (`fomc-gerade-wochen-long`, 18.10.) sowie Nr. 13–15 sind eingestellt. Die Spalte „Stand" bleibt deshalb
unverändert. Neu seit dem 14.10. ist der Bewertungsmodus `zeit` (Nr. 118). Deshalb habe ich gezielt eine Regel nachgeprüft, die ein
früherer Lauf nur wegen „Topf ≡ 0" zurückgestellt hatte (14.10., Graziani).

- **`monatsend-umkehr-long` — verworfen (Auflösung: MDE80 > 2 × Behauptung).** Quelle: Graziani, „Time Series Reversal: An End-of-the-Month
  Perspective", Arbeitspapier Bocconi, 02.11.2024 (früher „Time Series Reversal: A Payment Cycle Friction" und „Monthly Return
  Autocorrelation"), https://csef.it/wp-content/uploads/JMP_GG_02Nov2024.pdf. Den Volltext habe ich gelesen (abgerufen 2026-10-19).
  Regel: Der S&P 500 legt vom Schluss des 4. Freitags bis zum letzten Handelstag des Monats eine Rendite r(w=4) zurück. Ist sie negativ,
  wird der ganze Folgemonat long gehalten (Long-Bein TSR^L, Gl. (1)). Die Stichprobe reicht von 1975 bis 2019, ein Anhang verlängert sie bis
  2023. Zahlen aus Tab. 3: Das Long-Bein bringt 4,689 % p. a. Überschuss bei 44 % Aktivität. Das sind ≈ **+0,89 % je Signalmonat**, gegen
  ≈ −0,12 % in den übrigen Monaten (eigene Rechnung aus dem Mittel 0,326 %/Monat in Tab. 1). Die Spanne beträgt also ≈ **1,0 Pp je
  Monat** und liegt brutto über dem Dreifachen der Hürde. γ = −0,353 (t −3,78, Tab. 4).
  Zwei Warnungen aus der Quelle: Am Russell 2000 verschwindet der Effekt (Tab. 7: α 0,88 %, γ −0,19, R²OS −0,71). Und 2010–2019 schlägt
  TSR den Index nur in 3 von 10 Jahren (Tab. 5.A). Unser gleichgewichtetes Panel aus ≈ 800 Reihen liegt näher am Russell als am S&P 500.
  **Rechnung (Bewertung `zeit`, marktweit):** In 2016–2022 gibt es 84 Monate, davon ≈ 44 % Signalmonate, also ≈ **37 Cluster**. Das sind
  ≈ 800 Reihen je Signaltag und ≈ 30.000 Trades, aber die Auflösung hängt an den 37 Monaten. Die Monatsstreuung des gleichgewichteten
  liquiden Markts liegt bei ≈ 5 Pp (S&P 4,27 % laut Tab. 1). Daraus folgt se ≈ 5 × √(1/37 + 1/47) ≈ 1,1 Pp und **MDE80 ≈ 2,3–3,1 Pp (H20)**
  gegen eine Behauptung von ≈ 1,0 Pp. Damit ist weder Größe ≥ MDE80 noch MDE80 ≤ 2 × Behauptung erfüllt. Zudem überschneidet sich das
  Signalfenster mit `monatswende-long` (Tage −1…+3). Wiedervorlage nur mit Daten vor 2016, also mit mehr Monaten.
- **Reverse-Split, Drift nach dem Ex-Tag (über `roh/c` sichtbar) — verworfen (kein Beleg nach 2010).** Ich habe keinen US-Nachbau nach 2010
  mit Zahl gefunden, nur Brasilien 1987–2016 und Indonesien 2018–2019 (Suche 2026-10-19). Reverse-Splits sind in den Klassen 1–3 zudem selten
  (geschätzt < 200 Ereignisse in der Entdeckung).
- **Wochentag im Querschnitt (Birru, „Day of the week and the cross-section of returns", *JFE* 130(1) (2018) 182–214,
  https://ideas.repec.org/a/eee/jfinec/v130y2018i1p182-214.html) — nicht weiter verfolgt.** Das Signal braucht Anomalie-Merkmale
  (spekulative Werte), die die Sicht nicht hat. Die Größe je Tag (H1) liegt nach dem Abstract nicht beim Dreifachen der Hürde.

**Wogegen geprüft:** `register.json` (donchian20-ausbruch-long H5/H10/H20), `erledigt/donchian20-ausbruch-long`. Warteschlange:
donchian20-ausbruch-long, fomc-gerade-wochen-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long,
umkehr-nach-vorzeichenserie, vor-fomc-long. Dazu `vorrat/` (nur LIESMICH), diese Datei bis zum Lauf vom 17.10., der Vorrat Nr. 1–17 samt
„bewusst nicht aufgenommen" und `wiki/belegstand.md`. Der Zweig `origin/pruefstrasse-ergebnisse` fehlt.

**Was freischalten würde (unverändert):** Ex-Tage je Reihe (Vorrat Nr. 5), Form-4-Tafel (Nr. 7), Querschnitts-Adapter mit Tagesclusterung
(Nr. 9–12), Optionsumsatz je Reihe, Split-Ankündigungstage. Für Monatsregeln im Modus `zeit` kommen **Tagesdaten vor 2016** hinzu, denn mit
84 Monaten löst `zeit` nur Effekte ab ≈ 2–3 Pp je Monat auf.
